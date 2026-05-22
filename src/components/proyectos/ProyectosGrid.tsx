'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Home, Store, Route, BedDouble, Cog, GraduationCap, Building2,
  MoreVertical, Eye, FilePlus2, Archive,
  ChevronLeft, ChevronRight, List, LayoutGrid,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/shared/DropdownMenu';
import { cambiarEstadoProyecto } from '@/actions/proyectos';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

type Filtro = 'todos' | 'en_progreso' | 'borrador' | 'finalizados' | 'activos';

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos',       label: 'Todos'       },
  { id: 'en_progreso', label: 'En progreso' },
  { id: 'borrador',    label: 'Borrador'    },
  { id: 'finalizados', label: 'Finalizados' },
  { id: 'activos',     label: 'Activos'     },
];

// Paleta de estados — tokens de obra
const ESTADO_BADGE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  borrador:    { label: 'Borrador',    bg: '#F4F2EE', text: '#5A5248', border: '#D0CCC6' },
  en_progreso: { label: 'En progreso', bg: '#FAF0EB', text: '#A83A14', border: '#E8956A' },
  finalizado:  { label: 'Finalizado',  bg: '#E8F4E8', text: '#1A5C2A', border: '#B8D9B8' },
  archivado:   { label: 'Archivado',   bg: '#F4F2EE', text: '#7A7265', border: '#C8C0B5' },
};

const TIPO_OBRA_CONFIG: Record<string, { Icon: React.ElementType; bg: string; fg: string }> = {
  residencial:     { Icon: Home,          bg: '#FAF0EB', fg: '#C84B1A' },
  comercial:       { Icon: Store,         bg: '#E8F0F8', fg: '#2D5F8A' },
  infraestructura: { Icon: Route,         bg: '#EDF2E8', fg: '#3A7A50' },
  hotelero:        { Icon: BedDouble,     bg: '#F4F0FA', fg: '#6B4FA8' },
  industrial:      { Icon: Cog,           bg: '#FEF9EC', fg: '#8C5E00' },
  institucional:   { Icon: GraduationCap, bg: '#E8F4F8', fg: '#1A6080' },
};

function filtrarPorEstado(projects: any[], filtro: Filtro): any[] {
  switch (filtro) {
    case 'activos':     return projects.filter(p => p.estado === 'borrador' || p.estado === 'en_progreso');
    case 'borrador':    return projects.filter(p => p.estado === 'borrador');
    case 'en_progreso': return projects.filter(p => p.estado === 'en_progreso');
    case 'finalizados': return projects.filter(p => p.estado === 'finalizado' || p.estado === 'archivado');
    case 'todos':       return projects;
  }
}

function filtrarPorBusqueda(projects: any[], termino: string): any[] {
  const t = termino.trim().toLowerCase();
  if (!t) return projects;
  return projects.filter(p => {
    const nombre  = (p.nombre ?? '').toLowerCase();
    const ciudad  = (p.ubicacion ?? '').toLowerCase();
    const tipo    = (p.tipo_obra ?? '').toLowerCase();
    const cliente = (p.clientes?.nombre_razon_social ?? p.cliente_nombre ?? '').toLowerCase();
    return nombre.includes(t) || ciudad.includes(t) || tipo.includes(t) || cliente.includes(t);
  });
}

function formatearAbreviado(valor: number): string {
  if (valor >= 1_000_000_000) return `$${(valor / 1_000_000_000).toFixed(1)}B`;
  if (valor >= 1_000_000)     return `$${(valor / 1_000_000).toFixed(1)}M`;
  if (valor > 0) return `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor)}`;
  return '—';
}

interface ProyectosGridProps {
  projects: any[];
}

