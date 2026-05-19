'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Badge } from '@/components/shared/Badge';
import { Card } from '@/components/shared/Card';
import { ModalProveedor } from './ModalProveedor';
import {
  Search, Truck, Building2, User, MapPin,
  Phone, Mail, Globe, MoreVertical, Edit, Trash2, Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/shared/DropdownMenu';
import { eliminarProveedor } from '@/actions/proveedores';
import { toast } from 'sonner';
import type { Proveedor, CategoriaProveedor } from '@/types';
import { CATEGORIA_PROVEEDOR_LABELS } from '@/types';

const CATEGORIA_COLORS: Record<CategoriaProveedor, string> = {
  ferreteria:  'bg-[#E4E7EC]  text-[#1F2937]  border-[#C8CDD6]',
  contratista: 'bg-[#FAF0EB]  text-[#B8440C]  border-[#F0A882]',
  equipos:     'bg-[#EBF2FA]  text-[#1E4D8C]  border-[#A8C4DC]',
  laboratorio: 'bg-[#EBFAF0]  text-[#166534]  border-[#B8D9B8]',
  transporte:  'bg-[#E4E7EC]  text-[#4B5563]  border-[#C8CDD6]',
  servicios:   'bg-[#FEF3E2]  text-[#7A4B00]  border-[#F0D080]',
  otro:        'bg-[#DDE0E6]  text-[#6B7A8D]  border-[#C8CDD6]',
};

interface ProveedoresListProps {
  initialProveedores: Proveedor[];
}

export function ProveedoresList({ initialProveedores }: ProveedoresListProps) {
  const [proveedores, setProveedores] = useState(initialProveedores);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proveedorAEditar, setProveedorAEditar] = useState<Proveedor | undefined>(undefined);

  useEffect(() => {
    setProveedores(initialProveedores);
  }, [initialProveedores]);

  const filtrados = proveedores.filter(p => {
    const matchBusqueda =
      p.nombre_razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.nit_cedula || '').includes(busqueda);
    const matchTipo = filtroTipo === 'todos' || p.tipo === filtroTipo;
    const matchCategoria = filtroCategoria === 'todos' || p.categoria === filtroCategoria;
    return matchBusqueda && matchTipo && matchCategoria;
  });

  const handleNuevo = () => {
    setProveedorAEditar(undefined);
    setIsModalOpen(true);
  };

  const handleEditar = (p: Proveedor) => {
    setProveedorAEditar(p);
    setIsModalOpen(true);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;
    const res = await eliminarProveedor(id);
    if (res.success) {
      toast.success('Proveedor eliminado');
      setProveedores(prev => prev.filter(p => p.id !== id));
    } else {
      toast.error(res.error);
    }
  };

  const handleModalSuccess = (nuevo: Proveedor) => {
    setProveedores(prev => [nuevo, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar por nombre o NIT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            icon={<Search className="h-4 w-4 text-mortar" />}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="h-10 px-3 bg-white border border-concrete rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
          >
            <option value="todos">Todos los tipos</option>
            <option value="empresa">🏢 Persona Jurídica</option>
            <option value="persona">👤 Persona Natural</option>
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="h-10 px-3 bg-white border border-concrete rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
          >
            <option value="todos">Todas las categorías</option>
            {(Object.entries(CATEGORIA_PROVEEDOR_LABELS) as [CategoriaProveedor, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <Button icon={<Plus className="h-4 w-4" />} onClick={handleNuevo}>
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Grid */}
      {filtrados.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-steel-fog p-4 rounded-full mb-4">
            <Truck className="h-8 w-8 text-mortar" />
          </div>
          <h3 className="text-lg font-semibold text-stone">No hay proveedores</h3>
          <p className="text-mortar text-sm max-w-xs mb-6">
            {busqueda || filtroTipo !== 'todos' || filtroCategoria !== 'todos'
              ? 'No se encontraron proveedores con los filtros aplicados.'
              : 'Aún no tienes proveedores registrados en tu catálogo.'}
          </p>
          <Button icon={<Plus className="h-4 w-4" />} onClick={handleNuevo}>
            Nuevo Proveedor
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((p) => (
            <Card
              key={p.id}
              className="group hover:border-[var(--accent-primary)]/30 transition-all p-0 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-5 flex justify-between items-start border-b border-concrete/50">
                <div className="space-y-1.5 min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.tipo === 'empresa' ? (
                      <Badge className="bg-[#EBF2FA] text-[#1E4D8C] border border-[#A8C4DC] py-0.5 px-2 text-[10px]">
                        <Building2 className="h-3 w-3 mr-1" /> Jurídica
                      </Badge>
                    ) : (
                      <Badge className="bg-[#E4E7EC] text-[#4B5563] border border-[#C8CDD6] py-0.5 px-2 text-[10px]">
                        <User className="h-3 w-3 mr-1" /> Natural
                      </Badge>
                    )}
                    <Badge className={`border py-0.5 px-2 text-[10px] ${CATEGORIA_COLORS[p.categoria]}`}>
                      {CATEGORIA_PROVEEDOR_LABELS[p.categoria]}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-stone leading-tight group-hover:text-[var(--accent-primary)] transition-colors truncate">
                    {p.nombre_razon_social}
                  </h3>
                  <p className="text-xs text-mortar">{p.nit_cedula || 'Sin NIT/Cédula'}</p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-steel-fog rounded-lg text-mortar transition-colors shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditar(p)}>
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleEliminar(p.id)}
                      className="text-danger-text focus:bg-danger-text/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 space-y-3">
                {p.ciudad && (
                  <div className="flex items-center text-xs text-stone gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-mortar shrink-0" />
                    {p.ciudad}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {p.telefono && (
                    <a
                      href={`tel:${p.telefono}`}
                      className="p-2 bg-steel-fog hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] rounded-full transition-colors"
                      title={p.telefono}
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  {p.email && (
                    <a
                      href={`mailto:${p.email}`}
                      className="p-2 bg-steel-fog hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] rounded-full transition-colors"
                      title={p.email}
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {p.sitio_web && (
                    <a
                      href={p.sitio_web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-steel-fog hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] rounded-full transition-colors"
                      title={p.sitio_web}
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {p.notas && (
                  <p className="text-xs text-mortar line-clamp-2 pt-1">{p.notas}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ModalProveedor
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        proveedor={proveedorAEditar}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
