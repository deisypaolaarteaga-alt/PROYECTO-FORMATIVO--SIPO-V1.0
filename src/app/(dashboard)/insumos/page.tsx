'use client';

import {
  useState, useEffect, useMemo, useTransition, useCallback, useRef,
} from 'react';
import {
  Package, Drill, ShieldCheck,
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  Plus, Trash2, Edit2, Power, PowerOff,
  Loader2, Info, X, Save, UserPlus, Minus, ArrowRight, Upload,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { SkeletonTable } from '@/components/shared/Skeleton';
import { formatearCOP } from '@/lib/utils/formato-cop';
import {
  getMaterialesConPrecio, upsertMaterialPrecio, resetMaterialPrecio,
  toggleMaterialActivo,
  getEquiposConPrecio, upsertEquipoPrecio, resetEquipoPrecio,
  toggleEquipoActivo,
  getLabor, getUserMaterials, createUserMaterial, updateUserMaterial, deleteUserMaterial,
} from '@/actions/insumos';
import {
  getCuadrillas, getTrabajadores, crearCuadrillaPersonalizada, deleteCuadrilla,
  updateCuadrilla, importarLaborComoTrabajador, agregarTrabajadorACuadrilla,
} from '@/actions/cuadrillas';
import { ModalTrabajador } from '@/components/mano-obra/ModalTrabajador';
import { ModalImportarCSV } from '@/components/shared/ModalImportarCSV';
import { SelectDropdown } from '@/components/shared/SelectDropdown';
import { importarInsumosCSV } from '@/actions/insumos';
import type { TrabajadorReferencia } from '@/actions/mano-obra';
import type { MaterialConPrecio, EquipoConPrecio } from '@/types';
import { cn } from '@/lib/utils';

const COLUMNAS_CSV_INSUMOS = ['nombre', 'categoria', 'unidad', 'precio_unitario'];

// ── Tipos ──────────────────────────────────────────────────────────────────────

type TabId = 'material' | 'equipment' | 'crews';
type SortDir = 'asc' | 'desc';
type MatColKey = 'nombre' | 'categoria' | 'unidad' | 'precio';
type EqColKey  = 'nombre' | 'tipo' | 'precio';

// Tipo unificado para filas de la tabla (catálogo + user_materials)
interface MatItem {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  precio: number;
  precioRef: number | null;
  esPropio: boolean;
  esUserMaterial: boolean;
  activo: boolean;
}

interface EqItem {
  id: string;
  nombre: string;
  tipo: string;
  unidad: string;
  precio: number;
  precioSemanal: number;
  precioMensual: number;
  precioRef: number | null;
  esPropio: boolean;
  esUserMaterial: boolean;
  activo: boolean;
}

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

// ── Componente principal ───────────────────────────────────────────────────────

export default function InsumosPage() {
  const [tab, setTab] = useState<TabId>('material');

  // ── Materiales ─────────────────────────────────────────────────────────────
  const [materiales, setMateriales] = useState<MaterialConPrecio[]>([]);
  const [userMateriales, setUserMateriales] = useState<any[]>([]);
  const [loadingMat, setLoadingMat] = useState(true);
  const [searchMat, setSearchMat] = useState('');
  const [sortMatCol, setSortMatCol] = useState<MatColKey>('nombre');
  const [sortMatDir, setSortMatDir] = useState<SortDir>('asc');
  const [categoriaMat, setCategoriaMat] = useState<string | null>(null);
  const [mostrarInactivosMat, setMostrarInactivosMat] = useState(true);
  const [togglingMatId, setTogglingMatId] = useState<string | null>(null);
  const [eliminandoMatId, setEliminandoMatId] = useState<string | null>(null);
  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [matEditPrice, setMatEditPrice] = useState('');
  const [savingMatEdit, setSavingMatEdit] = useState(false);
  const [showImportMat, setShowImportMat] = useState(false);
  const [showCreateMat, setShowCreateMat] = useState(false);
  const [createMatNombre, setCreateMatNombre] = useState('');
  const [createMatUnidad, setCreateMatUnidad] = useState('');
  const [createMatPrecio, setCreateMatPrecio] = useState('');
  const [createMatError, setCreateMatError] = useState('');
  const [savingCreateMat, setSavingCreateMat] = useState(false);
  const [, startMatTransition] = useTransition();

  // ── Equipos ────────────────────────────────────────────────────────────────
  const [equipos, setEquipos] = useState<EquipoConPrecio[]>([]);
  const [userEquipos, setUserEquipos] = useState<any[]>([]);
  const [loadingEq, setLoadingEq] = useState(true);
  const [searchEq, setSearchEq] = useState('');
  const [sortEqCol, setSortEqCol] = useState<EqColKey>('nombre');
  const [sortEqDir, setSortEqDir] = useState<SortDir>('asc');
  const [mostrarInactivosEq, setMostrarInactivosEq] = useState(true);
  const [togglingEqId, setTogglingEqId] = useState<string | null>(null);
  const [eliminandoEqId, setEliminandoEqId] = useState<string | null>(null);
  const [editingEqId, setEditingEqId] = useState<string | null>(null);
  const [eqEditPrice, setEqEditPrice] = useState('');
  const [savingEqEdit, setSavingEqEdit] = useState(false);
  const [showCreateEq, setShowCreateEq] = useState(false);
  const [createEqNombre, setCreateEqNombre] = useState('');
  const [createEqUnidad, setCreateEqUnidad] = useState('día');
  const [createEqPrecio, setCreateEqPrecio] = useState('');
  const [createEqError, setCreateEqError] = useState('');
  const [savingCreateEq, setSavingCreateEq] = useState(false);
  const [, startEqTransition] = useTransition();

  // ── Cuadrillas (sin cambios) ───────────────────────────────────────────────
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
      Promise.all([getMaterialesConPrecio(), getUserMaterials()]).then(([catalog, userMats]) => {
        setMateriales(catalog);
        setUserMateriales((userMats as any[]).filter((u) => u.tipo === 'material'));
        setLoadingMat(false);
      });
    }
    if (tab === 'equipment' && equipos.length === 0) {
      setLoadingEq(true);
      Promise.all([getEquiposConPrecio(), getUserMaterials()]).then(([catalog, userMats]) => {
        setEquipos(catalog);
        setUserEquipos((userMats as any[]).filter((u) => u.tipo === 'equipo'));
        setLoadingEq(false);
      });
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

  // ── Filas combinadas: Materiales ───────────────────────────────────────────

  const filasMat = useMemo((): MatItem[] => {
    const q = searchMat.trim().toLowerCase();

    const catalogItems: MatItem[] = materiales
      .filter((m) => mostrarInactivosMat || m.activo)
      .filter((m) => !categoriaMat || m.categoria === categoriaMat)
      .filter((m) => !q || m.nombre.toLowerCase().includes(q) || m.categoria.toLowerCase().includes(q))
      .map((m) => ({
        id: m.id,
        nombre: m.nombre,
        categoria: m.categoria,
        unidad: m.unidad,
        precio: m.precio_usuario ?? m.precio_referencia,
        precioRef: m.precio_referencia,
        esPropio: m.precio_usuario !== null,
        esUserMaterial: false,
        activo: m.activo,
      }));

    const userItems: MatItem[] = userMateriales
      .filter((u) => !q || u.nombre.toLowerCase().includes(q))
      .map((u) => ({
        id: u.id,
        nombre: u.nombre,
        categoria: u.descripcion || '—',
        unidad: u.unidad,
        precio: Number(u.precio_unitario ?? 0),
        precioRef: null,
        esPropio: true,
        esUserMaterial: true,
        activo: true,
      }));

    const sortedCatalog = [...catalogItems].sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortMatCol === 'precio') { va = a.precio; vb = b.precio; }
      else { va = a[sortMatCol as 'nombre' | 'categoria' | 'unidad']; vb = b[sortMatCol as 'nombre' | 'categoria' | 'unidad']; }
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string, 'es-CO') : (va as number) - (vb as number);
      return sortMatDir === 'asc' ? cmp : -cmp;
    });

    return [...userItems, ...sortedCatalog];
  }, [materiales, userMateriales, searchMat, categoriaMat, mostrarInactivosMat, sortMatCol, sortMatDir]);

  // ── Filas combinadas: Equipos ──────────────────────────────────────────────

  const filasEq = useMemo((): EqItem[] => {
    const q = searchEq.trim().toLowerCase();

    const catalogItems: EqItem[] = equipos
      .filter((e) => mostrarInactivosEq || e.activo)
      .filter((e) => !q || e.nombre.toLowerCase().includes(q) || e.tipo.toLowerCase().includes(q))
      .map((e) => ({
        id: e.id,
        nombre: e.nombre,
        tipo: e.tipo,
        unidad: 'día',
        precio: e.precio_usuario ?? e.precio_diario,
        precioSemanal: e.precio_semanal,
        precioMensual: e.precio_mensual,
        precioRef: e.precio_diario,
        esPropio: e.precio_usuario !== null,
        esUserMaterial: false,
        activo: e.activo,
      }));

    const userItems: EqItem[] = userEquipos
      .filter((u) => !q || u.nombre.toLowerCase().includes(q))
      .map((u) => ({
        id: u.id,
        nombre: u.nombre,
        tipo: 'Propio',
        unidad: u.unidad || 'día',
        precio: Number(u.precio_unitario ?? 0),
        precioSemanal: 0,
        precioMensual: 0,
        precioRef: null,
        esPropio: true,
        esUserMaterial: true,
        activo: true,
      }));

    const sortedCatalog = [...catalogItems].sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortEqCol === 'precio') { va = a.precio; vb = b.precio; }
      else { va = a[sortEqCol as 'nombre' | 'tipo']; vb = b[sortEqCol as 'nombre' | 'tipo']; }
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string, 'es-CO') : (va as number) - (vb as number);
      return sortEqDir === 'asc' ? cmp : -cmp;
    });

    return [...userItems, ...sortedCatalog];
  }, [equipos, userEquipos, searchEq, mostrarInactivosEq, sortEqCol, sortEqDir]);

  // ── Badges de pestañas ─────────────────────────────────────────────────────

  const matPropios = useMemo(
    () => materiales.filter((m) => m.precio_usuario !== null).length + userMateriales.length,
    [materiales, userMateriales]
  );
  const eqPropios = useMemo(
    () => equipos.filter((e) => e.precio_usuario !== null).length + userEquipos.length,
    [equipos, userEquipos]
  );

  // ── Handlers: Materiales ───────────────────────────────────────────────────

  const handleToggleMat = useCallback(async (item: MatItem) => {
    if (item.esUserMaterial) return; // user_materials siempre activos en esta versión
    setTogglingMatId(item.id);
    const res = await toggleMaterialActivo(item.id);
    setTogglingMatId(null);
    if (res.success) {
      setMateriales((prev) => prev.map((m) => m.id === item.id ? { ...m, activo: res.activo } : m));
    }
  }, []);

  const handleEditMat = useCallback((item: MatItem) => {
    setEditingMatId(item.id);
    setMatEditPrice(String(item.precio));
  }, []);

  const handleSaveMatEdit = useCallback(async () => {
    if (!editingMatId) return;
    const precio = parseFloat(matEditPrice);
    if (isNaN(precio) || precio < 0) return;
    setSavingMatEdit(true);
    const userItem = userMateriales.find((u) => u.id === editingMatId);
    if (userItem) {
      const fd = new FormData();
      fd.set('nombre', userItem.nombre);
      fd.set('tipo', 'material');
      fd.set('unidad', userItem.unidad);
      fd.set('precio_unitario', String(precio));
      if (userItem.descripcion) fd.set('descripcion', userItem.descripcion);
      await updateUserMaterial(editingMatId, fd);
      setUserMateriales((prev) => prev.map((u) => u.id === editingMatId ? { ...u, precio_unitario: precio } : u));
    } else {
      await upsertMaterialPrecio(editingMatId, precio);
      setMateriales((prev) => prev.map((m) => m.id === editingMatId ? { ...m, precio_usuario: precio, activo: true } : m));
    }
    setSavingMatEdit(false);
    setEditingMatId(null);
  }, [editingMatId, matEditPrice, userMateriales]);

  const handleResetMat = useCallback(async (item: MatItem) => {
    if (item.esUserMaterial) {
      if (!confirm(`¿Eliminar "${item.nombre}"? Esta acción no se puede deshacer.`)) return;
      setEliminandoMatId(item.id);
      await deleteUserMaterial(item.id);
      setUserMateriales((prev) => prev.filter((u) => u.id !== item.id));
      setEliminandoMatId(null);
    } else {
      setEliminandoMatId(item.id);
      startMatTransition(async () => {
        await resetMaterialPrecio(item.id);
        setMateriales((prev) => prev.map((m) => m.id === item.id ? { ...m, precio_usuario: null, activo: true } : m));
        setEliminandoMatId(null);
      });
    }
  }, [startMatTransition]);

  const handleCreateMat = useCallback(async () => {
    if (!createMatNombre.trim() || !createMatUnidad.trim()) {
      setCreateMatError('Nombre y unidad son obligatorios');
      return;
    }
    setSavingCreateMat(true);
    setCreateMatError('');
    const fd = new FormData();
    fd.set('nombre', createMatNombre.trim());
    fd.set('tipo', 'material');
    fd.set('unidad', createMatUnidad.trim());
    fd.set('precio_unitario', createMatPrecio || '0');
    const res = await createUserMaterial(fd);
    setSavingCreateMat(false);
    if (!res.success) { setCreateMatError(res.error || 'Error al crear'); return; }
    const uMats = await getUserMaterials();
    setUserMateriales((uMats as any[]).filter((u) => u.tipo === 'material'));
    setShowCreateMat(false);
    setCreateMatNombre(''); setCreateMatUnidad(''); setCreateMatPrecio('');
  }, [createMatNombre, createMatUnidad, createMatPrecio]);

  // ── Handlers: Equipos ──────────────────────────────────────────────────────

  const handleToggleEq = useCallback(async (item: EqItem) => {
    if (item.esUserMaterial) return;
    setTogglingEqId(item.id);
    const res = await toggleEquipoActivo(item.id);
    setTogglingEqId(null);
    if (res.success) {
      setEquipos((prev) => prev.map((e) => e.id === item.id ? { ...e, activo: res.activo } : e));
    }
  }, []);

  const handleEditEq = useCallback((item: EqItem) => {
    setEditingEqId(item.id);
    setEqEditPrice(String(item.precio));
  }, []);

  const handleSaveEqEdit = useCallback(async () => {
    if (!editingEqId) return;
    const precio = parseFloat(eqEditPrice);
    if (isNaN(precio) || precio < 0) return;
    setSavingEqEdit(true);
    const userItem = userEquipos.find((u) => u.id === editingEqId);
    if (userItem) {
      const fd = new FormData();
      fd.set('nombre', userItem.nombre);
      fd.set('tipo', 'equipo');
      fd.set('unidad', userItem.unidad || 'día');
      fd.set('precio_unitario', String(precio));
      if (userItem.descripcion) fd.set('descripcion', userItem.descripcion);
      await updateUserMaterial(editingEqId, fd);
      setUserEquipos((prev) => prev.map((u) => u.id === editingEqId ? { ...u, precio_unitario: precio } : u));
    } else {
      await upsertEquipoPrecio(editingEqId, precio);
      setEquipos((prev) => prev.map((e) => e.id === editingEqId ? { ...e, precio_usuario: precio, activo: true } : e));
    }
    setSavingEqEdit(false);
    setEditingEqId(null);
  }, [editingEqId, eqEditPrice, userEquipos]);

  const handleResetEq = useCallback(async (item: EqItem) => {
    if (item.esUserMaterial) {
      if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;
      setEliminandoEqId(item.id);
      await deleteUserMaterial(item.id);
      setUserEquipos((prev) => prev.filter((u) => u.id !== item.id));
      setEliminandoEqId(null);
    } else {
      setEliminandoEqId(item.id);
      startEqTransition(async () => {
        await resetEquipoPrecio(item.id);
        setEquipos((prev) => prev.map((e) => e.id === item.id ? { ...e, precio_usuario: null, activo: true } : e));
        setEliminandoEqId(null);
      });
    }
  }, [startEqTransition]);

  const handleCreateEq = useCallback(async () => {
    if (!createEqNombre.trim()) { setCreateEqError('El nombre es obligatorio'); return; }
    setSavingCreateEq(true);
    setCreateEqError('');
    const fd = new FormData();
    fd.set('nombre', createEqNombre.trim());
    fd.set('tipo', 'equipo');
    fd.set('unidad', createEqUnidad || 'día');
    fd.set('precio_unitario', createEqPrecio || '0');
    const res = await createUserMaterial(fd);
    setSavingCreateEq(false);
    if (!res.success) { setCreateEqError(res.error || 'Error al crear'); return; }
    const uMats = await getUserMaterials();
    setUserEquipos((uMats as any[]).filter((u) => u.tipo === 'equipo'));
    setShowCreateEq(false);
    setCreateEqNombre(''); setCreateEqUnidad('día'); setCreateEqPrecio('');
  }, [createEqNombre, createEqUnidad, createEqPrecio]);

  // ── Handlers: Cuadrillas (sin cambios) ────────────────────────────────────

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

  // ── Helpers para editar ────────────────────────────────────────────────────

  const editingMatItem = useMemo(() => {
    if (!editingMatId) return null;
    const cat = materiales.find((m) => m.id === editingMatId);
    if (cat) return { nombre: cat.nombre, precioRef: cat.precio_referencia };
    const usr = userMateriales.find((u) => u.id === editingMatId);
    if (usr) return { nombre: usr.nombre, precioRef: null };
    return null;
  }, [editingMatId, materiales, userMateriales]);

  const editingEqItem = useMemo(() => {
    if (!editingEqId) return null;
    const cat = equipos.find((e) => e.id === editingEqId);
    if (cat) return { nombre: cat.nombre, precioRef: cat.precio_diario };
    const usr = userEquipos.find((u) => u.id === editingEqId);
    if (usr) return { nombre: usr.nombre, precioRef: null };
    return null;
  }, [editingEqId, equipos, userEquipos]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
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
        <div className="flex flex-wrap gap-2 w-full">
          {tab === 'material' && (
            <>
              <button
                onClick={() => setMostrarInactivosMat((v) => !v)}
                className={cn(
                  'w-full sm:w-auto flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  mostrarInactivosMat
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    : 'bg-sand text-steel-mid border-concrete hover:bg-concrete/60'
                )}
              >
                {mostrarInactivosMat ? 'Ocultar inactivos' : 'Mostrar inactivos'}
              </button>
              <button
                onClick={() => setShowImportMat(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border bg-sand text-steel-mid border-concrete hover:bg-concrete/60"
              >
                <Upload className="h-3.5 w-3.5" />
                Importar CSV
              </button>
              <Button size="sm" className="w-full sm:w-auto" icon={<Plus className="h-4 w-4" />} onClick={() => { setShowCreateMat(true); setCreateMatError(''); }}>
                Agregar material
              </Button>
            </>
          )}
          {tab === 'equipment' && (
            <>
              <button
                onClick={() => setMostrarInactivosEq((v) => !v)}
                className={cn(
                  'w-full sm:w-auto flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  mostrarInactivosEq
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    : 'bg-sand text-steel-mid border-concrete hover:bg-concrete/60'
                )}
              >
                {mostrarInactivosEq ? 'Ocultar inactivos' : 'Mostrar inactivos'}
              </button>
              <Button size="sm" className="w-full sm:w-auto" icon={<Plus className="h-4 w-4" />} onClick={() => { setShowCreateEq(true); setCreateEqError(''); }}>
                Agregar equipo
              </Button>
            </>
          )}
          {tab === 'crews' && (
            <Button size="sm" className="w-full sm:w-auto" icon={<Plus className="h-4 w-4" />} onClick={openCreateCuadrilla}>
              Nueva cuadrilla
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-concrete overflow-x-auto">
        {([
          { id: 'material',  label: 'Materiales', icon: Package,     badge: matPropios > 0 ? `${matPropios} propios` : null },
          { id: 'equipment', label: 'Equipos',     icon: Drill,       badge: eqPropios > 0 ? `${eqPropios} propios` : null },
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
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-info-50 border border-[#A8C4DC] rounded-xl">
          <p className="text-sm text-info-600 font-medium">
            Las cuadrillas agrupan trabajadores. Para editar tarifas salariales ve a Tarifas Salariales.
          </p>
          <Link
            href="/mano-obra"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C4A72] text-white text-xs font-semibold rounded-lg hover:bg-[#2E4A63] transition-colors whitespace-nowrap shrink-0"
          >
            Gestionar trabajadores <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ── PESTAÑA MATERIALES ── */}
      {tab === 'material' && (
        <Card>
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Haz clic en el lápiz para personalizar el precio de un material del catálogo. Usa <strong>Agregar material</strong> para crear uno propio que no está en el catálogo.
            </p>
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b border-concrete space-y-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-steel-mid pointer-events-none" />
              <Input placeholder="Buscar por nombre o categoría…" value={searchMat} onChange={(e) => setSearchMat(e.target.value)} className="pl-9" />
            </div>
            {categoriasMat.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-steel-mid font-medium shrink-0">Categoría:</span>
                <button onClick={() => setCategoriaMat(null)} className={cn('px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer', categoriaMat === null ? 'bg-burn-orange text-white' : 'bg-sand text-steel-mid hover:bg-concrete/60 hover:text-charcoal')}>Todas</button>
                {categoriasMat.map((cat) => (
                  <button key={cat} onClick={() => setCategoriaMat((prev) => prev === cat ? null : cat)} className={cn('px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer', categoriaMat === cat ? 'bg-burn-orange text-white' : 'bg-sand text-steel-mid hover:bg-concrete/60 hover:text-charcoal')}>{cat}</button>
                ))}
              </div>
            )}
          </div>

          {loadingMat ? (
            <div className="p-4"><SkeletonTable rows={8} cols={5} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1A2535] border-b border-[#2A3B50]">
                    {([
                      { key: 'nombre',    label: 'Nombre',    align: 'left'  },
                      { key: 'categoria', label: 'Categoría', align: 'left'  },
                      { key: 'unidad',    label: 'Unidad',    align: 'left'  },
                      { key: 'precio',    label: 'Precio',    align: 'right' },
                    ] as const).map((col) => (
                      <th
                        key={col.key}
                        onClick={() => {
                          if (sortMatCol === col.key) setSortMatDir((d) => d === 'asc' ? 'desc' : 'asc');
                          else { setSortMatCol(col.key); setSortMatDir('asc'); }
                        }}
                        className={cn('px-4 py-3 font-medium text-white/60 cursor-pointer select-none hover:text-white transition-colors whitespace-nowrap', col.align === 'right' ? 'text-right' : 'text-left')}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {col.align === 'right' && <SortIcon col={col.key} sortCol={sortMatCol} sortDir={sortMatDir} />}
                          {col.label}
                          {col.align === 'left' && <SortIcon col={col.key} sortCol={sortMatCol} sortDir={sortMatDir} />}
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 w-32 bg-[#1A2535]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-concrete/50">
                  {filasMat.map((item) => (
                    <MatRow
                      key={item.id}
                      item={item}
                      onEdit={handleEditMat}
                      onToggle={handleToggleMat}
                      onReset={handleResetMat}
                      toggling={togglingMatId === item.id}
                      eliminando={eliminandoMatId === item.id}
                    />
                  ))}
                </tbody>
              </table>
              {filasMat.length === 0 && (
                <div className="py-16 text-center text-sm text-steel-mid">No hay materiales que coincidan con los filtros.</div>
              )}
              <div className="px-4 py-2.5 border-t border-concrete bg-sand/20 text-xs text-steel-mid flex justify-between">
                <span>{filasMat.length} materiales</span>
                <span>{matPropios} propios · {materiales.filter((m) => !m.activo).length} inactivos</span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── PESTAÑA EQUIPOS ── */}
      {tab === 'equipment' && (
        <Card>
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              El <strong>precio diario</strong> es el que usa el Panel APU. Los precios semanal y mensual son solo informativos del catálogo de referencia.
            </p>
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b border-concrete">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-steel-mid pointer-events-none" />
              <Input placeholder="Buscar por nombre o tipo…" value={searchEq} onChange={(e) => setSearchEq(e.target.value)} className="pl-9" />
            </div>
          </div>

          {loadingEq ? (
            <div className="p-4"><SkeletonTable rows={8} cols={5} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1A2535] border-b border-[#2A3B50]">
                    {([
                      { key: 'nombre', label: 'Nombre',        align: 'left'  },
                      { key: 'tipo',   label: 'Tipo',          align: 'left'  },
                      { key: 'precio', label: 'Precio diario', align: 'right' },
                    ] as const).map((col) => (
                      <th
                        key={col.key}
                        onClick={() => {
                          if (sortEqCol === col.key) setSortEqDir((d) => d === 'asc' ? 'desc' : 'asc');
                          else { setSortEqCol(col.key); setSortEqDir('asc'); }
                        }}
                        className={cn('px-4 py-3 font-medium text-white/60 cursor-pointer select-none hover:text-white transition-colors whitespace-nowrap', col.align === 'right' ? 'text-right' : 'text-left')}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {col.align === 'right' && <SortIcon col={col.key} sortCol={sortEqCol} sortDir={sortEqDir} />}
                          {col.label}
                          {col.align === 'left' && <SortIcon col={col.key} sortCol={sortEqCol} sortDir={sortEqDir} />}
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right font-medium text-white/60 whitespace-nowrap">Ref. semanal</th>
                    <th className="px-4 py-3 text-right font-medium text-white/60 whitespace-nowrap">Ref. mensual</th>
                    <th className="px-4 py-3 w-32 bg-[#1A2535]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-concrete/50">
                  {filasEq.map((item) => (
                    <EqRow
                      key={item.id}
                      item={item}
                      onEdit={handleEditEq}
                      onToggle={handleToggleEq}
                      onReset={handleResetEq}
                      toggling={togglingEqId === item.id}
                      eliminando={eliminandoEqId === item.id}
                    />
                  ))}
                </tbody>
              </table>
              {filasEq.length === 0 && (
                <div className="py-16 text-center text-sm text-steel-mid">No hay equipos que coincidan con la búsqueda.</div>
              )}
              <div className="px-4 py-2.5 border-t border-concrete bg-sand/20 text-xs text-steel-mid flex justify-between">
                <span>{filasEq.length} equipos</span>
                <span>{eqPropios} propios · {equipos.filter((e) => !e.activo).length} inactivos</span>
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
              <Input placeholder="Buscar cuadrilla…" value={searchCrews} onChange={(e) => setSearchCrews(e.target.value)} className="pl-9" />
            </div>
          </div>

          {loadingCrews ? (
            <div className="p-4"><SkeletonTable rows={6} cols={4} /></div>
          ) : filteredCrews.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <ShieldCheck className="h-10 w-10 text-concrete" />
              <p className="text-sm font-medium text-charcoal">{searchCrews ? 'Sin resultados' : 'No hay cuadrillas disponibles'}</p>
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
                        <p className="text-xs text-steel-mid">{item.categoria_actividad || 'Sin categoría'} · {item.es_sistema ? 'Sistema' : 'Personalizada'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(item.trabajadores || []).slice(0, 3).map((t: any, i: number) => (
                            <span key={i} className="text-[10px] font-semibold text-steel-mid bg-sand px-2 py-0.5 rounded uppercase">
                              {t.cantidad > 1 ? `${t.cantidad}×` : ''}{t.especialidad}
                            </span>
                          ))}
                          {(item.trabajadores || []).length > 3 && <span className="text-[10px] text-steel-mid bg-sand px-2 py-0.5 rounded">+{item.trabajadores.length - 3} más</span>}
                          {(item.trabajadores || []).length === 0 && <span className="text-xs text-steel-mid">Sin trabajadores</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-steel-mid text-xs">
                        {item.rendimientos?.length > 0 ? `${item.rendimientos[0].rendimiento_normal} ${item.rendimientos[0].unidad}/día` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-burn-orange" style={{ fontFamily: 'var(--font-mono)' }}>
                        {formatearCOP(costoJornadaCuadrilla(item))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!item.es_sistema ? (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openQuickAdd(item)} className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-burn-orange hover:bg-burn-orange/10 transition-colors cursor-pointer" title="Agregar trabajador"><UserPlus className="h-3.5 w-3.5" /></button>
                            <button onClick={() => openEditCuadrilla(item)} className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-charcoal hover:bg-sand transition-colors cursor-pointer" title="Editar"><Edit2 className="h-3.5 w-3.5" /></button>
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

      {/* ── MODAL: Editar precio Material ── */}
      {editingMatId && editingMatItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingMatId(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-concrete bg-sand">
              <div>
                <h2 className="text-sm font-bold text-charcoal">Editar precio</h2>
                <p className="text-xs text-steel-mid mt-0.5 truncate max-w-[200px]">{editingMatItem.nombre}</p>
              </div>
              <button onClick={() => setEditingMatId(null)} className="p-1.5 hover:bg-concrete/40 rounded-lg transition-colors"><X className="h-4 w-4 text-steel-mid" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-steel-mid uppercase tracking-wider mb-1.5">Precio unitario (COP)</label>
                <input
                  type="number" min={0} step="0.01" autoFocus
                  value={matEditPrice} onChange={(e) => setMatEditPrice(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveMatEdit()}
                  className="w-full px-3 py-2.5 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none transition-all"
                />
                {editingMatItem.precioRef != null && (
                  <p className="text-xs text-steel-mid mt-1">Precio de referencia: {formatearCOP(editingMatItem.precioRef)}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingMatId(null)} className="flex-1 px-4 py-2.5 border border-concrete rounded-lg text-sm font-semibold text-steel-mid hover:bg-sand transition-colors">Cancelar</button>
                <button onClick={handleSaveMatEdit} disabled={savingMatEdit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-burn-orange text-white rounded-lg text-sm font-semibold hover:bg-burn-orange/90 disabled:opacity-60 transition-colors">
                  {savingMatEdit ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : <><Save className="h-4 w-4" /> Guardar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Crear Material propio ── */}
      {showCreateMat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateMat(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-concrete bg-sand">
              <h2 className="text-sm font-bold text-charcoal">Nuevo material propio</h2>
              <button onClick={() => setShowCreateMat(false)} className="p-1.5 hover:bg-concrete/40 rounded-lg transition-colors"><X className="h-4 w-4 text-steel-mid" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-steel-mid uppercase tracking-wider mb-1.5">Nombre *</label>
                <input autoFocus value={createMatNombre} onChange={(e) => setCreateMatNombre(e.target.value)} maxLength={200} placeholder="Ej: Cemento especial tipo III" className="w-full px-3 py-2.5 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-steel-mid uppercase tracking-wider mb-1.5">Unidad *</label>
                  <input value={createMatUnidad} onChange={(e) => setCreateMatUnidad(e.target.value)} placeholder="kg, m², gl…" className="w-full px-3 py-2.5 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-steel-mid uppercase tracking-wider mb-1.5">Precio (COP)</label>
                  <input type="number" min={0} value={createMatPrecio} onChange={(e) => setCreateMatPrecio(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none transition-all" />
                </div>
              </div>
              {createMatError && <p className="text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{createMatError}</p>}
              <div className="flex gap-3">
                <button onClick={() => setShowCreateMat(false)} className="flex-1 px-4 py-2.5 border border-concrete rounded-lg text-sm font-semibold text-steel-mid hover:bg-sand transition-colors">Cancelar</button>
                <button onClick={handleCreateMat} disabled={savingCreateMat} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-burn-orange text-white rounded-lg text-sm font-semibold hover:bg-burn-orange/90 disabled:opacity-60 transition-colors">
                  {savingCreateMat ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando…</> : <><Plus className="h-4 w-4" /> Crear material</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Editar precio Equipo ── */}
      {editingEqId && editingEqItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingEqId(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-concrete bg-sand">
              <div>
                <h2 className="text-sm font-bold text-charcoal">Editar precio diario</h2>
                <p className="text-xs text-steel-mid mt-0.5 truncate max-w-[200px]">{editingEqItem.nombre}</p>
              </div>
              <button onClick={() => setEditingEqId(null)} className="p-1.5 hover:bg-concrete/40 rounded-lg transition-colors"><X className="h-4 w-4 text-steel-mid" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-steel-mid uppercase tracking-wider mb-1.5">Precio diario (COP)</label>
                <input
                  type="number" min={0} step="0.01" autoFocus
                  value={eqEditPrice} onChange={(e) => setEqEditPrice(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEqEdit()}
                  className="w-full px-3 py-2.5 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none transition-all"
                />
                {editingEqItem.precioRef != null && (
                  <p className="text-xs text-steel-mid mt-1">Referencia catálogo: {formatearCOP(editingEqItem.precioRef)}/día</p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingEqId(null)} className="flex-1 px-4 py-2.5 border border-concrete rounded-lg text-sm font-semibold text-steel-mid hover:bg-sand transition-colors">Cancelar</button>
                <button onClick={handleSaveEqEdit} disabled={savingEqEdit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-burn-orange text-white rounded-lg text-sm font-semibold hover:bg-burn-orange/90 disabled:opacity-60 transition-colors">
                  {savingEqEdit ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : <><Save className="h-4 w-4" /> Guardar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Crear Equipo propio ── */}
      {showCreateEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateEq(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-concrete bg-sand">
              <h2 className="text-sm font-bold text-charcoal">Nuevo equipo propio</h2>
              <button onClick={() => setShowCreateEq(false)} className="p-1.5 hover:bg-concrete/40 rounded-lg transition-colors"><X className="h-4 w-4 text-steel-mid" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-steel-mid uppercase tracking-wider mb-1.5">Nombre *</label>
                <input autoFocus value={createEqNombre} onChange={(e) => setCreateEqNombre(e.target.value)} maxLength={200} placeholder="Ej: Retroexcavadora CAT 320" className="w-full px-3 py-2.5 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-steel-mid uppercase tracking-wider mb-1.5">Unidad</label>
                  <SelectDropdown
                    value={createEqUnidad}
                    onChange={setCreateEqUnidad}
                    options={['día', 'hr', 'mes', 'semana', 'un'].map(u => ({ value: u, label: u }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-steel-mid uppercase tracking-wider mb-1.5">Precio (COP)</label>
                  <input type="number" min={0} value={createEqPrecio} onChange={(e) => setCreateEqPrecio(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none transition-all" />
                </div>
              </div>
              {createEqError && <p className="text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{createEqError}</p>}
              <div className="flex gap-3">
                <button onClick={() => setShowCreateEq(false)} className="flex-1 px-4 py-2.5 border border-concrete rounded-lg text-sm font-semibold text-steel-mid hover:bg-sand transition-colors">Cancelar</button>
                <button onClick={handleCreateEq} disabled={savingCreateEq} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-burn-orange text-white rounded-lg text-sm font-semibold hover:bg-burn-orange/90 disabled:opacity-60 transition-colors">
                  {savingCreateEq ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando…</> : <><Plus className="h-4 w-4" /> Crear equipo</>}
                </button>
              </div>
            </div>
          </div>
        </div>
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
                    <SelectDropdown
                      value={quickWorkerId}
                      onChange={setQuickWorkerId}
                      options={trabajadoresDisponibles.filter((t) => !quickAdd.existingIds.includes(t.id)).map((t) => ({ value: t.id, label: `${t.especialidad} · ${t.categoria} · ${formatearCOP(t.jornal_base)}/día` }))}
                      placeholder="Selecciona un trabajador…"
                    />
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
                <button type="button" onClick={handleQuickAdd} disabled={!quickWorkerId || quickLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-burn-orange text-white rounded-lg text-sm font-semibold hover:bg-burn-orange/90 disabled:opacity-60 transition-colors">
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
                    <SelectDropdown
                      value={trabajadorElegido}
                      onChange={setTrabajadorElegido}
                      options={trabajadoresDisponibles.map((t) => ({
                        value: t.id,
                        label: `${trabajadoresSeleccionados.some((s) => s.id === t.id) ? '✓ ' : ''}${t.especialidad} · ${t.categoria} · ${formatearCOP(t.jornal_base)}/día`,
                        disabled: trabajadoresSeleccionados.some((s) => s.id === t.id),
                      }))}
                      placeholder="Selecciona un trabajador…"
                    />
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
                  <SelectDropdown
                    value={rendimientoUnidad}
                    onChange={setRendimientoUnidad}
                    options={['m²','m³','ml','kg','gl','un','hr','pto','día','ton'].map((u) => ({ value: u, label: `Unidad: ${u}` }))}
                    className="w-28"
                  />
                </div>
                <input type="text" value={rendimientoFuente} onChange={(e) => setRendimientoFuente(e.target.value)} maxLength={150} placeholder="Fuente: SIPO Colombia 2026" className="w-full px-3 py-2 border border-concrete rounded-lg text-sm focus:border-burn-orange focus:ring-2 focus:ring-burn-orange/20 outline-none transition-all bg-white" />
              </div>

              {cuadrillaError && <p className="text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{cuadrillaError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeCuadrillaModal} className="flex-1 px-4 py-2.5 border border-concrete rounded-lg text-sm font-semibold text-steel-mid hover:bg-sand transition-colors">Cancelar</button>
                <button type="submit" disabled={savingCuadrilla} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-burn-orange text-white rounded-lg text-sm font-semibold hover:bg-burn-orange/90 disabled:opacity-60 transition-colors">
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

      {showImportMat && (
        <ModalImportarCSV
          entidad="insumos"
          titulo="Insumos propios"
          columnas={COLUMNAS_CSV_INSUMOS}
          onImportar={importarInsumosCSV}
          onClose={() => {
            setShowImportMat(false);
            // Recargar lista de materiales propios tras importación
            getUserMaterials().then((uMats) => {
              setUserMateriales((uMats as any[]).filter((u) => u.tipo === 'material'));
            });
          }}
        />
      )}
    </div>
  );
}

// ── Subcomponente MatRow ───────────────────────────────────────────────────────

function MatRow({
  item, onEdit, onToggle, onReset, toggling, eliminando,
}: {
  item: MatItem;
  onEdit: (item: MatItem) => void;
  onToggle: (item: MatItem) => void;
  onReset: (item: MatItem) => void;
  toggling: boolean;
  eliminando: boolean;
}) {
  return (
    <tr className={cn('hover:bg-sand/20 transition-colors group', !item.activo && 'opacity-50')}>
      <td className="px-4 py-3 font-medium text-charcoal">
        <span className="flex items-center gap-2 flex-wrap">
          {item.nombre}
          {item.esPropio ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-info-50 text-info-600 uppercase tracking-wide">Propio</span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F3F4F6] text-[#6B7280] uppercase tracking-wide">Referencia</span>
          )}
          {!item.activo && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 uppercase tracking-wide">Inactivo</span>
          )}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-sand text-steel-mid">{item.categoria}</span>
      </td>
      <td className="px-4 py-3 text-steel-mid text-xs">{item.unidad}</td>
      <td className="px-4 py-3 text-right tabular-nums font-semibold text-charcoal" style={{ fontFamily: 'var(--font-mono)' }}>
        {formatearCOP(item.precio)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Toggle activo/inactivo — solo ítems del catálogo */}
          {!item.esUserMaterial && (
            <button
              onClick={() => onToggle(item)}
              disabled={toggling}
              title={item.activo ? 'Inactivar' : 'Activar'}
              className={cn(
                'inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors cursor-pointer disabled:opacity-40',
                item.activo ? 'text-steel-mid hover:text-red-600 hover:bg-red-50' : 'text-red-500 hover:text-green-600 hover:bg-green-50'
              )}
            >
              {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : item.activo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            </button>
          )}
          {/* Editar */}
          <button
            onClick={() => onEdit(item)}
            title="Editar precio"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-charcoal hover:bg-sand transition-colors cursor-pointer"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          {/* Agregar a APU */}
          <button
            title="Disponible en el Panel APU del editor de presupuesto"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-burn-orange hover:bg-burn-orange/10 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
          {/* Eliminar (solo PROPIO) */}
          {item.esPropio && (
            <button
              onClick={() => onReset(item)}
              disabled={eliminando}
              title={item.esUserMaterial ? 'Eliminar material propio' : 'Restablecer precio de referencia'}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
            >
              {eliminando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Subcomponente EqRow ────────────────────────────────────────────────────────

function EqRow({
  item, onEdit, onToggle, onReset, toggling, eliminando,
}: {
  item: EqItem;
  onEdit: (item: EqItem) => void;
  onToggle: (item: EqItem) => void;
  onReset: (item: EqItem) => void;
  toggling: boolean;
  eliminando: boolean;
}) {
  return (
    <tr className={cn('hover:bg-sand/20 transition-colors group', !item.activo && 'opacity-50')}>
      <td className="px-4 py-3 font-medium text-charcoal">
        <span className="flex items-center gap-2 flex-wrap">
          {item.nombre}
          {item.esPropio ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-info-50 text-info-600 uppercase tracking-wide">Propio</span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F3F4F6] text-[#6B7280] uppercase tracking-wide">Referencia</span>
          )}
          {!item.activo && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 uppercase tracking-wide">Inactivo</span>
          )}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-sand text-steel-mid">{item.tipo}</span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums font-semibold text-charcoal" style={{ fontFamily: 'var(--font-mono)' }}>
        {formatearCOP(item.precio)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-steel-mid/70 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
        {item.precioSemanal > 0 ? formatearCOP(item.precioSemanal) : '—'}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-steel-mid/70 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
        {item.precioMensual > 0 ? formatearCOP(item.precioMensual) : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!item.esUserMaterial && (
            <button
              onClick={() => onToggle(item)}
              disabled={toggling}
              title={item.activo ? 'Inactivar' : 'Activar'}
              className={cn(
                'inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors cursor-pointer disabled:opacity-40',
                item.activo ? 'text-steel-mid hover:text-red-600 hover:bg-red-50' : 'text-red-500 hover:text-green-600 hover:bg-green-50'
              )}
            >
              {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : item.activo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={() => onEdit(item)}
            title="Editar precio diario"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-charcoal hover:bg-sand transition-colors cursor-pointer"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            title="Disponible en el Panel APU del editor de presupuesto"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-burn-orange hover:bg-burn-orange/10 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
          {item.esPropio && (
            <button
              onClick={() => onReset(item)}
              disabled={eliminando}
              title={item.esUserMaterial ? 'Eliminar equipo propio' : 'Restablecer precio de referencia'}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
            >
              {eliminando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
