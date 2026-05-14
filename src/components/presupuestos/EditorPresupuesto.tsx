'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown, ChevronRight, Plus, Trash2,
  Loader2, FileText, Settings, BookOpen, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/Button';
import { InputPrecio } from '@/components/shared/InputPrecio';
import { InputEditable } from '@/components/shared/InputEditable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { 
  agregarCapitulo, agregarActividad, 
  actualizarActividad, actualizarPresupuesto,
  eliminarActividad, eliminarCapitulo 
} from '@/actions/presupuestos';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { PanelAPU } from './PanelAPU';
import { ResumenFinanciero } from './ResumenFinanciero';
import { BotonExportarPDF } from '@/components/pdf/BotonExportarPDF';
import { ModalCatalogo } from './ModalCatalogo';
import { BotonEnviarRevision } from './BotonEnviarRevision';
import { ExplosionInsumosView } from './ExplosionInsumosView';
import { ResumenFinancieroModal } from './ResumenFinancieroModal';
import { BarChart3 } from 'lucide-react';

interface EditorPresupuestoProps {
  budget: any;
  profile: any;
}

export function EditorPresupuesto({ budget: initialBudget, profile }: EditorPresupuestoProps) {
  const [budget, setBudget] = useState(initialBudget);
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(initialBudget.chapters?.map((c: any) => c.id) || [])
  );

  // Sincroniza el estado local cuando router.refresh() trae datos nuevos del servidor
  useEffect(() => {
    setBudget(initialBudget);
    setExpanded(new Set(initialBudget.chapters?.map((c: any) => c.id) || []));
  }, [initialBudget]);
  const [activeTab, setActiveTab] = useState<'estructura' | 'insumos'>('estructura');
  const [isSaving, setIsSaving] = useState(false);
  const [activeApuActivity, setActiveApuActivity] = useState<any | null>(null);
  const [confirmState, setConfirmState] = useState<{ title: string; description?: string; onConfirm: () => void } | null>(null);
  const [catalogoOpen, setCatalogoOpen] = useState(false);
  const [resumenOpen, setResumenOpen] = useState(false);
  const [bannerCiudadIgnorado, setBannerCiudadIgnorado] = useState(false);
  const router = useRouter();

  const ciudadPerfil = (profile?.ciudad || '').trim().toLowerCase();
  const ciudadObra   = (budget.ciudad_ica || '').trim().toLowerCase();
  const mostrarBannerCiudad =
    !bannerCiudadIgnorado &&
    ciudadPerfil !== '' &&
    ciudadObra   !== '' &&
    ciudadPerfil !== ciudadObra;

  const askConfirm = (title: string, description: string, onConfirm: () => void) =>
    setConfirmState({ title, description, onConfirm });

  // --- CÁLCULOS SIMPLES ---
  const subtotalDirecto = (budget.chapters || []).reduce((acc: number, ch: any) => {
    const chTotal = (ch.activities || []).reduce((s: number, a: any) => s + (Number(a.cantidad) * Number(a.precio_unitario) || 0), 0);
    return acc + chTotal;
  }, 0);

  const aiuTotalPct = Number(budget.administracion_pct ?? 10)
    + Number(budget.imprevistos_pct ?? 5)
    + Number(budget.utilidad_pct ?? 10);
  const valorAIU = subtotalDirecto * (aiuTotalPct / 100);
  const utilidadEstimada = subtotalDirecto * (Number(budget.utilidad_pct ?? 10) / 100);
  const valorIVA = budget.iva_porcentaje > 0
    ? utilidadEstimada * (Number(budget.iva_porcentaje) / 100)
    : 0;
  const totalGeneral = subtotalDirecto + valorAIU + valorIVA;
  
  const vigenciaDias = Number(budget.vigencia_dias ?? 0);
  const fechaValidez = budget.created_at && vigenciaDias > 0 ? (() => {
    const d = new Date(budget.created_at);
    d.setDate(d.getDate() + vigenciaDias);
    return d;
  })() : null;

  const fechaValidezFormateada = fechaValidez ? new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Bogota'
  }).format(fechaValidez) : null;

  const toggleChapter = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // --- ACCIONES ---
  const handleAddChapter = async () => {
    const res = await agregarCapitulo(budget.id, 'Nuevo capítulo');
    if (res.data) {
      setBudget((prev: any) => ({
        ...prev,
        chapters: [...(prev.chapters || []), { ...(res.data as Record<string, unknown>), activities: [] }]
      }));
      setExpanded(prev => new Set(prev).add((res.data as any).id));
    }
  };

  const handleAddActivity = async (chId: string) => {
    const res = await agregarActividad(chId, budget.id);
    if (res.data) {
      setBudget((prev: any) => ({
        ...prev,
        chapters: prev.chapters.map((c: any) =>
          c.id === chId ? { ...c, activities: [...(c.activities || []), res.data] } : c
        )
      }));
    }
  };

  const handleUpdateAct = async (actId: string, chId: string, fields: any) => {
    // Optimistic update
    setBudget((prev: any) => ({
      ...prev,
      chapters: prev.chapters.map((c: any) =>
        c.id === chId ? {
          ...c,
          activities: c.activities.map((a: any) => a.id === actId ? { ...a, ...fields } : a)
        } : c
      )
    }));
    
    setIsSaving(true);
    await actualizarActividad(actId, budget.id, fields);
    setIsSaving(false);
  };

  const handleUpdateBudget = async (fields: any) => {
    setBudget((prev: any) => ({ ...prev, ...fields }));
    setIsSaving(true);
    await actualizarPresupuesto(budget.id, fields);
    setIsSaving(false);
  };

  const handleDeleteActivity = (actId: string, chId: string) => {
    askConfirm('¿Eliminar actividad?', 'Esta acción no se puede deshacer.', async () => {
      setConfirmState(null);
      await eliminarActividad(actId, budget.id);
      setBudget((prev: any) => ({
        ...prev,
        chapters: prev.chapters.map((c: any) =>
          c.id === chId ? { ...c, activities: c.activities.filter((a: any) => a.id !== actId) } : c
        )
      }));
    });
  };

  const handleDeleteChapter = (chId: string) => {
    askConfirm('¿Eliminar capítulo?', 'Se eliminarán también todas sus actividades.', async () => {
      setConfirmState(null);
      await eliminarCapitulo(chId, budget.id);
      setBudget((prev: any) => ({
        ...prev,
        chapters: prev.chapters.filter((c: any) => c.id !== chId)
      }));
    });
  };

  return (
    <div className="flex flex-col h-full bg-sand font-sans">
      {/* Header simple */}
      <div className="bg-white border-b border-concrete px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <FileText className="text-steel-mid h-6 w-6" />
          <div className="flex flex-col">
            <InputEditable
              value={budget.titulo}
              onChange={(val) => handleUpdateBudget({ titulo: val })}
              className="text-xl font-bold text-ink w-96"
            />
            {fechaValidezFormateada && (
              <p className="text-[11px] text-stone mt-0.5">
                Válido hasta: <span className="font-semibold">{fechaValidezFormateada}</span>
              </p>
            )}
          </div>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-stone" />}
        </div>
        <div className="flex items-center gap-4">
          <BotonEnviarRevision
            budgetId={budget.id}
            proyectoId={budget.project_id}
            estado={budget.estado ?? 'borrador'}
          />
          <div className="flex flex-col items-end">
            <p className="text-[10px] text-stone uppercase font-bold tracking-widest mb-1">Total Presupuesto</p>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-black text-ink">{formatearCOP(totalGeneral)}</p>
              <button
                onClick={() => setResumenOpen(true)}
                className="h-10 px-4 bg-burn-orange/10 text-burn-orange hover:bg-burn-orange hover:text-white rounded-xl transition-all duration-200 flex items-center gap-2 group shadow-sm border border-burn-orange/20"
                title="Ver Dashboard de Inteligencia"
              >
                <BarChart3 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black uppercase tracking-tight">Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de pestañas */}
      <div className="bg-white border-b border-concrete px-8 flex items-center gap-0">
        <button
          onClick={() => setActiveTab('estructura')}
          className={cn(
            'px-4 py-3.5 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px flex items-center gap-2',
            activeTab === 'estructura'
              ? 'border-burn-orange text-ink'
              : 'border-transparent text-stone hover:text-ink'
          )}
        >
          <FileText className="h-4 w-4" />
          Estructura
        </button>
        <button
          onClick={() => setActiveTab('insumos')}
          className={cn(
            'px-4 py-3.5 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px flex items-center gap-2',
            activeTab === 'insumos'
              ? 'border-burn-orange text-ink'
              : 'border-transparent text-stone hover:text-ink'
          )}
        >
          <Package className="h-4 w-4" />
          Explosión de Insumos
        </button>
      </div>

      {mostrarBannerCiudad && (
        <div className="bg-warning-bg border-b border-warning-border px-8 py-3 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-warning-text mt-0.5 shrink-0">⚠</span>
            <p className="text-sm text-warning-text">
              La ciudad de tu empresa (<strong>{profile.ciudad}</strong>) es diferente a la
              ubicación de la obra (<strong>{budget.ciudad_ica}</strong>).
              Verifica cuál aplicará para las retenciones (ICA).
            </p>
          </div>
          <button
            onClick={() => setBannerCiudadIgnorado(true)}
            className="text-xs text-warning-text hover:text-ink font-medium whitespace-nowrap shrink-0 transition-colors duration-150"
          >
            Ignorar
          </button>
        </div>
      )}

      {activeTab === 'insumos' && (
        <div className="flex-1 overflow-y-auto p-8">
          <ExplosionInsumosView budgetId={budget.id} />
        </div>
      )}

      {activeTab === 'estructura' && (
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Capítulos */}
        {(budget.chapters || []).map((ch: any, idx: number) => {
          const isExpanded = expanded.has(ch.id);
          const chTotal = (ch.activities || []).reduce((s: number, a: any) => s + (Number(a.cantidad) * Number(a.precio_unitario) || 0), 0);

          return (
            <div key={ch.id || `ch-${idx}`} className="bg-white rounded-xl border border-concrete overflow-hidden">
              <div
                className="bg-sand px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-concrete/20 transition-colors duration-150"
                onClick={() => toggleChapter(ch.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-stone" /> : <ChevronRight className="h-5 w-5 text-stone" />}
                  <span className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center shrink-0 text-[11px] font-bold text-primary">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="font-semibold text-ink">{ch.nombre.replace(/^\d{2,3}\.\s*/, '')}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-semibold text-ink">{formatearCOP(chTotal)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteChapter(ch.id); }}
                    className="text-mortar hover:text-danger-text transition-colors duration-150"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-0">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-stone uppercase bg-white border-b border-concrete">
                      <tr>
                        <th className="px-6 py-3 font-medium">Descripción</th>
                        <th className="px-6 py-3 font-medium w-24">Unid.</th>
                        <th className="px-6 py-3 font-medium w-32 text-right">Cantidad</th>
                        <th className="px-6 py-3 font-medium w-40 text-right">Precio Unit.</th>
                        <th className="px-6 py-3 font-medium w-40 text-right">Total</th>
                        <th className="px-6 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand">
                      {(ch.activities || []).map((act: any, aIdx: number) => (
                        <tr key={act.id || `act-${aIdx}`} className="hover:bg-steel-fog/40 transition-colors duration-150">
                          <td className="px-6 py-3">
                            <InputEditable
                              value={act.nombre || act.descripcion}
                              onChange={(val) => handleUpdateAct(act.id, ch.id, { nombre: val })}
                              className="text-ink"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <select
                              value={act.unidad}
                              onChange={(e) => handleUpdateAct(act.id, ch.id, { unidad: e.target.value })}
                              className="bg-transparent border-none focus:ring-0 p-0 text-stone text-xs font-medium"
                            >
                              {['m²', 'ml', 'm³', 'kg', 'gl', 'un', 'pza', 'glb'].map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-3">
                            <input
                              type="number"
                              value={act.cantidad}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateAct(act.id, ch.id, { cantidad: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-transparent border-none focus:ring-0 p-0 text-right text-ink"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <InputPrecio
                              value={act.precio_unitario}
                              onChange={(val) => handleUpdateAct(act.id, ch.id, { precio_unitario: val })}
                              className="text-right text-ink font-medium"
                            />
                          </td>
                          <td className="px-6 py-3 text-right font-semibold text-ink">
                            {formatearCOP(Number(act.cantidad) * Number(act.precio_unitario))}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setActiveApuActivity(act)}
                                className="text-mortar hover:text-steel-mid transition-colors duration-150"
                                title="Análisis de Precios Unitarios (APU)"
                              >
                                <Settings className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDeleteActivity(act.id, ch.id)} className="text-mortar hover:text-danger-text transition-colors duration-150">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-4 bg-white border-t border-sand">
                    <button
                      onClick={() => handleAddActivity(ch.id)}
                      className="text-burn-orange hover:text-burn-deep text-xs font-semibold flex items-center gap-2 transition-colors duration-150"
                    >
                      <Plus className="h-4 w-4" /> AGREGAR ACTIVIDAD
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex gap-3">
          <Button onClick={handleAddChapter} variant="secondary" className="flex-1 border-dashed border-2 py-8 bg-sand hover:bg-concrete/20 transition-colors duration-150">
            <Plus className="mr-2 h-5 w-5" /> AGREGAR NUEVO CAPÍTULO
          </Button>
          <Button onClick={() => setCatalogoOpen(true)} variant="outline" className="border-dashed border-2 py-8 px-6">
            <BookOpen className="mr-2 h-5 w-5" /> IMPORTAR DEL CATÁLOGO
          </Button>
        </div>

        {/* Resumen Financiero Simple */}
        <div className="grid gap-8 xl:grid-cols-[1.8fr_1fr] pt-8">
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-xl border border-concrete space-y-6">
              <h3 className="text-base font-semibold text-ink flex items-center gap-2">
                <Settings className="text-steel-mid h-5 w-5" /> Configuración de Cascada
              </h3>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone uppercase">Administración (AIU %)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={budget.aiu_porcentaje}
                      onChange={(e) => handleUpdateBudget({ aiu_porcentaje: parseFloat(e.target.value) || 0 })}
                      className="w-full h-12 bg-sand border-concrete rounded-lg focus:ring-[var(--accent-primary)] font-semibold text-lg text-ink"
                    />
                    <span className="text-xl font-semibold text-mortar">%</span>
                  </div>
                  <p className="text-[10px] text-stone italic">Se aplica sobre el costo directo total.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone uppercase">IVA sobre Utilidad</label>
                  <div className="flex items-center gap-4 h-12">
                    <button
                      onClick={() => handleUpdateBudget({ iva_porcentaje: budget.iva_porcentaje > 0 ? 0 : 19 })}
                      className={cn(
                        "flex-1 h-full rounded-lg font-semibold text-sm transition-all duration-150 border-2",
                        budget.iva_porcentaje > 0 ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white" : "bg-white border-concrete text-stone"
                      )}
                    >
                      {budget.iva_porcentaje > 0 ? "19% ACTIVADO" : "SIN IVA (0%)"}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone italic">Aplica 19% sobre la utilidad calculada.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-concrete">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-stone font-semibold">Resumen rápido</p>
                  <p className="text-2xl font-bold text-ink">{formatearCOP(totalGeneral)}</p>
                </div>
                <div className="text-right text-stone text-xs">
                  <p>Costo Directo</p>
                  <p>{formatearCOP(subtotalDirecto)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-stone">
                <div className="rounded-lg bg-sand p-4 border border-concrete">
                  <p className="font-semibold text-ink">AIU</p>
                  <p className="mt-2">{formatearCOP(valorAIU)}</p>
                </div>
                <div className="rounded-lg bg-sand p-4 border border-concrete">
                  <p className="font-semibold text-ink">IVA</p>
                  <p className="mt-2">{formatearCOP(valorIVA)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <ResumenFinanciero budget={budget} />
            <div className="bg-white p-6 rounded-xl border border-concrete">
              <h3 className="text-sm font-semibold text-ink uppercase tracking-[0.15em] mb-4">Exportar</h3>
              <BotonExportarPDF budget={budget} profile={profile} />
            </div>
          </div>
        </div>
      </div>
      )}

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ''}
        description={confirmState?.description}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={confirmState?.onConfirm ?? (() => {})}
        onCancel={() => setConfirmState(null)}
      />

      <ModalCatalogo
        isOpen={catalogoOpen}
        onClose={() => setCatalogoOpen(false)}
        budgetId={budget.id}
        onImported={() => router.refresh()}
      />

      {/* Panel APU */}
      <PanelAPU
        isOpen={!!activeApuActivity} 
        onClose={() => {
          setActiveApuActivity(null);
          router.refresh(); // Refrescar para ver el nuevo precio unitario
        }}
        activity={activeApuActivity}
        budgetId={budget.id}
      />

      <ResumenFinancieroModal
        isOpen={resumenOpen}
        onClose={() => setResumenOpen(false)}
        budget={budget}
        subtotalDirecto={subtotalDirecto}
      />

    </div>
  );
}
