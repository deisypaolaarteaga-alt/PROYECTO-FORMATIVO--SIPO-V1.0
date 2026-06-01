'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import {
  Search, BookOpen, ChevronDown, ChevronRight,
  Layers, Tag, Loader2, Info, Pencil, Trash2, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { obtenerCapitulosCatalogo, eliminarCapitulo, eliminarActividad } from '@/actions/catalogo';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { CatalogoCapitulo, CatalogoActividad } from '@/types';
import { CatalogoActividadDrawer } from './CatalogoActividadDrawer';
import { ModalEditarCapitulo } from './ModalEditarCapitulo';
import { ModalCrearCapitulo } from './ModalCrearCapitulo';
import { ModalEditarActividad } from './ModalEditarActividad';
import { ModalCrearActividad } from './ModalCrearActividad';

const TIPOS_OBRA = [
  { id: 'residencial',     label: 'Residencial',     color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'comercial',       label: 'Comercial',       color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'industrial',      label: 'Industrial',      color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'infraestructura', label: 'Infraestructura', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'institucional',   label: 'Institucional',   color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'hotelero',        label: 'Hotelero',        color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
] as const;

type TipoObra = typeof TIPOS_OBRA[number]['id'];

interface Props {
  capitulosIniciales: CatalogoCapitulo[];
  rol?: 'usuario' | 'super_admin';
}

export function CatalogoView({ capitulosIniciales, rol = 'usuario' }: Props) {
  const esSuperAdmin = rol === 'super_admin';
  const router = useRouter();

  const [tipoObra, setTipoObra] = useState<TipoObra>('residencial');
  const [capitulos, setCapitulos] = useState<CatalogoCapitulo[]>(capitulosIniciales);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  // Drawer de detalle (solo lectura)
  const [actividadSeleccionada, setActividadSeleccionada] = useState<CatalogoActividad | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Modales edición capítulo
  const [capituloParaEditar, setCapituloParaEditar] = useState<CatalogoCapitulo | null>(null);
  const [modalEditarCapOpen, setModalEditarCapOpen] = useState(false);
  const [modalCrearCapOpen, setModalCrearCapOpen] = useState(false);

  // Confirm eliminar capítulo directo (Trash en cabecera)
  const [capituloParaEliminar, setCapituloParaEliminar] = useState<CatalogoCapitulo | null>(null);
  const [eliminandoCap, setEliminandoCap] = useState(false);

  // Modales edición actividad
  const [actividadParaEditar, setActividadParaEditar] = useState<CatalogoActividad | null>(null);
  const [modalEditarActOpen, setModalEditarActOpen] = useState(false);
  const [capituloParaCrearAct, setCapituloParaCrearAct] = useState<CatalogoCapitulo | null>(null);
  const [modalCrearActOpen, setModalCrearActOpen] = useState(false);

  // Confirm eliminar actividad directo (Trash en fila)
  const [actividadParaEliminar, setActividadParaEliminar] = useState<CatalogoActividad | null>(null);
  const [eliminandoAct, setEliminandoAct] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      const res = await obtenerCapitulosCatalogo(tipoObra);
      if (res.success && res.data) {
        setCapitulos(res.data);
        setExpanded(new Set());
        setSearch('');
      } else {
        toast.error('No se pudo cargar el catálogo.');
      }
    });
  }, [tipoObra]);

  const filtrados = useMemo(() => {
    if (!search.trim()) return capitulos;
    const q = search.toLowerCase();
    return capitulos
      .map(cap => {
        const actsFiltradas = cap.catalogo_actividades?.filter(
          a => a.nombre.toLowerCase().includes(q) || a.codigo?.toLowerCase().includes(q)
        ) ?? [];
        if (cap.nombre.toLowerCase().includes(q) || actsFiltradas.length > 0) {
          return { ...cap, catalogo_actividades: actsFiltradas.length > 0 ? actsFiltradas : cap.catalogo_actividades };
        }
        return null;
      })
      .filter(Boolean) as CatalogoCapitulo[];
  }, [capitulos, search]);

  const totalActividades = useMemo(
    () => filtrados.reduce((acc, c) => acc + (c.catalogo_actividades?.length ?? 0), 0),
    [filtrados]
  );

  const tipoActual = TIPOS_OBRA.find(t => t.id === tipoObra);

  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const expandAll  = () => setExpanded(new Set(filtrados.map(c => c.id)));
  const collapseAll = () => setExpanded(new Set());

  const abrirActividad = (act: CatalogoActividad) => {
    setActividadSeleccionada(act);
    setDrawerOpen(true);
  };

  // ── Handlers edición capítulo ─────────────────────────────────────────────

  function abrirEditarCapitulo(cap: CatalogoCapitulo, e: React.MouseEvent) {
    e.stopPropagation();
    setCapituloParaEditar(cap);
    setModalEditarCapOpen(true);
  }

  function abrirConfirmEliminarCapitulo(cap: CatalogoCapitulo, e: React.MouseEvent) {
    e.stopPropagation();
    setCapituloParaEliminar(cap);
  }

  async function handleEliminarCapitulo() {
    if (!capituloParaEliminar) return;
    setEliminandoCap(true);
    try {
      const res = await eliminarCapitulo(capituloParaEliminar.id);
      if (!res.success) {
        toast.error(res.error ?? 'No se pudo eliminar el capítulo.');
      } else {
        toast.success('Capítulo eliminado.');
        router.refresh();
        startTransition(async () => {
          const res2 = await obtenerCapitulosCatalogo(tipoObra);
          if (res2.success && res2.data) setCapitulos(res2.data);
        });
      }
    } finally {
      setEliminandoCap(false);
      setCapituloParaEliminar(null);
    }
  }

  // ── Handlers edición actividad ────────────────────────────────────────────

  function abrirEditarActividad(act: CatalogoActividad, e: React.MouseEvent) {
    e.stopPropagation();
    setActividadParaEditar(act);
    setModalEditarActOpen(true);
  }

  function abrirConfirmEliminarActividad(act: CatalogoActividad, e: React.MouseEvent) {
    e.stopPropagation();
    setActividadParaEliminar(act);
  }

  async function handleEliminarActividad() {
    if (!actividadParaEliminar) return;
    setEliminandoAct(true);
    try {
      const res = await eliminarActividad(actividadParaEliminar.id);
      if (!res.success) {
        toast.error(res.error ?? 'No se pudo eliminar la actividad.');
      } else {
        toast.success('Actividad eliminada.');
        router.refresh();
        startTransition(async () => {
          const res2 = await obtenerCapitulosCatalogo(tipoObra);
          if (res2.success && res2.data) setCapitulos(res2.data);
        });
      }
    } finally {
      setEliminandoAct(false);
      setActividadParaEliminar(null);
    }
  }

  // ── Reload tras cerrar modales ─────────────────────────────────────────────

  function recargar() {
    startTransition(async () => {
      const res = await obtenerCapitulosCatalogo(tipoObra);
      if (res.success && res.data) setCapitulos(res.data);
    });
  }

  return (
    <>
      <div className="flex flex-col h-full min-h-0 bg-[#F7F6F3]">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-[#E5E1D8] px-6 py-5 shrink-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#D95510]/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-[#D95510]" />
              </div>
              <div>
                <h1 className="text-[17px] font-bold text-slate-900 leading-tight">Catálogo de referencia</h1>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  Precios de referencia del mercado colombiano 2025–2026
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <Layers className="h-3.5 w-3.5" />
                <span><strong className="text-slate-800">{filtrados.length}</strong> capítulos</span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <Tag className="h-3.5 w-3.5" />
                <span><strong className="text-slate-800">{totalActividades}</strong> actividades</span>
              </div>
              {esSuperAdmin && (
                <button
                  onClick={() => setModalCrearCapOpen(true)}
                  className="flex items-center gap-1.5 h-8 px-3 bg-[#D95510] text-white text-[12px] font-semibold rounded-lg hover:bg-[#B84510] transition-colors shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nuevo capítulo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Filtros ──────────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-[#E5E1D8] px-6 py-3 shrink-0 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {TIPOS_OBRA.map(t => (
              <button
                key={t.id}
                onClick={() => setTipoObra(t.id)}
                disabled={isPending}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
                  tipoObra === t.id
                    ? 'bg-[#D95510] text-white border-[#D95510] shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar actividad o capítulo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-[13px] border border-slate-200 rounded-lg focus:border-[#D95510] focus:outline-none bg-slate-50 placeholder:text-slate-400"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <button onClick={expandAll} className="text-[11px] text-slate-500 hover:text-slate-800 font-medium transition-colors">
                Expandir todo
              </button>
              <span className="text-slate-300">·</span>
              <button onClick={collapseAll} className="text-[11px] text-slate-500 hover:text-slate-800 font-medium transition-colors">
                Colapsar
              </button>
            </div>
          </div>
        </div>

        {/* ── Lista de capítulos ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {isPending ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-[#D95510]" />
              <p className="text-[13px] text-slate-400">Cargando catálogo {tipoActual?.label}...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <BookOpen className="h-10 w-10 text-slate-200" />
              <p className="text-[13px] text-slate-400">
                {search ? 'Sin resultados para esta búsqueda.' : 'No hay capítulos para este tipo de obra.'}
              </p>
            </div>
          ) : (
            filtrados.map(cap => {
              const isExpanded = expanded.has(cap.id);
              const acts = cap.catalogo_actividades ?? [];
              const conAPU = acts.filter(a => (a.catalogo_apu_items?.length ?? 0) > 0).length;

              return (
                <div key={cap.id} className="bg-white rounded-xl border border-[#E5E1D8] overflow-hidden shadow-sm">
                  {/* Cabecera del capítulo */}
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleExpand(cap.id)}
                      className="flex-1 flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className={cn(
                        'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold',
                        tipoActual?.color ?? 'bg-slate-100 text-slate-600'
                      )}>
                        {cap.numero ?? '·'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-bold text-slate-900 truncate">{cap.nombre}</span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">{cap.codigo}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-slate-400">{acts.length} actividades</span>
                          {conAPU > 0 && (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                              {conAPU} con APU
                            </span>
                          )}
                        </div>
                      </div>
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                        : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                    </button>

                    {/* Acciones de administración — solo super_admin */}
                    {esSuperAdmin && (
                      <div className="flex items-center gap-1 pr-3 shrink-0">
                        <button
                          onClick={e => abrirEditarCapitulo(cap, e)}
                          title="Editar capítulo"
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#D95510] hover:bg-[#FDF9F6] transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={e => abrirConfirmEliminarCapitulo(cap, e)}
                          title="Eliminar capítulo"
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actividades del capítulo */}
                  {isExpanded && (
                    <div className="border-t border-[#E5E1D8]">
                      {/* Header de tabla */}
                      <div className={cn(
                        'grid items-center px-4 py-2 bg-slate-50 border-b border-slate-100',
                        esSuperAdmin
                          ? 'grid-cols-[1fr_80px_120px_100px_36px_72px]'
                          : 'grid-cols-[1fr_80px_120px_100px_36px]'
                      )}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Actividad</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide text-center">Unidad</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide text-right">Precio ref.</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide text-right">Rango</span>
                        <span />
                        {esSuperAdmin && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide text-center">Acciones</span>
                        )}
                      </div>

                      {acts.map((act, idx) => {
                        const tieneAPU = (act.catalogo_apu_items?.length ?? 0) > 0;
                        const pRef = Number(act.precio_referencia_nacional || 0);
                        const pMin = Number(act.rango_min || 0);
                        const pMax = Number(act.rango_max || 0);

                        return (
                          <div
                            key={act.id ?? idx}
                            className={cn(
                              'grid items-center px-4 py-2.5 border-b border-slate-100 last:border-0 hover:bg-[#FDF9F6] cursor-pointer group transition-colors',
                              esSuperAdmin
                                ? 'grid-cols-[1fr_80px_120px_100px_36px_72px]'
                                : 'grid-cols-[1fr_80px_120px_100px_36px]'
                            )}
                            onClick={() => abrirActividad(act)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[12px] text-slate-800 font-medium leading-snug group-hover:text-[#D95510] transition-colors truncate">
                                {act.nombre}
                              </span>
                              {tieneAPU && (
                                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                                  APU
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] text-slate-500 font-mono text-center uppercase">
                              {act.unidad}
                            </span>

                            <span className="text-[12px] font-bold text-slate-900 text-right tabular-nums">
                              {pRef > 0 ? formatearCOP(pRef) : <span className="text-slate-300 font-normal">—</span>}
                            </span>

                            <div className="text-right">
                              {pMin > 0 && pMax > 0 ? (
                                <span className="text-[10px] text-slate-400 tabular-nums leading-snug">
                                  {formatearCOP(pMin)}–{formatearCOP(pMax)}
                                </span>
                              ) : (
                                <span className="text-slate-200 text-[11px]">—</span>
                              )}
                            </div>

                            <div className="flex justify-center">
                              <Info className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#D95510] transition-colors" />
                            </div>

                            {esSuperAdmin && (
                              <div
                                className="flex items-center justify-center gap-1"
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  onClick={e => abrirEditarActividad(act, e)}
                                  title="Editar actividad"
                                  className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-[#D95510] hover:bg-[#FDF9F6] transition-colors"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={e => abrirConfirmEliminarActividad(act, e)}
                                  title="Eliminar actividad"
                                  className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Botón "+ Nueva actividad" — solo super_admin */}
                      {esSuperAdmin && acts.length === 0 && (
                        <div className="px-4 py-3 text-center">
                          <button
                            onClick={e => { e.stopPropagation(); setCapituloParaCrearAct(cap); setModalCrearActOpen(true); }}
                            className="text-[12px] text-slate-400 hover:text-[#D95510] transition-colors"
                          >
                            + Agregar primera actividad
                          </button>
                        </div>
                      )}
                      {esSuperAdmin && acts.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-slate-100">
                          <button
                            onClick={e => { e.stopPropagation(); setCapituloParaCrearAct(cap); setModalCrearActOpen(true); }}
                            className="flex items-center gap-1 text-[12px] font-semibold text-[#D95510] hover:text-[#B84510] transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Nueva actividad en {cap.nombre}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Pie informativo ───────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-[#E5E1D8] bg-white px-6 py-2.5 flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <p className="text-[11px] text-slate-400">
            Los precios son de referencia nacional Colombia 2025–2026. Haz clic en cualquier actividad para ver su APU de referencia e importarla a tus insumos.
          </p>
        </div>
      </div>

      {/* ── Drawer de detalle ─────────────────────────────────────────────── */}
      <CatalogoActividadDrawer
        actividad={actividadSeleccionada}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tipoObra={tipoObra}
      />

      {/* ── Modales capítulo ──────────────────────────────────────────────── */}
      <ModalCrearCapitulo
        isOpen={modalCrearCapOpen}
        onClose={() => { setModalCrearCapOpen(false); recargar(); }}
        tipoObraInicial={tipoObra}
      />

      <ModalEditarCapitulo
        isOpen={modalEditarCapOpen}
        onClose={() => { setModalEditarCapOpen(false); setCapituloParaEditar(null); recargar(); }}
        capitulo={capituloParaEditar}
      />

      {/* ── Modales actividad ─────────────────────────────────────────────── */}
      <ModalCrearActividad
        isOpen={modalCrearActOpen}
        onClose={() => { setModalCrearActOpen(false); setCapituloParaCrearAct(null); recargar(); }}
        capitulos={capitulos}
        capituloIdInicial={capituloParaCrearAct?.id}
        onCreated={(actividad) => {
          setModalCrearActOpen(false);
          setCapituloParaCrearAct(null);
          setActividadParaEditar(actividad);
          setModalEditarActOpen(true);
        }}
      />

      <ModalEditarActividad
        isOpen={modalEditarActOpen}
        onClose={() => { setModalEditarActOpen(false); setActividadParaEditar(null); recargar(); }}
        actividad={actividadParaEditar}
      />

      {/* ── ConfirmDialog eliminar capítulo ───────────────────────────────── */}
      <ConfirmDialog
        open={capituloParaEliminar !== null}
        title="¿Eliminar este capítulo?"
        description={
          capituloParaEliminar
            ? `Se eliminará "${capituloParaEliminar.nombre}". Si tiene actividades, debes eliminarlas primero.`
            : ''
        }
        confirmLabel={eliminandoCap ? 'Eliminando…' : 'Sí, eliminar'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleEliminarCapitulo}
        onCancel={() => setCapituloParaEliminar(null)}
      />

      {/* ── ConfirmDialog eliminar actividad ─────────────────────────────── */}
      <ConfirmDialog
        open={actividadParaEliminar !== null}
        title="¿Eliminar esta actividad?"
        description={
          actividadParaEliminar
            ? `Se eliminará "${actividadParaEliminar.nombre}" y sus ítems APU asociados.`
            : ''
        }
        confirmLabel={eliminandoAct ? 'Eliminando…' : 'Sí, eliminar'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleEliminarActividad}
        onCancel={() => setActividadParaEliminar(null)}
      />
    </>
  );
}
