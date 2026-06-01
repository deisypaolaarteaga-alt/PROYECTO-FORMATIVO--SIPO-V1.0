'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { crearCapitulo } from '@/actions/catalogo';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const TIPOS_OBRA = [
  { id: 'residencial',     label: 'Residencial',     prefijo: 'RES' },
  { id: 'comercial',       label: 'Comercial',        prefijo: 'COM' },
  { id: 'industrial',      label: 'Industrial',       prefijo: 'IND' },
  { id: 'infraestructura', label: 'Infraestructura',  prefijo: 'INF' },
  { id: 'institucional',   label: 'Institucional',    prefijo: 'INS' },
  { id: 'hotelero',        label: 'Hotelero',         prefijo: 'HOT' },
] as const;

type TipoObra = typeof TIPOS_OBRA[number]['id'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tipoObraInicial?: TipoObra;
}

export function ModalCrearCapitulo({ isOpen, onClose, tipoObraInicial = 'residencial' }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const [tipoObra, setTipoObra] = useState<TipoObra>(tipoObraInicial);
  const [error, setError] = useState('');

  // Sincroniza el tipo de obra preseleccionado cada vez que el modal abre con un tipo distinto
  useEffect(() => {
    if (isOpen) setTipoObra(tipoObraInicial);
  }, [isOpen, tipoObraInicial]);

  function resetForm() {
    setNombre('');
    setTipoObra(tipoObraInicial);
    setError('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await crearCapitulo({ nombre, tipo_obra: tipoObra });
      if (!res.success) {
        setError(res.error ?? 'Error desconocido.');
      } else {
        toast.success('Capítulo creado exitosamente.');
        router.refresh();
        handleClose();
      }
    } finally {
      setLoading(false);
    }
  }

  const prefijoActual = TIPOS_OBRA.find(t => t.id === tipoObra)?.prefijo ?? 'CAP';

  return (
    <Modal open={isOpen} onOpenChange={open => { if (!open) handleClose(); }}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>Nuevo capítulo</ModalTitle>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">
              Nombre del capítulo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Cimentación y estructura"
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

          {/* Código — generado automáticamente */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">
              Código
            </label>
            <div className="flex items-center h-9 px-3 text-[13px] border border-[#E5E1D8] rounded-lg bg-slate-50 text-slate-400 select-none">
              <span className="font-mono">{prefijoActual}-XX</span>
              <span className="ml-2 text-[11px] text-slate-400">(asignado automáticamente)</span>
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={loading} disabled={nombre.trim().length < 2}>
              Crear capítulo
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
