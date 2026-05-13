// ============================================================
// SIPO — Motor de cálculo profesional
// Metodología colombiana de presupuestos de obra 2025
// ============================================================

import type {
  APUItem, APU, Budget, Activity, Chapter,
  ResumenPresupuesto, TipoAPUItem,
} from '@/types';

// ── 1. CÁLCULO DE APU ──────────────────────────────────────

/**
 * Porcentajes por defecto para HM y EPP sobre el subtotal de MO.
 * El usuario puede ajustarlos en la configuración del presupuesto.
 */
export const PORCENTAJES_DEFAULT = {
  herramienta_menor: 0.03, // 3% sobre MO
  epp:               0.01, // 1% sobre MO
};

/**
 * Calcula los subtotales de un APU agrupados por tipo.
 * La herramienta menor y EPP son % sobre el subtotal de MO.
 *
 * Fórmula:
 *   costo_material        = Σ items tipo 'material'
 *   costo_mano_obra       = Σ items tipo 'mano_obra'
 *   costo_equipo          = Σ items tipo 'equipo'
 *   costo_HM              = % × costo_mano_obra  (ej: 3%)
 *   costo_EPP             = % × costo_mano_obra  (ej: 1%)
 *   COSTO DIRECTO UNITARIO = mat + MO + equipo + HM + EPP
 */
export function calcularAPU(
  items: APUItem[],
  pct_hm: number = PORCENTAJES_DEFAULT.herramienta_menor,
  pct_epp: number = PORCENTAJES_DEFAULT.epp,
): {
  costo_material: number;
  costo_mano_obra: number;
  costo_equipo: number;
  costo_herramienta_menor: number;
  costo_epp: number;
  costo_total: number;
} {
  const costo_material = items
    .filter(i => i.tipo === 'material')
    .reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);

  const costo_mano_obra = items
    .filter(i => i.tipo === 'mano_obra')
    .reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);

  const costo_equipo = items
    .filter(i => i.tipo === 'equipo')
    .reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);

  // HM y EPP calculados como % sobre la MO
  const costo_herramienta_menor = costo_mano_obra * pct_hm;
  const costo_epp               = costo_mano_obra * pct_epp;

  const costo_total =
    costo_material +
    costo_mano_obra +
    costo_equipo +
    costo_herramienta_menor +
    costo_epp;

  return {
    costo_material:        round(costo_material),
    costo_mano_obra:       round(costo_mano_obra),
    costo_equipo:          round(costo_equipo),
    costo_herramienta_menor: round(costo_herramienta_menor),
    costo_epp:             round(costo_epp),
    costo_total:           round(costo_total),
  };
}

// ── 2. CÁLCULO DE ACTIVIDAD ────────────────────────────────

/**
 * El precio unitario de una actividad = costo_total del APU (costo directo unitario).
 * Es SOLO LECTURA — no se puede editar manualmente.
 * subtotal = cantidad × precio_unitario
 */
export function calcularActividad(
  cantidad: number,
  precio_unitario: number,
): { subtotal: number } {
  return { subtotal: round(cantidad * precio_unitario) };
}

// ── 3. CÁLCULO DE CAPÍTULO ─────────────────────────────────

/**
 * valor_subtotal de un capítulo = Σ subtotales de sus actividades
 */
export function calcularCapitulo(activities: Activity[]): { valor_subtotal: number } {
  const valor_subtotal = activities.reduce(
    (s, a) => s + (a.cantidad * a.precio_unitario),
    0,
  );
  return { valor_subtotal: round(valor_subtotal) };
}

// ── 4. RESUMEN FINANCIERO DEL PRESUPUESTO ─────────────────

/**
 * Calcula el resumen financiero completo de un presupuesto.
 *
 * ESTRUCTURA CORRECTA (metodología colombiana):
 *
 * COSTO DIRECTO           = Σ capítulos (materiales + MO + equipo + HM + EPP)
 * + ADMINISTRACIÓN        = CD × admin_pct
 * + IMPREVISTOS           = CD × imprevistos_pct
 * + UTILIDAD              = CD × utilidad_pct
 * = SUBTOTAL CON AIU      = CD + A + I + U
 * + IVA                   = (CD + AIU) × iva_pct  ← IVA sobre todo el contrato
 * = TOTAL OFERTA
 *
 * RETENCIONES (informativo, no restan del total):
 * - Retefuente            = CD × retefuente_pct (base = CD sin AIU ni IVA)
 * - ICA                   = Total Oferta × ica_pct
 *
 * NOTA: El IVA en contratos de obra se aplica sobre el total (CD + AIU),
 * no solo sobre AIU. Algunos contratos solo gravan con IVA la Utilidad,
 * pero el estándar es sobre el total.
 */
