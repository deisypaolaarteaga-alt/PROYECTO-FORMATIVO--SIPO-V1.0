'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ChevronDown, Pencil, Check, X } from 'lucide-react';
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

interface BudgetListItemProps {
  budget: {
    id: string;
    titulo: string;
    estado: string;
    updated_at: string;
  };
  projectId: string;
  total: number;
}

export function BudgetListItem({ budget, projectId, total }: BudgetListItemProps) {
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
    // focus en el siguiente tick para que el input ya esté montado
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
      <Card padding="md" className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          {/* Título: modo edición vs. modo lectura */}
          {editing ? (
            <div className="flex-1 min-w-0 flex items-center gap-1 mr-2">
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
              <button
                className="flex-1 min-w-0 text-left"
                onClick={() => router.push(`/presupuestos/${budget.id}`)}
              >
                <p className="font-semibold text-sm text-neutral-800 truncate">
                  {budget.titulo || 'Presupuesto'}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">{formatDate(budget.updated_at)}</p>
              </button>
              <button
                onClick={e => { e.stopPropagation(); startEditing(); }}
                className="p-1 rounded text-neutral-300 hover:text-primary-600 hover:bg-primary-50 opacity-0 group-hover/title:opacity-100 transition-all shrink-0"
                title="Renombrar"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Controles derecha */}
          <div className="flex items-center gap-2 shrink-0 ml-4" onClick={e => e.stopPropagation()}>
            <span className="text-sm font-bold text-neutral-900">{formatCurrency(total)}</span>

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
