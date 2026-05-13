'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Globe } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { signIn, signInWithGoogle } from '@/actions/auth';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn(formData);
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch {
      // redirect lanza un error internamente en Next.js — es normal
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      // redirect esperado
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <Card padding="lg" className="border border-concrete">
        <div className="mb-6">
          <h1 className="text-[20px] font-semibold text-ink">
            Bienvenido de vuelta
          </h1>
          <p className="mt-1 text-[13px] text-stone">
            Inicia sesión en tu cuenta SIPO
          </p>
        </div>

        {/* Error global */}
        {error && (
          <ErrorMessage
            message={error}
            className="mb-4"
            onDismiss={() => setError(null)}
          />
        )}

        {/* Formulario */}
        <form action={handleSubmit} className="space-y-4">
          <Input
            name="email"
            type="email"
            label="Correo electrónico"
            placeholder="tu@empresa.com"
            icon={<Mail className="h-4 w-4" />}
            autoComplete="email"
            required
          />

          <Input
            name="password"
            type="password"
            label="Contraseña"
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            autoComplete="current-password"
            required
          />

          <div className="flex justify-end">
            <Link
              href="/recuperar-contrasena"
              className="text-[13px] text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={loading}>
            Iniciar sesión
          </Button>
        </form>

        {/* Separador */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-concrete" />
          <span className="text-[11px] text-stone">o continúa con</span>
          <div className="h-px flex-1 bg-concrete" />
        </div>

        {/* Google */}
        <Button
          variant="secondary"
          fullWidth
          loading={googleLoading}
          onClick={handleGoogle}
          icon={<Globe className="h-4 w-4" />}
        >
          Continuar con Google
        </Button>
      </Card>

      {/* Link a registro */}
      <p className="mt-5 text-center text-[13px] text-stone">
        ¿No tienes cuenta?{' '}
        <Link
          href="/registro"
          className="font-medium text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition-colors"
        >
          Regístrate gratis
        </Link>
      </p>
    </>
  );
}
