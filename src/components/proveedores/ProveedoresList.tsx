'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Building2, User, MoreVertical,
  Edit, Trash2, ExternalLink, Plus, Download,
  ChevronLeft, ChevronRight, SlidersHorizontal,
  ChevronDown, Truck, Phone, Mail, Globe,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/shared/DropdownMenu';
import { ModalProveedor } from './ModalProveedor';
import { eliminarProveedor } from '@/actions/proveedores';
import { toast } from 'sonner';
import type { Proveedor, CategoriaProveedor } from '@/types';
import { CATEGORIA_PROVEEDOR_LABELS } from '@/types';

const PAGE_SIZE = 10;

const CATEGORIA_COLORS: Record<CategoriaProveedor, string> = {
  ferreteria:  'bg-[#E4E7EC] text-[#1F2937] border-[#C8CDD6]',
  contratista: 'bg-[#FAF0EB] text-[#B8440C] border-[#F0A882]',
  equipos:     'bg-[#EBF2FA] text-[#1E4D8C] border-[#A8C4DC]',
  laboratorio: 'bg-[#EBFAF0] text-[#166534] border-[#B8D9B8]',
  transporte:  'bg-[#E4E7EC] text-[#4B5563] border-[#C8CDD6]',
  servicios:   'bg-[#FEF3E2] text-[#7A4B00] border-[#F0D080]',
  otro:        'bg-[#DDE0E6] text-[#6B7A8D] border-[#C8CDD6]',
};

const CAT_CHART_COLORS: Record<CategoriaProveedor, string> = {
  ferreteria:  '#6B7280',
  contratista: '#D95510',
  equipos:     '#1E6FB8',
  laboratorio: '#2D7A45',
  transporte:  '#4B5563',
  servicios:   '#D97706',
  otro:        '#9CA3AF',
};

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

const TIPO_OPTIONS = [
  { value: 'todos', label: 'Todos los tipos' },
  { value: 'empresa', label: 'Persona Jurídica' },
  { value: 'persona', label: 'Persona Natural' },
];

const CATEGORIA_OPTIONS = [
  { value: 'todos', label: 'Todas las categorías' },
  ...(Object.entries(CATEGORIA_PROVEEDOR_LABELS) as [CategoriaProveedor, string][])
    .map(([val, label]) => ({ value: val, label })),
];

interface ProveedoresListProps {
  initialProveedores: Proveedor[];
}

