'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Clock,
  Target,
  BarChart2,
} from 'lucide-react';
import { SelectorPeriodo } from '@/components/shared/SelectorPeriodo';
import {
  getReporteUtilidad,
  getReportePorTipoObra,
  getReportePorCliente,
  getReporteTendencia,
} from '@/actions/analytics';
import {
  type PeriodoPicker,
  getRangoPeriodo,
} from '@/lib/utils/periodos';
import { formatCurrency } from '@/lib/utils';
import type {
  ReporteUtilidad,
  ReporteTipoObra,
  ReporteCliente,
  ReporteTendencia,
} from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return formatCurrency(n);
}

function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

function getIniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

const AVATAR_COLORES = [
  '#E8571A', '#1E6FB8', '#2D7A45', '#7C3AED',
  '#D97706', '#0891B2', '#BE185D', '#0F766E',
];

function avatarColor(nombre: string): string {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORES[Math.abs(hash) % AVATAR_COLORES.length];
}

const TIPO_OBRA_LABELS: Record<string, string> = {
  residencial:    'Residencial',
  comercial:      'Comercial',
  industrial:     'Industrial',
  infraestructura:'Infraestructura',
  institucional:  'Institucional',
  hotelero:       'Hotelero',
  otro:           'Otro',
};

const TIPO_OBRA_COLORES: Record<string, string> = {
  residencial:    '#E8571A',
  comercial:      '#1E6FB8',
  infraestructura:'#2D7A45',
  institucional:  '#7C3AED',
  industrial:     '#D97706',
  hotelero:       '#0891B2',
  otro:           '#6B7280',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  initialUtilidad: ReporteUtilidad;
  initialTipoObra: ReporteTipoObra[];
  initialClientes: ReporteCliente[];
  initialTendencia: ReporteTendencia[];
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#E8E4DC] ${className}`}
    />
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  titulo,
  valor,
  subtexto,
  color,
  icono: Icono,
  loading,
}: {
  titulo: string;
  valor: string;
  subtexto: string;
  color: string;
  icono: React.ElementType;
  loading?: boolean;
}) {
  return (
    <div
      className="bg-white border border-[#E5E1D8] rounded-xl p-5 flex flex-col gap-3
                 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[#7A7265] uppercase tracking-[0.1em]">
          {titulo}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icono className="w-4 h-4" style={{ color }} />
        </div>
      </div>

      {loading ? (
        <>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-3 w-28" />
        </>
      ) : (
        <>
          <p
            className="text-[2.25rem] font-bold leading-none tracking-tight"
            style={{ color }}
          >
            {valor}
          </p>
          <p className="text-[12px] text-[#A89F96] leading-tight">{subtexto}</p>
        </>
      )}
    </div>
  );
}

// ── Bar Chart (CSS puro) ──────────────────────────────────────────────────────

function GraficaTendencia({
  datos,
  loading,
}: {
  datos: ReporteTendencia[];
  loading?: boolean;
}) {
  const [montado, setMontado] = useState(false);
  const [tooltip, setTooltip] = useState<{
    mes: string; utilidad: number; total_oferta: number; cantidad: number;
    x: number; y: number;
  } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMontado(true), 50);
    return () => clearTimeout(t);
  }, []);

  const maxUtilidad = Math.max(...datos.map((d) => d.utilidad), 1);
  const promedio    = datos.reduce((s, d) => s + d.utilidad, 0) / Math.max(datos.length, 1);
  const promPct     = (promedio / maxUtilidad) * 100;

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-6">
      <h2 className="text-[14px] font-semibold text-[#1A1A1A] mb-1">Utilidad mes a mes</h2>
      <p className="text-[12px] text-[#A89F96] mb-6">Últimos 6 meses — presupuestos aprobados</p>

      {loading ? (
        <div className="flex items-end gap-4 h-40">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 h-full rounded-t-md" />
          ))}
        </div>
      ) : (
        <div className="relative">
          {/* Línea de promedio */}
          {promedio > 0 && (
            <div
              className="absolute left-0 right-0 border-t border-dashed border-[#D1D5DB] pointer-events-none"
              style={{ bottom: `calc(${promPct}% + 32px)` }}
            >
              <span className="absolute right-0 -top-4 text-[10px] text-[#9CA3AF]">
                Prom. {fmt(promedio)}
              </span>
            </div>
          )}

          {/* Barras */}
          <div className="flex items-end gap-2 sm:gap-4 h-40 relative z-10">
            {datos.map((d, i) => {
              const pct     = maxUtilidad > 0 ? (d.utilidad / maxUtilidad) * 100 : 0;
              const sinDatos = d.utilidad === 0;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1 cursor-default"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const container = e.currentTarget.closest('.relative')!.getBoundingClientRect();
                    setTooltip({
                      ...d,
                      x: rect.left - container.left + rect.width / 2,
                      y: rect.top - container.top,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {/* Valor encima */}
                  <span className="text-[10px] font-medium text-[#6B7280] text-center leading-tight min-h-[28px] flex items-end justify-center">
                    {sinDatos ? '' : fmt(d.utilidad)}
                  </span>

                  {/* Barra */}
                  <div
                    className="w-full rounded-t-md transition-all duration-700 ease-out"
                    style={{
                      height: sinDatos ? '6px' : (montado ? `${Math.max(pct, 4)}%` : '0%'),
                      background: sinDatos
                        ? '#E5E7EB'
                        : 'linear-gradient(180deg, #F97316 0%, #E8571A 100%)',
                      maxHeight: '100%',
                    }}
                  />

                  {/* Etiqueta mes */}
                  <span className="text-[10px] text-[#9CA3AF] text-center whitespace-nowrap">
                    {d.mes.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute z-50 bg-[#1A2535] text-white text-[11px] rounded-lg px-3 py-2.5 shadow-xl pointer-events-none -translate-x-1/2"
              style={{ left: tooltip.x, bottom: `calc(100% - ${tooltip.y}px + 8px)` }}
            >
              <p className="font-semibold mb-1">{tooltip.mes}</p>
              <p>Utilidad: <span className="text-[#F97316]">{fmt(tooltip.utilidad)}</span></p>
              <p>Total oferta: {fmt(tooltip.total_oferta)}</p>
              <p>Presupuestos: {tooltip.cantidad}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tipo de Obra ──────────────────────────────────────────────────────────────

function TarjetaTipoObra({
  datos,
  loading,
}: {
  datos: ReporteTipoObra[];
  loading?: boolean;
}) {
  const totalUtilidad = datos.reduce((s, d) => s + d.utilidad, 0);
  const maxUtilidad   = Math.max(...datos.map((d) => d.utilidad), 1);

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-[14px] font-semibold text-[#1A1A1A]">
          Rentabilidad por tipo de obra
        </h2>
        <p className="text-[12px] text-[#A89F96] mt-0.5">Utilidad por categoría de proyecto</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : datos.length === 0 ? (
        <EmptyState mensaje="Sin datos de tipo de obra en este período" />
      ) : (
        <div className="flex flex-col gap-5">
          {datos.map((d) => {
            const pct     = totalUtilidad > 0 ? (d.utilidad / totalUtilidad) * 100 : 0;
            const barPct  = (d.utilidad / maxUtilidad) * 100;
            const color   = TIPO_OBRA_COLORES[d.tipo_obra] ?? '#6B7280';
            const label   = TIPO_OBRA_LABELS[d.tipo_obra] ?? d.tipo_obra;
            return (
              <div key={d.tipo_obra} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-[#1A1A1A] truncate">{label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[13px] font-semibold text-[#1A1A1A]">
                      {fmt(d.utilidad)}
                    </span>
                    <span className="text-[11px] text-[#A89F96]">({fmtPct(pct, 0)})</span>
                  </div>
                </div>
                <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barPct}%`, background: color }}
                  />
                </div>
                <p className="text-[11px] text-[#A89F96]">
                  {d.cantidad} presupuesto{d.cantidad !== 1 ? 's' : ''} · margen prom. {fmtPct(d.margen_promedio)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Top Clientes ──────────────────────────────────────────────────────────────

function TarjetaTopClientes({
  datos,
  loading,
}: {
  datos: ReporteCliente[];
  loading?: boolean;
}) {
  const maxUtilidad = Math.max(...datos.map((d) => d.utilidad), 1);

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-[14px] font-semibold text-[#1A1A1A]">Top clientes por rentabilidad</h2>
        <p className="text-[12px] text-[#A89F96] mt-0.5">Hasta 8 clientes — ordenados por utilidad</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : datos.length === 0 ? (
        <EmptyState mensaje="Sin datos de clientes en este período" />
      ) : (
        <div className="flex flex-col gap-4">
          {datos.map((d, i) => {
            const barPct  = (d.utilidad / maxUtilidad) * 100;
            const color   = avatarColor(d.cliente_nombre);
            const inicial = getIniciales(d.cliente_nombre);
            return (
              <div key={i} className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                  style={{ background: color }}
                >
                  {inicial}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[13px] font-medium text-[#1A1A1A] truncate">
                        {d.cliente_nombre}
                      </span>
                      {i === 0 && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]">
                          Top cliente
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] font-bold text-[#E8571A] shrink-0">
                      {fmt(d.utilidad)}
                    </span>
                  </div>

                  <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${barPct}%`, background: color }}
                    />
                  </div>

                  <p className="text-[11px] text-[#A89F96]">
                    {d.cantidad_proyectos} pres. · margen prom. {fmtPct(d.margen_promedio)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Resumen Financiero ────────────────────────────────────────────────────────

function ResumenFinanciero({
  utilidad,
  loading,
}: {
  utilidad: ReporteUtilidad;
  loading?: boolean;
}) {
  const totalBase = utilidad.total_oferta_aprobada + utilidad.total_oferta_rechazada + utilidad.cartera_potencial;
  const diasCierre = Math.round(utilidad.tiempo_promedio_aprobacion);
  const textoDias = diasCierre === 0 ? '— días' : diasCierre === 1 ? '1 día' : `${diasCierre} días`;

  function pctDe(n: number): string {
    if (totalBase <= 0) return '—';
    return fmtPct((n / totalBase) * 100, 0);
  }

  const filas = [
    {
      emoji: '✅',
      concepto: 'Cartera aprobada',
      monto: utilidad.total_oferta_aprobada,
      pct: pctDe(utilidad.total_oferta_aprobada),
      destacado: false,
    },
    {
      emoji: '⏳',
      concepto: 'Cartera potencial',
      monto: utilidad.cartera_potencial,
      pct: pctDe(utilidad.cartera_potencial),
      destacado: false,
    },
    {
      emoji: '❌',
      concepto: 'Cartera perdida',
      monto: utilidad.total_oferta_rechazada,
      pct: pctDe(utilidad.total_oferta_rechazada),
      destacado: false,
    },
    null,
    {
      emoji: '💰',
      concepto: 'Utilidad generada',
      monto: utilidad.utilidad_generada,
      pct: utilidad.total_oferta_aprobada > 0
        ? fmtPct((utilidad.utilidad_generada / utilidad.total_oferta_aprobada) * 100, 1)
        : '—',
      destacado: true,
    },
    {
      emoji: '📊',
      concepto: 'Margen promedio',
      monto: null,
      pct: fmtPct(utilidad.margen_promedio, 1),
      destacado: false,
    },
    {
      emoji: '⏱️',
      concepto: 'Tiempo prom. de cierre',
      monto: null,
      pct: textoDias,
      destacado: false,
    },
  ];

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl overflow-hidden">
      <div className="px-6 py-4 bg-[#F5F4F1] border-b border-[#E5E1D8]">
        <h2 className="text-[14px] font-semibold text-[#1A1A1A]">Resumen financiero del período</h2>
        <p className="text-[12px] text-[#A89F96] mt-0.5">Consolidado de presupuestos aprobados y en gestión</p>
      </div>

      <table className="w-full">
        <thead>
          <tr className="bg-[#F5F4F1]">
            <th className="text-left px-6 py-2.5 text-[11px] font-bold text-[#A89F96] uppercase tracking-[0.1em]">
              Concepto
            </th>
            <th className="text-right px-6 py-2.5 text-[11px] font-bold text-[#A89F96] uppercase tracking-[0.1em]">
              Monto
            </th>
            <th className="text-right px-6 py-2.5 text-[11px] font-bold text-[#A89F96] uppercase tracking-[0.1em] w-20">
              %
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className={i % 2 === 1 ? 'bg-[#FAFAF9]' : ''}>
                <td className="px-6 py-3"><Skeleton className="h-3 w-40" /></td>
                <td className="px-6 py-3 text-right"><Skeleton className="h-3 w-24 ml-auto" /></td>
                <td className="px-6 py-3 text-right"><Skeleton className="h-3 w-10 ml-auto" /></td>
              </tr>
            ))
          ) : (
            filas.map((fila, i) => {
              if (fila === null) {
                return <tr key={`sep-${i}`}><td colSpan={3} className="h-px bg-[#E5E1D8]" /></tr>;
              }
              return (
                <tr
                  key={i}
                  className={fila.destacado ? 'bg-[#F0FDF4]' : i % 2 === 1 ? 'bg-[#FAFAF9]' : ''}
                >
                  <td className="px-6 py-3 text-[13px] text-[#3D3530]">
                    <span className="mr-2">{fila.emoji}</span>
                    <span className={fila.destacado ? 'font-semibold' : ''}>{fila.concepto}</span>
                  </td>
                  <td className="px-6 py-3 text-right text-[13px] font-semibold text-[#1A1A1A]">
                    {fila.monto !== null ? fmt(fila.monto) : '—'}
                  </td>
                  <td className="px-6 py-3 text-right text-[13px] text-[#6B7280]">
                    {fila.pct}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
      <div className="w-10 h-10 rounded-full bg-[#F5F4F1] flex items-center justify-center">
        <BarChart2 className="w-5 h-5 text-[#C8C0B5]" />
      </div>
      <p className="text-[13px] text-[#A89F96]">{mensaje}</p>
    </div>
  );
}

// ── ReportesClient (raíz) ────────────────────────────────────────────────────

export default function ReportesClient({
  userId,
  initialUtilidad,
  initialTipoObra,
  initialClientes,
  initialTendencia,
}: Props) {
  const [periodo,   setPeriodo]   = useState<PeriodoPicker>('este_mes');
  const [utilidad,  setUtilidad]  = useState<ReporteUtilidad>(initialUtilidad);
  const [tipoObra,  setTipoObra]  = useState<ReporteTipoObra[]>(initialTipoObra);
  const [clientes,  setClientes]  = useState<ReporteCliente[]>(initialClientes);
  const [tendencia, setTendencia] = useState<ReporteTendencia[]>(initialTendencia);
  const [isPending, startTransition] = useTransition();

  function handlePeriodo(nuevo: PeriodoPicker) {
    setPeriodo(nuevo);
    const rango = getRangoPeriodo(nuevo);
    const opts  = rango
      ? { desde: rango.desde.toISOString(), hasta: rango.hasta.toISOString() }
      : {};

    startTransition(async () => {
      const [newUtilidad, newTipoObra, newClientes] = await Promise.all([
        getReporteUtilidad({ userId, ...opts }),
        getReportePorTipoObra({ userId, ...opts }),
        getReportePorCliente({ userId, ...opts }),
      ]);
      setUtilidad(newUtilidad);
      setTipoObra(newTipoObra);
      setClientes(newClientes);
    });
  }

  // ── KPIs derivados ──
  const tasaColor = utilidad.tasa_cierre < 30 ? '#DC2626' : '#1A1A1A';

  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#1A1A1A] leading-tight">
              Reportes financieros
            </h1>
            <p className="text-[13px] text-[#A89F96] mt-1">
              Inteligencia de negocio para tu empresa constructora
            </p>
          </div>
          <SelectorPeriodo value={periodo} onChange={handlePeriodo} />
        </div>

        {/* ── Sección 1: KPIs ── */}
        <section
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          style={{ opacity: isPending ? 0.55 : 1, transition: 'opacity 200ms' }}
        >
          <KpiCard
            titulo="Utilidad generada"
            valor={fmt(utilidad.utilidad_generada)}
            subtexto="en presupuestos aprobados"
            color="#16A34A"
            icono={TrendingUp}
            loading={isPending}
          />
          <KpiCard
            titulo="Cartera potencial"
            valor={fmt(utilidad.cartera_potencial)}
            subtexto="pendiente de respuesta del cliente"
            color="#E8571A"
            icono={Clock}
            loading={isPending}
          />
          <KpiCard
            titulo="Tasa de cierre"
            valor={fmtPct(utilidad.tasa_cierre, 0)}
            subtexto="presupuestos aprobados vs enviados"
            color={tasaColor}
            icono={Target}
            loading={isPending}
          />
          <KpiCard
            titulo="Margen promedio"
            valor={fmtPct(utilidad.margen_promedio, 1)}
            subtexto="utilidad promedio por presupuesto"
            color="#1A1A1A"
            icono={BarChart2}
            loading={isPending}
          />
        </section>

        {/* ── Sección 2: Tendencia ── */}
        <section style={{ opacity: isPending ? 0.55 : 1, transition: 'opacity 200ms' }}>
          <GraficaTendencia datos={tendencia} loading={false} />
        </section>

        {/* ── Sección 3: Dos columnas ── */}
        <section
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          style={{ opacity: isPending ? 0.55 : 1, transition: 'opacity 200ms' }}
        >
          <TarjetaTipoObra datos={tipoObra} loading={isPending} />
          <TarjetaTopClientes datos={clientes} loading={isPending} />
        </section>

        {/* ── Sección 4: Tabla resumen ── */}
        <section style={{ opacity: isPending ? 0.55 : 1, transition: 'opacity 200ms' }}>
          <ResumenFinanciero utilidad={utilidad} loading={isPending} />
        </section>

      </div>
    </div>
  );
}
