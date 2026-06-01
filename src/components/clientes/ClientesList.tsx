'use client';

import { useState, useEffect, useMemo, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Building2, User, MoreVertical,
  Edit, UserX, UserCheck, ExternalLink, Plus, Download,
  ChevronLeft, ChevronRight,
  ChevronDown, MapPin, Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/shared/DropdownMenu';
import { ModalCliente } from './ModalCliente';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { toggleActivoCliente, getClientes } from '@/actions/clientes';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

const PAGE_SIZE = 10;

const AVATAR_COLORS = [
  { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]' },
  { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]' },
  { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]' },
  { bg: 'bg-[#FCE7F3]', text: 'text-[#9D174D]' },
  { bg: 'bg-[#EDE9FE]', text: 'text-[#5B21B6]' },
  { bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' },
];

function getInitials(nombre: string): string {
  const words = nombre.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getAvatarColor(id: string) {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return 'Hace un momento';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
  return `Hace ${Math.floor(weeks / 4)} mes(es)`;
}

function DonutChart({ total, empresa, natural }: { total: number; empresa: number; natural: number }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const GAP = 4; // px gap between segments
  if (total === 0) {
    return (
      <div className="relative w-36 h-36 mx-auto">
        <svg viewBox="0 0 160 160" className="w-full h-full">
          <circle cx="80" cy="80" r={R} fill="none" stroke="#F3F4F6" strokeWidth="18" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#111827]">0</span>
          <span className="text-[11px] text-[#6B7280]">Total</span>
        </div>
      </div>
    );
  }

  const empresaArc = (empresa / total) * C;
  const naturalArc = (natural / total) * C;
  const showGap = empresa > 0 && natural > 0;
  const gap = showGap ? GAP : 0;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 160 160" className="w-full h-full">
        {/* Track */}
        <circle cx="80" cy="80" r={R} fill="none" stroke="#F3F4F6" strokeWidth="18" />
        {/* Empresa segment (blue) */}
        {empresa > 0 && (
          <circle
            cx="80" cy="80" r={R} fill="none"
            stroke="#1E6FB8" strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={`${Math.max(0, empresaArc - gap)} ${C - Math.max(0, empresaArc - gap)}`}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
          />
        )}
        {/* Natural segment (green) */}
        {natural > 0 && (
          <circle
            cx="80" cy="80" r={R} fill="none"
            stroke="#2D7A45" strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={`${Math.max(0, naturalArc - gap)} ${C - Math.max(0, naturalArc - gap)}`}
            strokeDashoffset={-(empresaArc)}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-[#111827]">{total}</span>
        <span className="text-[11px] text-[#6B7280]">Total</span>
      </div>
    </div>
  );
}

const TIPO_OPTIONS = [
  { value: 'todos', label: 'Todos los tipos' },
  { value: 'empresa', label: 'Persona Jurídica' },
  { value: 'persona_natural', label: 'Persona Natural' },
];

interface ClientesListProps {
  initialClientes: any[];
}

export function ClientesList({ initialClientes }: ClientesListProps) {
  // allClientes: lista completa para estadísticas del sidebar (se actualiza con cada refresh del server)
  const [allClientes, setAllClientes] = useState(initialClientes);
  // filteredClientes: resultado de la última búsqueda server-side (inicio = lista completa)
  const [filteredClientes, setFilteredClientes] = useState(initialClientes);

  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCiudad, setFiltroCiudad] = useState('todas');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState<any>(undefined);
  const [confirmInhabilitar, setConfirmInhabilitar] = useState<{ id: string; nombre: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();

  // Cuando el server hace refresh (crear/editar/toggle), sincroniza el sidebar y resetea la tabla
  useEffect(() => {
    setAllClientes(initialClientes);
    setFilteredClientes(initialClientes);
    setBusqueda('');
    setFiltroTipo('todos');
    setFiltroCiudad('todas');
    setMostrarInactivos(false);
    setPagina(1);
  }, [initialClientes]);

  // Ciudades únicas extraídas de la lista completa (para el dropdown de ciudad)
  const ciudades = useMemo(() => {
    const set = new Set(allClientes.map(c => c.ciudad).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [allClientes]);

  function fetchFiltered(q: string, tipo: string, ciudad: string, inactivos: boolean) {
    startTransition(async () => {
      const data = await getClientes({
        busqueda: q || undefined,
        tipo: tipo !== 'todos' ? tipo : undefined,
        ciudad: ciudad !== 'todas' ? ciudad : undefined,
        mostrarInactivos: inactivos,
      });
      setFilteredClientes(data);
    });
  }

  function handleBusqueda(q: string) {
    setBusqueda(q);
    setPagina(1);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => fetchFiltered(q, filtroTipo, filtroCiudad, mostrarInactivos), 300);
  }

  function handleFiltroTipo(tipo: string) {
    setFiltroTipo(tipo);
    setPagina(1);
    fetchFiltered(busqueda, tipo, filtroCiudad, mostrarInactivos);
  }

  function handleFiltroCiudad(ciudad: string) {
    setFiltroCiudad(ciudad);
    setPagina(1);
    fetchFiltered(busqueda, filtroTipo, ciudad, mostrarInactivos);
  }

  function handleToggleMostrarInactivos() {
    const next = !mostrarInactivos;
    setMostrarInactivos(next);
    setPagina(1);
    fetchFiltered(busqueda, filtroTipo, filtroCiudad, next);
  }

  const totalPaginas = Math.max(1, Math.ceil(filteredClientes.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const clientesPagina = filteredClientes.slice(
    (paginaActual - 1) * PAGE_SIZE,
    paginaActual * PAGE_SIZE,
  );

  // Sidebar usa allClientes (no se ve afectada por filtros activos)
  const totalEmpresa = allClientes.filter(c => c.tipo === 'empresa').length;
  const totalNatural = allClientes.filter(c => c.tipo === 'persona_natural').length;
  const actividadReciente = useMemo(() =>
    [...allClientes]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5),
    [allClientes],
  );

  async function handleInhabilitar() {
    if (!confirmInhabilitar) return;
    const { id } = confirmInhabilitar;
    setConfirmInhabilitar(null);
    const res = await toggleActivoCliente(id, false);
    if (res.success) {
      toast.success('Cliente inhabilitado');
      router.refresh();
    } else {
      toast.error(res.error || 'Error al inhabilitar cliente');
    }
  }

  async function handleHabilitar(clienteId: string) {
    const res = await toggleActivoCliente(clienteId, true);
    if (res.success) {
      toast.success('Cliente habilitado');
      router.refresh();
    } else {
      toast.error(res.error || 'Error al habilitar cliente');
    }
  }

  function handleExportar() {
    const headers = ['Nombre/Razón Social', 'NIT/Cédula', 'Tipo', 'Contacto', 'Cargo', 'Email', 'Teléfono', 'Ciudad', 'Proyectos', 'Presupuestos', 'Inversión Total'];
    const rows = filteredClientes.map(c => [
      c.nombre_razon_social, c.nit_cedula || '',
      c.tipo === 'empresa' ? 'Persona Jurídica' : 'Persona Natural',
      c.nombre_contacto || '', c.cargo_contacto || '',
      c.email || '', c.telefono || '', c.ciudad || '',
      c.total_proyectos || 0, c.total_presupuestos || 0, c.valor_total_proyectos || 0,
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const ciudadLabel = filtroCiudad === 'todas' ? 'Todas las ciudades' : filtroCiudad;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* ── Left: filters + table ── */}
      <div className="flex-1 min-w-0 space-y-3">

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, NIT o contacto..."
              value={busqueda}
              onChange={e => handleBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 h-10 border border-[#E8E4DE] rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#C84B1A]/20 focus:border-[#C84B1A] placeholder:text-[#9CA3AF] text-[#374151]"
            />
          </div>

          {/* Tipo filter — pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {TIPO_OPTIONS.map(opt => {
              const active = filtroTipo === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleFiltroTipo(opt.value)}
                  className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#C84B1A] text-white shadow-sm'
                      : 'bg-white border border-[#E8E4DE] text-[#6B7280] hover:border-[#C84B1A] hover:text-[#C84B1A]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Ciudad filter — solo visible si hay ciudades registradas */}
          {ciudades.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`h-10 px-3.5 flex items-center gap-2 border rounded-lg text-sm bg-white text-[#374151] hover:bg-[#F9FAFB] transition-colors whitespace-nowrap ${filtroCiudad !== 'todas' ? 'border-[#C84B1A] text-[#C84B1A]' : 'border-[#E8E4DE]'}`}>
                  <MapPin className="h-3.5 w-3.5 text-[#6B7280]" />
                  {ciudadLabel}
                  <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => handleFiltroCiudad('todas')}
                  className={filtroCiudad === 'todas' ? 'font-semibold text-[#C84B1A]' : ''}
                >
                  Todas las ciudades
                </DropdownMenuItem>
                {ciudades.map(c => (
                  <DropdownMenuItem
                    key={c}
                    onClick={() => handleFiltroCiudad(c)}
                    className={filtroCiudad === c ? 'font-semibold text-[#C84B1A]' : ''}
                  >
                    {c}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Toggle inactivos */}
          <button
            type="button"
            onClick={handleToggleMostrarInactivos}
            className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
              mostrarInactivos
                ? 'bg-[#374151] text-white shadow-sm'
                : 'bg-white border border-[#E8E4DE] text-[#6B7280] hover:border-[#374151] hover:text-[#374151]'
            }`}
          >
            {mostrarInactivos ? 'Ocultar inactivos' : 'Mostrar inactivos'}
          </button>

          <div className="flex-1" />

          {/* Exportar */}
          <button
            onClick={handleExportar}
            disabled={filteredClientes.length === 0}
            className="h-10 px-4 flex items-center gap-2 border border-[#E8E4DE] rounded-lg text-sm text-[#374151] bg-white hover:bg-[#F9FAFB] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 text-[#6B7280]" />
            Exportar
          </button>

          {/* Nuevo Cliente */}
          <button
            onClick={() => { setClienteAEditar(undefined); setIsModalOpen(true); }}
            className="h-10 px-4 flex items-center gap-2 bg-[#C84B1A] text-white rounded-lg text-sm font-semibold hover:bg-[#A83A14] active:bg-[#8E2E0E] transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </button>
        </div>

        {/* ── Table card ── */}
        <div className={`bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] transition-opacity duration-150 ${isPending ? 'opacity-60' : 'opacity-100'}`}>
          {isPending && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-[#FAF0EB] border-b border-[#E8956A]">
              <Loader2 className="h-3.5 w-3.5 text-[#C84B1A] animate-spin" />
              <span className="text-[12px] text-[#C84B1A] font-medium">Buscando…</span>
            </div>
          )}
          {filteredClientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="bg-[#F3F4F6] p-4 rounded-full mb-4">
                <User className="h-8 w-8 text-[#9CA3AF]" />
              </div>
              <h3 className="font-semibold text-[#111827] mb-1">No hay clientes</h3>
              <p className="text-sm text-[#6B7280] max-w-xs">
                {busqueda || filtroTipo !== 'todos' || filtroCiudad !== 'todas'
                  ? 'No se encontraron clientes con los filtros aplicados.'
                  : 'Aún no tienes clientes registrados. Crea el primero.'}
              </p>
              {!busqueda && filtroTipo === 'todos' && filtroCiudad === 'todas' && (
                <button
                  onClick={() => { setClienteAEditar(undefined); setIsModalOpen(true); }}
                  className="mt-5 h-10 px-4 flex items-center gap-2 bg-[#C84B1A] text-white rounded-lg text-sm font-semibold hover:bg-[#A83A14] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Cliente
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E4DE] bg-[#F0EDE8]">
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold text-stone uppercase tracking-widest">
                      Cliente
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3.5 text-left text-[10px] font-bold text-stone uppercase tracking-widest">
                      Tipo
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3.5 text-left text-[10px] font-bold text-stone uppercase tracking-widest">
                      Contacto
                    </th>
                    <th className="hidden md:table-cell px-4 py-3.5 text-center text-[10px] font-bold text-stone uppercase tracking-widest">
                      Proyectos
                    </th>
                    <th className="hidden md:table-cell px-4 py-3.5 text-right text-[10px] font-bold text-stone uppercase tracking-widest">
                      Inversión Total
                    </th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-stone uppercase tracking-widest">
                      Estado
                    </th>
                    <th className="px-3 py-3.5 text-right text-[10px] font-bold text-stone uppercase tracking-widest">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {clientesPagina.map(cliente => {
                    const initials = getInitials(cliente.nombre_razon_social);
                    const av = getAvatarColor(cliente.id);
                    return (
                      <tr
                        key={cliente.id}
                        className={`hover:bg-[#F5F0EA] transition-colors group ${cliente.activo === false ? 'opacity-60' : ''}`}
                      >
                        {/* Cliente */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${av.bg} ${av.text} flex items-center justify-center text-xs font-bold flex-shrink-0 ring-1 ring-black/5`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/clientes/${cliente.id}`}
                                className="font-semibold text-[#111827] hover:text-[#C84B1A] transition-colors truncate block leading-tight"
                              >
                                {cliente.nombre_razon_social}
                              </Link>
                              <p className="text-xs text-[#9CA3AF] mt-0.5 truncate" style={{ fontFamily: 'var(--font-mono)' }}>
                                {cliente.nit_cedula || 'Sin NIT/Cédula'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Tipo */}
                        <td className="hidden sm:table-cell px-4 py-3.5 whitespace-nowrap">
                          {cliente.tipo === 'empresa' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#E8F0F8] text-[#2D5F8A] border border-[#C1D8EE]">
                              <Building2 className="h-3 w-3 flex-shrink-0" />
                              Persona Jurídica
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#F5F2EE] text-stone border border-[#E8E4DE]">
                              <User className="h-3 w-3 flex-shrink-0" />
                              Persona Natural
                            </span>
                          )}
                        </td>

                        {/* Contacto */}
                        <td className="hidden sm:table-cell px-4 py-3.5 max-w-[180px]">
                          <p className="text-[#374151] font-medium truncate">
                            {cliente.nombre_contacto || <span className="text-[#D1D5DB] font-normal">Sin contacto</span>}
                          </p>
                          {cliente.email && (
                            <p className="text-xs text-[#9CA3AF] truncate mt-0.5">{cliente.email}</p>
                          )}
                        </td>

                        {/* Proyectos */}
                        <td className="hidden md:table-cell px-4 py-3.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            (cliente.total_proyectos || 0) > 0
                              ? 'bg-[#F0FDF4] text-[#2D7A45]'
                              : 'bg-[#F3F4F6] text-[#9CA3AF]'
                          }`}>
                            {cliente.total_proyectos || 0}
                          </span>
                        </td>

                        {/* Inversión Total */}
                        <td className="hidden md:table-cell px-4 py-3.5 text-right whitespace-nowrap">
                          <span className="font-semibold text-[#111827] tabular-nums">
                            {formatCurrency(cliente.valor_total_proyectos || 0)}
                          </span>
                        </td>

                        {/* Estado — pill badge */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {cliente.activo !== false ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] flex-shrink-0" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] flex-shrink-0" />
                              Inactivo
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-3 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {cliente.activo !== false ? (
                              <button
                                aria-label="Inhabilitar cliente"
                                onClick={() => setConfirmInhabilitar({ id: cliente.id, nombre: cliente.nombre_razon_social })}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                aria-label="Habilitar cliente"
                                onClick={() => handleHabilitar(cliente.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#374151] opacity-40 group-hover:opacity-100 focus:opacity-100 transition-all">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/clientes/${cliente.id}`}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Ver detalle
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => { setClienteAEditar(cliente); setIsModalOpen(true); }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {cliente.activo !== false ? (
                                  <DropdownMenuItem
                                    onClick={() => setConfirmInhabilitar({ id: cliente.id, nombre: cliente.nombre_razon_social })}
                                    className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Inhabilitar
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleHabilitar(cliente.id)}
                                    className="text-green-700 focus:bg-green-50 focus:text-green-800"
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Habilitar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {filteredClientes.length > 0 && (
            <div className="px-5 py-3.5 border-t border-[#F3F4F6] bg-[#FAFAFA] flex items-center justify-between gap-4">
              <span className="text-sm text-[#6B7280]">
                {filteredClientes.length <= PAGE_SIZE
                  ? `${filteredClientes.length} cliente${filteredClientes.length !== 1 ? 's' : ''}`
                  : `Mostrando ${(paginaActual - 1) * PAGE_SIZE + 1}–${Math.min(paginaActual * PAGE_SIZE, filteredClientes.length)} de ${filteredClientes.length} clientes`}
              </span>

              {totalPaginas > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#374151] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => {
                    let p: number;
                    if (totalPaginas <= 5) p = i + 1;
                    else if (paginaActual <= 3) p = i + 1;
                    else if (paginaActual >= totalPaginas - 2) p = totalPaginas - 4 + i;
                    else p = paginaActual - 2 + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPagina(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          p === paginaActual
                            ? 'bg-[#C84B1A] text-white shadow-sm'
                            : 'text-[#374151] hover:bg-[#F3F4F6]'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#374151] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Sidebar ── */}
      <div className="w-full lg:w-72 flex-shrink-0 space-y-4">

        {/* Distribución */}
        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <h3 className="font-semibold text-[#111827] mb-5 text-sm">
            Distribución por tipo de cliente
          </h3>
          <DonutChart total={allClientes.length} empresa={totalEmpresa} natural={totalNatural} />
          <div className="mt-5 space-y-2">
            {[
              { color: 'bg-[#1E6FB8]', label: 'Persona Jurídica', count: totalEmpresa },
              { color: 'bg-[#2D7A45]', label: 'Persona Natural', count: totalNatural },
            ].map(({ color, label, count }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
                  <span className="text-[#374151]">{label}</span>
                </div>
                <span className="font-semibold text-[#111827]">
                  {count}
                  {allClientes.length > 0 && (
                    <span className="text-[#9CA3AF] font-normal ml-1 text-xs">
                      ({Math.round((count / allClientes.length) * 100)}%)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <h3 className="font-semibold text-[#111827] mb-4 text-sm">Actividad reciente</h3>

          {actividadReciente.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-4">Sin actividad reciente</p>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {actividadReciente.map(c => {
                const isNew = Math.abs(
                  new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()
                ) < 120_000;
                const av = getAvatarColor(c.id);
                return (
                  <div key={c.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-lg ${av.bg} ${av.text} flex items-center justify-center flex-shrink-0 text-[10px] font-bold ring-1 ring-black/5`}>
                      {getInitials(c.nombre_razon_social)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#111827] leading-tight">
                        {isNew ? 'Nuevo cliente registrado' : 'Cliente actualizado'}
                      </p>
                      <p className="text-xs text-[#6B7280] truncate mt-0.5">{c.nombre_razon_social}</p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">{timeAgo(c.updated_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {actividadReciente.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#F3F4F6]">
              <Link
                href="/clientes"
                className="text-sm font-semibold text-[#C84B1A] hover:text-[#A83A14] transition-colors"
              >
                Ver toda la actividad →
              </Link>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmInhabilitar}
        title="Inhabilitar cliente"
        description={`¿Inhabilitar a "${confirmInhabilitar?.nombre}"? No aparecerá en selectores ni en la lista principal, pero puedes reactivarlo en cualquier momento.`}
        confirmLabel="Inhabilitar"
        onConfirm={handleInhabilitar}
        onCancel={() => setConfirmInhabilitar(null)}
      />

      <ModalCliente
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cliente={clienteAEditar}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
