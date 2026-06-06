'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import Decimal from 'decimal.js';
import type { ReporteUtilidad, ReporteTipoObra, ReporteCliente, ReporteTendencia } from '@/types';

export interface KPIsGlobales {
  proyectos_en_progreso: number;
  proyectos_borrador: number;
  proyectos_por_estado: Record<string, number>;
  presupuestos_total: number;
  presupuestos_por_estado: Record<string, number>;
  presupuestos_aprobados: number;
  presupuestos_con_cliente: number;
  presupuestos_rechazados: number;
  valor_total_oferta: number;
  valor_costo_directo: number;
  proximos_a_vencer: number;
}

export interface DistribucionCDItem {
  budget_id: string;
  titulo: string;
  estado: string;
  costo_directo: number;
  aiu: number;
  iva: number;
  total_oferta: number;
  material: number;
  mano_obra: number;
  equipo: number;
  herramienta_menor: number;
  epp: number;
}

export interface VencimientoItem {
  budget_id: string;
  titulo: string;
  estado: string;
  proyecto_nombre: string | null;
  vigencia_dias: number;
  fecha_vence: string;
  dias_restantes: number;
}

export interface RangoOpts {
  desde?: string; // ISO string
  hasta?: string; // ISO string
}

const ESTADOS_APROBADO     = ['aprobado', 'aprobado_por_cliente'];
const ESTADOS_CON_CLIENTE  = ['enviado_a_cliente', 'visto_por_cliente', 'con_observaciones'];
const ESTADOS_RECHAZADO    = ['rechazado', 'rechazado_por_cliente'];

const VACIO_KPIS: KPIsGlobales = {
  proyectos_en_progreso: 0,
  proyectos_borrador: 0,
  proyectos_por_estado: {},
  presupuestos_total: 0,
  presupuestos_por_estado: {},
  presupuestos_aprobados: 0,
  presupuestos_con_cliente: 0,
  presupuestos_rechazados: 0,
  valor_total_oferta: 0,
  valor_costo_directo: 0,
  proximos_a_vencer: 0,
};

