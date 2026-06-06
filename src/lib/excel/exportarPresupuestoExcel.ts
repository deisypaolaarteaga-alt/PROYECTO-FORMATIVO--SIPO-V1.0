import { Workbook } from 'exceljs';
import type { Cell, Row, Borders, Alignment } from 'exceljs';
import Decimal from 'decimal.js';
import type { PresupuestoPDFData, ConfigPDFProfesional } from '@/types/pdf';
import type { AIUComponente } from '@/types';

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
  incluirResumen:      boolean;
  incluirPresupuesto:  boolean;
  incluirAPUs:         boolean;
  incluirInsumos:      boolean;
  incluirProgramaObra: boolean;
}

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  orange:     'FFE8571A',
  darkHdr:    'FF1F2937',
  chapterBg:  'FFF3F4F6',
  white:      'FFFFFFFF',
  black:      'FF000000',
  amberBg:    'FFFEF3C7',
  amberText:  'FF92400E',
  altRow:     'FFF8F7F5',
  border:     'FFD0D4DB',
  aiuItemBg:  'FFF9FAFB',
  aiuItemFg:  'FF6B7280',
} as const;

const MF  = '"$"#,##0';
const PCT = '0.0%';

// ── Helpers de estilo ─────────────────────────────────────────────────────────
type HAlign = Alignment['horizontal'];

interface CS {
  bg?:    string;   // ARGB
  fg?:    string;   // ARGB
  bold?:  boolean;
  sz?:    number;
  nf?:    string;   // numFmt
  align?: HAlign;
  bdr?:   boolean;
}

function sc(cell: Cell, s: CS): void {
  if (s.bg) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: s.bg } };
  }
  cell.font = {
    name:  'Calibri',
    size:  s.sz ?? 11,
    bold:  s.bold ?? false,
    color: { argb: s.fg ?? C.black },
  };
  if (s.nf) cell.numFmt = s.nf;
  cell.alignment = { horizontal: s.align ?? 'left', vertical: 'middle' };
  if (s.bdr) {
    const t = { style: 'thin' as const, color: { argb: C.border } };
    cell.border = { top: t, bottom: t, left: t, right: t } as Partial<Borders>;
  }
}

function sr(row: Row, n: number, base: CS, over?: Record<number, Partial<CS>>): void {
  for (let c = 1; c <= n; c++) {
    sc(row.getCell(c), over?.[c] ? { ...base, ...over[c] } : base);
  }
}

