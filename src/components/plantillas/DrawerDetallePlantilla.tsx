'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, ChevronDown, ChevronRight, Trash2, Plus, Loader2, Pencil, Check, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDetallePlantilla, actualizarEstructuraPlantilla } from '@/actions/plantillas';
import { toast } from 'sonner';
import { UNIDADES_MEDIDA } from '@/types';
import type { PlantillaDetalle, CapituloPlantilla, CapituloPlantillaInput } from '@/types';

interface Props {
  plantillaId: string | null;
  nombreInicial: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ActividadEdit {
  nombre: string;
  unidad: string;
}

interface CapituloEdit {
  nombre: string;
  actividades: ActividadEdit[];
}

function toEditState(capitulos: CapituloPlantilla[]): CapituloEdit[] {
  return capitulos.map(cap => ({
    nombre:     cap.nombre,
    actividades: cap.actividades.map(act => ({ nombre: act.nombre, unidad: act.unidad })),
  }));
}

export function DrawerDetallePlantilla({ plantillaId, nombreInicial, isOpen, onClose }: Props) {
  const [detalle, setDetalle]             = useState<PlantillaDetalle | null>(null);
  const [cargando, setCargando]           = useState(false);
  const [modoEdicion, setModoEdicion]     = useState(false);
  const [capsEdit, setCapsEdit]           = useState<CapituloEdit[]>([]);
  const [capitulosAbiertos, setCapitulosAbiertos] = useState<Set<number>>(new Set());
  const [guardando, startGuardar]         = useTransition();
  const [mensajeOk, setMensajeOk]         = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen || !plantillaId) {
      setDetalle(null);
      setModoEdicion(false);
      setCapsEdit([]);
      setMensajeOk(false);
      return;
    }
    setCargando(true);
    getDetallePlantilla(plantillaId).then(d => {
      setDetalle(d);
      if (d) {
        setCapsEdit(toEditState(d.capitulos));
        setCapitulosAbiertos(new Set(d.capitulos.map((_, i) => i)));
      }
      setCargando(false);
    });
  }, [isOpen, plantillaId]);

  if (!isOpen) return null;

  // ── Helpers edición ────────────────────────────────────────────────────
  function toggleCapitulo(idx: number) {
    setCapitulosAbiertos(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  function updateCapNombre(capIdx: number, nombre: string) {
    setCapsEdit(prev => prev.map((c, i) => i === capIdx ? { ...c, nombre } : c));
  }

  function eliminarCapitulo(capIdx: number) {
    setCapsEdit(prev => prev.filter((_, i) => i !== capIdx));
    setCapitulosAbiertos(prev => {
      const next = new Set<number>();
      prev.forEach(i => { if (i < capIdx) next.add(i); else if (i > capIdx) next.add(i - 1); });
      return next;
    });
  }

  function agregarCapitulo() {
    const nuevoIdx = capsEdit.length;
    setCapsEdit(prev => [...prev, { nombre: 'Nuevo capítulo', actividades: [] }]);
    setCapitulosAbiertos(prev => new Set([...prev, nuevoIdx]));
  }

  function updateActNombre(capIdx: number, actIdx: number, nombre: string) {
    setCapsEdit(prev => prev.map((c, ci) =>
      ci !== capIdx ? c : { ...c, actividades: c.actividades.map((a, ai) => ai !== actIdx ? a : { ...a, nombre }) }
    ));
  }

  function updateActUnidad(capIdx: number, actIdx: number, unidad: string) {
    setCapsEdit(prev => prev.map((c, ci) =>
      ci !== capIdx ? c : { ...c, actividades: c.actividades.map((a, ai) => ai !== actIdx ? a : { ...a, unidad }) }
    ));
  }

  function eliminarActividad(capIdx: number, actIdx: number) {
    setCapsEdit(prev => prev.map((c, ci) =>
      ci !== capIdx ? c : { ...c, actividades: c.actividades.filter((_, ai) => ai !== actIdx) }
    ));
  }

  function agregarActividad(capIdx: number) {
    setCapsEdit(prev => prev.map((c, ci) =>
      ci !== capIdx ? c : { ...c, actividades: [...c.actividades, { nombre: 'Nueva actividad', unidad: 'gl' }] }
    ));
  }

  function cancelarEdicion() {
    if (detalle) setCapsEdit(toEditState(detalle.capitulos));
    setModoEdicion(false);
    setMensajeOk(false);
  }

  function handleGuardar() {
    startGuardar(async () => {
      if (!plantillaId) return;
      // Los precios se manejan al aplicar la plantilla (APU); la estructura guarda todo en 0.
      const payload: CapituloPlantillaInput[] = capsEdit.map(c => ({
        nombre: c.nombre.trim() || 'Capítulo',
        actividades: c.actividades.map(a => ({
          nombre:          a.nombre.trim() || 'Actividad',
          unidad:          a.unidad || 'gl',
          cantidad:        0,
          precio_unitario: 0,
        })),
      }));
      const res = await actualizarEstructuraPlantilla(plantillaId, payload);
      if (res.success) {
        setMensajeOk(true);
        setModoEdicion(false);
        const d = await getDetallePlantilla(plantillaId);
        if (d) { setDetalle(d); setCapsEdit(toEditState(d.capitulos)); }
        toast.success('Estructura actualizada');
        router.refresh();
        setTimeout(() => setMensajeOk(false), 3000);
      } else {
        toast.error(res.error || 'No se pudo guardar');
      }
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={() => { if (!guardando) onClose(); }}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed top-0 right-0 z-50 h-screen w-full max-w-[540px] bg-white shadow-2xl flex flex-col"
        style={{ borderLeft: '1px solid #E5E1D8' }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="shrink-0 px-5 py-4 border-b border-[#E5E1D8] flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-0.5">
              Plantilla personal
            </p>
            <h2 className="text-[15px] font-bold text-[#111827] leading-snug truncate">
              {detalle?.nombre ?? nombreInicial}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!modoEdicion && (
              <button
                onClick={() => setModoEdicion(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border border-[#E5E1D8] rounded-lg hover:bg-[#F9F8F6] transition-colors text-[#374151]"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar estructura
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#F3F4F6] transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4 text-[#6B7280]" />
            </button>
          </div>
        </div>

        {/* ── Banner éxito ─────────────────────────────────────────────── */}
        {mensajeOk && (
          <div className="shrink-0 mx-5 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-[12px] font-medium">
            <Check className="h-4 w-4 shrink-0" />
            Estructura guardada correctamente.
          </div>
        )}

        {/* ── Cuerpo con scroll ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {cargando ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-[#D95510] animate-spin" />
            </div>
          ) : !detalle ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-8 w-8 text-[#9CA3AF] mb-2" />
              <p className="text-[13px] text-[#6B7280]">No se pudo cargar la plantilla.</p>
            </div>
          ) : capsEdit.length === 0 && !modoEdicion ? (
            <div className="rounded-xl border border-dashed border-[#D1D5DB] px-4 py-8 text-center">
              <p className="text-[13px] text-[#9CA3AF]">Esta plantilla no tiene capítulos.</p>
              <button
                onClick={() => setModoEdicion(true)}
                className="mt-3 text-[12px] font-semibold text-[#D95510] hover:underline"
              >
                Editar estructura para agregar capítulos
              </button>
            </div>
          ) : (
            <>
              {capsEdit.map((cap, capIdx) => {
                const abierto = capitulosAbiertos.has(capIdx);
                return (
                  <div key={capIdx} className="border border-[#E5E1D8] rounded-xl overflow-hidden">
                    {/* Cabecera capítulo */}
                    <div
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 bg-[#F9F8F6]',
                        !modoEdicion && 'cursor-pointer select-none'
                      )}
                      onClick={() => !modoEdicion && toggleCapitulo(capIdx)}
                    >
                      {modoEdicion ? (
                        <>
                          <input
                            value={cap.nombre}
                            onChange={e => updateCapNombre(capIdx, e.target.value)}
                            className="flex-1 h-8 px-2 text-[13px] font-semibold border border-[#D1D5DB] rounded-lg focus:border-[#D95510] outline-none bg-white"
                            onClick={e => e.stopPropagation()}
                          />
                          <button
                            onClick={e => { e.stopPropagation(); eliminarCapitulo(capIdx); }}
                            className="p-1.5 text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            title="Eliminar capítulo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => toggleCapitulo(capIdx)}
                            className="p-0.5 text-[#6B7280] hover:text-[#374151] transition-colors shrink-0"
                          >
                            {abierto
                              ? <ChevronDown className="h-4 w-4" />
                              : <ChevronRight className="h-4 w-4" />
                            }
                          </button>
                          <span className="flex-1 text-[13px] font-semibold text-[#111827] truncate">
                            {cap.nombre}
                          </span>
                          <span className="text-[11px] text-[#9CA3AF] shrink-0">
                            {cap.actividades.length} actividad{cap.actividades.length !== 1 ? 'es' : ''}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Actividades — siempre visibles en modo edición */}
                    {(abierto || modoEdicion) && (
                      <div className="divide-y divide-[#F3F4F6]">
                        {cap.actividades.length === 0 && !modoEdicion ? (
                          <div className="px-4 py-3 text-[12px] text-[#9CA3AF] italic">
                            Sin actividades
                          </div>
                        ) : (
                          cap.actividades.map((act, actIdx) => (
                            <div key={actIdx} className="px-3 py-2.5 bg-white">
                              {modoEdicion ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    value={act.nombre}
                                    onChange={e => updateActNombre(capIdx, actIdx, e.target.value)}
                                    className="flex-1 h-8 px-2.5 text-[12px] border border-[#D1D5DB] rounded-lg focus:border-[#D95510] outline-none bg-white"
                                    placeholder="Nombre actividad"
                                  />
                                  <select
                                    value={act.unidad}
                                    onChange={e => updateActUnidad(capIdx, actIdx, e.target.value)}
                                    className="h-8 px-2 text-[11px] border border-[#D1D5DB] rounded-lg focus:border-[#D95510] outline-none bg-white"
                                  >
                                    {UNIDADES_MEDIDA.map(u => (
                                      <option key={u} value={u}>{u}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => eliminarActividad(capIdx, actIdx)}
                                    className="p-1.5 text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                    title="Eliminar actividad"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="flex-1 text-[12px] text-[#374151] leading-snug">
                                    {act.nombre}
                                  </span>
                                  <span className="text-[11px] text-[#9CA3AF] font-mono uppercase shrink-0">
                                    {act.unidad}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))
                        )}

                        {/* Botón Agregar actividad (solo en modo edición) */}
                        {modoEdicion && (
                          <button
                            onClick={() => agregarActividad(capIdx)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-medium text-[#D95510] hover:bg-[#FFF4EE] transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Agregar actividad
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Botón Agregar capítulo (solo en modo edición) */}
              {modoEdicion && (
                <button
                  onClick={agregarCapitulo}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[13px] font-semibold text-[#D95510] border-2 border-dashed border-[#D95510]/30 rounded-xl hover:bg-[#FFF4EE] hover:border-[#D95510]/50 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Agregar capítulo
                </button>
              )}
            </>
          )}
        </div>

        {/* ── Footer fijo (solo en modo edición) ─────────────────────── */}
        {modoEdicion && (
          <div className="shrink-0 px-5 py-3.5 border-t border-[#E5E1D8] bg-white flex items-center gap-2">
            <button
              onClick={cancelarEdicion}
              disabled={guardando}
              className="px-4 py-2 text-[13px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] rounded-lg transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="ml-auto flex items-center gap-2 px-5 py-2 text-[13px] font-semibold bg-[#D95510] text-white rounded-lg hover:bg-[#C04A0D] disabled:opacity-60 transition-colors shadow-sm"
            >
              {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar cambios
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
