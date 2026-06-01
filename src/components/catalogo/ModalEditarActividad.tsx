'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  actualizarActividad,
  eliminarActividad,
  crearCatalogoAPUItem,
  actualizarCatalogoAPUItem,
  eliminarCatalogoAPUItem,
  obtenerAPUItemsActividad,
  buscarInsumosCatalogo,
  buscarCuadrillas,
} from '@/actions/catalogo';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Trash2, Plus, Loader2, Search, PencilLine, ChevronLeft,
  AlertTriangle, Users, ChevronDown, ChevronUp,
} from 'lucide-react';
import { formatearCOP } from '@/lib/utils/formato-cop';
import Decimal from 'decimal.js';
import type {
  CatalogoActividad, CatalogoApuItem,
  ResultadoBusquedaInsumo, ResultadoBusquedaCuadrilla, TrabajadorCuadrilla,
} from '@/types';

const UNIDADES_COMUNES = ['m²', 'ml', 'm³', 'kg', 'und', 'gl', 'hr', 'jor'] as const;

const TIPO_APU_LABELS: Record<string, string> = {
  material:          'Material',
  mano_obra:         'Mano de obra',
  equipo:            'Equipo',
  herramienta_menor: 'Herr. menor',
  epp:               'EPP',
};

const TIPO_APU_LABELS_FULL: Record<string, string> = {
  material:          'Material',
  mano_obra:         'Mano de obra',
  equipo:            'Equipo',
  herramienta_menor: 'Herramienta menor',
  epp:               'EPP',
};

type TipoAPU = 'material' | 'mano_obra' | 'equipo' | 'herramienta_menor' | 'epp';
type ModoPanel = 'buscar' | 'cuadrilla' | 'manual' | null;

interface APUItemDraft extends CatalogoApuItem {
  _dirty?: boolean;
  _nuevo?: boolean;
}

