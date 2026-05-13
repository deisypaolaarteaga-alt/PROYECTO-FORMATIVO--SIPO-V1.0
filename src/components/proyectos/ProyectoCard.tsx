'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Pencil, MapPin, User, Calendar, FolderOpen } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EditarProyectoModal } from '@/components/proyectos/EditarProyectoModal';
import { deleteProject } from '@/actions/proyectos';
import { formatDate } from '@/lib/utils';

const ESTADO_STYLES: Record<string, { label: string; class: string }> = {
  borrador:    { label: 'Borrador',    class: 'bg-neutral-100 text-neutral-600' },
  en_progreso: { label: 'En progreso', class: 'bg-success-50 text-success-700' },
  finalizado:  { label: 'Finalizado',  class: 'bg-info-50 text-info-600' },
  archivado:   { label: 'Archivado',   class: 'bg-neutral-200 text-neutral-500' },
};

interface ProyectoCardProps {
  proyecto: {
    id: string;
    nombre: string;
    descripcion?: string | null;
    estado: string;
    cliente_nombre?: string | null;
    ubicacion?: string | null;
    tipo_obra?: string | null;
    updated_at: string;
    budgets?: { count: number }[];
  };
}

export function ProyectoCard({ proyecto: p }: ProyectoCardProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit,      setShowEdit]      = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  const est = ESTADO_STYLES[p.estado] ?? ESTADO_STYLES.borrador;

  async function handleDelete() {
    setDeleting(true);
    await deleteProject(p.id);
    setDeleting(false);
    setConfirmDelete(false);
    router.refresh();
  }

  return (
    <>
      <Card hover padding="md" className="h-full flex flex-col justify-between relative group">
        {/* Área clickeable principal */}
        <button
          className="flex-1 w-full text-left"
          onClick={() => router.push(`/proyectos/${p.id}`)}
        >
          <div className="flex items-start justify-between mb-2 pr-16">
            <h3 className="font-semibold text-neutral-900 truncate">{p.nombre}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${est.class}`}>
              {est.label}
            </span>
          </div>
          {p.descripcion && (
            <p className="text-xs text-neutral-500 line-clamp-2 mb-3">{p.descripcion}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-400 mt-auto pt-3 border-t border-neutral-100">
            {p.cliente_nombre && (
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{p.cliente_nombre}</span>
            )}
            {p.ubicacion && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.ubicacion}</span>
            )}
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(p.updated_at)}</span>
            <span className="flex items-center gap-1"><FolderOpen className="h-3 w-3" />{p.budgets?.[0]?.count || 0} presupuesto(s)</span>
          </div>
        </button>

        {/* Botones acción — esquina superior derecha, visibles en hover */}
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={e => { e.stopPropagation(); setShowEdit(true); }}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            title="Editar proyecto"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Eliminar proyecto"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </Card>

      <EditarProyectoModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        proyecto={p}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={`¿Eliminar "${p.nombre}"?`}
        description="Se eliminarán también todos los presupuestos, capítulos, actividades y APUs asociados. Esta acción no se puede deshacer."
        confirmLabel={deleting ? 'Eliminando…' : 'Sí, eliminar proyecto'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
