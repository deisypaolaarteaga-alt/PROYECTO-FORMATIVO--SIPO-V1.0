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

const MF  = '"$"#,##0';
const PCT = '0.0%';

const BRD = {
  top:    { style: 'thin', color: { rgb: 'FFD0D4DB' } },
  bottom: { style: 'thin', color: { rgb: 'FFD0D4DB' } },
  left:   { style: 'thin', color: { rgb: 'FFD0D4DB' } },
  right:  { style: 'thin', color: { rgb: 'FFD0D4DB' } },
};

const ST: Record<string, CS> = {
  // Fila de título hoja — fondo naranja, texto blanco bold
  title:      { fill: { patternType: 'solid', fgColor: { rgb: 'FFE8571A' } }, font: { bold: true,        color: { rgb: 'FFFFFFFF' }, name: 'Calibri' }, border: BRD },
  // Nombre empresa — texto naranja bold 16px sobre fondo blanco
  empresa:    { fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFFFF' } }, font: { bold: true, sz: 16, color: { rgb: 'FFE8571A' }, name: 'Calibri' }, border: BRD },
  // Encabezado de columnas oscuro — Hoja Presupuesto
  headerDark: { fill: { patternType: 'solid', fgColor: { rgb: 'FF1A1A1A' } }, font: { bold: true,        color: { rgb: 'FFFFFFFF' }, name: 'Calibri' }, border: BRD },
  // Encabezado de sección claro — Resumen / APUs / Insumos
  header:     { fill: { patternType: 'solid', fgColor: { rgb: 'FFE4E7EC' } }, font: { bold: true,        color: { rgb: 'FF1F2937' }, name: 'Calibri' }, border: BRD },
  // Fila de capítulo — beige claro, texto naranja bold
  chapter:    { fill: { patternType: 'solid', fgColor: { rgb: 'FFF4F2EE' } }, font: { bold: true,        color: { rgb: 'FFE8571A' }, name: 'Calibri' }, border: BRD },
  // Filas alternadas
  alt:        { fill: { patternType: 'solid', fgColor: { rgb: 'FFF8F7F5' } }, font: {                                                name: 'Calibri' }, border: BRD },
  white:      { fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFFFF' } }, font: {                                                name: 'Calibri' }, border: BRD },
  // Total — fondo naranja, texto blanco bold
  total:      { fill: { patternType: 'solid', fgColor: { rgb: 'FFE8571A' } }, font: { bold: true,        color: { rgb: 'FFFFFFFF' }, name: 'Calibri' }, border: BRD },
  // Etiqueta en col 0 — bold, fondo blanco
  label:      { fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFFFF' } }, font: { bold: true,                                   name: 'Calibri' }, border: BRD },
  // Valor en col 1 — alineado a la derecha, fondo blanco
  value:      { fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFFFF' } }, font: {                                                name: 'Calibri' }, alignment: { horizontal: 'right' }, border: BRD },
};

function setStyle(ws: XLSX.WorkSheet, r: number, c: number, style: CS, numFmt?: string) {
  const addr = XLSX.utils.encode_cell({ r, c });
  if (!ws[addr]) ws[addr] = { t: 'z', v: '' } as any;
  const s: CS = { ...style };
  if (numFmt) s.numFmt = numFmt;
  (ws[addr] as any).s = s;
}

function styleRow(
  ws: XLSX.WorkSheet, r: number, n: number, style: CS,
  moneyCols: number[] = [], pctCols: number[] = []
) {
  for (let c = 0; c < n; c++) {
    const nf = moneyCols.includes(c) ? MF : pctCols.includes(c) ? PCT : undefined;
    setStyle(ws, r, c, style, nf);
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

  const TIPO_OBRA_LABEL: Record<string, string> = {
    residencial: 'Residencial', comercial: 'Comercial', infraestructura: 'Infraestructura',
    hotelero: 'Hotelero', industrial: 'Industrial', institucional: 'Institucional', otro: 'Otro',
  };
  const tipoObraExcel = (budget.projects as any)?.tipo_obra
    ? (TIPO_OBRA_LABEL[(budget.projects as any).tipo_obra] ?? (budget.projects as any).tipo_obra)
    : '';
  const areaM2Excel = (budget.projects as any)?.area_m2 as number | null | undefined;

  const fmtFecha = (d: Date) =>
    new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Bogota' }).format(d);

  const fechaElaboracionExcel = budget.created_at
    ? fmtFecha(new Date(budget.created_at))
    : fmtFecha(new Date());

  const vigDias = Number(budget.vigencia_dias || 0);
  const fechaVigenciaExcel = vigDias > 0 && budget.created_at
    ? (() => { const d = new Date(budget.created_at); d.setDate(d.getDate() + vigDias); return fmtFecha(d); })()
    : 'No especificada';

  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Resumen ───────────────────────────────────────────────────────
  if (options.incluirResumen) {
    type RStyle = 'empresa' | 'title' | 'empty' | 'header' | 'info' | 'money' | 'total';
    type Meta   = { row: Row; style: RStyle };
    const meta: Meta[] = [];
    const R = (row: Row, style: RStyle) => meta.push({ row, style });

    // Encabezado de empresa — bold 16px naranja sobre blanco
    R(pad([profile.empresa || profile.nombre_completo || 'PRESUPUESTO DE OBRA'], 2), 'empresa');
    R(pad([`PRESUPUESTO DE OBRA — ${(budget.titulo || '').toUpperCase()}`], 2), 'title');
    R([], 'empty');
    R(['Proyecto',           budget.projects?.nombre   || ''], 'info');
    R(['Ubicación',          budget.projects?.ubicacion || ''], 'info');
    R(['Elaborado por',      profile.nombre_completo    || ''], 'info');
    R(['Empresa',            profile.empresa            || ''], 'info');
    R(['Tipo de obra',       tipoObraExcel],                    'info');
    if (areaM2Excel) R(['Área', `${areaM2Excel} m²`],          'info');
    R(['Fecha elaboración',  fechaElaboracionExcel],            'info');
    R(['Vigente hasta',      fechaVigenciaExcel],               'info');
    R([], 'empty');
    R(['CONCEPTO', 'VALOR (COP)'],                              'header');
    R(['Costo Directo',                    fmt(costoDirecto)],  'money');
    R([`Administración (${adminPct}%)`,    fmt(aiuAdmin)],      'money');
    R([`Imprevistos (${imprevPct}%)`,      fmt(aiuImprevistos)],'money');
    R([`Utilidad (${utilPct}%)`,           fmt(aiuUtilidad)],   'money');
    R(['AIU Total',                        fmt(aiuTotal)],      'money');
    R(['Subtotal (CD + AIU)',              fmt(subtotal)],      'money');
    R([ivaLabel,                           fmt(iva)],           'money');
    R(['TOTAL OFERTA',                     fmt(totalOferta)],   'total');
    R([], 'empty');
    R(['RETENCIONES INFORMATIVAS', ''],                         'header');
    R([`ReteFuente (${reteFuentePct}%)`,   fmt(reteFuente)],    'money');
    R([`ReteICA (${icaPct.toFixed(3)}%)`,  fmt(reteIca)],       'money');
    if (reteivaPct > 0 && iva.greaterThan(0)) {
      R([`ReteIVA (${reteivaPct}% del IVA)`, fmt(reteIva)],    'money');
    }
    R(['Valor Neto a Girar (Informativo)', fmt(valorNeto)],     'total');

    const ws = XLSX.utils.aoa_to_sheet(meta.map(m => m.row));
    ws['!cols']   = [{ wch: 42 }, { wch: 22 }];
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    ];

    meta.forEach(({ style }, r) => {
      switch (style) {
        case 'empty':   break;
        case 'empresa': styleRow(ws, r, 2, ST.empresa);    break;
        case 'title':   styleRow(ws, r, 2, ST.title);      break;
        case 'header':  styleRow(ws, r, 2, ST.header);     break;
        case 'info':
          setStyle(ws, r, 0, ST.label);
          setStyle(ws, r, 1, ST.value);
          break;
        case 'money':
          setStyle(ws, r, 0, ST.label);
          setStyle(ws, r, 1, ST.value, MF);
          break;
        case 'total': styleRow(ws, r, 2, ST.total, [1]);   break;
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
  }

  // ── Hoja 2: Presupuesto ───────────────────────────────────────────────────
  if (options.incluirPresupuesto) {
    const N = 7;
    type Meta = { row: Row; style: 'title' | 'headerDark' | 'chapter' | 'act-even' | 'act-odd' | 'empty' };
    const meta: Meta[] = [];
    const R = (row: Row, style: Meta['style']) => meta.push({ row, style });

    R(pad([`PRESUPUESTO — ${(budget.titulo || '').toUpperCase()}`], N), 'title');
    R(['N°', 'Descripción', 'Unidad', 'Cantidad', 'Precio Unit. (COP)', 'Total (COP)', '% C.D.'], 'headerDark');

    let actIdx = 0;
    sortedChapters.forEach(ch => {
      const sortedActs = (ch.activities || [])
        .slice()
        .sort((a, b) => (Number((a as any).orden) || 0) - (Number((b as any).orden) || 0));

      let chTotal = new Decimal(0);
      sortedActs.forEach((act, j) => {
        const vrTotal = D(act.cantidad).times(D(act.precio_unitario));
        chTotal = chTotal.plus(vrTotal);
        // Guardar como decimal (0.xxxx) para que el formato 0.0% multiplique ×100
        const pct = costoDirecto.greaterThan(0)
          ? vrTotal.dividedBy(costoDirecto).toDecimalPlaces(4).toNumber()
          : 0;
        R(
          [`${ch.numero}.${j + 1}`, act.nombre, act.unidad,
           D(act.cantidad).toNumber(), D(act.precio_unitario).toNumber(), fmt(vrTotal), pct],
          actIdx++ % 2 === 0 ? 'act-even' : 'act-odd'
        );
      });

      const pctCap = costoDirecto.greaterThan(0)
        ? chTotal.dividedBy(costoDirecto).toDecimalPlaces(4).toNumber()
        : 0;
      R(pad([`SUBTOTAL CAP. ${ch.numero} — ${ch.nombre}`, '', '', '', '', fmt(chTotal), pctCap], N), 'chapter');
      R([], 'empty');
    });

    const ws = XLSX.utils.aoa_to_sheet(meta.map(m => m.row));
    // descripción 40, unidad 8, cantidad 10, precio 15, total 15, %CD 8
    ws['!cols']   = [6, 40, 8, 10, 15, 15, 8].map(wch => ({ wch }));
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: N - 1 } }];

    meta.forEach(({ style }, r) => {
      if (style === 'empty')      return;
      if (style === 'title')      { styleRow(ws, r, N, ST.title);                    return; }
      if (style === 'headerDark') { styleRow(ws, r, N, ST.headerDark);               return; }
      if (style === 'chapter')    { styleRow(ws, r, N, ST.chapter,  [5],    [6]);    return; }
      if (style === 'act-even')   { styleRow(ws, r, N, ST.white,    [4, 5], [6]);    return; }
      if (style === 'act-odd')    { styleRow(ws, r, N, ST.alt,      [4, 5], [6]);    return; }
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
      if (style === 'title')    { styleRow(ws, r, N, ST.title);          return; }
      if (style === 'header')   { styleRow(ws, r, N, ST.header);         return; }
      if (style === 'act-even') { styleRow(ws, r, N, ST.white, [5, 6]);  return; }
      if (style === 'act-odd')  { styleRow(ws, r, N, ST.alt,   [5, 6]);  return; }
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
          const cantItems     = D(item.cantidad).times(actCant);
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
      if (style === 'title')    { styleRow(ws, r, N, ST.title);          return; }
      if (style === 'header')   { styleRow(ws, r, N, ST.header);         return; }
      if (style === 'act-even') { styleRow(ws, r, N, ST.white, [4, 5]);  return; }
      if (style === 'act-odd')  { styleRow(ws, r, N, ST.alt,   [4, 5]);  return; }
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
