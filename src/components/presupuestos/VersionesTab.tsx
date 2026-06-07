'use client';

import { useState } from 'react';
import { History, Eye, GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatearCOP } from '@/lib/utils/formato-cop';
import type { BudgetSnapshot } from '@/types';
import { ModalVerVersion } from './ModalVerVersion';
import { ModalCompararVersiones } from './ModalCompararVersiones';

interface VersionesTabProps {
  versiones: BudgetSnapshot[];
  budgetId: string;
}

const MOTIVO_CONFIG: Record<
  BudgetSnapshot['motivo'],
  { label: string; badge: string }
> = {
  rechazo_cliente:  { label: 'Rechazo cliente',  badge: 'bg-red-100 text-red-700 border border-red-200'   },
  reapertura_manual:{ label: 'Reapertura manual', badge: 'bg-amber-100 text-amber-700 border border-amber-200' },
  aprobacion:       { label: 'Aprobación',        badge: 'bg-green-100 text-green-700 border border-green-200' },
  envio_cliente:    { label: 'Envío al cliente',  badge: 'bg-blue-100 text-blue-700 border border-blue-200'  },
};

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function VersionesTab({ versiones, budgetId }: VersionesTabProps) {
  const [verSnapshotId, setVerSnapshotId]       = useState<string | null>(null);
  const [compararSnapshotId, setCompararSnapshotId] = useState<string | null>(null);

  if (versiones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400 max-w-md mx-auto text-center">
        <History className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm font-medium text-stone-500">No hay versiones guardadas aún.</p>
        <p className="text-xs mt-2 text-stone-400 leading-relaxed">
          Las versiones se generan automáticamente cuando envías el presupuesto al cliente,
          el cliente responde, o se aprueba formalmente. Solo se guarda una versión nueva
          cuando hay cambios reales.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#1C1814]">Historial de versiones</h2>
          <p className="text-sm text-stone-500 mt-1">
            Cada versión es una foto inmutable del presupuesto en el momento del evento.
          </p>
        </div>

        <div className="rounded-xl border border-[#E8E4DE] overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F2EE] text-stone-500 uppercase text-xs tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Versión</th>
                <th className="px-5 py-3 text-left font-medium">Fecha</th>
                <th className="px-5 py-3 text-left font-medium">Motivo</th>
                <th className="px-5 py-3 text-right font-medium">C.D.</th>
                <th className="px-5 py-3 text-right font-medium">Total Oferta</th>
                <th className="px-5 py-3 text-center font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {versiones.map((v) => {
                const cfg = MOTIVO_CONFIG[v.motivo] ?? MOTIVO_CONFIG.aprobacion;
                return (
                  <tr key={v.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-bold text-[#1C1814]">v{v.version}</span>
                    </td>
                    <td className="px-5 py-4 text-stone-600">
                      {formatearFecha(v.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', cfg.badge)}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-stone-700 tabular-nums">
                      {v.costo_directo ? formatearCOP(v.costo_directo) : '—'}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-[#1C1814] tabular-nums">
                      {v.total_oferta ? formatearCOP(v.total_oferta) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setVerSnapshotId(v.id)}
                          title="Ver versión"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                     bg-[#F5F2EE] hover:bg-[#EBE7E1] text-stone-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </button>
                        <button
                          onClick={() => setCompararSnapshotId(v.id)}
                          title="Comparar con versión actual"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                     bg-[#F5F2EE] hover:bg-[#EBE7E1] text-stone-700 transition-colors"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                          Comparar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {verSnapshotId && (
        <ModalVerVersion
          snapshotId={verSnapshotId}
          onClose={() => setVerSnapshotId(null)}
        />
      )}

      {compararSnapshotId && (
        <ModalCompararVersiones
          snapshotId={compararSnapshotId}
          budgetId={budgetId}
          onClose={() => setCompararSnapshotId(null)}
        />
      )}
    </>
  );
}