export async function getKPIsGlobales(opts: RangoOpts = {}): Promise<KPIsGlobales> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return VACIO_KPIS;

    // Queries con filtro de fecha opcional (proyectos y presupuestos)
    let proyectosQ = supabase.from('projects').select('estado').eq('user_id', user.id);
    if (opts.desde) proyectosQ = proyectosQ.gte('created_at', opts.desde);
    if (opts.hasta) proyectosQ = proyectosQ.lte('created_at', opts.hasta);

    let presupuestosQ = supabase.from('budgets').select('estado').eq('user_id', user.id).is('deleted_at', null);
    if (opts.desde) presupuestosQ = presupuestosQ.gte('created_at', opts.desde);
    if (opts.hasta) presupuestosQ = presupuestosQ.lte('created_at', opts.hasta);

    let budgetIdsQ = supabase.from('budgets').select('id').eq('user_id', user.id).is('deleted_at', null);
    if (opts.desde) budgetIdsQ = budgetIdsQ.gte('created_at', opts.desde);
    if (opts.hasta) budgetIdsQ = budgetIdsQ.lte('created_at', opts.hasta);

    // proximos_a_vencer siempre sin filtro de período (es una métrica de "ahora")
    const [
      { data: proyectos },
      { data: presupuestos },
      { data: budgetIds },
      { data: budgetsVigencia },
    ] = await Promise.all([
      proyectosQ,
      presupuestosQ,
      budgetIdsQ,
      supabase
        .from('budgets')
        .select('created_at, vigencia_dias')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .gt('vigencia_dias', 0),
    ]);

    // Totales financieros desde la vista, solo para los IDs filtrados
    const ids = (budgetIds ?? []).map((b) => b.id);
    let resumenes: Array<{ total_oferta: number; costo_directo: number }> = [];
    if (ids.length > 0) {
      const { data } = await supabase
        .from('v_resumen_presupuesto')
        .select('total_oferta, costo_directo')
        .in('budget_id', ids);
      resumenes = data ?? [];
    }

    const proyectosPorEstado: Record<string, number> = {};
    for (const p of proyectos ?? []) {
      proyectosPorEstado[p.estado] = (proyectosPorEstado[p.estado] ?? 0) + 1;
    }

    const presupuestosPorEstado: Record<string, number> = {};
    for (const b of presupuestos ?? []) {
      presupuestosPorEstado[b.estado] = (presupuestosPorEstado[b.estado] ?? 0) + 1;
    }

    const ahora = Date.now();
    const proximos = (budgetsVigencia ?? []).filter((b) => {
      const vence = new Date(b.created_at).getTime() + b.vigencia_dias * 86400000;
      const dias = Math.ceil((vence - ahora) / 86400000);
      return dias <= 30;
    }).length;

    const presupuestosAprobados   = ESTADOS_APROBADO.reduce((s, e) => s + (presupuestosPorEstado[e] ?? 0), 0);
    const presupuestosConCliente  = ESTADOS_CON_CLIENTE.reduce((s, e) => s + (presupuestosPorEstado[e] ?? 0), 0);
    const presupuestosRechazados  = ESTADOS_RECHAZADO.reduce((s, e) => s + (presupuestosPorEstado[e] ?? 0), 0);

    return {
      proyectos_en_progreso: proyectosPorEstado['en_progreso'] ?? 0,
      proyectos_borrador: proyectosPorEstado['borrador'] ?? 0,
      proyectos_por_estado: proyectosPorEstado,
      presupuestos_total: presupuestos?.length ?? 0,
      presupuestos_por_estado: presupuestosPorEstado,
      presupuestos_aprobados: presupuestosAprobados,
      presupuestos_con_cliente: presupuestosConCliente,
      presupuestos_rechazados: presupuestosRechazados,
      valor_total_oferta: resumenes.reduce((s, r) => s + Number(r.total_oferta ?? 0), 0),
      valor_costo_directo: resumenes.reduce((s, r) => s + Number(r.costo_directo ?? 0), 0),
      proximos_a_vencer: proximos,
    };
  } catch (err) {
    console.error('[getKPIsGlobales]', err);
    return VACIO_KPIS;
  }
}

export async function getDistribucionCD(opts: RangoOpts = {}): Promise<DistribucionCDItem[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Primero obtenemos los budgets filtrados por fecha
    let budgetsQ = supabase
      .from('budgets')
      .select('id, estado')
      .eq('user_id', user.id)
      .is('deleted_at', null);
    if (opts.desde) budgetsQ = budgetsQ.gte('created_at', opts.desde);
    if (opts.hasta) budgetsQ = budgetsQ.lte('created_at', opts.hasta);

    const { data: budgets } = await budgetsQ;
    if (!budgets || budgets.length === 0) return [];

    const budgetIds = budgets.map((b) => b.id);
    const budgetEstado: Record<string, string> = {};
    for (const b of budgets) budgetEstado[b.id] = b.estado;

    // Ahora en paralelo: resumenes y APUs, ambos filtrados por los IDs del período
    const [{ data: resumenes }, { data: apusData }] = await Promise.all([
      supabase
        .from('v_resumen_presupuesto')
        .select('budget_id, titulo, costo_directo, aiu, iva, total_oferta')
        .in('budget_id', budgetIds),
      supabase
        .from('apus')
        .select('budget_id, costo_material, costo_mano_obra, costo_equipo, costo_herramienta_menor, costo_epp')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .in('budget_id', budgetIds),
    ]);

    if (!resumenes) return [];

    type ApuAcum = { material: number; mano_obra: number; equipo: number; herramienta_menor: number; epp: number };
    const apuPorBudget: Record<string, ApuAcum> = {};
    for (const apu of apusData ?? []) {
      if (!apuPorBudget[apu.budget_id]) {
        apuPorBudget[apu.budget_id] = { material: 0, mano_obra: 0, equipo: 0, herramienta_menor: 0, epp: 0 };
      }
      apuPorBudget[apu.budget_id].material          += Number(apu.costo_material ?? 0);
      apuPorBudget[apu.budget_id].mano_obra         += Number(apu.costo_mano_obra ?? 0);
      apuPorBudget[apu.budget_id].equipo            += Number(apu.costo_equipo ?? 0);
      apuPorBudget[apu.budget_id].herramienta_menor += Number(apu.costo_herramienta_menor ?? 0);
      apuPorBudget[apu.budget_id].epp               += Number(apu.costo_epp ?? 0);
    }

    return resumenes
      .filter((r) => apuPorBudget[r.budget_id] !== undefined)
      .map((r) => ({
        budget_id:     r.budget_id,
        titulo:        r.titulo,
        estado:        budgetEstado[r.budget_id] ?? 'borrador',
        costo_directo: Number(r.costo_directo),
        aiu:           Number(r.aiu ?? 0),
        iva:           Number(r.iva ?? 0),
        total_oferta:  Number(r.total_oferta),
        ...(apuPorBudget[r.budget_id] ?? { material: Number(r.costo_directo), mano_obra: 0, equipo: 0, herramienta_menor: 0, epp: 0 }),
      }))
      .sort((a, b) => b.total_oferta - a.total_oferta)
      .slice(0, 8);
  } catch (err) {
    console.error('[getDistribucionCD]', err);
    return [];
  }
}

