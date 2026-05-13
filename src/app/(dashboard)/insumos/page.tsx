'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Package, Users, Drill, Star,
  Plus, Search, Trash2, Edit2,
  ShieldCheck, Loader2, Info, X, Save, UserPlus, Minus
} from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { formatearCOP } from '@/lib/utils/formato-cop';
import {
  getMaterials, getLabor, getEquipment, getUserMaterials,
  createUserMaterial, deleteUserMaterial, updateUserMaterial,
} from '@/actions/insumos';
import {
  getCuadrillas, getTrabajadores, crearCuadrillaPersonalizada, deleteCuadrilla,
  importarLaborComoTrabajador,
} from '@/actions/cuadrillas';
import { cn } from '@/lib/utils';

type TabId = 'material' | 'labor' | 'equipment' | 'user' | 'crews';

interface UserMaterial {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  unidad: string;
  precio_unitario: number;
}

interface TrabajadorSeleccionado {
  id: string;
  especialidad: string;
  categoria: string;
  jornal_base: number;
  factor_prestacional: number;
  cantidad: number;
}

export default function InsumosPage() {
  const [tab, setTab] = useState<TabId>('material');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // ── Modal insumo propio ─────────────────────────────────────────────────
  const [showInsumoModal, setShowInsumoModal] = useState(false);
  const [editItem, setEditItem] = useState<UserMaterial | null>(null);
  const [savingInsumo, setSavingInsumo] = useState(false);
  const [insumoError, setInsumoError] = useState('');
  const [deletingInsumoId, setDeletingInsumoId] = useState<string | null>(null);

  // ── Modal cuadrilla ─────────────────────────────────────────────────────
  const [showCuadrillaModal, setShowCuadrillaModal] = useState(false);
  const [trabajadoresDisponibles, setTrabajadoresDisponibles] = useState<any[]>([]);
  const [loadingTrabajadores, setLoadingTrabajadores] = useState(false);
  const [trabajadoresSeleccionados, setTrabajadoresSeleccionados] = useState<TrabajadorSeleccionado[]>([]);
  const [trabajadorElegido, setTrabajadorElegido] = useState('');
  const [cantidadTrabajador, setCantidadTrabajador] = useState(1);
  const [savingCuadrilla, setSavingCuadrilla] = useState(false);
  const [cuadrillaError, setCuadrillaError] = useState('');
  const [deletingCuadrillaId, setDeletingCuadrillaId] = useState<string | null>(null);
  const cuadrillaFormRef = useRef<HTMLFormElement>(null);
  // ── Importar desde catálogo Mano de Obra ────────────────────────────────
  const [laborCatalog, setLaborCatalog] = useState<any[]>([]);
  const [busquedaLabor, setBusquedaLabor] = useState('');
  const [showLaborImport, setShowLaborImport] = useState(false);
  const [importandoLaborId, setImportandoLaborId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      let res;
      if (tab === 'material') res = await getMaterials();
      else if (tab === 'labor') res = await getLabor();
      else if (tab === 'equipment') res = await getEquipment();
      else if (tab === 'user') res = await getUserMaterials();
      else if (tab === 'crews') res = await getCuadrillas();
      setData(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ── Handlers insumo ────────────────────────────────────────────────────
  function openCreateInsumo() {
    setEditItem(null);
    setInsumoError('');
    setShowInsumoModal(true);
    if (tab !== 'user') setTab('user');
  }
  function openEditInsumo(item: UserMaterial) {
    setEditItem(item);
    setInsumoError('');
    setShowInsumoModal(true);
  }
  function closeInsumoModal() {
    setShowInsumoModal(false);
    setEditItem(null);
    setInsumoError('');
  }
  async function handleInsumoSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    setSavingInsumo(true);
    setInsumoError('');
    const fd = new FormData(e.currentTarget);
    const result = editItem
      ? await updateUserMaterial(editItem.id, fd)
      : await createUserMaterial(fd);
    setSavingInsumo(false);
    if (!result.success) { setInsumoError(result.error || 'Error al guardar'); return; }
    closeInsumoModal();
    loadData();
  }
  async function handleDeleteInsumo(id: string) {
    if (!confirm('¿Eliminar este insumo personalizado?')) return;
    setDeletingInsumoId(id);
    const result = await deleteUserMaterial(id);
    setDeletingInsumoId(null);
    if (!result.success) { alert(result.error || 'Error al eliminar'); return; }
    loadData();
  }

  // ── Handlers cuadrilla ─────────────────────────────────────────────────
  async function openCreateCuadrilla() {
    setCuadrillaError('');
    setTrabajadoresSeleccionados([]);
    setTrabajadorElegido('');
    setCantidadTrabajador(1);
    setShowLaborImport(false);
    setBusquedaLabor('');
    setShowCuadrillaModal(true);
    if (tab !== 'crews') setTab('crews');
    // Carga trabajadores y catálogo labor en paralelo la primera vez
    const promises: Promise<void>[] = [];
    if (trabajadoresDisponibles.length === 0) {
      setLoadingTrabajadores(true);
      promises.push(getTrabajadores().then(list => {
        setTrabajadoresDisponibles(list);
        setLoadingTrabajadores(false);
      }));
    }
    if (laborCatalog.length === 0) {
      promises.push(getLabor().then(list => setLaborCatalog(list || [])));
    }
    await Promise.all(promises);
  }

  async function handleImportarLabor(labor: any) {
    setImportandoLaborId(labor.id);
    setCuadrillaError('');
    const result = await importarLaborComoTrabajador(labor.id);
    setImportandoLaborId(null);
    if (!result.success || !result.trabajador) {
      setCuadrillaError(result.error || 'Error al importar trabajador');
      return;
    }
    const t = result.trabajador;
    // Añadir al catálogo disponible si aún no está
    if (!trabajadoresDisponibles.some(td => td.id === t.id)) {
      setTrabajadoresDisponibles(prev => [...prev, t]);
    }
    // Añadir directamente a la selección si no está
    if (!trabajadoresSeleccionados.some(ts => ts.id === t.id)) {
      setTrabajadoresSeleccionados(prev => [...prev, {
        id: t.id,
        especialidad: t.especialidad,
        categoria: t.categoria,
        jornal_base: t.jornal_base,
        factor_prestacional: t.factor_prestacional ?? 1.5988,
        cantidad: 1,
      }]);
    }
  }
  function closeCuadrillaModal() {
    setShowCuadrillaModal(false);
    setCuadrillaError('');
  }
  function agregarTrabajador() {
    const t = trabajadoresDisponibles.find(t => t.id === trabajadorElegido);
    if (!t) return;
    if (trabajadoresSeleccionados.some(s => s.id === t.id)) return; // ya está
    setTrabajadoresSeleccionados(prev => [...prev, {
      id: t.id,
      especialidad: t.especialidad,
      categoria: t.categoria,
      jornal_base: t.jornal_base,
      factor_prestacional: t.factor_prestacional ?? 1.5988,
      cantidad: cantidadTrabajador,
    }]);
    setTrabajadorElegido('');
    setCantidadTrabajador(1);
  }
  function quitarTrabajador(id: string) {
    setTrabajadoresSeleccionados(prev => prev.filter(t => t.id !== id));
  }
  async function handleCuadrillaSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    if (trabajadoresSeleccionados.length === 0) {
      setCuadrillaError('Agrega al menos un trabajador a la cuadrilla');
      return;
    }
    const fd = new FormData(e.currentTarget);
    setSavingCuadrilla(true);
    setCuadrillaError('');
    const result = await crearCuadrillaPersonalizada({
      nombre: fd.get('nombre') as string,
      descripcion: fd.get('descripcion') as string || undefined,
      categoria_actividad: fd.get('categoria_actividad') as string || undefined,
      trabajadores: trabajadoresSeleccionados.map(t => ({
        trabajador_id: t.id,
        cantidad: t.cantidad,
      })),
    });
    setSavingCuadrilla(false);
    if (!result.success) { setCuadrillaError(result.error || 'Error al crear'); return; }
    closeCuadrillaModal();
    loadData();
  }
  async function handleDeleteCuadrilla(id: string) {
    if (!confirm('¿Eliminar esta cuadrilla personalizada?')) return;
    setDeletingCuadrillaId(id);
    const result = await deleteCuadrilla(id);
    setDeletingCuadrillaId(null);
    if (!result.success) { alert(result.error || 'Error al eliminar'); return; }
    loadData();
  }

  // ── Costo jornada de una cuadrilla ────────────────────────────────────
  function costoJornadaCuadrilla(cuadrilla: any): number {
    return (cuadrilla.trabajadores || []).reduce(
      (s: number, t: any) => s + t.jornal_base * t.factor_prestacional * t.cantidad, 0
    );
  }

  const filteredData = data.filter(item =>
    (item.nombre || item.especialidad || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Catálogo de Insumos</h1>
          <p className="text-slate-500 mt-1">Gestiona los materiales, cuadrillas y equipos base para tus presupuestos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Filtrar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-600 outline-none w-64 transition-all"
            />
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={tab === 'crews' ? openCreateCuadrilla : openCreateInsumo}
          >
            {tab === 'crews' ? 'Nueva Cuadrilla' : 'Agregar Propio'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto custom-scrollbar">
        {[
          { id: 'material', label: 'Materiales', icon: Package },
          { id: 'labor', label: 'Mano de Obra', icon: Users },
          { id: 'equipment', label: 'Equipos', icon: Drill },
          { id: 'user', label: 'Mis Insumos', icon: Star },
          { id: 'crews', label: 'Cuadrillas', icon: ShieldCheck },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as TabId)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative",
              tab === t.id
                ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-blue-600 after:rounded-t-full"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <Card padding="none" className="overflow-hidden border-slate-200 shadow-sm bg-white">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando catálogo...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* ── Tabla genérica: material | labor | equipment | user ── */}
            {tab !== 'crews' && (
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Unidad / Categoría</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Precio Ref. (COP)</th>
                    <th className="px-6 py-4 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded flex items-center justify-center shrink-0",
                            tab === 'material' ? "bg-emerald-50 text-emerald-600" :
                            tab === 'labor' ? "bg-blue-50 text-blue-600" :
                            tab === 'equipment' ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-600"
                          )}>
                            {tab === 'material' ? <Package className="h-4 w-4" /> :
                             tab === 'labor' ? <Users className="h-4 w-4" /> :
                             tab === 'equipment' ? <Drill className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{item.nombre || item.especialidad}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{item.departamento || 'Referencia Nacional'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">{item.unidad || 'Día'}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{item.categoria || item.oficio || item.tipo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-slate-900">{formatearCOP(item.precio_referencia || item.precio_diario || item.precio_unitario || item.jornal_base)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tab === 'user' ? (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditInsumo(item as UserMaterial)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600" title="Editar">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteInsumo(item.id)} disabled={deletingInsumoId === item.id} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 disabled:opacity-40" title="Eliminar">
                              {deletingInsumoId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Sistema</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── Tabla específica: cuadrillas ── */}
            {tab === 'crews' && (
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Cuadrilla</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Trabajadores</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Costo / Jornada (COP)</th>
                    <th className="px-6 py-4 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{item.nombre}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase">
                              {item.categoria_actividad || 'Sin categoría'} · {item.es_sistema ? 'Sistema' : 'Personalizada'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(item.trabajadores || []).slice(0, 3).map((t: any, i: number) => (
                            <span key={i} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                              {t.cantidad > 1 ? `${t.cantidad}×` : ''}{t.especialidad}
                            </span>
                          ))}
                          {(item.trabajadores || []).length > 3 && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                              +{item.trabajadores.length - 3} más
                            </span>
                          )}
                          {(item.trabajadores || []).length === 0 && (
                            <span className="text-[10px] text-slate-300">Sin trabajadores</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-slate-900">{formatearCOP(costoJornadaCuadrilla(item))}</p>
                        <p className="text-[10px] text-slate-400">con prestaciones</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!item.es_sistema ? (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDeleteCuadrilla(item.id)}
                              disabled={deletingCuadrillaId === item.id}
                              className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 disabled:opacity-40"
                              title="Eliminar"
                            >
                              {deletingCuadrillaId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Sistema</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Estado vacío */}
            {filteredData.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center text-center px-6">
                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  {tab === 'user' ? <Star className="h-8 w-8 text-slate-200" /> :
                   tab === 'crews' ? <ShieldCheck className="h-8 w-8 text-slate-200" /> :
                   <Info className="h-8 w-8 text-slate-200" />}
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {tab === 'user' ? 'Aún no tienes insumos propios' :
                   tab === 'crews' ? 'No hay cuadrillas disponibles' :
                   'No se encontraron resultados'}
                </h3>
                <p className="text-slate-500 text-sm max-w-xs mt-1">
                  {tab === 'user' ? 'Haz clic en "Agregar Propio" para crear tu primer insumo personalizado.' :
                   tab === 'crews' ? 'Crea tu primera cuadrilla personalizada o verifica que el catálogo base esté cargado.' :
                   'Intenta con otra palabra clave o cambia de pestaña.'}
                </p>
                {(tab === 'user' || tab === 'crews') && (
                  <button
                    onClick={tab === 'crews' ? openCreateCuadrilla : openCreateInsumo}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    {tab === 'crews' ? 'Crear Cuadrilla' : 'Agregar Insumo Propio'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Info Box */}
      <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-black uppercase tracking-tight italic">Base de Datos 2026 Integrada</h2>
            <p className="text-blue-100 text-sm max-w-xl font-medium opacity-90">
              SIPO incluye por defecto los precios de referencia de la metodología IDU / INVIAS actualizados.
              Puedes agregar tus propios insumos y cuadrillas personalizadas para un control total de costos.
            </p>
          </div>
          <ShieldCheck className="h-24 w-24 text-blue-400/30 absolute right-8 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* ══ MODAL: Insumo propio ══ */}
      {showInsumoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeInsumoModal} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                {editItem ? 'Editar Insumo' : 'Nuevo Insumo Propio'}
              </h2>
              <button onClick={closeInsumoModal} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleInsumoSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Nombre <span className="text-red-500">*</span></label>
                <input name="nombre" defaultValue={editItem?.nombre || ''} required maxLength={200} placeholder="Ej: Cemento Portland Tipo I" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Tipo <span className="text-red-500">*</span></label>
                <select name="tipo" defaultValue={editItem?.tipo || 'material'} required className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all bg-white">
                  <option value="material">Material</option>
                  <option value="mano_obra">Mano de Obra</option>
                  <option value="equipo">Equipo</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Unidad <span className="text-red-500">*</span></label>
                  <input name="unidad" defaultValue={editItem?.unidad || ''} required maxLength={20} placeholder="kg, m², día" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Precio Unit. <span className="text-red-500">*</span></label>
                  <input name="precio_unitario" type="number" defaultValue={editItem?.precio_unitario ?? ''} required min={0} step="0.01" placeholder="0" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Descripción <span className="text-slate-400 font-normal normal-case">(opcional)</span></label>
                <textarea name="descripcion" defaultValue={editItem?.descripcion || ''} maxLength={500} rows={2} placeholder="Especificaciones adicionales..." className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all resize-none" />
              </div>
              {insumoError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{insumoError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeInsumoModal} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={savingInsumo} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-60">
                  {savingInsumo ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="h-4 w-4" /> {editItem ? 'Guardar Cambios' : 'Crear Insumo'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: Nueva cuadrilla ══ */}
      {showCuadrillaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCuadrillaModal} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Nueva Cuadrilla Personalizada</h2>
              <button onClick={closeCuadrillaModal} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form ref={cuadrillaFormRef} onSubmit={handleCuadrillaSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Nombre y Categoría */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Nombre <span className="text-red-500">*</span></label>
                  <input name="nombre" required maxLength={150} placeholder="Ej: Cuadrilla Mampostería" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Categoría</label>
                  <input name="categoria_actividad" maxLength={100} placeholder="Ej: Mampostería" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Descripción</label>
                  <input name="descripcion" maxLength={300} placeholder="Opcional" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>

              {/* Selector de trabajadores */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Trabajadores <span className="text-red-500">*</span>
                </label>

                {loadingTrabajadores ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando trabajadores...
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={trabajadorElegido}
                      onChange={e => setTrabajadorElegido(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">Selecciona un trabajador...</option>
                      {trabajadoresDisponibles.map(t => (
                        <option key={t.id} value={t.id} disabled={trabajadoresSeleccionados.some(s => s.id === t.id)}>
                          {t.especialidad} · {t.categoria} · {formatearCOP(t.jornal_base)}/día
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={cantidadTrabajador}
                      onChange={e => setCantidadTrabajador(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      max={20}
                      className="w-16 px-2 py-2 border border-slate-200 rounded-xl text-sm text-center focus:border-blue-500 outline-none"
                      title="Cantidad"
                    />
                    <button
                      type="button"
                      onClick={agregarTrabajador}
                      disabled={!trabajadorElegido}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40 transition-colors"
                    >
                      <UserPlus className="h-4 w-4" /> Agregar
                    </button>
                  </div>
                )}

                {/* Importar desde catálogo Mano de Obra */}
                <div className="border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowLaborImport(p => !p)}
                    className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {showLaborImport ? 'Ocultar catálogo' : '¿No encuentras el trabajador? Importar desde Mano de Obra'}
                  </button>

                  {showLaborImport && (
                    <div className="mt-3 space-y-2">
                      <input
                        placeholder="Buscar en catálogo de mano de obra..."
                        value={busquedaLabor}
                        onChange={e => setBusquedaLabor(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all"
                      />
                      <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                        {laborCatalog
                          .filter(l => (l.nombre || '').toLowerCase().includes(busquedaLabor.toLowerCase()))
                          .map(l => {
                            const yaAgregado = trabajadoresSeleccionados.some(t => t.especialidad === l.nombre);
                            return (
                              <div key={l.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50">
                                <div>
                                  <p className="text-xs font-bold text-slate-700">{l.nombre}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {formatearCOP(l.precio_diario)}/día · {l.oficio || 'Mano de obra'}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  disabled={importandoLaborId === l.id || yaAgregado}
                                  onClick={() => handleImportarLabor(l)}
                                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-40 transition-colors uppercase"
                                  title={yaAgregado ? 'Ya agregado' : 'Importar como trabajador'}
                                >
                                  {importandoLaborId === l.id
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : yaAgregado ? '✓' : <><UserPlus className="h-3 w-3" /> Agregar</>
                                  }
                                </button>
                              </div>
                            );
                          })
                        }
                        {laborCatalog.filter(l => (l.nombre || '').toLowerCase().includes(busquedaLabor.toLowerCase())).length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-6">
                            {laborCatalog.length === 0
                              ? 'El catálogo de mano de obra está vacío. Ejecuta npm run seed:catalogo.'
                              : 'No se encontraron resultados para la búsqueda.'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de trabajadores seleccionados */}
                {trabajadoresSeleccionados.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    {trabajadoresSeleccionados.map((t, i) => (
                      <div key={t.id} className={cn("flex items-center justify-between px-4 py-3 text-sm", i > 0 && "border-t border-slate-100")}>
                        <div>
                          <span className="font-bold text-slate-800">{t.cantidad > 1 ? `${t.cantidad}× ` : ''}{t.especialidad}</span>
                          <span className="text-slate-400 ml-2 text-xs">{t.categoria} · {formatearCOP(t.jornal_base * t.factor_prestacional * t.cantidad)}/día c/prest.</span>
                        </div>
                        <button type="button" onClick={() => quitarTrabajador(t.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-right">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costo jornada total: </span>
                      <span className="text-sm font-black text-slate-800">
                        {formatearCOP(trabajadoresSeleccionados.reduce((s, t) => s + t.jornal_base * t.factor_prestacional * t.cantidad, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {cuadrillaError && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{cuadrillaError}</p>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeCuadrillaModal} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={savingCuadrilla} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-60">
                  {savingCuadrilla ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando...</> : <><Save className="h-4 w-4" /> Crear Cuadrilla</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
