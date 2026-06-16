'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { proveedorSchema } from '@/lib/validations/schemas';
import { crearProveedor, actualizarProveedor } from '@/actions/proveedores';
import { toast } from 'sonner';
import type { Proveedor } from '@/types';
import { CATEGORIA_PROVEEDOR_LABELS } from '@/types';
import { MunicipioCombobox } from '@/components/clientes/MunicipioCombobox';
import { Building2, User, Phone, Mail, Globe, FileText, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SelectDropdown } from '@/components/shared/SelectDropdown';

interface ModalProveedorProps {
  isOpen: boolean;
  onClose: () => void;
  proveedor?: Proveedor;
  onSuccess?: (nuevoProveedor: any) => void;
}

const FORM_INICIAL = {
  tipo: 'empresa' as 'persona' | 'empresa',
  nombre_razon_social: '',
  nit_cedula: '',
  categoria: 'ferreteria' as Proveedor['categoria'],
  ciudad: '',
  email: '',
  telefono: '',
  sitio_web: '',
  notas: '',
};

const REGEX_TIPO_B = /^(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-&()'"#/]+$/;

export function ModalProveedor({ isOpen, onClose, proveedor, onSuccess }: ModalProveedorProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [formError, setFormError] = useState<string | null>(null);
  const [nombreError, setNombreError] = useState('');
  const [telefonoError, setTelefonoError] = useState('');
  const [nitError, setNitError] = useState('');

  useEffect(() => {
    if (proveedor) {
      setFormData({
        tipo: proveedor.tipo,
        nombre_razon_social: proveedor.nombre_razon_social,
        nit_cedula: proveedor.nit_cedula || '',
        categoria: proveedor.categoria,
        ciudad: proveedor.ciudad || '',
        email: proveedor.email || '',
        telefono: proveedor.telefono || '',
        sitio_web: proveedor.sitio_web || '',
        notas: proveedor.notas || '',
      });
    } else {
      setFormData(FORM_INICIAL);
    }
    setFormError(null);
    setNombreError('');
    setTelefonoError('');
    setNitError('');
  }, [proveedor, isOpen]);

  const set = (field: keyof typeof FORM_INICIAL) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const isFormValid = formData.nombre_razon_social.trim().length >= 2 && !nombreError && !telefonoError && !nitError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const validated = proveedorSchema.parse(formData);

      setFormError(null);
      if (proveedor) {
        const res = await actualizarProveedor(proveedor.id, validated);
        if (res.success) {
          toast.success('Proveedor actualizado correctamente');
          onSuccess?.({} as any);
          onClose();
        } else {
          setFormError(res.error || 'Error al actualizar proveedor');
          toast.error(res.error || 'Error al actualizar proveedor');
        }
      } else {
        const res = await crearProveedor(validated);
        if (res.success) {
          toast.success('Proveedor creado correctamente');
          onSuccess?.(res.data);
          onClose();
        } else {
          setFormError(res.error || 'Error al crear proveedor');
          toast.error(res.error || 'Error al crear proveedor');
        }
      }
    } catch (error: any) {
      const msg = error.issues?.[0]?.message ?? 'Error de validación';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>{proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</ModalTitle>
          <ModalDescription>Registra la información de tu proveedor para asociarlo a tus APUs.</ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <ErrorMessage message={formError} onDismiss={() => setFormError(null)} />
          )}
          {/* Tipo selector */}
          <div className="flex p-1 bg-sand rounded-lg w-fit">
            {(['persona', 'empresa'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, tipo: t }))}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                  formData.tipo === t ? 'bg-[#E8571A] text-white shadow-sm' : 'text-mortar hover:text-stone'
                )}
              >
                {t === 'persona' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                {t === 'persona' ? 'Persona Natural' : 'Persona Jurídica'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna izquierda: datos básicos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-stone font-semibold border-b border-concrete pb-2">
                <FileText className="h-4 w-4 text-[var(--accent-primary)]" />
                <span>Información Básica</span>
              </div>

              <Input
                label={`${formData.tipo === 'empresa' ? 'Razón Social' : 'Nombre Completo'} *`}
                required
                value={formData.nombre_razon_social}
                onChange={(e) => { setFormData(prev => ({ ...prev, nombre_razon_social: e.target.value })); if (nombreError) setNombreError(''); }}
                onBlur={() => {
                  const v = formData.nombre_razon_social.trim();
                  if (v.length >= 2 && !REGEX_TIPO_B.test(v)) setNombreError('Debe contener al menos una letra');
                  else setNombreError('');
                }}
                placeholder={formData.tipo === 'empresa' ? 'Ej. Ferretería El Constructor S.A.S.' : 'Ej. Carlos Herrera'}
                error={nombreError || undefined}
              />

              <Input
                label={formData.tipo === 'empresa' ? 'NIT' : 'Cédula'}
                value={formData.nit_cedula}
                onChange={(e) => { setFormData(prev => ({ ...prev, nit_cedula: e.target.value })); if (nitError) setNitError(''); }}
                onBlur={() => {
                  const v = formData.nit_cedula.trim();
                  if (v && !/^[\d.\-]+$/.test(v)) setNitError('Formato inválido. Ej: 900.123.456-7');
                  else setNitError('');
                }}
                placeholder="Ej. 900.123.456-7"
                error={nitError || undefined}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                  Categoría
                </label>
                <SelectDropdown
                  value={formData.categoria}
                  onChange={(v) => setFormData(prev => ({ ...prev, categoria: v as Proveedor['categoria'] }))}
                  options={(Object.entries(CATEGORIA_PROVEEDOR_LABELS) as [Proveedor['categoria'], string][]).map(([val, label]) => ({ value: val, label }))}
                />
              </div>

              <MunicipioCombobox
                value={formData.ciudad}
                onChange={(ciudad) => setFormData(prev => ({ ...prev, ciudad }))}
                label="Ciudad"
              />
            </div>

            {/* Columna derecha: contacto */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-stone font-semibold border-b border-concrete pb-2">
                <Phone className="h-4 w-4 text-[var(--accent-primary)]" />
                <span>Contacto</span>
              </div>

              <Input
                label="Teléfono"
                type="text"
                icon={<Phone className="h-4 w-4" />}
                value={formData.telefono}
                onChange={(e) => { setFormData(prev => ({ ...prev, telefono: e.target.value })); if (telefonoError) setTelefonoError(''); }}
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
                onChange={set('email')}
                placeholder="Ej. ventas@proveedor.com"
              />

              <Input
                label="Sitio web"
                icon={<Globe className="h-4 w-4" />}
                value={formData.sitio_web}
                onChange={set('sitio_web')}
                placeholder="https://www.proveedor.com"
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={set('notas')}
                  className="w-full min-h-[95px] p-3 text-sm rounded-lg border border-concrete focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all outline-none resize-none"
                  placeholder="Condiciones de pago, tiempo de entrega, contacto clave..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-concrete">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading} disabled={!isFormValid}>
              {proveedor ? 'Guardar Cambios' : 'Crear Proveedor'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
