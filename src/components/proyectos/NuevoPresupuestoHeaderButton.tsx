'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { ModalNuevoPresupuesto } from '@/components/presupuestos/ModalNuevoPresupuesto';

interface NuevoPresupuestoHeaderButtonProps {
  proyectoId: string;
  proyectoNombre: string;
  proyectoTipoObra?: string | null;
  proyectoUbicacion?: string | null;
}

export function NuevoPresupuestoHeaderButton({
  proyectoId,
  proyectoNombre,
  proyectoTipoObra,
  proyectoUbicacion,
}: NuevoPresupuestoHeaderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border border-[#E5E7EB] text-[12px] font-semibold text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-colors duration-150"
      >
        <Plus className="h-3.5 w-3.5" />
        Nuevo presupuesto
      </button>

      <ModalNuevoPresupuesto
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          router.refresh();
        }}
        proyectoId={proyectoId}
        proyectoNombre={proyectoNombre}
        proyectoTipoObra={proyectoTipoObra ?? undefined}
        proyectoUbicacion={proyectoUbicacion ?? undefined}
      />
    </>
  );
}
