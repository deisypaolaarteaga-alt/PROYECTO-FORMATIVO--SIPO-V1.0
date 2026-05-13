'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { calcularTotalPresupuesto } from '@/lib/calculos/motor-presupuesto';
import type { Budget, Chapter, Activity, APUItem } from '@/types';


interface ResumenFinancieroProps {
  budget: Budget & { chapters?: Chapter[] };
}

const getApuItems = (activity: any): APUItem[] => {
  if (!activity) return [];
  if (Array.isArray(activity.apu_items) && activity.apu_items.length > 0) return activity.apu_items;
  if (Array.isArray(activity.apus) && activity.apus.length > 0) {
    return Array.isArray(activity.apus[0]?.apu_items) ? activity.apus[0].apu_items : [];
  }
  return [];
};

export function ResumenFinanciero({ budget }: ResumenFinancieroProps) {
  const [showRetenciones, setShowRetenciones] = useState(false);

  const activities = useMemo(() => {
    return (budget.chapters ?? []).flatMap((chapter: any) =>
      (chapter.activities ?? []).map((activity: any) => ({
        subtotal: Number(activity.subtotal ?? ((Number(activity.cantidad) * Number(activity.precio_unitario)) || 0)),
      })),
    );
  }, [budget.chapters]);

  const resumen = useMemo(() => {
    const administracionPct = budget.administracion_pct ?? 10;
    const imprevistosPct = budget.imprevistos_pct ?? 5;
    const utilidadPct = budget.utilidad_pct ?? 10;

    const aiu = {
      administracion_pct: Number(administracionPct),
      imprevistos_pct: Number(imprevistosPct),
      utilidad_pct: Number(utilidadPct),
      metodo_iva: (budget.metodo_iva ?? 'sobre_utilidad') as 'sobre_utilidad' | 'sobre_aiu' | 'sobre_total' | 'no_aplica',
      iva_porcentaje: Number(budget.iva_porcentaje ?? 19),
    };

    const retencionesConfig = {
      retefuente: Number(budget.retefuente_pct ?? 2),
      ica: Number(budget.ica_pct ?? 0),
      reteiva: Number(budget.reteiva_pct ?? 0),
    };

    return calcularTotalPresupuesto(activities, aiu, retencionesConfig);
  }, [activities, budget.administracion_pct, budget.imprevistos_pct, budget.utilidad_pct, budget.metodo_iva, budget.iva_porcentaje, budget.retefuente_pct, budget.ica_pct, budget.reteiva_pct]);

  const breakdown = useMemo(() => {
    let materiales = 0;
    let manoObra = 0;
    let equipos = 0;
    let otros = 0;
    let rendimientoCero = false;
    let actividadesSinApu = 0;

    (budget.chapters ?? []).forEach((chapter: any) => {
      (chapter.activities ?? []).forEach((activity: any) => {
        const items = getApuItems(activity);
        const activitySubtotal = Number(activity.subtotal ?? ((Number(activity.cantidad) * Number(activity.precio_unitario)) || 0));
        if (items.length === 0) {
          if (Number(activity.precio_unitario) > 0) {
            actividadesSinApu += 1;
          }
          otros += activitySubtotal;
          return;
        }

        items.forEach((item) => {
          const valor = Number(item.cantidad || 0) * Number(item.precio_unitario || 0);
          if (item.tipo === 'material') materiales += valor;
          else if (item.tipo === 'mano_obra') manoObra += valor;
          else if (item.tipo === 'equipo') equipos += valor;
          else {
            otros += valor;
          }
        });

        const apu = activity.apu ?? (Array.isArray(activity.apus) ? activity.apus[0] : null);
        if (apu && Number(apu.rendimiento) === 0) rendimientoCero = true;
      });
    });

    return {
      materiales: Math.round(materiales),
      manoObra: Math.round(manoObra),
      equipos: Math.round(equipos),
      otros: Math.round(otros),
      rendimientoCero,
      actividadesSinApu,
    };
  }, [budget.chapters]);

  const aiuTotalPct = Number(budget.administracion_pct ?? 10)
    + Number(budget.imprevistos_pct ?? 5)
    + Number(budget.utilidad_pct ?? 10);

  return (
    <aside className="w-full md:w-90 lg:w-100 shrink-0">
      <div className="sticky top-4 space-y-4">
        <div className="bg-white border border-concrete rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-stone font-semibold">Resumen financiero</p>
              <h2 className="mt-2 text-lg font-semibold text-ink">Totales en tiempo real</h2>
            </div>
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-steel-fog text-steel-mid">
              <FileText className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm text-stone">
            <div className="rounded-lg border border-concrete bg-sand p-4">
              <div className="text-stone text-xs">Materiales</div>
              <div className="mt-1.5 text-base font-semibold text-ink">{formatCurrency(breakdown.materiales)}</div>
            </div>
            <div className="rounded-lg border border-concrete bg-sand p-4">
              <div className="text-stone text-xs">Mano de obra</div>
              <div className="mt-1.5 text-base font-semibold text-ink">{formatCurrency(breakdown.manoObra)}</div>
            </div>
            <div className="rounded-lg border border-concrete bg-sand p-4">
              <div className="text-stone text-xs">Equipos</div>
              <div className="mt-1.5 text-base font-semibold text-ink">{formatCurrency(breakdown.equipos)}</div>
            </div>
            {breakdown.otros > 0 && (
              <div className="rounded-lg border border-concrete bg-sand p-4">
                <div className="text-stone text-xs">Otros / sin APU</div>
                <div className="mt-1.5 text-base font-semibold text-ink">{formatCurrency(breakdown.otros)}</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-concrete rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between text-stone uppercase tracking-[0.2em] text-[11px] font-semibold">
            <span>AIU</span>
            <span>{aiuTotalPct}%</span>
          </div>

          <div className="space-y-3 text-sm text-stone">
            <div className="flex justify-between">
              <span>Administración ({budget.administracion_pct ?? 10}%)</span>
              <span className="font-semibold text-ink">{formatCurrency(resumen.administracion)}</span>
            </div>
            <div className="flex justify-between">
              <span>Imprevistos ({budget.imprevistos_pct ?? 5}%)</span>
              <span className="font-semibold text-ink">{formatCurrency(resumen.imprevistos)}</span>
            </div>
            <div className="flex justify-between">
              <span>Utilidad ({budget.utilidad_pct ?? 10}%)</span>
              <span className="font-semibold text-ink">{formatCurrency(resumen.utilidad)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-concrete flex justify-between items-center text-ink font-semibold">
            <span>Subtotal</span>
            <span>{formatCurrency(resumen.subtotalConAIU)}</span>
          </div>
        </div>

        <div className="bg-white border border-concrete rounded-xl p-6">
          <div className="flex items-center justify-between text-sm text-stone uppercase tracking-[0.2em] font-semibold mb-2">
            <span>IVA</span>
            <span className="text-ink font-semibold">{formatCurrency(resumen.iva)}</span>
          </div>
          <p className="text-[11px] text-stone leading-5">
            IVA aplicado solo sobre la utilidad del presupuesto, según metodologías de obra colombiana.
          </p>
        </div>

        <div className="bg-white border border-concrete rounded-xl p-6">
          <div className="flex justify-between items-center text-stone uppercase tracking-[0.2em] text-[11px] font-semibold mb-2">
            <span>Total</span>
            <span className="text-stone">COP</span>
          </div>
          <div className="text-3xl font-bold text-ink">{formatCurrency(resumen.totalOferta)}</div>
        </div>

        <div className="bg-white border border-concrete rounded-xl p-4">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-ink transition-colors duration-150 hover:text-steel-dark"
            onClick={() => setShowRetenciones(!showRetenciones)}
          >
            <span>Ver retenciones informativas</span>
            {showRetenciones ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {showRetenciones && (
            <div className="mt-4 space-y-3 text-sm text-stone">
              <div className="flex justify-between">
                <span>ReteFuente ({budget.retefuente_pct ?? 2}%)</span>
                <span>{formatCurrency(resumen.retenciones.retefuente)}</span>
              </div>
              <div className="flex justify-between">
                <span>ICA ({budget.ica_pct ?? 0}%)</span>
                <span>{formatCurrency(resumen.retenciones.ica)}</span>
              </div>
              <div className="flex justify-between">
                <span>ReteIVA ({budget.reteiva_pct ?? 0}%)</span>
                <span>{formatCurrency(resumen.retenciones.reteiva)}</span>
              </div>
              <div className="flex justify-between border-t border-concrete pt-3 font-semibold text-ink">
                <span>Total retenciones</span>
                <span>{formatCurrency(resumen.retenciones.total)}</span>
              </div>
            </div>
          )}
        </div>

        {(breakdown.rendimientoCero || breakdown.actividadesSinApu > 0) && (
          <div className="bg-warning-bg border border-warning-border text-warning-text rounded-xl p-4 text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              <span>Advertencias de calidad</span>
            </div>
            {breakdown.rendimientoCero && (
              <p>Algún APU tiene rendimiento 0; revisa la actividad y corrige el APU.</p>
            )}
            {breakdown.actividadesSinApu > 0 && (
              <p>{breakdown.actividadesSinApu} actividad(es) sin APU definida.</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
