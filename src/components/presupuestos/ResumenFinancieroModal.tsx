'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Calculator, Receipt, ShieldCheck } from 'lucide-react';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { useMemo } from 'react';
import Decimal from 'decimal.js';

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

    return {
      materiales:    Math.round(materiales.toNumber()),
      manoObra:      Math.round(manoObra.toNumber()),
      equipos:       Math.round(equipos.toNumber()),
      herramientaEpp: Math.round(herramientaEpp.toNumber()),
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

  // ── IVA (respeta metodo_iva del presupuesto) ──────────────────────────────
  const ivaPct = Number(budget.iva_porcentaje) || 19;
  let ivaValor = new Decimal(0);
  switch (budget.metodo_iva) {
    case 'sobre_utilidad': ivaValor = utilidadValor.times(ivaPct).dividedBy(100);   break;
    case 'sobre_aiu':      ivaValor = aiuTotal.times(ivaPct).dividedBy(100);        break;
    case 'sobre_total':    ivaValor = subtotalConAIU.times(ivaPct).dividedBy(100);  break;
    default:               ivaValor = new Decimal(0); // no_aplica
  }

  const ivaLabel =
    budget.metodo_iva === 'no_aplica' || !budget.metodo_iva ? 'IVA (No aplica)' :
    budget.metodo_iva === 'sobre_utilidad' ? `IVA ${ivaPct}% s/Utilidad:` :
    budget.metodo_iva === 'sobre_aiu'      ? `IVA ${ivaPct}% s/AIU:` :
    budget.metodo_iva === 'sobre_total'    ? `IVA ${ivaPct}% s/Total:` :
    `IVA ${ivaPct}%:`;

  const totalGeneral = subtotalConAIU.plus(ivaValor);

  // ── Retenciones (base = subtotalConAIU, igual que motor-presupuesto y PDF) ─
  // Usa null-check para distinguir "0% explícito" de "campo vacío"
  const reteFuentePct = budget.retefuente_pct != null ? Number(budget.retefuente_pct) : 2;
  const icaPct        = budget.ica_pct        != null ? Number(budget.ica_pct)        : 0.414;
  const reteivaPct    = budget.reteiva_pct    != null ? Number(budget.reteiva_pct)    : 0;

  const reteFuente = subtotalConAIU.times(reteFuentePct).dividedBy(100);
  const reteIca    = subtotalConAIU.times(icaPct).dividedBy(100);
  const reteIva    = ivaValor.times(reteivaPct).dividedBy(100);
  const neto       = totalGeneral.minus(reteFuente).minus(reteIca).minus(reteIva);

  const mostrarRetenciones = budget.mostrar_retenciones !== false;

  const fmt = (d: Decimal) => formatearCOP(d.toDecimalPlaces(0).toNumber());

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="px-6 py-4 border-b border-steel-dark/20 flex items-center justify-between bg-steel-dark text-white">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-steel-light" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">Resumen Financiero Completo</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-steel-mid/30 rounded-lg transition-colors duration-150">
              <X className="h-4 w-4 text-steel-light" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 font-mono text-sm custom-scrollbar bg-sand">

            {/* Costos Directos */}
            <div className="bg-white p-4 rounded-lg border border-concrete">
              <h4 className="font-semibold text-ink border-b border-concrete pb-2 mb-3 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-steel-mid" /> COSTOS DIRECTOS
              </h4>
              <div className="space-y-1.5 pl-2">
                <div className="flex justify-between text-stone">
                  <span>├─ Materiales:</span>
                  <span>{formatearCOP(desglose.materiales)}</span>
                </div>
                <div className="flex justify-between text-stone">
                  <span>├─ Mano de obra:</span>
                  <span>{formatearCOP(desglose.manoObra)}</span>
                </div>
                <div className="flex justify-between text-stone">
                  <span>├─ Equipos:</span>
                  <span>{formatearCOP(desglose.equipos)}</span>
                </div>
                <div className="flex justify-between text-stone">
                  <span>└─ Herramienta/EPP:</span>
                  <span>{formatearCOP(desglose.herramientaEpp)}</span>
                </div>
                <div className="flex justify-between font-semibold text-ink pt-2 border-t border-concrete mt-2">
                  <span>SUBTOTAL CD:</span>
                  <span>{fmt(cd)}</span>
                </div>
              </div>
            </div>

            {/* AIU */}
            <div className="bg-white p-4 rounded-lg border border-concrete">
              <h4 className="font-semibold text-ink border-b border-concrete pb-2 mb-3">
                AIU ({adminPct + imprevPct + utilidadPct}% sobre CD)
              </h4>
              <div className="space-y-1.5 pl-2">
                <div className="flex justify-between text-stone">
                  <span>├─ Administración {adminPct}%:</span>
                  <span>{fmt(adminValor)}</span>
                </div>
                <div className="flex justify-between text-stone">
                  <span>├─ Imprevistos {imprevPct}%:</span>
                  <span>{fmt(imprevistosValor)}</span>
                </div>
                <div className="flex justify-between text-stone">
                  <span>└─ Utilidad {utilidadPct}%:</span>
                  <span>{fmt(utilidadValor)}</span>
                </div>
                <div className="flex justify-between font-semibold text-ink pt-2 border-t border-concrete mt-2">
                  <span>SUBTOTAL AIU:</span>
                  <span>{fmt(aiuTotal)}</span>
                </div>
              </div>
            </div>

            {/* IVA y Total */}
            <div className="bg-white p-4 rounded-lg border border-concrete space-y-4">
              <div className="flex justify-between text-ink font-semibold">
                <span>{ivaLabel}</span>
                <span>
                  {budget.metodo_iva === 'no_aplica' || !budget.metodo_iva
                    ? 'No aplica'
                    : fmt(ivaValor)
                  }
                </span>
              </div>
              <div className="border-t-2 border-b-2 border-ink py-3 flex justify-between items-center bg-sand px-2 rounded-lg">
                <span className="font-semibold text-ink">TOTAL PRESUPUESTO:</span>
                <span className="text-xl font-bold text-burn-orange">{fmt(totalGeneral)}</span>
              </div>
            </div>

            {/* Retenciones — solo si mostrar_retenciones = true */}
            {mostrarRetenciones && (
              <div className="bg-warning-bg p-4 rounded-lg border border-warning-border text-warning-text">
                <h4 className="font-semibold border-b border-warning-border pb-2 mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> RETENCIONES (Informativo)
                </h4>
                <div className="space-y-1.5 pl-2 text-sm">
                  <div className="flex justify-between opacity-90">
                    <span>├─ ReteFuente {reteFuentePct}%:</span>
                    <span>- {fmt(reteFuente)}</span>
                  </div>
                  <div className="flex justify-between opacity-90">
                    <span>├─ ReteICA {icaPct}%:</span>
                    <span>- {fmt(reteIca)}</span>
                  </div>
                  {reteivaPct > 0 && ivaValor.greaterThan(0) && (
                    <div className="flex justify-between opacity-90">
                      <span>├─ ReteIVA {reteivaPct}% s/IVA:</span>
                      <span>- {fmt(reteIva)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-3 border-t border-warning-border mt-2 text-base">
                    <span>VALOR NETO A RECIBIR:</span>
                    <span>{fmt(neto)}</span>
                  </div>
                </div>
                <p className="text-[10px] italic mt-4 opacity-80">
                  * Las retenciones son informativas y no afectan el Total del Presupuesto a cobrar. Son descuentos aplicados por el cliente al momento del pago.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-sand border-t border-concrete text-center">
            <button onClick={onClose} className="px-6 py-2 bg-steel-dark text-white rounded-lg text-sm font-semibold hover:bg-charcoal transition-colors duration-150">
              Cerrar Resumen
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
