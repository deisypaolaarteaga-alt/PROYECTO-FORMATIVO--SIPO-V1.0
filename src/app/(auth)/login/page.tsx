'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Globe } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { signIn, signInWithGoogle } from '@/actions/auth';

const HCaptcha = dynamic(() => import('@hcaptcha/react-hcaptcha'), { ssr: false });

const SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  function resetCaptcha() {
    setCaptchaKey((k) => k + 1);
    setCaptchaToken(null);
  }

  async function handleSubmit(formData: FormData) {
    if (!captchaToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn(formData, captchaToken);
      if (!result.success && result.error) {
        setError(result.error);
        resetCaptcha();
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
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold text-[#1C1814] tracking-tight">
          Bienvenido de vuelta
        </h1>
        <p className="mt-1.5 text-[14px] text-[#7A7265]">
          Inicia sesión en tu cuenta SIPO
        </p>
      </div>

      {/* Contenedor del formulario */}
      <div className="bg-white border border-[#E8E4DE] rounded-2xl p-7 shadow-sm">

        {error && (
          <ErrorMessage
            message={error}
            className="mb-5"
            onDismiss={() => setError(null)}
          />
        )}

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
              className="text-[13px] text-[#C84B1A] hover:text-[#A83A14] transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <HCaptcha
            key={captchaKey}
            sitekey={SITE_KEY}
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={resetCaptcha}
            onError={resetCaptcha}
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={!captchaToken}
          >
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
