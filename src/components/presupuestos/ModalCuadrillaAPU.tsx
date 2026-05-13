'use client';

import { useState, useMemo } from 'react';
import { X, Users, ChevronDown, ChevronRight, Calculator, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { cn } from '@/lib/utils';
import { calcularCostoCuadrilla, generarItemApuDeCuadrilla } from '@/lib/calculos/presupuesto';
import type { CuadrillaConTrabajadores } from '@/lib/calculos/presupuesto';

interface ModalCuadrillaAPUProps {
  isOpen: boolean;
  onClose: () => void;
  cuadrillas: CuadrillaConTrabajadores[];
  actividadUnidad: string;
  onAplicar: (item: { nombre: string; tipo: 'mano_obra'; unidad: string; cantidad: number; precio_unitario: number }) => void;
}

export function ModalCuadrillaAPU({
  isOpen,
  onClose,
  cuadrillas,
  actividadUnidad,
  onAplicar,
}: ModalCuadrillaAPUProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rendimiento, setRendimiento] = useState<number>(8);
  const [cantidadCuadrillas, setCantidadCuadrillas] = useState<number>(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const cuadrillaSelected = useMemo(
    () => cuadrillas.find(c => c.id === selectedId) ?? null,
    [cuadrillas, selectedId]
  );

  const costo = useMemo(() => {
    if (!cuadrillaSelected || rendimiento <= 0) return null;
    try {
      const base = calcularCostoCuadrilla(cuadrillaSelected, rendimiento, actividadUnidad);
      // Escalar por cantidad de cuadrillas paralelas
      return {
        ...base,
        costoJornadaReal: base.costoJornadaReal * cantidadCuadrillas,
        costoUnitarioMO: base.costoUnitarioMO * cantidadCuadrillas,
      };
    } catch {
      return null;
    }
  }, [cuadrillaSelected, rendimiento, cantidadCuadrillas, actividadUnidad]);

  function handleAplicar() {
    if (!costo || !cuadrillaSelected) return;
    const item = generarItemApuDeCuadrilla(costo);
    onAplicar({
      nombre: cantidadCuadrillas > 1 ? `MO: ${costo.nombre} ×${cantidadCuadrillas}` : item.nombre,
      tipo: 'mano_obra' as const,
      unidad: item.unidad,
      cantidad: item.cantidad,
      precio_unitario: Math.round(costo.costoJornadaReal),
      cuadrilla_id: cuadrillaSelected.id,
      precio_editado_manual: false,
    });
    onClose();
  }

  // Sugerencia de rendimiento según rendimientos registrados
  const rendimientoSugerido = useMemo(() => {
    if (!cuadrillaSelected) return null;
    const rend = cuadrillaSelected.rendimientos.find(
      r => r.unidad === actividadUnidad || !actividadUnidad
    ) ?? cuadrillaSelected.rendimientos[0];
    return rend ?? null;
  }, [cuadrillaSelected, actividadUnidad]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

              {/* Header */}
              <div className="px-5 py-4 border-b border-concrete flex items-center gap-3 bg-sand/50 shrink-0">
                <div className="h-8 w-8 rounded-lg bg-[var(--accent-pale)] flex items-center justify-center">
                  <Users className="h-4 w-4 text-[var(--accent-primary)]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-ink">Usar cuadrilla</h3>
                  <p className="text-[10px] text-stone">Selecciona la cuadrilla y define el rendimiento</p>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-concrete rounded-full transition-colors">
                  <X className="h-4 w-4 text-stone" />
                </button>
              </div>

              {/* Lista cuadrillas */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {cuadrillas.length === 0 ? (
                  <p className="text-center text-[12px] text-stone py-8">
                    No tienes cuadrillas creadas. Ve a <strong>Insumos → Cuadrillas</strong> para crearlas.
                  </p>
                ) : (
                  cuadrillas.map(c => {
                    const isSelected = selectedId === c.id;
                    const isExpanded = expandedId === c.id;
                    const jornadaBase = c.trabajadores.reduce(
                      (s, t) => s + t.jornal_base * t.factor_prestacional * t.cantidad, 0
                    );
                    return (
                      <div
                        key={c.id}
                        className={cn(
                          'rounded-xl border transition-all',
                          isSelected
                            ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)] bg-[var(--accent-pale)]/30'
                            : 'border-concrete hover:border-mortar bg-white'
                        )}
                      >
                        <div className="flex items-center gap-3 px-4 py-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => setSelectedId(isSelected ? null : c.id)}
                            className={cn(
                              'h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                              isSelected
                                ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                                : 'border-mortar hover:border-[var(--accent-primary)]'
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                          </button>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-ink truncate">{c.nombre}</p>
                            <p className="text-[10px] text-stone">
                              {c.trabajadores.length} trabajadores · Jornada: {formatearCOP(jornadaBase)}
                            </p>
                          </div>

                          {/* Categoría */}
                          {c.categoria_actividad && (
                            <span className="text-[9px] font-bold bg-steel-fog text-stone px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                              {c.categoria_actividad}
                            </span>
                          )}

                          {/* Expand */}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : c.id)}
                            className="p-1 text-stone hover:text-ink transition-colors"
                          >
                            {isExpanded
                              ? <ChevronDown className="h-3.5 w-3.5" />
                              : <ChevronRight className="h-3.5 w-3.5" />}
                          </button>
                        </div>

                        {/* Trabajadores expandidos */}
                        {isExpanded && c.trabajadores.length > 0 && (
                          <div className="border-t border-concrete px-4 py-2 space-y-1 bg-slate-50/50">
                            {c.trabajadores.map((t, i) => (
                              <div key={i} className="flex items-center justify-between text-[11px]">
                                <span className="text-charcoal">{t.especialidad} ×{t.cantidad}</span>
                                <span className="text-stone font-mono">
                                  {formatearCOP(t.jornal_base)} × {t.factor_prestacional.toFixed(4)}
                                  {' = '}{formatearCOP(t.jornal_base * t.factor_prestacional * t.cantidad)}/día
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Configuración de rendimiento (solo si hay cuadrilla seleccionada) */}
              {cuadrillaSelected && (
                <div className="border-t border-concrete px-5 py-4 bg-sand/30 space-y-3 shrink-0">
                  <p className="text-[11px] font-semibold text-stone uppercase tracking-wider">Parámetros de rendimiento</p>

                  {rendimientoSugerido && (
                    <div className="flex items-start gap-2 p-2 bg-info-bg rounded-lg text-[10px] text-info-text">
                      <span className="font-bold shrink-0">Referencia:</span>
                      <span>
                        {rendimientoSugerido.rendimiento_normal} {rendimientoSugerido.unidad}/día
                        {rendimientoSugerido.condiciones ? ` — ${rendimientoSugerido.condiciones}` : ''}
                      </span>
                      <button
                        onClick={() => setRendimiento(rendimientoSugerido.rendimiento_normal)}
                        className="ml-auto font-bold underline shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-stone uppercase block mb-1">
                        Rendimiento ({actividadUnidad || 'un'}/día)
                      </label>
                      <input
                        type="number"
                        min={0.01}
                        step={0.5}
                        value={rendimiento}
                        onChange={e => setRendimiento(parseFloat(e.target.value) || 1)}
                        className="w-full h-9 px-3 text-sm border border-concrete rounded-lg focus:border-[var(--accent-primary)] outline-none text-right font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-stone uppercase block mb-1">
                        Cuadrillas en paralelo
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={cantidadCuadrillas}
                        onChange={e => setCantidadCuadrillas(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full h-9 px-3 text-sm border border-concrete rounded-lg focus:border-[var(--accent-primary)] outline-none text-right font-semibold"
                      />
                    </div>
                  </div>

                  {/* Preview del costo resultante */}
                  {costo && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="text-center p-2 bg-white rounded-lg border border-concrete">
                        <p className="text-[9px] text-stone uppercase font-medium">Costo/Jornada</p>
                        <p className="text-[12px] font-bold text-ink">{formatearCOP(costo.costoJornadaReal)}</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg border border-concrete">
                        <p className="text-[9px] text-stone uppercase font-medium">Rendimiento</p>
                        <p className="text-[12px] font-bold text-ink">{rendimiento} {actividadUnidad}/día</p>
                      </div>
                      <div className="text-center p-2 bg-[var(--accent-pale)] rounded-lg border border-[var(--accent-primary)]/30">
                        <p className="text-[9px] text-[var(--accent-primary)] uppercase font-bold">MO por {actividadUnidad || 'un'}</p>
                        <p className="text-[13px] font-bold text-ink">{formatearCOP(costo.costoUnitarioMO)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="px-5 py-3 border-t border-concrete flex items-center justify-end gap-2 shrink-0 bg-white">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-[12px] font-semibold text-stone hover:text-ink border border-concrete rounded-lg hover:border-mortar transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAplicar}
                  disabled={!costo}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2 text-[12px] font-bold rounded-lg transition-all',
                    costo
                      ? 'bg-[var(--accent-primary)] text-white hover:opacity-90'
                      : 'bg-concrete text-mortar cursor-not-allowed'
                  )}
                >
                  <Calculator className="h-3.5 w-3.5" />
                  Agregar al APU
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
