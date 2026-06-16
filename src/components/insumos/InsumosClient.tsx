'use client';

import { useState } from 'react';
import { Package, Users, Wrench, Star, Search, Plus, Trash2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { EmptyState } from '@/components/shared/EmptyState';
import { SelectDropdown } from '@/components/shared/SelectDropdown';
import { createUserMaterial, deleteUserMaterial } from '@/actions/insumos';
import { toast } from 'sonner';

const tabs = [
  { id: 'materiales', label: 'Materiales', icon: Package },
  { id: 'mano_obra', label: 'Mano de obra', icon: Users },
  { id: 'equipos', label: 'Equipos', icon: Wrench },
  { id: 'mis_insumos', label: 'Mis insumos', icon: Star },
];

const CATEGORIAS = [
  'Todos', 'Concretos y cementos', 'Aceros y hierros', 'Ladrillos y bloques',
  'Arena y gravas', 'Maderas', 'Pinturas', 'Eléctricos', 'Hidráulicos',
  'Acabados', 'Impermeabilizantes', 'Pegantes y morteros', 'Cubiertas', 'Otros'
];

const PRESTACIONES = [
  { concepto: 'Salud', pct: 8.5 },
  { concepto: 'Pensión', pct: 12 },
  { concepto: 'ARL (Riesgo V)', pct: 4.35 },
  { concepto: 'Caja de compensación', pct: 4 },
  { concepto: 'SENA', pct: 2 },
  { concepto: 'ICBF', pct: 3 },
  { concepto: 'Cesantías', pct: 8.33 },
  { concepto: 'Intereses cesantías', pct: 1 },
  { concepto: 'Prima de servicios', pct: 8.33 },
  { concepto: 'Vacaciones', pct: 4.17 },
];

const FACTOR_PRESTACIONAL = PRESTACIONES.reduce((s, p) => s + p.pct, 0);

interface InsumosClientProps {
  materials: any[];
  labor: any[];
  equipment: any[];
  userMaterials: any[];
}

export function InsumosClient({ materials, labor, equipment, userMaterials }: InsumosClientProps) {
  const [activeTab, setActiveTab] = useState('materiales');
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('Todos');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [tipoInsumo, setTipoInsumo] = useState('material');

  const filteredMaterials = materials.filter(m =>
    m.nombre.toLowerCase().includes(search.toLowerCase()) &&
    (categoria === 'Todos' || m.categoria === categoria)
  );

  const filteredLabor = labor.filter(l => l.nombre.toLowerCase().includes(search.toLowerCase()));
  const filteredEquipment = equipment.filter(e => e.nombre.toLowerCase().includes(search.toLowerCase()));
  const filteredUser = userMaterials.filter(u => u.nombre.toLowerCase().includes(search.toLowerCase()));

  const handleAddUserMaterial = async (formData: FormData) => {
    setAddLoading(true);
    const res = await createUserMaterial(formData);
    setAddLoading(false);
    if (res.success) {
      toast.success('Insumo guardado');
      setShowAddForm(false);
    } else {
      toast.error(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este insumo?')) return;
    const res = await deleteUserMaterial(id);
    if (res.success) toast.success('Eliminado');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Insumos</h1>
        {activeTab === 'mis_insumos' && (
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowAddForm(!showAddForm)}>
            Agregar insumo
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearch(''); setCategoria('Todos'); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar insumos..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 outline-none"
          />
        </div>
        {activeTab === 'materiales' && (
          <SelectDropdown
            value={categoria}
            onChange={setCategoria}
            options={CATEGORIAS.map(c => ({ value: c, label: c }))}
          />
        )}
      </div>

      {/* Add user material form */}
      {showAddForm && activeTab === 'mis_insumos' && (
        <Card padding="md">
          <form action={handleAddUserMaterial} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <Input name="nombre" label="Nombre *" placeholder="Cemento Argos" required />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Tipo *</label>
              <SelectDropdown
                value={tipoInsumo}
                onChange={setTipoInsumo}
                options={[
                  { value: 'material', label: 'Material' },
                  { value: 'mano_obra', label: 'Mano de obra' },
                  { value: 'equipo', label: 'Equipo' },
                ]}
                name="tipo"
              />
            </div>
            <Input name="unidad" label="Unidad *" placeholder="kg" required />
            <Input name="precio_unitario" label="Precio *" type="number" placeholder="25000" required />
            <Button type="submit" loading={addLoading}>Guardar</Button>
          </form>
        </Card>
      )}

      {/* Content */}
      {activeTab === 'materiales' && (
        <DataTable
          data={filteredMaterials}
          columns={[
            { key: 'nombre', label: 'Material' },
            { key: 'unidad', label: 'Unidad', width: '80px' },
            { key: 'precio_referencia', label: 'Precio ref.', width: '120px', format: (v: number) => formatCurrency(v) },
            { key: 'departamento', label: 'Ciudad', width: '120px' },
            { key: 'categoria', label: 'Categoría', width: '140px' },
          ]}
          emptyMessage="No se encontraron materiales."
        />
      )}

      {activeTab === 'mano_obra' && (
        <div className="space-y-4">
          <DataTable
            data={filteredLabor}
            columns={[
              { key: 'nombre', label: 'Especialidad' },
              { key: 'oficio', label: 'Oficio', width: '120px' },
              { key: 'precio_diario', label: 'Jornal/día', width: '120px', format: (v: number) => formatCurrency(v) },
              { key: 'prestaciones_porcentaje', label: 'Factor prest.', width: '100px', format: (v: number) => `${v || FACTOR_PRESTACIONAL.toFixed(1)}%` },
              { key: 'departamento', label: 'Ciudad', width: '120px' },
            ]}
            emptyMessage="No se encontraron oficios."
          />
          {/* Prestaciones desglose */}
          <Card padding="md" className="max-w-md">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Desglose factor prestacional</p>
            <div className="space-y-1.5">
              {PRESTACIONES.map(p => (
                <div key={p.concepto} className="flex justify-between text-xs">
                  <span className="text-neutral-600">{p.concepto}</span>
                  <span className="font-mono text-neutral-800">{p.pct}%</span>
                </div>
              ))}
              <hr className="border-neutral-200" />
              <div className="flex justify-between text-xs font-bold">
                <span className="text-neutral-900">Total</span>
                <span className="text-primary-600">{FACTOR_PRESTACIONAL.toFixed(2)}%</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'equipos' && (
        <DataTable
          data={filteredEquipment}
          columns={[
            { key: 'nombre', label: 'Equipo' },
            { key: 'tipo', label: 'Tipo', width: '120px' },
            { key: 'precio_diario', label: 'Tarifa/día', width: '120px', format: (v: number) => formatCurrency(v) },
            { key: 'precio_semanal', label: 'Tarifa/sem', width: '120px', format: (v: number) => v ? formatCurrency(v) : '—' },
            { key: 'departamento', label: 'Ciudad', width: '120px' },
          ]}
          emptyMessage="No se encontraron equipos."
        />
      )}

      {activeTab === 'mis_insumos' && (
        <DataTable
          data={filteredUser}
          columns={[
            { key: 'nombre', label: 'Nombre' },
            { key: 'tipo', label: 'Tipo', width: '100px' },
            { key: 'unidad', label: 'Unidad', width: '80px' },
            { key: 'precio_unitario', label: 'Precio', width: '120px', format: (v: number) => formatCurrency(v) },
          ]}
          emptyMessage="No tienes insumos personalizados."
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

// ──── Tabla reutilizable ────
function DataTable({ data, columns, emptyMessage, onDelete }: {
  data: any[];
  columns: { key: string; label: string; width?: string; format?: (v: any) => string }[];
  emptyMessage: string;
  onDelete?: (id: string) => void;
}) {
  if (data.length === 0) {
    return <EmptyState icon="search" title="Sin resultados" description={emptyMessage} />;
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-neutral-400" style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
              {onDelete && <th className="w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {data.map((row, idx) => (
              <tr key={row.id || `row-${idx}`} className="hover:bg-neutral-50/50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-neutral-700">
                    {col.format ? col.format(row[col.key]) : (row[col.key] || '—')}
                  </td>
                ))}
                {onDelete && (
                  <td className="px-2">
                    <button onClick={() => onDelete(row.id)} className="p-1 hover:bg-danger-50 rounded text-neutral-400 hover:text-danger-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-xs text-neutral-400 border-t border-neutral-100">
        {data.length} resultado(s)
      </div>
    </Card>
  );
}
