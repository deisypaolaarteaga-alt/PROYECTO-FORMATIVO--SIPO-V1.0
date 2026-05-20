import { createClient } from '@/lib/supabase/server';
import { formatCurrency, cn } from '@/lib/utils';
import Link from 'next/link';
import { PresupuestosNewButton } from '@/components/presupuestos/PresupuestosNewButton';
import { PresupuestosTable } from '@/components/presupuestos/PresupuestosTable';

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

const ESTADOS = [
  { key: 'todos',       label: 'Todos'       },
  { key: 'borrador',    label: 'Borrador'    },
  { key: 'en_revision', label: 'En revisión' },
  { key: 'aprobado',    label: 'Aprobado'    },
  { key: 'rechazado',   label: 'Rechazado'   },
  { key: 'archivado',   label: 'Archivado'   },
];

export default async function PresupuestosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado: estadoParam } = await searchParams;
  const filtro = estadoParam && estadoParam !== 'todos' ? estadoParam : null;

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
  const totalAprobados = (allBudgets ?? []).filter((b) => b.estado === 'aprobado').length;
  const totalRevision = (allBudgets ?? []).filter((b) => b.estado === 'en_revision').length;

  let query = supabase
    .from('budgets')
    .select('id, titulo, estado, created_at, vigencia_dias')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filtro) query = query.eq('estado', filtro);

  const { data: listBudgets } = await query;
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
  const rows = (listBudgets ?? []).map((b) => {
    const resumen = resumenMap[b.id] ?? { costo_directo: 0, total_oferta: 0 };
    const diasRestantes = b.vigencia_dias > 0
      ? Math.ceil((new Date(b.created_at).getTime() + b.vigencia_dias * 86400000 - ahora) / 86400000)
      : null;
    return { ...b, ...resumen, diasRestantes };
  });

  const estadoActivo = estadoParam ?? 'todos';

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
          sub={`${allBudgets?.length ?? 0} presupuestos en total`}
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
            allBudgets?.length
              ? formatCurrency(globalTotalOferta / allBudgets.length)
              : formatCurrency(0)
          }
          sub="Valor medio de cotizaciones"
        />
      </div>

      <div className="flex items-center border-b border-[#E5E7EB] overflow-x-auto">
        {ESTADOS.map(({ key, label }) => {
          const active = estadoActivo === key;
          const count =
            key === 'todos'
              ? allBudgets?.length ?? 0
              : allBudgets?.filter((b) => b.estado === key).length ?? 0;

          return (
            <Link
              key={key}
              href={key === 'todos' ? '/presupuestos' : `/presupuestos?estado=${key}`}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-all border-b-2 -mb-px shrink-0',
                active
                  ? 'border-[#D95510] text-[#D95510]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-200'
              )}
            >
              {label}
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-bold tabular-nums',
                  active ? 'bg-[#D95510] text-white' : 'bg-neutral-100 text-neutral-500'
                )}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── Contenido: Data Table Paginada ─────────────────────────────────────────── */}
      <PresupuestosTable rows={rows} filtro={filtro} />
    </div>
  );
}
