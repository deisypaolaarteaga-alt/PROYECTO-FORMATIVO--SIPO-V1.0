'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Building2, MapPin, Globe, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { signUp, signInWithGoogle } from '@/actions/auth';
import { CIUDADES_COLOMBIA } from '@/types';

/** Calcula la fuerza de la contraseña (0–4) */
function getPasswordStrength(pwd: string): number {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return score;
}

const strengthLabels = ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
const strengthColors = [
  'bg-danger-500',
  'bg-danger-400',
  'bg-warning-500',
  'bg-success-500',
  'bg-success-600',
];

export default function RegistroPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await signUp(formData);
      if (!result.success && result.error) {
        setError(result.error);
      }
      if (result.success && result.data) {
        const d = result.data as { needsConfirmation?: boolean };
        if (d.needsConfirmation) setSuccess(true);
      }
    } catch {
      // redirect esperado
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try { await signInWithGoogle(); } catch { /* redirect */ }
  }

  if (success) {
    return (
      <Card padding="lg" className="border border-concrete text-center">
        <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-bg">
          <CheckCircle2 className="h-8 w-8 text-success-text" />
        </div>
        <h2 className="text-[20px] font-semibold text-ink">Revisa tu correo</h2>
        <p className="mt-2 text-[13px] text-stone leading-relaxed">
          Te enviamos un enlace de confirmación. Haz clic en él para activar tu cuenta.
        </p>
        <Link href="/login">
          <Button variant="secondary" className="mt-6">
            Volver al inicio de sesión
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <>
      <Card padding="lg" className="border border-concrete">
        <div className="mb-6">
          <h1 className="text-[20px] font-semibold text-ink">
            Crea tu cuenta
          </h1>
          <p className="mt-1 text-[13px] text-stone">
            Empieza a presupuestar con IA en minutos
          </p>
        </div>

        {error && (
          <ErrorMessage message={error} className="mb-4" onDismiss={() => setError(null)} />
        )}

        <form action={handleSubmit} className="space-y-4">
          <Input
            name="nombre_completo"
            label="Nombre completo"
            placeholder="Juan Pérez"
            icon={<User className="h-4 w-4" />}
            required
          />

          <Input
            name="email"
            type="email"
            label="Correo electrónico"
            placeholder="tu@empresa.com"
            icon={<Mail className="h-4 w-4" />}
            autoComplete="email"
            required
          />

          <div>
            <Input
              name="password"
              type="password"
              label="Contraseña"
              placeholder="Mín. 8 caracteres"
              icon={<Lock className="h-4 w-4" />}
              autoComplete="new-password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            {/* Indicador de seguridad */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                        i < strength ? strengthColors[strength] : 'bg-concrete'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-stone">{strengthLabels[strength]}</p>
              </div>
            )}
          </div>

          <Input
            name="confirmPassword"
            type="password"
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            icon={<Lock className="h-4 w-4" />}
            autoComplete="new-password"
            required
          />

          <Input
            name="empresa"
            label="Empresa (opcional)"
            placeholder="Mi Constructora S.A.S."
            icon={<Building2 className="h-4 w-4" />}
          />

          {/* Select de ciudad */}
          <div className="w-full space-y-1.5">
            <label htmlFor="ciudad" className="block text-[13px] font-medium text-stone">
              Ciudad (opcional)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mortar pointer-events-none">
                <MapPin className="h-4 w-4" />
              </div>
              <select
                id="ciudad"
                name="ciudad"
                className="w-full h-10 pl-10 pr-3 text-[15px] rounded-lg border border-concrete bg-white text-ink
                  hover:border-mortar focus:outline-none focus:border-[var(--accent-primary)]
                  transition-colors duration-150 appearance-none cursor-pointer"
              >
                <option value="">Selecciona una ciudad</option>
                {CIUDADES_COLOMBIA.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" fullWidth loading={loading} className="mt-2">
            Crear cuenta
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-concrete" />
          <span className="text-[11px] text-stone">o continúa con</span>
          <div className="h-px flex-1 bg-concrete" />
        </div>

        <Button
          variant="secondary"
          fullWidth
          onClick={handleGoogle}
          icon={<Globe className="h-4 w-4" />}
        >
          Continuar con Google
        </Button>
      </Card>

      <p className="mt-5 text-center text-[13px] text-stone">
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="font-medium text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition-colors"
        >
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
