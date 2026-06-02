export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { formatCurrency, cn } from '@/lib/utils';
import { PresupuestosNewButton } from '@/components/presupuestos/PresupuestosNewButton';
import { PresupuestosClientList } from '@/components/presupuestos/PresupuestosClientList';
import type { BudgetRow } from '@/components/presupuestos/PresupuestosClientList';

export const revalidate = 30;

// ── KPI Card Component ────────────────────────────────────────────────────────
function KPICard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-[#E5E7EB] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] px-5 py-4 flex flex-col',
        highlight && 'border-l-[3px] border-l-[#D95510]'
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-1.5 leading-none">
        {label}
      </p>
      <p className="text-[21px] font-bold tabular-nums leading-none text-[#111827] flex-1">
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-[#9CA3AF] mt-2 leading-none">{sub}</p>
      )}
    </div>
  );
}

export default async function PresupuestosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: allBudgets } = await supabase
    .from('budgets')
    .select('id, estado, created_at, vigencia_dias')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  const allIds = (allBudgets ?? []).map((b) => b.id);
  const { data: allResumenes } = allIds.length > 0
    ? await supabase
        .from('v_resumen_presupuesto')
        .select('budget_id, total_oferta')
        .in('budget_id', allIds)
    : { data: [] };

  const globalTotalOferta = (allResumenes ?? []).reduce(
    (acc, r) => acc + Number(r.total_oferta ?? 0),
    0
  );
  const conValor   = (allResumenes ?? []).filter((r) => Number(r.total_oferta ?? 0) > 0).length;
  const sinValorar = (allBudgets?.length ?? 0) - conValor;
  const totalAprobados = (allBudgets ?? []).filter((b) => b.estado === 'aprobado').length;
  const totalRevision = (allBudgets ?? []).filter((b) => b.estado === 'en_revision').length;

  const { data: listBudgets } = await supabase
    .from('budgets')
    .select('id, titulo, estado, created_at, vigencia_dias, project_id, administracion_pct, imprevistos_pct, utilidad_pct, projects(tipo_obra, nombre)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  const listIds = (listBudgets ?? []).map((b) => b.id);
  
  const { data: listResumenes } = listIds.length > 0
    ? await supabase
        .from('v_resumen_presupuesto')
        .select('budget_id, costo_directo, total_oferta')
        .in('budget_id', listIds)
    : { data: [] };

  const resumenMap: Record<string, { costo_directo: number; total_oferta: number }> = {};
  for (const r of listResumenes ?? []) {
    resumenMap[r.budget_id] = {
      costo_directo: Number(r.costo_directo ?? 0),
      total_oferta:  Number(r.total_oferta  ?? 0),
    };
  }

  const ahora = Date.now();
  const rows: BudgetRow[] = (listBudgets ?? []).map((b) => {
    const resumen = resumenMap[b.id] ?? { costo_directo: 0, total_oferta: 0 };
    const diasRestantes = b.vigencia_dias > 0
      ? Math.ceil((new Date(b.created_at).getTime() + b.vigencia_dias * 86400000 - ahora) / 86400000)
      : null;
    const proyecto_nombre = (b.projects as any)?.nombre   ?? null;
    const tipo_obra       = (b.projects as any)?.tipo_obra ?? null;
    return {
      id:                b.id,
      titulo:            b.titulo,
      estado:            b.estado,
      created_at:        b.created_at,
      vigencia_dias:     b.vigencia_dias,
      diasRestantes,
      proyecto_nombre,
      project_id:        b.project_id,
      tipo_obra,
      costo_directo:     resumen.costo_directo,
      total_oferta:      resumen.total_oferta,
      administracion_pct: Number(b.administracion_pct ?? 10),
      imprevistos_pct:    Number(b.imprevistos_pct   ?? 5),
      utilidad_pct:       Number(b.utilidad_pct      ?? 10),
    };
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827] leading-tight">
            Presupuestos
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Gestión y seguimiento de cotizaciones
          </p>
        </div>
        <div className="shrink-0">
          <PresupuestosNewButton />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Total Presupuestado"
          value={formatCurrency(globalTotalOferta)}
          sub={`${conValor} con valor · ${sinValorar} sin valorar`}
          highlight
        />
        <KPICard
          label="Aprobados"
          value={String(totalAprobados)}
          sub="Listos para ejecución"
        />
        <KPICard
          label="En Revisión"
          value={String(totalRevision)}
          sub="Pendientes de validación"
        />
        <KPICard
          label="Promedio por pto."
          value={
            conValor > 0
              ? formatCurrency(globalTotalOferta / conValor)
              : formatCurrency(0)
          }
          sub="Valor medio de cotizaciones"
        />
      </div>

      <PresupuestosClientList rows={rows} />
    </div>
  );
}
