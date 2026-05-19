import * as XLSX from 'xlsx';
import Decimal from 'decimal.js';
import type { PresupuestoPDFData, ConfigPDFProfesional } from '@/types/pdf';

const D = (v: number | string | null | undefined) => new Decimal(Number(v) || 0);
const fmt = (d: Decimal) => d.toDecimalPlaces(0).toNumber();

const TIPO_LABEL: Record<string, string> = {
  material: 'Material',
  mano_obra: 'Mano de Obra',
  equipo: 'Equipo',
  herramienta_menor: 'H. Menor',
  epp: 'EPP',
};

export function exportarPresupuestoExcel(
  budget: PresupuestoPDFData,
  profile: ConfigPDFProfesional
) {
  // ── Cálculos ──────────────────────────────────────────────────────────────
  const sortedChapters = (budget.chapters || [])
    .slice()
    .sort((a, b) => (Number((a as any).orden) || Number(a.numero) || 0) - (Number((b as any).orden) || Number(b.numero) || 0));

  const costoDirecto = sortedChapters.reduce((sum, ch) =>
    sum.plus(
      (ch.activities || []).reduce(
        (s, a) => s.plus(D(a.cantidad).times(D(a.precio_unitario))),
        new Decimal(0)
      )
    ), new Decimal(0));

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
  const resumenRows: (string | number | null)[][] = [
    [`PRESUPUESTO DE OBRA — ${(budget.titulo || '').toUpperCase()}`],
    [],
    ['Proyecto',      budget.projects?.nombre    || ''],
    ['Ubicación',     budget.projects?.ubicacion  || ''],
    ['Elaborado por', profile.nombre_completo     || ''],
    ['Empresa',       profile.empresa             || ''],
    ['Fecha',         new Date().toLocaleDateString('es-CO')],
    [],
    ['CONCEPTO', 'VALOR (COP)'],
    ['Costo Directo',             fmt(costoDirecto)],
    [`Administración (${adminPct}%)`,  fmt(aiuAdmin)],
    [`Imprevistos (${imprevPct}%)`,    fmt(aiuImprevistos)],
    [`Utilidad (${utilPct}%)`,         fmt(aiuUtilidad)],
    ['AIU Total',                 fmt(aiuTotal)],
    ['Subtotal (CD + AIU)',       fmt(subtotal)],
    [ivaLabel,                    fmt(iva)],
    ['TOTAL OFERTA',              fmt(totalOferta)],
    [],
    ['RETENCIONES INFORMATIVAS (responsabilidad del contratante)', ''],
    [`ReteFuente (${reteFuentePct}%)`, fmt(reteFuente)],
    [`ReteICA (${icaPct.toFixed(3)}%)`, fmt(reteIca)],
    ...(reteivaPct > 0 && iva.greaterThan(0)
      ? [[`ReteIVA (${reteivaPct}% del IVA)`, fmt(reteIva)]] as (string | number)[][]
      : []),
    ['Valor Neto a Girar (Informativo)', fmt(valorNeto)],
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
  wsResumen['!cols'] = [{ wch: 42 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // ── Hoja 2: Presupuesto ───────────────────────────────────────────────────
  const presRows: (string | number)[][] = [
    ['N°', 'Capítulo', 'Descripción', 'Unidad', 'Cantidad', 'Precio Unit. (COP)', 'Total (COP)', '% C.D.'],
  ];

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
      presRows.push([
        `${ch.numero}.${j + 1}`,
        ch.nombre,
        act.nombre,
        act.unidad,
        Number(act.cantidad) || 0,
        Number(act.precio_unitario) || 0,
        fmt(vrTotal),
        pct,
      ]);
    });

    const pctCap = costoDirecto.greaterThan(0)
      ? chTotal.dividedBy(costoDirecto).times(100).toDecimalPlaces(1).toNumber()
      : 0;
    presRows.push(['', `SUBTOTAL CAP. ${ch.numero} — ${ch.nombre}`, '', '', '', '', fmt(chTotal), pctCap]);
    presRows.push([]);
  });

  const wsPresupuesto = XLSX.utils.aoa_to_sheet(presRows);
  wsPresupuesto['!cols'] = [
    { wch: 8 }, { wch: 28 }, { wch: 40 }, { wch: 10 },
    { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPresupuesto, 'Presupuesto');

  // ── Hoja 3: APUs ──────────────────────────────────────────────────────────
  const apuRows: (string | number)[][] = [
    ['Actividad', 'Tipo', 'Insumo', 'Unidad', 'Cantidad', 'Precio Unit. (COP)', 'Subtotal (COP)'],
  ];

  sortedChapters.forEach(ch => {
    (ch.activities || []).forEach(act => {
      const items: any[] = (act as any).apu_items || [];
      if (items.length === 0) return;
      items.forEach(item => {
        apuRows.push([
          act.nombre,
          TIPO_LABEL[item.tipo] || item.tipo,
          item.nombre,
          item.unidad,
          Number(item.cantidad) || 0,
          Number(item.precio_unitario) || 0,
          Number(item.subtotal) || 0,
        ]);
      });
      apuRows.push([]);
    });
  });

  const wsAPU = XLSX.utils.aoa_to_sheet(apuRows);
  wsAPU['!cols'] = [{ wch: 35 }, { wch: 14 }, { wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsAPU, 'APUs');

  // ── Hoja 4: Insumos (explosión consolidada) ───────────────────────────────
  // Consolida por: tipo + nombre + unidad + precio_unitario
  const insumosMap = new Map<string, {
    nombre: string; tipo: string; unidad: string;
    cantidadTotal: Decimal; precio: number; subtotalTotal: Decimal;
  }>();

  sortedChapters.forEach(ch => {
    (ch.activities || []).forEach(act => {
      const actCant = D(act.cantidad);
      const items: any[] = (act as any).apu_items || [];
      items.forEach(item => {
        const key = `${item.tipo}||${item.nombre}||${item.unidad}||${item.precio_unitario}`;
        const existing = insumosMap.get(key);
        const cantItems = D(item.cantidad).times(actCant);
        const subtotalItems = D(item.subtotal).times(actCant);
        if (existing) {
          existing.cantidadTotal = existing.cantidadTotal.plus(cantItems);
          existing.subtotalTotal = existing.subtotalTotal.plus(subtotalItems);
        } else {
          insumosMap.set(key, {
            nombre: item.nombre,
            tipo: TIPO_LABEL[item.tipo] || item.tipo,
            unidad: item.unidad,
            cantidadTotal: cantItems,
            precio: Number(item.precio_unitario) || 0,
            subtotalTotal: subtotalItems,
          });
        }
      });
    });
  });

  const insumosRows: (string | number)[][] = [
    ['Tipo', 'Nombre', 'Unidad', 'Cantidad Total', 'Precio Unit. (COP)', 'Subtotal Total (COP)'],
  ];

  Array.from(insumosMap.values())
    .sort((a, b) => a.tipo.localeCompare(b.tipo) || a.nombre.localeCompare(b.nombre))
    .forEach(ins => {
      insumosRows.push([
        ins.tipo,
        ins.nombre,
        ins.unidad,
        ins.cantidadTotal.toDecimalPlaces(3).toNumber(),
        ins.precio,
        fmt(ins.subtotalTotal),
      ]);
    });

  const wsInsumos = XLSX.utils.aoa_to_sheet(insumosRows);
  wsInsumos['!cols'] = [{ wch: 14 }, { wch: 40 }, { wch: 10 }, { wch: 16 }, { wch: 20 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsInsumos, 'Insumos');

  // ── Descargar ─────────────────────────────────────────────────────────────
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SIPO-${budget.projects?.nombre || 'Presupuesto'}-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