interface CuadrillaPendiente {
  cuadrilla: ResultadoBusquedaCuadrilla;
  duplicados: string[];
  nuevos: TrabajadorCuadrilla[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  actividad: CatalogoActividad | null;
}

export function ModalEditarActividad({ isOpen, onClose, actividad }: Props) {
  const router = useRouter();

  // ── Campos actividad ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(false);
  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState('m²');
  const [precio, setPrecio] = useState('');
  const [rangoMin, setRangoMin] = useState('');
  const [rangoMax, setRangoMax] = useState('');
  const [error, setError] = useState('');

  // ── APU items ─────────────────────────────────────────────────────────────────
  const [apuItems, setApuItems] = useState<APUItemDraft[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [savingApuIds, setSavingApuIds] = useState<Set<string>>(new Set());
  const [confirmEliminarApuId, setConfirmEliminarApuId] = useState<string | null>(null);

  // ── Panel de búsqueda / adición ──────────────────────────────────────────────
  const [panelVisible, setPanelVisible] = useState(false);
  const [tipoPanel, setTipoPanel] = useState<TipoAPU>('material');
  const [modoPanel, setModoPanel] = useState<ModoPanel>(null);

  // Estado del buscador de insumos
  const [queryBusqueda, setQueryBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ResultadoBusquedaInsumo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  // Confirmación de duplicado (insumo individual)
  const [insumoAConfirmar, setInsumoAConfirmar] = useState<ResultadoBusquedaInsumo | null>(null);

  // Estado del buscador de cuadrillas
  const [queryCuadrilla, setQueryCuadrilla] = useState('');
  const [resultadosCuadrilla, setResultadosCuadrilla] = useState<ResultadoBusquedaCuadrilla[]>([]);
  const [buscandoCuadrilla, setBuscandoCuadrilla] = useState(false);
  const [cuadrillaExpandida, setCuadrillaExpandida] = useState<string | null>(null);
  const inputCuadrillaRef = useRef<HTMLInputElement>(null);

  // Confirmación de duplicados de cuadrilla
  const [cuadrillaPendiente, setCuadrillaPendiente] = useState<CuadrillaPendiente | null>(null);

  // ── Cargar datos al abrir ─────────────────────────────────────────────────────
  useEffect(() => {
    if (actividad && isOpen) {
      setNombre(actividad.nombre);
      setUnidad(actividad.unidad);
      setPrecio(String(actividad.precio_referencia_nacional || ''));
      setRangoMin(String(actividad.rango_min || ''));
      setRangoMax(String(actividad.rango_max || ''));
      setError('');
      cerrarPanel();
      setApuItems(
        [...(actividad.catalogo_apu_items ?? [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      );
      setLoadingItems(true);
      obtenerAPUItemsActividad(actividad.id)
        .then(res => {
          if (res.success && res.data) setApuItems(res.data);
        })
        .finally(() => setLoadingItems(false));
    }
  }, [actividad, isOpen]);

  // ── Debounce búsqueda insumos ─────────────────────────────────────────────────
  useEffect(() => {
    if (modoPanel !== 'buscar' || !queryBusqueda.trim()) {
      setResultadosBusqueda([]);
      return;
    }
    const timer = setTimeout(() => {
      setBuscando(true);
      buscarInsumosCatalogo(queryBusqueda.trim(), tipoPanel)
        .then(res => {
          setResultadosBusqueda(res.success && res.data ? res.data : []);
        })
        .finally(() => setBuscando(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [queryBusqueda, tipoPanel, modoPanel]);

  // ── Debounce búsqueda cuadrillas ──────────────────────────────────────────────
  useEffect(() => {
    if (modoPanel !== 'cuadrilla') {
      setResultadosCuadrilla([]);
      return;
    }
    const timer = setTimeout(() => {
      setBuscandoCuadrilla(true);
      buscarCuadrillas(queryCuadrilla.trim())
        .then(res => {
          setResultadosCuadrilla(res.success && res.data ? res.data : []);
        })
        .finally(() => setBuscandoCuadrilla(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [queryCuadrilla, modoPanel]);

  // Focus al input de búsqueda cuando se activa el modo
  useEffect(() => {
    if (modoPanel === 'buscar') {
      setTimeout(() => inputBusquedaRef.current?.focus(), 50);
    }
    if (modoPanel === 'cuadrilla') {
      setTimeout(() => inputCuadrillaRef.current?.focus(), 50);
    }
  }, [modoPanel]);

  // ── Helpers panel ─────────────────────────────────────────────────────────────
  function cerrarPanel() {
    setPanelVisible(false);
    setModoPanel(null);
    setQueryBusqueda('');
    setResultadosBusqueda([]);
    setInsumoAConfirmar(null);
    setBuscando(false);
    setQueryCuadrilla('');
    setResultadosCuadrilla([]);
    setBuscandoCuadrilla(false);
    setCuadrillaExpandida(null);
    setCuadrillaPendiente(null);
  }

  function abrirPanel() {
    setPanelVisible(true);
    setModoPanel(null);
    setQueryBusqueda('');
    setResultadosBusqueda([]);
    setInsumoAConfirmar(null);
    setQueryCuadrilla('');
    setResultadosCuadrilla([]);
    setCuadrillaExpandida(null);
    setCuadrillaPendiente(null);
  }

  function cambiarTipoPanel(nuevoTipo: TipoAPU) {
    setTipoPanel(nuevoTipo);
    setQueryBusqueda('');
    setResultadosBusqueda([]);
    setInsumoAConfirmar(null);
    setQueryCuadrilla('');
    setResultadosCuadrilla([]);
    setCuadrillaExpandida(null);
    setCuadrillaPendiente(null);
    setModoPanel(null);
  }

  // ── Agregar insumo manual ─────────────────────────────────────────────────────
  function agregarApuItemManual(tipo: TipoAPU) {
    const tmpId = `_new_${Date.now()}`;
    const maxOrden = apuItems.reduce((m, i) => Math.max(m, i.orden ?? 0), 0);
    setApuItems(prev => [...prev, {
      id: tmpId,
      catalogo_actividad_id: actividad?.id ?? '',
      tipo,
      nombre: '',
      descripcion: null,
      unidad: tipo === 'mano_obra' ? 'jor' : 'und',
      cantidad: 1,
      precio_unitario: 0,
      orden: maxOrden + 1,
      _dirty: true,
      _nuevo: true,
    }]);
    cerrarPanel();
  }

  // ── Agregar insumo desde búsqueda ─────────────────────────────────────────────
  function seleccionarResultado(insumo: ResultadoBusquedaInsumo) {
    const esDuplicado = apuItems.some(
      i => i.nombre.trim().toLowerCase() === insumo.nombre.trim().toLowerCase()
    );
    if (esDuplicado) {
      setInsumoAConfirmar(insumo);
      return;
    }
    agregarDesdeResultado(insumo);
  }

  function agregarDesdeResultado(insumo: ResultadoBusquedaInsumo) {
    const tmpId = `_new_${Date.now()}`;
    const maxOrden = apuItems.reduce((m, i) => Math.max(m, i.orden ?? 0), 0);
    setApuItems(prev => [...prev, {
      id: tmpId,
      catalogo_actividad_id: actividad?.id ?? '',
      tipo: tipoPanel,
      nombre: insumo.nombre,
      descripcion: null,
      unidad: insumo.unidad,
      cantidad: 1,
      precio_unitario: insumo.precio_unitario,
      orden: maxOrden + 1,
      _dirty: true,
      _nuevo: true,
    }]);
    cerrarPanel();
  }

  // ── Seleccionar cuadrilla ─────────────────────────────────────────────────────
  function seleccionarCuadrilla(cuadrilla: ResultadoBusquedaCuadrilla) {
    const duplicados = cuadrilla.trabajadores
      .filter(t =>
        apuItems.some(i => i.nombre.trim().toLowerCase() === t.nombre.trim().toLowerCase())
      )
      .map(t => t.nombre);

    const nuevos = cuadrilla.trabajadores.filter(
      t => !apuItems.some(i => i.nombre.trim().toLowerCase() === t.nombre.trim().toLowerCase())
    );

    if (duplicados.length > 0) {
      setCuadrillaPendiente({ cuadrilla, duplicados, nuevos });
      return;
    }

    agregarTrabajadoresCuadrilla(cuadrilla, cuadrilla.trabajadores);
  }

  function agregarTrabajadoresCuadrilla(
    cuadrilla: ResultadoBusquedaCuadrilla,
    trabajadores: TrabajadorCuadrilla[]
  ) {
    if (trabajadores.length === 0) {
      toast.info('No hay trabajadores nuevos para agregar.');
      cerrarPanel();
      return;
    }

    const maxOrden = apuItems.reduce((m, i) => Math.max(m, i.orden ?? 0), 0);
    const nuevosItems: APUItemDraft[] = trabajadores.map((t, idx) => ({
      id: `_new_${Date.now()}_${idx}`,
      catalogo_actividad_id: actividad?.id ?? '',
      tipo: 'mano_obra' as TipoAPU,
      nombre: t.nombre,
      descripcion: null,
      unidad: t.unidad,
      cantidad: t.cantidad,
      precio_unitario: t.jornal,
      orden: maxOrden + idx + 1,
      _dirty: true,
      _nuevo: true,
    }));

    setApuItems(prev => [...prev, ...nuevosItems]);
    cerrarPanel();
    toast.success(
      `Se agregaron ${nuevosItems.length} trabajador${nuevosItems.length === 1 ? '' : 'es'} de la cuadrilla "${cuadrilla.nombre}".`
    );
  }

  // ── Cerrar modal ──────────────────────────────────────────────────────────────
  function handleClose() {
    setError('');
    setConfirmEliminar(false);
    setConfirmEliminarApuId(null);
    cerrarPanel();
    onClose();
  }

  // ── Guardar actividad + APU items ─────────────────────────────────────────────
  async function handleGuardarActividad(e: React.FormEvent) {
    e.preventDefault();
    if (!actividad) return;
    setError('');

    if (nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    const itemSinNombre = apuItems.find(i => i._nuevo && !i.nombre.trim());
    if (itemSinNombre) {
      setError('Todos los insumos nuevos deben tener nombre antes de guardar.');
      return;
    }

    setLoading(true);
    try {
      const resAct = await actualizarActividad(actividad.id, {
        nombre,
        unidad,
        precio_referencia_nacional: Number(precio) || 0,
        rango_min: Number(rangoMin) || 0,
        rango_max: Number(rangoMax) || 0,
      });
      if (!resAct.success) { setError(resAct.error ?? 'Error al guardar.'); return; }

      const dirtyItems = apuItems.filter(i => i._dirty && !i._nuevo);
      const newItems   = apuItems.filter(i => i._nuevo);

      const resultados = await Promise.all([
        ...dirtyItems.map(item =>
          actualizarCatalogoAPUItem(item.id, {
            nombre: item.nombre,
            unidad: item.unidad,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            tipo: item.tipo as TipoAPU,
          })
        ),
        ...newItems.map((item, idx) =>
          crearCatalogoAPUItem({
            actividad_id: actividad.id,
            nombre: item.nombre,
            unidad: item.unidad,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            tipo: item.tipo as TipoAPU,
            orden: item.orden ?? (apuItems.filter(i => !i._nuevo).length + idx + 1),
          })
        ),
      ]);

      const fallido = resultados.find(r => !r.success);
      if (fallido) {
        setError(fallido.error ?? 'Error al guardar uno o más insumos APU.');
        return;
      }

      toast.success('Actividad actualizada.');
      router.refresh();
      handleClose();
    } finally {
      setLoading(false);
    }
  }

  // ── Eliminar actividad ────────────────────────────────────────────────────────
  async function handleEliminarActividad() {
    if (!actividad) return;
    setDeleting(true);
    try {
      const res = await eliminarActividad(actividad.id);
      if (!res.success) {
        setConfirmEliminar(false);
        setError(res.error ?? 'No se pudo eliminar.');
      } else {
        toast.success('Actividad eliminada.');
        router.refresh();
        handleClose();
      }
    } finally {
      setDeleting(false);
    }
  }

  // ── APU items — edición inline ────────────────────────────────────────────────
  function updateApuField(id: string, field: keyof CatalogoApuItem, value: unknown) {
    setApuItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value, _dirty: true } : item
    ));
  }

  async function handleEliminarApuItem(id: string) {
    if (id.startsWith('_new_')) {
      setApuItems(prev => prev.filter(i => i.id !== id));
      setConfirmEliminarApuId(null);
      return;
    }
    setSavingApuIds(prev => new Set(prev).add(id));
    try {
      const res = await eliminarCatalogoAPUItem(id);
      if (!res.success) {
        toast.error(res.error ?? 'No se pudo eliminar el ítem.');
      } else {
        setApuItems(prev => prev.filter(i => i.id !== id));
        toast.success('Ítem eliminado.');
        router.refresh();
      }
    } finally {
      setSavingApuIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      setConfirmEliminarApuId(null);
    }
  }

  if (!actividad) return null;

  return (
    <>
      <Modal open={isOpen} onOpenChange={open => { if (!open) handleClose(); }}>
        <ModalContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>Editar actividad</ModalTitle>
          </ModalHeader>

          <form onSubmit={handleGuardarActividad} className="mt-4 space-y-5">
            {/* ── Campos de la actividad ─────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#D95510] bg-[#F8F7F5]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Unidad <span className="text-red-500">*</span>
                </label>
                <select
                  value={UNIDADES_COMUNES.includes(unidad as typeof UNIDADES_COMUNES[number]) ? unidad : '__custom__'}
                  onChange={e => setUnidad(e.target.value === '__custom__' ? unidad : e.target.value)}
                  className="w-full h-9 px-3 text-[13px] border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#D95510] bg-[#F8F7F5]"
                >
                  {UNIDADES_COMUNES.map(u => <option key={u} value={u}>{u}</option>)}
                  <option value="__custom__">Otra...</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Precio ref. (COP)
                </label>
                <input
                  type="number"
                  min="0"
                  value={precio}
                  onChange={e => setPrecio(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#D95510] bg-[#F8F7F5]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">Rango mín. (COP)</label>
                <input
                  type="number"
                  min="0"
                  value={rangoMin}
                  onChange={e => setRangoMin(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#D95510] bg-[#F8F7F5]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">Rango máx. (COP)</label>
                <input
                  type="number"
                  min="0"
                  value={rangoMax}
                  onChange={e => setRangoMax(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#D95510] bg-[#F8F7F5]"
                />
              </div>
            </div>

            {/* ── Tabla de ítems APU ─────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                  Insumos APU de referencia
                </h3>
                {!panelVisible && (
                  <button
                    type="button"
                    onClick={abrirPanel}
                    className="flex items-center gap-1 text-[12px] font-semibold text-[#D95510] hover:text-[#B84510] transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar insumo
                  </button>
                )}
              </div>

              {/* ── Panel de búsqueda / modo de adición ─────────────────── */}
              {panelVisible && (
                <div className="mb-3 rounded-xl border border-[#E5E1D8] bg-[#F8F7F5] p-4 space-y-3">

                  {/* Select de tipo */}
                  <div className="flex items-center gap-3">
                    <label className="text-[11px] font-semibold text-slate-500 shrink-0 w-8">Tipo</label>
                    <select
                      value={tipoPanel}
                      onChange={e => cambiarTipoPanel(e.target.value as TipoAPU)}
                      className="flex-1 h-8 px-2 text-[12px] border border-[#E5E1D8] rounded-lg bg-white focus:outline-none focus:border-[#D95510]"
                    >
                      {Object.entries(TIPO_APU_LABELS_FULL).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  {/* ── Botones de modo ────────────────────────────────── */}
                  {modoPanel === null && (
                    <div className="flex flex-wrap gap-2">
                      {tipoPanel === 'mano_obra' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setModoPanel('buscar')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border border-[#D95510] text-[#D95510] rounded-lg hover:bg-[#D95510] hover:text-white transition-colors"
                          >
                            <Search className="h-3.5 w-3.5" />
                            Buscar trabajador
                          </button>
                          <button
                            type="button"
                            onClick={() => setModoPanel('cuadrilla')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border border-[#D95510] text-[#D95510] rounded-lg hover:bg-[#D95510] hover:text-white transition-colors"
                          >
                            <Users className="h-3.5 w-3.5" />
                            Agregar cuadrilla
                          </button>
                          <button
                            type="button"
                            onClick={() => agregarApuItemManual(tipoPanel)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border border-slate-300 text-slate-600 rounded-lg hover:border-slate-400 hover:bg-white transition-colors"
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                            Agregar manualmente
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setModoPanel('buscar')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border border-[#D95510] text-[#D95510] rounded-lg hover:bg-[#D95510] hover:text-white transition-colors"
                          >
                            <Search className="h-3.5 w-3.5" />
                            Buscar del catálogo
                          </button>
                          <button
                            type="button"
                            onClick={() => agregarApuItemManual(tipoPanel)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border border-slate-300 text-slate-600 rounded-lg hover:border-slate-400 hover:bg-white transition-colors"
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                            Agregar manualmente
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={cerrarPanel}
                        className="px-3 py-1.5 text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {/* ── Modo buscar insumo/trabajador ──────────────────── */}
                  {modoPanel === 'buscar' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                          ref={inputBusquedaRef}
                          type="text"
                          value={queryBusqueda}
                          onChange={e => setQueryBusqueda(e.target.value)}
                          placeholder={
                            tipoPanel === 'mano_obra'
                              ? 'Buscar trabajador por especialidad…'
                              : `Buscar ${TIPO_APU_LABELS_FULL[tipoPanel].toLowerCase()}…`
                          }
                          className="w-full h-8 pl-8 pr-3 text-[12px] border border-[#E5E1D8] rounded-lg bg-white focus:outline-none focus:border-[#D95510]"
                        />
                        {buscando && (
                          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-slate-400" />
                        )}
                      </div>

                      {!buscando && resultadosBusqueda.length > 0 && (
                        <div className="border border-[#E5E1D8] rounded-lg overflow-hidden max-h-44 overflow-y-auto">
                          {resultadosBusqueda.map(r => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => seleccionarResultado(r)}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#FDF9F6] border-b border-slate-100 last:border-0 transition-colors group"
                            >
                              <span className="flex-1 text-[12px] font-medium text-slate-700 truncate group-hover:text-[#D95510]">
                                {r.nombre}
                              </span>
                              <span className="text-[11px] text-slate-400 shrink-0">{r.unidad}</span>
                              <span className="text-[11px] font-semibold text-slate-600 shrink-0 tabular-nums">
                                {formatearCOP(r.precio_unitario)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {!buscando && queryBusqueda.trim().length >= 2 && resultadosBusqueda.length === 0 && (
                        <p className="text-[11px] text-slate-400 px-1">
                          Sin resultados para &ldquo;{queryBusqueda}&rdquo;. Usa &ldquo;Agregar manualmente&rdquo; para escribirlo desde cero.
                        </p>
                      )}

                      {insumoAConfirmar && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-2">
                            <p className="text-[12px] text-amber-800">
                              <span className="font-semibold">&ldquo;{insumoAConfirmar.nombre}&rdquo;</span> ya está en el APU. ¿Deseas agregarlo de todas formas?
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setInsumoAConfirmar(null)}
                                className="px-2.5 py-1 text-[11px] font-semibold border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => { agregarDesdeResultado(insumoAConfirmar); setInsumoAConfirmar(null); }}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                              >
                                Agregar igual
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setModoPanel(null)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <ChevronLeft className="h-3 w-3" />
                          Volver
                        </button>
                        <button
                          type="button"
                          onClick={() => agregarApuItemManual(tipoPanel)}
                          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#D95510] transition-colors"
                        >
                          <PencilLine className="h-3 w-3" />
                          Agregar manualmente
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Modo cuadrilla ─────────────────────────────────── */}
                  {modoPanel === 'cuadrilla' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                          ref={inputCuadrillaRef}
                          type="text"
                          value={queryCuadrilla}
                          onChange={e => setQueryCuadrilla(e.target.value)}
                          placeholder="Buscar cuadrilla…"
                          className="w-full h-8 pl-8 pr-3 text-[12px] border border-[#E5E1D8] rounded-lg bg-white focus:outline-none focus:border-[#D95510]"
                        />
                        {buscandoCuadrilla && (
                          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-slate-400" />
                        )}
                      </div>

                      {/* Lista de cuadrillas */}
                      {!buscandoCuadrilla && resultadosCuadrilla.length > 0 && !cuadrillaPendiente && (
                        <div className="border border-[#E5E1D8] rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                          {resultadosCuadrilla.map(c => (
                            <div key={c.id} className="border-b border-slate-100 last:border-0">
                              <div className="flex items-center gap-1 px-3 py-2 hover:bg-[#FDF9F6] transition-colors">
                                <button
                                  type="button"
                                  onClick={() => seleccionarCuadrilla(c)}
                                  className="flex-1 flex items-center gap-2 text-left group min-w-0"
                                >
                                  <span className="flex-1 text-[12px] font-medium text-slate-700 truncate group-hover:text-[#D95510]">
                                    {c.nombre}
                                  </span>
                                  <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                                    {c.trabajadores.length} trab.
                                  </span>
                                  <span className="text-[11px] font-semibold text-slate-600 tabular-nums shrink-0 whitespace-nowrap">
                                    {formatearCOP(c.costo_total_dia)}/día
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCuadrillaExpandida(prev => prev === c.id ? null : c.id)}
                                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                                  title={cuadrillaExpandida === c.id ? 'Ocultar trabajadores' : 'Ver trabajadores'}
                                >
                                  {cuadrillaExpandida === c.id
                                    ? <ChevronUp className="h-3.5 w-3.5" />
                                    : <ChevronDown className="h-3.5 w-3.5" />
                                  }
                                </button>
                              </div>

                              {cuadrillaExpandida === c.id && c.trabajadores.length > 0 && (
                                <div className="px-4 pb-2 pt-1 bg-slate-50 border-t border-slate-100 space-y-1">
                                  {c.trabajadores.map((t, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[11px]">
                                      <span className="text-slate-600">{t.nombre}</span>
                                      <span className="text-slate-400 tabular-nums">
                                        ×{t.cantidad} — {formatearCOP(t.jornal)}/jor
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Sin resultados */}
                      {!buscandoCuadrilla && !cuadrillaPendiente && resultadosCuadrilla.length === 0 && (
                        <p className="text-[11px] text-slate-400 px-1">
                          {queryCuadrilla.trim()
                            ? `Sin resultados para "${queryCuadrilla}".`
                            : 'Escribe para buscar cuadrillas disponibles.'}
                        </p>
                      )}

                      {/* Confirmación de duplicados de cuadrilla */}
                      {cuadrillaPendiente && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-2">
                            <p className="text-[12px] text-amber-800">
                              <span className="font-semibold">
                                {cuadrillaPendiente.duplicados.length} de {cuadrillaPendiente.cuadrilla.trabajadores.length} trabajadores
                              </span>
                              {' '}ya están en el APU. ¿Agregar solo los nuevos o todos?
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  agregarTrabajadoresCuadrilla(cuadrillaPendiente.cuadrilla, cuadrillaPendiente.nuevos);
                                  setCuadrillaPendiente(null);
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-[#D95510] text-white rounded-lg hover:bg-[#B84510] transition-colors"
                              >
                                Solo los nuevos
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  agregarTrabajadoresCuadrilla(cuadrillaPendiente.cuadrilla, cuadrillaPendiente.cuadrilla.trabajadores);
                                  setCuadrillaPendiente(null);
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                              >
                                Agregar todos
                              </button>
                              <button
                                type="button"
                                onClick={() => setCuadrillaPendiente(null)}
                                className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center pt-1">
                        <button
                          type="button"
                          onClick={() => setModoPanel(null)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <ChevronLeft className="h-3 w-3" />
                          Volver
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tabla ─────────────────────────────────────────────────── */}
              <div className="border border-[#E5E1D8] rounded-xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[100px_1fr_60px_80px_90px_70px_36px] gap-1 bg-slate-50 px-3 py-2 border-b border-[#E5E1D8]">
                  {['Tipo', 'Nombre', 'Unidad', 'Cantidad', 'P. Unitario', 'Subtotal', ''].map((h, i) => (
                    <span key={i} className={`text-[10px] font-bold text-slate-400 uppercase tracking-wide ${i >= 3 ? 'text-right' : ''}`}>
                      {h}
                    </span>
                  ))}
                </div>

                {loadingItems && apuItems.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[12px] text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Cargando insumos…
                  </div>
                ) : apuItems.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[12px] text-slate-400">
                    Sin insumos APU — haz clic en &ldquo;+ Agregar insumo&rdquo; para añadir.
                  </div>
                ) : (
                  apuItems.map(item => {
                    const subtotal = new Decimal(item.cantidad || 0).times(item.precio_unitario || 0);
                    const isSaving = savingApuIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-[100px_1fr_60px_80px_90px_70px_36px] gap-1 items-center px-3 py-1.5 border-b border-slate-100 last:border-0 hover:bg-[#FDF9F6] transition-colors"
                      >
                        {/* Tipo */}
                        <select
                          value={item.tipo}
                          onChange={e => updateApuField(item.id, 'tipo', e.target.value)}
                          className="h-7 px-1 text-[11px] border border-[#E5E1D8] rounded focus:outline-none focus:border-[#D95510] bg-white w-full"
                        >
                          {Object.entries(TIPO_APU_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>

                        {/* Nombre */}
                        <input
                          type="text"
                          value={item.nombre}
                          onChange={e => updateApuField(item.id, 'nombre', e.target.value)}
                          className="h-7 px-2 text-[11px] border border-[#E5E1D8] rounded focus:outline-none focus:border-[#D95510] bg-white w-full"
                          placeholder="Nombre del insumo"
                        />

                        {/* Unidad */}
                        <input
                          type="text"
                          value={item.unidad}
                          onChange={e => updateApuField(item.id, 'unidad', e.target.value)}
                          className="h-7 px-1 text-[11px] border border-[#E5E1D8] rounded focus:outline-none focus:border-[#D95510] bg-white w-full text-center"
                        />

                        {/* Cantidad */}
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={item.cantidad}
                          onChange={e => updateApuField(item.id, 'cantidad', Number(e.target.value))}
                          className="h-7 px-1 text-[11px] border border-[#E5E1D8] rounded focus:outline-none focus:border-[#D95510] bg-white w-full text-right"
                        />

                        {/* Precio unitario */}
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.precio_unitario}
                          onChange={e => updateApuField(item.id, 'precio_unitario', Number(e.target.value))}
                          className="h-7 px-1 text-[11px] border border-[#E5E1D8] rounded focus:outline-none focus:border-[#D95510] bg-white w-full text-right"
                        />

                        {/* Subtotal (solo lectura) */}
                        <span className="text-[11px] font-semibold text-slate-700 text-right tabular-nums pr-1">
                          {formatearCOP(subtotal.toNumber())}
                        </span>

                        {/* Eliminar */}
                        <div className="flex justify-center">
                          {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmEliminarApuId(item.id)}
                              className="h-6 w-6 flex items-center justify-center rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Eliminar ítem"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5E1D8]">
              <button
                type="button"
                onClick={() => setConfirmEliminar(true)}
                disabled={loading || deleting}
                className="flex items-center gap-1.5 text-[12px] text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar actividad
              </button>

              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" loading={loading} disabled={nombre.trim().length < 2}>
                  Guardar cambios
                </Button>
              </div>
            </div>
          </form>
        </ModalContent>
      </Modal>

      {/* Confirmar eliminar actividad */}
      <ConfirmDialog
        open={confirmEliminar}
        title="¿Eliminar esta actividad?"
        description={`Se eliminará "${actividad.nombre}" y todos sus ítems APU. Esta acción no se puede deshacer.`}
        confirmLabel={deleting ? 'Eliminando…' : 'Sí, eliminar'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleEliminarActividad}
        onCancel={() => setConfirmEliminar(false)}
      />

      {/* Confirmar eliminar ítem APU */}
      <ConfirmDialog
        open={confirmEliminarApuId !== null}
        title="¿Eliminar este ítem APU?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => confirmEliminarApuId && handleEliminarApuItem(confirmEliminarApuId)}
        onCancel={() => setConfirmEliminarApuId(null)}
      />
    </>
  );
}
