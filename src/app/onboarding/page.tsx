'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  MapPin,
  Phone,
  FileText,
  Upload,
  ImageIcon,
  Hammer,
  UserCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  SkipForward,
} from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { Logo } from '@/components/shared/Logo';
import { saveEmpresa, uploadLogo, createFirstProject } from '@/actions/onboarding';
import { CIUDADES_COLOMBIA } from '@/types';
import { cn, getInitials } from '@/lib/utils';

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Nombre del usuario desde metadata (se pierde en client, usamos fallback)
  const userName = 'usuario';

  async function handleStep1(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await saveEmpresa(formData);
    if (result.success) {
      setEmpresaNombre(formData.get('empresa') as string);
      setStep(2);
    } else {
      setError(result.error || 'Error al guardar.');
    }
    setLoading(false);
  }

  async function handleStep2(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await uploadLogo(formData);
    if (result.success) {
      setStep(3);
    } else {
      setError(result.error || 'Error al subir el logo.');
    }
    setLoading(false);
  }

  async function handleStep3(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await createFirstProject(formData);
      if (!result.success) {
        setError(result.error || 'Error al crear el proyecto.');
      }
    } catch {
      // redirect esperado
    }
    setLoading(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  function skip() {
    if (step === 2) setStep(3);
    else if (step === 3) router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header con logo */}
      <header className="flex items-center justify-center py-6">
        <Logo variant="full" size="md" />
      </header>

      {/* Barra de progreso */}
      <div className="mx-auto w-full max-w-md px-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-500',
                s <= step ? 'bg-primary-500' : 'bg-neutral-200',
              )}
            />
          ))}
        </div>
        <p className="text-xs text-neutral-400 text-center">
          Paso {step} de {TOTAL_STEPS}
        </p>
      </div>

      {/* Contenido del paso */}
      <main className="flex-1 flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md animate-slide-up" key={step}>
          {error && (
            <ErrorMessage message={error} className="mb-4" onDismiss={() => setError(null)} />
          )}

          {/* ──── PASO 1: Tu empresa ──── */}
          {step === 1 && (
            <Card shadow="lg" padding="lg" className="border-0">
              <div className="mb-6 text-center">
                <div className="mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
                  <Building2 className="h-6 w-6 text-primary-500" />
                </div>
                <h1 className="text-xl font-bold text-neutral-900">
                  Configuremos tu empresa
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Estos datos aparecerán en tus presupuestos
                </p>
              </div>

              <form action={handleStep1} className="space-y-4">
                <Input
                  name="empresa"
                  label="Nombre de la empresa"
                  placeholder="Mi Constructora S.A.S."
                  icon={<Building2 className="h-4 w-4" />}
                  required
                  onChange={(e) => setEmpresaNombre(e.target.value)}
                />

                <div className="w-full space-y-1.5">
                  <label htmlFor="ciudad-onb" className="block text-sm font-medium text-neutral-700">
                    Ciudad
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <select
                      id="ciudad-onb"
                      name="ciudad"
                      required
                      className="w-full h-10 pl-10 pr-3 text-sm rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="">Selecciona una ciudad</option>
                      {CIUDADES_COLOMBIA.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  name="nit"
                  label="NIT (opcional)"
                  placeholder="900.123.456-7"
                  icon={<FileText className="h-4 w-4" />}
                />

                <Input
                  name="telefono"
                  label="Teléfono (opcional)"
                  placeholder="(601) 234 5678"
                  icon={<Phone className="h-4 w-4" />}
                />

                <Button type="submit" fullWidth loading={loading} icon={<ArrowRight className="h-4 w-4" />}>
                  Continuar
                </Button>
              </form>
            </Card>
          )}

          {/* ──── PASO 2: Tu logo ──── */}
          {step === 2 && (
            <Card shadow="lg" padding="lg" className="border-0">
              <div className="mb-6 text-center">
                <div className="mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary-50">
                  <ImageIcon className="h-6 w-6 text-secondary-500" />
                </div>
                <h1 className="text-xl font-bold text-neutral-900">
                  Logo de tu empresa
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Aparecerá en los PDFs de tus presupuestos
                </p>
              </div>

              <form action={handleStep2} className="space-y-6">
                {/* Preview */}
                <div className="flex justify-center">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Preview del logo"
                      className="h-24 w-24 rounded-xl object-cover border-2 border-neutral-200"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">
                      {getInitials(empresaNombre || 'E')}
                    </div>
                  )}
                </div>

                {/* Input de archivo oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  name="logo"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  icon={<Upload className="h-4 w-4" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? 'Cambiar imagen' : 'Subir logo'}
                </Button>

                <p className="text-xs text-neutral-400 text-center">
                  Máx. 2MB · JPG, PNG o WebP
                </p>

                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)} icon={<ArrowLeft className="h-4 w-4" />}>
                    Atrás
                  </Button>
                  <Button type="submit" fullWidth loading={loading} disabled={!logoPreview}>
                    Continuar
                  </Button>
                </div>
              </form>

              <button
                onClick={skip}
                className="mt-4 w-full flex items-center justify-center gap-1 text-sm text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Omitir por ahora
              </button>
            </Card>
          )}

          {/* ──── PASO 3: Tu primer proyecto ──── */}
          {step === 3 && (
            <Card shadow="lg" padding="lg" className="border-0">
              <div className="mb-6 text-center">
                <div className="mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
                  <Hammer className="h-6 w-6 text-success-600" />
                </div>
                <h1 className="text-xl font-bold text-neutral-900">
                  Tu primer proyecto
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Crea tu primera obra para empezar a presupuestar
                </p>
              </div>

              <form action={handleStep3} className="space-y-4">
                <Input
                  name="nombre"
                  label="Nombre de la obra"
                  placeholder="Edificio Torres del Parque"
                  icon={<Hammer className="h-4 w-4" />}
                  required
                />

                <Input
                  name="cliente_nombre"
                  label="Cliente (opcional)"
                  placeholder="Constructora ABC"
                  icon={<UserCircle className="h-4 w-4" />}
                />

                <div className="w-full space-y-1.5">
                  <label htmlFor="ubicacion-onb" className="block text-sm font-medium text-neutral-700">
                    Ciudad de la obra
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <select
                      id="ubicacion-onb"
                      name="ubicacion"
                      required
                      className="w-full h-10 pl-10 pr-3 text-sm rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="">Selecciona una ciudad</option>
                      {CIUDADES_COLOMBIA.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="w-full space-y-1.5">
                  <label htmlFor="descripcion-onb" className="block text-sm font-medium text-neutral-700">
                    Descripción breve (opcional)
                  </label>
                  <textarea
                    id="descripcion-onb"
                    name="descripcion"
                    rows={3}
                    maxLength={500}
                    placeholder="Breve descripción de la obra..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 resize-none placeholder:text-neutral-400"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setStep(2)} icon={<ArrowLeft className="h-4 w-4" />}>
                    Atrás
                  </Button>
                  <Button type="submit" fullWidth loading={loading} icon={<Check className="h-4 w-4" />}>
                    Crear proyecto
                  </Button>
                </div>
              </form>

              <button
                onClick={skip}
                className="mt-4 w-full flex items-center justify-center gap-1 text-sm text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Omitir por ahora
              </button>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
