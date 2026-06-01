'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { ESTADO_PRESUPUESTO_CONFIG } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BudgetRow = {
  id: string;
  titulo: string;
  estado: string;
  created_at: string;
  vigencia_dias: number;
  diasRestantes: number | null;
  proyecto_nombre: string | null;
  costo_directo: number;
  total_oferta: number;
  administracion_pct: number;
  imprevistos_pct: number;
  utilidad_pct: number;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'todos',       label: 'Todos',       dot: '' },
  { key: 'borrador',    ...ESTADO_PRESUPUESTO_CONFIG.borrador    },
  { key: 'en_revision', ...ESTADO_PRESUPUESTO_CONFIG.en_revision },
  { key: 'aprobado',    ...ESTADO_PRESUPUESTO_CONFIG.aprobado    },
  { key: 'rechazado',   ...ESTADO_PRESUPUESTO_CONFIG.rechazado   },
  { key: 'archivado',   ...ESTADO_PRESUPUESTO_CONFIG.archivado   },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number) {
  return `${Number.isInteger(n) ? n : n.toFixed(1)}%`;
}

function diasColor(d: number | null) {
  if (d === null)  return 'text-[#9CA3AF]';
  if (d <= 0)      return 'text-[#DC2626] font-semibold';
  if (d <= 7)      return 'text-[#DC2626]';
  if (d <= 15)     return 'text-[#EA580C]';
  return 'text-[#6B7280]';
}

function diasLabel(d: number | null) {
  if (d === null) return '—';
  if (d <= 0)    return 'Vencido';
  return `${d}d`;
}

// ── BudgetRowItem ──────────────────────────────────────────────────────────────

