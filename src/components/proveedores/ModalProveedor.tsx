'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { proveedorSchema } from '@/lib/validations/schemas';
import { crearProveedor, actualizarProveedor } from '@/actions/proveedores';
import { toast } from 'sonner';
import type { Proveedor } from '@/types';
import { CATEGORIA_PROVEEDOR_LABELS, CIUDADES_COLOMBIA } from '@/types';
import { Building2, User, Phone, Mail, Globe, FileText, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function ModalProveedor({ isOpen, onClose, proveedor, onSuccess }: ModalProveedorProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(FORM_INICIAL);

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
  }, [proveedor, isOpen]);

  const set = (field: keyof typeof FORM_INICIAL) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const validated = proveedorSchema.parse(formData);

      if (proveedor) {
        const res = await actualizarProveedor(proveedor.id, validated);
        if (res.success) {
          toast.success('Proveedor actualizado correctamente');
          onSuccess?.({} as any);
          onClose();
        } else {
          toast.error(res.error || 'Error al actualizar proveedor');
        }
      } else {
        const res = await crearProveedor(validated);
        if (res.success) {
          toast.success('Proveedor creado correctamente');
          onSuccess?.(res.data);
          onClose();
        } else {
          toast.error(res.error || 'Error al crear proveedor');
        }
      }
    } catch (error: any) {
      toast.error(error.issues?.[0]?.message ?? 'Error de validación');
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
          {/* Tipo selector */}
          <div className="flex p-1 bg-steel-fog rounded-lg w-fit">
            {(['persona', 'empresa'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, tipo: t }))}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                  formData.tipo === t ? 'bg-white text-stone shadow-sm' : 'text-mortar hover:text-stone'
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
                label={formData.tipo === 'empresa' ? 'Razón Social' : 'Nombre Completo'}
                required
                value={formData.nombre_razon_social}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_razon_social: e.target.value }))}
                placeholder={formData.tipo === 'empresa' ? 'Ej. Ferretería El Constructor S.A.S.' : 'Ej. Carlos Herrera'}
              />

              <Input
                label={formData.tipo === 'empresa' ? 'NIT' : 'Cédula'}
                value={formData.nit_cedula}
                onChange={set('nit_cedula')}
                placeholder="Ej. 900.123.456-7"
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                  Categoría
                </label>
                <select
                  value={formData.categoria}
                  onChange={set('categoria')}
                  className="w-full h-10 px-3 bg-white border border-concrete rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all"
                >
                  {(Object.entries(CATEGORIA_PROVEEDOR_LABELS) as [Proveedor['categoria'], string][]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone">Ciudad</label>
                <select
                  value={formData.ciudad}
                  onChange={set('ciudad')}
                  className="w-full h-10 px-3 bg-white border border-concrete rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all"
                >
                  <option value="">Selecciona ciudad...</option>
                  {CIUDADES_COLOMBIA.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Columna derecha: contacto */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-stone font-semibold border-b border-concrete pb-2">
                <Phone className="h-4 w-4 text-[var(--accent-primary)]" />
                <span>Contacto</span>
              </div>

              <Input
                label="Teléfono"
                icon={<Phone className="h-4 w-4" />}
                value={formData.telefono}
                onChange={set('telefono')}
                placeholder="Ej. 300 123 4567"
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
            <Button type="submit" loading={loading}>
              {proveedor ? 'Guardar Cambios' : 'Crear Proveedor'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
