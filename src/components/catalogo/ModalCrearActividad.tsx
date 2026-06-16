'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { crearActividad } from '@/actions/catalogo';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { SelectDropdown } from '@/components/shared/SelectDropdown';
import type { CatalogoCapitulo, CatalogoActividad } from '@/types';

const UNIDADES_COMUNES = ['m²', 'ml', 'm³', 'kg', 'und', 'gl', 'hr', 'jor'] as const;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  capitulos: CatalogoCapitulo[];
  capituloIdInicial?: string;
  onCreated?: (actividad: CatalogoActividad) => void;
}

export function ModalCrearActividad({ isOpen, onClose, capitulos, capituloIdInicial, onCreated }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState('m²');
  const [unidadCustom, setUnidadCustom] = useState('');
  const [precio, setPrecio] = useState('');
  const [rangoMin, setRangoMin] = useState('');
  const [rangoMax, setRangoMax] = useState('');
  const [capituloId, setCapituloId] = useState(capituloIdInicial ?? '');
  const [error, setError] = useState('');

  // Sincroniza el capítulo preseleccionado cada vez que el modal abre con un capítulo distinto
  useEffect(() => {
    if (isOpen) setCapituloId(capituloIdInicial ?? '');
  }, [isOpen, capituloIdInicial]);

  const unidadFinal = unidad === '__custom__' ? unidadCustom : unidad;

  function resetForm() {
    setNombre('');
    setUnidad('m²');
    setUnidadCustom('');
    setPrecio('');
    setRangoMin('');
    setRangoMax('');
    setCapituloId(capituloIdInicial ?? '');
    setError('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (nombre.trim().length < 2) { setError('El nombre debe tener al menos 2 caracteres.'); return; }
    if (!unidadFinal.trim()) { setError('Selecciona o ingresa una unidad.'); return; }
    if (!capituloId) { setError('Selecciona el capítulo al que pertenece esta actividad.'); return; }

    setLoading(true);
    try {
      const res = await crearActividad({
        capitulo_id: capituloId,
        nombre,
        unidad: unidadFinal,
        precio_referencia_nacional: Number(precio) || 0,
        rango_min: Number(rangoMin) || 0,
        rango_max: Number(rangoMax) || 0,
      });
      if (!res.success) {
        setError(res.error ?? 'Error desconocido.');
      } else {
        toast.success('Actividad creada exitosamente.');
        if (onCreated && res.data) {
          resetForm();
          onCreated(res.data);
        } else {
          router.refresh();
          handleClose();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={open => { if (!open) handleClose(); }}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>Nueva actividad</ModalTitle>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Capítulo */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">
              Capítulo <span className="text-red-500">*</span>
            </label>
            <SelectDropdown
              value={capituloId}
              onChange={setCapituloId}
              options={capitulos.map(c => ({ value: c.id, label: c.nombre }))}
              placeholder="— Seleccionar capítulo —"
              size="sm"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">
              Nombre de la actividad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Concreto de cimentación f'c=21MPa"
              className="w-full h-9 px-3 text-[13px] border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#D95510] bg-[#F8F7F5]"
              autoFocus
            />
          </div>

          {/* Unidad */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">
              Unidad <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <SelectDropdown
                value={unidad}
                onChange={setUnidad}
                options={[...UNIDADES_COMUNES.map(u => ({ value: u, label: u })), { value: '__custom__', label: 'Otra...' }]}
                className="flex-1"
                size="sm"
              />
              {unidad === '__custom__' && (
                <input
                  type="text"
                  value={unidadCustom}
                  onChange={e => setUnidadCustom(e.target.value)}
                  placeholder="Ingresa unidad"
                  className="flex-1 h-9 px-3 text-[13px] border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#D95510] bg-[#F8F7F5]"
                />
              )}
            </div>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1">Precio ref. (COP)</label>
              <input
                type="number"
                min="0"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                placeholder="0"
                className="w-full h-9 px-3 text-[13px] border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#D95510] bg-[#F8F7F5]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1">Rango mín.</label>
              <input
                type="number"
                min="0"
                value={rangoMin}
                onChange={e => setRangoMin(e.target.value)}
                placeholder="0"
                className="w-full h-9 px-3 text-[13px] border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#D95510] bg-[#F8F7F5]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1">Rango máx.</label>
              <input
                type="number"
                min="0"
                value={rangoMax}
                onChange={e => setRangoMax(e.target.value)}
                placeholder="0"
                className="w-full h-9 px-3 text-[13px] border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#D95510] bg-[#F8F7F5]"
              />
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
            <Button type="submit" size="sm" loading={loading} disabled={nombre.trim().length < 2 || !capituloId}>
              Crear actividad
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
