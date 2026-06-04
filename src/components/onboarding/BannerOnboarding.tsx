'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { ModalDatosEmpresa } from './ModalDatosEmpresa';

interface Props {
  mostrarOnboarding: boolean;
}

export function BannerOnboarding({ mostrarOnboarding }: Props) {
  const [descartado, setDescartado] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  if (!mostrarOnboarding || descartado) return null;

  return (
    <>
      <div className="bg-amber-50 border-b border-amber-200 px-4 lg:px-8 py-3 flex items-center gap-3">
        <Building2 className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="flex-1 text-sm text-amber-800">
          Completa los datos de tu empresa para generar presupuestos y PDFs profesionales.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Button size="sm" onClick={() => setModalAbierto(true)}>
            Completar ahora
          </Button>
          <button
            type="button"
            onClick={() => setDescartado(true)}
            className="text-sm text-amber-700 hover:text-amber-900 transition-colors"
          >
            Recordar después
          </button>
        </div>
      </div>

      <ModalDatosEmpresa
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={() => {
          setModalAbierto(false);
          setDescartado(true);
        }}
      />
    </>
  );
}
