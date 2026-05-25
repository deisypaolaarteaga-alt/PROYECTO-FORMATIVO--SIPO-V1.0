'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Globe, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { signUp, signInWithGoogle } from '@/actions/auth';

function IndicadorPassword({ password }: { password: string }) {
  const criterios = [
    { label: 'Mínimo 8 caracteres',   ok: password.length >= 8 },
    { label: 'Una mayúscula',          ok: /[A-Z]/.test(password) },
    { label: 'Un número',              ok: /[0-9]/.test(password) },
    { label: 'Un carácter especial',   ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(password) },
  ];

  if (!password) return null;

  return (
    <ul className="mt-2 space-y-1">
      {criterios.map((c) => (
        <li
          key={c.label}
          className={`text-xs flex items-center gap-1 ${c.ok ? 'text-green-600' : 'text-red-500'}`}
        >
          {c.ok ? '✅' : '❌'} {c.label}
        </li>
      ))}
    </ul>
  );
}

export default function RegistroPage() {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);
  const [password, setPassword] = useState('');

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
    try {
      await signInWithGoogle();
    } catch {
      // redirect esperado
    }
  }

  if (success) {
    return (
      <div className="bg-white border border-[#E8E4DE] rounded-2xl p-8 shadow-sm text-center">
        <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F4E8]">
          <CheckCircle2 className="h-8 w-8 text-[#1A5C2A]" />
        </div>
        <h2 className="text-[20px] font-semibold text-[#1C1814]">Revisa tu correo</h2>
        <p className="mt-2 text-[13px] text-[#7A7265] leading-relaxed">
          Te enviamos un enlace de confirmación. Haz clic en él para activar tu cuenta.
        </p>
        <Link href="/login">
          <Button variant="secondary" className="mt-6">
            Volver al inicio de sesión
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-7">
        <h1 className="text-[24px] font-semibold text-[#1C1814] tracking-tight">
          Crea tu cuenta
        </h1>
        <p className="mt-1.5 text-[14px] text-[#7A7265]">
          Empieza a presupuestar con precisión en minutos
        </p>
      </div>

      <div className="bg-white border border-[#E8E4DE] rounded-2xl p-7 shadow-sm">
        {error && (
          <ErrorMessage message={error} className="mb-5" onDismiss={() => setError(null)} />
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
            <IndicadorPassword password={password} />
          </div>

          <Input
            name="confirmar_password"
            type="password"
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            icon={<Lock className="h-4 w-4" />}
            autoComplete="new-password"
            required
          />

          <Button type="submit" fullWidth loading={loading} className="mt-2">
            Crear cuenta
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
          onClick={handleGoogle}
          icon={<Globe className="h-4 w-4" />}
        >
          Continuar con Google
        </Button>
      </div>

      <p className="mt-5 text-center text-[13px] text-[#7A7265]">
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="font-medium text-[#C84B1A] hover:text-[#A83A14] transition-colors"
        >
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
