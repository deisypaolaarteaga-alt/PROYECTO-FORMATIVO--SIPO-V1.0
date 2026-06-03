'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ModalVistaPreviaInner = dynamic(
  () => import('./ModalVistaPreviaInner'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1A2535]/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3 bg-white rounded-2xl px-10 py-8 shadow-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-[#D95510]" />
          <p className="text-sm text-[#6B7A8D]">Generando vista previa...</p>
        </div>
      </div>
    ),
  }
);

interface Props {
  open: boolean;
  onClose: () => void;
  budget: any;
  chapters?: any[];
  profile: any;
  onEnviarCliente?: () => void;
  onEnviado?: () => void;
}

export function ModalVistaPrevia(props: Props) {
  return <ModalVistaPreviaInner {...props} />;
}
