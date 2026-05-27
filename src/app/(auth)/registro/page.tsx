'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Globe } from 'lucide-react';
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
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [showRecoverLink, setShowRecoverLink] = useState(false);
  const [nombre,   setNombre]         = useState('');
  const [email,    setEmail]          = useState('');
  const [password, setPassword]       = useState('');
  const [confirmaPassword, setConfirmaPassword] = useState('');

  const [nombreError,   setNombreError]   = useState('');
  const [emailError,    setEmailError]    = useState('');
  const [passError,     setPassError]     = useState('');
  const [confirmaError, setConfirmaError] = useState('');

  const isFormValid =
    nombre.trim().length >= 1 &&
    email.trim().length >= 1 &&
    password.length >= 1 &&
    confirmaPassword.length >= 1;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowRecoverLink(false);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await signUp(formData);
      if (!result) return;
      if (!result.success) {
        const msg = result.error ?? 'Error desconocido';
        setError(msg);
        setShowRecoverLink(msg.includes('Ya existe una cuenta'));
        return;
      }
    } catch (err: unknown) {
      const digest = (err as { digest?: string })?.digest ?? '';
      if (digest.startsWith('NEXT_REDIRECT')) return;
      setError('Error inesperado. Intenta de nuevo.');
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
          <div className="mb-5">
            <ErrorMessage message={error} onDismiss={() => { setError(null); setShowRecoverLink(false); }} />
            {showRecoverLink && (
              <p className="mt-2 text-[13px] text-[#7A7265]">
                <Link href="/recuperar-contrasena" className="font-medium text-[#C84B1A] hover:text-[#A83A14] transition-colors">
                  ¿Olvidaste tu contraseña? Recupérala aquí
                </Link>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="nombre_completo"
            label="Nombre completo *"
            placeholder="Juan Pérez"
            icon={<User className="h-4 w-4" />}
            required
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); if (nombreError) setNombreError(''); }}
            onBlur={() => { if (!nombre.trim()) setNombreError('Este campo es obligatorio'); }}
            error={nombreError || undefined}
          />

          <Input
            name="email"
            type="email"
            label="Correo electrónico *"
            placeholder="tu@empresa.com"
            icon={<Mail className="h-4 w-4" />}
            autoComplete="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
            onBlur={() => { if (!email.trim()) setEmailError('Este campo es obligatorio'); }}
            error={emailError || undefined}
          />

          <div>
            <Input
              name="password"
              type="password"
              label="Contraseña *"
              placeholder="Mín. 8 caracteres"
              icon={<Lock className="h-4 w-4" />}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (passError) setPassError(''); }}
              onBlur={() => { if (!password) setPassError('Este campo es obligatorio'); }}
              error={passError || undefined}
            />
            <IndicadorPassword password={password} />
          </div>

          <Input
            name="confirmar_password"
            type="password"
            label="Confirmar contraseña *"
            placeholder="Repite tu contraseña"
            icon={<Lock className="h-4 w-4" />}
            autoComplete="new-password"
            required
            value={confirmaPassword}
            onChange={(e) => { setConfirmaPassword(e.target.value); if (confirmaError) setConfirmaError(''); }}
            onBlur={() => { if (!confirmaPassword) setConfirmaError('Este campo es obligatorio'); }}
            error={confirmaError || undefined}
          />

          <Button type="submit" fullWidth loading={loading} disabled={!isFormValid} className="mt-2">
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