export function calcularResumenPresupuesto(
  chapters: Chapter[],
  budget: Pick<Budget,
    'administracion_pct' | 'imprevistos_pct' | 'utilidad_pct' |
    'iva_porcentaje' | 'retefuente_pct' | 'ica_pct'
  >,
): ResumenPresupuesto {
  const costoDirecto = chapters.reduce(
    (s, ch) => s + (ch.valor_subtotal ?? calcularSubtotalCapitulo(ch)),
    0,
  );

  const administracion = costoDirecto * ((budget.administracion_pct ?? 10) / 100);
  const imprevistos    = costoDirecto * ((budget.imprevistos_pct  ??  5) / 100);
  const utilidad       = costoDirecto * ((budget.utilidad_pct     ?? 10) / 100);
  const aiu            = administracion + imprevistos + utilidad;
  const subtotalConAIU = costoDirecto + aiu;
  const iva            = subtotalConAIU * ((budget.iva_porcentaje ?? 19) / 100);
  const totalOferta    = subtotalConAIU + iva;

  // Retenciones — base = CD (sin AIU ni IVA)
  const retefuente = costoDirecto * ((budget.retefuente_pct ?? 2) / 100);
  // ICA se aplica sobre el total facturado (sin IVA)
  const ica        = subtotalConAIU * ((budget.ica_pct ?? 0) / 100);
  const totalNeto  = totalOferta - retefuente - ica;

  const reteiva          = 0; // ReteIVA se calcula por separado sobre el valor del IVA
  const totalRetenciones = round(retefuente + ica + reteiva);

  return {
    costoDirecto:      round(costoDirecto),
    administracion:    round(administracion),
    imprevistos:       round(imprevistos),
    utilidad:          round(utilidad),
    aiu:               round(aiu),
    subtotalConAIU:    round(subtotalConAIU),
    iva:               round(iva),
    totalOferta:       round(totalOferta),
    retefuente:        round(retefuente),
    ica:               round(ica),
    reteiva,
    totalRetenciones,
    totalNeto:         round(totalNeto),
  };
}

// ── 5. CUADRILLAS Y MO ────────────────────────────────────

export interface TrabajadorEnCuadrilla {
  id: string;
  especialidad: string;
  categoria: string;
  jornal_base: number;
  factor_prestacional: number;   // ej: 1.5988 (incluye SMLV, prestaciones, SS)
  jornal_con_prestaciones: number;
  cantidad: number;
}

export interface Rendimiento {
  id: string;
  actividad_tipo: string;
  unidad: string;
  rendimiento_minimo: number | null;
  rendimiento_normal: number;
  rendimiento_optimo: number | null;
  condiciones: string | null;
  fuente: string;
}

export interface CuadrillaConTrabajadores {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria_actividad: string | null;
  es_sistema: boolean;
  trabajadores: TrabajadorEnCuadrilla[];
  rendimientos: Rendimiento[];
}

export interface CuadrillaCosto {
  cuadrillaId: string;
  nombre: string;
  rendimiento: number;        // unidades producidas por jornada (8h)
  unidad: string;
  costoJornadaBase: number;   // Σ jornales SIN prestaciones
  costoJornadaReal: number;   // Σ jornales CON factor prestacional
  costoUnitarioMO: number;    // costoJornadaReal / rendimiento
  fraccionJornada: number;    // 1 / rendimiento  → cantidad en el APU
  trabajadores: {
    especialidad: string;
    cantidad: number;
    jornal_base: number;
    factor_prestacional: number;
    jornal_con_prestaciones: number;
    costoEnCuadrilla: number; // jornal_con_prestaciones × cantidad
  }[];
}