export function ProveedoresList({ initialProveedores }: ProveedoresListProps) {
  const [proveedores, setProveedores] = useState(initialProveedores);
  useEffect(() => setProveedores(initialProveedores), [initialProveedores]);

  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proveedorAEditar, setProveedorAEditar] = useState<Proveedor | undefined>(undefined);

  const router = useRouter();

  const filtrados = useMemo(() => {
    return proveedores.filter(p => {
      const q = busqueda.toLowerCase();
      const matchBusqueda = q === '' ||
        p.nombre_razon_social.toLowerCase().includes(q) ||
        (p.nit_cedula || '').toLowerCase().includes(q) ||
        (p.ciudad || '').toLowerCase().includes(q);
      const matchTipo = filtroTipo === 'todos' || p.tipo === filtroTipo;
      const matchCat = filtroCategoria === 'todos' || p.categoria === filtroCategoria;
      return matchBusqueda && matchTipo && matchCat;
    });
  }, [proveedores, busqueda, filtroTipo, filtroCategoria]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const porPagina = filtrados.slice(
    (paginaActual - 1) * PAGE_SIZE,
    paginaActual * PAGE_SIZE,
  );

  const statsPorCategoria = useMemo(() => {
    const counts: Partial<Record<CategoriaProveedor, number>> = {};
    proveedores.forEach(p => { counts[p.categoria] = (counts[p.categoria] || 0) + 1; });
    const maxCount = Math.max(...Object.values(counts as Record<string, number>), 1);
    return (Object.entries(CATEGORIA_PROVEEDOR_LABELS) as [CategoriaProveedor, string][])
      .map(([cat, label]) => ({
        cat, label,
        count: counts[cat] || 0,
        pct: proveedores.length > 0 ? ((counts[cat] || 0) / proveedores.length) * 100 : 0,
        barWidth: Math.round(((counts[cat] || 0) / maxCount) * 100),
        color: CAT_CHART_COLORS[cat],
      }))
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [proveedores]);

  const recientes = useMemo(() =>
    [...proveedores]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
    [proveedores],
  );

  function handleFiltroTipo(v: string) { setFiltroTipo(v); setPagina(1); }
  function handleFiltroCat(v: string) { setFiltroCategoria(v); setPagina(1); }
  function handleBusqueda(q: string) { setBusqueda(q); setPagina(1); }

  async function handleEliminar(id: string, nombre: string) {
    if (!confirm(`¿Eliminar a "${nombre}"? El proveedor dejará de aparecer en el listado.`)) return;
    const res = await eliminarProveedor(id);
    if (res.success) {
      toast.success('Proveedor eliminado');
      setProveedores(prev => prev.filter(p => p.id !== id));
    } else {
      toast.error(res.error || 'Error al eliminar');
    }
  }

  function handleExportar() {
    const headers = ['Nombre/Razón Social', 'NIT/Cédula', 'Tipo', 'Categoría', 'Ciudad', 'Email', 'Teléfono', 'Sitio Web', 'Notas'];
    const rows = proveedores.map(p => [
      p.nombre_razon_social,
      p.nit_cedula || '',
      p.tipo === 'empresa' ? 'Persona Jurídica' : 'Persona Natural',
      CATEGORIA_PROVEEDOR_LABELS[p.categoria],
      p.ciudad || '',
      p.email || '',
      p.telefono || '',
      p.sitio_web || '',
      p.notas || '',
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proveedores-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tipoLabel = TIPO_OPTIONS.find(o => o.value === filtroTipo)?.label ?? 'Todos los tipos';
  const catLabel = CATEGORIA_OPTIONS.find(o => o.value === filtroCategoria)?.label ?? 'Todas las categorías';

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* ── Tabla principal ── */}
      <div className="flex-1 min-w-0 space-y-3">

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, NIT o ciudad..."
              value={busqueda}
              onChange={e => handleBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 h-10 border border-[#E5E7EB] rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#D95510]/20 focus:border-[#D95510] placeholder:text-[#9CA3AF] text-[#374151]"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-10 px-3.5 flex items-center gap-2 border border-[#E5E7EB] rounded-lg text-sm bg-white text-[#374151] hover:bg-[#F9FAFB] transition-colors whitespace-nowrap">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#6B7280]" />
                {tipoLabel}
                <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {TIPO_OPTIONS.map(opt => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => handleFiltroTipo(opt.value)}
                  className={filtroTipo === opt.value ? 'font-semibold text-[#D95510]' : ''}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-10 px-3.5 flex items-center gap-2 border border-[#E5E7EB] rounded-lg text-sm bg-white text-[#374151] hover:bg-[#F9FAFB] transition-colors whitespace-nowrap">
                {catLabel}
                <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {CATEGORIA_OPTIONS.map(opt => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => handleFiltroCat(opt.value)}
                  className={filtroCategoria === opt.value ? 'font-semibold text-[#D95510]' : ''}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          <button
            onClick={handleExportar}
            disabled={proveedores.length === 0}
            className="h-10 px-4 flex items-center gap-2 border border-[#E5E7EB] rounded-lg text-sm text-[#374151] bg-white hover:bg-[#F9FAFB] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 text-[#6B7280]" />
            Exportar
          </button>

          <button
            onClick={() => { setProveedorAEditar(undefined); setIsModalOpen(true); }}
            className="h-10 px-4 flex items-center gap-2 bg-[#D95510] text-white rounded-lg text-sm font-semibold hover:bg-[#C44A0C] active:bg-[#B33E09] transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nuevo Proveedor
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="bg-[#F3F4F6] p-4 rounded-full mb-4">
                <Truck className="h-8 w-8 text-[#9CA3AF]" />
              </div>
              <h3 className="font-semibold text-[#111827] mb-1">No hay proveedores</h3>
              <p className="text-sm text-[#6B7280] max-w-xs">
                {busqueda || filtroTipo !== 'todos' || filtroCategoria !== 'todos'
                  ? 'No se encontraron proveedores con los filtros aplicados.'
                  : 'Aún no tienes proveedores registrados. Crea el primero.'}
              </p>
              {!busqueda && filtroTipo === 'todos' && filtroCategoria === 'todos' && (
                <button
                  onClick={() => { setProveedorAEditar(undefined); setIsModalOpen(true); }}
                  className="mt-5 h-10 px-4 flex items-center gap-2 bg-[#D95510] text-white rounded-lg text-sm font-semibold hover:bg-[#C44A0C] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Proveedor
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#F3F4F6] bg-[#F8F9FA]">
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Proveedor</th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Tipo</th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Categoría</th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-widest hidden md:table-cell">Ciudad</th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-widest hidden lg:table-cell">Contacto</th>
                    <th className="px-3 py-3.5 text-right text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {porPagina.map(p => {
                    const av = getAvatarColor(p.id);
                    return (
                      <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${av.bg} ${av.text} flex items-center justify-center text-xs font-bold flex-shrink-0 ring-1 ring-black/5`}>
                              {getInitials(p.nombre_razon_social)}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/proveedores/${p.id}`}
                                className="font-semibold text-[#111827] hover:text-[#D95510] transition-colors truncate block leading-tight"
                              >
                                {p.nombre_razon_social}
                              </Link>
                              <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">
                                {p.nit_cedula || 'Sin NIT/Cédula'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {p.tipo === 'empresa' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#EFF6FF] text-[#1E6FB8] border border-[#BFDBFE]">
                              <Building2 className="h-3 w-3 flex-shrink-0" /> Jurídica
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
                              <User className="h-3 w-3 flex-shrink-0" /> Natural
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${CATEGORIA_COLORS[p.categoria]}`}>
                            {CATEGORIA_PROVEEDOR_LABELS[p.categoria]}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-[13px] text-[#6B7280]">
                            {p.ciudad || <span className="text-[#D1D5DB] italic text-xs">Sin ciudad</span>}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            {p.telefono && (
                              <a href={`tel:${p.telefono}`} className="p-1.5 rounded-lg bg-[#F3F4F6] text-[#6B7280] hover:bg-[#D95510]/10 hover:text-[#D95510] transition-colors" title={p.telefono}>
                                <Phone className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {p.email && (
                              <a href={`mailto:${p.email}`} className="p-1.5 rounded-lg bg-[#F3F4F6] text-[#6B7280] hover:bg-[#D95510]/10 hover:text-[#D95510] transition-colors" title={p.email}>
                                <Mail className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {p.sitio_web && (
                              <a href={p.sitio_web} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-[#F3F4F6] text-[#6B7280] hover:bg-[#D95510]/10 hover:text-[#D95510] transition-colors" title={p.sitio_web}>
                                <Globe className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {!p.telefono && !p.email && !p.sitio_web && (
                              <span className="text-xs text-[#D1D5DB] italic">Sin contacto</span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#374151] opacity-40 group-hover:opacity-100 focus:opacity-100 transition-all">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/proveedores/${p.id}`}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Ver detalle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setProveedorAEditar(p); setIsModalOpen(true); }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEliminar(p.id, p.nombre_razon_social)}
                                className="text-red-600 focus:bg-red-50 focus:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtrados.length > 0 && (
            <div className="px-5 py-3.5 border-t border-[#F3F4F6] bg-[#FAFAFA] flex items-center justify-between gap-4">
              <span className="text-sm text-[#6B7280]">
                {filtrados.length <= PAGE_SIZE
                  ? `${filtrados.length} proveedor${filtrados.length !== 1 ? 'es' : ''}`
                  : `Mostrando ${(paginaActual - 1) * PAGE_SIZE + 1}–${Math.min(paginaActual * PAGE_SIZE, filtrados.length)} de ${filtrados.length} proveedores`}
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
                    let pg: number;
                    if (totalPaginas <= 5) pg = i + 1;
                    else if (paginaActual <= 3) pg = i + 1;
                    else if (paginaActual >= totalPaginas - 2) pg = totalPaginas - 4 + i;
                    else pg = paginaActual - 2 + i;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPagina(pg)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          pg === paginaActual
                            ? 'bg-[#D95510] text-white shadow-sm'
                            : 'text-[#374151] hover:bg-[#F3F4F6]'
                        }`}
                      >
                        {pg}
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

      {/* ── Sidebar derecho ── */}
      <div className="w-full lg:w-72 flex-shrink-0 space-y-4">

        {/* Distribución por categoría */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <h3 className="font-semibold text-[#111827] mb-4 text-sm">Distribución por categoría</h3>
          {statsPorCategoria.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-4">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {statsPorCategoria.map(s => (
                <div key={s.cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#374151] truncate mr-2">{s.label}</span>
                    <span className="text-xs font-semibold text-[#111827] shrink-0">
                      {s.count}
                      <span className="text-[#9CA3AF] font-normal ml-1">
                        ({Math.round(s.pct)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${s.barWidth}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agregados recientemente */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <h3 className="font-semibold text-[#111827] mb-4 text-sm">Agregados recientemente</h3>
          {recientes.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-4">Sin actividad reciente</p>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {recientes.map(p => {
                const av = getAvatarColor(p.id);
                return (
                  <div key={p.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-lg ${av.bg} ${av.text} flex items-center justify-center flex-shrink-0 text-[10px] font-bold ring-1 ring-black/5`}>
                      {getInitials(p.nombre_razon_social)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#111827] leading-tight truncate">
                        {p.nombre_razon_social}
                      </p>
                      <p className="text-[10px] text-[#6B7280] mt-0.5 truncate">
                        {CATEGORIA_PROVEEDOR_LABELS[p.categoria]}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">{timeAgo(p.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ModalProveedor
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        proveedor={proveedorAEditar}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