// ── Reportes financieros ─────────────────────────────────────────────────────

const ESTADOS_APROBADO_REP  = ['aprobado', 'aprobado_por_cliente'] as const;
const ESTADOS_RECHAZADO_REP = ['rechazado', 'rechazado_por_cliente'] as const;
const ESTADOS_CARTERA_REP   = ['enviado_a_cliente', 'visto_por_cliente'] as const;
const MESES_CORTOS_REP = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

type ReporteParams = { userId: string; desde?: string; hasta?: string };

export async function getReporteUtilidad({ userId, desde, hasta }: ReporteParams): Promise<ReporteUtilidad> {
  const VACIO: ReporteUtilidad = {
    utilidad_generada: 0, margen_promedio: 0, total_oferta_aprobada: 0,
    total_oferta_rechazada: 0, cartera_potencial: 0, tasa_cierre: 0,
    tiempo_promedio_aprobacion: 0,
  };
  try {
    const admin = createAdminClient();

    let aprobadosQ = admin.from('budgets')
      .select('id, utilidad_pct, created_at, updated_at')
      .eq('user_id', userId).is('deleted_at', null)
      .in('estado', [...ESTADOS_APROBADO_REP]);
    if (desde) aprobadosQ = aprobadosQ.gte('updated_at', desde);
    if (hasta) aprobadosQ = aprobadosQ.lte('updated_at', hasta);

    let rechazadosQ = admin.from('budgets')
      .select('id')
      .eq('user_id', userId).is('deleted_at', null)
      .in('estado', [...ESTADOS_RECHAZADO_REP]);
    if (desde) rechazadosQ = rechazadosQ.gte('updated_at', desde);
    if (hasta) rechazadosQ = rechazadosQ.lte('updated_at', hasta);

    const carteraQ = admin.from('budgets')
      .select('id')
      .eq('user_id', userId).is('deleted_at', null)
      .in('estado', [...ESTADOS_CARTERA_REP]);

    const [{ data: aprobados }, { data: rechazados }, { data: cartera }] =
      await Promise.all([aprobadosQ, rechazadosQ, carteraQ]);

    const aprobadosIds  = (aprobados  ?? []).map((b) => b.id);
    const rechazadosIds = (rechazados ?? []).map((b) => b.id);
    const carteraIds    = (cartera    ?? []).map((b) => b.id);
    const allIds = [...new Set([...aprobadosIds, ...rechazadosIds, ...carteraIds])];

    let resumenMap = new Map<string, { total_oferta: number }>();
    if (allIds.length > 0) {
      const { data } = await admin.from('v_resumen_presupuesto')
        .select('budget_id, total_oferta').in('budget_id', allIds);
      resumenMap = new Map((data ?? []).map((r) => [r.budget_id, r]));
    }

    let utilidadGen    = new Decimal(0);
    let ofertaAprobada = new Decimal(0);
    let sumMargen      = new Decimal(0);
    let sumDias        = new Decimal(0);
    let cnt            = 0;

    for (const b of aprobados ?? []) {
      const r = resumenMap.get(b.id);
      if (!r) continue;
      const oferta  = new Decimal(r.total_oferta ?? 0);
      const utilPct = new Decimal(b.utilidad_pct ?? 0);
      ofertaAprobada = ofertaAprobada.plus(oferta);
      utilidadGen    = utilidadGen.plus(oferta.times(utilPct).div(100));
      sumMargen      = sumMargen.plus(utilPct);
      sumDias        = sumDias.plus(
        new Decimal(new Date(b.updated_at).getTime() - new Date(b.created_at).getTime())
          .div(86400000)
      );
      cnt++;
    }

    let ofertaRechazada = new Decimal(0);
    for (const b of rechazados ?? []) {
      const r = resumenMap.get(b.id);
      if (r) ofertaRechazada = ofertaRechazada.plus(new Decimal(r.total_oferta ?? 0));
    }

    let carteraPot = new Decimal(0);
    for (const b of cartera ?? []) {
      const r = resumenMap.get(b.id);
      if (r) carteraPot = carteraPot.plus(new Decimal(r.total_oferta ?? 0));
    }

    const total = (aprobados?.length ?? 0) + (rechazados?.length ?? 0);
    return {
      utilidad_generada:           utilidadGen.toNumber(),
      margen_promedio:             cnt > 0 ? sumMargen.div(cnt).toNumber() : 0,
      total_oferta_aprobada:       ofertaAprobada.toNumber(),
      total_oferta_rechazada:      ofertaRechazada.toNumber(),
      cartera_potencial:           carteraPot.toNumber(),
      tasa_cierre:                 total > 0 ? new Decimal(aprobados?.length ?? 0).div(total).times(100).toNumber() : 0,
      tiempo_promedio_aprobacion:  cnt > 0 ? sumDias.div(cnt).toNumber() : 0,
    };
  } catch (err) {
    console.error('[getReporteUtilidad]', err);
    return VACIO;
  }
}

