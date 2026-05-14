'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { ModalCliente } from './ModalCliente';

export function ClientesNewButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsOpen(true)}>
        Nuevo Cliente
      </Button>
      <ModalCliente
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
