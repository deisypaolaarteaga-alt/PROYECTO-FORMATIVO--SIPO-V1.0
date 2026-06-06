'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { cambiarEstadoPresupuesto } from '@/actions/presupuesto-estados';

interface BotonEnviarRevisionProps {
  budgetId: string;
  proyectoId?: string; // conservado por compatibilidad, ya no se usa
  estado: string;
}

export function BotonEnviarRevision({ budgetId, estado }: BotonEnviarRevisionProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');

  async function handleConfirm() {
    setLoading(true);
    setErrorMsg('');
    // en_revision se conserva por compatibilidad; el flujo nuevo usa enviado_a_cliente
    const result = await cambiarEstadoPresupuesto(budgetId, 'en_revision');
    setLoading(false);
    setConfirmOpen(false);
    if (result.success) {
      router.refresh();
    } else {
      setErrorMsg(result.error ?? 'No se pudo enviar a revisión.');
    }
  }

  if (estado !== 'borrador') return null;

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        icon={<Send className="h-4 w-4" />}
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
      >
        Enviar a revisión
      </Button>

      {errorMsg && (
        <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="¿Enviar presupuesto a revisión?"
        description="El presupuesto pasará a revisión. No podrás editarlo hasta que sea rechazado o devuelto a borrador. ¿Continuar?"
        confirmLabel={loading ? 'Enviando…' : 'Sí, enviar a revisión'}
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