function BudgetRowItem({ row }: { row: BudgetRow }) {
  const [expanded, setExpanded] = useState(false);
  const badge = ESTADO_PRESUPUESTO_CONFIG[row.estado as keyof typeof ESTADO_PRESUPUESTO_CONFIG]
    ?? ESTADO_PRESUPUESTO_CONFIG.borrador;

  const admin  = row.costo_directo * (row.administracion_pct / 100);
  const imprev = row.costo_directo * (row.imprevistos_pct   / 100);
  const util   = row.costo_directo * (row.utilidad_pct      / 100);

  return (
    <li className="border-b border-[#F3F4F6] last:border-0">
      {/* ── Main row ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded((v) => !v); }}
        className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors cursor-pointer group"
      >
        {/* Toggle chevron */}
        <span className="shrink-0 text-[#D1D5DB] group-hover:text-[#9CA3AF] transition-colors">
          {expanded
            ? <ChevronDown  className="h-3.5 w-3.5" />
            : <ChevronRight className="h-3.5 w-3.5" />
          }
        </span>

        {/* Title + project */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/presupuestos/${row.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[13px] font-semibold text-[#111827] hover:text-[#D95510] transition-colors truncate block leading-tight"
          >
            {row.titulo}
          </Link>
          {row.proyecto_nombre && (
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 leading-none truncate">
              {row.proyecto_nombre}
            </p>
          )}
        </div>

        {/* Estado */}
        <span className={cn('hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium shrink-0 w-[100px] justify-center', badge.badge)}>
          {badge.label}
        </span>

        {/* Total oferta */}
        <span className="text-[13px] font-bold text-[#111827] tabular-nums w-[148px] text-right shrink-0">
          {formatCurrency(row.total_oferta)}
        </span>

        {/* Creado */}
        <span className="text-[11px] text-[#9CA3AF] w-[88px] shrink-0 hidden md:block">
          {new Date(row.created_at).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric',
            timeZone: 'America/Bogota',
          })}
        </span>

        {/* Vigencia */}
        <span className={cn('text-[11px] w-[56px] text-right shrink-0 tabular-nums hidden md:block', diasColor(row.diasRestantes))}>
          {diasLabel(row.diasRestantes)}
        </span>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="px-5 pt-3 pb-4 bg-[#F8F9FA] border-t border-[#F3F4F6]">
          <div className="flex items-end justify-between gap-4 flex-wrap">

            {/* AIU breakdown */}
            <div className="flex items-end gap-5 flex-wrap">

              {/* Costo directo */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-1 leading-none">
                  Costo directo
                </p>
                <p className="text-[13px] font-semibold text-[#374151] tabular-nums leading-none">
                  {formatCurrency(row.costo_directo)}
                </p>
              </div>

              <div className="w-px h-7 bg-[#E5E7EB] shrink-0" />

              {/* Administración */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-1 leading-none">
                  Administración
                </p>
                <p className="text-[13px] font-semibold text-[#374151] tabular-nums leading-none">
                  {pct(row.administracion_pct)}{' '}
                  <span className="text-[11px] text-[#9CA3AF] font-normal">· {formatCurrency(admin)}</span>
                </p>
              </div>

              {/* Imprevistos */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-1 leading-none">
                  Imprevistos
                </p>
                <p className="text-[13px] font-semibold text-[#374151] tabular-nums leading-none">
                  {pct(row.imprevistos_pct)}{' '}
                  <span className="text-[11px] text-[#9CA3AF] font-normal">· {formatCurrency(imprev)}</span>
                </p>
              </div>

              {/* Utilidad */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-1 leading-none">
                  Utilidad
                </p>
                <p className="text-[13px] font-semibold text-[#374151] tabular-nums leading-none">
                  {pct(row.utilidad_pct)}{' '}
                  <span className="text-[11px] text-[#9CA3AF] font-normal">· {formatCurrency(util)}</span>
                </p>
              </div>

              <div className="w-px h-7 bg-[#E5E7EB] shrink-0" />

              {/* Total presupuesto — protagonista */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-1 leading-none">
                  Total presupuesto
                </p>
                <p className="text-[18px] font-bold text-[#111827] tabular-nums leading-none">
                  {formatCurrency(row.total_oferta)}
                </p>
              </div>
            </div>

            {/* CTA */}
            <Link
              href={`/presupuestos/${row.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D95510] text-white text-[12px] font-semibold hover:bg-[#C44A10] transition-colors shrink-0"
            >
              Ver detalle
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}

// ── PresupuestosClientList ────────────────────────────────────────────────────

export function PresupuestosClientList({ rows }: { rows: BudgetRow[] }) {
  const [search,    setSearch]    = useState('');
  const [activeTab, setActiveTab] = useState('todos');

  const counts = useMemo(() => {
    const map: Record<string, number> = { todos: rows.length };
    for (const r of rows) map[r.estado] = (map[r.estado] ?? 0) + 1;
    return map;
  }, [rows]);

  const filtered = useMemo(() => {
    let result = rows;
    if (activeTab !== 'todos') result = result.filter((r) => r.estado === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.titulo.toLowerCase().includes(q) || r.proyecto_nombre?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [rows, activeTab, search]);

  return (
    <div className="space-y-4">

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar presupuesto o proyecto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/10 text-[#111827] placeholder-[#9CA3AF] transition-colors"
        />
      </div>

      {/* ── Status tabs ── */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(({ key, label, dot }) => {
          const count    = counts[key] ?? 0;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
                isActive
                  ? 'bg-[#D95510] text-white shadow-sm'
                  : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#D95510] hover:text-[#D95510]',
              )}
            >
              {dot && (
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', isActive ? 'bg-white/70' : dot)} />
              )}
              {label}
              <span className={cn('text-[10px] font-bold tabular-nums', isActive ? 'text-white/70' : 'text-[#9CA3AF]')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#9CA3AF]" />
          </div>
          <div className="text-center">
            <p className="text-[14px] font-semibold text-[#374151]">Sin resultados</p>
            <p className="text-[12px] text-[#9CA3AF] mt-1">
              {search
                ? 'No hay presupuestos que coincidan con tu búsqueda.'
                : 'No hay presupuestos con este estado.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">

          {/* Column headers */}
          <div className="hidden md:flex items-center gap-4 px-5 py-2.5 border-b border-[#F3F4F6] bg-[#F9FAFB]">
            <div className="w-3.5 shrink-0" />
            <span className="flex-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">Presupuesto</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] w-[100px] text-center shrink-0">Estado</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] w-[148px] text-right shrink-0">Total oferta</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] w-[88px] hidden md:block">Creado</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] w-[56px] text-right hidden md:block">Vigencia</span>
          </div>

          {/* Rows */}
          <ul>
            {filtered.map((row) => (
              <BudgetRowItem key={row.id} row={row} />
            ))}
          </ul>

          {/* Footer count */}
          <div className="px-5 py-2.5 border-t border-[#F3F4F6] bg-[#F9FAFB]">
            <p className="text-[11px] text-[#9CA3AF]">
              Mostrando {filtered.length} de {rows.length} presupuesto{rows.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
