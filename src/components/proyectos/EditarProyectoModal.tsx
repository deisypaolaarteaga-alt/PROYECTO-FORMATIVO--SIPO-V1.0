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

const TIPOS_OBRA = [
  { value: 'residencial',    label: 'Residencial' },
  { value: 'comercial',      label: 'Comercial' },
  { value: 'industrial',     label: 'Industrial' },
  { value: 'infraestructura',label: 'Infraestructura' },
  { value: 'institucional',  label: 'Institucional' },
  { value: 'hotelero',       label: 'Hotelero' },
  { value: 'otro',           label: 'Otro' },
];

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
  };
}

export function EditarProyectoModal({ isOpen, onClose, proyecto }: EditarProyectoModalProps) {
  const router = useRouter();
  const [nombre,      setNombre]      = useState(proyecto.nombre);
  const [descripcion, setDescripcion] = useState(proyecto.descripcion ?? '');
  const [ubicacion,   setUbicacion]   = useState(proyecto.ubicacion   ?? '');
  const [tipoObra,    setTipoObra]    = useState(proyecto.tipo_obra   ?? '');
  const [clienteId,   setClienteId]   = useState<string | null>(proyecto.cliente_id ?? null);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  async function handleSave() {
    if (!nombre.trim())   { setError('El nombre es obligatorio.');  return; }
    if (!ubicacion.trim()) { setError('La ciudad es obligatoria.'); return; }
    setSaving(true);
    setError('');
    const result = await actualizarProyecto(proyecto.id, {
      nombre:      nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      ubicacion:   ubicacion.trim(),
      tipo_obra:   tipoObra || null,
      cliente_id:  clienteId ?? null,
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
              onChange={e => setNombre(e.target.value)}
              className={fieldCls}
              placeholder="Nombre del proyecto"
            />
          </div>

          <MunicipioCombobox
            value={ubicacion}
            onChange={setUbicacion}
            label="Ciudad *"
            placeholder="Buscar municipio..."
          />

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Tipo de obra</label>
            <select
              value={tipoObra}
              onChange={e => setTipoObra(e.target.value)}
              className={`${fieldCls} bg-white`}
            >
              <option value="">Sin especificar</option>
              {TIPOS_OBRA.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
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
