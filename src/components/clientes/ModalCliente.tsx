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

const REGEX_TIPO_B = /^(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-&()'"#/]+$/;
const REGEX_TIPO_A = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-]+$/;

export function ModalCliente({ isOpen, onClose, cliente, onSuccess }: ModalClienteProps) {
  const [loading, setLoading] = useState(false);
  const [nombreError, setNombreError] = useState('');
  const [ciudadError, setCiudadError] = useState('');
  const [nombreContactoError, setNombreContactoError] = useState('');
  const [cargoContactoError, setCargoContactoError] = useState('');
  const [telefonoError, setTelefonoError] = useState('');
  const [nitError, setNitError] = useState('');
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
    setNombreError('');
    setCiudadError('');
    setNombreContactoError('');
    setCargoContactoError('');
    setTelefonoError('');
    setNitError('');
  }, [cliente, isOpen]);

  const isFormValid =
    formData.nombre_razon_social.trim().length >= 2 &&
    formData.ciudad.trim().length >= 1 &&
    !nombreError &&
    !nombreContactoError &&
    !cargoContactoError &&
    !telefonoError &&
    !nitError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let valid = true;
    if (formData.nombre_razon_social.trim().length < 2) {
      setNombreError('Este campo es obligatorio');
      valid = false;
    }
    if (!formData.ciudad.trim()) {
      setCiudadError('Este campo es obligatorio');
      valid = false;
    }
    if (!valid) return;

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
              label={`${formData.tipo === 'empresa' ? 'Razón Social' : 'Nombre Completo'} *`}
              required
              value={formData.nombre_razon_social}
              onChange={(e) => { setFormData({ ...formData, nombre_razon_social: e.target.value }); if (nombreError) setNombreError(''); }}
              onBlur={() => {
                const v = formData.nombre_razon_social.trim();
                if (v.length < 2) setNombreError('Este campo es obligatorio');
                else if (!REGEX_TIPO_B.test(v)) setNombreError('Debe contener al menos una letra');
                else setNombreError('');
              }}
              placeholder={formData.tipo === 'empresa' ? 'Ej. Constructora S.A.S.' : 'Ej. Juan Pérez'}
              error={nombreError || undefined}
            />

            <Input
              label={formData.tipo === 'empresa' ? 'NIT' : 'Cédula'}
              value={formData.nit_cedula}
              onChange={(e) => { setFormData({ ...formData, nit_cedula: e.target.value }); if (nitError) setNitError(''); }}
              onBlur={() => {
                const v = formData.nit_cedula.trim();
                if (v && !/^[\d.\-]+$/.test(v)) setNitError('Formato inválido. Ej: 900.123.456-7');
                else setNitError('');
              }}
              placeholder="Ej. 900.123.456-7"
              error={nitError || undefined}
            />

            <div className="space-y-1.5">
              <MunicipioCombobox
                value={formData.ciudad}
                onChange={(ciudad) => { setFormData({ ...formData, ciudad }); if (ciudadError) setCiudadError(''); }}
                onDepartamentoChange={(departamento) => setFormData(prev => ({ ...prev, departamento }))}
                label="Ciudad *"
              />
              {ciudadError && (
                <p className="flex items-center gap-1 text-[11px] text-danger-text">
                  <span className="h-3.5 w-3.5 shrink-0">⚠</span>
                  {ciudadError}
                </p>
              )}
            </div>

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
              onChange={(e) => { setFormData({ ...formData, nombre_contacto: e.target.value }); if (nombreContactoError) setNombreContactoError(''); }}
              onBlur={() => {
                const v = formData.nombre_contacto.trim();
                if (v && !REGEX_TIPO_A.test(v)) setNombreContactoError('Este campo solo acepta letras');
                else setNombreContactoError('');
              }}
              placeholder="Ej. María López (Firma contracts)"
              error={nombreContactoError || undefined}
            />

            <Input
              label="Cargo del contacto"
              value={formData.cargo_contacto}
              onChange={(e) => { setFormData({ ...formData, cargo_contacto: e.target.value }); if (cargoContactoError) setCargoContactoError(''); }}
              onBlur={() => {
                const v = formData.cargo_contacto.trim();
                if (v && !REGEX_TIPO_A.test(v)) setCargoContactoError('Este campo solo acepta letras');
                else setCargoContactoError('');
              }}
              placeholder="Ej. Gerente de Compras"
              error={cargoContactoError || undefined}
            />

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Teléfono"
                type="text"
                icon={<Phone className="h-4 w-4" />}
                value={formData.telefono}
                onChange={(e) => { setFormData({ ...formData, telefono: e.target.value }); if (telefonoError) setTelefonoError(''); }}
                onBlur={() => {
                  const v = formData.telefono.trim();
                  if (v && !/^\d{7,10}$/.test(v)) setTelefonoError('Solo se permiten números (7 a 10 dígitos)');
                  else setTelefonoError('');
                }}
                placeholder="Ej. 300 123 4567"
                error={telefonoError || undefined}
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
          <Button type="submit" loading={loading} disabled={!isFormValid}>
            {cliente ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </div>
      </form>
      </ModalContent>
    </Modal>
  );
}
