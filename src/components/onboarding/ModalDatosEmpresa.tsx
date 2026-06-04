'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { MunicipioCombobox } from '@/components/clientes/MunicipioCombobox';
import { toast } from 'sonner';
import { guardarEmpresaOnboarding } from '@/actions/perfil';
import { cn } from '@/lib/utils';

interface Props {
  abierto:    boolean;
  onCerrar:   () => void;
  onGuardado: () => void;
}

export function ModalDatosEmpresa({ abierto, onCerrar, onGuardado }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    empresa:       '',
    nit:           '',
    ciudad:        '',
    telefono:      '',
    email_empresa: '',
    direccion:     '',
  });

  if (!abierto) return null;

  const field = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const handleGuardar = async () => {
    if (!form.empresa.trim()) {
      toast.error('El nombre de la empresa es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const result = await guardarEmpresaOnboarding(form);
      if (!result.success) throw new Error(result.error ?? 'Error al guardar');
      toast.success('¡Datos de empresa guardados!');
      router.refresh();
      onGuardado();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const inputBase =
    'w-full h-10 px-4 bg-[#F8F7F5] border border-[#E8E4DE] rounded-lg text-sm text-[#1C1814] ' +
    'placeholder:text-[#C4BBAD] outline-none transition-all ' +
    'focus:border-[#C84B1A] focus:ring-2 focus:ring-[#C84B1A]/20';
  const inputIcon =
    'w-full h-10 pl-10 pr-4 bg-[#F8F7F5] border border-[#E8E4DE] rounded-lg text-sm text-[#1C1814] ' +
    'placeholder:text-[#C4BBAD] outline-none transition-all ' +
    'focus:border-[#C84B1A] focus:ring-2 focus:ring-[#C84B1A]/20';
  const labelCls = 'text-[11px] font-medium text-[#6B7A8D] tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#E8E4DE]">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#1C1814]">Datos de empresa</h2>
            <p className="text-[12px] text-[#6B7A8D]">
              Esta información aparece en tus PDFs y presupuestos.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          <div className="space-y-1.5">
            <label className={labelCls}>Razón Social / Nombre de empresa *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4BBAD]" />
              <input
                value={form.empresa}
                onChange={field('empresa')}
                placeholder="Ej: Constructora ABC S.A.S"
                className={cn(inputIcon, 'font-semibold')}
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>NIT / Documento</label>
            <input
              value={form.nit}
              onChange={field('nit')}
              placeholder="900.123.456-7"
              className={cn(inputBase, 'font-mono tracking-wider')}
            />
          </div>

          <MunicipioCombobox
            value={form.ciudad}
            onChange={ciudad => setForm(f => ({ ...f, ciudad }))}
            label="Ciudad principal"
            placeholder="Buscar municipio..."
          />

          <div className="space-y-1.5">
            <label className={labelCls}>Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4BBAD]" />
              <input
                value={form.telefono}
                onChange={field('telefono')}
                placeholder="Ej: 300 123 4567"
                className={inputIcon}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Correo electrónico empresa</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4BBAD]" />
              <input
                type="email"
                value={form.email_empresa}
                onChange={field('email_empresa')}
                placeholder="contacto@empresa.com"
                className={inputIcon}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Dirección física</label>
            <input
              value={form.direccion}
              onChange={field('direccion')}
              placeholder="Ej: Carrera 15 # 98-42 Of 301"
              className={inputBase}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E4DE] bg-[#FAFAFA]">
          <button
            type="button"
            onClick={onCerrar}
            className="text-sm text-[#6B7A8D] hover:text-[#1C1814] transition-colors"
          >
            Completar después
          </button>
          <Button
            onClick={handleGuardar}
            loading={saving}
            disabled={!form.empresa.trim()}
            icon={<Building2 className="h-4 w-4" />}
          >
            Guardar empresa
          </Button>
        </div>
      </div>
    </div>
  );
}
