'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles, Trash2, Pencil, CheckCircle2, Archive } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ModalNuevoPresupuesto } from '@/components/presupuestos/ModalNuevoPresupuesto';
import { EditarProyectoModal } from '@/components/proyectos/EditarProyectoModal';
import { deleteProject, cambiarEstadoProyecto } from '@/actions/proyectos';
import { cn } from '@/lib/utils';
import type { EstadoProyecto } from '@/types';

interface ProjectActionsProps {
  projectId: string;
  projectNombre: string;
  projectEstado: EstadoProyecto;
  projectTipoObra?: string;
  projectDescripcion?: string | null;
  projectUbicacion?: string | null;
  projectClienteNombre?: string | null;
  iaAvailable: boolean;
}

export function ProjectActions({
  projectId,
  projectNombre,
  projectEstado,
  projectTipoObra,
  projectDescripcion,
  projectUbicacion,
  projectClienteNombre,
  iaAvailable,
}: ProjectActionsProps) {
  const router = useRouter();
  const [showModal,        setShowModal]        = useState(false);
  const [showEdit,         setShowEdit]         = useState(false);
  const [confirmDelete,    setConfirmDelete]    = useState(false);
  const [confirmFinalizar, setConfirmFinalizar] = useState(false);
  const [confirmArchivar,  setConfirmArchivar]  = useState(false);
  const [deleting,         setDeleting]         = useState(false);
  const [loadingEstado,    setLoadingEstado]    = useState(false);

  async function handleDeleteProject() {
    setDeleting(true);
    const result = await deleteProject(projectId);
    setDeleting(false);
    if (result.success) {
      router.push('/proyectos');
    } else {
      setConfirmDelete(false);
    }
  }

  async function handleCambiarEstado(nuevoEstado: EstadoProyecto) {
    setLoadingEstado(true);
    const result = await cambiarEstadoProyecto(projectId, nuevoEstado);
    setLoadingEstado(false);
    setConfirmFinalizar(false);
    setConfirmArchivar(false);
    if (result.success) {
      router.refresh();
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setShowModal(true)}
        >
          Nuevo presupuesto
        </Button>

        <div className="relative group">
          <Button
            variant="primary"
            size="sm"
            icon={<Sparkles className="h-4 w-4" />}
            className={cn(!iaAvailable && "bg-neutral-400 border-neutral-400 cursor-not-allowed opacity-70")}
            onClick={() => iaAvailable ? setShowModal(true) : null}
          >
            Generar con IA
          </Button>
          {!iaAvailable && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Función IA — Próximamente
            </div>
          )}
        </div>

        {/* Botón contextual según estado */}
        {projectEstado === 'en_progreso' && (
          <Button
            variant="ghost"
            size="sm"
            icon={<CheckCircle2 className="h-4 w-4 text-success-600" />}
            className="text-success-700 hover:bg-success-50"
            onClick={() => setConfirmFinalizar(true)}
            disabled={loadingEstado}
          >
            Finalizar obra
          </Button>
        )}

        {projectEstado === 'finalizado' && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Archive className="h-4 w-4 text-neutral-500" />}
            className="text-neutral-600 hover:bg-neutral-50"
            onClick={() => setConfirmArchivar(true)}
            disabled={loadingEstado}
          >
            Archivar proyecto
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          icon={<Pencil className="h-4 w-4" />}
          onClick={() => setShowEdit(true)}
        >
          Editar proyecto
        </Button>

        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 className="h-4 w-4 text-red-500" />}
          className="text-red-500 hover:bg-red-50"
          onClick={() => setConfirmDelete(true)}
        >
          Eliminar proyecto
        </Button>
      </div>

      <ModalNuevoPresupuesto
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        iaAvailable={iaAvailable}
        proyectoId={projectId}
        proyectoNombre={projectNombre}
        proyectoTipoObra={projectTipoObra}
      />

      <EditarProyectoModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        proyecto={{
          id:             projectId,
          nombre:         projectNombre,
          descripcion:    projectDescripcion,
          ubicacion:      projectUbicacion,
          tipo_obra:      projectTipoObra,
          cliente_nombre: projectClienteNombre,
        }}
      />

      <ConfirmDialog
        open={confirmFinalizar}
        title="¿Finalizar obra?"
        description="El proyecto pasará al estado Finalizado. Esta acción indica que la obra ha concluido. Podrás archivarlo posteriormente."
        confirmLabel={loadingEstado ? 'Finalizando…' : 'Sí, finalizar obra'}
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={() => handleCambiarEstado('finalizado')}
        onCancel={() => setConfirmFinalizar(false)}
      />

      <ConfirmDialog
        open={confirmArchivar}
        title="¿Archivar proyecto?"
        description="El proyecto pasará a Archivado y ya no aparecerá en la vista principal. Podrás consultarlo filtrando por Archivados."
        confirmLabel={loadingEstado ? 'Archivando…' : 'Sí, archivar proyecto'}
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={() => handleCambiarEstado('archivado')}
        onCancel={() => setConfirmArchivar(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={`¿Eliminar "${projectNombre}"?`}
        description="Se eliminarán también todos los presupuestos, capítulos, actividades y APUs asociados a este proyecto. Esta acción no se puede deshacer."
        confirmLabel={deleting ? 'Eliminando…' : 'Sí, eliminar proyecto'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDeleteProject}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
