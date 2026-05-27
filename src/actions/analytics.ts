'use server';

import { createClient } from '@/lib/supabase/server';

export interface KPIsGlobales {
  proyectos_en_progreso: number;
  proyectos_borrador: number;
  proyectos_por_estado: Record<string, number>;
  presupuestos_total: number;
  presupuestos_por_estado: Record<string, number>;
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

const VACIO_KPIS: KPIsGlobales = {
  proyectos_en_progreso: 0,
  proyectos_borrador: 0,
  proyectos_por_estado: {},
  presupuestos_total: 0,
  presupuestos_por_estado: {},
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

    return {
      proyectos_en_progreso: proyectosPorEstado['en_progreso'] ?? 0,
      proyectos_borrador: proyectosPorEstado['borrador'] ?? 0,
      proyectos_por_estado: proyectosPorEstado,
      presupuestos_total: presupuestos?.length ?? 0,
      presupuestos_por_estado: presupuestosPorEstado,
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
