import { createClient } from '@/lib/supabase/server';
import CampanaNotificaciones from '@/components/dashboard/CampanaNotificaciones';

export const revalidate = 30;
import { formatCurrency } from '@/lib/utils';
import {
  FolderKanban,
  DollarSign,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  BarChart2,
  Calendar,
} from 'lucide-react';
import {
  getKPIsGlobales,
  getDistribucionCD,
  getPresupuestosVencimiento,
} from '@/actions/analytics';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profile, , kpis, distribucion, vencimientos] = await Promise.all([
    supabase
      .from('profiles')
      .select('nombre_completo, empresa')
      .eq('id', user?.id ?? '')
      .maybeSingle()
      .then((r) => r.data),
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user?.id ?? '')
      .order('updated_at', { ascending: false })
      .limit(5)
      .then((r) => r.data),
    getKPIsGlobales(),
    getDistribucionCD(),
    getPresupuestosVencimiento(),
  ]);

  // ── KPI derivadas ──
  const presupuestosAprobados = kpis.presupuestos_por_estado['aprobado'] ?? 0;
  const proyectosEnObra       = kpis.proyectos_en_progreso;
  const tasaAprobacion        = kpis.presupuestos_total > 0
    ? Math.round((presupuestosAprobados / kpis.presupuestos_total) * 100)
    : 0;
  const totalProyectos = Object.values(kpis.proyectos_por_estado).reduce((s, n) => s + n, 0);

  // ── Distribución CD ──
  const totalMaterial = distribucion.reduce((s, d) => s + d.material, 0);
  const totalManoObra = distribucion.reduce((s, d) => s + d.mano_obra, 0);
  const totalEquipo   = distribucion.reduce((s, d) => s + d.equipo, 0);
  const totalHM       = distribucion.reduce((s, d) => s + d.herramienta_menor, 0);
  const totalEPP      = distribucion.reduce((s, d) => s + d.epp, 0);
  const totalCD = totalMaterial + totalManoObra + totalEquipo + totalHM + totalEPP
    || kpis.valor_costo_directo;

  const safe      = (v: number) => totalCD > 0 ? Math.round((v / totalCD) * 100) : 0;
  const pctMat    = safe(totalMaterial);
  const pctMO     = safe(totalManoObra);
  const pctEq     = safe(totalEquipo);
  const pctHM     = safe(totalHM + totalEPP);

  // ── Alertas ──
  const urgentes   = vencimientos.filter((v) => v.dias_restantes <= 7);
  const proximos   = vencimientos.filter((v) => v.dias_restantes > 7 && v.dias_restantes <= 15);
  const enRadar    = vencimientos.filter((v) => v.dias_restantes > 15 && v.dias_restantes <= 30);
  const enRevision = kpis.presupuestos_por_estado['en_revision'] ?? 0;
  const rechazados = kpis.presupuestos_por_estado['rechazado'] ?? 0;

  // ── Fecha rango (mes actual) ──
  const ahora     = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const finMes    = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
  const fmtCorto  = (d: Date) =>
    d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', timeZone: 'America/Bogota' });
  const rangoFecha = `${fmtCorto(inicioMes)} - ${fmtCorto(finMes)} ${ahora.getFullYear()}`;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827] leading-tight">Dashboard</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            {profile?.nombre_completo
              ? `Hola, ${profile.nombre_completo.split(' ')[0]} — resumen de tu actividad`
              : 'Resumen general de tu actividad'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <CampanaNotificaciones vencimientos={vencimientos} />
          {/* Rango de fecha */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white">
            <Calendar className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
            <span className="text-[12px] text-[#374151] whitespace-nowrap">{rangoFecha}</span>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Proyectos activos"
          value={String(proyectosEnObra + (kpis.proyectos_borrador ?? 0))}
          sub={
            kpis.proyectos_borrador > 0
              ? `+ ${kpis.proyectos_borrador} en borrador`
              : 'proyectos en curso'
          }
          icon={<FolderKanban className="w-[18px] h-[18px] text-[#D95510]" />}
          iconBg="bg-[#FFF4EE]"
          accent="border-l-[#D95510]"
          sparkColor="#D95510"
          sparkPath="M0 28 C8 24 16 14 24 16 C32 18 40 10 48 8 C56 6 62 12 70 10 C74 9 77 11 80 9"
        />
        <KPICard
          title="Presupuesto total"
          value={formatCurrency(kpis.valor_total_oferta)}
          sub={`CD: ${formatCurrency(kpis.valor_costo_directo)}`}
          icon={<DollarSign className="w-[18px] h-[18px] text-[#D95510]" />}
          iconBg="bg-[#FFF4EE]"
          accent="border-l-[#D95510]"
          sparkColor="#D95510"
          sparkPath="M0 32 C10 26 18 18 28 13 C38 8 46 6 56 5 C66 4 72 8 80 6"
        />
        <KPICard
          title="Próximos a vencer"
          value={String(kpis.proximos_a_vencer)}
          sub="en los próximos 30 días"
          icon={<Clock className="w-[18px] h-[18px] text-[#0284C7]" />}
          iconBg="bg-[#EFF6FF]"
          accent="border-l-[#0284C7]"
          sparkColor="#0284C7"
          sparkPath="M0 10 C8 12 16 20 24 22 C32 24 40 30 48 28 C56 26 62 22 70 24 C74 25 78 28 80 26"
        />
        <KPICard
          title="Tasa de aprobación"
          value={`${tasaAprobacion}%`}
          sub={`${presupuestosAprobados} de ${kpis.presupuestos_total} presupuestos`}
          icon={<CheckCircle className="w-[18px] h-[18px] text-[#059669]" />}
          iconBg="bg-[#F0FDF4]"
          accent="border-l-[#16A34A]"
          sparkColor="#059669"
          sparkPath="M0 30 C10 26 20 18 30 14 C40 10 50 8 60 6 C68 5 74 9 80 7"
        />
      </div>

      {/* ── Fila inferior ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.5fr_1.5fr] gap-4">
        {/* Distribución del Costo Directo */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-[18px] h-[18px] text-[#6B7280]" />
              <h2 className="text-[14px] font-semibold text-[#111827]">
                Distribución del Costo Directo (CD)
              </h2>
            </div>
            <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
          </div>

          <div className="flex items-center gap-8">
            <DonutChart
              items={[
                { pct: pctMat, color: '#D95510' },
                { pct: pctMO,  color: '#1E6FB8' },
                { pct: pctEq,  color: '#2D7A45' },
                { pct: pctHM,  color: '#D1D5DB' },
              ]}
            />
            <div className="flex-1 space-y-3.5">
              {([
                { label: 'Materiales',   pct: pctMat, amount: totalMaterial,       color: '#D95510' },
                { label: 'Mano de Obra', pct: pctMO,  amount: totalManoObra,       color: '#1E6FB8' },
                { label: 'Equipos',      pct: pctEq,  amount: totalEquipo,         color: '#2D7A45' },
                { label: 'Herramientas', pct: pctHM,  amount: totalHM + totalEPP,  color: '#D1D5DB' },
              ] as const).map(({ label, pct, amount, color }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-[12px] text-[#374151] flex-1 min-w-0">{label}</span>
                  <span className="text-[12px] font-semibold text-[#111827] shrink-0">{pct}%</span>
                  <span className="text-[11px] text-[#6B7280] shrink-0 w-[76px] text-right">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-[#F3F4F6]">
            <span className="text-[12px] font-medium text-[#6B7280]">Total CD</span>
            <span className="text-[15px] font-bold text-[#D95510]">
              {formatCurrency(totalCD)}
            </span>
          </div>
        </div>

        {/* Estados de proyectos */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-5">
            <FolderKanban className="w-[18px] h-[18px] text-[#6B7280]" />
            <h2 className="text-[14px] font-semibold text-[#111827]">Estados de proyectos</h2>
          </div>

          <div className="space-y-3.5">
            {([
              { key: 'en_progreso', label: 'En progreso', color: '#D95510' },
              { key: 'borrador',    label: 'Borrador',    color: '#6B7280' },
              { key: 'finalizado',  label: 'Finalizados', color: '#059669' },
              { key: 'archivado',   label: 'Archivados',  color: '#D1D5DB' },
            ] as const).map(({ key, label, color }) => {
              const count = kpis.proyectos_por_estado[key] ?? 0;
              const pct   = totalProyectos > 0 ? (count / totalProyectos) * 100 : 0;
              return (
                <div key={key} className="flex items-center gap-2.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-[12px] text-[#374151] w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <span className="text-[12px] font-semibold text-[#111827] w-4 text-right shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-[#F3F4F6]">
            <span className="text-[12px] text-[#6B7280]">Total proyectos</span>
            <span className="text-[15px] font-bold text-[#111827]">{totalProyectos}</span>
          </div>
        </div>

        {/* Alertas críticas */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-[18px] h-[18px] text-[#6B7280]" />
            <h2 className="text-[14px] font-semibold text-[#111827]">Alertas críticas</h2>
          </div>

          <div className="space-y-2.5">
            {urgentes.length > 0 && (
              <AlertCard
                count={urgentes.length}
                message={`presupuesto${urgentes.length !== 1 ? 's' : ''} vence${urgentes.length !== 1 ? 'n' : ''} esta semana`}
                sub="Requieren atención inmediata"
                color="red"
              />
            )}
            {proximos.length > 0 && (
              <AlertCard
                count={proximos.length}
                message={`presupuesto${proximos.length !== 1 ? 's' : ''} vence${proximos.length !== 1 ? 'n' : ''} en 15 días`}
                sub="Revisar fechas de entrega"
                color="orange"
              />
            )}
            {enRadar.length > 0 && (
              <AlertCard
                count={enRadar.length}
                message={`presupuesto${enRadar.length !== 1 ? 's' : ''} vence${enRadar.length !== 1 ? 'n' : ''} este mes`}
                sub="Seguimiento recomendado"
                color="blue"
              />
            )}
            {enRevision > 0 && (
              <AlertCard
                count={enRevision}
                message="en revisión hace más de 15 días"
                sub="Pendientes de aprobación"
                color="orange"
              />
            )}
            {rechazados > 0 && (
              <AlertCard
                count={rechazados}
                message={`rechazado${rechazados !== 1 ? 's' : ''} pendiente${rechazados !== 1 ? 's' : ''} correcciones`}
                sub="Correcciones solicitadas por el cliente"
                color="blue"
              />
            )}
            {urgentes.length === 0 && proximos.length === 0 && enRadar.length === 0 && enRevision === 0 && rechazados === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="w-8 h-8 text-[#D1D5DB] mb-2" />
                <p className="text-[12px] text-[#9CA3AF]">Sin alertas activas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── KPICard ───────────────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  sub,
  icon,
  iconBg,
  accent,
  sparkColor,
  sparkPath,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  accent: string;
  sparkColor: string;
  sparkPath: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E5E7EB] border-l-4 ${accent} p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[12px] font-medium text-[#6B7280] leading-tight">{title}</p>
        <div
          className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 ml-2`}
        >
          {icon}
        </div>
      </div>
      <p className="text-[30px] font-bold text-[#111827] leading-none mb-4 tabular-nums">{value}</p>
      <div className="flex items-end justify-between gap-2">
        <p className="text-[11px] text-[#9CA3AF] leading-tight min-w-0">{sub}</p>
        <svg
          width="72"
          height="32"
          viewBox="0 0 80 40"
          className="shrink-0 -mb-1"
          aria-hidden="true"
        >
          <path
            d={sparkPath}
            fill="none"
            stroke={sparkColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        </svg>
      </div>
    </div>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────────

function DonutChart({ items }: { items: { pct: number; color: string }[] }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const GAP = 5;

  const total = items.reduce((s, i) => s + i.pct, 0);
  const active = items.filter((i) => i.pct > 0);

  let cumulativeArc = 0;

  return (
    <div className="relative w-[140px] h-[140px] shrink-0">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        {/* Track */}
        <circle cx="70" cy="70" r={R} fill="none" stroke="#F3F4F6" strokeWidth="16" />
        {total === 0 || active.length === 0
          ? null
          : active.map(({ pct, color }, idx) => {
              const arc = (pct / total) * C;
              const gap = active.length > 1 ? GAP : 0;
              const dashLen = Math.max(0, arc - gap);
              const startOffset = cumulativeArc;
              cumulativeArc += arc;
              return (
                <circle
                  key={idx}
                  cx="70" cy="70" r={R}
                  fill="none"
                  stroke={color}
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${dashLen} ${C - dashLen}`}
                  strokeDashoffset={-startOffset}
                />
              );
            })}
      </svg>
    </div>
  );
}

// ── AlertCard ─────────────────────────────────────────────────────────────────

function AlertCard({
  count,
  message,
  sub,
  color,
}: {
  count: number;
  message: string;
  sub: string;
  color: 'red' | 'orange' | 'blue';
}) {
  const cfg = {
    red:    { bg: 'bg-[#FEF2F2]', border: 'border-[#FECACA]', accent: '#DC2626' },
    orange: { bg: 'bg-[#FFF7ED]', border: 'border-[#FED7AA]', accent: '#EA580C' },
    blue:   { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', accent: '#2563EB' },
  }[color];

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3 ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <span
          className="w-2 h-2 rounded-full mt-[3px] shrink-0"
          style={{ background: cfg.accent }}
        />
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[#111827] leading-snug">
            <span style={{ color: cfg.accent }}>{count}</span> {message}
          </p>
          <p className="text-[10px] text-[#6B7280] mt-0.5 leading-tight">{sub}</p>
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
    </div>
  );
}
