'use client';

import { Card, CardHeader } from '@/components/shared/Card';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { DistribucionCDItem } from '@/actions/analytics';

interface Props {
  data: DistribucionCDItem[];
}

const ESTADO_CONFIG: Record<string, { label: string; cls: string }> = {
  borrador:    { label: 'Borrador',     cls: 'bg-draft-bg text-draft-text' },
  en_revision: { label: 'En revisión',  cls: 'bg-warning-bg text-warning-text' },
  aprobado:    { label: 'Aprobado',     cls: 'bg-success-bg text-success-text' },
  rechazado:   { label: 'Rechazado',    cls: 'bg-danger-bg text-danger-text' },
  archivado:   { label: 'Archivado',    cls: 'bg-sand text-stone' },
};

function EstadoChip({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] ?? { label: estado, cls: 'bg-sand text-stone' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-[20px] text-[10px] font-medium', cfg.cls)}>
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

      <div className="pt-5 flex-1">
        {data.length === 0 ? (
          <p className="text-[12px] text-stone text-center py-6">
            Sin presupuestos con costo registrado
          </p>
        ) : (
          <div className="space-y-4">
            {data.map((item) => {
              const pct = Math.max((item.total_oferta / maxOferta) * 100, 2);
              return (
                <div key={item.budget_id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[12px] font-medium text-ink truncate"
                        title={item.titulo}
                      >
                        {item.titulo}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-stone">
                          CD {formatCurrency(item.costo_directo)}
                        </span>
                        {item.aiu > 0 && (
                          <>
                            <span className="text-[10px] text-mortar">·</span>
                            <span className="text-[10px] text-stone">
                              AIU {formatCurrency(item.aiu)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[13px] font-semibold text-ink">
                        {formatCurrency(item.total_oferta)}
                      </span>
                      <EstadoChip estado={item.estado} />
                    </div>
                  </div>
                  {/* Barra proporcional */}
                  <div className="mt-2 h-1 bg-sand rounded-full overflow-hidden">
                    <div
                      className="h-full bg-burn-orange rounded-full"
                      style={{ width: `${pct}%` }}
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
