'use client';

import { formatCurrency } from '@/lib/utils';
import type { ResumenPresupuesto, Budget } from '@/types';
import { Card } from '@/components/shared/Card';
import { Info, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ResumenFinancieroVisualProps {
  resumen: ResumenPresupuesto;
  budget: Budget;
}

export function ResumenFinancieroVisual({ resumen, budget }: ResumenFinancieroVisualProps) {
  const [showAIUDetail, setShowAIUDetail] = useState(true);

  return (
    <Card className="bg-white border-concrete overflow-hidden shadow-sm">
      <div className="bg-steel-dark px-5 py-4 flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
          Resumen Financiero
        </h3>
        <span className="text-[10px] text-steel-light font-medium bg-white/10 px-2 py-1 rounded">
          Metodología IDU/INVIAS
        </span>
      </div>

      <div className="p-6 space-y-6 font-mono">
        
        {/* COSTOS DIRECTOS */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-ink uppercase tracking-tight">Costos Directos</span>
          <span className="text-[14px] font-bold text-ink">{formatCurrency(resumen.costoDirecto)}</span>
        </div>

        <div className="h-px bg-concrete/50" />

        {/* AIU */}
        <div className="space-y-3">
          <button 
            onClick={() => setShowAIUDetail(!showAIUDetail)}
            className="w-full flex items-center justify-between group"
          >
            <span className="text-[13px] font-bold text-ink uppercase tracking-tight">AIU</span>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-ink">{formatCurrency(resumen.administracion + resumen.imprevistos + resumen.utilidad)}</span>
              {showAIUDetail ? <ChevronUp className="h-4 w-4 text-stone" /> : <ChevronDown className="h-4 w-4 text-stone" />}
            </div>
          </button>
          
          {showAIUDetail && (
            <div className="pl-4 space-y-1.5 border-l-2 border-concrete/50 ml-1">
              <DetailRow 
                label={`Administración (${budget.metodo_aiu === 'detallado' ? 'Fija' : (budget.administracion_pct || 10) + '%'})`} 
                value={resumen.administracion} 
              />
              <DetailRow label={`Imprevistos (${budget.imprevistos_pct || 5}%)`} value={resumen.imprevistos} />
              <DetailRow label={`Utilidad (${budget.utilidad_pct || 10}%)`} value={resumen.utilidad} />
            </div>
          )}
        </div>

        {/* IVA */}
        <div className="pt-2">
          <div className="flex items-center justify-between bg-steel-fog/30 p-3 rounded-lg border border-concrete/30">
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-charcoal">IVA (19%)</span>
              <span className="text-[10px] text-stone">Base: {(budget.metodo_iva || 'sobre_utilidad').replace('_', ' ')}</span>
            </div>
            <span className="text-[14px] font-bold text-ink">{formatCurrency(resumen.iva)}</span>
          </div>
        </div>

        {/* TOTAL */}
        <div className="pt-4 border-t-2 border-steel-dark">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-black text-ink uppercase tracking-tighter">Total Presupuesto</span>
            <span className="text-[22px] font-black text-burn-orange tracking-tight">{formatCurrency(resumen.totalOferta)}</span>
          </div>
        </div>

        {/* RETENCIONES */}
        {budget.mostrar_retenciones && (
          <div className="mt-8 pt-6 border-t border-concrete space-y-4">
            <div className="flex items-center gap-2 text-stone">
              <AlertCircle className="h-4 w-4" />
              <span className="text-[12px] font-bold uppercase tracking-widest">Retenciones (Informativo)</span>
            </div>
            
            <div className="space-y-2 bg-sand/50 p-4 rounded-xl border border-concrete/50">
              <DetailRow label={`ReteFuente (${budget.retefuente_pct != null ? budget.retefuente_pct : 2}%)`} value={resumen.retefuente} isNegative />
              <DetailRow label={`ReteICA (${budget.ica_pct != null ? budget.ica_pct : 0.414}%)`} value={resumen.ica} isNegative />
              <DetailRow label={`ReteIVA (${budget.reteiva_pct != null ? budget.reteiva_pct : 0}% s/IVA)`} value={resumen.reteiva} isNegative />
              
              <div className="pt-3 mt-3 border-t border-concrete flex items-center justify-between">
                <span className="text-[13px] font-bold text-ink">Valor Neto a Recibir</span>
                <span className="text-[16px] font-extrabold text-ink">{formatCurrency(resumen.totalNeto)}</span>
              </div>
            </div>

            <p className="text-[11px] text-stone italic leading-relaxed flex gap-2">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              "Las retenciones son descuentos que el cliente aplica al momento del pago. No afectan el valor total del presupuesto pero sí el flujo de caja."
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function DetailRow({ label, value, isSub = false, isNegative = false }: { label: string, value: number, isSub?: boolean, isNegative?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <div className="flex items-center gap-2 text-charcoal">
        <span className="text-stone">├─</span>
        <span className={cn(isSub && "text-stone font-medium italic")}>{label}</span>
      </div>
      <span className={cn("font-medium", isNegative ? "text-stone" : "text-charcoal")}>
        {isNegative && "- "}{formatCurrency(value)}
      </span>
    </div>
  );
}
