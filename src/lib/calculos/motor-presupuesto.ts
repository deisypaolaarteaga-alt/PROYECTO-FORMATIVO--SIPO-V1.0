// ============================================================
// SIPO — Motor de Cálculo Profesional (Metodología 2026)
// Basado en normativa colombiana de construcción y Ley 1819 (IVA sobre Utilidad)
// ============================================================

import Decimal from 'decimal.js';
import type { ParametrosFiscales } from '@/lib/fiscal/parametros';

export type { ParametrosFiscales } from '@/lib/fiscal/parametros';

// ── TIPOS ──────────────────────────────────────────────────

export interface APUItem {
  id?: string;
  nombre: string;
  tipo: 'material' | 'mano_obra' | 'equipo' | 'herramienta_menor' | 'epp';
  unidad: string;
  cantidad: number;
  precio_unitario: number;
}

export interface TrabajadorCuadrilla {
  jornal: number;
  nivelRiesgo: 1 | 2 | 3 | 4 | 5;
  cantidad: number;
  especialidad?: string;
}

export interface Cuadrilla {
  id: string;
  nombre: string;
  trabajadores: TrabajadorCuadrilla[];
}

export interface ResultadoMO {
  costoJornada: number;
  costoUnitario: number;
  fraccionJornada: number;
}

export interface ResultadoAPU {
  subtotalMateriales: number;
  subtotalManoObra: number;
  subtotalEquipos: number;
  herramientaMenor: number;
  epp: number;
  costoDirecto: number;
  precioUnitario: number;
}

export interface AIUConfig {
  administracion_pct: number;
  imprevistos_pct: number;
  utilidad_pct: number;
  metodo_iva: 'sobre_utilidad' | 'sobre_aiu' | 'sobre_total' | 'no_aplica';
  iva_porcentaje: number;
}

export interface RetencionesColombia {
  retefuente: number;
  ica: number;
  reteiva: number;
  total: number;
  esInformativa: boolean;
}

export interface ResumenPresupuesto {
  costoDirecto: number;
  administracion: number;
  imprevistos: number;
  utilidad: number;
  totalAIU: number;
  subtotalConAIU: number;
  iva: number;
  totalOferta: number;
  retenciones: RetencionesColombia;
  valorNeto: number;
}

// ── FUNCIONES ──────────────────────────────────────────────

/**
 * Cálculo del costo de Mano de Obra para una cuadrilla y rendimiento.
 * Usa el factor prestacional dinámico según el riesgo ARL.
 */
export function calcularManoObra(
  cuadrilla: Cuadrilla,
  rendimiento: number,
  params: ParametrosFiscales
): ResultadoMO {
  if (rendimiento <= 0) {
    throw new Error(`Rendimiento no puede ser cero o negativo en cuadrilla: ${cuadrilla.nombre}`);
  }

  const costoJornada = cuadrilla.trabajadores.reduce((sum, t) => {
    if (t.jornal < 0) throw new Error(`El jornal no puede ser negativo para ${t.especialidad}`);
    
    // Obtener factor según riesgo
    let factor = params.factor_prestacional_riesgo_iv;
    if (t.nivelRiesgo === 1) factor = params.factor_prestacional_riesgo_i;
    else if (t.nivelRiesgo === 2) factor = params.factor_prestacional_riesgo_ii;
    else if (t.nivelRiesgo === 3) factor = params.factor_prestacional_riesgo_iii;
    else if (t.nivelRiesgo === 5) factor = params.factor_prestacional_riesgo_v;

    const costoTrabajador = new Decimal(t.jornal).mul(factor).mul(t.cantidad);
    return sum.add(costoTrabajador);
  }, new Decimal(0));

  return {
    costoJornada: costoJornada.toNumber(),
    costoUnitario: costoJornada.div(rendimiento).toNumber(),
    fraccionJornada: new Decimal(1).div(rendimiento).toNumber()
  };
}

/**
 * Cálculo de APU completo con Decimal.js
 */
