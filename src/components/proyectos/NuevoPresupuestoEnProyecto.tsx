'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { ModalNuevoPresupuesto } from '@/components/presupuestos/ModalNuevoPresupuesto';

interface NuevoPresupuestoEnProyectoProps {
  proyectoId: string;
  proyectoNombre: string;
  proyectoTipoObra?: string | null;
  proyectoUbicacion?: string | null;
}

export function NuevoPresupuestoEnProyecto({
  proyectoId,
  proyectoNombre,
  proyectoTipoObra,
  proyectoUbicacion,
}: NuevoPresupuestoEnProyectoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[12px] bg-concrete/50">
          <FileText className="h-7 w-7 text-stone" strokeWidth={1.5} />
        </div>
        <h3 className="text-[17px] font-semibold text-ink">Sin presupuestos</h3>
        <p className="mt-1.5 max-w-sm text-[13px] text-stone leading-relaxed">
          Crea el primer presupuesto para este proyecto.
        </p>
        <Button
          variant="primary"
          size="md"
          className="mt-6"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setIsOpen(true)}
        >
          Nuevo presupuesto
        </Button>
      </div>

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
