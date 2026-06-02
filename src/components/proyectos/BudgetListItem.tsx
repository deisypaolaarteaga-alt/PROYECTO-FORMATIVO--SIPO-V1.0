'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, ChevronDown, Pencil, Check, X, Calendar } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EstadoBadge } from '@/components/presupuestos/EstadoBadge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/shared/DropdownMenu';
import { eliminarPresupuesto, cambiarEstadoPresupuesto, actualizarPresupuesto } from '@/actions/presupuestos';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { EstadoPresupuesto } from '@/types';

interface Transicion {
  estado: EstadoPresupuesto;
  label: string;
}

// borrador no tiene transiciones aquí — se envía a revisión desde el editor (BotonEnviarRevision)
const TRANSICIONES: Record<EstadoPresupuesto, Transicion[]> = {
  borrador:    [],
  en_revision: [
    { estado: 'aprobado',  label: 'Aprobar' },
    { estado: 'rechazado', label: 'Rechazar' },
  ],
  rechazado: [
    { estado: 'borrador', label: 'Reabrir como borrador' },
  ],
  aprobado: [
    { estado: 'archivado', label: 'Archivar' },
  ],
  archivado: [],
};

const TIPO_OBRA_LABELS: Record<string, string> = {
  residencial: 'Residencial', comercial: 'Comercial', infraestructura: 'Infraestructura',
  hotelero: 'Hotelero', industrial: 'Industrial', institucional: 'Institucional', otro: 'Otro',
};

interface BudgetListItemProps {
  budget: {
    id: string;
    titulo: string;
    estado: string;
    updated_at: string;
    created_at?: string;
    vigencia_dias?: number | null;
  };
  projectId: string;
  total: number;
  tipoObra?: string | null;
  areaM2?: number | null;
}

