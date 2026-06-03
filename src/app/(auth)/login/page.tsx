'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { signIn, sendOtp, verifyOtp } from '@/actions/auth';

export default function LoginPage() {
  const [step, setStep]               = useState<1 | 2>(1);
  const [emailForOtp, setEmailForOtp] = useState('');

  const [loading, setLoading]           = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [redirectTo, setRedirectTo] = useState('/dashboard');

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('redirectTo');
    if (r && r.startsWith('/') && !r.startsWith('//')) setRedirectTo(r);
  }, []);

  useEffect(() => {
    if (step !== 2 || countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  async function handleCredentials(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn(formData);
      if (!result.success) {
        setError(result.error ?? 'Error al iniciar sesión.');
      } else if (result.data?.email) {
        setEmailForOtp(result.data.email);
        setStep(2);
        setCountdown(60);
        setDigits(['', '', '', '', '', '']);
      }
    } catch {
      // redirect no llega aquí — solo errores inesperados
    } finally {
      setLoading(false);
    }
  }

  function handleDigitChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i];
    setDigits(newDigits);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleVerify() {
    const token = digits.join('');
    if (token.length !== 6) {
      setError('Ingresa los 6 dígitos del código.');
      return;
    }
    setVerifyLoading(true);
    setError(null);
    try {
      const result = await verifyOtp(emailForOtp, token, redirectTo);
      if (!result.success) setError(result.error ?? 'Código incorrecto.');
      // Si tiene éxito, verifyOtp hace redirect internamente
    } catch {
      // redirect esperado
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setResendLoading(true);
    setError(null);
    try {
      const result = await sendOtp(emailForOtp);
      if (!result.success) {
        setError(result.error ?? 'No se pudo reenviar el código.');
      } else {
        setCountdown(60);
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setResendLoading(false);
    }
  }

  if (step === 2) {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-[24px] font-semibold text-[#1C1814] tracking-tight">
            Verifica tu identidad
          </h1>
          <p className="mt-1.5 text-[14px] text-[#7A7265]">
            Ingresa el código de 6 dígitos enviado a{' '}
            <span className="font-medium text-[#1C1814]">{emailForOtp}</span>
          </p>
        </div>

        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-7 shadow-sm">
          {error && (
            <ErrorMessage message={error} className="mb-5" onDismiss={() => setError(null)} />
          )}

          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-11 h-12 text-center text-[20px] font-semibold border border-[#E8E4DE] rounded-xl bg-[#F8F7F5] focus:outline-none focus:border-[#C84B1A] focus:ring-2 focus:ring-[#C84B1A]/20 transition-colors"
              />
            ))}
          </div>

          <Button fullWidth loading={verifyLoading} onClick={handleVerify}>
            Verificar código
          </Button>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setStep(1); setError(null); }}
              className="flex items-center gap-1 text-[13px] text-[#7A7265] hover:text-[#1C1814] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || resendLoading}
              className="text-[13px] text-[#C84B1A] hover:text-[#A83A14] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? 'Enviando…' : countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
            </button>
          </div>
        </div>
      </>
    );
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
