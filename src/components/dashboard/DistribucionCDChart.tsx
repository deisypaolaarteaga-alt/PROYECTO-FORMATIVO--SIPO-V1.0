'use client';

import { Card, CardHeader } from '@/components/shared/Card';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { DistribucionCDItem } from '@/actions/analytics';

// Paleta de capas de obra: material, mano de obra, equipo
const MAT_COLOR = '#C84B1A';  // naranja-óxido
const MO_COLOR  = '#2D5F8A';  // azul-acero medio
const EQ_COLOR  = '#6B7B4A';  // verde-oliva técnico

interface Props {
  data: DistribucionCDItem[];
}

export function DistribucionCDChart({ data }: Props) {
  const top5 = data.slice(0, 5);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-stone" />
          <h3 className="text-[14px] font-semibold text-ink">Distribución del CD</h3>
        </div>
        <p className="text-[11px] text-stone mt-0.5">
          Materiales · Mano de obra · Equipos y herramientas
        </p>
      </CardHeader>

      <div className="pt-5 flex-1 space-y-4">
        {top5.length === 0 ? (
          <p className="text-[12px] text-stone text-center py-6">
            Sin datos de APU disponibles
          </p>
        ) : (
          top5.map((item) => {
            const equipoTotal = item.equipo + item.herramienta_menor + item.epp;
            const total = item.material + item.mano_obra + equipoTotal;
            const hasApu = total > 0;
            const pctMat = hasApu ? (item.material / total) * 100 : 0;
            const pctMO  = hasApu ? (item.mano_obra / total) * 100 : 0;
            const pctEq  = hasApu ? (equipoTotal / total) * 100 : 0;

            return (
              <div key={item.budget_id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[12px] font-medium text-ink truncate max-w-[58%]"
                    title={item.titulo}
                  >
                    {item.titulo}
                  </span>
                  <span
                    className="text-[11px] text-stone shrink-0"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {formatCurrency(item.costo_directo)}
                  </span>
                </div>

                {hasApu ? (
                  <div className="flex h-4 rounded-[3px] overflow-hidden gap-[1.5px] bg-[#E8E4DE]">
                    {pctMat > 0 && (
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{ width: `${pctMat}%`, background: MAT_COLOR }}
                        title={`Materiales: ${pctMat.toFixed(1)}%`}
                      >
                        {pctMat >= 12 && (
                          <span className="text-[9px] text-white font-semibold leading-none">
                            {pctMat.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                    {pctMO > 0 && (
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{ width: `${pctMO}%`, background: MO_COLOR }}
                        title={`Mano de obra: ${pctMO.toFixed(1)}%`}
                      >
                        {pctMO >= 12 && (
                          <span className="text-[9px] text-white font-semibold leading-none">
                            {pctMO.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                    {pctEq > 0 && (
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{ width: `${pctEq}%`, background: EQ_COLOR }}
                        title={`Equipos y HM: ${pctEq.toFixed(1)}%`}
                      >
                        {pctEq >= 12 && (
                          <span className="text-[9px] text-white font-semibold leading-none">
                            {pctEq.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-4 rounded-[3px] bg-sand border border-concrete flex items-center px-2">
                    <span className="text-[10px] text-stone italic">Sin APU registrado</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-5 pt-4 border-t border-concrete">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded-[2px] shrink-0" style={{ background: MAT_COLOR }} />
          <span className="text-[11px] text-stone">Materiales</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded-[2px] shrink-0" style={{ background: MO_COLOR }} />
          <span className="text-[11px] text-stone">Mano de obra</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded-[2px] shrink-0" style={{ background: EQ_COLOR }} />
          <span className="text-[11px] text-stone">Equipos y HM</span>
        </div>
      </div>
    </Card>
  );
}
