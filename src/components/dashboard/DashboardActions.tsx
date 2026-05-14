'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ModalNuevoPresupuesto } from '@/components/presupuestos/ModalNuevoPresupuesto';

export function DashboardActions() {
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
      </div>

      <ModalNuevoPresupuesto
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
