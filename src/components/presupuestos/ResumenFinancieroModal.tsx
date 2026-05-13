'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Calculator, Receipt, ShieldCheck, PieChart, TrendingUp, BarChart3, Info } from 'lucide-react';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { useMemo } from 'react';
import Decimal from 'decimal.js';
import { cn } from '@/lib/utils';

interface ResumenFinancieroModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: any;
  subtotalDirecto: number;
}

export function ResumenFinancieroModal({
  isOpen,
  onClose,
  budget,
  subtotalDirecto,
}: ResumenFinancieroModalProps) {

  const D = (v: number | string | null | undefined) => new Decimal(Number(v) || 0);

  // ── Desglose del Costo Directo ─────────────────────────────────────────────
  const desglose = useMemo(() => {
    let materiales = new Decimal(0);
    let manoObra   = new Decimal(0);
    let equipos    = new Decimal(0);
    let analizado  = new Decimal(0);

    (budget.chapters || []).forEach((ch: any) => {
      (ch.activities || []).forEach((act: any) => {
        if (!act.apus?.length) return;
        const apu = act.apus[0];
        let actApuSuma = new Decimal(0);
        (apu.apu_items || []).forEach((item: any) => {
          const itemTotal = D(item.cantidad).times(D(item.precio_unitario)).times(D(act.cantidad));
          if (item.tipo === 'material')   materiales = materiales.plus(itemTotal);
          else if (item.tipo === 'mano_obra') manoObra = manoObra.plus(itemTotal);
          else if (item.tipo === 'equipo')    equipos  = equipos.plus(itemTotal);
          actApuSuma = actApuSuma.plus(itemTotal);
        });
        analizado = analizado.plus(actApuSuma);
      });
    });

    const cd        = D(subtotalDirecto);
    const noAnalizado = Decimal.max(0, cd.minus(analizado));
    materiales = materiales.plus(noAnalizado);

    const herramientaEpp = manoObra.times(0.04);
    materiales = materiales.minus(herramientaEpp);

    const total = cd.toNumber() || 1; // evitar division por cero
    
    return {
      materiales:     Math.round(materiales.toNumber()),
      manoObra:       Math.round(manoObra.toNumber()),
      equipos:        Math.round(equipos.toNumber()),
      herramientaEpp: Math.round(herramientaEpp.toNumber()),
      pctMateriales:  (materiales.toNumber() / total) * 100,
      pctManoObra:    (manoObra.toNumber() / total) * 100,
      pctEquipos:     (equipos.toNumber() / total) * 100,
      pctHerramienta: (herramientaEpp.toNumber() / total) * 100,
    };
  }, [budget, subtotalDirecto]);

  // ── AIU ───────────────────────────────────────────────────────────────────
  const adminPct   = Number(budget.administracion_pct) || 0;
  const imprevPct  = Number(budget.imprevistos_pct)    || 0;
  const utilidadPct = Number(budget.utilidad_pct)      || 0;

  const cd             = D(subtotalDirecto);
  const adminValor     = cd.times(adminPct).dividedBy(100);
  const imprevistosValor = cd.times(imprevPct).dividedBy(100);
  const utilidadValor  = cd.times(utilidadPct).dividedBy(100);
  const aiuTotal       = adminValor.plus(imprevistosValor).plus(utilidadValor);
  const subtotalConAIU = cd.plus(aiuTotal);

  // ── IVA ──────────────────────────────
  const ivaPct = Number(budget.iva_porcentaje) || 19;
  let ivaValor = new Decimal(0);
  switch (budget.metodo_iva) {
    case 'sobre_utilidad': ivaValor = utilidadValor.times(ivaPct).dividedBy(100);   break;
    case 'sobre_aiu':      ivaValor = aiuTotal.times(ivaPct).dividedBy(100);        break;
    case 'sobre_total':    ivaValor = subtotalConAIU.times(ivaPct).dividedBy(100);  break;
    default:               ivaValor = new Decimal(0);
  }

  const totalGeneral = subtotalConAIU.plus(ivaValor);

  // ── Retenciones ───────────────────────────────────────────────────────────
  const reteFuentePct = budget.retefuente_pct != null ? Number(budget.retefuente_pct) : 2;
  const icaPct        = budget.ica_pct        != null ? Number(budget.ica_pct)        : 0.414;
  const reteivaPct    = budget.reteiva_pct    != null ? Number(budget.reteiva_pct)    : 0;

  const reteFuente = subtotalConAIU.times(reteFuentePct).dividedBy(100);
  const reteIca    = subtotalConAIU.times(icaPct).dividedBy(100);
  const reteIva    = ivaValor.times(reteivaPct).dividedBy(100);
  const neto       = totalGeneral.minus(reteFuente).minus(reteIca).minus(reteIva);

  const fmt = (d: Decimal | number) => formatearCOP(typeof d === 'number' ? d : d.toDecimalPlaces(0).toNumber());

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-charcoal/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="relative w-full max-w-4xl bg-sand rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[95vh] border border-white/20"
        >
          {/* Header */}
          <div className="px-8 py-5 border-b border-concrete flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-burn-orange/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-burn-orange" />
              </div>
              <div>
                <h3 className="text-lg font-black text-ink uppercase tracking-tighter">Dashboard de Inteligencia</h3>
                <p className="text-[10px] text-stone font-bold uppercase tracking-widest">Análisis Estratégico de Costos</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="h-10 w-10 flex items-center justify-center hover:bg-concrete/20 rounded-full transition-all duration-150"
            >
              <X className="h-6 w-6 text-stone" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
            
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                label="Costo Directo" 
                value={fmt(cd)} 
                icon={<Calculator className="h-5 w-5" />}
                color="steel"
              />
              <StatCard 
                label="Total con AIU + IVA" 
                value={fmt(totalGeneral)} 
                icon={<TrendingUp className="h-5 w-5" />}
                color="orange"
                highlight
              />
              <StatCard 
                label="Valor Neto Estimado" 
                value={fmt(neto)} 
                icon={<Receipt className="h-5 w-5" />}
                color="charcoal"
              />
            </div>

            {/* Main Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Cost Breakdown (The "WOW" Chart) */}
              <div className="bg-white p-6 rounded-2xl border border-concrete shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-ink uppercase tracking-widest flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-burn-orange" /> Desglose de Insumos
                  </h4>
                  <span className="text-[10px] font-bold text-stone uppercase tracking-tighter italic">Costo Directo</span>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* SVG Donut Chart */}
                  <div className="relative h-40 w-40 shrink-0">
                    <svg viewBox="0 0 36 36" className="h-full w-full transform -rotate-90">
                      {/* Labor (Orange) */}
                      <circle
                        cx="18" cy="18" r="15.9"
                        fill="transparent"
                        stroke="#E2DDD6"
                        strokeWidth="3.5"
                      />
                      <DonutSlice 
                        percentage={desglose.pctMateriales} 
                        color="#1C2B3A" 
                        offset={0} 
                      />
                      <DonutSlice 
                        percentage={desglose.pctManoObra} 
                        color="#C84C09" 
                        offset={desglose.pctMateriales} 
                      />
                      <DonutSlice 
                        percentage={desglose.pctEquipos} 
                        color="#6B7280" 
                        offset={desglose.pctMateriales + desglose.pctManoObra} 
                      />
                      <DonutSlice 
                        percentage={desglose.pctHerramienta} 
                        color="#9CA3AF" 
                        offset={desglose.pctMateriales + desglose.pctManoObra + desglose.pctEquipos} 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-black text-stone uppercase">CD</span>
                      <span className="text-xs font-black text-ink">100%</span>
                    </div>
                  </div>

                  {/* Legend with Progress Bars */}
                  <div className="flex-1 w-full space-y-4">
                    <LegendItem 
                      label="Materiales" 
                      value={fmt(desglose.materiales)} 
                      pct={desglose.pctMateriales} 
                      color="bg-steel-dark" 
                    />
                    <LegendItem 
                      label="Mano de Obra" 
                      value={fmt(desglose.manoObra)} 
                      pct={desglose.pctManoObra} 
                      color="bg-burn-orange" 
                    />
                    <LegendItem 
                      label="Equipos" 
                      value={fmt(desglose.equipos)} 
                      pct={desglose.pctEquipos} 
                      color="bg-gray-500" 
                    />
                    <LegendItem 
                      label="Herramienta/EPP" 
                      value={fmt(desglose.herramientaEpp)} 
                      pct={desglose.pctHerramienta} 
                      color="bg-gray-400" 
                    />
                  </div>
                </div>
              </div>

              {/* AIU & Fiscal Health */}
              <div className="bg-white p-6 rounded-2xl border border-concrete shadow-sm space-y-6">
                <h4 className="text-xs font-black text-ink uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-600" /> Estructura AIU y Fiscal
                </h4>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight">
                      <span className="text-stone">Administración</span>
                      <span className="text-ink">{adminPct}%</span>
                    </div>
                    <div className="h-2 bg-sand rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(adminPct / (adminPct + imprevPct + utilidadPct)) * 100}%` }}
                        className="h-full bg-steel-mid"
                      />
                    </div>
                    <p className="text-right text-[11px] font-mono text-stone">{fmt(adminValor)}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight">
                      <span className="text-stone">Imprevistos</span>
                      <span className="text-ink">{imprevPct}%</span>
                    </div>
                    <div className="h-2 bg-sand rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(imprevPct / (adminPct + imprevPct + utilidadPct)) * 100}%` }}
                        className="h-full bg-orange-400"
                      />
                    </div>
                    <p className="text-right text-[11px] font-mono text-stone">{fmt(imprevistosValor)}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight">
                      <span className="text-stone">Utilidad (ROI Bruto)</span>
                      <span className="text-ink">{utilidadPct}%</span>
                    </div>
                    <div className="h-2 bg-sand rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(utilidadPct / (adminPct + imprevPct + utilidadPct)) * 100}%` }}
                        className="h-full bg-green-500"
                      />
                    </div>
                    <p className="text-right text-[11px] font-mono font-bold text-green-700">{fmt(utilidadValor)}</p>
                  </div>

                  <div className="pt-4 border-t border-concrete space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-stone">IVA ({ivaPct}%)</span>
                      <span className="text-ink">{fmt(ivaValor)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-black">
                      <span className="text-ink uppercase tracking-tighter">Total Oferta</span>
                      <span className="text-burn-orange">{fmt(totalGeneral)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Disclaimer/Info */}
            <div className="bg-steel-dark text-white p-6 rounded-2xl flex items-start gap-4">
              <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                <Info className="h-6 w-6 text-steel-light" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-black uppercase tracking-widest">Información de Retenciones</h5>
                <p className="text-[11px] text-steel-light leading-relaxed">
                  El valor neto estimado de <strong className="text-white">{fmt(neto)}</strong> contempla retenciones de ReteFuente ({reteFuentePct}%) e ICA ({icaPct}%). 
                  Recuerda que estas retenciones son informativas para el flujo de caja y no afectan el valor contractual del presupuesto.
                </p>
              </div>
            </div>

          </div>

          <div className="p-6 bg-white border-t border-concrete flex justify-center">
            <button 
              onClick={onClose} 
              className="px-10 py-3 bg-steel-dark text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-ink hover:scale-105 active:scale-95 transition-all duration-150 shadow-lg"
            >
              Cerrar Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function StatCard({ label, value, icon, color, highlight = false }: any) {
  const colorMap: any = {
    steel: "bg-steel-dark text-white",
    orange: "bg-burn-orange text-white",
    charcoal: "bg-charcoal text-white",
  };

  return (
    <div className={cn(
      "p-6 rounded-2xl shadow-sm border border-concrete transition-all duration-300 hover:shadow-md",
      highlight ? colorMap[color] : "bg-white"
    )}>
      <div className="flex items-center gap-3 mb-2">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", highlight ? "bg-white/20" : "bg-concrete/30 text-stone")}>
          {icon}
        </div>
        <span className={cn("text-[10px] font-black uppercase tracking-widest", highlight ? "text-white/80" : "text-stone")}>
          {label}
        </span>
      </div>
      <p className={cn("text-xl font-black tracking-tight", highlight ? "text-white" : "text-ink")}>
        {value}
      </p>
    </div>
  );
}

function LegendItem({ label, value, pct, color }: any) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2">
          <div className={cn("h-2.5 w-2.5 rounded-full", color)} />
          <span className="text-[11px] font-bold text-stone uppercase tracking-tight">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-[12px] font-black text-ink">{value}</span>
          <span className="ml-1.5 text-[10px] font-bold text-stone">({pct.toFixed(1)}%)</span>
        </div>
      </div>
      <div className="h-1.5 bg-sand rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full", color)} 
        />
      </div>
    </div>
  );
}

function DonutSlice({ percentage, color, offset }: { percentage: number, color: string, offset: number }) {
  // Circunferencia = 2 * PI * R (R=15.9) ≈ 100
  const strokeDasharray = `${percentage} ${100 - percentage}`;
  const strokeDashoffset = -offset;

  return (
    <motion.circle
      initial={{ strokeDasharray: "0 100" }}
      animate={{ strokeDasharray }}
      transition={{ duration: 1.5, ease: "circOut" }}
      cx="18" cy="18" r="15.9"
      fill="transparent"
      stroke={color}
      strokeWidth="3.5"
      strokeDasharray={strokeDasharray}
      strokeDashoffset={strokeDashoffset}
    />
  );
}
