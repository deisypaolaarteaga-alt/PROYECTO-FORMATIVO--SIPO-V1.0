'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Pencil, CheckCircle2, Archive, Play } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ModalNuevoPresupuesto } from '@/components/presupuestos/ModalNuevoPresupuesto';
import { EditarProyectoModal } from '@/components/proyectos/EditarProyectoModal';
import { deleteProject, cambiarEstadoProyecto } from '@/actions/proyectos';
import type { EstadoProyecto } from '@/types';

interface ProjectActionsProps {
  projectId: string;
  projectNombre: string;
  projectEstado: EstadoProyecto;
  projectTipoObra?: string;
  projectDescripcion?: string | null;
  projectUbicacion?: string | null;
  projectClienteId?: string | null;
  projectClienteNombre?: string | null;
}

export function ProjectActions({
  projectId,
  projectNombre,
  projectEstado,
  projectTipoObra,
  projectDescripcion,
  projectUbicacion,
  projectClienteId,
  projectClienteNombre,
}: ProjectActionsProps) {
  const router = useRouter();
  const [showModal,        setShowModal]        = useState(false);
  const [showEdit,         setShowEdit]         = useState(false);
  const [confirmDelete,    setConfirmDelete]    = useState(false);
  const [confirmIniciar,   setConfirmIniciar]   = useState(false);
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
    setConfirmIniciar(false);
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

        {/* Botón contextual según estado */}
        {projectEstado === 'borrador' && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Play className="h-4 w-4 text-[--color-sipo-ember]" />}
            className="text-[--color-sipo-ember] hover:bg-[--color-sipo-ember-dim]"
            onClick={() => setConfirmIniciar(true)}
            disabled={loadingEstado}
          >
            Iniciar proyecto
          </Button>
        )}

        {projectEstado === 'en_progreso' && (
          <Button
            variant="ghost"
            size="sm"
            icon={<CheckCircle2 className="h-4 w-4 text-[--color-sipo-success]" />}
            className="text-[--color-sipo-success] hover:bg-[--color-sipo-success-bg]"
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
            icon={<Archive className="h-4 w-4 text-[--color-sipo-steel-muted]" />}
            className="text-[--color-sipo-steel-muted] hover:bg-[--color-sipo-surface]"
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
          icon={<Trash2 className="h-4 w-4 text-[--color-sipo-danger]" />}
          className="text-[--color-sipo-danger] hover:bg-[--color-sipo-danger-bg]"
          onClick={() => setConfirmDelete(true)}
        >
          Eliminar proyecto
        </Button>
      </div>

      <ModalNuevoPresupuesto
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        proyectoId={projectId}
        proyectoNombre={projectNombre}
        proyectoTipoObra={projectTipoObra}
        proyectoUbicacion={projectUbicacion}
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
          cliente_id:     projectClienteId,
          cliente_nombre: projectClienteNombre,
        }}
      />

      <ConfirmDialog
        open={confirmIniciar}
        title="¿Iniciar proyecto?"
        description="El proyecto pasará al estado En progreso. Podrás comenzar a trabajar activamente en él y sus presupuestos."
        confirmLabel={loadingEstado ? 'Iniciando…' : 'Sí, iniciar proyecto'}
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={() => handleCambiarEstado('en_progreso')}
        onCancel={() => setConfirmIniciar(false)}
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