/**
 * Calcula el costo completo de una cuadrilla para un rendimiento dado.
 *
 * Fórmula:
 *   costoJornadaReal  = Σ (jornal_base × factor_prestacional × cantidad)
 *   costoUnitarioMO   = costoJornadaReal / rendimiento
 *   fraccionJornada   = 1 / rendimiento  (va en el ítem APU como cantidad)
 */
export function calcularCostoCuadrilla(
  cuadrilla: CuadrillaConTrabajadores,
  rendimiento: number,
  unidad: string,
): CuadrillaCosto {
  if (rendimiento <= 0) throw new Error('El rendimiento debe ser mayor a 0');

  const trabajadoresDetalle = cuadrilla.trabajadores.map(t => ({
    especialidad:            t.especialidad,
    cantidad:                t.cantidad,
    jornal_base:             t.jornal_base,
    factor_prestacional:     t.factor_prestacional,
    jornal_con_prestaciones: t.jornal_base * t.factor_prestacional,
    costoEnCuadrilla:        t.jornal_base * t.factor_prestacional * t.cantidad,
  }));

  const costoJornadaBase = cuadrilla.trabajadores.reduce(
    (s, t) => s + t.jornal_base * t.cantidad, 0,
  );
  const costoJornadaReal = trabajadoresDetalle.reduce(
    (s, t) => s + t.costoEnCuadrilla, 0,
  );

  return {
    cuadrillaId:    cuadrilla.id,
    nombre:         cuadrilla.nombre,
    rendimiento,
    unidad,
    costoJornadaBase,
    costoJornadaReal,
    costoUnitarioMO:  costoJornadaReal / rendimiento,
    fraccionJornada:  1 / rendimiento,
    trabajadores:   trabajadoresDetalle,
  };
}

/**
 * Genera el ítem de mano de obra para el APU.
 * En el APU:
 *   unidad    = "jornada"
 *   cantidad  = 1 / rendimiento  (fracción de jornada por unidad de actividad)
 *   precio    = costoJornadaReal (costo completo de la cuadrilla por día)
 *   subtotal  = costoUnitarioMO
 */
export function generarItemApuDeCuadrilla(costo: CuadrillaCosto): {
  nombre: string;
  tipo: TipoAPUItem;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
} {
  return {
    nombre:          `Mano de obra: ${costo.nombre}`,
    tipo:            'mano_obra',
    unidad:          'jornada',
    cantidad:        parseFloat(costo.fraccionJornada.toFixed(6)),
    precio_unitario: Math.round(costo.costoJornadaReal),
  };
}

/**
 * Calcula el costo de MO para una cantidad de actividad dada.
 * Ej: rendimiento = 8 m²/día, cantidad = 24 m² → 3 jornadas × costoJornada
 */
export function calcularCostoMOParaCantidad(
  costo: CuadrillaCosto,
  cantidadActividad: number,
): number {
  return (cantidadActividad / costo.rendimiento) * costo.costoJornadaReal;
}

/**
 * Formatea el factor prestacional como porcentaje legible.
 * Ej: 1.5988 → "59.88%"
 */
export function formatFactorPrestacional(factor: number): string {
  return `${((factor - 1) * 100).toFixed(2)}%`;
}

// ── UTILIDADES ─────────────────────────────────────────────

function round(n: number): number {
  return Math.round(n);
}

/** Calcula el subtotal de un capítulo a partir de sus actividades (fallback) */
function calcularSubtotalCapitulo(ch: Chapter): number {
  return (ch.activities ?? []).reduce(
    (s, a) => s + a.cantidad * a.precio_unitario,
    0,
  );
}

export const CATEGORIAS_ACTIVIDAD = [
  'Mampostería',
  'Concretos',
  'Encofrados',
  'Pañetes y morteros',
  'Acabados y pintura',
  'Pisos y enchapes',
  'Cubiertas',
  'Instalaciones eléctricas',
  'Instalaciones hidrosanitarias',
  'Movimiento de tierras',
  'Drywall y cielos rasos',
  'Impermeabilizaciones',
  'Carpintería metálica',
  'Vidriería y aluminio',
  'Obras exteriores',
] as const;

export type CategoriaActividad = typeof CATEGORIAS_ACTIVIDAD[number];
