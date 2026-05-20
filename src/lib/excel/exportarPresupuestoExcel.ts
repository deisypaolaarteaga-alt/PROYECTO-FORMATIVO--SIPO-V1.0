import * as XLSX from 'xlsx';
import Decimal from 'decimal.js';
import type { PresupuestoPDFData, ConfigPDFProfesional } from '@/types/pdf';

const D = (v: number | string | null | undefined) => new Decimal(Number(v) || 0);
const fmt = (d: Decimal) => d.toDecimalPlaces(0).toNumber();

const TIPO_LABEL: Record<string, string> = {
  material:          'Material',
  mano_obra:         'Mano de Obra',
  equipo:            'Equipo',
  herramienta_menor: 'H. Menor',
  epp:               'EPP',
};

export interface ExportarExcelOptions {
  incluirResumen:     boolean;
  incluirPresupuesto: boolean;
  incluirAPUs:        boolean;
  incluirInsumos:     boolean;
}

// ── Helpers de estilo ─────────────────────────────────────────────────────────
type CellVal = string | number | null | undefined;
type Row     = CellVal[];
type CS      = Record<string, unknown>;

const MF = '"$"#,##0';

const ST: Record<string, CS> = {
  title:   { fill: { patternType: 'solid', fgColor: { rgb: 'FFD95510' } }, font: { bold: true,  color: { rgb: 'FFFFFFFF' }, name: 'Calibri' } },
  header:  { fill: { patternType: 'solid', fgColor: { rgb: 'FFE4E7EC' } }, font: { bold: true,  color: { rgb: 'FF1F2937' }, name: 'Calibri' } },
  chapter: { fill: { patternType: 'solid', fgColor: { rgb: 'FF1F2937' } }, font: { bold: true,  color: { rgb: 'FFFFFFFF' }, name: 'Calibri' } },
  alt:     { fill: { patternType: 'solid', fgColor: { rgb: 'FFFAE8E0' } }, font: { name: 'Calibri' } },
  white:   { fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFFFF' } }, font: { name: 'Calibri' } },
  total:   { fill: { patternType: 'solid', fgColor: { rgb: 'FFD95510' } }, font: { bold: true,  color: { rgb: 'FFFFFFFF' }, name: 'Calibri' } },
};

function setStyle(ws: XLSX.WorkSheet, r: number, c: number, style: CS, numFmt?: string) {
  const addr = XLSX.utils.encode_cell({ r, c });
  if (!ws[addr]) ws[addr] = { t: 'z', v: '' } as any;
  const s: CS = { ...style };
  if (numFmt) s.numFmt = numFmt;
  (ws[addr] as any).s = s;
}

function styleRow(ws: XLSX.WorkSheet, r: number, n: number, style: CS, moneyCols: number[] = []) {
  for (let c = 0; c < n; c++) {
    setStyle(ws, r, c, style, moneyCols.includes(c) ? MF : undefined);
  }
}

function pad(arr: Row, len: number): Row {
  const out = [...arr];
  while (out.length < len) out.push('');
  return out;
}

export function exportarPresupuestoExcel(
  budget:  PresupuestoPDFData,
  profile: ConfigPDFProfesional,
  options: ExportarExcelOptions = {
    incluirResumen: true, incluirPresupuesto: true, incluirAPUs: true, incluirInsumos: true,
  }
) {
  // ── Cálculos ──────────────────────────────────────────────────────────────
  const sortedChapters = (budget.chapters || [])
    .slice()
    .sort((a, b) =>
      (Number((a as any).orden) || Number(a.numero) || 0) -
      (Number((b as any).orden) || Number(b.numero) || 0)
    );

  const costoDirecto = sortedChapters.reduce(
    (sum, ch) =>
      sum.plus(
        (ch.activities || []).reduce(
          (s, a) => s.plus(D(a.cantidad).times(D(a.precio_unitario))),
          new Decimal(0)
        )
      ),
    new Decimal(0)
  );

  const adminPct  = Number(budget.administracion_pct) || 0;
  const imprevPct = Number(budget.imprevistos_pct)    || 0;
  const utilPct   = Number(budget.utilidad_pct)       || 0;
  const ivaPct    = budget.iva_porcentaje != null ? Number(budget.iva_porcentaje) : 0;

  const aiuAdmin       = costoDirecto.times(adminPct).dividedBy(100);
  const aiuImprevistos = costoDirecto.times(imprevPct).dividedBy(100);
  const aiuUtilidad    = costoDirecto.times(utilPct).dividedBy(100);
  const aiuTotal       = aiuAdmin.plus(aiuImprevistos).plus(aiuUtilidad);
  const subtotal       = costoDirecto.plus(aiuTotal);

  let iva = new Decimal(0);
  switch (budget.metodo_iva) {
    case 'sobre_utilidad': iva = aiuUtilidad.times(ivaPct).dividedBy(100); break;
    case 'sobre_aiu':      iva = aiuTotal.times(ivaPct).dividedBy(100);    break;
    case 'sobre_total':    iva = subtotal.times(ivaPct).dividedBy(100);    break;
  }

  const totalOferta   = subtotal.plus(iva);
  const reteFuentePct = budget.retefuente_pct != null ? Number(budget.retefuente_pct) : 2;
  const icaPct        = budget.ica_pct        != null ? Number(budget.ica_pct)        : 0.414;
  const reteivaPct    = budget.reteiva_pct    != null ? Number(budget.reteiva_pct)    : 0;
  const reteFuente    = subtotal.times(reteFuentePct).dividedBy(100);
  const reteIca       = subtotal.times(icaPct).dividedBy(100);
  const reteIva       = iva.times(reteivaPct).dividedBy(100);
  const valorNeto     = totalOferta.minus(reteFuente).minus(reteIca).minus(reteIva);

  const ivaLabel = budget.metodo_iva === 'no_aplica' || !budget.metodo_iva
    ? 'IVA (No aplica)'
    : `IVA (${ivaPct}% ${
        budget.metodo_iva === 'sobre_utilidad' ? 's/Utilidad' :
        budget.metodo_iva === 'sobre_aiu'      ? 's/AIU'      :
        budget.metodo_iva === 'sobre_total'    ? 's/Total'    : ''
      })`;

  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Resumen ───────────────────────────────────────────────────────
  if (options.incluirResumen) {
    type Meta = { row: Row; style: keyof typeof ST | 'empty' };
    const meta: Meta[] = [];
    const R = (row: Row, style: Meta['style']) => meta.push({ row, style });

    R(pad([`PRESUPUESTO DE OBRA — ${(budget.titulo || '').toUpperCase()}`], 2), 'title');
    R([], 'empty');
    R(['Proyecto',      budget.projects?.nombre   || ''], 'white');
    R(['Ubicación',     budget.projects?.ubicacion || ''], 'white');
    R(['Elaborado por', profile.nombre_completo    || ''], 'white');
    R(['Empresa',       profile.empresa            || ''], 'white');
    R(['Fecha',         new Date().toLocaleDateString('es-CO')], 'white');
    R([], 'empty');
    R(['CONCEPTO', 'VALOR (COP)'], 'header');
    R(['Costo Directo',                    fmt(costoDirecto)],    'white');
    R([`Administración (${adminPct}%)`,    fmt(aiuAdmin)],        'white');
    R([`Imprevistos (${imprevPct}%)`,      fmt(aiuImprevistos)],  'white');
    R([`Utilidad (${utilPct}%)`,           fmt(aiuUtilidad)],     'white');
    R(['AIU Total',                        fmt(aiuTotal)],        'white');
    R(['Subtotal (CD + AIU)',              fmt(subtotal)],        'white');
    R([ivaLabel,                           fmt(iva)],             'white');
    R(['TOTAL OFERTA',                     fmt(totalOferta)],     'total');
    R([], 'empty');
    R(['RETENCIONES INFORMATIVAS', ''],                           'header');
    R([`ReteFuente (${reteFuentePct}%)`,   fmt(reteFuente)],      'white');
    R([`ReteICA (${icaPct.toFixed(3)}%)`,  fmt(reteIca)],         'white');
    if (reteivaPct > 0 && iva.greaterThan(0)) {
      R([`ReteIVA (${reteivaPct}% del IVA)`, fmt(reteIva)],      'white');
    }
    R(['Valor Neto a Girar (Informativo)', fmt(valorNeto)],       'total');

    const ws = XLSX.utils.aoa_to_sheet(meta.map(m => m.row));
    ws['!cols']   = [{ wch: 42 }, { wch: 22 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

    meta.forEach(({ style }, r) => {
      if (style === 'empty') return;
      const isMoney = style !== 'title' && style !== 'header';
      styleRow(ws, r, 2, ST[style], isMoney ? [1] : []);
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
  }

  // ── Hoja 2: Presupuesto ───────────────────────────────────────────────────
  if (options.incluirPresupuesto) {
    const N = 7;
    type Meta = { row: Row; style: keyof typeof ST | 'empty' | 'act-even' | 'act-odd' };
    const meta: Meta[] = [];
    const R = (row: Row, style: Meta['style']) => meta.push({ row, style });

    R(pad([`PRESUPUESTO — ${(budget.titulo || '').toUpperCase()}`], N), 'title');
    R(['N°', 'Descripción', 'Unidad', 'Cantidad', 'Precio Unit. (COP)', 'Total (COP)', '% C.D.'], 'header');

    let actIdx = 0;
    sortedChapters.forEach(ch => {
      const sortedActs = (ch.activities || [])
        .slice()
        .sort((a, b) => (Number((a as any).orden) || 0) - (Number((b as any).orden) || 0));

      let chTotal = new Decimal(0);
      sortedActs.forEach((act, j) => {
        const vrTotal = D(act.cantidad).times(D(act.precio_unitario));
        chTotal = chTotal.plus(vrTotal);
        const pct = costoDirecto.greaterThan(0)
          ? vrTotal.dividedBy(costoDirecto).times(100).toDecimalPlaces(2).toNumber()
          : 0;
        R(
          [`${ch.numero}.${j + 1}`, act.nombre, act.unidad,
           D(act.cantidad).toNumber(), D(act.precio_unitario).toNumber(), fmt(vrTotal), pct],
          actIdx++ % 2 === 0 ? 'act-even' : 'act-odd'
        );
      });

      const pctCap = costoDirecto.greaterThan(0)
        ? chTotal.dividedBy(costoDirecto).times(100).toDecimalPlaces(1).toNumber()
        : 0;
      R(pad([`SUBTOTAL CAP. ${ch.numero} — ${ch.nombre}`, '', '', '', '', fmt(chTotal), pctCap], N), 'chapter');
      R([], 'empty');
    });

    const ws = XLSX.utils.aoa_to_sheet(meta.map(m => m.row));
    ws['!cols']   = [6, 45, 8, 10, 16, 16, 8].map(wch => ({ wch }));
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: N - 1 } }];

    meta.forEach(({ style }, r) => {
      if (style === 'empty') return;
      if (style === 'title')    { styleRow(ws, r, N, ST.title);            return; }
      if (style === 'header')   { styleRow(ws, r, N, ST.header);           return; }
      if (style === 'chapter')  { styleRow(ws, r, N, ST.chapter, [5]);     return; }
      if (style === 'act-even') { styleRow(ws, r, N, ST.white,   [4, 5]);  return; }
      if (style === 'act-odd')  { styleRow(ws, r, N, ST.alt,     [4, 5]);  return; }
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Presupuesto');
  }

  // ── Hoja 3: APUs ──────────────────────────────────────────────────────────
  if (options.incluirAPUs) {
    const N = 7;
    type Meta = { row: Row; style: 'title' | 'header' | 'act-even' | 'act-odd' | 'empty' };
    const meta: Meta[] = [];
    const R = (row: Row, style: Meta['style']) => meta.push({ row, style });

    R(pad(['ANÁLISIS DE PRECIOS UNITARIOS (APU)'], N), 'title');
    R(['Actividad', 'Tipo', 'Insumo', 'Unidad', 'Cantidad', 'Precio Unit. (COP)', 'Subtotal (COP)'], 'header');

    sortedChapters.forEach(ch => {
      (ch.activities || []).forEach(act => {
        const apus  = (act as any).apus || [];
        const items: any[] = apus.length > 0 ? (apus[0].apu_items || []) : [];
        if (items.length === 0) return;

        items.forEach((item, idx) => {
          const sub = D(item.cantidad).times(D(item.precio_unitario));
          R(
            [act.nombre, TIPO_LABEL[item.tipo] || item.tipo, item.nombre,
             item.unidad, D(item.cantidad).toNumber(), D(item.precio_unitario).toNumber(),
             sub.toDecimalPlaces(2).toNumber()],
            idx % 2 === 0 ? 'act-even' : 'act-odd'
          );
        });
        R([], 'empty');
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(meta.map(m => m.row));
    ws['!cols']   = [{ wch: 30 }, { wch: 14 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 18 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: N - 1 } }];

    meta.forEach(({ style }, r) => {
      if (style === 'empty')    return;
      if (style === 'title')    { styleRow(ws, r, N, ST.title);           return; }
      if (style === 'header')   { styleRow(ws, r, N, ST.header);          return; }
      if (style === 'act-even') { styleRow(ws, r, N, ST.white, [5, 6]);   return; }
      if (style === 'act-odd')  { styleRow(ws, r, N, ST.alt,   [5, 6]);   return; }
    });

    XLSX.utils.book_append_sheet(wb, ws, 'APUs');
  }

  // ── Hoja 4: Insumos (explosión consolidada) ───────────────────────────────
  if (options.incluirInsumos) {
    const N = 6;
    const insumosMap = new Map<string, {
      nombre: string; tipo: string; unidad: string;
      cantidadTotal: Decimal; precio: number; subtotalTotal: Decimal;
    }>();

    sortedChapters.forEach(ch => {
      (ch.activities || []).forEach(act => {
        const actCant = D(act.cantidad);
        const apus    = (act as any).apus || [];
        const items: any[] = apus.length > 0 ? (apus[0].apu_items || []) : [];
        items.forEach(item => {
          const key = `${item.tipo}||${item.nombre}||${item.unidad}||${item.precio_unitario}`;
          const existing = insumosMap.get(key);
          const cantItems    = D(item.cantidad).times(actCant);
          const subtotalItems = D(item.cantidad).times(D(item.precio_unitario)).times(actCant);
          if (existing) {
            existing.cantidadTotal = existing.cantidadTotal.plus(cantItems);
            existing.subtotalTotal = existing.subtotalTotal.plus(subtotalItems);
          } else {
            insumosMap.set(key, {
              nombre: item.nombre,
              tipo:   TIPO_LABEL[item.tipo] || item.tipo,
              unidad: item.unidad,
              cantidadTotal:  cantItems,
              precio:         Number(item.precio_unitario) || 0,
              subtotalTotal:  subtotalItems,
            });
          }
        });
      });
    });

    type Meta = { row: Row; style: 'title' | 'header' | 'act-even' | 'act-odd' };
    const meta: Meta[] = [];
    const R = (row: Row, style: Meta['style']) => meta.push({ row, style });

    R(pad(['EXPLOSIÓN DE INSUMOS'], N), 'title');
    R(['Tipo', 'Nombre', 'Unidad', 'Cantidad Total', 'Precio Unit. (COP)', 'Subtotal Total (COP)'], 'header');

    Array.from(insumosMap.values())
      .sort((a, b) => a.tipo.localeCompare(b.tipo) || a.nombre.localeCompare(b.nombre))
      .forEach((ins, idx) => {
        R(
          [ins.tipo, ins.nombre, ins.unidad,
           ins.cantidadTotal.toDecimalPlaces(3).toNumber(), ins.precio, fmt(ins.subtotalTotal)],
          idx % 2 === 0 ? 'act-even' : 'act-odd'
        );
      });

    const ws = XLSX.utils.aoa_to_sheet(meta.map(m => m.row));
    ws['!cols']   = [{ wch: 14 }, { wch: 40 }, { wch: 10 }, { wch: 16 }, { wch: 20 }, { wch: 22 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: N - 1 } }];

    meta.forEach(({ style }, r) => {
      if (style === 'title')    { styleRow(ws, r, N, ST.title);           return; }
      if (style === 'header')   { styleRow(ws, r, N, ST.header);          return; }
      if (style === 'act-even') { styleRow(ws, r, N, ST.white, [4, 5]);   return; }
      if (style === 'act-odd')  { styleRow(ws, r, N, ST.alt,   [4, 5]);   return; }
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Insumos');
  }

  // ── Descargar ─────────────────────────────────────────────────────────────
  if (wb.SheetNames.length === 0) {
    throw new Error('Debe seleccionar al menos una hoja para exportar.');
  }
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = `SIPO-${budget.projects?.nombre || 'Presupuesto'}-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
