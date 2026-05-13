'use client';

import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModalNuevoPresupuesto } from '@/components/presupuestos/ModalNuevoPresupuesto';
import { Button } from '@/components/shared/Button';

interface DashboardActionsProps {
  iaAvailable: boolean;
}

export function DashboardActions({ iaAvailable }: DashboardActionsProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-[18px] py-2.5 rounded-lg border border-concrete bg-white text-charcoal text-[13px] font-bold hover:bg-sand transition-all shadow-sm active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Nuevo presupuesto
        </button>

        <div className="relative group">
          <button
            onClick={() => iaAvailable ? setShowModal(true) : null} // También abrimos modal con IA preseleccionado?
            className={cn(
              "inline-flex items-center gap-2 px-[18px] py-2.5 rounded-lg text-white text-[13px] font-bold transition-all shadow-sm active:scale-95",
              iaAvailable
                ? "bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)]"
                : "bg-mortar cursor-not-allowed opacity-70"
            )}
          >
            <Sparkles className="h-4 w-4" />
            Generar con IA
          </button>
          {!iaAvailable && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-ink text-white text-[11px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              Función IA — Próximamente
            </div>
          )}
        </div>
      </div>

      <ModalNuevoPresupuesto 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        iaAvailable={iaAvailable}
      />
    </>
  );
}
