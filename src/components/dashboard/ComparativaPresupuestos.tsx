'use client';

import { Card, CardHeader } from '@/components/shared/Card';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { DistribucionCDItem } from '@/actions/analytics';

interface Props {
  data: DistribucionCDItem[];
}

const ESTADO_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  borrador:    { label: 'Borrador',    bg: '#F0F0EE', text: '#5A5248' },
  en_revision: { label: 'En revisión', bg: '#FEF9EC', text: '#8C5E00' },
  aprobado:    { label: 'Aprobado',    bg: '#E8F4E8', text: '#1A5C2A' },
  rechazado:   { label: 'Rechazado',   bg: '#FDE8E8', text: '#991B1B' },
  archivado:   { label: 'Archivado',   bg: '#F4F2EE', text: '#7A7265' },
};

function EstadoChip({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] ?? { label: estado, bg: '#F4F2EE', text: '#7A7265' };
  return (
    <span
      className="inline-flex items-center px-2 py-[3px] rounded text-[10px] font-semibold tracking-[0.04em]"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}

export function ComparativaPresupuestos({ data }: Props) {
  const maxOferta = Math.max(...data.map((d) => d.total_oferta), 1);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-stone" />
          <h3 className="text-[14px] font-semibold text-ink">Comparativa de presupuestos</h3>
        </div>
        <p className="text-[11px] text-stone mt-0.5">CD · AIU · Total oferta · Estado</p>
      </CardHeader>

      <div className="pt-4 flex-1">
        {data.length === 0 ? (
          <p className="text-[12px] text-stone text-center py-6">
            Sin presupuestos con costo registrado
          </p>
        ) : (
          <div className="divide-y divide-[#F0EDE8]">
            {data.map((item) => {
              const pct = Math.max((item.total_oferta / maxOferta) * 100, 2);
              return (
                <div key={item.budget_id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[12px] font-medium text-ink truncate"
                        title={item.titulo}
                      >
                        {item.titulo}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[10px] text-stone"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          CD {formatCurrency(item.costo_directo)}
                        </span>
                        {item.aiu > 0 && (
                          <>
                            <span className="text-[10px] text-mortar">·</span>
                            <span
                              className="text-[10px] text-stone"
                              style={{ fontFamily: 'var(--font-mono)' }}
                            >
                              AIU {formatCurrency(item.aiu)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className="text-[13px] font-semibold text-ink"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {formatCurrency(item.total_oferta)}
                      </span>
                      <EstadoChip estado={item.estado} />
                    </div>
                  </div>
                  {/* Barra proporcional */}
                  <div className="mt-2.5 h-[3px] bg-[#EAE6E0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: '#C84B1A' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
