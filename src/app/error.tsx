'use client';

import { useEffect } from 'react';
import { Button } from '@/components/shared/Button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-20 h-20 bg-warning-50 rounded-3xl flex items-center justify-center mb-8">
        <AlertTriangle className="h-10 w-10 text-warning-600" />
      </div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-4">Algo salió mal</h1>
      <p className="text-neutral-500 max-w-md mb-10 leading-relaxed">
        Ha ocurrido un error inesperado. Hemos notificado al equipo técnico.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} icon={<RefreshCcw className="h-4 w-4" />}>
          Intentar de nuevo
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
          Ir al dashboard
        </Button>
      </div>
    </div>
  );
}
