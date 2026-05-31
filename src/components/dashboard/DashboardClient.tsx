'use client';

import { useState, useTransition } from 'react';
import {
  FolderKanban,
  DollarSign,
  Clock,
  CheckCircle,
  ChevronRight,
  AlertTriangle,
  BarChart2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { SelectorPeriodo } from '@/components/shared/SelectorPeriodo';
import CampanaNotificaciones from '@/components/dashboard/CampanaNotificaciones';
import {
  getKPIsGlobales,
  getDistribucionCD,
  type KPIsGlobales,
  type DistribucionCDItem,
  type VencimientoItem,
} from '@/actions/analytics';
import {
  type PeriodoPicker,
  getRangoPeriodo,
} from '@/lib/utils/periodos';

// Paleta obra
const MAT_COLOR = '#C84B1A';
const MO_COLOR  = '#2D5F8A';
const EQ_COLOR  = '#6B7B4A';
const HM_COLOR  = '#C8C0B5';

interface DashboardClientProps {
  initialKpis: KPIsGlobales;
  initialDistribucion: DistribucionCDItem[];
  vencimientos: VencimientoItem[];
  profile: { nombre_completo: string | null; empresa: string | null } | null;
}

export default function DashboardClient({
  initialKpis,
  initialDistribucion,
  vencimientos,
  profile,
}: DashboardClientProps) {
  const [periodo,      setPeriodo]      = useState<PeriodoPicker>('todo');
  const [kpis,         setKpis]         = useState<KPIsGlobales>(initialKpis);
  const [distribucion, setDistribucion] = useState<DistribucionCDItem[]>(initialDistribucion);
  const [isPending,    startTransition] = useTransition();

  function handlePeriodo(nuevo: PeriodoPicker) {
    setPeriodo(nuevo);
    const rango = getRangoPeriodo(nuevo);
    const opts  = rango
      ? { desde: rango.desde.toISOString(), hasta: rango.hasta.toISOString() }
      : {};
    startTransition(async () => {
      const [newKpis, newDist] = await Promise.all([
        getKPIsGlobales(opts),
        getDistribucionCD(opts),
      ]);
      setKpis(newKpis);
      setDistribucion(newDist);
    });
  }

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

  const safe   = (v: number) => totalCD > 0 ? Math.round((v / totalCD) * 100) : 0;
  const pctMat = safe(totalMaterial);
  const pctMO  = safe(totalManoObra);
  const pctEq  = safe(totalEquipo);
  const pctHM  = safe(totalHM + totalEPP);

  // ── Alertas ──
  const urgentes   = vencimientos.filter((v) => v.dias_restantes <= 7);
  const proximos   = vencimientos.filter((v) => v.dias_restantes > 7 && v.dias_restantes <= 15);
  const enRadar    = vencimientos.filter((v) => v.dias_restantes > 15 && v.dias_restantes <= 30);
  const enRevision = kpis.presupuestos_por_estado['en_revision'] ?? 0;
  const rechazados = kpis.presupuestos_por_estado['rechazado'] ?? 0;

  return (
    <div className={`space-y-6 transition-opacity duration-200 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[20px] font-semibold text-[#1C1814] leading-tight tracking-[-0.01em]">
            Panel de control
          </h1>
          <p className="text-[13px] text-[#7A7265] mt-0.5">
            {profile?.nombre_completo
              ? `Hola, ${profile.nombre_completo.split(' ')[0]} — resumen de tu actividad`
              : 'Resumen general de tu actividad'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <CampanaNotificaciones vencimientos={vencimientos} />
          <SelectorPeriodo value={periodo} onChange={handlePeriodo} />
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
          icon={<FolderKanban className="w-[16px] h-[16px]" style={{ color: '#C84B1A' }} />}
          iconBg="#FAF0EB"
          accentColor="#C84B1A"
          sparkColor="#C84B1A"
          sparkPath="M0 28 C8 24 16 14 24 16 C32 18 40 10 48 8 C56 6 62 12 70 10 C74 9 77 11 80 9"
        />
        <KPICard
          title="Presupuesto total"
          value={formatCurrency(kpis.valor_total_oferta)}
          sub={`CD: ${formatCurrency(kpis.valor_costo_directo)}`}
          icon={<DollarSign className="w-[16px] h-[16px]" style={{ color: '#C84B1A' }} />}
          iconBg="#FAF0EB"
          accentColor="#C84B1A"
          sparkColor="#C84B1A"
          sparkPath="M0 32 C10 26 18 18 28 13 C38 8 46 6 56 5 C66 4 72 8 80 6"
        />
        <KPICard
          title="Próximos a vencer"
          value={String(kpis.proximos_a_vencer)}
          sub="en los próximos 30 días"
          icon={<Clock className="w-[16px] h-[16px]" style={{ color: MO_COLOR }} />}
          iconBg="#E8F0F8"
          accentColor={MO_COLOR}
          sparkColor={MO_COLOR}
          sparkPath="M0 10 C8 12 16 20 24 22 C32 24 40 30 48 28 C56 26 62 22 70 24 C74 25 78 28 80 26"
        />
        <KPICard
          title="Tasa de aprobación"
          value={`${tasaAprobacion}%`}
          sub={`${presupuestosAprobados} de ${kpis.presupuestos_total} presupuestos`}
          icon={<CheckCircle className="w-[16px] h-[16px]" style={{ color: EQ_COLOR }} />}
          iconBg="#EDF2E8"
          accentColor={EQ_COLOR}
          sparkColor={EQ_COLOR}
          sparkPath="M0 30 C10 26 20 18 30 14 C40 10 50 8 60 6 C68 5 74 9 80 7"
        />
      </div>

      {/* ── Fila inferior ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.5fr_1.5fr] gap-4">

        {/* Distribución del Costo Directo */}
        <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 shadow-[0_1px_2px_0_rgba(28,24,20,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-[16px] h-[16px] text-[#7A7265]" />
              <h2 className="text-[13px] font-semibold text-[#1C1814]">
                Distribución del Costo Directo
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <DonutChart
              items={[
                { pct: pctMat, color: MAT_COLOR },
                { pct: pctMO,  color: MO_COLOR  },
                { pct: pctEq,  color: EQ_COLOR  },
                { pct: pctHM,  color: HM_COLOR  },
              ]}
            />
            <div className="flex-1 space-y-3">
              {([
                { label: 'Materiales',   pct: pctMat, amount: totalMaterial,      color: MAT_COLOR },
                { label: 'Mano de obra', pct: pctMO,  amount: totalManoObra,      color: MO_COLOR  },
                { label: 'Equipos',      pct: pctEq,  amount: totalEquipo,        color: EQ_COLOR  },
                { label: 'Herramientas', pct: pctHM,  amount: totalHM + totalEPP, color: HM_COLOR  },
              ] as const).map(({ label, pct, amount, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-[12px] text-[#3D3530] flex-1 min-w-0">{label}</span>
                  <span
                    className="text-[12px] font-semibold text-[#1C1814] shrink-0 w-8 text-right"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {pct}%
                  </span>
                  <span
                    className="text-[11px] text-[#7A7265] shrink-0 w-[72px] text-right"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-[#EAE6E0]">
            <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#A89F96]">
              Total CD
            </span>
            <span
              className="text-[15px] font-semibold"
              style={{ color: MAT_COLOR, fontFamily: 'var(--font-mono)' }}
            >
              {formatCurrency(totalCD)}
            </span>
          </div>
        </div>

        {/* Estados de proyectos */}
        <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 shadow-[0_1px_2px_0_rgba(28,24,20,0.04)]">
          <div className="flex items-center gap-2 mb-5">
            <FolderKanban className="w-[16px] h-[16px] text-[#7A7265]" />
            <h2 className="text-[13px] font-semibold text-[#1C1814]">Estados de proyectos</h2>
          </div>

          <div className="space-y-3.5">
            {([
              { key: 'en_progreso', label: 'En progreso', color: MAT_COLOR },
              { key: 'borrador',    label: 'Borrador',    color: '#8BA3B8' },
              { key: 'finalizado',  label: 'Finalizados', color: EQ_COLOR  },
              { key: 'archivado',   label: 'Archivados',  color: HM_COLOR  },
            ] as const).map(({ key, label, color }) => {
              const count = kpis.proyectos_por_estado[key] ?? 0;
              const pct   = totalProyectos > 0 ? (count / totalProyectos) * 100 : 0;
              return (
                <div key={key} className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-[12px] text-[#3D3530] w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-[#EAE6E0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <span
                    className="text-[12px] font-semibold text-[#1C1814] w-4 text-right shrink-0"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-[#EAE6E0]">
            <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#A89F96]">
              Total proyectos
            </span>
            <span
              className="text-[15px] font-semibold text-[#1C1814]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {totalProyectos}
            </span>
          </div>
        </div>

        {/* Alertas críticas */}
        <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 shadow-[0_1px_2px_0_rgba(28,24,20,0.04)]">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-[16px] h-[16px] text-[#7A7265]" />
            <h2 className="text-[13px] font-semibold text-[#1C1814]">Alertas críticas</h2>
          </div>

          <div className="space-y-2">
            {urgentes.length > 0 && (
              <AlertCard
                count={urgentes.length}
                message={`presupuesto${urgentes.length !== 1 ? 's' : ''} vence${urgentes.length !== 1 ? 'n' : ''} esta semana`}
                sub="Requieren atención inmediata"
                color="oxide"
              />
            )}
            {proximos.length > 0 && (
              <AlertCard
                count={proximos.length}
                message={`presupuesto${proximos.length !== 1 ? 's' : ''} vence${proximos.length !== 1 ? 'n' : ''} en 15 días`}
                sub="Revisar fechas de entrega"
                color="gold"
              />
            )}
            {enRadar.length > 0 && (
              <AlertCard
                count={enRadar.length}
                message={`presupuesto${enRadar.length !== 1 ? 's' : ''} vence${enRadar.length !== 1 ? 'n' : ''} este mes`}
                sub="Seguimiento recomendado"
                color="steel"
              />
            )}
            {enRevision > 0 && (
              <AlertCard
                count={enRevision}
                message="en revisión pendientes de aprobación"
                sub="En espera de cliente"
                color="gold"
              />
            )}
            {rechazados > 0 && (
              <AlertCard
                count={rechazados}
                message={`rechazado${rechazados !== 1 ? 's' : ''} pendiente${rechazados !== 1 ? 's' : ''} correcciones`}
                sub="Correcciones solicitadas"
                color="steel"
              />
            )}
            {urgentes.length === 0 && proximos.length === 0 && enRadar.length === 0 && enRevision === 0 && rechazados === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="w-8 h-8 text-[#C8C0B5] mb-2" />
                <p className="text-[12px] text-[#A89F96]">Sin alertas activas</p>
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
  title, value, sub, icon, iconBg, accentColor, sparkColor, sparkPath,
}: {
  title: string; value: string; sub: string;
  icon: React.ReactNode; iconBg: string; accentColor: string;
  sparkColor: string; sparkPath: string;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-[#E8E4DE] border-l-[3px] p-4 shadow-[0_1px_2px_0_rgba(28,24,20,0.04)]"
      style={{ borderLeftColor: accentColor }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#A89F96] leading-none">
          {title}
        </p>
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          {icon}
        </div>
      </div>
      <p
        className="text-base sm:text-xl md:text-[28px] font-semibold text-[#1C1814] leading-tight mb-1 break-all"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {value}
      </p>
      <div className="flex items-end justify-between gap-2 mt-3">
        <p className="text-[11px] text-[#A89F96] leading-tight min-w-0 truncate">{sub}</p>
        <svg width="56" height="24" viewBox="0 0 80 40" className="shrink-0 -mb-0.5 opacity-60" aria-hidden>
          <path d={sparkPath} fill="none" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────────

function DonutChart({ items }: { items: { pct: number; color: string }[] }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const GAP = 4;
  const total  = items.reduce((s, i) => s + i.pct, 0);
  const active = items.filter((i) => i.pct > 0);
  let cumulativeArc = 0;

  return (
    <div className="relative w-[130px] h-[130px] shrink-0">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#EAE6E0" strokeWidth="14" />
        {total > 0 && active.length > 0 && active.map(({ pct, color }, idx) => {
          const arc     = (pct / total) * C;
          const gap     = active.length > 1 ? GAP : 0;
          const dashLen = Math.max(0, arc - gap);
          const offset  = cumulativeArc;
          cumulativeArc += arc;
          return (
            <circle
              key={idx} cx="70" cy="70" r={R} fill="none"
              stroke={color} strokeWidth="14" strokeLinecap="round"
              strokeDasharray={`${dashLen} ${C - dashLen}`}
              strokeDashoffset={-offset}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ── AlertCard ─────────────────────────────────────────────────────────────────

function AlertCard({ count, message, sub, color }: {
  count: number; message: string; sub: string; color: 'oxide' | 'gold' | 'steel';
}) {
  const cfg = {
    oxide: { bg: '#FAF0EB', border: '#E8956A', accent: '#C84B1A', countBg: '#C84B1A' },
    gold:  { bg: '#FEF9EC', border: '#E8C870', accent: '#8C5E00', countBg: '#B8821A' },
    steel: { bg: '#E8F0F8', border: '#8BA3B8', accent: '#2D5F8A', countBg: '#2D5F8A' },
  }[color];

  return (
    <div
      className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold text-white shrink-0"
          style={{ background: cfg.countBg, fontFamily: 'var(--font-mono)' }}
        >
          {count}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-medium leading-snug truncate" style={{ color: cfg.accent }}>
            {message}
          </p>
          <p className="text-[10px] mt-0.5 leading-tight opacity-70" style={{ color: cfg.accent }}>
            {sub}
          </p>
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" style={{ color: cfg.accent }} />
    </div>
  );
}
