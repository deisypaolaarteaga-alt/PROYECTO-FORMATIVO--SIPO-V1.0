'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/shared/Button';

export default function PresupuestoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PresupuestoError]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">
        Error al cargar el presupuesto
      </h1>
      <p className="text-neutral-500 max-w-md mb-4 text-sm">
        {error.message || 'Ocurrió un error inesperado'}
      </p>

      {process.env.NODE_ENV === 'development' && error.stack && (
        <pre className="text-left text-xs bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl w-full overflow-auto mb-6 text-red-800 whitespace-pre-wrap">
          {error.stack}
        </pre>
      )}

      <div className="flex gap-3">
        <Button
          onClick={reset}
          icon={<RefreshCcw className="h-4 w-4" />}
        >
          Reintentar
        </Button>
        <Button
          variant="outline"
          onClick={() => window.location.href = '/dashboard'}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Ir al dashboard
        </Button>
      </div>
    </div>
  );
}
