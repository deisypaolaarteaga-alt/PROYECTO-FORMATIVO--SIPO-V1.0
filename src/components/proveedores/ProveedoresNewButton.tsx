'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { ModalProveedor } from './ModalProveedor';

export function ProveedoresNewButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsOpen(true)}>
        Nuevo Proveedor
      </Button>
      <ModalProveedor
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
