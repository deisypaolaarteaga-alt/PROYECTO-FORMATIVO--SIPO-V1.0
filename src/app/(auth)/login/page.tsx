'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { signIn, signInWithGoogle } from '@/actions/auth';

export default function LoginPage() {
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  async function handleCredentials(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn(formData);
      if (result && !result.success) {
        setError(result.error ?? 'Error al iniciar sesión.');
      }
    } catch {
      // redirect esperado tras login exitoso
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
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold text-[#1C1814] tracking-tight">
          Bienvenido de vuelta
        </h1>
        <p className="mt-1.5 text-[14px] text-[#7A7265]">
          Inicia sesión en tu cuenta SIPO
        </p>
      </div>

      <div className="bg-white border border-[#E8E4DE] rounded-2xl p-7 shadow-sm">
        {error && (
          <ErrorMessage message={error} className="mb-5" onDismiss={() => setError(null)} />
        )}

        <form action={handleCredentials} className="space-y-4">
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
              className="text-[13px] text-[#C84B1A] hover:text-[#A83A14] transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={loading}>
            Iniciar sesión
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E8E4DE]" />
          <span className="text-[11px] text-[#7A7265]">o continúa con</span>
          <div className="h-px flex-1 bg-[#E8E4DE]" />
        </div>

        <Button
          variant="secondary"
          fullWidth
          loading={googleLoading}
          onClick={handleGoogle}
          icon={<Globe className="h-4 w-4" />}
        >
          Continuar con Google
        </Button>
      </div>

      <p className="mt-5 text-center text-[13px] text-[#7A7265]">
        ¿No tienes cuenta?{' '}
        <Link
          href="/registro"
          className="font-medium text-[#C84B1A] hover:text-[#A83A14] transition-colors"
        >
          Regístrate gratis
        </Link>
      </p>
    </>
  );
}
