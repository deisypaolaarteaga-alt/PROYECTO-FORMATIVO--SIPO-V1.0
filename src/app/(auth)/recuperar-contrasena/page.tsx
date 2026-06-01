'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { resetPassword } from '@/actions/auth';

export default function RecuperarContrasenaPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState('');

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await resetPassword(formData);
      if (result.success) {
        setEmailEnviado(formData.get('email') as string);
        setSent(true);
      } else {
        setError(result.error || 'Error al enviar el correo.');
      }
    } catch {
      setError('Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card shadow="lg" padding="lg" className="border-0 text-center">
        <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
          <CheckCircle className="h-8 w-8 text-success-600" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Correo enviado</h2>
        <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
          Te enviamos un enlace a{' '}
          <span className="font-medium text-neutral-700">{emailEnviado}</span>.{' '}
          Revisa tu correo para restablecer tu contraseña.
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
      <Card shadow="lg" padding="lg" className="border-0">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">
            Recuperar contraseña
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {error && (
          <ErrorMessage message={error} className="mb-4" onDismiss={() => setError(null)} />
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

          <Button type="submit" fullWidth loading={loading}>
            Enviar enlace de recuperación
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesión
        </Link>
      </p>
    </>
  );
}