export async function getReportePorTipoObra({ userId, desde, hasta }: ReporteParams): Promise<ReporteTipoObra[]> {
  try {
    const admin = createAdminClient();

    let q = admin.from('budgets')
      .select('id, utilidad_pct, project_id')
      .eq('user_id', userId).is('deleted_at', null)
      .in('estado', [...ESTADOS_APROBADO_REP]);
    if (desde) q = q.gte('updated_at', desde);
    if (hasta) q = q.lte('updated_at', hasta);

    const { data: budgets } = await q;
    if (!budgets || budgets.length === 0) return [];

    const projectIds = [...new Set(budgets.map((b) => b.project_id))];
    const { data: projects } = await admin.from('projects')
      .select('id, tipo_obra').in('id', projectIds);
    const proyectoMap = new Map((projects ?? []).map((p) => [p.id, p]));

    const budgetIds = budgets.map((b) => b.id);
    const { data: resumenes } = await admin.from('v_resumen_presupuesto')
      .select('budget_id, total_oferta').in('budget_id', budgetIds);
    const resumenMap = new Map((resumenes ?? []).map((r) => [r.budget_id, r]));

    type Grupo = { total_oferta: Decimal; utilidad: Decimal; cantidad: number; sumMargen: Decimal };
    const grupos: Record<string, Grupo> = {};

    for (const b of budgets) {
      const r = resumenMap.get(b.id);
      if (!r) continue;
      const tipoObra = proyectoMap.get(b.project_id)?.tipo_obra ?? 'otro';
      const oferta   = new Decimal(r.total_oferta ?? 0);
      const utilPct  = new Decimal(b.utilidad_pct ?? 0);
      if (!grupos[tipoObra]) grupos[tipoObra] = { total_oferta: new Decimal(0), utilidad: new Decimal(0), cantidad: 0, sumMargen: new Decimal(0) };
      grupos[tipoObra].total_oferta = grupos[tipoObra].total_oferta.plus(oferta);
      grupos[tipoObra].utilidad     = grupos[tipoObra].utilidad.plus(oferta.times(utilPct).div(100));
      grupos[tipoObra].cantidad++;
      grupos[tipoObra].sumMargen    = grupos[tipoObra].sumMargen.plus(utilPct);
    }

    return Object.entries(grupos)
      .map(([tipo_obra, g]) => ({
        tipo_obra,
        total_oferta:   g.total_oferta.toNumber(),
        utilidad:       g.utilidad.toNumber(),
        cantidad:       g.cantidad,
        margen_promedio: g.cantidad > 0 ? g.sumMargen.div(g.cantidad).toNumber() : 0,
      }))
      .sort((a, b) => b.utilidad - a.utilidad);
  } catch (err) {
    console.error('[getReportePorTipoObra]', err);
    return [];
  }
}

