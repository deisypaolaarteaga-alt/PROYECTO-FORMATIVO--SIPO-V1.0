'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { cambiarEstadoPresupuesto } from '@/actions/presupuestos';

interface BotonEnviarRevisionProps {
  budgetId: string;
  proyectoId: string;
  estado: string;
}

export function BotonEnviarRevision({ budgetId, proyectoId, estado }: BotonEnviarRevisionProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');

  if (estado !== 'borrador') return null;

  async function handleConfirm() {
    setLoading(true);
    setErrorMsg('');
    const result = await cambiarEstadoPresupuesto(budgetId, 'en_revision', proyectoId);
    setLoading(false);
    setConfirmOpen(false);
    if (result.success) {
      router.refresh();
    } else {
      setErrorMsg(result.error ?? 'No se pudo enviar a revisión.');
    }
  }

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
