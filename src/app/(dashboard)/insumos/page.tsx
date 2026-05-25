'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Package, Drill, Star, HardHat,
  Plus, Search, Trash2, Edit2,
  ShieldCheck, Loader2, Info, X, Save, UserPlus, Minus, Copy
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
  updateCuadrilla, importarLaborComoTrabajador,
} from '@/actions/cuadrillas';
import { cn } from '@/lib/utils';

type TabId = 'material' | 'equipment' | 'labor' | 'user' | 'crews';

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

  const [showInsumoModal, setShowInsumoModal] = useState(false);
  const [editItem, setEditItem] = useState<UserMaterial | null>(null);
  const [prefillData, setPrefillData] = useState<Partial<UserMaterial> | null>(null);
  const [savingInsumo, setSavingInsumo] = useState(false);
  const [insumoError, setInsumoError] = useState('');
  const [deletingInsumoId, setDeletingInsumoId] = useState<string | null>(null);

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
  const cuadrillaFormRef = useRef<HTMLFormElement>(null);
  const [laborCatalog, setLaborCatalog] = useState<any[]>([]);
  const [busquedaLabor, setBusquedaLabor] = useState('');
  const [showLaborImport, setShowLaborImport] = useState(false);
  const [importandoLaborId, setImportandoLaborId] = useState<string | null>(null);

  // FIX 5: estado rendimiento base
  const [rendimientoNormal, setRendimientoNormal] = useState('');
  const [rendimientoUnidad, setRendimientoUnidad] = useState('m²');
  const [rendimientoFuente, setRendimientoFuente] = useState('SIPO Colombia 2026');

  useEffect(() => { loadData(); }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      let res;
      if (tab === 'material') res = await getMaterials();
      else if (tab === 'equipment') res = await getEquipment();
      else if (tab === 'labor') res = await getTrabajadores();
      else if (tab === 'user') res = await getUserMaterials();
      else if (tab === 'crews') res = await getCuadrillas();
      setData(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openCreateInsumo() {
    setEditItem(null);
    setPrefillData(null);
    setInsumoError('');
    setShowInsumoModal(true);
    if (tab !== 'user') setTab('user');
  }
  function openImportarACatalogo(item: any) {
    setEditItem(null);
    setInsumoError('');
    const tipo = tab === 'equipment' ? 'equipo' : tab === 'labor' ? 'mano_obra' : 'material';
    const precio = item.precio_referencia ?? item.precio_diario ?? item.jornal_con_prestaciones ?? 0;
    const unidad = item.unidad || (tab === 'equipment' ? 'día' : tab === 'labor' ? 'jornal' : 'und');
    const nombre = item.nombre ?? item.especialidad ?? '';
    setPrefillData({ nombre, tipo, unidad, precio_unitario: precio });
    setShowInsumoModal(true);
  }
  function openEditInsumo(item: UserMaterial) {
    setEditItem(item);
    setPrefillData(null);
    setInsumoError('');
    setShowInsumoModal(true);
  }
  function closeInsumoModal() {
    setShowInsumoModal(false);
    setEditItem(null);
    setPrefillData(null);
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

  async function openEditCuadrilla(cuadrilla: any) {
    setEditCuadrilla(cuadrilla);
    setCuadrillaError('');
    setTrabajadoresSeleccionados(
      (cuadrilla.trabajadores || []).map((t: any) => ({
        id: t.id,
        especialidad: t.especialidad,
        categoria: t.categoria,
        jornal_base: t.jornal_base,
        factor_prestacional: t.factor_prestacional ?? 1.5988,
        cantidad: t.cantidad,
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
    setCuadrillaModalKey(k => k + 1);
    setShowCuadrillaModal(true);
    if (trabajadoresDisponibles.length === 0) {
      setLoadingTrabajadores(true);
      const list = await getTrabajadores();
      const unicos = list.filter((t, i, self) => i === self.findIndex(x => x.id === t.id));
      setTrabajadoresDisponibles(unicos);
      setLoadingTrabajadores(false);
    }
    if (laborCatalog.length === 0) {
      getLabor().then(list => setLaborCatalog(list || []));
    }
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
    setCuadrillaModalKey(k => k + 1);
    setShowCuadrillaModal(true);
    if (tab !== 'crews') setTab('crews');
    const promises: Promise<void>[] = [];
    if (trabajadoresDisponibles.length === 0) {
      setLoadingTrabajadores(true);
      // FIX 2: deduplicar por id para evitar entradas repetidas
      promises.push(getTrabajadores().then(list => {
        const unicos = list.filter((t, i, self) =>
          i === self.findIndex(x => x.id === t.id)
        );
        setTrabajadoresDisponibles(unicos);
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
    if (!trabajadoresDisponibles.some(td => td.id === t.id)) {
      setTrabajadoresDisponibles(prev => [...prev, t]);
    }
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
    setEditCuadrilla(null);
    setCuadrillaError('');
  }
  function agregarTrabajador() {
    const t = trabajadoresDisponibles.find(t => t.id === trabajadorElegido);
    if (!t) return;
    if (trabajadoresSeleccionados.some(s => s.id === t.id)) return;
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
    // FIX 5: incluir rendimiento si fue diligenciado
    const payload = {
      nombre: fd.get('nombre') as string,
      descripcion: fd.get('descripcion') as string || undefined,
      categoria_actividad: fd.get('categoria_actividad') as string || undefined,
      trabajadores: trabajadoresSeleccionados.map(t => ({
        trabajador_id: t.id,
        cantidad: t.cantidad,
      })),
      rendimiento_normal: rendimientoNormal ? Number(rendimientoNormal) : undefined,
      rendimiento_unidad: rendimientoNormal ? rendimientoUnidad : undefined,
      rendimiento_fuente: rendimientoNormal ? rendimientoFuente || 'SIPO Colombia 2026' : undefined,
    };
    const result = editCuadrilla
      ? await updateCuadrilla(editCuadrilla.id, payload)
      : await crearCuadrillaPersonalizada(payload);
    setSavingCuadrilla(false);
    if (!result.success) { setCuadrillaError(result.error || (editCuadrilla ? 'Error al actualizar' : 'Error al crear')); return; }
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

  function costoJornadaCuadrilla(cuadrilla: any): number {
    return (cuadrilla.trabajadores || []).reduce(
      (s: number, t: any) => s + t.jornal_base * t.factor_prestacional * t.cantidad, 0
    );
  }

  const filteredData = data.filter(item =>
    (item.nombre || item.especialidad || '').toLowerCase().includes(search.toLowerCase())
  );

  /* Clases de icono por pestaña */
  const tabIconClass: Record<string, string> = {
    material:  'bg-[#FAF0EB] text-[#D95510]',
    equipment: 'bg-[#EBFAF0] text-[#166534]',
    labor:     'bg-[#EEF2FF] text-[#3730A3]',
    user:      'bg-[#FEF3E2] text-[#7A4B00]',
    crews:     'bg-[#E4E7EC] text-[#4B5563]',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Catálogo de Insumos</h1>
          <p className="text-[#6B7A8D] mt-1 text-sm">Gestiona los materiales, cuadrillas y equipos base para tus presupuestos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7A8D]" />
            <input
              placeholder="Filtrar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-[#C8CDD6] rounded-lg text-sm focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none w-64 transition-all"
            />
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={tab === 'crews' ? openCreateCuadrilla : openCreateInsumo}
          >
            {tab === 'crews' ? 'Nueva Cuadrilla' : tab === 'user' ? 'Agregar Propio' : 'Agregar a Mis Insumos'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#D0D4DB] pb-px overflow-x-auto">
        {[
          { id: 'material',  label: 'Materiales',   icon: Package    },
          { id: 'equipment', label: 'Equipos',       icon: Drill      },
          { id: 'labor',     label: 'Mano de Obra',  icon: HardHat    },
          { id: 'user',      label: 'Mis Insumos',   icon: Star       },
          { id: 'crews',     label: 'Cuadrillas',    icon: ShieldCheck },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as TabId)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all relative whitespace-nowrap",
              tab === t.id
                ? "text-[#D95510] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#D95510] after:rounded-t-full"
                : "text-[#6B7A8D] hover:text-[#4B5563]"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <Card padding="none" className="overflow-hidden border-[#D0D4DB] bg-white">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 text-[#D95510] animate-spin" />
            <p className="text-sm font-semibold text-[#6B7A8D] uppercase tracking-widest">Cargando catálogo...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Tabla genérica: material | equipment | labor | user */}
            {tab !== 'crews' && (
              <table className="w-full text-left">
                <thead className="bg-[#DDE0E6] border-b border-[#D0D4DB]">
                  <tr>
                    <th className="px-6 py-3 text-[9px] font-bold text-[#6B7A8D] uppercase tracking-wide">Descripción</th>
                    <th className="px-6 py-3 text-[9px] font-bold text-[#6B7A8D] uppercase tracking-wide">
                      {tab === 'labor' ? 'Categoría / Ciudad' : 'Unidad / Categoría'}
                    </th>
                    <th className="px-6 py-3 text-[9px] font-bold text-[#6B7A8D] uppercase tracking-wide text-right">
                      {tab === 'labor' ? 'Jornal c/ Prestaciones' : 'Precio Ref. (COP)'}
                    </th>
                    <th className="px-6 py-3 w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC]">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="bg-[#E4E7EC] hover:bg-[#DDE0E6] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                            tabIconClass[tab] ?? tabIconClass.material
                          )}>
                            {tab === 'material'  ? <Package  className="h-4 w-4" /> :
                             tab === 'equipment' ? <Drill    className="h-4 w-4" /> :
                             tab === 'labor'     ? <HardHat  className="h-4 w-4" /> :
                                                   <Star     className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1F2937]">{item.nombre || item.especialidad}</p>
                            <p className="text-[10px] text-[#6B7A8D] font-medium">
                              {tab === 'labor'
                                ? (item.ciudad_referencia || 'Referencia Nacional')
                                : (item.departamento || 'Referencia Nacional')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {tab === 'labor' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#3730A3] bg-[#EEF2FF] px-2 py-0.5 rounded uppercase">{item.categoria || 'Oficial'}</span>
                            <span className="text-[10px] text-[#6B7A8D] font-semibold">Base: {formatearCOP(item.jornal_base)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#4B5563] bg-[#DDE0E6] px-2 py-0.5 rounded uppercase">{item.unidad || 'Día'}</span>
                            <span className="text-[10px] text-[#6B7A8D] font-semibold uppercase">{item.categoria || item.oficio || item.tipo}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tab === 'labor' ? (
                          <div>
                            <p className="text-sm font-bold text-[#1F2937] tabular-nums">{formatearCOP(item.jornal_con_prestaciones)}</p>
                            <p className="text-[10px] text-[#6B7A8D]">factor ×{Number(item.factor_prestacional || 1.5988).toFixed(4)}</p>
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-[#1F2937] tabular-nums">{formatearCOP(item.precio_referencia || item.precio_diario || item.precio_unitario || 0)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tab === 'user' ? (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditInsumo(item as UserMaterial)} className="p-2 hover:bg-[#DDE0E6] rounded-lg text-[#6B7A8D] hover:text-[#4B5563]" title="Editar">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteInsumo(item.id)} disabled={deletingInsumoId === item.id} className="p-2 hover:bg-[#FEF0F0] rounded-lg text-[#6B7A8D] hover:text-[#991B1B] disabled:opacity-40" title="Eliminar">
                              {deletingInsumoId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openImportarACatalogo(item)}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-[#D95510] hover:bg-[#FAF0EB] rounded-lg transition-colors uppercase"
                              title="Copiar a Mis Insumos"
                            >
                              <Copy className="h-3 w-3" /> Copiar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Tabla específica: cuadrillas */}
            {tab === 'crews' && (
              <table className="w-full text-left">
                <thead className="bg-[#DDE0E6] border-b border-[#D0D4DB]">
                  <tr>
                    <th className="px-6 py-3 text-[9px] font-bold text-[#6B7A8D] uppercase tracking-wide">Cuadrilla</th>
                    <th className="px-6 py-3 text-[9px] font-bold text-[#6B7A8D] uppercase tracking-wide">Trabajadores</th>
                    {/* FIX 6: columna rendimiento */}
                    <th className="px-6 py-3 text-[9px] font-bold text-[#6B7A8D] uppercase tracking-wide">Rendimiento</th>
                    <th className="px-6 py-3 text-[9px] font-bold text-[#6B7A8D] uppercase tracking-wide text-right">Costo / Jornada (COP)</th>
                    <th className="px-6 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC]">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="bg-[#E4E7EC] hover:bg-[#DDE0E6] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-[#E4E7EC] border border-[#C8CDD6] text-[#4B5563] flex items-center justify-center shrink-0">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1F2937]">{item.nombre}</p>
                            <p className="text-[10px] text-[#6B7A8D] font-medium uppercase">
                              {item.categoria_actividad || 'Sin categoría'} · {item.es_sistema ? 'Sistema' : 'Personalizada'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(item.trabajadores || []).slice(0, 3).map((t: any, i: number) => (
                            <span key={i} className="text-[10px] font-semibold text-[#4B5563] bg-[#DDE0E6] px-2 py-0.5 rounded uppercase">
                              {t.cantidad > 1 ? `${t.cantidad}×` : ''}{t.especialidad}
                            </span>
                          ))}
                          {(item.trabajadores || []).length > 3 && (
                            <span className="text-[10px] font-semibold text-[#6B7A8D] bg-[#ECEEF2] px-2 py-0.5 rounded">
                              +{item.trabajadores.length - 3} más
                            </span>
                          )}
                          {(item.trabajadores || []).length === 0 && (
                            <span className="text-[10px] text-[#6B7A8D]">Sin trabajadores</span>
                          )}
                        </div>
                      </td>
                      {/* FIX 6: celda rendimiento */}
                      <td className="px-6 py-4">
                        {item.rendimientos?.length > 0 ? (
                          <span className="text-xs font-semibold text-[#1F2937]">
                            {item.rendimientos[0].rendimiento_normal} {item.rendimientos[0].unidad}/día
                          </span>
                        ) : (
                          <span className="text-xs text-[#9CA3AF]">— Sin definir</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-[#1F2937] tabular-nums">{formatearCOP(costoJornadaCuadrilla(item))}</p>
                        <p className="text-[10px] text-[#6B7A8D]">con prestaciones</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!item.es_sistema ? (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditCuadrilla(item)}
                              className="p-2 hover:bg-[#DDE0E6] rounded-lg text-[#6B7A8D] hover:text-[#4B5563]"
                              title="Editar"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCuadrilla(item.id)}
                              disabled={deletingCuadrillaId === item.id}
                              className="p-2 hover:bg-[#FEF0F0] rounded-lg text-[#6B7A8D] hover:text-[#991B1B] disabled:opacity-40"
                              title="Eliminar"
                            >
                              {deletingCuadrillaId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-[#C8CDD6] uppercase tracking-tighter">Sistema</span>
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
                <div className="h-16 w-16 rounded-full bg-[#ECEEF2] flex items-center justify-center mb-4">
                  {tab === 'user'  ? <Star       className="h-8 w-8 text-[#C8CDD6]" /> :
                   tab === 'crews' ? <ShieldCheck className="h-8 w-8 text-[#C8CDD6]" /> :
                   tab === 'labor' ? <HardHat     className="h-8 w-8 text-[#C8CDD6]" /> :
                   <Info className="h-8 w-8 text-[#C8CDD6]" />}
                </div>
                <h3 className="text-base font-semibold text-[#1F2937]">
                  {tab === 'user'  ? 'Aún no tienes insumos propios' :
                   tab === 'crews' ? 'No hay cuadrillas disponibles' :
                   'No se encontraron resultados'}
                </h3>
                <p className="text-[#6B7A8D] text-sm max-w-xs mt-1">
                  {tab === 'user'  ? 'Haz clic en "Agregar Propio" para crear tu primer insumo personalizado.' :
                   tab === 'crews' ? 'Crea tu primera cuadrilla personalizada o verifica que el catálogo base esté cargado.' :
                   'Intenta con otra palabra clave o cambia de pestaña.'}
                </p>
                {(tab === 'user' || tab === 'crews') && (
                  <button
                    onClick={tab === 'crews' ? openCreateCuadrilla : openCreateInsumo}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#D95510] text-white rounded-lg text-sm font-semibold hover:bg-[#C04A0D] transition-colors"
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
      <div className="bg-[#1A2535] rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-xl font-bold tracking-tight">Base de Datos 2026 Integrada</h2>
            <p className="text-[#F0A882] text-sm max-w-xl font-medium opacity-90">
              SIPO incluye por defecto los precios de referencia del mercado colombiano actualizados.
              Puedes agregar tus propios insumos y cuadrillas personalizadas para un control total de costos.
            </p>
          </div>
          <ShieldCheck className="h-24 w-24 text-white/10 absolute right-8 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* MODAL: Insumo propio */}
      {showInsumoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeInsumoModal} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D0D4DB] bg-[#ECEEF2]">
              <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider">
                {editItem ? 'Editar Insumo' : prefillData ? 'Copiar a Mis Insumos' : 'Nuevo Insumo Propio'}
              </h2>
              <button onClick={closeInsumoModal} className="p-1.5 hover:bg-[#DDE0E6] rounded-lg transition-colors">
                <X className="h-4 w-4 text-[#6B7A8D]" />
              </button>
            </div>
            <form onSubmit={handleInsumoSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Nombre <span className="text-[#991B1B]">*</span></label>
                <input name="nombre" defaultValue={editItem?.nombre ?? prefillData?.nombre ?? ''} required maxLength={200} placeholder="Ej: Cemento Portland Tipo I" className="w-full px-3 py-2.5 border border-[#C8CDD6] rounded-lg text-sm focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Tipo <span className="text-[#991B1B]">*</span></label>
                <select name="tipo" defaultValue={editItem?.tipo ?? prefillData?.tipo ?? 'material'} required className="w-full px-3 py-2.5 border border-[#C8CDD6] rounded-lg text-sm focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none transition-all bg-white">
                  <option value="material">Material</option>
                  <option value="mano_obra">Mano de Obra</option>
                  <option value="equipo">Equipo</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Unidad <span className="text-[#991B1B]">*</span></label>
                  <input name="unidad" defaultValue={editItem?.unidad ?? prefillData?.unidad ?? ''} required maxLength={20} placeholder="kg, m², día" className="w-full px-3 py-2.5 border border-[#C8CDD6] rounded-lg text-sm focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Precio Unit. <span className="text-[#991B1B]">*</span></label>
                  <input name="precio_unitario" type="number" defaultValue={editItem?.precio_unitario ?? prefillData?.precio_unitario ?? ''} required min={0} step="0.01" placeholder="0" className="w-full px-3 py-2.5 border border-[#C8CDD6] rounded-lg text-sm focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Descripción <span className="text-[#6B7A8D] font-normal normal-case">(opcional)</span></label>
                <textarea name="descripcion" defaultValue={editItem?.descripcion ?? ''} maxLength={500} rows={2} placeholder="Especificaciones adicionales..." className="w-full px-3 py-2.5 border border-[#C8CDD6] rounded-lg text-sm focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none transition-all resize-none" />
              </div>
              {insumoError && <p className="text-xs text-[#991B1B] bg-[#FEF0F0] px-3 py-2 rounded-lg border border-[#F5C2C2]">{insumoError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeInsumoModal} className="flex-1 px-4 py-2.5 border border-[#C8CDD6] rounded-lg text-sm font-semibold text-[#4B5563] hover:bg-[#E4E7EC] transition-colors">Cancelar</button>
                <button type="submit" disabled={savingInsumo} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D95510] text-white rounded-lg text-sm font-semibold hover:bg-[#C04A0D] transition-colors disabled:opacity-60">
                  {savingInsumo ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="h-4 w-4" /> {editItem ? 'Guardar Cambios' : prefillData ? 'Agregar a Mis Insumos' : 'Crear Insumo'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nueva cuadrilla */}
      {showCuadrillaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCuadrillaModal} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D0D4DB] bg-[#ECEEF2] shrink-0">
              <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider">
                {editCuadrilla ? 'Editar Cuadrilla' : 'Nueva Cuadrilla Personalizada'}
              </h2>
              <button onClick={closeCuadrillaModal} className="p-1.5 hover:bg-[#DDE0E6] rounded-lg transition-colors">
                <X className="h-4 w-4 text-[#6B7A8D]" />
              </button>
            </div>

            <form key={cuadrillaModalKey} ref={cuadrillaFormRef} onSubmit={handleCuadrillaSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Nombre <span className="text-[#991B1B]">*</span></label>
                  <input name="nombre" required maxLength={150} defaultValue={editCuadrilla?.nombre ?? ''} placeholder="Ej: Cuadrilla Mampostería" className="w-full px-3 py-2.5 border border-[#C8CDD6] rounded-lg text-sm focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Categoría</label>
                  <input name="categoria_actividad" maxLength={100} defaultValue={editCuadrilla?.categoria_actividad ?? ''} placeholder="Ej: Mampostería" className="w-full px-3 py-2.5 border border-[#C8CDD6] rounded-lg text-sm focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Descripción</label>
                  <input name="descripcion" maxLength={300} defaultValue={editCuadrilla?.descripcion ?? ''} placeholder="Opcional" className="w-full px-3 py-2.5 border border-[#C8CDD6] rounded-lg text-sm focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider">
                  Trabajadores <span className="text-[#991B1B]">*</span>
                </label>

                {loadingTrabajadores ? (
                  <div className="flex items-center gap-2 text-sm text-[#6B7A8D]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#D95510]" /> Cargando trabajadores...
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={trabajadorElegido}
                      onChange={e => setTrabajadorElegido(e.target.value)}
                      className="flex-1 px-3 py-2 border border-[#C8CDD6] rounded-lg text-sm focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none bg-white"
                    >
                      <option value="">Selecciona un trabajador...</option>
                      {/* FIX 4: deshabilitar y marcar trabajadores ya agregados */}
                      {trabajadoresDisponibles.map(t => (
                        <option
                          key={t.id}
                          value={t.id}
                          disabled={trabajadoresSeleccionados.some(s => s.id === t.id)}
                        >
                          {trabajadoresSeleccionados.some(s => s.id === t.id) ? '✓ ' : ''}
                          {t.especialidad} · {t.categoria} · {formatearCOP(t.jornal_base)}/día
                        </option>
                      ))}
                    </select>
                    {/* FIX 1: placeholder y title descriptivo */}
                    <input
                      type="number"
                      value={cantidadTrabajador}
                      onChange={e => setCantidadTrabajador(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      max={20}
                      placeholder="Cant."
                      className="w-16 px-2 py-2 border border-[#C8CDD6] rounded-lg text-sm text-center focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none"
                      title="Cantidad de este trabajador"
                    />
                    <button
                      type="button"
                      onClick={agregarTrabajador}
                      disabled={!trabajadorElegido}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#D95510] text-white rounded-lg text-sm font-semibold hover:bg-[#C04A0D] disabled:opacity-40 transition-colors"
                    >
                      <UserPlus className="h-4 w-4" /> Agregar
                    </button>
                  </div>
                )}

                <div className="border-t border-[#D0D4DB] pt-3">
                  <button
                    type="button"
                    onClick={() => setShowLaborImport(p => !p)}
                    className="flex items-center gap-2 text-xs font-semibold text-[#D95510] hover:text-[#C04A0D] uppercase tracking-wider transition-colors"
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
                        className="w-full px-3 py-2 border border-[#C8CDD6] rounded-lg text-sm focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none transition-all"
                      />
                      <div className="max-h-44 overflow-y-auto border border-[#D0D4DB] rounded-lg divide-y divide-[#E4E7EC]">
                        {laborCatalog
                          .filter(l => (l.nombre || '').toLowerCase().includes(busquedaLabor.toLowerCase()))
                          .map(l => {
                            const yaAgregado = trabajadoresSeleccionados.some(t => t.especialidad === l.nombre);
                            return (
                              <div key={l.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-[#ECEEF2]">
                                <div>
                                  <p className="text-xs font-semibold text-[#1F2937]">{l.nombre}</p>
                                  <p className="text-[10px] text-[#6B7A8D]">
                                    {formatearCOP(l.precio_diario)}/día · {l.oficio || 'Mano de obra'}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  disabled={importandoLaborId === l.id || yaAgregado}
                                  onClick={() => handleImportarLabor(l)}
                                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-[#D95510] hover:bg-[#FAF0EB] rounded-lg disabled:opacity-40 transition-colors uppercase"
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
                          <p className="text-xs text-[#6B7A8D] text-center py-6">
                            {laborCatalog.length === 0
                              ? 'El catálogo de mano de obra está vacío. Ejecuta pnpm run seed:catalogo.'
                              : 'No se encontraron resultados para la búsqueda.'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {trabajadoresSeleccionados.length > 0 && (
                  <div className="border border-[#D0D4DB] rounded-lg overflow-hidden">
                    {trabajadoresSeleccionados.map((t, i) => (
                      <div key={t.id} className={cn("flex items-center justify-between px-4 py-3 text-sm bg-[#E4E7EC]", i > 0 && "border-t border-[#D0D4DB]")}>
                        <div>
                          <span className="font-semibold text-[#1F2937]">{t.cantidad > 1 ? `${t.cantidad}× ` : ''}{t.especialidad}</span>
                          <span className="text-[#6B7A8D] ml-2 text-xs">{t.categoria} · {formatearCOP(t.jornal_base * t.factor_prestacional * t.cantidad)}/día c/prest.</span>
                        </div>
                        <button type="button" onClick={() => quitarTrabajador(t.id)} className="p-1.5 hover:bg-[#FEF0F0] rounded-lg text-[#6B7A8D] hover:text-[#991B1B] transition-colors">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="px-4 py-2 bg-[#DDE0E6] border-t border-[#D0D4DB] text-right">
                      <span className="text-xs font-semibold text-[#6B7A8D] uppercase tracking-wider">Costo jornada total: </span>
                      <span className="text-sm font-bold text-[#1F2937] tabular-nums">
                        {formatearCOP(trabajadoresSeleccionados.reduce((s, t) => s + t.jornal_base * t.factor_prestacional * t.cantidad, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* FIX 5: sección Rendimiento Base */}
              <div className="border border-[#D0D4DB] rounded-xl p-4 space-y-3 bg-[#F8F7F5]">
                <p className="text-[10px] font-bold text-[#4B5563] uppercase tracking-widest">Rendimiento Base <span className="text-[#6B7A8D] font-normal normal-case">(opcional)</span></p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={rendimientoNormal}
                    onChange={e => setRendimientoNormal(e.target.value)}
                    min={0}
                    step="0.01"
                    placeholder="Rendimiento: ej. 8"
                    className="flex-1 px-3 py-2 border border-[#C8CDD6] rounded-lg text-sm focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none transition-all bg-white"
                  />
                  <select
                    value={rendimientoUnidad}
                    onChange={e => setRendimientoUnidad(e.target.value)}
                    className="w-28 px-3 py-2 border border-[#C8CDD6] rounded-lg text-sm focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none bg-white"
                  >
                    {['m²','m³','ml','kg','gl','un','hr','pto','día','ton'].map(u => (
                      <option key={u} value={u}>Unidad: {u}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={rendimientoFuente}
                  onChange={e => setRendimientoFuente(e.target.value)}
                  maxLength={150}
                  placeholder="Fuente: SIPO Colombia 2026"
                  className="w-full px-3 py-2 border border-[#C8CDD6] rounded-lg text-sm focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none transition-all bg-white"
                />
              </div>

              {cuadrillaError && (
                <p className="text-xs text-[#991B1B] bg-[#FEF0F0] px-3 py-2 rounded-lg border border-[#F5C2C2]">{cuadrillaError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeCuadrillaModal} className="flex-1 px-4 py-2.5 border border-[#C8CDD6] rounded-lg text-sm font-semibold text-[#4B5563] hover:bg-[#E4E7EC] transition-colors">Cancelar</button>
                <button type="submit" disabled={savingCuadrilla} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D95510] text-white rounded-lg text-sm font-semibold hover:bg-[#C04A0D] transition-colors disabled:opacity-60">
                  {savingCuadrilla ? <><Loader2 className="h-4 w-4 animate-spin" /> {editCuadrilla ? 'Guardando...' : 'Creando...'}</> : <><Save className="h-4 w-4" /> {editCuadrilla ? 'Guardar Cambios' : 'Crear Cuadrilla'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
