'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { clienteSchema } from '@/lib/validations/schemas';
import { crearCliente, actualizarCliente } from '@/actions/clientes';
import { toast } from 'sonner';
import { Cliente } from '@/types';
import { Building2, User, Contact, FileText, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MunicipioCombobox } from './MunicipioCombobox';

interface ModalClienteProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: Cliente;
  onSuccess?: (nuevoCliente: any) => void;
}

export function ModalCliente({ isOpen, onClose, cliente, onSuccess }: ModalClienteProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'empresa' as 'persona_natural' | 'empresa',
    nombre_razon_social: '',
    nit_cedula: '',
    nombre_contacto: '',
    cargo_contacto: '',
    telefono: '',
    email: '',
    ciudad: '',
    departamento: '',
    direccion: '',
    notas: '',
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        tipo: cliente.tipo,
        nombre_razon_social: cliente.nombre_razon_social,
        nit_cedula: cliente.nit_cedula || '',
        nombre_contacto: cliente.nombre_contacto || '',
        cargo_contacto: cliente.cargo_contacto || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        ciudad: cliente.ciudad || '',
        departamento: cliente.departamento || '',
        direccion: cliente.direccion || '',
        notas: cliente.notas || '',
      });
    } else {
      setFormData({
        tipo: 'empresa',
        nombre_razon_social: '',
        nit_cedula: '',
        nombre_contacto: '',
        cargo_contacto: '',
        telefono: '',
        email: '',
        ciudad: '',
        departamento: '',
        direccion: '',
        notas: '',
      });
    }
  }, [cliente, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar con Zod
      const validatedData = clienteSchema.parse(formData);

      if (cliente) {
        const res = await actualizarCliente(cliente.id, validatedData);
        if (res.success) {
          toast.success('Cliente actualizado correctamente');
          onClose();
        } else {
          toast.error(res.error || 'Error al actualizar cliente');
        }
      } else {
        const res = await crearCliente(validatedData);
        if (res.success) {
          toast.success('Cliente creado correctamente');
          onSuccess?.(res.data);
          onClose();
        } else {
          toast.error(res.error || 'Error al crear cliente');
        }
      }
    } catch (error: any) {
      if (error.errors) {
        toast.error(error.issues?.[0]?.message ?? 'Error de validación');
      } else {
        toast.error('Error de validación');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>{cliente ? 'Editar Cliente' : 'Nuevo Cliente'}</ModalTitle>
          <ModalDescription>Registra la información de tu cliente para asociarlo a tus proyectos.</ModalDescription>
        </ModalHeader>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Cliente Selector */}
        <div className="flex p-1 bg-steel-fog rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, tipo: 'persona_natural' })}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              formData.tipo === 'persona_natural' 
                ? "bg-white text-stone shadow-sm" 
                : "text-mortar hover:text-stone"
            )}
          >
            <User className="h-4 w-4" />
            Persona Natural
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, tipo: 'empresa' })}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              formData.tipo === 'empresa'
                ? "bg-white text-stone shadow-sm"
                : "text-mortar hover:text-stone"
            )}
          >
            <Building2 className="h-4 w-4" />
            Persona Jurídica
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECCIÓN 1: Información básica */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-stone font-semibold border-b border-concrete pb-2">
              <FileText className="h-4 w-4 text-[var(--accent-primary)]" />
              <span>Información Básica</span>
            </div>
            
            <Input
              label={formData.tipo === 'empresa' ? 'Razón Social' : 'Nombre Completo'}
              required
              value={formData.nombre_razon_social}
              onChange={(e) => setFormData({ ...formData, nombre_razon_social: e.target.value })}
              placeholder={formData.tipo === 'empresa' ? 'Ej. Constructora S.A.S.' : 'Ej. Juan Pérez'}
            />

            <Input
              label={formData.tipo === 'empresa' ? 'NIT' : 'Cédula'}
              value={formData.nit_cedula}
              onChange={(e) => setFormData({ ...formData, nit_cedula: e.target.value })}
              placeholder="Ej. 900.123.456-7"
            />

            <MunicipioCombobox
              value={formData.ciudad}
              onChange={(ciudad) => setFormData({ ...formData, ciudad })}
              onDepartamentoChange={(departamento) => setFormData(prev => ({ ...prev, departamento }))}
            />

            <Input
              label="Dirección"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Ej. Calle 100 # 15-20"
            />
          </div>

          {/* SECCIÓN 2: Contacto */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-stone font-semibold border-b border-concrete pb-2">
              <Contact className="h-4 w-4 text-[var(--accent-primary)]" />
              <span>Contacto y Firmas</span>
            </div>

            <Input
              label="Nombre del contacto"
              value={formData.nombre_contacto}
              onChange={(e) => setFormData({ ...formData, nombre_contacto: e.target.value })}
              placeholder="Ej. María López (Firma contracts)"
            />

            <Input
              label="Cargo del contacto"
              value={formData.cargo_contacto}
              onChange={(e) => setFormData({ ...formData, cargo_contacto: e.target.value })}
              placeholder="Ej. Gerente de Compras"
            />

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Teléfono"
                icon={<Phone className="h-4 w-4" />}
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Ej. 300 123 4567"
              />
              <Input
                label="Email"
                icon={<Mail className="h-4 w-4" />}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Ej. contacto@cliente.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone">Notas adicionales</label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="w-full min-h-[80px] p-3 text-sm rounded-lg border border-concrete focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all outline-none"
                placeholder="Detalles sobre el cliente..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-concrete">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {cliente ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </div>
      </form>
      </ModalContent>
    </Modal>
  );
}
