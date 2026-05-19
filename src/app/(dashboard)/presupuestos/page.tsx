import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { PresupuestosNewButton } from '@/components/presupuestos/PresupuestosNewButton';

export const revalidate = 30;

// ── Constantes ────────────────────────────────────────────────────────────────

const ESTADOS = [
  { key: 'todos',       label: 'Todos'       },
  { key: 'borrador',    label: 'Borrador'    },
  { key: 'en_revision', label: 'En revisión' },
  { key: 'aprobado',    label: 'Aprobado'    },
  { key: 'rechazado',   label: 'Rechazado'   },
  { key: 'archivado',   label: 'Archivado'   },
];

const BADGE: Record<string, { bg: string; text: string; label: string }> = {
  borrador:    { bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]', label: 'Borrador'    },
  en_revision: { bg: 'bg-[#FFF7ED]', text: 'text-[#EA580C]', label: 'En revisión' },
  aprobado:    { bg: 'bg-[#F0FDF4]', text: 'text-[#059669]', label: 'Aprobado'    },
  rechazado:   { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', label: 'Rechazado'   },
  archivado:   { bg: 'bg-[#F3F4F6]', text: 'text-[#9CA3AF]', label: 'Archivado'   },
};

// ── Page ──────────────────────────────────────────────────────────────────────

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

  // Budgets del usuario
  let query = supabase
    .from('budgets')
    .select('id, titulo, estado, created_at, vigencia_dias')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filtro) query = query.eq('estado', filtro);

  const { data: budgets } = await query;

  // Datos financieros desde la vista
  const ids = (budgets ?? []).map((b) => b.id);
  const { data: resumenes } = ids.length > 0
    ? await supabase
        .from('v_resumen_presupuesto')
        .select('budget_id, costo_directo, total_oferta')
        .in('budget_id', ids)
    : { data: [] };

  const resumenMap: Record<string, { costo_directo: number; total_oferta: number }> = {};
  for (const r of resumenes ?? []) {
    resumenMap[r.budget_id] = {
      costo_directo: Number(r.costo_directo ?? 0),
      total_oferta:  Number(r.total_oferta  ?? 0),
    };
  }

  const ahora = Date.now();
  const rows = (budgets ?? []).map((b) => {
    const resumen = resumenMap[b.id] ?? { costo_directo: 0, total_oferta: 0 };
    const diasRestantes = b.vigencia_dias > 0
      ? Math.ceil((new Date(b.created_at).getTime() + b.vigencia_dias * 86400000 - ahora) / 86400000)
      : null;
    return { ...b, ...resumen, diasRestantes };
  });

  const estadoActivo = estadoParam ?? 'todos';

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827] leading-tight">Presupuestos</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            {rows.length} presupuesto{rows.length !== 1 ? 's' : ''}
            {filtro ? ` · ${BADGE[filtro]?.label ?? filtro}` : ' en total'}
          </p>
        </div>
        <PresupuestosNewButton />
      </div>

      {/* ── Filtros de estado ── */}
      <div className="flex gap-2 flex-wrap">
        {ESTADOS.map(({ key, label }) => (
          <Link
            key={key}
            href={key === 'todos' ? '/presupuestos' : `/presupuestos?estado=${key}`}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border ${
              estadoActivo === key
                ? 'bg-[#D95510] text-white border-[#D95510]'
                : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#D95510] hover:text-[#D95510]'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* ── Tabla / Empty state ── */}
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFF4EE] flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#D95510]" />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-[#111827]">Sin presupuestos</p>
            <p className="text-[13px] text-[#6B7280] mt-1">
              {filtro ? 'No hay presupuestos con este estado.' : 'Crea tu primer presupuesto para empezar.'}
            </p>
          </div>
          {!filtro && <PresupuestosNewButton />}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          {/* Encabezado columnas */}
          <div className="hidden md:grid grid-cols-[1fr_108px_128px_128px_108px_72px] gap-4 px-5 py-2.5 border-b border-[#F3F4F6] bg-[#F9FAFB]">
            {['Presupuesto', 'Estado', 'Costo directo', 'Total oferta', 'Creado', 'Vigencia'].map((col, i) => (
              <span
                key={col}
                className={`text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide ${i >= 2 && i <= 3 ? 'text-right' : i === 5 ? 'text-right' : ''}`}
              >
                {col}
              </span>
            ))}
          </div>

          {/* Filas */}
          <ul>
            {rows.map((r) => {
              const badge = BADGE[r.estado] ?? BADGE['borrador'];
              const diasColor =
                r.diasRestantes === null   ? 'text-[#9CA3AF]'
                : r.diasRestantes <= 0    ? 'text-[#DC2626] font-semibold'
                : r.diasRestantes <= 7    ? 'text-[#DC2626]'
                : r.diasRestantes <= 15   ? 'text-[#EA580C]'
                : 'text-[#6B7280]';

              return (
                <li key={r.id} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                  <Link
                    href={`/presupuestos/${r.id}`}
                    className="flex md:grid md:grid-cols-[1fr_108px_128px_128px_108px_72px] gap-4 px-5 py-3.5 items-center flex-wrap"
                  >
                    <span className="text-[13px] font-medium text-[#111827] truncate min-w-0">
                      {r.titulo}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium w-fit ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                    <span className="text-[12px] text-[#6B7280] md:text-right">
                      {formatCurrency(r.costo_directo)}
                    </span>
                    <span className="text-[13px] font-semibold text-[#111827] md:text-right">
                      {formatCurrency(r.total_oferta)}
                    </span>
                    <span className="text-[12px] text-[#6B7280]">
                      {new Date(r.created_at).toLocaleDateString('es-CO', {
                        day:      '2-digit',
                        month:    'short',
                        year:     'numeric',
                        timeZone: 'America/Bogota',
                      })}
                    </span>
                    <span className={`text-[12px] md:text-right ${diasColor}`}>
                      {r.diasRestantes === null
                        ? '—'
                        : r.diasRestantes <= 0
                        ? 'Vencido'
                        : `${r.diasRestantes}d`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
