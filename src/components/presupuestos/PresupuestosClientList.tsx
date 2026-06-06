'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, ChevronDown, FileText, FolderOpen,
  MoreVertical, ExternalLink, Archive, Trash2, Copy,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { ESTADO_PRESUPUESTO_CONFIG } from '@/types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/shared/DropdownMenu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { archivarPresupuesto, eliminarPresupuesto } from '@/actions/proyectos';
import { duplicarPresupuesto } from '@/actions/presupuesto-estados';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BudgetRow = {
  id: string;
  titulo: string;
  estado: string;
  created_at: string;
  vigencia_dias: number;
  diasRestantes: number | null;
  proyecto_nombre: string | null;
  project_id: string;
  tipo_obra?: string | null;
  costo_directo: number;
  total_oferta: number;
  administracion_pct: number;
  imprevistos_pct: number;
  utilidad_pct: number;
};

type Grupo = {
  project_id: string;
  proyecto_nombre: string;
  tipo_obra: string | null;
  rows: BudgetRow[];
  totalOferta: number;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const GRUPOS_ESTADO: Record<string, string[]> = {
  borrador:    ['borrador', 'en_revision'],
  con_cliente: ['enviado_a_cliente', 'visto_por_cliente', 'con_observaciones'],
  aprobado:    ['aprobado', 'aprobado_por_cliente'],
  rechazado:   ['rechazado', 'rechazado_por_cliente'],
  archivado:   ['archivado'],
};

const TABS = [
  { key: 'todos',       label: 'Todos',       dot: '' },
  { key: 'borrador',    label: 'Borrador',    dot: 'bg-[#D1D5DB]' },
  { key: 'con_cliente', label: 'Con cliente', dot: 'bg-[#2563EB]' },
  { key: 'aprobado',    label: 'Aprobado',    dot: 'bg-[#16A34A]' },
  { key: 'rechazado',   label: 'Rechazado',   dot: 'bg-[#DC2626]' },
  { key: 'archivado',   label: 'Archivado',   dot: 'bg-[#9CA3AF]' },
] as const;

// Color del ícono de carpeta y fondo del header según tipo_obra
const TIPO_FOLDER: Record<string, { icon: string; header: string }> = {
  residencial:     { icon: 'text-[#D97706]', header: 'bg-[#FFFBEB]' },
  comercial:       { icon: 'text-[#2563EB]', header: 'bg-[#EFF6FF]' },
  infraestructura: { icon: 'text-[#64748B]', header: 'bg-[#F8FAFC]' },
  hotelero:        { icon: 'text-[#7C3AED]', header: 'bg-[#F5F3FF]' },
  industrial:      { icon: 'text-[#EA580C]', header: 'bg-[#FFF7ED]' },
  institucional:   { icon: 'text-[#059669]', header: 'bg-[#F0FDF4]' },
  otro:            { icon: 'text-[#9CA3AF]', header: 'bg-[#F9FAFB]' },
};

function tipoFolder(tipoObra: string | null | undefined) {
  return TIPO_FOLDER[tipoObra ?? ''] ?? { icon: 'text-[#D97706]', header: 'bg-[#F8F7F5]' };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function diasColor(d: number | null) {
  if (d === null) return 'text-[#9CA3AF]';
  if (d <= 0)     return 'text-[#DC2626] font-semibold';
  if (d <= 7)     return 'text-[#DC2626]';
  if (d <= 15)    return 'text-[#EA580C]';
  return 'text-[#6B7280]';
}

function diasLabel(d: number | null) {
  if (d === null) return '—';
  if (d <= 0)     return 'Vencido';
  return `${d}d`;
}

// ── BudgetRowItem ──────────────────────────────────────────────────────────────

type BudgetRowItemProps = {
  row: BudgetRow;
  onArchivar: (id: string) => void;
  onEliminar: (id: string) => void;
  onDuplicar: (id: string) => void;
};

function BudgetRowItem({ row, onArchivar, onEliminar, onDuplicar }: BudgetRowItemProps) {
  const router = useRouter();
  const badge = ESTADO_PRESUPUESTO_CONFIG[row.estado as keyof typeof ESTADO_PRESUPUESTO_CONFIG]
    ?? ESTADO_PRESUPUESTO_CONFIG.borrador;

  const sinValorar = row.total_oferta === 0 || row.costo_directo === 0;

  const puedeArchivar = !['aprobado', 'archivado'].includes(row.estado);
  const puedeEliminar = ['borrador', 'rechazado', 'archivado'].includes(row.estado);
  const puedeDuplicar = row.estado === 'borrador';

  return (
    <li className="border-b border-[#F3F4F6] last:border-0">
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/presupuestos/${row.id}`)}
        onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/presupuestos/${row.id}`); }}
        className="flex items-center gap-4 px-5 py-4 hover:bg-[#F5F3F0] transition-colors cursor-pointer group"
      >
        {/* Nombre + badge "Sin valorar" */}
        <div className="flex-1 min-w-0 flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-medium text-[#111827] group-hover:text-[#D95510] transition-colors truncate leading-tight">
            {row.titulo}
          </span>
          {sinValorar && (
            <span className="shrink-0 text-[10px] text-[#C4BDB5] leading-none">
              Sin valorar
            </span>
          )}
        </div>

        {/* Estado */}
        <span className={cn(
          'hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium shrink-0 w-[100px] justify-center',
          badge.badge,
        )}>
          {badge.label}
        </span>

        {/* Total oferta */}
        <span className={cn(
          'text-[13px] font-semibold tabular-nums w-[130px] text-right shrink-0',
          sinValorar ? 'text-[#D1D5DB]' : 'text-[#111827]',
        )}>
          {sinValorar ? '—' : formatCurrency(row.total_oferta)}
        </span>

        {/* Fecha creación */}
        <span className="text-[11px] text-[#9CA3AF] w-[88px] shrink-0 hidden md:block tabular-nums">
          {new Date(row.created_at).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric',
            timeZone: 'America/Bogota',
          }).replace(/\./g, '').replace(/ de /gi, ' ').replace(/  +/g, ' ').trim()}
        </span>

        {/* Vigencia — semáforo */}
        <span className={cn(
          'text-[11px] w-[52px] text-right shrink-0 tabular-nums hidden md:block',
          diasColor(row.diasRestantes),
        )}>
          {diasLabel(row.diasRestantes)}
        </span>

        {/* Menú ⋯ — siempre visible */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 w-8 flex items-center justify-center"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-[#EAE6E0] hover:text-[#3D3530] transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/presupuestos/${row.id}`} className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </Link>
              </DropdownMenuItem>
              {puedeDuplicar && (
                <DropdownMenuItem onClick={() => onDuplicar(row.id)}>
                  <Copy className="h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
              )}
              {(puedeArchivar || puedeEliminar) && <DropdownMenuSeparator />}
              {puedeArchivar && (
                <DropdownMenuItem
                  onClick={() => onArchivar(row.id)}
                  className="text-neutral-500"
                >
                  <Archive className="h-4 w-4" />
                  Archivar
                </DropdownMenuItem>
              )}
              {puedeEliminar && (
                <DropdownMenuItem
                  onClick={() => onEliminar(row.id)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  );
}

// ── Encabezado de columnas ─────────────────────────────────────────────────────

function ColumnHeaders() {
  return (
    <div className="hidden md:flex items-center gap-4 px-5 py-2 border-b border-[#F3F4F6] bg-[#F9FAFB]">
      <span className="flex-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">
        Presupuesto
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] w-[100px] text-center shrink-0">
        Estado
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] w-[130px] text-right shrink-0">
        Total oferta
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] w-[88px] hidden md:block">
        Creado
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] w-[52px] text-right hidden md:block">
        Vigencia
      </span>
      <div className="w-8 shrink-0" />
    </div>
  );
}

