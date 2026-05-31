'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
} from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { ClienteSelector } from '@/components/clientes/ClienteSelector';
import { MunicipioCombobox } from '@/components/clientes/MunicipioCombobox';
import { actualizarProyecto } from '@/actions/proyectos';
import { SelectorTipoObra } from '@/components/shared/SelectorTipoObra';

interface EditarProyectoModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto: {
    id: string;
    nombre: string;
    descripcion?: string | null;
    ubicacion?: string | null;
    tipo_obra?: string | null;
    cliente_id?: string | null;
    cliente_nombre?: string | null;
    area_m2?: number | null;
  };
}

const REGEX_TIPO_B = /^(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-&()'"#/]+$/;

export function EditarProyectoModal({ isOpen, onClose, proyecto }: EditarProyectoModalProps) {
  const router = useRouter();
  const [nombre,      setNombre]      = useState(proyecto.nombre);
  const [descripcion, setDescripcion] = useState(proyecto.descripcion ?? '');
  const [ubicacion,   setUbicacion]   = useState(proyecto.ubicacion   ?? '');
  const [tipoObra,    setTipoObra]    = useState(proyecto.tipo_obra   ?? '');
  const [clienteId,   setClienteId]   = useState<string | null>(proyecto.cliente_id ?? null);
  const [areaM2,      setAreaM2]      = useState(proyecto.area_m2 != null ? String(proyecto.area_m2) : '');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [nombreError, setNombreError] = useState('');

  async function handleSave() {
    if (!nombre.trim())   { setError('El nombre es obligatorio.');  return; }
    if (!ubicacion.trim()) { setError('La ciudad es obligatoria.'); return; }
    setSaving(true);
    setError('');
    const areaM2Num = areaM2.trim() ? Number(areaM2.trim()) : undefined;
    const result = await actualizarProyecto(proyecto.id, {
      nombre:      nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      ubicacion:   ubicacion.trim(),
      tipo_obra:   tipoObra || null,
      cliente_id:  clienteId ?? null,
      ...(areaM2Num !== undefined && { area_m2: areaM2Num }),
    });
    setSaving(false);
    if (result.success) {
      router.refresh();
      onClose();
    } else {
      setError(result.error ?? 'Error al guardar.');
    }
  }

  const fieldCls = "w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500";

  return (
    <Modal open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>Editar proyecto</ModalTitle>
        </ModalHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Nombre <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={nombre}
              onChange={e => { setNombre(e.target.value); if (nombreError) setNombreError(''); }}
              onBlur={() => {
                const v = nombre.trim();
                if (!v) setNombreError('El nombre es obligatorio');
                else if (!REGEX_TIPO_B.test(v)) setNombreError('Debe contener al menos una letra');
                else setNombreError('');
              }}
              className={fieldCls}
              placeholder="Ej. Casa Lote 5 - Urbanización El Prado"
            />
            {nombreError && <p className="mt-1 text-xs text-red-600">{nombreError}</p>}
          </div>

          <MunicipioCombobox
            value={ubicacion}
            onChange={setUbicacion}
            label="Ciudad *"
            placeholder="Buscar municipio..."
          />

          <SelectorTipoObra
            value={tipoObra}
            onChange={setTipoObra}
            label="Tipo de obra"
          />

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Área (m²)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={areaM2}
              onChange={e => setAreaM2(e.target.value)}
              className={fieldCls}
              placeholder="Ej. 250.5"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Cliente</label>
            <ClienteSelector
              selectedId={clienteId}
              onSelect={setClienteId}
              initialCliente={proyecto.cliente_id && proyecto.cliente_nombre
                ? { id: proyecto.cliente_id, nombre_razon_social: proyecto.cliente_nombre }
                : null}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
              className={`${fieldCls} resize-none`}
              placeholder="Descripción opcional"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
