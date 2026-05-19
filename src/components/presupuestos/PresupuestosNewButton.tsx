'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { ModalNuevoPresupuesto } from './ModalNuevoPresupuesto';

export function PresupuestosNewButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsOpen(true)}>
        Nuevo presupuesto
      </Button>
      <ModalNuevoPresupuesto
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
