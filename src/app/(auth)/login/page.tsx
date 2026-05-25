'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, Globe, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { signIn, sendOtp, verifyOtp, signInWithGoogle } from '@/actions/auth';

// ── OTP: 6 campos individuales con auto-avance ────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(i: number, raw: string) {
    const char = raw.replace(/\D/g, '').slice(-1);
    const arr = value.padEnd(6, '').split('');
    arr[i] = char;
    onChange(arr.join('').replace(/\s/g, '').slice(0, 6));
    if (char && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (value[i]) {
        const arr = value.split('');
        arr[i] = '';
        onChange(arr.join(''));
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="w-11 h-12 text-center text-[20px] font-semibold rounded-lg border border-[#E8E4DE] hover:border-[#C8C0B5] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 text-[#1C1814] bg-white transition-all"
          aria-label={`Dígito ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Estado 2FA
  const [step, setStep]         = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail]       = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown para reenviar
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleCredentials(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn(formData);
      if (!result.success) {
        setError(result.error ?? 'Error al iniciar sesión.');
      } else {
        const d = result.data as { email: string };
        setEmail(d.email);
        setStep('otp');
        setCountdown(60);
      }
    } catch {
      // Next.js lanza internamente en redirect — es normal
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpValue.length < 6) return;
    setVerifying(true);
    setError(null);
    try {
      const result = await verifyOtp(email, otpValue);
      if (!result.success) {
        setError(result.error ?? 'Código incorrecto.');
        setOtpValue('');
      }
    } catch {
      // redirect esperado tras verificación exitosa
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setError(null);
    const result = await sendOtp(email);
    if (!result.success) {
      setError(result.error ?? 'No se pudo reenviar el código.');
    } else {
      setCountdown(60);
      setOtpValue('');
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

  // ── Pantalla OTP ─────────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-[24px] font-semibold text-[#1C1814] tracking-tight">
            Verifica tu identidad
          </h1>
          <p className="mt-1.5 text-[14px] text-[#7A7265] leading-relaxed">
            Ingresa el código de 6 dígitos enviado a{' '}
            <span className="font-medium text-[#1C1814]">{email}</span>
          </p>
        </div>

        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-7 shadow-sm">
          {error && (
            <ErrorMessage message={error} className="mb-5" onDismiss={() => setError(null)} />
          )}

          <div className="space-y-6">
            <OtpInput value={otpValue} onChange={setOtpValue} />

            <Button
              fullWidth
              loading={verifying}
              disabled={otpValue.length < 6}
              onClick={handleVerifyOtp}
            >
              Verificar código
            </Button>

            <div className="flex items-center justify-center text-[13px]">
              {countdown > 0 ? (
                <span className="text-[#7A7265]">
                  Reenviar en{' '}
                  <span className="font-medium text-[#1C1814] tabular-nums">{countdown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="inline-flex items-center gap-1.5 text-[#C84B1A] hover:text-[#A83A14] font-medium transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reenviar código
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { setStep('credentials'); setError(null); setOtpValue(''); }}
          className="mt-5 mx-auto flex items-center gap-1.5 text-[13px] text-[#7A7265] hover:text-[#1C1814] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al inicio de sesión
        </button>
      </>
    );
  }

  // ── Pantalla de credenciales ─────────────────────────────────────────────────
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
            Continuar
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
