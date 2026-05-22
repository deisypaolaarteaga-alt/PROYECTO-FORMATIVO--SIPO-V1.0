'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit } from 'lucide-react';
import { ModalProveedor } from './ModalProveedor';
import type { Proveedor } from '@/types';

export function ProveedorDetailActions({ proveedor }: { proveedor: Proveedor }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="h-9 px-4 flex items-center gap-2 border border-[#E5E7EB] rounded-lg text-sm text-[#374151] bg-white hover:bg-[#F9FAFB] transition-colors font-medium"
      >
        <Edit className="h-4 w-4" />
        Editar
      </button>
      <ModalProveedor
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        proveedor={proveedor}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
