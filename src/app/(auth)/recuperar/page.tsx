'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';

function RecuperarContenido() {
  const [estado, setEstado] = useState<'procesando' | 'error'>('procesando');
  const [mensajeError, setMensajeError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setMensajeError('El enlace no contiene un código válido. Solicita uno nuevo.');
      setEstado('error');
      return;
    }

    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error('[recuperar] exchangeCodeForSession error:', error.message);
        setMensajeError('El enlace expiró o ya fue utilizado. Solicita un nuevo enlace.');
        setEstado('error');
      } else {
        router.replace('/nueva-contrasena');
      }
    });
  }, [searchParams, router]);

  if (estado === 'procesando') {
    return (
      <Card shadow="lg" padding="lg" className="border-0 text-center">
        <Loader2 className="h-8 w-8 text-burn-orange animate-spin mx-auto mb-4" />
        <p className="text-[15px] font-medium text-ink">Verificando tu enlace…</p>
        <p className="text-[13px] text-stone mt-1">
          Un momento, estamos preparando el formulario de nueva contraseña.
        </p>
      </Card>
    );
  }

  return (
    <Card shadow="lg" padding="lg" className="border-0 text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-red-500" />
      </div>
      <h2 className="text-[18px] font-semibold text-ink mb-2">Enlace inválido o expirado</h2>
      <p className="text-[13px] text-stone mb-6 leading-relaxed">{mensajeError}</p>
      <Link href="/recuperar-contrasena">
        <Button fullWidth>Solicitar nuevo enlace</Button>
      </Link>
    </Card>
  );
}

export default function RecuperarPage() {
  return (
    <Suspense
      fallback={
        <Card shadow="lg" padding="lg" className="border-0 text-center">
          <Loader2 className="h-8 w-8 text-burn-orange animate-spin mx-auto" />
        </Card>
      }
    >
      <RecuperarContenido />
    </Suspense>
  );
}
