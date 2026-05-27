'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Save, Loader2, ChevronDown } from 'lucide-react';
import { z } from 'zod';
import { crearTrabajador, actualizarTrabajador } from '@/actions/mano-obra';
import type { TrabajadorReferencia } from '@/actions/mano-obra';
import { cn } from '@/lib/utils';

const CATEGORIAS = ['director', 'residente', 'maestro', 'oficial', 'ayudante', 'especialista'] as const;

const CATEGORIAS_LABELS: Record<typeof CATEGORIAS[number], string> = {
  director:    'Director',
  residente:   'Residente',
  maestro:     'Maestro',
  oficial:     'Oficial',
  ayudante:    'Ayudante',
  especialista:'Especialista',
};

const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;

const schema = z.object({
  especialidad: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .regex(SOLO_LETRAS, 'La especialidad solo acepta letras'),
  categoria: z.enum(CATEGORIAS, { error: 'Categoría inválida' }),
  jornal_base: z.number({ error: 'Ingresa un valor numérico' }).positive('Debe ser mayor a 0'),
  factor_prestacional: z
    .number({ error: 'Ingresa un valor numérico' })
    .min(1, 'Mínimo 1.0')
    .max(3, 'Máximo 3.0'),
  nivel_riesgo: z.number().int().min(1).max(5),
  ciudad_referencia: z.string().max(50).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  trabajador?: TrabajadorReferencia;
  onClose: () => void;
  onSaved: (t: TrabajadorReferencia) => void;
}

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function ModalTrabajador({ trabajador, onClose, onSaved }: Props) {
  const isEditing = !!trabajador;

  const [form, setForm] = useState<FormValues>({
    especialidad: trabajador?.especialidad ?? '',
    categoria: (trabajador?.categoria as FormValues['categoria']) ?? 'oficial',
    jornal_base: trabajador?.jornal_base ?? 0,
    factor_prestacional: trabajador?.factor_prestacional ?? 1.5988,
    nivel_riesgo: 4,
    ciudad_referencia: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [categoriaOpen, setCategoriaOpen] = useState(false);
  const categoriaRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown de categoría al hacer clic fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (categoriaRef.current && !categoriaRef.current.contains(e.target as Node)) {
        setCategoriaOpen(false);
      }
    }
    if (categoriaOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [categoriaOpen]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function validarEspecialidad(valor: string) {
    if (!valor.trim()) return;
    if (!SOLO_LETRAS.test(valor.trim())) {
      setErrors((p) => ({ ...p, especialidad: 'La especialidad solo acepta letras' }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: Partial<Record<keyof FormValues, string>> = {};
      for (const err of parsed.error.issues) {
        const k = err.path[0] as keyof FormValues;
        if (!fe[k]) fe[k] = err.message;
      }
      setErrors(fe);
      return;
    }

    setSaving(true);
    const result = isEditing
      ? await actualizarTrabajador(trabajador.id, parsed.data)
      : await crearTrabajador(parsed.data);
    setSaving(false);

    if (!result.success || !result.data) {
      setServerError(result.error ?? 'Error al guardar');
      return;
    }
    onSaved(result.data);
  }

  const jornalEstimado = form.jornal_base > 0
    ? form.jornal_base * form.factor_prestacional
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
            {isEditing ? 'Editar trabajador' : 'Nuevo trabajador'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#E5E7EB] rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-[#6B7280]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Especialidad */}
          <Field label="Especialidad *" error={errors.especialidad}>
            <input
              value={form.especialidad}
              onChange={(e) => set('especialidad', e.target.value)}
              onBlur={(e) => validarEspecialidad(e.target.value)}
              maxLength={100}
              placeholder="Ej: Maestro de obra, Electricista"
              className={inputCls(!!errors.especialidad)}
            />
          </Field>

          {/* Categoría — dropdown custom */}
          <Field label="Categoría *" error={errors.categoria}>
            <div ref={categoriaRef} className="relative">
              <button
                type="button"
                onClick={() => setCategoriaOpen((v) => !v)}
                className={cn(
                  inputCls(!!errors.categoria),
                  'flex items-center justify-between text-left cursor-pointer'
                )}
              >
                <span>{CATEGORIAS_LABELS[form.categoria]}</span>
                <ChevronDown className={cn('h-4 w-4 text-[#6B7280] transition-transform', categoriaOpen && 'rotate-180')} />
              </button>
              {categoriaOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-[#D1D5DB] rounded-lg shadow-lg overflow-hidden">
                  {CATEGORIAS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { set('categoria', c); setCategoriaOpen(false); }}
                      className={cn(
                        'w-full px-3 py-2.5 text-left text-sm transition-colors',
                        form.categoria === c
                          ? 'bg-[#D95510] text-white font-semibold'
                          : 'text-[#374151] hover:bg-[#F3F4F6]'
                      )}
                    >
                      {CATEGORIAS_LABELS[c]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {/* Jornal base */}
            <Field label="Jornal base/día (COP) *" error={errors.jornal_base}>
              <input
                type="number"
                value={form.jornal_base || ''}
                onChange={(e) => set('jornal_base', Number(e.target.value))}
                min={0}
                step={1000}
                placeholder="ej: 79 000"
                className={inputCls(!!errors.jornal_base)}
              />
            </Field>

            {/* Factor prestacional */}
            <Field label="Factor prestacional *" error={errors.factor_prestacional}>
              <input
                type="number"
                value={form.factor_prestacional}
                onChange={(e) => set('factor_prestacional', Number(e.target.value))}
                min={1}
                max={3}
                step={0.0001}
                placeholder="1.5988"
                className={inputCls(!!errors.factor_prestacional)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Nivel ARL */}
            <Field label="Nivel ARL (1–5) *" error={errors.nivel_riesgo}>
              <select
                value={form.nivel_riesgo}
                onChange={(e) => set('nivel_riesgo', Number(e.target.value))}
                className={inputCls(!!errors.nivel_riesgo)}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>Nivel {n}</option>
                ))}
              </select>
            </Field>

            {/* Ciudad referencia */}
            <Field label="Ciudad referencia" error={undefined}>
              <input
                value={form.ciudad_referencia ?? ''}
                onChange={(e) => set('ciudad_referencia', e.target.value)}
                maxLength={50}
                placeholder="Nacional"
                className={inputCls(false)}
              />
            </Field>
          </div>

          {/* Preview jornal c/prestaciones */}
          {jornalEstimado !== null && (
            <div className="rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-2 text-xs text-[#166534]">
              Jornal con prestaciones estimado:{' '}
              <span className="font-bold tabular-nums">
                {COP.format(jornalEstimado)}
              </span>
              /día
            </div>
          )}

          {serverError && (
            <p className="text-xs text-[#991B1B] bg-[#FEF2F2] px-3 py-2 rounded-lg border border-[#FECACA]">
              {serverError}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-[#D1D5DB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D95510] text-white rounded-lg text-sm font-semibold hover:bg-[#C04A0D] transition-colors disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                <><Save className="h-4 w-4" /> {isEditing ? 'Guardar cambios' : 'Crear trabajador'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    'w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-all bg-white',
    hasError
      ? 'border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500'
      : 'border-[#D1D5DB] focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20',
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
