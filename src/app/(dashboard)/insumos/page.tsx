'use client';

import {
  useState, useEffect, useMemo, useTransition, useCallback, useRef,
} from 'react';
import {
  Package, Drill, ShieldCheck,
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  RotateCcw, Plus, Trash2, Edit2,
  Loader2, Info, X, Save, UserPlus, Minus, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { SkeletonTable } from '@/components/shared/Skeleton';
import { formatearCOP } from '@/lib/utils/formato-cop';
import {
  getMaterialesConPrecio, upsertMaterialPrecio, resetMaterialPrecio,
  getEquiposConPrecio, upsertEquipoPrecio, resetEquipoPrecio,
  getLabor,
} from '@/actions/insumos';
import {
  getCuadrillas, getTrabajadores, crearCuadrillaPersonalizada, deleteCuadrilla,
  updateCuadrilla, importarLaborComoTrabajador, agregarTrabajadorACuadrilla,
} from '@/actions/cuadrillas';
import { ModalTrabajador } from '@/components/mano-obra/ModalTrabajador';
import type { TrabajadorReferencia } from '@/actions/mano-obra';
import type { MaterialConPrecio, EquipoConPrecio } from '@/types';
import { cn } from '@/lib/utils';

// ── Tipos ──────────────────────────────────────────────────────────────────────

type TabId = 'material' | 'equipment' | 'crews';
type SortDir = 'asc' | 'desc';
type MatColKey = 'nombre' | 'categoria' | 'unidad' | 'precio_usuario';
type EqColKey = 'nombre' | 'tipo' | 'precio_semanal' | 'precio_mensual' | 'precio_usuario';

interface TrabajadorSeleccionado {
  id: string;
  especialidad: string;
  categoria: string;
  jornal_base: number;
  factor_prestacional: number;
  cantidad: number;
}

// ── Helpers de ordenamiento ───────────────────────────────────────────────────

function SortIcon<T extends string>({ col, sortCol, sortDir }: { col: T; sortCol: T; sortDir: SortDir }) {
  if (col !== sortCol) return <ChevronsUpDown className="h-3.5 w-3.5 text-white/40" />;
  return sortDir === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5 text-[#E8956A]" />
    : <ChevronDown className="h-3.5 w-3.5 text-[#E8956A]" />;
}

function toggleSort<T>(col: T, current: T, dir: SortDir, set: (c: T, d: SortDir) => void) {
  if (col === current) set(col, dir === 'asc' ? 'desc' : 'asc');
  else set(col, 'asc');
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function InsumosPage() {
  const [tab, setTab] = useState<TabId>('material');

  // Materiales
  const [materiales, setMateriales] = useState<MaterialConPrecio[]>([]);
  const [loadingMat, setLoadingMat] = useState(true);
  const [searchMat, setSearchMat] = useState('');
  const [sortMatCol, setSortMatCol] = useState<MatColKey>('nombre');
  const [sortMatDir, setSortMatDir] = useState<SortDir>('asc');
  const [categoriaMat, setCategoriaMat] = useState<string | null>(null);
  const [, startMatTransition] = useTransition();

  // Equipos
  const [equipos, setEquipos] = useState<EquipoConPrecio[]>([]);
  const [loadingEq, setLoadingEq] = useState(true);
  const [searchEq, setSearchEq] = useState('');
  const [sortEqCol, setSortEqCol] = useState<EqColKey>('nombre');
  const [sortEqDir, setSortEqDir] = useState<SortDir>('asc');
  const [, startEqTransition] = useTransition();

  // Cuadrillas
  const [cuadrillas, setCuadrillas] = useState<any[]>([]);
  const [loadingCrews, setLoadingCrews] = useState(true);
  const [searchCrews, setSearchCrews] = useState('');
  const [showCuadrillaModal, setShowCuadrillaModal] = useState(false);
  const [editCuadrilla, setEditCuadrilla] = useState<any | null>(null);
  const [cuadrillaModalKey, setCuadrillaModalKey] = useState(0);
  const [trabajadoresDisponibles, setTrabajadoresDisponibles] = useState<any[]>([]);
  const [loadingTrabajadores, setLoadingTrabajadores] = useState(false);
  const [trabajadoresSeleccionados, setTrabajadoresSeleccionados] = useState<TrabajadorSeleccionado[]>([]);
  const [trabajadorElegido, setTrabajadorElegido] = useState('');
  const [cantidadTrabajador, setCantidadTrabajador] = useState(1);
  const [savingCuadrilla, setSavingCuadrilla] = useState(false);
  const [cuadrillaError, setCuadrillaError] = useState('');
  const [deletingCuadrillaId, setDeletingCuadrillaId] = useState<string | null>(null);
  const [rendimientoNormal, setRendimientoNormal] = useState('');
  const [rendimientoUnidad, setRendimientoUnidad] = useState('m²');
  const [rendimientoFuente, setRendimientoFuente] = useState('SIPO Colombia 2026');
  const [showCrearTrabajador, setShowCrearTrabajador] = useState(false);
  const [quickAdd, setQuickAdd] = useState<{ cuadrillaId: string; cuadrillaName: string; existingIds: string[] } | null>(null);
  const [quickWorkerId, setQuickWorkerId] = useState('');
  const [quickCantidad, setQuickCantidad] = useState(1);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState('');
  const [laborCatalog, setLaborCatalog] = useState<any[]>([]);
  const [busquedaLabor, setBusquedaLabor] = useState('');
  const [showLaborImport, setShowLaborImport] = useState(false);
  const [importandoLaborId, setImportandoLaborId] = useState<string | null>(null);
  const cuadrillaFormRef = useRef<HTMLFormElement>(null);

  // ── Carga inicial por pestaña ──────────────────────────────────────────────

  useEffect(() => {
    if (tab === 'material' && materiales.length === 0) {
      setLoadingMat(true);
      getMaterialesConPrecio().then((d) => { setMateriales(d); setLoadingMat(false); });
    }
    if (tab === 'equipment' && equipos.length === 0) {
      setLoadingEq(true);
      getEquiposConPrecio().then((d) => { setEquipos(d); setLoadingEq(false); });
    }
    if (tab === 'crews') {
      setLoadingCrews(true);
      getCuadrillas().then((d) => { setCuadrillas(d || []); setLoadingCrews(false); });
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Categorías de materiales ───────────────────────────────────────────────

  const categoriasMat = useMemo(
    () => Array.from(new Set(materiales.map((m) => m.categoria).filter(Boolean))).sort(),
    [materiales]
  );

  const matPersonalizados = useMemo(() => materiales.filter((m) => m.precio_usuario !== null).length, [materiales]);
  const eqPersonalizados  = useMemo(() => equipos.filter((e) => e.precio_usuario !== null).length, [equipos]);

  // ── Filas filtradas/ordenadas: Materiales ─────────────────────────────────

  const filasMat = useMemo(() => {
    let list = materiales;
    if (categoriaMat) list = list.filter((m) => m.categoria === categoriaMat);
    if (searchMat.trim()) {
      const q = searchMat.toLowerCase();
      list = list.filter((m) => m.nombre.toLowerCase().includes(q) || m.categoria.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortMatCol === 'precio_usuario') {
        va = a.precio_usuario ?? a.precio_referencia;
        vb = b.precio_usuario ?? b.precio_referencia;
      } else {
        va = a[sortMatCol as keyof MaterialConPrecio] as string | number;
        vb = b[sortMatCol as keyof MaterialConPrecio] as string | number;
      }
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string, 'es-CO') : (va as number) - (vb as number);
      return sortMatDir === 'asc' ? cmp : -cmp;
    });
  }, [materiales, searchMat, categoriaMat, sortMatCol, sortMatDir]);

  // ── Filas filtradas/ordenadas: Equipos ───────────────────────────────────

  const filasEq = useMemo(() => {
    let list = equipos;
    if (searchEq.trim()) {
      const q = searchEq.toLowerCase();
      list = list.filter((e) => e.nombre.toLowerCase().includes(q) || e.tipo.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortEqCol === 'precio_usuario') {
        va = a.precio_usuario ?? a.precio_diario;
        vb = b.precio_usuario ?? b.precio_diario;
      } else {
        va = a[sortEqCol as keyof EquipoConPrecio] as string | number;
        vb = b[sortEqCol as keyof EquipoConPrecio] as string | number;
      }
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string, 'es-CO') : (va as number) - (vb as number);
      return sortEqDir === 'asc' ? cmp : -cmp;
    });
  }, [equipos, searchEq, sortEqCol, sortEqDir]);

  // ── Handlers: precios de Materiales ──────────────────────────────────────

  const handleMatBlur = useCallback((mat: MaterialConPrecio, rawValue: string) => {
    const num = parseFloat(rawValue);
    if (rawValue === '' || isNaN(num)) {
      if (mat.precio_usuario !== null) {
        startMatTransition(async () => {
          await resetMaterialPrecio(mat.id);
          setMateriales((prev) => prev.map((m) => m.id === mat.id ? { ...m, precio_usuario: null } : m));
        });
      }
      return;
    }
    if (num === mat.precio_usuario) return;
    startMatTransition(async () => {
      await upsertMaterialPrecio(mat.id, num);
      setMateriales((prev) => prev.map((m) => m.id === mat.id ? { ...m, precio_usuario: num } : m));
    });
  }, [startMatTransition]);

  const handleMatReset = useCallback((mat: MaterialConPrecio) => {
    startMatTransition(async () => {
      await resetMaterialPrecio(mat.id);
      setMateriales((prev) => prev.map((m) => m.id === mat.id ? { ...m, precio_usuario: null } : m));
    });
  }, [startMatTransition]);

  // ── Handlers: precios de Equipos ─────────────────────────────────────────

  const handleEqBlur = useCallback((eq: EquipoConPrecio, rawValue: string) => {
    const num = parseFloat(rawValue);
    if (rawValue === '' || isNaN(num)) {
      if (eq.precio_usuario !== null) {
        startEqTransition(async () => {
          await resetEquipoPrecio(eq.id);
          setEquipos((prev) => prev.map((e) => e.id === eq.id ? { ...e, precio_usuario: null } : e));
        });
      }
      return;
    }
    if (num === eq.precio_usuario) return;
    startEqTransition(async () => {
      await upsertEquipoPrecio(eq.id, num);
      setEquipos((prev) => prev.map((e) => e.id === eq.id ? { ...e, precio_usuario: num } : e));
    });
  }, [startEqTransition]);

  const handleEqReset = useCallback((eq: EquipoConPrecio) => {
    startEqTransition(async () => {
      await resetEquipoPrecio(eq.id);
      setEquipos((prev) => prev.map((e) => e.id === eq.id ? { ...e, precio_usuario: null } : e));
    });
  }, [startEqTransition]);

  // ── Handlers: Cuadrillas ──────────────────────────────────────────────────

  async function loadTrabajadoresIfNeeded() {
    if (trabajadoresDisponibles.length === 0) {
      setLoadingTrabajadores(true);
      const list = await getTrabajadores();
      const byEsp = new Map<string, any>();
      for (const t of list) {
        const key = (t.especialidad || '').toLowerCase();
        const prev = byEsp.get(key);
        if (!prev || t.user_id !== null) byEsp.set(key, t);
      }
      setTrabajadoresDisponibles(Array.from(byEsp.values()));
      setLoadingTrabajadores(false);
    }
    if (laborCatalog.length === 0) {
      getLabor().then((l) => setLaborCatalog(l || []));
    }
  }

  async function openEditCuadrilla(cuadrilla: any) {
    setEditCuadrilla(cuadrilla);
    setCuadrillaError('');
    setTrabajadoresSeleccionados(
      (cuadrilla.trabajadores || []).map((t: any) => ({
        id: t.id, especialidad: t.especialidad, categoria: t.categoria,
        jornal_base: t.jornal_base, factor_prestacional: t.factor_prestacional ?? 1.5988, cantidad: t.cantidad,
      }))
    );
    setTrabajadorElegido('');
    setCantidadTrabajador(1);
    setShowLaborImport(false);
    setBusquedaLabor('');
    const rend = cuadrilla.rendimientos?.[0];
    setRendimientoNormal(rend ? String(rend.rendimiento_normal) : '');
    setRendimientoUnidad(rend?.unidad ?? 'm²');
    setRendimientoFuente(rend?.fuente ?? 'SIPO Colombia 2026');
    setCuadrillaModalKey((k) => k + 1);
    setShowCuadrillaModal(true);
    await loadTrabajadoresIfNeeded();
  }

  async function openCreateCuadrilla() {
    setEditCuadrilla(null);
    setCuadrillaError('');
    setTrabajadoresSeleccionados([]);
    setTrabajadorElegido('');
    setCantidadTrabajador(1);
    setShowLaborImport(false);
    setBusquedaLabor('');
    setRendimientoNormal('');
    setRendimientoUnidad('m²');
    setRendimientoFuente('SIPO Colombia 2026');
    setCuadrillaModalKey((k) => k + 1);
    setShowCuadrillaModal(true);
    await loadTrabajadoresIfNeeded();
  }

  async function handleImportarLabor(labor: any) {
    setImportandoLaborId(labor.id);
    setCuadrillaError('');
    const result = await importarLaborComoTrabajador(labor.id);
    setImportandoLaborId(null);
    if (!result.success || !result.trabajador) { setCuadrillaError(result.error || 'Error al importar'); return; }
    const t = result.trabajador;
    if (!trabajadoresDisponibles.some((td) => td.id === t.id)) setTrabajadoresDisponibles((prev) => [...prev, t]);
    if (!trabajadoresSeleccionados.some((ts) => ts.id === t.id)) {
      setTrabajadoresSeleccionados((prev) => [...prev, {
        id: t.id, especialidad: t.especialidad, categoria: t.categoria,
        jornal_base: t.jornal_base, factor_prestacional: t.factor_prestacional ?? 1.5988, cantidad: 1,
      }]);
    }
  }

  function closeCuadrillaModal() { setShowCuadrillaModal(false); setEditCuadrilla(null); setCuadrillaError(''); }

  function handleTrabajadorCreado(t: TrabajadorReferencia) {
    if (!trabajadoresDisponibles.some((td) => td.id === t.id)) setTrabajadoresDisponibles((prev) => [...prev, t]);
    setTrabajadorElegido(t.id);
    setShowCrearTrabajador(false);
  }

  function agregarTrabajador() {
    const t = trabajadoresDisponibles.find((w) => w.id === trabajadorElegido);
    if (!t || trabajadoresSeleccionados.some((s) => s.id === t.id)) return;
    setTrabajadoresSeleccionados((prev) => [...prev, {
      id: t.id, especialidad: t.especialidad, categoria: t.categoria,
      jornal_base: t.jornal_base, factor_prestacional: t.factor_prestacional ?? 1.5988, cantidad: cantidadTrabajador,
    }]);
    setTrabajadorElegido('');
    setCantidadTrabajador(1);
  }

  function quitarTrabajador(id: string) {
    setTrabajadoresSeleccionados((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleCuadrillaSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    if (trabajadoresSeleccionados.length === 0) { setCuadrillaError('Agrega al menos un trabajador'); return; }
    const fd = new FormData(e.currentTarget);
    setSavingCuadrilla(true);
    setCuadrillaError('');
    const payload = {
      nombre: fd.get('nombre') as string,
      descripcion: fd.get('descripcion') as string || undefined,
      categoria_actividad: fd.get('categoria_actividad') as string || undefined,
      trabajadores: trabajadoresSeleccionados.map((t) => ({ trabajador_id: t.id, cantidad: t.cantidad })),
      rendimiento_normal: rendimientoNormal ? Number(rendimientoNormal) : undefined,
      rendimiento_unidad: rendimientoNormal ? rendimientoUnidad : undefined,
      rendimiento_fuente: rendimientoNormal ? rendimientoFuente || 'SIPO Colombia 2026' : undefined,
    };
    const result = editCuadrilla ? await updateCuadrilla(editCuadrilla.id, payload) : await crearCuadrillaPersonalizada(payload);
    setSavingCuadrilla(false);
    if (!result.success) { setCuadrillaError(result.error || 'Error al guardar'); return; }
    closeCuadrillaModal();
    setLoadingCrews(true);
    getCuadrillas().then((d) => { setCuadrillas(d || []); setLoadingCrews(false); });
  }

  async function handleDeleteCuadrilla(id: string) {
    if (!confirm('¿Eliminar esta cuadrilla personalizada?')) return;
    setDeletingCuadrillaId(id);
    const result = await deleteCuadrilla(id);
    setDeletingCuadrillaId(null);
    if (!result.success) { alert(result.error || 'Error al eliminar'); return; }
    setCuadrillas((prev) => prev.filter((c) => c.id !== id));
  }

  async function openQuickAdd(cuadrilla: any) {
    const existingIds = (cuadrilla.trabajadores || []).map((t: any) => t.id);
    setQuickAdd({ cuadrillaId: cuadrilla.id, cuadrillaName: cuadrilla.nombre, existingIds });
    setQuickWorkerId('');
    setQuickCantidad(1);
    setQuickError('');
    await loadTrabajadoresIfNeeded();
  }

  async function handleQuickAdd() {
    if (!quickAdd || !quickWorkerId) return;
    setQuickLoading(true);
    setQuickError('');
    const res = await agregarTrabajadorACuadrilla(quickAdd.cuadrillaId, quickWorkerId, quickCantidad);
    setQuickLoading(false);
    if (!res.success) { setQuickError(res.error || 'Error al agregar'); return; }
    setQuickAdd(null);
    setLoadingCrews(true);
    getCuadrillas().then((d) => { setCuadrillas(d || []); setLoadingCrews(false); });
  }

  function costoJornadaCuadrilla(cuadrilla: any): number {
    return (cuadrilla.trabajadores || []).reduce(
      (s: number, t: any) => s + t.jornal_base * t.factor_prestacional * t.cantidad, 0
    );
  }

  const filteredCrews = useMemo(() => {
    if (!searchCrews.trim()) return cuadrillas;
    const q = searchCrews.toLowerCase();
    return cuadrillas.filter((c) => c.nombre.toLowerCase().includes(q));
  }, [cuadrillas, searchCrews]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-burn-orange/10">
            <Package className="h-5 w-5 text-burn-orange" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-charcoal">Catálogo de Insumos</h1>
            <p className="text-sm text-steel-mid">
              Precios de referencia Colombia 2026 · Personaliza tus precios sin alterar el catálogo
            </p>
          </div>
        </div>
        {tab === 'crews' && (
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreateCuadrilla}>
            Nueva cuadrilla
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-concrete overflow-x-auto">
        {([
          { id: 'material',  label: 'Materiales', icon: Package,     badge: matPersonalizados > 0 ? `${matPersonalizados} propios` : null },
          { id: 'equipment', label: 'Equipos',     icon: Drill,       badge: eqPersonalizados > 0 ? `${eqPersonalizados} propios` : null },
          { id: 'crews',     label: 'Cuadrillas',  icon: ShieldCheck, badge: null },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative whitespace-nowrap',
              tab === t.id
                ? 'text-burn-orange after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-burn-orange after:rounded-t-full'
                : 'text-steel-mid hover:text-charcoal'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.badge && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-burn-orange/10 text-burn-orange">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Aviso cuadrillas */}
      {tab === 'crews' && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800 font-medium">
            Las cuadrillas agrupan trabajadores. Para editar tarifas salariales ve a Tarifas Salariales.
          </p>
          <Link
            href="/mano-obra"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            Gestionar trabajadores <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ── PESTAÑA MATERIALES ── */}
      {tab === 'material' && (
        <Card>
          {/* Nota informativa */}
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Edita el precio de cualquier material para marcarlo como <strong>Propio</strong>. El Panel APU usará tu precio en lugar del de referencia.
            </p>
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b border-concrete space-y-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-steel-mid pointer-events-none" />
              <Input
                placeholder="Buscar por nombre o categoría…"
                value={searchMat}
                onChange={(e) => setSearchMat(e.target.value)}
                className="pl-9"
              />
            </div>
            {categoriasMat.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-steel-mid font-medium shrink-0">Categoría:</span>
                <button
                  onClick={() => setCategoriaMat(null)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer',
                    categoriaMat === null ? 'bg-burn-orange text-white' : 'bg-sand text-steel-mid hover:bg-concrete/60 hover:text-charcoal'
                  )}
                >
                  Todas
                </button>
                {categoriasMat.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaMat((prev) => prev === cat ? null : cat)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer',
                      categoriaMat === cat ? 'bg-burn-orange text-white' : 'bg-sand text-steel-mid hover:bg-concrete/60 hover:text-charcoal'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadingMat ? (
            <div className="p-4"><SkeletonTable rows={8} cols={6} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1A2535] border-b border-[#2A3B50]">
                    {([
                      { key: 'nombre',       label: 'Nombre',    align: 'left'  },
                      { key: 'categoria',    label: 'Categoría', align: 'left'  },
                      { key: 'unidad',       label: 'Unidad',    align: 'left'  },
                      { key: 'precio_usuario', label: 'Precio',  align: 'right' },
                    ] as const).map((col) => (
                      <th
                        key={col.key}
                        onClick={() => toggleSort(col.key as MatColKey, sortMatCol, sortMatDir, (c, d) => { setSortMatCol(c); setSortMatDir(d); })}
                        className={cn(
                          'px-4 py-3 font-medium text-white/60 cursor-pointer select-none hover:text-white transition-colors whitespace-nowrap',
                          col.align === 'right' ? 'text-right' : 'text-left'
                        )}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {col.align === 'right' && <SortIcon col={col.key as MatColKey} sortCol={sortMatCol} sortDir={sortMatDir} />}
                          {col.label}
                          {col.align === 'left' && <SortIcon col={col.key as MatColKey} sortCol={sortMatCol} sortDir={sortMatDir} />}
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 w-10 bg-[#1A2535]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-concrete/50">
                  {filasMat.map((mat) => (
                    <MatRow
                      key={mat.id}
                      mat={mat}
                      onBlur={handleMatBlur}
                      onReset={handleMatReset}
                    />
                  ))}
                </tbody>
              </table>
              {filasMat.length === 0 && (
                <div className="py-16 text-center text-sm text-steel-mid">
                  No hay materiales que coincidan con los filtros.
                </div>
              )}
              <div className="px-4 py-2.5 border-t border-concrete bg-sand/20 text-xs text-steel-mid flex justify-between">
                <span>{filasMat.length} materiales</span>
                <span>{matPersonalizados} con precio personalizado</span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── PESTAÑA EQUIPOS ── */}
      {tab === 'equipment' && (
        <Card>
          {/* Nota informativa */}
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Edita el <strong>Precio diario</strong> para marcarlo como <strong>Propio</strong>. Los precios semanal y mensual son solo informativos.
            </p>
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b border-concrete">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-steel-mid pointer-events-none" />
              <Input
                placeholder="Buscar por nombre o tipo…"
                value={searchEq}
                onChange={(e) => setSearchEq(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loadingEq ? (
            <div className="p-4"><SkeletonTable rows={8} cols={7} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1A2535] border-b border-[#2A3B50]">
                    {([
                      { key: 'nombre',         label: 'Nombre',       align: 'left'  },
                      { key: 'tipo',           label: 'Tipo',         align: 'left'  },
                      { key: 'precio_usuario', label: 'Precio diario',align: 'right' },
                      { key: 'precio_semanal', label: 'Ref. semanal', align: 'right' },
                      { key: 'precio_mensual', label: 'Ref. mensual', align: 'right' },
                    ] as const).map((col) => (
                      <th
                        key={col.key}
                        onClick={() => toggleSort(col.key as EqColKey, sortEqCol, sortEqDir, (c, d) => { setSortEqCol(c); setSortEqDir(d); })}
                        className={cn(
                          'px-4 py-3 font-medium text-white/60 cursor-pointer select-none hover:text-white transition-colors whitespace-nowrap',
                          col.align === 'right' ? 'text-right' : 'text-left'
                        )}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {col.align === 'right' && <SortIcon col={col.key as EqColKey} sortCol={sortEqCol} sortDir={sortEqDir} />}
                          {col.label}
                          {col.align === 'left' && <SortIcon col={col.key as EqColKey} sortCol={sortEqCol} sortDir={sortEqDir} />}
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 w-10 bg-[#1A2535]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-concrete/50">
                  {filasEq.map((eq) => (
                    <EqRow
                      key={eq.id}
                      eq={eq}
                      onBlur={handleEqBlur}
                      onReset={handleEqReset}
                    />
                  ))}
                </tbody>
              </table>
              {filasEq.length === 0 && (
                <div className="py-16 text-center text-sm text-steel-mid">
                  No hay equipos que coincidan con la búsqueda.
                </div>
              )}
              <div className="px-4 py-2.5 border-t border-concrete bg-sand/20 text-xs text-steel-mid flex justify-between">
                <span>{filasEq.length} equipos</span>
                <span>{eqPersonalizados} con precio personalizado</span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── PESTAÑA CUADRILLAS ── */}
      {tab === 'crews' && (
        <Card>
          <div className="p-4 border-b border-concrete">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-steel-mid pointer-events-none" />
              <Input
                placeholder="Buscar cuadrilla…"
                value={searchCrews}
                onChange={(e) => setSearchCrews(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loadingCrews ? (
            <div className="p-4"><SkeletonTable rows={6} cols={4} /></div>
          ) : filteredCrews.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <ShieldCheck className="h-10 w-10 text-concrete" />
              <p className="text-sm font-medium text-charcoal">
                {searchCrews ? 'Sin resultados' : 'No hay cuadrillas disponibles'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1A2535] border-b border-[#2A3B50]">
                    <th className="px-4 py-3 text-left font-medium text-white/60">Cuadrilla</th>
                    <th className="px-4 py-3 text-left font-medium text-white/60">Trabajadores</th>
                    <th className="px-4 py-3 text-left font-medium text-white/60">Rendimiento</th>
                    <th className="px-4 py-3 text-right font-medium text-white/60">Costo / jornada</th>
                    <th className="px-4 py-3 w-24 bg-[#1A2535]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-concrete/50">
                  {filteredCrews.map((item) => (
                    <tr key={item.id} className="hover:bg-sand/20 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="font-medium text-charcoal">{item.nombre}</p>
                        <p className="text-xs text-steel-mid">
                          {item.categoria_actividad || 'Sin categoría'} · {item.es_sistema ? 'Sistema' : 'Personalizada'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(item.trabajadores || []).slice(0, 3).map((t: any, i: number) => (
                            <span key={i} className="text-[10px] font-semibold text-steel-mid bg-sand px-2 py-0.5 rounded uppercase">
                              {t.cantidad > 1 ? `${t.cantidad}×` : ''}{t.especialidad}
                            </span>
                          ))}
                          {(item.trabajadores || []).length > 3 && (
                            <span className="text-[10px] text-steel-mid bg-sand px-2 py-0.5 rounded">
                              +{item.trabajadores.length - 3} más
                            </span>
                          )}
                          {(item.trabajadores || []).length === 0 && (
                            <span className="text-xs text-steel-mid">Sin trabajadores</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-steel-mid text-xs">
                        {item.rendimientos?.length > 0
                          ? `${item.rendimientos[0].rendimiento_normal} ${item.rendimientos[0].unidad}/día`
                          : '—'
                        }
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-burn-orange" style={{ fontFamily: 'var(--font-mono)' }}>
                        {formatearCOP(costoJornadaCuadrilla(item))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!item.es_sistema ? (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openQuickAdd(item)} className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-burn-orange hover:bg-burn-orange/10 transition-colors cursor-pointer" title="Agregar trabajador">
                              <UserPlus className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => openEditCuadrilla(item)} className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-charcoal hover:bg-sand transition-colors cursor-pointer" title="Editar">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteCuadrilla(item.id)} disabled={deletingCuadrillaId === item.id} className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40" title="Eliminar">
                              {deletingCuadrillaId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-concrete uppercase tracking-tighter">Sistema</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── MODAL: Quick-add trabajador ── */}
      {quickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setQuickAdd(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-concrete bg-sand">
              <div>
                <h2 className="text-sm font-bold text-charcoal">Agregar trabajador</h2>
                <p className="text-xs text-steel-mid mt-0.5">{quickAdd.cuadrillaName}</p>
              </div>
              <button onClick={() => setQuickAdd(null)} className="p-1.5 hover:bg-concrete/40 rounded-lg transition-colors"><X className="h-4 w-4 text-steel-mid" /></button>
            </div>
            <div className="p-6 space-y-4">
              {loadingTrabajadores ? (
                <div className="flex items-center gap-2 text-sm text-steel-mid"><Loader2 className="h-4 w-4 animate-spin text-burn-orange" /> Cargando…</div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-steel-mid uppercase tracking-wider mb-1.5">Trabajador</label>
                    <select value={quickWorkerId} onChange={(e) => setQuickWorkerId(e.target.value)} className="w-full px-3 py-2.5 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none bg-white">
                      <option value="">Selecciona un trabajador…</option>
                      {trabajadoresDisponibles.filter((t) => !quickAdd.existingIds.includes(t.id)).map((t) => (
                        <option key={t.id} value={t.id}>{t.especialidad} · {t.categoria} · {formatearCOP(t.jornal_base)}/día</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-steel-mid uppercase tracking-wider mb-1.5">Cantidad</label>
                    <input type="number" value={quickCantidad} onChange={(e) => setQuickCantidad(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={20} className="w-full px-3 py-2.5 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none" />
                  </div>
                </>
              )}
              {quickError && <p className="text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{quickError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setQuickAdd(null)} className="flex-1 px-4 py-2.5 border border-concrete rounded-lg text-sm font-semibold text-steel-mid hover:bg-sand transition-colors">Cancelar</button>
                <button type="button" onClick={handleQuickAdd} disabled={!quickWorkerId || quickLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-burn-orange text-white rounded-lg text-sm font-semibold hover:bg-burn-orange/90 transition-colors disabled:opacity-60">
                  {quickLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Agregando…</> : <><UserPlus className="h-4 w-4" /> Agregar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Cuadrilla ── */}
      {showCuadrillaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCuadrillaModal} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-concrete bg-sand shrink-0">
              <h2 className="text-sm font-bold text-charcoal">{editCuadrilla ? 'Editar cuadrilla' : 'Nueva cuadrilla personalizada'}</h2>
              <button onClick={closeCuadrillaModal} className="p-1.5 hover:bg-concrete/40 rounded-lg transition-colors"><X className="h-4 w-4 text-steel-mid" /></button>
            </div>
            <form key={cuadrillaModalKey} ref={cuadrillaFormRef} onSubmit={handleCuadrillaSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-steel-mid uppercase tracking-wider mb-1.5">Nombre *</label>
                  <input name="nombre" required maxLength={150} defaultValue={editCuadrilla?.nombre ?? ''} placeholder="Ej: Cuadrilla Mampostería" className="w-full px-3 py-2.5 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-steel-mid uppercase tracking-wider mb-1.5">Categoría</label>
                  <input name="categoria_actividad" maxLength={100} defaultValue={editCuadrilla?.categoria_actividad ?? ''} placeholder="Ej: Mampostería" className="w-full px-3 py-2.5 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-steel-mid uppercase tracking-wider mb-1.5">Descripción</label>
                  <input name="descripcion" maxLength={300} defaultValue={editCuadrilla?.descripcion ?? ''} placeholder="Opcional" className="w-full px-3 py-2.5 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-steel-mid uppercase tracking-wider">Trabajadores *</label>
                {loadingTrabajadores ? (
                  <div className="flex items-center gap-2 text-sm text-steel-mid"><Loader2 className="h-4 w-4 animate-spin text-burn-orange" /> Cargando…</div>
                ) : (
                  <div className="space-y-2">
                    <select value={trabajadorElegido} onChange={(e) => setTrabajadorElegido(e.target.value)} className="w-full px-3 py-2 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none bg-white">
                      <option value="">Selecciona un trabajador…</option>
                      {trabajadoresDisponibles.map((t) => (
                        <option key={t.id} value={t.id} disabled={trabajadoresSeleccionados.some((s) => s.id === t.id)}>
                          {trabajadoresSeleccionados.some((s) => s.id === t.id) ? '✓ ' : ''}{t.especialidad} · {t.categoria} · {formatearCOP(t.jornal_base)}/día
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-steel-mid font-semibold shrink-0">Cantidad:</span>
                      <input type="number" value={cantidadTrabajador} onChange={(e) => setCantidadTrabajador(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={20} className="w-16 px-2 py-2 border border-concrete rounded-lg text-sm text-center focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none" />
                      <button type="button" onClick={agregarTrabajador} disabled={!trabajadorElegido} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-burn-orange text-white rounded-lg text-sm font-semibold hover:bg-burn-orange/90 disabled:opacity-40 transition-colors">
                        <UserPlus className="h-4 w-4" /> Agregar
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-t border-concrete pt-3 space-y-2">
                  <button type="button" onClick={() => setShowCrearTrabajador(true)} className="flex items-center gap-1.5 text-xs font-semibold text-burn-orange hover:text-burn-orange/80 transition-colors">
                    <UserPlus className="h-3.5 w-3.5" /> ¿No encuentras el trabajador? + Crear nuevo
                  </button>
                  <button type="button" onClick={() => setShowLaborImport((p) => !p)} className="flex items-center gap-1.5 text-xs text-steel-mid hover:text-charcoal transition-colors">
                    {showLaborImport ? 'Ocultar catálogo M.O.' : 'Importar desde catálogo de Mano de Obra'}
                  </button>
                  {showLaborImport && (
                    <div className="mt-3 space-y-2">
                      <input placeholder="Buscar en catálogo…" value={busquedaLabor} onChange={(e) => setBusquedaLabor(e.target.value)} className="w-full px-3 py-2 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none transition-all" />
                      <div className="max-h-44 overflow-y-auto border border-concrete rounded-lg divide-y divide-concrete/50">
                        {laborCatalog.filter((l) => (l.nombre || '').toLowerCase().includes(busquedaLabor.toLowerCase())).map((l) => {
                          const yaAgregado = trabajadoresSeleccionados.some((t) => t.especialidad === l.nombre);
                          return (
                            <div key={l.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-sand/40">
                              <div>
                                <p className="text-xs font-semibold text-charcoal">{l.nombre}</p>
                                <p className="text-[10px] text-steel-mid">{formatearCOP(l.precio_diario)}/día</p>
                              </div>
                              <button type="button" disabled={importandoLaborId === l.id || yaAgregado} onClick={() => handleImportarLabor(l)} className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-burn-orange hover:bg-burn-orange/10 rounded-lg disabled:opacity-40 transition-colors uppercase">
                                {importandoLaborId === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : yaAgregado ? '✓' : <><UserPlus className="h-3 w-3" /> Agregar</>}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {trabajadoresSeleccionados.length > 0 && (
                  <div className="border border-concrete rounded-lg overflow-hidden">
                    {trabajadoresSeleccionados.map((t, i) => (
                      <div key={t.id} className={cn('flex items-center justify-between px-4 py-3 text-sm bg-sand/30', i > 0 && 'border-t border-concrete')}>
                        <div>
                          <span className="font-semibold text-charcoal">{t.cantidad > 1 ? `${t.cantidad}× ` : ''}{t.especialidad}</span>
                          <span className="text-steel-mid ml-2 text-xs">{t.categoria} · {formatearCOP(t.jornal_base * t.factor_prestacional * t.cantidad)}/día</span>
                        </div>
                        <button type="button" onClick={() => quitarTrabajador(t.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-steel-mid hover:text-red-600 transition-colors">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="px-4 py-2 bg-sand/50 border-t border-concrete text-right">
                      <span className="text-xs font-semibold text-steel-mid uppercase tracking-wider">Costo jornada total: </span>
                      <span className="text-sm font-bold text-charcoal tabular-nums">
                        {formatearCOP(trabajadoresSeleccionados.reduce((s, t) => s + t.jornal_base * t.factor_prestacional * t.cantidad, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-concrete rounded-xl p-4 space-y-3 bg-sand/20">
                <p className="text-[10px] font-bold text-steel-mid uppercase tracking-widest">Rendimiento base <span className="font-normal normal-case">(opcional)</span></p>
                <div className="flex gap-2">
                  <input type="number" value={rendimientoNormal} onChange={(e) => setRendimientoNormal(e.target.value)} min={0} step="0.01" placeholder="Ej: 8" className="flex-1 px-3 py-2 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none transition-all bg-white" />
                  <select value={rendimientoUnidad} onChange={(e) => setRendimientoUnidad(e.target.value)} className="w-28 px-3 py-2 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none bg-white">
                    {['m²','m³','ml','kg','gl','un','hr','pto','día','ton'].map((u) => <option key={u} value={u}>Unidad: {u}</option>)}
                  </select>
                </div>
                <input type="text" value={rendimientoFuente} onChange={(e) => setRendimientoFuente(e.target.value)} maxLength={150} placeholder="Fuente: SIPO Colombia 2026" className="w-full px-3 py-2 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none transition-all bg-white" />
              </div>

              {cuadrillaError && <p className="text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{cuadrillaError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeCuadrillaModal} className="flex-1 px-4 py-2.5 border border-concrete rounded-lg text-sm font-semibold text-steel-mid hover:bg-sand transition-colors">Cancelar</button>
                <button type="submit" disabled={savingCuadrilla} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-burn-orange text-white rounded-lg text-sm font-semibold hover:bg-burn-orange/90 transition-colors disabled:opacity-60">
                  {savingCuadrilla ? <><Loader2 className="h-4 w-4 animate-spin" /> {editCuadrilla ? 'Guardando…' : 'Creando…'}</> : <><Save className="h-4 w-4" /> {editCuadrilla ? 'Guardar cambios' : 'Crear cuadrilla'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCrearTrabajador && (
        <ModalTrabajador onClose={() => setShowCrearTrabajador(false)} onSaved={handleTrabajadorCreado} />
      )}
    </div>
  );
}

// ── Subcomponentes de fila para evitar re-renders masivos ─────────────────────

function MatRow({
  mat, onBlur, onReset,
}: {
  mat: MaterialConPrecio;
  onBlur: (mat: MaterialConPrecio, raw: string) => void;
  onReset: (mat: MaterialConPrecio) => void;
}) {
  const personalizado = mat.precio_usuario !== null;
  const [localVal, setLocalVal] = useState(
    personalizado ? String(mat.precio_usuario) : String(mat.precio_referencia)
  );

  useEffect(() => {
    setLocalVal(mat.precio_usuario !== null ? String(mat.precio_usuario) : String(mat.precio_referencia));
  }, [mat.precio_usuario, mat.precio_referencia]);

  return (
    <tr className="hover:bg-sand/20 transition-colors group">
      <td className="px-4 py-3 font-medium text-charcoal">{mat.nombre}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-sand text-steel-mid">
          {mat.categoria}
        </span>
      </td>
      <td className="px-4 py-3 text-steel-mid text-xs">{mat.unidad}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-1">
          {personalizado ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 uppercase tracking-wide">
              Propio
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F3F4F6] text-[#6B7280] uppercase tracking-wide">
              Referencia
            </span>
          )}
          <input
            type="number"
            min={0}
            step="0.01"
            value={localVal}
            onChange={(e) => setLocalVal(e.target.value)}
            onBlur={(e) => onBlur(mat, e.target.value)}
            className={cn(
              'w-36 px-2 py-1 rounded-lg text-sm text-right tabular-nums outline-none transition-all',
              'bg-transparent border focus:bg-white',
              personalizado
                ? 'border-blue-300 text-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                : 'border-concrete/60 text-steel-mid focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20'
            )}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
      </td>
      <td className="px-4 py-3 text-right w-10">
        {personalizado && (
          <button
            onClick={() => onReset(mat)}
            title="Restablecer precio de referencia"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-burn-orange hover:bg-burn-orange/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </td>
    </tr>
  );
}

function EqRow({
  eq, onBlur, onReset,
}: {
  eq: EquipoConPrecio;
  onBlur: (eq: EquipoConPrecio, raw: string) => void;
  onReset: (eq: EquipoConPrecio) => void;
}) {
  const personalizado = eq.precio_usuario !== null;
  const [localVal, setLocalVal] = useState(
    personalizado ? String(eq.precio_usuario) : String(eq.precio_diario)
  );

  useEffect(() => {
    setLocalVal(eq.precio_usuario !== null ? String(eq.precio_usuario) : String(eq.precio_diario));
  }, [eq.precio_usuario, eq.precio_diario]);

  return (
    <tr className="hover:bg-sand/20 transition-colors group">
      <td className="px-4 py-3 font-medium text-charcoal">{eq.nombre}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-sand text-steel-mid">
          {eq.tipo}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-1">
          {personalizado ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 uppercase tracking-wide">
              Propio
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F3F4F6] text-[#6B7280] uppercase tracking-wide">
              Referencia
            </span>
          )}
          <input
            type="number"
            min={0}
            step="0.01"
            value={localVal}
            onChange={(e) => setLocalVal(e.target.value)}
            onBlur={(e) => onBlur(eq, e.target.value)}
            className={cn(
              'w-36 px-2 py-1 rounded-lg text-sm text-right tabular-nums outline-none transition-all',
              'bg-transparent border focus:bg-white',
              personalizado
                ? 'border-blue-300 text-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                : 'border-concrete/60 text-steel-mid focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20'
            )}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-steel-mid/70 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
        {formatearCOP(eq.precio_semanal)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-steel-mid/70 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
        {formatearCOP(eq.precio_mensual)}
      </td>
      <td className="px-4 py-3 text-right w-10">
        {personalizado && (
          <button
            onClick={() => onReset(eq)}
            title="Restablecer precio de referencia"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-burn-orange hover:bg-burn-orange/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </td>
    </tr>
  );
}