// ── PresupuestosClientList ────────────────────────────────────────────────────

export function PresupuestosClientList({ rows }: { rows: BudgetRow[] }) {
  const router = useRouter();
  const [search,    setSearch]    = useState('');
  const [activeTab, setActiveTab] = useState('todos');

  const [confirmArchivar, setConfirmArchivar] = useState<string | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState<string | null>(null);
  const [procesando, setProcesando]           = useState(false);
  const [, startTransition]                   = useTransition();

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  function toggleGrupo(projectId: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = { todos: rows.length };
    for (const [groupKey, estados] of Object.entries(GRUPOS_ESTADO)) {
      map[groupKey] = rows.filter((r) => estados.includes(r.estado)).length;
    }
    return map;
  }, [rows]);

  const filtered = useMemo(() => {
    let result = rows;
    if (activeTab !== 'todos') {
      const estados = GRUPOS_ESTADO[activeTab] ?? [activeTab];
      result = result.filter((r) => estados.includes(r.estado));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.titulo.toLowerCase().includes(q) || r.proyecto_nombre?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [rows, activeTab, search]);

  const grupos = useMemo<Grupo[]>(() => {
    const map = new Map<string, Grupo>();
    for (const row of filtered) {
      const pid = row.project_id;
      if (!map.has(pid)) {
        map.set(pid, {
          project_id:      pid,
          proyecto_nombre: row.proyecto_nombre ?? 'Sin proyecto',
          tipo_obra:       row.tipo_obra ?? null,
          rows:            [],
          totalOferta:     0,
        });
      }
      const g = map.get(pid)!;
      g.rows.push(row);
      if (row.total_oferta > 0) g.totalOferta += row.total_oferta;
    }
    return Array.from(map.values());
  }, [filtered]);

  async function handleConfirmarArchivar() {
    if (!confirmArchivar) return;
    setProcesando(true);
    const res = await archivarPresupuesto(confirmArchivar);
    setProcesando(false);
    setConfirmArchivar(null);
    if (res.success) { toast.success('Presupuesto archivado'); startTransition(() => router.refresh()); }
    else toast.error(res.error ?? 'No se pudo archivar el presupuesto');
  }

  async function handleConfirmarEliminar() {
    if (!confirmEliminar) return;
    setProcesando(true);
    const res = await eliminarPresupuesto(confirmEliminar);
    setProcesando(false);
    setConfirmEliminar(null);
    if (res.success) { toast.success('Presupuesto eliminado'); startTransition(() => router.refresh()); }
    else toast.error(res.error ?? 'No se pudo eliminar el presupuesto');
  }

  async function handleDuplicar(budgetId: string) {
    const res = await duplicarPresupuesto(budgetId);
    if (res.success) {
      toast.success('Presupuesto duplicado');
      startTransition(() => router.refresh());
    } else {
      toast.error(res.error ?? 'No se pudo duplicar el presupuesto');
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Buscador ── */}
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

      {/* ── Tabs de estado ── */}
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

      {/* ── Lista agrupada ── */}
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
        <div className="space-y-6">
          {grupos.map((grupo) => {
            const collapsed    = collapsedGroups.has(grupo.project_id);
            const { icon, header } = tipoFolder(grupo.tipo_obra);
            return (
              <div
                key={grupo.project_id}
                className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]"
              >
                {/* ── Encabezado del grupo ── */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleGrupo(grupo.project_id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleGrupo(grupo.project_id); }}
                  className={cn(
                    'flex items-center gap-3 px-5 py-4 border-b border-[#E2DDD7] cursor-pointer select-none transition-all',
                    header,
                    'hover:brightness-[0.97]',
                  )}
                >
                  {/* Chevron animado */}
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-[#9CA3AF] transition-transform duration-200 shrink-0',
                      collapsed && '-rotate-90',
                    )}
                  />

                  {/* Ícono carpeta coloreado por tipo_obra */}
                  <FolderOpen className={cn('h-4 w-4 shrink-0', icon)} />

                  {/* Nombre del proyecto como link */}
                  <Link
                    href={`/proyectos/${grupo.project_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[13px] font-semibold text-[#111827] hover:text-[#D95510] hover:underline underline-offset-2 transition-colors truncate flex-1 min-w-0"
                  >
                    {grupo.proyecto_nombre}
                  </Link>

                  {/* Pills sutiles */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/80 border border-black/[0.07] text-[#6B7280] tabular-nums">
                      {grupo.rows.length} ptos.
                    </span>
                    {grupo.totalOferta > 0 && (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/80 border border-black/[0.07] text-[#374151] tabular-nums">
                        {formatCurrency(grupo.totalOferta)}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Cuerpo del grupo ── */}
                {!collapsed && (
                  <>
                    <ColumnHeaders />
                    <ul>
                      {grupo.rows.map((row) => (
                        <BudgetRowItem
                          key={row.id}
                          row={row}
                          onArchivar={(id) => setConfirmArchivar(id)}
                          onEliminar={(id) => setConfirmEliminar(id)}
                          onDuplicar={handleDuplicar}
                        />
                      ))}
                    </ul>
                  </>
                )}
              </div>
            );
          })}

          {/* Conteo total */}
          <p className="text-[11px] text-[#9CA3AF] px-1">
            Mostrando {filtered.length} de {rows.length} presupuesto{rows.length !== 1 ? 's' : ''} en {grupos.length} proyecto{grupos.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* ── Diálogos de confirmación ── */}
      <ConfirmDialog
        open={confirmArchivar !== null}
        title="¿Archivar este presupuesto?"
        description="No podrás editarlo mientras esté archivado. Podrás desarchivarlo desde la pestaña Archivados."
        confirmLabel={procesando ? 'Archivando…' : 'Sí, archivar'}
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={handleConfirmarArchivar}
        onCancel={() => setConfirmArchivar(null)}
      />

      <ConfirmDialog
        open={confirmEliminar !== null}
        title="¿Eliminar este presupuesto?"
        description="Esta acción es permanente y no se puede deshacer. El presupuesto será eliminado junto con todos sus capítulos, actividades y APUs."
        confirmLabel={procesando ? 'Eliminando…' : 'Sí, eliminar'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setConfirmEliminar(null)}
      />
    </div>
  );
}