export function calcularAPU(
  items: APUItem[],
  params: ParametrosFiscales
): ResultadoAPU {
  const subtotalMateriales = items
    .filter(i => i.tipo === 'material')
    .reduce((sum, i) => {
      if (i.cantidad <= 0) throw new Error(`Cantidad debe ser mayor a cero para ítem: ${i.nombre}`);
      if (i.precio_unitario < 0) throw new Error(`Precio unitario no puede ser negativo para ítem: ${i.nombre}`);
      return sum.add(new Decimal(i.cantidad).mul(i.precio_unitario));
    }, new Decimal(0));

  const subtotalManoObra = items
    .filter(i => i.tipo === 'mano_obra')
    .reduce((sum, i) => sum.add(new Decimal(i.cantidad).mul(i.precio_unitario)), new Decimal(0));

  const subtotalEquipos = items
    .filter(i => i.tipo === 'equipo')
    .reduce((sum, i) => sum.add(new Decimal(i.cantidad).mul(i.precio_unitario)), new Decimal(0));

  // HM y EPP sobre Mano de Obra
  const herramientaMenor = subtotalManoObra.mul(new Decimal(params.herramienta_menor_porcentaje).div(100));
  const epp = subtotalManoObra.mul(new Decimal(params.epp_porcentaje).div(100));

  const costoDirecto = subtotalMateriales
    .add(subtotalManoObra)
    .add(subtotalEquipos)
    .add(herramientaMenor)
    .add(epp);

  return {
    subtotalMateriales: subtotalMateriales.toNumber(),
    subtotalManoObra: subtotalManoObra.toNumber(),
    subtotalEquipos: subtotalEquipos.toNumber(),
    herramientaMenor: herramientaMenor.toNumber(),
    epp: epp.toNumber(),
    costoDirecto: costoDirecto.toNumber(),
    precioUnitario: costoDirecto.round().toNumber()
  };
}

/**
 * Cálculo del resumen financiero total del presupuesto.
 * Aplica IVA sobre la Utilidad (Ley 1819/2016).
 */
export function calcularTotalPresupuesto(
  actividades: { subtotal: number }[],
  aiu: AIUConfig,
  retencionesConfig: { retefuente: number; ica: number; reteiva: number }
): ResumenPresupuesto {
  const costoDirecto = actividades.reduce((sum, a) => sum.add(a.subtotal), new Decimal(0));

  if (aiu.administracion_pct + aiu.imprevistos_pct + aiu.utilidad_pct > 50) {
    console.warn('⚠️ SIPO: El porcentaje total de AIU supera el 50%');
  }

  const administracion = costoDirecto.mul(new Decimal(aiu.administracion_pct).div(100));
  const imprevistos = costoDirecto.mul(new Decimal(aiu.imprevistos_pct).div(100));
  const utilidad = costoDirecto.mul(new Decimal(aiu.utilidad_pct).div(100));
  const totalAIU = administracion.add(imprevistos).add(utilidad);
  
  const subtotalConAIU = costoDirecto.add(totalAIU);

  // IVA según metodo_iva (Ley 1819/2016)
  const ivaPct = new Decimal(aiu.iva_porcentaje).div(100);
  let iva: Decimal;
  switch (aiu.metodo_iva) {
    case 'sobre_utilidad': iva = utilidad.mul(ivaPct);         break;
    case 'sobre_aiu':      iva = totalAIU.mul(ivaPct);         break;
    case 'sobre_total':    iva = subtotalConAIU.mul(ivaPct);   break;
    default:               iva = new Decimal(0);
  }

  const totalOferta = subtotalConAIU.add(iva);

  // Retenciones Informativas (NO afectan el total de la oferta)
  // Base ReteFuente e ICA = subtotalConAIU (CD + AIU), no CD solo
  const retefuente = subtotalConAIU.mul(new Decimal(retencionesConfig.retefuente).div(100));
  const ica = subtotalConAIU.mul(new Decimal(retencionesConfig.ica).div(100));
  const reteiva = iva.mul(new Decimal(retencionesConfig.reteiva).div(100));
  const totalRetenciones = retefuente.add(ica).add(reteiva);

  return {
    costoDirecto: costoDirecto.round().toNumber(),
    administracion: administracion.round().toNumber(),
    imprevistos: imprevistos.round().toNumber(),
    utilidad: utilidad.round().toNumber(),
    totalAIU: totalAIU.round().toNumber(),
    subtotalConAIU: subtotalConAIU.round().toNumber(),
    iva: iva.round().toNumber(),
    totalOferta: totalOferta.round().toNumber(),
    retenciones: {
      retefuente: retefuente.round().toNumber(),
      ica: ica.round().toNumber(),
      reteiva: reteiva.round().toNumber(),
      total: totalRetenciones.round().toNumber(),
      esInformativa: true
    },
    valorNeto: totalOferta.sub(totalRetenciones).round().toNumber()
  };
}
