'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, UserX } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ModalCliente } from '@/components/clientes/ModalCliente';
import { desactivarCliente } from '@/actions/clientes';
import type { Cliente } from '@/types';

interface ClienteDetailActionsProps {
  cliente: Cliente;
}

export function ClienteDetailActions({ cliente }: ClienteDetailActionsProps) {
  const router = useRouter();
  const [showEdit,       setShowEdit]       = useState(false);
  const [confirmDesact,  setConfirmDesact]  = useState(false);
  const [desactivando,   setDesactivando]   = useState(false);

  async function handleDesactivar() {
    setDesactivando(true);
    const result = await desactivarCliente(cliente.id);
    setDesactivando(false);
    if (result.success) {
      router.push('/clientes');
    } else {
      setConfirmDesact(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          icon={<Pencil className="h-4 w-4" />}
          onClick={() => setShowEdit(true)}
        >
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<UserX className="h-4 w-4 text-red-500" />}
          className="text-red-500 hover:bg-red-50"
          onClick={() => setConfirmDesact(true)}
        >
          Desactivar
        </Button>
      </div>

      <ModalCliente
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        cliente={cliente}
        onSuccess={() => router.refresh()}
      />

      <ConfirmDialog
        open={confirmDesact}
        title={`¿Desactivar a "${cliente.nombre_razon_social}"?`}
        description="El cliente quedará inactivo y no aparecerá en nuevas búsquedas. Sus proyectos asociados no se eliminan."
        confirmLabel={desactivando ? 'Desactivando…' : 'Sí, desactivar'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDesactivar}
        onCancel={() => setConfirmDesact(false)}
      />
    </>
  );
}