export function ProyectosGrid({ projects }: ProyectosGridProps) {
  const router = useRouter();
  const [filtro,   setFiltro]   = useState<Filtro>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pagina,   setPagina]   = useState(1);
  const [vista,    setVista]    = useState<'lista' | 'grilla'>('lista');

  const porEstado = filtrarPorEstado(projects, filtro);
  const filtrados = filtrarPorBusqueda(porEstado, busqueda);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio       = (paginaActual - 1) * PAGE_SIZE;
  const paginaItems  = filtrados.slice(inicio, inicio + PAGE_SIZE);

  const contadores: Record<Filtro, number> = {
    todos:       projects.length,
    en_progreso: projects.filter(p => p.estado === 'en_progreso').length,
    borrador:    projects.filter(p => p.estado === 'borrador').length,
    finalizados: projects.filter(p => p.estado === 'finalizado' || p.estado === 'archivado').length,
    activos:     projects.filter(p => p.estado === 'borrador' || p.estado === 'en_progreso').length,
  };

  function cambiarFiltro(f: Filtro) { setFiltro(f); setPagina(1); }
  function cambiarBusqueda(v: string) { setBusqueda(v); setPagina(1); }

  async function archivar(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const res = await cambiarEstadoProyecto(id, 'archivado');
    if (res.success) { toast.success('Proyecto archivado'); router.refresh(); }
    else toast.error(res.error ?? 'No se pudo archivar el proyecto');
  }

  const paginasVisibles = Math.min(totalPaginas, 5);

  return (
    <div>
      {/* ── Barra de búsqueda + toggle vista ── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A89F96] pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={e => cambiarBusqueda(e.target.value)}
            placeholder="Buscar por nombre, ciudad, cliente o tipo de obra…"
            className="w-full pl-9 pr-4 py-2 text-[13px] border border-[#E8E4DE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B1A]/15 focus:border-[#C84B1A] bg-white text-[#1C1814] placeholder:text-[#C8C0B5] transition-colors"
          />
        </div>
        <div className="shrink-0 flex border border-[#E8E4DE] rounded-lg overflow-hidden bg-white">
          <button
            onClick={() => setVista('lista')}
            title="Vista lista"
            className={cn(
              'h-9 w-9 inline-flex items-center justify-center transition-colors duration-150',
              vista === 'lista'
                ? 'bg-[#C84B1A] text-white'
                : 'text-[#A89F96] hover:bg-[#F4F2EE]'
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setVista('grilla')}
            title="Vista grilla"
            className={cn(
              'h-9 w-9 inline-flex items-center justify-center transition-colors duration-150',
              vista === 'grilla'
                ? 'bg-[#C84B1A] text-white'
                : 'text-[#A89F96] hover:bg-[#F4F2EE]'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Tabs de filtro ── */}
      <div className="flex items-center border-b border-[#E8E4DE] mb-5 overflow-x-auto">
        {FILTROS.map(f => {
          const active = filtro === f.id;
          return (
            <button
              key={f.id}
              onClick={() => cambiarFiltro(f.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-all border-b-2 -mb-px shrink-0',
                active
                  ? 'border-[#C84B1A] text-[#C84B1A]'
                  : 'border-transparent text-[#7A7265] hover:text-[#3D3530] hover:border-[#C8C0B5]'
              )}
            >
              {f.label}
              <span className={cn(
                'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded text-[10px] font-bold',
                active
                  ? 'bg-[#C84B1A] text-white'
                  : 'bg-[#EAE6E0] text-[#7A7265]'
              )}
              style={active ? { fontFamily: 'var(--font-mono)' } : { fontFamily: 'var(--font-mono)' }}>
                {contadores[f.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Contenido ── */}
      {filtrados.length === 0 ? (
        <EmptyState
          icon="folder"
          title="Sin resultados"
          description={
            busqueda.trim()
              ? `No se encontraron proyectos con "${busqueda.trim()}". Intenta con otro término.`
              : filtro === 'finalizados' ? 'No tienes proyectos finalizados ni archivados.'
              : filtro === 'en_progreso' ? 'No tienes proyectos en progreso.'
              : filtro === 'borrador'    ? 'No tienes proyectos en borrador.'
              : 'Crea tu primer proyecto para empezar a presupuestar.'
          }
          actionLabel={!busqueda.trim() && (filtro === 'activos' || filtro === 'todos') ? 'Crear proyecto' : undefined}
          actionHref={!busqueda.trim() && (filtro === 'activos' || filtro === 'todos') ? '/proyectos/nuevo' : undefined}
        />
      ) : vista === 'lista' ? (

        /* ════ VISTA LISTA ════ */
        <div className="bg-white rounded-xl border border-[#E8E4DE] overflow-hidden shadow-[0_1px_2px_0_rgba(28,24,20,0.04)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EAE6E0] bg-[#F7F5F2]">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#A89F96] uppercase tracking-[0.12em]">
                  Proyecto
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#A89F96] uppercase tracking-[0.12em]">
                  Estado
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#A89F96] uppercase tracking-[0.12em]">
                  Presupuestos
                </th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-[#A89F96] uppercase tracking-[0.12em]">
                  Valor total
                </th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F2EE]">
              {paginaItems.map(p => {
                const est        = ESTADO_BADGE[p.estado] ?? ESTADO_BADGE.borrador;
                const tipoCfg    = TIPO_OBRA_CONFIG[p.tipo_obra ?? ''];
                const TipoIcon   = tipoCfg?.Icon ?? Building2;
                const clienteNom = p.clientes?.nombre_razon_social ?? p.cliente_nombre;
                const subtitulo  = [p.ubicacion, clienteNom].filter(Boolean).join(' · ');

                return (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/proyectos/${p.id}`)}
                    className="hover:bg-[#FAF8F6] cursor-pointer transition-colors duration-100 group"
                  >
                    {/* Proyecto */}
                    <td className="px-5 py-3 max-w-[260px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg"
                          style={{
                            background: tipoCfg?.bg ?? '#FAF0EB',
                            color: tipoCfg?.fg ?? '#C84B1A',
                          }}
                        >
                          <TipoIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1C1814] truncate text-[13px] leading-tight">
                            {p.nombre}
                          </p>
                          {subtitulo && (
                            <p className="text-[11px] text-[#A89F96] truncate mt-0.5">{subtitulo}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className="px-2 py-[3px] rounded text-[10px] font-semibold border tracking-[0.02em]"
                        style={{ background: est.bg, color: est.text, borderColor: est.border }}
                      >
                        {est.label}
                      </span>
                    </td>

                    {/* Presupuestos */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(p.presupuestos_count ?? 0) > 0 ? (
                        <span
                          className="text-[13px] text-[#3D3530] font-medium"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {p.presupuestos_count} {p.presupuestos_count === 1 ? 'activo' : 'activos'}
                        </span>
                      ) : (
                        <span className="text-[#C8C0B5]">—</span>
                      )}
                    </td>

                    {/* Valor total */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {(p.valor_total ?? 0) > 0 ? (
                        <span
                          className="font-semibold text-[#C84B1A] text-[13px]"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {formatCurrency(p.valor_total)}
                        </span>
                      ) : (
                        <span className="text-[#C8C0B5]">—</span>
                      )}
                    </td>

                    {/* Menú ⋮ */}
                    <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-[#C8C0B5] hover:bg-[#EAE6E0] hover:text-[#3D3530] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/proyectos/${p.id}`)}>
                            <Eye className="h-4 w-4" />
                            Ver proyecto
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/proyectos/${p.id}?nuevo-presupuesto=1`)}
                          >
                            <FilePlus2 className="h-4 w-4" />
                            Nuevo presupuesto
                          </DropdownMenuItem>
                          {p.estado !== 'archivado' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e: React.MouseEvent) => archivar(p.id, e)}
                                className="text-neutral-500"
                              >
                                <Archive className="h-4 w-4" />
                                Archivar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer paginación */}
          <div className="px-5 py-3 border-t border-[#EAE6E0] flex items-center justify-between bg-[#F7F5F2]">
            <p className="text-[11px] text-[#A89F96]" style={{ fontFamily: 'var(--font-mono)' }}>
              {inicio + 1}–{Math.min(inicio + PAGE_SIZE, filtrados.length)} de {filtrados.length}
            </p>
            {totalPaginas > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina(prev => Math.max(1, prev - 1))}
                  disabled={paginaActual === 1}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#E8E4DE] bg-white text-[#7A7265] hover:border-[#C8C0B5] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: paginasVisibles }, (_, i) => {
                  const pg = i + 1;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPagina(pg)}
                      className={cn(
                        'h-7 w-7 inline-flex items-center justify-center rounded-lg text-[12px] font-semibold transition-colors',
                        paginaActual === pg
                          ? 'bg-[#C84B1A] text-white border border-[#C84B1A]'
                          : 'border border-[#E8E4DE] bg-white text-[#7A7265] hover:border-[#C8C0B5]'
                      )}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPagina(prev => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#E8E4DE] bg-white text-[#7A7265] hover:border-[#C8C0B5] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

      ) : (

        /* ════ VISTA GRILLA — cards blueprint ════ */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginaItems.map(p => {
              const est        = ESTADO_BADGE[p.estado] ?? ESTADO_BADGE.borrador;
              const tipoCfg    = TIPO_OBRA_CONFIG[p.tipo_obra ?? ''];
              const TipoIcon   = tipoCfg?.Icon ?? Building2;
              const clienteNom = p.clientes?.nombre_razon_social ?? p.cliente_nombre;
              const subtitulo  = [p.ubicacion, clienteNom].filter(Boolean).join(' · ');

              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/proyectos/${p.id}`)}
                  className="relative bg-white border border-[#E8E4DE] p-4 cursor-pointer transition-all duration-150 group hover:border-[#C84B1A]/40 hover:bg-[#FDFCFB] shadow-[0_1px_2px_0_rgba(28,24,20,0.04)]"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)',
                  }}
                >
                  {/* Corner cut accent */}
                  <div
                    className="absolute top-0 right-0 pointer-events-none"
                    aria-hidden
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <line x1="0" y1="18" x2="18" y2="0" stroke="#C84B1A" strokeWidth="0.8" opacity="0.35" />
                    </svg>
                  </div>

                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-lg"
                      style={{
                        background: tipoCfg?.bg ?? '#FAF0EB',
                        color: tipoCfg?.fg ?? '#C84B1A',
                      }}
                    >
                      <TipoIcon className="h-[18px] w-[18px]" />
                    </div>
                    <span
                      className="px-2 py-[3px] rounded text-[10px] font-semibold border tracking-[0.02em]"
                      style={{ background: est.bg, color: est.text, borderColor: est.border }}
                    >
                      {est.label}
                    </span>
                  </div>

                  <p className="font-semibold text-[#1C1814] truncate text-[13px] mb-0.5">{p.nombre}</p>
                  {subtitulo && (
                    <p className="text-[11px] text-[#A89F96] truncate mb-3">{subtitulo}</p>
                  )}

                  <div className="flex items-center justify-between pt-2.5 border-t border-[#EAE6E0]">
                    <span className="text-[11px] text-[#A89F96]" style={{ fontFamily: 'var(--font-mono)' }}>
                      {p.presupuestos_count ?? 0}{' '}
                      presupuesto{(p.presupuestos_count ?? 0) !== 1 ? 's' : ''}
                    </span>
                    {(p.valor_total ?? 0) > 0 && (
                      <span
                        className="font-semibold text-[#C84B1A] text-[13px]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {formatearAbreviado(p.valor_total)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación en modo grilla */}
          {totalPaginas > 1 && (
            <div className="mt-4 flex items-center justify-between bg-[#F7F5F2] rounded-xl border border-[#E8E4DE] px-5 py-3">
              <p className="text-[11px] text-[#A89F96]" style={{ fontFamily: 'var(--font-mono)' }}>
                {inicio + 1}–{Math.min(inicio + PAGE_SIZE, filtrados.length)} de {filtrados.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina(prev => Math.max(1, prev - 1))}
                  disabled={paginaActual === 1}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#E8E4DE] bg-white text-[#7A7265] disabled:opacity-35 disabled:cursor-not-allowed transition-colors hover:border-[#C8C0B5]"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span
                  className="text-[12px] font-medium text-[#3D3530] px-2"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {paginaActual} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(prev => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#E8E4DE] bg-white text-[#7A7265] disabled:opacity-35 disabled:cursor-not-allowed transition-colors hover:border-[#C8C0B5]"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
