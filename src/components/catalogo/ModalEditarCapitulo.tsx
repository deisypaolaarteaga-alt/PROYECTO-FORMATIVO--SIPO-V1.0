'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { actualizarCapitulo, eliminarCapitulo } from '@/actions/catalogo';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import type { CatalogoCapitulo } from '@/types';

const TIPOS_OBRA = [
  { id: 'residencial',     label: 'Residencial' },
  { id: 'comercial',       label: 'Comercial' },
  { id: 'industrial',      label: 'Industrial' },
  { id: 'infraestructura', label: 'Infraestructura' },
  { id: 'institucional',   label: 'Institucional' },
  { id: 'hotelero',        label: 'Hotelero' },
] as const;

type TipoObra = typeof TIPOS_OBRA[number]['id'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  capitulo: CatalogoCapitulo | null;
}

export function ModalEditarCapitulo({ isOpen, onClose, capitulo }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(false);
  const [nombre, setNombre] = useState('');
  const [tipoObra, setTipoObra] = useState<TipoObra>('residencial');
  const [error, setError] = useState('');

  useEffect(() => {
    if (capitulo) {
      setNombre(capitulo.nombre);
      setTipoObra((capitulo.tipo_obra as TipoObra) ?? 'residencial');
      setError('');
    }
  }, [capitulo, isOpen]);

  function handleClose() {
    setError('');
    setConfirmEliminar(false);
    onClose();
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!capitulo) return;
    setError('');

    if (nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await actualizarCapitulo(capitulo.id, { nombre, tipo_obra: tipoObra });
      if (!res.success) {
        setError(res.error ?? 'Error al guardar.');
      } else {
        toast.success('Capítulo actualizado.');
        router.refresh();
        handleClose();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar() {
    if (!capitulo) return;
    setDeleting(true);
    try {
      const res = await eliminarCapitulo(capitulo.id);
      if (!res.success) {
        setConfirmEliminar(false);
        setError(res.error ?? 'No se pudo eliminar.');
      } else {
        toast.success('Capítulo eliminado.');
        router.refresh();
        handleClose();
      }
    } finally {
      setDeleting(false);
    }
  }

  if (!capitulo) return null;

  return (
    <>
      <Modal open={isOpen} onOpenChange={open => { if (!open) handleClose(); }}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>Editar capítulo</ModalTitle>
          </ModalHeader>

          <form onSubmit={handleGuardar} className="mt-4 space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                Nombre del capítulo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full h-9 px-3 text-[13px] border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#D95510] bg-[#F8F7F5]"
                autoFocus
              />
            </div>

            {/* Tipo de obra */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                Tipo de obra <span className="text-red-500">*</span>
              </label>
              <select
                value={tipoObra}
                onChange={e => setTipoObra(e.target.value as TipoObra)}
                className="w-full h-9 px-3 text-[13px] border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#D95510] bg-[#F8F7F5]"
              >
                {TIPOS_OBRA.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-2 pt-2">
              {/* Botón eliminar */}
              <button
                type="button"
                onClick={() => setConfirmEliminar(true)}
                disabled={loading || deleting}
                className="flex items-center gap-1.5 text-[12px] text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar capítulo
              </button>

              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" loading={loading} disabled={nombre.trim().length < 2}>
                  Guardar cambios
                </Button>
              </div>
            </div>
          </form>
        </ModalContent>
      </Modal>

      <ConfirmDialog
        open={confirmEliminar}
        title="¿Eliminar este capítulo?"
        description={`Se eliminará "${capitulo.nombre}". Esta acción no se puede deshacer.`}
        confirmLabel={deleting ? 'Eliminando…' : 'Sí, eliminar'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleEliminar}
        onCancel={() => setConfirmEliminar(false)}
      />
    </>
  );
}
