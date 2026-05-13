'use client';

import { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { updatePassword } from '@/actions/auth';

export default function NuevaContrasenaPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await updatePassword(formData);
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch {
      // redirect esperado
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card shadow="lg" padding="lg" className="border-0">
      <div className="mb-6 text-center">
        <div className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
          <ShieldCheck className="h-7 w-7 text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Nueva contraseña
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Ingresa tu nueva contraseña para acceder a tu cuenta
        </p>
      </div>

      {error && (
        <ErrorMessage message={error} className="mb-4" onDismiss={() => setError(null)} />
      )}

      <form action={handleSubmit} className="space-y-4">
        <Input
          name="password"
          type="password"
          label="Nueva contraseña"
          placeholder="Mín. 8 caracteres"
          icon={<Lock className="h-4 w-4" />}
          autoComplete="new-password"
          required
        />

        <Input
          name="confirmPassword"
          type="password"
          label="Confirmar contraseña"
          placeholder="Repite tu nueva contraseña"
          icon={<Lock className="h-4 w-4" />}
          autoComplete="new-password"
          required
        />

        <Button type="submit" fullWidth loading={loading}>
          Actualizar contraseña
        </Button>
      </form>
    </Card>
  );
}