export async function getReportePorCliente({ userId, desde, hasta }: ReporteParams): Promise<ReporteCliente[]> {
  try {
    const admin = createAdminClient();

    let q = admin.from('budgets')
      .select('id, utilidad_pct, project_id')
      .eq('user_id', userId).is('deleted_at', null)
      .in('estado', [...ESTADOS_APROBADO_REP]);
    if (desde) q = q.gte('updated_at', desde);
    if (hasta) q = q.lte('updated_at', hasta);

    const { data: budgets } = await q;
    if (!budgets || budgets.length === 0) return [];

    const projectIds = [...new Set(budgets.map((b) => b.project_id))];
    const { data: projects } = await admin.from('projects')
      .select('id, cliente_id').in('id', projectIds);
    const proyectoMap = new Map((projects ?? []).map((p) => [p.id, p]));

    const clienteIds = [...new Set((projects ?? []).map((p) => p.cliente_id).filter(Boolean))] as string[];
    let clienteMap = new Map<string, { nombre_razon_social: string }>();
    if (clienteIds.length > 0) {
      const { data: clientes } = await admin.from('clientes')
        .select('id, nombre_razon_social').in('id', clienteIds);
      clienteMap = new Map((clientes ?? []).map((c) => [c.id, c]));
    }

    const budgetIds = budgets.map((b) => b.id);
    const { data: resumenes } = await admin.from('v_resumen_presupuesto')
      .select('budget_id, total_oferta').in('budget_id', budgetIds);
    const resumenMap = new Map((resumenes ?? []).map((r) => [r.budget_id, r]));

    type Grupo = { nombre: string; total_oferta: Decimal; utilidad: Decimal; cantidad: number; sumMargen: Decimal };
    const grupos: Record<string, Grupo> = {};

    for (const b of budgets) {
      const r = resumenMap.get(b.id);
      if (!r) continue;
      const proyecto      = proyectoMap.get(b.project_id);
      const clienteId     = proyecto?.cliente_id ?? null;
      const clienteNombre = (clienteId ? clienteMap.get(clienteId)?.nombre_razon_social : null) ?? 'Sin cliente asignado';
      const key           = clienteId ?? '__sin_cliente__';
      const oferta        = new Decimal(r.total_oferta ?? 0);
      const utilPct       = new Decimal(b.utilidad_pct ?? 0);

      if (!grupos[key]) grupos[key] = { nombre: clienteNombre, total_oferta: new Decimal(0), utilidad: new Decimal(0), cantidad: 0, sumMargen: new Decimal(0) };
      grupos[key].total_oferta = grupos[key].total_oferta.plus(oferta);
      grupos[key].utilidad     = grupos[key].utilidad.plus(oferta.times(utilPct).div(100));
      grupos[key].cantidad++;
      grupos[key].sumMargen    = grupos[key].sumMargen.plus(utilPct);
    }

    return Object.values(grupos)
      .map((g) => ({
        cliente_nombre:    g.nombre,
        total_oferta:      g.total_oferta.toNumber(),
        utilidad:          g.utilidad.toNumber(),
        cantidad_proyectos: g.cantidad,
        margen_promedio:   g.cantidad > 0 ? g.sumMargen.div(g.cantidad).toNumber() : 0,
      }))
      .sort((a, b) => b.utilidad - a.utilidad)
      .slice(0, 8);
  } catch (err) {
    console.error('[getReportePorCliente]', err);
    return [];
  }
}

