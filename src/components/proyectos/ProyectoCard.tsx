'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Pencil, MapPin, User, Calendar, Briefcase } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EditarProyectoModal } from '@/components/proyectos/EditarProyectoModal';
import { deleteProject } from '@/actions/proyectos';
import { formatDate } from '@/lib/utils';

const ESTADO_STYLES: Record<string, { label: string; badge: string; accent: string }> = {
  borrador:    { label: 'Borrador',    badge: 'bg-[--color-sipo-surface] text-[--color-sipo-ink-muted]',      accent: 'border-l-[--color-sipo-border-md]' },
  en_progreso: { label: 'En progreso', badge: 'bg-[--color-sipo-success-bg] text-[--color-sipo-success]',     accent: 'border-l-[--color-sipo-success]' },
  finalizado:  { label: 'Finalizado',  badge: 'bg-[--color-sipo-info-bg] text-[--color-sipo-info]',           accent: 'border-l-[--color-sipo-info]' },
  archivado:   { label: 'Archivado',   badge: 'bg-[--color-sipo-surface-2] text-[--color-sipo-steel-muted]',  accent: 'border-l-[--color-sipo-border-md]' },
};

const TIPO_OBRA_LABEL: Record<string, string> = {
  residencial:    'Residencial',
  comercial:      'Comercial',
  infraestructura:'Infraestructura',
  institucional:  'Institucional',
  industrial:     'Industrial',
  hotelero:       'Hotelero',
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
  const presupuestosCount = p.budgets?.[0]?.count ?? 0;
  const tipoLabel = p.tipo_obra ? TIPO_OBRA_LABEL[p.tipo_obra] : null;

  async function handleDelete() {
    setDeleting(true);
    await deleteProject(p.id);
    setDeleting(false);
    setConfirmDelete(false);
    router.refresh();
  }

  return (
    <>
      <Card
        hover
        padding="md"
        className={`h-full flex flex-col justify-between relative group border-l-4 ${est.accent}`}
      >
        {/* Área clickeable principal */}
        <button
          className="flex-1 w-full text-left"
          onClick={() => router.push(`/proyectos/${p.id}`)}
        >
          {/* Encabezado: nombre + badge estado */}
          <div className="flex items-start justify-between mb-1.5 pr-16">
            <h3 className="font-semibold text-[--color-sipo-ink] truncate leading-snug">
              {p.nombre}
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ml-2 ${est.badge}`}>
              {est.label}
            </span>
          </div>

          {/* Chips secundarios: tipo de obra + presupuestos */}
          <div className="flex items-center gap-2 mb-2.5">
            {tipoLabel && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[--color-sipo-base] text-[--color-sipo-ink-muted]">
                <Briefcase className="h-2.5 w-2.5" />
                {tipoLabel}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
              presupuestosCount > 0
                ? 'bg-[--color-sipo-ember-dim] text-[--color-sipo-ember]'
                : 'bg-[--color-sipo-surface] text-[--color-sipo-ink-ghost]'
            }`}>
              {presupuestosCount} {presupuestosCount === 1 ? 'presupuesto' : 'presupuestos'}
            </span>
          </div>

          {/* Descripción */}
          {p.descripcion && (
            <p className="text-xs text-[--color-sipo-ink-ghost] line-clamp-2 mb-3">
              {p.descripcion}
            </p>
          )}

          {/* Footer de metadatos */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[--color-sipo-ink-ghost] mt-auto pt-3 border-t border-[--color-sipo-border]">
            {p.cliente_nombre && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3 shrink-0" />
                {p.cliente_nombre}
              </span>
            )}
            {p.ubicacion && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {p.ubicacion}
              </span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              <Calendar className="h-3 w-3 shrink-0" />
              {formatDate(p.updated_at)}
            </span>
          </div>
        </button>

        {/* Botones acción — esquina superior derecha, visibles en hover */}
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={e => { e.stopPropagation(); setShowEdit(true); }}
            className="p-1.5 rounded-lg text-[--color-sipo-border-md] hover:text-[--color-sipo-ember] hover:bg-[--color-sipo-ember-dim] transition-colors"
            title="Editar proyecto"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
            className="p-1.5 rounded-lg text-[--color-sipo-border-md] hover:text-[--color-sipo-danger] hover:bg-[--color-sipo-danger-bg] transition-colors"
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
