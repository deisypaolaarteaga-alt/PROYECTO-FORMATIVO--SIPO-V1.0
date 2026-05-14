'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Search, Users, Package, Drill, ShieldCheck, Calculator, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/shared/Button';
import { InputPrecio } from '@/components/shared/InputPrecio';
import { InputEditable } from '@/components/shared/InputEditable';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { obtenerAPU, guardarAPU, actualizarActividad, sincronizarPrecioCuadrilla } from '@/actions/presupuestos';
import { getCuadrillas } from '@/actions/cuadrillas';
import { BuscadorInsumos } from '@/components/insumos/BuscadorInsumos';
import { ModalCuadrillaAPU } from '@/components/presupuestos/ModalCuadrillaAPU';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PanelAPUProps {
  isOpen: boolean;
  onClose: () => void;
  activity: any;
  budgetId: string;
}

export function PanelAPU({ isOpen, onClose, activity, budgetId }: PanelAPUProps) {
  const [saving, setSaving] = useState(false);
  const [apu, setApu] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [rendimiento, setRendimiento] = useState(1);
  const [cuadrillas, setCuadrillas] = useState<any[]>([]);
  const [showCuadrillaModal, setShowCuadrillaModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchType, setSearchType] = useState<'material' | 'equipo'>('material');

  // Cargar datos
  useEffect(() => {
    if (!isOpen || !activity) return;

    // Usar datos ya embebidos en la actividad como estado inicial (sin esperar red)
    const apuEmbebido = Array.isArray(activity.apus) ? activity.apus[0] : activity.apus;
    if (apuEmbebido) {
      setApu(apuEmbebido);
      setItems(apuEmbebido.apu_items || []);
      setRendimiento(apuEmbebido.rendimiento || 1);
    } else {
      setApu(null);
      setItems([]);
      setRendimiento(1);
    }

    // Luego refrescar desde servidor para obtener datos más recientes
    loadData();
  }, [isOpen, activity?.id]);

  async function loadData() {
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
    }
  }

  // --- CÁLCULOS ---
  const totals = useMemo(() => {
    const mat = items.filter(i => i.tipo === 'material').reduce((acc, i) => acc + (i.cantidad * i.precio_unitario), 0);
    const eq  = items.filter(i => i.tipo === 'equipo').reduce((acc, i) => acc + (i.cantidad * i.precio_unitario), 0);
    const mo  = items.filter(i => i.tipo === 'mano_obra').reduce((acc, i) => acc + (i.cantidad * i.precio_unitario), 0);
    const hm  = mo * 0.03;
    const epp = mo * 0.01;
    const costoDirecto = mat + mo + eq + hm + epp;
    return { mat, mo, eq, hm, epp, costoDirecto };
  }, [items]);

  // --- ACCIONES ---
  const addItem = (tipo: 'material' | 'mano_obra' | 'equipo') => {
    setItems([...items, { tipo, nombre: 'Nuevo ítem', unidad: tipo === 'mano_obra' ? 'jornal' : 'un', cantidad: 1, precio_unitario: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, fields: any) => {
    const next = [...items];
    const current = next[index];

    // Si se edita el precio manualmente y hay una cuadrilla vinculada, marcar como editado
    let extraFields = {};
    if (fields.precio_unitario !== undefined && current.cuadrilla_id && fields.precio_unitario !== current.precio_unitario) {
      extraFields = { precio_editado_manual: true };
    }

    next[index] = { ...current, ...fields, ...extraFields };
    setItems(next);
  };

  const handleSelectInsumo = (insumo: any) => {
    // Determinar el tipo correcto según la fuente
    let tipo: 'material' | 'mano_obra' | 'equipo' = searchType;
    if (insumo.source === 'labor') tipo = 'mano_obra';
    if (insumo.source === 'equipment') tipo = 'equipo';
    if (insumo.source === 'materials') tipo = 'material';

    setItems([...items, {
      tipo,
      nombre: insumo.nombre,
      unidad: insumo.unidad,
      cantidad: 1,
      precio_unitario: insumo.precio_referencia || insumo.precio_diario || insumo.precio_unitario || 0
    }]);
    setShowSearch(false);
    toast.success(`${insumo.nombre} agregado`);
  };

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
        toast.success('APU aplicado correctamente');
        onClose();
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

  const handleCuadrillaItem = (item: { nombre: string; tipo: 'mano_obra'; unidad: string; cantidad: number; precio_unitario: number; cuadrilla_id?: string; precio_editado_manual?: boolean }) => {
    setItems(prev => [...prev, item]);
    toast.success(`Cuadrilla agregada: ${item.nombre}`);
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
                <p className="text-lg font-bold text-burn-orange leading-none">{formatearCOP(totals.costoDirecto)}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-sand rounded-full transition-colors duration-150">
                <X className="h-5 w-5 text-stone" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

              {/* 1. MANO DE OBRA */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-concrete pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-steel-mid" />
                    <h4 className="text-xs font-semibold text-ink uppercase tracking-tight">Mano de Obra</h4>
                    {items.some(i => i.tipo === 'mano_obra') && (
                      <span className="text-[9px] font-medium bg-steel-fog text-steel-dark px-1.5 py-0.5 rounded">APU</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {cuadrillas.length > 0 && (
                      <button
                        onClick={() => setShowCuadrillaModal(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-[var(--accent-pale)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-all duration-150"
                        title="Usar cuadrilla"
                      >
                        <Users className="h-3 w-3" />
                        Cuadrilla
                      </button>
                    )}
                    <button
                      onClick={() => addItem('mano_obra')}
                      className="p-1 hover:bg-steel-fog rounded text-steel-mid transition-colors duration-150"
                      title="Agregar ítem manual"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {items.filter(i => i.tipo === 'mano_obra').map((item) => (
                    <div key={item.id || `mo-${items.indexOf(item)}`} className="space-y-1">
                      <div className="flex items-center gap-2 group">
                        <InputEditable
                          value={item.nombre}
                          onChange={(val) => updateItem(items.indexOf(item), { nombre: val })}
                          className="text-xs flex-1"
                          placeholder="Trabajador / especialidad"
                        />
                        <input
                          value={item.unidad}
                          onChange={(e) => updateItem(items.indexOf(item), { unidad: e.target.value })}
                          className="w-12 text-[10px] font-medium text-stone bg-transparent border-none text-center"
                        />
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => updateItem(items.indexOf(item), { cantidad: parseFloat(e.target.value) || 0 })}
                          className="w-12 text-xs text-right bg-transparent border-none font-medium"
                        />
                        <InputPrecio
                          value={item.precio_unitario}
                          onChange={(val) => updateItem(items.indexOf(item), { precio_unitario: val })}
                          className={cn(
                            "w-24 text-xs text-right",
                            item.precio_editado_manual ? "text-[var(--accent-primary)] font-bold" : "text-stone"
                          )}
                        />
                        <button onClick={() => removeItem(items.indexOf(item))} className="p-1 text-mortar hover:text-danger-text opacity-0 group-hover:opacity-100 transition-colors duration-150">
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
                  {items.filter(i => i.tipo === 'mano_obra').length === 0 && (
                    <p className="text-[11px] text-stone italic text-center py-2">
                      Sin ítems — agrega <strong>Manual</strong> o usa el botón <strong>Cuadrilla</strong>
                    </p>
                  )}
                </div>
              </section>

              {/* 2. MATERIALES */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-concrete pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-success-text" />
                    <h4 className="text-xs font-semibold text-ink uppercase tracking-tight">Materiales</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSearchType('material'); setShowSearch(true); }}
                      className="p-1 hover:bg-success-bg rounded text-success-text transition-colors duration-150"
                      title="Buscar en catálogo"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    <button onClick={() => addItem('material')} className="p-1 hover:bg-success-bg rounded text-success-text transition-colors duration-150" title="Agregar manual">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {items.filter(i => i.tipo === 'material').map((item) => (
                    <div key={item.id || `mat-${items.indexOf(item)}`} className="flex items-center gap-2 group">
                      <InputEditable
                        value={item.nombre}
                        onChange={(val) => updateItem(items.indexOf(item), { nombre: val })}
                        className="text-xs flex-1"
                        placeholder="Nombre material"
                      />
                      <input
                        value={item.unidad}
                        onChange={(e) => updateItem(items.indexOf(item), { unidad: e.target.value })}
                        className="w-10 text-[10px] font-medium text-stone bg-transparent border-none text-center"
                      />
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => updateItem(items.indexOf(item), { cantidad: parseFloat(e.target.value) || 0 })}
                        className="w-12 text-xs text-right bg-transparent border-none font-medium"
                      />
                      <InputPrecio
                        value={item.precio_unitario}
                        onChange={(val) => updateItem(items.indexOf(item), { precio_unitario: val })}
                        className="w-24 text-xs text-right text-stone"
                      />
                      <button onClick={() => removeItem(items.indexOf(item))} className="p-1 text-mortar hover:text-danger-text opacity-0 group-hover:opacity-100 transition-colors duration-150">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {items.filter(i => i.tipo === 'material').length === 0 && (
                    <p className="text-[11px] text-stone italic text-center py-4">No hay materiales agregados</p>
                  )}
                </div>
              </section>

              {/* 3. EQUIPOS */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-concrete pb-2">
                  <div className="flex items-center gap-2">
                    <Drill className="h-4 w-4 text-steel-mid" />
                    <h4 className="text-xs font-semibold text-ink uppercase tracking-tight">Equipos y Alquileres</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSearchType('equipo'); setShowSearch(true); }}
                      className="p-1 hover:bg-steel-fog rounded text-steel-mid transition-colors duration-150"
                      title="Buscar en catálogo"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    <button onClick={() => addItem('equipo')} className="p-1 hover:bg-steel-fog rounded text-steel-mid transition-colors duration-150">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {items.filter(i => i.tipo === 'equipo').map((item) => (
                    <div key={item.id || `eq-${items.indexOf(item)}`} className="flex items-center gap-2 group">
                      <InputEditable
                        value={item.nombre}
                        onChange={(val) => updateItem(items.indexOf(item), { nombre: val })}
                        className="text-xs flex-1"
                      />
                      <input
                        value={item.unidad}
                        onChange={(e) => updateItem(items.indexOf(item), { unidad: e.target.value })}
                        className="w-10 text-[10px] font-medium text-stone bg-transparent border-none text-center"
                      />
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => updateItem(items.indexOf(item), { cantidad: parseFloat(e.target.value) || 0 })}
                        className="w-12 text-xs text-right bg-transparent border-none font-medium"
                      />
                      <InputPrecio
                        value={item.precio_unitario}
                        onChange={(val) => updateItem(items.indexOf(item), { precio_unitario: val })}
                        className="w-24 text-xs text-right text-stone"
                      />
                      <button onClick={() => removeItem(items.indexOf(item))} className="p-1 text-mortar hover:text-danger-text opacity-0 group-hover:opacity-100 transition-colors duration-150">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {items.filter(i => i.tipo === 'equipo').length === 0 && (
                    <p className="text-[11px] text-stone italic text-center py-4">No hay equipos agregados</p>
                  )}
                </div>
              </section>

              {/* 4. SEGURIDAD */}
              <section className="space-y-3 bg-steel-fog/30 p-4 rounded-lg border border-steel-fog">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-steel-dark" />
                  <h4 className="text-xs font-semibold text-steel-dark uppercase tracking-tight">Seguridad y Herramienta</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-stone">Herramienta Menor (3% sobre MO)</span>
                    <span className="font-semibold text-ink">{formatearCOP(totals.hm)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-stone">EPP (1% sobre MO)</span>
                    <span className="font-semibold text-ink">{formatearCOP(totals.epp)}</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer Summary */}
            <div className="p-6 bg-white border-t border-concrete space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
              <div className="grid grid-cols-2 gap-y-2 text-[11px] font-medium uppercase tracking-wider text-stone">
                <span>Materiales</span>
                <span className="text-right text-ink">{formatearCOP(totals.mat)}</span>
                <span>Mano de Obra</span>
                <span className="text-right text-ink">{formatearCOP(totals.mo)}</span>
                <span>Equipos</span>
                <span className="text-right text-ink">{formatearCOP(totals.eq)}</span>
                <span>Seguridad</span>
                <span className="text-right text-ink">{formatearCOP(totals.hm + totals.epp)}</span>
              </div>

              <div className="pt-4 border-t border-concrete flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-semibold text-steel-mid uppercase tracking-widest mb-1">Costo Directo APU</p>
                  <p className="text-3xl font-bold text-ink leading-none">{formatearCOP(totals.costoDirecto)}</p>
                </div>
                <Button
                  onClick={handleApply}
                  loading={saving}
                  className="bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-lg px-6 transition-colors duration-150"
                  icon={<Calculator className="h-4 w-4" />}
                >
                  Aplicar
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

      <ModalCuadrillaAPU
        isOpen={showCuadrillaModal}
        onClose={() => setShowCuadrillaModal(false)}
        cuadrillas={cuadrillas}
        actividadUnidad={activity?.unidad ?? 'un'}
        onAplicar={handleCuadrillaItem}
      />
    </AnimatePresence>
  );
}
