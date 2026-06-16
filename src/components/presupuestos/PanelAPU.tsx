'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Plus, Trash2, Search, Users, Package, Drill, ShieldCheck, Calculator, RefreshCw, Check, Info } from 'lucide-react';
import { SelectDropdown } from '@/components/shared/SelectDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import Decimal from 'decimal.js';
import { Button } from '@/components/shared/Button';
import { InputPrecio } from '@/components/shared/InputPrecio';
import { InputEditable } from '@/components/shared/InputEditable';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { obtenerAPU, guardarAPU, actualizarActividad, sincronizarPrecioCuadrilla } from '@/actions/presupuestos';
import { getCuadrillas } from '@/actions/cuadrillas';
import { BuscadorInsumos } from '@/components/insumos/BuscadorInsumos';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ActivityWithAPU } from '@/types';

const UNIDADES = ['m²','m³','ml','kg','gl','un','hr','pto','día','ton'];

interface PanelAPUProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityWithAPU;
  budgetId: string;
}

export function PanelAPU({ isOpen, onClose, activity, budgetId }: PanelAPUProps) {
  const [saving, setSaving] = useState(false);
  const [applied, setApplied] = useState(false);
  const [apu, setApu] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [rendimiento, setRendimiento] = useState(1);
  const [cuadrillas, setCuadrillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchType, setSearchType] = useState<'material' | 'equipo'>('material');
  const [pendingPriceIdx, setPendingPriceIdx] = useState<number | null>(null);

  // Estados del selector inline de cuadrilla
  const [selectedCuadrillaId, setSelectedCuadrillaId] = useState<string | null>(null);
  const [cuadrillaUnidad, setCuadrillaUnidad] = useState('m²');

  // Cargar datos — única fuente de verdad: servidor
  useEffect(() => {
    if (!isOpen || !activity) return;
    setApu(null);
    setItems([]);
    setRendimiento(1);
    loadData();
  }, [isOpen, activity?.id]);

  // Pre-llenar rendimiento y unidad al seleccionar cuadrilla
  useEffect(() => {
    if (!selectedCuadrillaId) return;
    const c = cuadrillas.find(c => c.id === selectedCuadrillaId);
    if (!c || !c.rendimientos?.[0]) return;
    setRendimiento(c.rendimientos[0].rendimiento_normal);
    setCuadrillaUnidad(c.rendimientos[0].unidad);
  }, [selectedCuadrillaId, cuadrillas]);

  async function loadData() {
    setLoading(true);
    try {
      const [resApu, resCuad] = await Promise.all([
        obtenerAPU(activity.id),
        getCuadrillas()
      ]);

      if (resApu.data) {
        const apuData = resApu.data as any;
        setApu(apuData);
        setItems(apuData.apu_items || []);
        setRendimiento(apuData.rendimiento || 1);
      } else {
        setApu(null);
        setItems([]);
        setRendimiento(1);
      }
      setCuadrillas(resCuad || []);
    } catch (error) {
      toast.error('Error al cargar datos del APU');
    } finally {
      setLoading(false);
    }
  }

  // --- CÁLCULOS con decimal.js ---
  const itemsMO  = useMemo(() => items.map((item, idx) => ({ item, idx })).filter(({ item }) => item.tipo === 'mano_obra'),  [items]);
  const itemsMat = useMemo(() => items.map((item, idx) => ({ item, idx })).filter(({ item }) => item.tipo === 'material'),   [items]);
  const itemsEq  = useMemo(() => items.map((item, idx) => ({ item, idx })).filter(({ item }) => item.tipo === 'equipo'),     [items]);

  const totals = useMemo(() => {
    const mat = itemsMat.reduce(
      (s, { item: i }) => s.plus(new Decimal(i.cantidad).times(i.precio_unitario)),
      new Decimal(0)
    ).toNumber();
    const eq = itemsEq.reduce(
      (s, { item: i }) => s.plus(new Decimal(i.cantidad).times(i.precio_unitario)),
      new Decimal(0)
    ).toNumber();
    const mo = itemsMO.reduce(
      (s, { item: i }) => s.plus(new Decimal(i.cantidad).times(i.precio_unitario)),
      new Decimal(0)
    ).toNumber();
    const hm  = new Decimal(mo).times(0.03).toNumber();
    const epp = new Decimal(mo).times(0.01).toNumber();
    const costoDirecto = new Decimal(mat).plus(mo).plus(eq).plus(hm).plus(epp).toNumber();
    return { mat, mo, eq, hm, epp, costoDirecto };
  }, [itemsMat, itemsEq, itemsMO]);

  // --- ACCIONES ---
  const addItem = useCallback((tipo: 'material' | 'equipo') => {
    setItems(prev => [...prev, { tipo, nombre: 'Nuevo ítem', unidad: 'un', cantidad: 1, precio_unitario: 0 }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, fields: any) => {
    setItems(prev => {
      const next = [...prev];
      const current = next[index];
      let extraFields = {};
      if (fields.precio_unitario !== undefined && current.cuadrilla_id && fields.precio_unitario !== current.precio_unitario) {
        extraFields = { precio_editado_manual: true };
      }
      next[index] = { ...current, ...fields, ...extraFields };
      return next;
    });
  }, []);

  const handleSelectInsumo = (insumo: any) => {
    let tipo: 'material' | 'equipo' = searchType;
    if (insumo.source === 'equipment') tipo = 'equipo';
    if (insumo.source === 'materials') tipo = 'material';

    const precio = insumo.precio_referencia || insumo.precio_unitario || 0;
    const newIdx = items.length;
    setItems([...items, {
      tipo,
      nombre: insumo.nombre,
      unidad: insumo.unidad,
      cantidad: 1,
      precio_unitario: precio,
    }]);
    if (precio === 0 && tipo === 'material') {
      setPendingPriceIdx(newIdx);
    }
    setShowSearch(false);
    toast.success(`${insumo.nombre} agregado`);
  };

  const handleAgregarCuadrilla = useCallback(() => {
    if (!selectedCuadrillaId || rendimiento <= 0) return;
    const cuadrilla = cuadrillas.find(c => c.id === selectedCuadrillaId);
    if (!cuadrilla) return;

    const costoJornada = (cuadrilla.trabajadores as any[]).reduce(
      (s: Decimal, t: any) => s.plus(new Decimal(t.jornal_con_prestaciones).times(t.cantidad)),
      new Decimal(0)
    );
    const precioUnitario = costoJornada
      .dividedBy(new Decimal(rendimiento))
      .toDecimalPlaces(2)
      .toNumber();

    setItems(prev => [...prev, {
      tipo: 'mano_obra' as const,
      nombre: cuadrilla.nombre,
      unidad: cuadrillaUnidad,
      cantidad: 1,
      precio_unitario: precioUnitario,
      cuadrilla_id: cuadrilla.id,
      precio_editado_manual: false,
    }]);
    setSelectedCuadrillaId(null);
    toast.success(`Cuadrilla agregada: ${cuadrilla.nombre}`);
  }, [selectedCuadrillaId, cuadrillas, rendimiento, cuadrillaUnidad]);

  const handleApply = async () => {
    setSaving(true);
    try {
      const res = await guardarAPU(activity.id, budgetId, {
        id: apu?.id,
        rendimiento,
        items,
      });

      if (res.success) {
        await actualizarActividad(activity.id, budgetId, { precio_unitario: totals.costoDirecto });
        await loadData(); // sincroniza estado con BD para evitar duplicados en reapertura
        toast.success('APU aplicado correctamente');
        setApplied(true);
        setTimeout(() => {
          setApplied(false);
          onClose();
        }, 1500);
      } else {
        toast.error(res.error || 'No se pudo guardar el APU');
      }
    } catch (error) {
      console.error(error);
      toast.error('Ocurrió un error inesperado al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncCuadrilla = async (item: any) => {
    if (!item.id || !item.cuadrilla_id) {
      toast.error('Guarda el APU antes de sincronizar la cuadrilla.');
      return;
    }

    try {
      const res = await sincronizarPrecioCuadrilla(item.id, budgetId);
      if (res.success) {
        toast.success('Precio sincronizado con la cuadrilla');
        loadData();
      } else {
        toast.error(res.error || 'Error al sincronizar precio');
      }
    } catch (error) {
      toast.error('Error al conectar con el servidor');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-[100]"
          />

          {/* Slide-over */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-[460px] bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-concrete flex items-center justify-between bg-sand/50">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-ink truncate">{activity?.nombre}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-medium text-stone bg-concrete px-1.5 py-0.5 rounded uppercase">Unidad: {activity?.unidad}</span>
                  <span className="text-[10px] font-medium text-steel-mid bg-steel-fog px-1.5 py-0.5 rounded uppercase">ID: {activity?.id.split('-')[0]}</span>
                </div>
              </div>
              <div className="text-right px-4">
                <p className="text-[10px] font-medium text-stone uppercase">P.U. Estimado</p>
                <p className="text-lg font-bold text-burn-orange leading-none" style={{ fontFamily: 'var(--font-mono)' }}>{formatearCOP(totals.costoDirecto)}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-sand rounded-full transition-colors duration-150">
                <X className="h-5 w-5 text-stone" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

              {loading && (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="h-6 w-6 text-stone animate-spin" />
                </div>
              )}

              {!loading && <>

              {/* 1. CUADRILLAS (MANO DE OBRA) */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-concrete pb-2">
                  <Users className="h-4 w-4 text-steel-mid" />
                  <h4 className="text-xs font-semibold text-ink uppercase tracking-tight">Cuadrillas</h4>
                  {itemsMO.length > 0 && (
                    <span className="text-[9px] font-medium bg-steel-fog text-steel-dark px-1.5 py-0.5 rounded">APU</span>
                  )}
                </div>

                {/* Selector inline de cuadrilla */}
                <div className="space-y-2 bg-sand/30 rounded-lg p-3 border border-concrete">
                  <SelectDropdown
                    value={selectedCuadrillaId || ''}
                    onChange={v => setSelectedCuadrillaId(v || null)}
                    options={cuadrillas.map((c: any) => ({ value: c.id, label: `${c.nombre}${c.categoria_actividad ? ` — ${c.categoria_actividad}` : ''}${c.es_sistema ? ' (sistema)' : ''}` }))}
                    placeholder="Seleccionar cuadrilla del sistema/personalizadas…"
                    size="sm"
                  />

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone font-medium whitespace-nowrap">Rendimiento:</span>
                    <input
                      type="number"
                      min={0.01}
                      step={0.5}
                      value={rendimiento}
                      onChange={e => setRendimiento(parseFloat(e.target.value) || 1)}
                      className="w-20 h-7 px-2 text-xs border border-concrete rounded-lg text-right font-semibold bg-white focus:border-[var(--accent-primary)] outline-none"
                      placeholder="Ej: 8"
                    />
                    <SelectDropdown
                      value={cuadrillaUnidad}
                      onChange={setCuadrillaUnidad}
                      options={UNIDADES.map(u => ({ value: u, label: u }))}
                      className="w-20"
                      size="xs"
                    />
                    <span className="text-[10px] text-stone">/ jornada</span>
                    <button
                      onClick={handleAgregarCuadrilla}
                      disabled={!selectedCuadrillaId || rendimiento <= 0}
                      className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[var(--accent-pale)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                    >
                      <Plus className="h-3 w-3" />
                      Agregar
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {itemsMO.map(({ item, idx }) => (
                    <div key={`mo-${item.id ?? idx}`} className="space-y-1">
                      <div className="flex items-center gap-2 group">
                        <InputEditable
                          value={item.nombre}
                          onChange={(val) => updateItem(idx, { nombre: val })}
                          className="text-xs flex-1"
                          placeholder="Cuadrilla / mano de obra"
                        />
                        <input
                          value={item.unidad}
                          onChange={(e) => updateItem(idx, { unidad: e.target.value })}
                          className="w-12 text-[10px] font-medium text-stone bg-transparent border-none text-center"
                        />
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => updateItem(idx, { cantidad: parseFloat(e.target.value) || 0 })}
                          className="w-12 text-xs text-right bg-transparent border-none font-medium"
                        />
                        <InputPrecio
                          value={item.precio_unitario}
                          onChange={(val) => updateItem(idx, { precio_unitario: val })}
                          className={cn(
                            "w-24 text-xs text-right",
                            item.precio_editado_manual ? "text-[var(--accent-primary)] font-bold" : "text-stone"
                          )}
                        />
                        <button onClick={() => removeItem(idx)} className="p-1 text-mortar hover:text-danger-text opacity-0 group-hover:opacity-100 transition-colors duration-150">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Badge de cuadrilla vinculada */}
                      {item.cuadrilla_id && (
                        <div className="flex items-center gap-2 pl-2">
                          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-steel-fog border border-concrete">
                            <Users className="h-2.5 w-2.5 text-stone" />
                            <span className="text-[9px] font-bold text-stone uppercase tracking-tight">Cuadrilla vinculada</span>
                          </div>

                          {item.precio_editado_manual ? (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--accent-pale)] border border-[var(--accent-primary)]/20">
                              <span className="text-[9px] font-bold text-[var(--accent-primary)] uppercase tracking-tight">✏️ Precio editado manual</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSyncCuadrilla(item)}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-success-bg/10 border border-success-text/20 text-success-text hover:bg-success-bg/20 transition-colors"
                            >
                              <RefreshCw className="h-2.5 w-2.5" />
                              <span className="text-[9px] font-bold uppercase tracking-tight">Sincronizar precio</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {itemsMO.length === 0 && (
                    <p className="text-[11px] text-stone italic text-center py-2">
                      Sin cuadrillas — selecciona una y define el rendimiento para agregar mano de obra
                    </p>
                  )}
                </div>
              </section>

              {/* 2. MATERIALES */}
              <section className="space-y-4 border-t border-concrete pt-6">
                <div className="flex items-center justify-between border-b border-concrete pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#C84B1A]" />
                    <h4 className="text-xs font-semibold text-ink uppercase tracking-tight">Materiales</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSearchType('material'); setShowSearch(true); }}
                      className="p-1 hover:bg-[#FAF0EB] rounded text-[#C84B1A] transition-colors duration-150"
                      title="Buscar en catálogo"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    <button onClick={() => addItem('material')} className="p-1 hover:bg-[#FAF0EB] rounded text-[#C84B1A] transition-colors duration-150" title="Agregar manual">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {itemsMat.map(({ item, idx }) => (
                    <div key={`mat-${item.id ?? idx}`}>
                      <div className="flex items-center gap-2 group">
                        <InputEditable
                          value={item.nombre}
                          onChange={(val) => updateItem(idx, { nombre: val })}
                          className="text-xs flex-1"
                          placeholder="Nombre material"
                        />
                        <input
                          value={item.unidad}
                          onChange={(e) => updateItem(idx, { unidad: e.target.value })}
                          className="w-10 text-[10px] font-medium text-stone bg-transparent border-none text-center"
                        />
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => updateItem(idx, { cantidad: parseFloat(e.target.value) || 0 })}
                          className="w-12 text-xs text-right bg-transparent border-none font-medium"
                        />
                        <InputPrecio
                          value={item.precio_unitario}
                          onChange={(val) => {
                            updateItem(idx, { precio_unitario: val });
                            if (pendingPriceIdx === idx) setPendingPriceIdx(null);
                          }}
                          autoFocus={pendingPriceIdx === idx}
                          className={cn(
                            "w-24 text-xs text-right",
                            item.precio_unitario === 0 ? "text-amber-600 font-semibold" : "text-stone"
                          )}
                        />
                        <button onClick={() => removeItem(idx)} className="p-1 text-mortar hover:text-danger-text opacity-0 group-hover:opacity-100 transition-colors duration-150">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      {item.precio_unitario === 0 && (
                        <p className="text-[10px] text-amber-600 pl-1 mt-0.5">Ingresa el precio actual del mercado</p>
                      )}
                    </div>
                  ))}
                  {itemsMat.length === 0 && (
                    <p className="text-[11px] text-stone italic text-center py-4">No hay materiales agregados</p>
                  )}
                </div>
              </section>

              {/* 3. EQUIPOS */}
              <section className="space-y-4 border-t border-concrete pt-6">
                <div className="flex items-center justify-between border-b border-concrete pb-2">
                  <div className="flex items-center gap-2">
                    <Drill className="h-4 w-4 text-[#6B7B4A]" />
                    <h4 className="text-xs font-semibold text-ink uppercase tracking-tight">Equipos y Alquileres</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSearchType('equipo'); setShowSearch(true); }}
                      className="p-1 hover:bg-[#E8F0E0] rounded text-[#6B7B4A] transition-colors duration-150"
                      title="Buscar en catálogo"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    <button onClick={() => addItem('equipo')} className="p-1 hover:bg-[#E8F0E0] rounded text-[#6B7B4A] transition-colors duration-150">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {itemsEq.map(({ item, idx }) => (
                    <div key={`eq-${item.id ?? idx}`} className="flex items-center gap-2 group">
                      <InputEditable
                        value={item.nombre}
                        onChange={(val) => updateItem(idx, { nombre: val })}
                        className="text-xs flex-1"
                      />
                      <input
                        value={item.unidad}
                        onChange={(e) => updateItem(idx, { unidad: e.target.value })}
                        className="w-10 text-[10px] font-medium text-stone bg-transparent border-none text-center"
                      />
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => updateItem(idx, { cantidad: parseFloat(e.target.value) || 0 })}
                        className="w-12 text-xs text-right bg-transparent border-none font-medium"
                      />
                      <InputPrecio
                        value={item.precio_unitario}
                        onChange={(val) => updateItem(idx, { precio_unitario: val })}
                        className="w-24 text-xs text-right text-stone"
                      />
                      <button onClick={() => removeItem(idx)} className="p-1 text-mortar hover:text-danger-text opacity-0 group-hover:opacity-100 transition-colors duration-150">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {itemsEq.length === 0 && (
                    <p className="text-[11px] text-stone italic text-center py-4">No hay equipos agregados</p>
                  )}
                </div>
              </section>

              {/* 4. SEGURIDAD */}
              <section className="space-y-3 bg-steel-fog/30 p-4 rounded-xl border border-steel-fog/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-steel-dark" />
                  <h4 className="text-xs font-semibold text-steel-dark uppercase tracking-tight">Seguridad y Herramienta</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span
                      className="text-stone flex items-center gap-1 cursor-help"
                      title="Herramienta Menor: se calcula automáticamente como el 3% del costo total de Mano de Obra (referencia mercado colombiano 2025). Incluye herramientas de mano como palas, picas, llanas y consumibles menores."
                    >
                      Herramienta Menor (3% MO)
                      <Info className="h-3 w-3 text-mortar shrink-0" />
                    </span>
                    <span className="font-semibold text-ink">{formatearCOP(totals.hm)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span
                      className="text-stone flex items-center gap-1 cursor-help"
                      title="EPP (Elementos de Protección Personal): se calcula automáticamente como el 1% del costo total de Mano de Obra. Incluye cascos, guantes, gafas, botas y demás dotación de seguridad industrial obligatoria."
                    >
                      EPP (1% MO)
                      <Info className="h-3 w-3 text-mortar shrink-0" />
                    </span>
                    <span className="font-semibold text-ink">{formatearCOP(totals.epp)}</span>
                  </div>
                </div>
              </section>

              </>}
            </div>

            {/* Footer Summary */}
            <div className="p-6 bg-[#1A2535] border-t border-[#0F1922] space-y-4">
              <div className="grid grid-cols-2 gap-y-2 text-[11px] font-medium uppercase tracking-wider text-white/50">
                <span>Materiales</span>
                <span className="text-right text-white/80" style={{ fontFamily: 'var(--font-mono)' }}>{formatearCOP(totals.mat)}</span>
                <span>Cuadrillas</span>
                <span className="text-right text-white/80" style={{ fontFamily: 'var(--font-mono)' }}>{formatearCOP(totals.mo)}</span>
                <span>Equipos</span>
                <span className="text-right text-white/80" style={{ fontFamily: 'var(--font-mono)' }}>{formatearCOP(totals.eq)}</span>
                <span>Seguridad</span>
                <span className="text-right text-white/80" style={{ fontFamily: 'var(--font-mono)' }}>{formatearCOP(totals.hm + totals.epp)}</span>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Costo Directo APU</p>
                  <p className="text-3xl font-bold text-white leading-none" style={{ fontFamily: 'var(--font-mono)' }}>{formatearCOP(totals.costoDirecto)}</p>
                </div>
                <Button
                  onClick={handleApply}
                  loading={saving}
                  disabled={applied}
                  className={cn(
                    'rounded-lg px-6 transition-all duration-300',
                    applied
                      ? 'bg-success-bg border border-success-border text-success-text'
                      : 'bg-burn-orange hover:bg-burn-deep text-white'
                  )}
                  icon={applied ? <Check className="h-4 w-4" /> : <Calculator className="h-4 w-4" />}
                >
                  {applied ? 'Aplicado' : 'Aplicar'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      <BuscadorInsumos
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={handleSelectInsumo}
      />
    </AnimatePresence>
  );
}