export async function getReporteTendencia({ userId }: { userId: string }): Promise<ReporteTendencia[]> {
  try {
    const admin  = createAdminClient();
    const hoy    = new Date();
    const desde  = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1).toISOString();

    const { data: budgets } = await admin.from('budgets')
      .select('id, utilidad_pct, updated_at')
      .eq('user_id', userId).is('deleted_at', null)
      .in('estado', [...ESTADOS_APROBADO_REP])
      .gte('updated_at', desde);

    const budgetIds = (budgets ?? []).map((b) => b.id);
    let resumenMap = new Map<string, { total_oferta: number }>();
    if (budgetIds.length > 0) {
      const { data } = await admin.from('v_resumen_presupuesto')
        .select('budget_id, total_oferta').in('budget_id', budgetIds);
      resumenMap = new Map((data ?? []).map((r) => [r.budget_id, r]));
    }

    type GrupoMes = { utilidad: Decimal; total_oferta: Decimal; cantidad: number };
    const grupos: Record<string, GrupoMes> = {};

    for (const b of budgets ?? []) {
      const r = resumenMap.get(b.id);
      if (!r) continue;
      const d   = new Date(b.updated_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const oferta  = new Decimal(r.total_oferta ?? 0);
      const utilPct = new Decimal(b.utilidad_pct ?? 0);
      if (!grupos[key]) grupos[key] = { utilidad: new Decimal(0), total_oferta: new Decimal(0), cantidad: 0 };
      grupos[key].utilidad     = grupos[key].utilidad.plus(oferta.times(utilPct).div(100));
      grupos[key].total_oferta = grupos[key].total_oferta.plus(oferta);
      grupos[key].cantidad++;
    }

    return Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const g   = grupos[key];
      return {
        mes:         `${MESES_CORTOS_REP[d.getMonth()]} ${d.getFullYear()}`,
        utilidad:    g ? g.utilidad.toNumber() : 0,
        total_oferta: g ? g.total_oferta.toNumber() : 0,
        cantidad:    g ? g.cantidad : 0,
      };
    });
  } catch (err) {
    console.error('[getReporteTendencia]', err);
    return [];
  }
}

export async function getPresupuestosVencimiento(): Promise<VencimientoItem[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: budgets } = await supabase
      .from('budgets')
      .select('id, titulo, estado, created_at, vigencia_dias')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .gt('vigencia_dias', 0);

    if (!budgets || budgets.length === 0) return [];

    const ahora = Date.now();
    const items: VencimientoItem[] = [];

    for (const b of budgets) {
      const fechaVence = new Date(b.created_at).getTime() + b.vigencia_dias * 86400000;
      const diasRestantes = Math.ceil((fechaVence - ahora) / 86400000);

      if (diasRestantes <= 30) {
        items.push({
          budget_id:       b.id,
          titulo:          b.titulo,
          estado:          b.estado,
          proyecto_nombre: null,
          vigencia_dias:   b.vigencia_dias,
          fecha_vence:     new Date(fechaVence).toISOString(),
          dias_restantes:  diasRestantes,
        });
      }
    }

    return items.sort((a, b) => a.dias_restantes - b.dias_restantes);
  } catch (err) {
    console.error('[getPresupuestosVencimiento]', err);
    return [];
  }
}