export async function exportarPresupuestoExcel(
  budget:          PresupuestoPDFData,
  profile:         ConfigPDFProfesional,
  options:         ExportarExcelOptions = {
    incluirResumen: true, incluirPresupuesto: true, incluirAPUs: true, incluirInsumos: true, incluirProgramaObra: true,
  },
  aiuComponentes?: AIUComponente[]
): Promise<void> {
  // ── Cálculos ────────────────────────────────────────────────────────────────
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

  // ── Workbook ─────────────────────────────────────────────────────────────────
  const wb = new Workbook();
  wb.creator = profile.empresa || profile.nombre_completo || 'SIPO';
  wb.created = new Date();

  // ── Hoja 1: Resumen ───────────────────────────────────────────────────────────
  if (options.incluirResumen) {
    const ws = wb.addWorksheet('Resumen');
    ws.columns = [{ width: 42 }, { width: 22 }];

    // Empresa — blanco, naranja bold 14px
    const rEmp = ws.addRow([profile.empresa || profile.nombre_completo || 'PRESUPUESTO DE OBRA', null]);
    ws.mergeCells(rEmp.number, 1, rEmp.number, 2);
    rEmp.height = 26;
    sr(rEmp, 2, { bg: C.white, fg: C.orange, bold: true, sz: 14 });

    // Título — fondo naranja, texto blanco bold
    const rTit = ws.addRow([`PRESUPUESTO DE OBRA — ${(budget.titulo || '').toUpperCase()}`, null]);
    ws.mergeCells(rTit.number, 1, rTit.number, 2);
    rTit.height = 20;
    sr(rTit, 2, { bg: C.orange, fg: C.white, bold: true });

    ws.addRow([]);

    // Filas informativas
    const infoItems: [string, string][] = [
      ['Proyecto',          budget.projects?.nombre    || ''],
      ['Ubicación',         budget.projects?.ubicacion || ''],
      ['Elaborado por',     profile.nombre_completo    || ''],
      ['Empresa',           profile.empresa            || ''],
      ['Tipo de obra',      tipoObraExcel],
    ];
    if (areaM2Excel) infoItems.push(['Área', `${areaM2Excel} m²`]);
    infoItems.push(
      ['Fecha elaboración', fechaElaboracionExcel],
      ['Vigente hasta',     fechaVigenciaExcel],
    );
    for (const [lbl, val] of infoItems) {
      const r = ws.addRow([lbl, val]);
      sc(r.getCell(1), { bg: C.white, bold: true, bdr: true });
      sc(r.getCell(2), { bg: C.white, align: 'right', bdr: true });
    }

    ws.addRow([]);

    // Encabezado tabla resumen
    const rHdr = ws.addRow(['CONCEPTO', 'VALOR (COP)']);
    sr(rHdr, 2, { bg: C.darkHdr, fg: C.white, bold: true, bdr: true, align: 'center' });

    // Filas de valores COP — helper local
    const addResRow = (lbl: string, val: number) => {
      const r = ws.addRow([lbl, val]);
      sc(r.getCell(1), { bg: C.white, bold: true, bdr: true });
      sc(r.getCell(2), { bg: C.white, nf: MF, align: 'right', bdr: true });
    };

    addResRow('Costo Directo', fmt(costoDirecto));
    addResRow(`Administración (${adminPct}%)`, fmt(aiuAdmin));

    // Desglose AIU detallado — filas indentadas por ítem de gastos mensuales
    if (budget.metodo_aiu === 'detallado' && aiuComponentes?.length) {
      const durMeses = Number(budget.duracion_meses) || 0;
      for (const comp of aiuComponentes) {
        const totalComp = D(comp.valor_mensual).times(durMeses);
        const r = ws.addRow([`    ${comp.nombre}`, fmt(totalComp)]);
        sc(r.getCell(1), { bg: C.aiuItemBg, fg: C.aiuItemFg, bdr: true });
        sc(r.getCell(2), { bg: C.aiuItemBg, fg: C.aiuItemFg, nf: MF, align: 'right', bdr: true });
      }
    }

    addResRow(`Imprevistos (${imprevPct}%)`, fmt(aiuImprevistos));
    addResRow(`Utilidad (${utilPct}%)`, fmt(aiuUtilidad));
    addResRow('AIU Total', fmt(aiuTotal));
    addResRow('Subtotal (CD + AIU)', fmt(subtotal));
    addResRow(ivaLabel, fmt(iva));

    // TOTAL OFERTA — naranja, blanco, bold
    const rTot = ws.addRow(['TOTAL OFERTA', fmt(totalOferta)]);
    rTot.height = 18;
    sc(rTot.getCell(1), { bg: C.orange, fg: C.white, bold: true, bdr: true });
    sc(rTot.getCell(2), { bg: C.orange, fg: C.white, bold: true, nf: MF, align: 'right', bdr: true });

    ws.addRow([]);

    // Encabezado retenciones
    const rRHdr = ws.addRow(['RETENCIONES INFORMATIVAS', null]);
    ws.mergeCells(rRHdr.number, 1, rRHdr.number, 2);
    sr(rRHdr, 2, { bg: C.darkHdr, fg: C.white, bold: true, bdr: true, align: 'center' });

    // Filas de retención — ámbar
    const retItems: [string, number][] = [
      [`ReteFuente (${reteFuentePct}%)`,  fmt(reteFuente)],
      [`ReteICA (${icaPct.toFixed(3)}%)`, fmt(reteIca)   ],
    ];
    if (reteivaPct > 0 && iva.greaterThan(0)) {
      retItems.push([`ReteIVA (${reteivaPct}% del IVA)`, fmt(reteIva)]);
    }
    for (const [lbl, val] of retItems) {
      const r = ws.addRow([lbl, val]);
      sc(r.getCell(1), { bg: C.amberBg, fg: C.amberText, bdr: true });
      sc(r.getCell(2), { bg: C.amberBg, fg: C.amberText, nf: MF, align: 'right', bdr: true });
    }

    // Valor neto — naranja, blanco, bold
    const rNeto = ws.addRow(['Valor Neto a Girar (Informativo)', fmt(valorNeto)]);
    sc(rNeto.getCell(1), { bg: C.orange, fg: C.white, bold: true, bdr: true });
    sc(rNeto.getCell(2), { bg: C.orange, fg: C.white, bold: true, nf: MF, align: 'right', bdr: true });
  }

  // ── Hoja 2: Presupuesto ───────────────────────────────────────────────────────
  if (options.incluirPresupuesto) {
    const N = 7;
    const ws = wb.addWorksheet('Presupuesto');
    ws.columns = [
      { width: 6  },
      { width: 45 },
      { width: 10 },
      { width: 12 },
      { width: 18 },
      { width: 18 },
      { width: 8  },
    ];

    // Título
    const rTit = ws.addRow([`PRESUPUESTO — ${(budget.titulo || '').toUpperCase()}`, ...Array(N - 1).fill(null)]);
    ws.mergeCells(rTit.number, 1, rTit.number, N);
    rTit.height = 20;
    sc(rTit.getCell(1), { bg: C.orange, fg: C.white, bold: true });

    // Header tabla
    const rHdr = ws.addRow(['N°', 'Descripción', 'Unidad', 'Cantidad', 'Precio Unit. (COP)', 'Total (COP)', '% C.D.']);
    sr(rHdr, N, { bg: C.darkHdr, fg: C.white, bold: true, bdr: true, align: 'center' });

    let actIdx = 0;
    for (const ch of sortedChapters) {
      const sortedActs = (ch.activities || [])
        .slice()
        .sort((a, b) => (Number((a as any).orden) || 0) - (Number((b as any).orden) || 0));

      let chTotal = new Decimal(0);
      for (const [j, act] of sortedActs.entries()) {
        const vrTotal = D(act.cantidad).times(D(act.precio_unitario));
        chTotal = chTotal.plus(vrTotal);
        const pct = costoDirecto.greaterThan(0)
          ? vrTotal.dividedBy(costoDirecto).toDecimalPlaces(4).toNumber()
          : 0;

        const isAlt = actIdx++ % 2 !== 0;
        const r = ws.addRow([
          `${ch.numero}.${j + 1}`,
          act.nombre,
          act.unidad,
          D(act.cantidad).toNumber(),
          D(act.precio_unitario).toNumber(),
          fmt(vrTotal),
          pct,
        ]);
        sr(r, N, { bg: isAlt ? C.altRow : C.white, bdr: true }, {
          4: { align: 'right' },
          5: { nf: MF,  align: 'right' },
          6: { nf: MF,  align: 'right' },
          7: { nf: PCT, align: 'right' },
        });
      }

      const pctCap = costoDirecto.greaterThan(0)
        ? chTotal.dividedBy(costoDirecto).toDecimalPlaces(4).toNumber()
        : 0;

      // Fila de capítulo — gris claro, negrita
      const rCh = ws.addRow([
        `SUBTOTAL CAP. ${ch.numero} — ${ch.nombre}`,
        ...Array(4).fill(null),
        fmt(chTotal),
        pctCap,
      ]);
      rCh.height = 16;
      ws.mergeCells(rCh.number, 1, rCh.number, 5);
      sr(rCh, N, { bg: C.chapterBg, bold: true, bdr: true }, {
        6: { nf: MF,  align: 'right' },
        7: { nf: PCT, align: 'right' },
      });

      ws.addRow([]);
    }
  }

  // ── Hoja 3: APUs ─────────────────────────────────────────────────────────────
  if (options.incluirAPUs) {
    const N = 7;
    const ws = wb.addWorksheet('APUs');
    ws.columns = [
      { width: 30 },
      { width: 14 },
      { width: 30 },
      { width: 10 },
      { width: 10 },
      { width: 18 },
      { width: 18 },
    ];

    const rTit = ws.addRow(['ANÁLISIS DE PRECIOS UNITARIOS (APU)', ...Array(N - 1).fill(null)]);
    ws.mergeCells(rTit.number, 1, rTit.number, N);
    rTit.height = 20;
    sc(rTit.getCell(1), { bg: C.orange, fg: C.white, bold: true });

    const rHdr = ws.addRow(['Actividad', 'Tipo', 'Insumo', 'Unidad', 'Cantidad', 'Precio Unit. (COP)', 'Subtotal (COP)']);
    sr(rHdr, N, { bg: C.darkHdr, fg: C.white, bold: true, bdr: true, align: 'center' });

    let rowIdx = 0;
    for (const ch of sortedChapters) {
      for (const act of (ch.activities || [])) {
        const apus  = (act as any).apus || [];
        const items: any[] = apus.length > 0 ? (apus[0].apu_items || []) : [];
        if (items.length === 0) continue;

        for (const item of items) {
          const sub   = D(item.cantidad).times(D(item.precio_unitario));
          const isAlt = rowIdx++ % 2 !== 0;
          const r = ws.addRow([
            act.nombre,
            TIPO_LABEL[item.tipo] || item.tipo,
            item.nombre,
            item.unidad,
            D(item.cantidad).toNumber(),
            D(item.precio_unitario).toNumber(),
            sub.toDecimalPlaces(2).toNumber(),
          ]);
          sr(r, N, { bg: isAlt ? C.altRow : C.white, bdr: true }, {
            5: { align: 'right' },
            6: { nf: MF, align: 'right' },
            7: { nf: MF, align: 'right' },
          });
        }
        ws.addRow([]);
      }
    }
  }

  // ── Hoja 4: Insumos (explosión consolidada) ───────────────────────────────────
  if (options.incluirInsumos) {
    const N = 6;
    const insumosMap = new Map<string, {
      nombre: string; tipo: string; unidad: string;
      cantidadTotal: Decimal; precio: number; subtotalTotal: Decimal;
    }>();

    for (const ch of sortedChapters) {
      for (const act of (ch.activities || [])) {
        const actCant = D(act.cantidad);
        const apus    = (act as any).apus || [];
        const items: any[] = apus.length > 0 ? (apus[0].apu_items || []) : [];
        for (const item of items) {
          const key           = `${item.tipo}||${item.nombre}||${item.unidad}||${item.precio_unitario}`;
          const cantItems     = D(item.cantidad).times(actCant);
          const subtotalItems = D(item.cantidad).times(D(item.precio_unitario)).times(actCant);
          const existing      = insumosMap.get(key);
          if (existing) {
            existing.cantidadTotal = existing.cantidadTotal.plus(cantItems);
            existing.subtotalTotal = existing.subtotalTotal.plus(subtotalItems);
          } else {
            insumosMap.set(key, {
              nombre: item.nombre,
              tipo:   TIPO_LABEL[item.tipo] || item.tipo,
              unidad: item.unidad,
              cantidadTotal: cantItems,
              precio:        Number(item.precio_unitario) || 0,
              subtotalTotal: subtotalItems,
            });
          }
        }
      }
    }

    const ws = wb.addWorksheet('Insumos');
    ws.columns = [
      { width: 14 },
      { width: 40 },
      { width: 10 },
      { width: 16 },
      { width: 18 },
      { width: 18 },
    ];

    const rTit = ws.addRow(['EXPLOSIÓN DE INSUMOS', ...Array(N - 1).fill(null)]);
    ws.mergeCells(rTit.number, 1, rTit.number, N);
    rTit.height = 20;
    sc(rTit.getCell(1), { bg: C.orange, fg: C.white, bold: true });

    const rHdr = ws.addRow(['Tipo', 'Nombre', 'Unidad', 'Cantidad Total', 'Precio Unit. (COP)', 'Subtotal Total (COP)']);
    sr(rHdr, N, { bg: C.darkHdr, fg: C.white, bold: true, bdr: true, align: 'center' });

    let rowIdx = 0;
    for (const ins of Array.from(insumosMap.values())
      .sort((a, b) => a.tipo.localeCompare(b.tipo) || a.nombre.localeCompare(b.nombre))
    ) {
      const isAlt = rowIdx++ % 2 !== 0;
      const r = ws.addRow([
        ins.tipo,
        ins.nombre,
        ins.unidad,
        ins.cantidadTotal.toDecimalPlaces(3).toNumber(),
        ins.precio,
        fmt(ins.subtotalTotal),
      ]);
      sr(r, N, { bg: isAlt ? C.altRow : C.white, bdr: true }, {
        4: { align: 'right' },
        5: { nf: MF, align: 'right' },
        6: { nf: MF, align: 'right' },
      });
    }
  }

  // ── Hoja 5: Programa de Obra ──────────────────────────────────────────────────
  if (options.incluirProgramaObra) {
    const rawMeses = Number(budget.duracion_meses) || 0;
    const semanas  = Math.min(24, Math.max(8, rawMeses > 0 ? Math.ceil(rawMeses * 4.33) : 8));
    const NFIXED   = 6;
    const N        = NFIXED + semanas;

    const ws = wb.addWorksheet('Programa de Obra');
    ws.columns = [
      { width: 5  },
      { width: 25 },
      { width: 40 },
      { width: 10 },
      { width: 12 },
      { width: 18 },
      ...Array.from({ length: semanas }, () => ({ width: 12 })),
    ];

    // Fila 1: título
    const rTit = ws.addRow(['PROGRAMA DE OBRA', ...Array(N - 1).fill(null)]);
    ws.mergeCells(rTit.number, 1, rTit.number, N);
    rTit.height = 22;
    sc(rTit.getCell(1), { bg: C.darkHdr, fg: C.white, bold: true, sz: 13 });

    // Fila 2: proyecto y fecha
    const rInfo = ws.addRow([
      budget.projects?.nombre || '',
      null, null,
      `Fecha: ${fechaElaboracionExcel}`,
      ...Array(N - 4).fill(null),
    ]);
    rInfo.height = 16;
    ws.mergeCells(rInfo.number, 1, rInfo.number, 3);
    ws.mergeCells(rInfo.number, 4, rInfo.number, N);
    sc(rInfo.getCell(1), { bg: C.white, bold: true });
    sc(rInfo.getCell(4), { bg: C.white, align: 'right' });

    // Fila 3: headers fijos (dark) + semanas (orange)
    const hdrCols: string[] = ['N°', 'Capítulo', 'Actividad', 'Unidad', 'Cantidad', 'Valor Total (COP)'];
    for (let s = 1; s <= semanas; s++) hdrCols.push(`Semana ${s}`);
    const rHdr = ws.addRow(hdrCols);
    rHdr.height = 16;
    for (let c = 1; c <= NFIXED; c++) {
      sc(rHdr.getCell(c), { bg: C.darkHdr, fg: C.white, bold: true, bdr: true, align: 'center' });
    }
    for (let c = NFIXED + 1; c <= N; c++) {
      sc(rHdr.getCell(c), { bg: C.orange, fg: C.white, bold: true, bdr: true, align: 'center' });
    }

    const bdrThin = { style: 'thin' as const, color: { argb: C.border } };
    const bdrAll  = { top: bdrThin, bottom: bdrThin, left: bdrThin, right: bdrThin } as Partial<Borders>;

    for (const ch of sortedChapters) {
      const sortedActs = (ch.activities || [])
        .slice()
        .sort((a, b) => (Number((a as any).orden) || 0) - (Number((b as any).orden) || 0));

      const chTotal = sortedActs.reduce(
        (s, a) => s.plus(D(a.cantidad).times(D(a.precio_unitario))),
        new Decimal(0)
      );

      // Fila de capítulo — gris claro, negrita
      const rCh = ws.addRow([
        `${ch.numero}`,
        ch.nombre,
        null, null, null,
        fmt(chTotal),
        ...Array(semanas).fill(null),
      ]);
      rCh.height = 16;
      ws.mergeCells(rCh.number, 2, rCh.number, 5);
      sc(rCh.getCell(1), { bg: C.chapterBg, bold: true, bdr: true, align: 'center' });
      sc(rCh.getCell(2), { bg: C.chapterBg, bold: true, bdr: true });
      sc(rCh.getCell(6), { bg: C.chapterBg, bold: true, nf: MF,  bdr: true, align: 'right' });
      for (let c = NFIXED + 1; c <= N; c++) {
        const cell = rCh.getCell(c);
        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.chapterBg } };
        cell.font   = { name: 'Calibri', size: 11, bold: true, color: { argb: C.black } };
        cell.border = bdrAll;
      }

      // Filas de actividades
      for (const [j, act] of sortedActs.entries()) {
        const vrTotal = D(act.cantidad).times(D(act.precio_unitario));
        const r = ws.addRow([
          `${ch.numero}.${j + 1}`,
          ch.nombre,
          act.nombre,
          act.unidad,
          D(act.cantidad).toNumber(),
          fmt(vrTotal),
          ...Array(semanas).fill(null),
        ]);
        sc(r.getCell(1), { bg: C.white, bdr: true, align: 'center' });
        sc(r.getCell(2), { bg: C.white, bdr: true });
        sc(r.getCell(3), { bg: C.white, bdr: true });
        sc(r.getCell(4), { bg: C.white, bdr: true, align: 'center' });
        sc(r.getCell(5), { bg: C.white, bdr: true, align: 'right' });
        sc(r.getCell(6), { bg: C.white, nf: MF,  bdr: true, align: 'right' });
        for (let c = NFIXED + 1; c <= N; c++) {
          const cell = r.getCell(c);
          cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
          cell.font   = { name: 'Calibri', size: 11, color: { argb: C.black } };
          cell.border = bdrAll;
        }
      }

      ws.addRow([]);
    }
  }

  // ── Descargar ─────────────────────────────────────────────────────────────────
  if (wb.worksheets.length === 0) {
    throw new Error('Debe seleccionar al menos una hoja para exportar.');
  }
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer as ArrayBuffer], {
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