export function BudgetListItem({ budget, projectId, total, tipoObra, areaM2 }: BudgetListItemProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [errorMsg,      setErrorMsg]      = useState('');

  // Inline rename
  const [editing,    setEditing]    = useState(false);
  const [titleDraft, setTitleDraft] = useState(budget.titulo);
  const inputRef = useRef<HTMLInputElement>(null);

  const estado = (budget.estado ?? 'borrador') as EstadoPresupuesto;
  const transiciones = TRANSICIONES[estado] ?? [];

  const tipoObraLabel = tipoObra ? (TIPO_OBRA_LABELS[tipoObra] ?? tipoObra) : null;

  const vigenciaDias = Number(budget.vigencia_dias ?? 0);
  const fechaVigenciaInfo = budget.created_at && vigenciaDias > 0 ? (() => {
    const d = new Date(budget.created_at);
    d.setDate(d.getDate() + vigenciaDias);
    const diasRestantes = Math.floor((d.getTime() - Date.now()) / 86400000);
    const label = new Intl.DateTimeFormat('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota',
    }).format(d);
    const color = diasRestantes < 0
      ? 'text-red-600'
      : diasRestantes < 7
        ? 'text-red-500'
        : diasRestantes < 30
          ? 'text-amber-500'
          : 'text-emerald-600';
    return { label, color };
  })() : null;
  const fechaVigencia = fechaVigenciaInfo?.label ?? null;

  const fechaModificacion = budget.updated_at
    ? new Intl.DateTimeFormat('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota',
      }).format(new Date(budget.updated_at))
    : null;

  async function handleDelete() {
    setLoading(true);
    const result = await eliminarPresupuesto(budget.id, projectId);
    setLoading(false);
    setConfirmDelete(false);
    if (result.success) {
      router.refresh();
    } else {
      console.error('[BudgetListItem] eliminarPresupuesto falló:', result.error);
      setErrorMsg(result.error ?? 'No se pudo eliminar el presupuesto.');
    }
  }

  async function handleCambiarEstado(nuevoEstado: EstadoPresupuesto) {
    setErrorMsg('');
    setLoading(true);
    const result = await cambiarEstadoPresupuesto(budget.id, nuevoEstado, projectId);
    setLoading(false);
    if (!result.success) {
      console.error('[BudgetListItem] cambiarEstadoPresupuesto falló:', result.error);
      setErrorMsg(result.error ?? 'Error al cambiar estado.');
    } else {
      router.refresh();
    }
  }

  function startEditing() {
    setTitleDraft(budget.titulo);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function commitRename() {
    const newTitle = titleDraft.trim();
    if (!newTitle || newTitle === budget.titulo) {
      setEditing(false);
      return;
    }
    setLoading(true);
    const result = await actualizarPresupuesto(budget.id, { titulo: newTitle });
    setLoading(false);
    if (result.success) {
      setEditing(false);
      router.refresh();
    } else {
      setErrorMsg(result.error ?? 'Error al renombrar.');
      setEditing(false);
    }
  }

  function cancelRename() {
    setTitleDraft(budget.titulo);
    setEditing(false);
  }

  return (
    <>
      <Card
        padding="md"
        className="relative flex flex-col gap-2 hover:border-[#D95510]/40 transition-colors"
      >
        {/* Fila principal: título + controles */}
        <div className="flex items-center justify-between">
          {/* Título: modo edición vs. modo lectura */}
          {editing ? (
            <div className="flex-1 min-w-0 flex items-center gap-1 mr-2" onClick={e => e.stopPropagation()}>
              <input
                ref={inputRef}
                autoFocus
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')  { e.preventDefault(); commitRename(); }
                  if (e.key === 'Escape') cancelRename();
                }}
                onBlur={commitRename}
                className="flex-1 px-2 py-0.5 text-sm font-semibold text-neutral-800 border border-primary-400 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                onMouseDown={e => { e.preventDefault(); commitRename(); }}
                className="p-1 rounded text-success-600 hover:bg-success-50 transition-colors"
                title="Guardar"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); cancelRename(); }}
                className="p-1 rounded text-neutral-400 hover:bg-neutral-100 transition-colors"
                title="Cancelar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex-1 min-w-0 flex items-center gap-1.5 group/title">
              {/* Stretch link: ::before cubre toda la card; permite right-click → abrir en pestaña */}
              <Link
                href={`/presupuestos/${budget.id}`}
                className="flex-1 min-w-0 block truncate font-semibold text-sm text-neutral-800 before:absolute before:inset-0 before:content-[''] before:rounded-[12px]"
              >
                {budget.titulo || 'Presupuesto'}
              </Link>
              <button
                onClick={e => { e.stopPropagation(); startEditing(); }}
                className="relative z-[1] p-1 rounded text-neutral-300 hover:text-primary-600 hover:bg-primary-50 opacity-0 group-hover/title:opacity-100 transition-all shrink-0"
                title="Renombrar"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Controles derecha: total + estado + eliminar */}
          <div className="relative z-[1] flex items-center gap-2 shrink-0 ml-4" onClick={e => e.stopPropagation()}>
            {total > 0 ? (
              <span className="text-sm font-bold text-neutral-900 tabular-nums">
                {formatCurrency(total)}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-neutral-400 italic">Sin valorar</span>
            )}

            {/* Estado: si hay transiciones → dropdown; si no → badge estático */}
            {transiciones.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={loading}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-opacity disabled:opacity-50 hover:opacity-80"
                    style={{ background: 'transparent' }}
                    title="Cambiar estado"
                  >
                    <EstadoBadge estado={estado} />
                    <ChevronDown className="h-3 w-3 text-neutral-400 -ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[11rem]">
                  <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">
                    Cambiar estado
                  </div>
                  <DropdownMenuSeparator />
                  {transiciones.map(t => (
                    <DropdownMenuItem
                      key={t.estado}
                      onSelect={() => handleCambiarEstado(t.estado)}
                      className="text-[13px] cursor-pointer"
                    >
                      {t.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <EstadoBadge estado={estado} />
            )}

            {/* Eliminar — solo visible para borrador o rechazado */}
            {['borrador', 'rechazado'].includes(estado) && (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={loading}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                title="Eliminar presupuesto"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Fila de metadatos */}
        {(fechaModificacion || fechaVigencia || tipoObraLabel || areaM2) && (
          <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
              {fechaModificacion && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  Modificado: {fechaModificacion}
                </span>
              )}
              {fechaVigencia && fechaVigenciaInfo && (
                <span className={`flex items-center gap-1 ${fechaVigenciaInfo.color}`}>
                  <Calendar className="h-3 w-3 shrink-0" />
                  Válido hasta: {fechaVigencia}
                </span>
              )}
              {tipoObraLabel && (
                <span className="px-1.5 py-0.5 rounded bg-[#F5F0EA] text-[#5A5248] font-medium">
                  {tipoObraLabel}
                </span>
              )}
              {areaM2 && (
                <span className="px-1.5 py-0.5 rounded bg-[#EBF2FA] text-[#1E4D8C] font-medium">
                  {areaM2} m²
                </span>
              )}
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="text-[11px] text-red-600 text-right">{errorMsg}</p>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar este presupuesto?"
        description={`"${budget.titulo || 'Presupuesto'}" y todos sus capítulos, actividades y APUs serán eliminados. Esta acción no se puede deshacer.`}
        confirmLabel={loading ? 'Eliminando…' : 'Sí, eliminar'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
