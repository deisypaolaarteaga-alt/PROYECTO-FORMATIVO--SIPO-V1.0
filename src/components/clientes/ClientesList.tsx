'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Badge } from '@/components/shared/Badge';
import { Card } from '@/components/shared/Card';
import { ModalCliente } from './ModalCliente';
import { 
  Plus, Search, Building2, User, MapPin, 
  Phone, Mail, Briefcase, ChevronRight, MoreVertical,
  Edit, Trash2, ExternalLink
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/shared/DropdownMenu';
import { desactivarCliente } from '@/actions/clientes';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/format';
import Link from 'next/link';

interface ClientesListProps {
  initialClientes: any[];
}

export function ClientesList({ initialClientes }: ClientesListProps) {
  const [clientes, setClientes] = useState(initialClientes);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState<any>(undefined);
  const [isPending, startTransition] = useTransition();

  // Filtrado local para respuesta inmediata
  const clientesFiltrados = clientes.filter(c => {
    const matchesBusqueda = 
      c.nombre_razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.nit_cedula || '').includes(busqueda);
    const matchesTipo = filtroTipo === 'todos' || c.tipo === filtroTipo;
    return matchesBusqueda && matchesTipo;
  });

  const handleNuevo = () => {
    setClienteAEditar(undefined);
    setIsModalOpen(true);
  };

  const handleEditar = (cliente: any) => {
    setClienteAEditar(cliente);
    setIsModalOpen(true);
  };

  const handleDesactivar = async (id: string) => {
    if (confirm('¿Estás seguro de desactivar este cliente?')) {
      const res = await desactivarCliente(id);
      if (res.success) {
        toast.success('Cliente desactivado');
        setClientes(clientes.filter(c => c.id !== id));
      } else {
        toast.error(res.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Input
            placeholder="Buscar por nombre o NIT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            icon={<Search className="h-4 w-4 text-mortar" />}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="h-10 px-3 py-2 bg-white border border-concrete rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
          >
            <option value="todos">Todos los tipos</option>
            <option value="empresa">🏢 Empresas</option>
            <option value="persona_natural">👤 Personas Naturales</option>
          </select>

          <Button icon={<Plus className="h-4 w-4" />} onClick={handleNuevo}>
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Grid */}
      {clientesFiltrados.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-steel-fog p-4 rounded-full mb-4">
            <User className="h-8 w-8 text-mortar" />
          </div>
          <h3 className="text-lg font-semibold text-stone">No hay clientes</h3>
          <p className="text-mortar text-sm max-w-xs mb-6">
            {busqueda || filtroTipo !== 'todos' 
              ? 'No se encontraron clientes con los filtros aplicados.' 
              : 'Aún no tienes clientes registrados en tu catálogo.'}
          </p>
          {!busqueda && filtroTipo === 'todos' && (
            <Button onClick={handleNuevo}>Registrar primer cliente</Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.map((cliente) => (
            <Card key={cliente.id} className="group hover:border-[var(--accent-primary)]/30 transition-all p-0 overflow-hidden flex flex-col">
              {/* Card Header */}
              <div className="p-5 flex justify-between items-start border-b border-concrete/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {cliente.tipo === 'empresa' ? (
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-100 py-0.5 px-2 text-[10px]">
                        <Building2 className="h-3 w-3 mr-1" /> Empresa
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-100 py-0.5 px-2 text-[10px]">
                        <User className="h-3 w-3 mr-1" /> Persona Natural
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-stone leading-tight group-hover:text-[var(--accent-primary)] transition-colors">
                    {cliente.nombre_razon_social}
                  </h3>
                  <p className="text-xs text-mortar">
                    {cliente.nit_cedula || 'Sin NIT/Cédula'}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-steel-fog rounded-lg text-mortar transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/clientes/${cliente.id}`}>
                        <ExternalLink className="h-4 w-4 mr-2" /> Ver detalle
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditar(cliente)}>
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDesactivar(cliente.id)} className="text-danger-text focus:bg-danger-text/10">
                      <Trash2 className="h-4 w-4 mr-2" /> Desactivar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-mortar tracking-wider">Ubicación</p>
                    <div className="flex items-center text-xs text-stone">
                      <MapPin className="h-3 w-3 mr-1 text-mortar" />
                      {cliente.ciudad || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] uppercase font-bold text-mortar tracking-wider">Contacto</p>
                    <p className="text-xs text-stone font-medium truncate">
                      {cliente.nombre_contacto || 'No asignado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  {cliente.telefono && (
                    <a 
                      href={`tel:${cliente.telefono}`}
                      className="p-2 bg-steel-fog hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] rounded-full transition-colors"
                      title={cliente.telefono}
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  {cliente.email && (
                    <a 
                      href={`mailto:${cliente.email}`}
                      className="p-2 bg-steel-fog hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] rounded-full transition-colors"
                      title={cliente.email}
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Card Footer (Stats) */}
              <div className="bg-steel-fog/30 p-4 border-t border-concrete/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-mortar" />
                  <span className="text-xs font-semibold text-stone">
                    {cliente.total_proyectos || 0}
                  </span>
                  <span className="text-[10px] text-mortar uppercase font-medium">Proyectos</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-mortar uppercase font-medium leading-none mb-1">Inversión Total</p>
                  <p className="text-sm font-bold text-stone">
                    {formatCurrency(cliente.valor_total_proyectos || 0)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ModalCliente 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        cliente={clienteAEditar}
      />
    </div>
  );
}
