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

const ESTADO_BADGE: Record<string, { label: string; cls: string }> = {
  borrador:    { label: 'Borrador',    cls: 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]' },
  en_progreso: { label: 'En progreso', cls: 'bg-[#FFF4EE] text-[#D95510] border border-[#FDBA74]' },
  finalizado:  { label: 'Finalizado',  cls: 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]' },
  archivado:   { label: 'Archivado',   cls: 'bg-[#F9FAFB] text-[#9CA3AF] border border-[#E5E7EB]' },
};

const TIPO_OBRA_CONFIG: Record<string, { Icon: React.ElementType; bg: string; fg: string }> = {
  residencial:     { Icon: Home,          bg: 'bg-[#FFF4EE]', fg: 'text-[#D95510]' },
  comercial:       { Icon: Store,         bg: 'bg-[#EFF6FF]', fg: 'text-[#1E6FB8]' },
  infraestructura: { Icon: Route,         bg: 'bg-[#F0FDF4]', fg: 'text-[#2D7A45]' },
  hotelero:        { Icon: BedDouble,     bg: 'bg-[#FDF4FF]', fg: 'text-[#9333EA]' },
  industrial:      { Icon: Cog,           bg: 'bg-[#FFFBEB]', fg: 'text-[#D97706]' },
  institucional:   { Icon: GraduationCap, bg: 'bg-[#F0F9FF]', fg: 'text-[#0284C7]' },
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={e => cambiarBusqueda(e.target.value)}
            placeholder="Buscar por nombre, ciudad, cliente o tipo de obra…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D95510]/20 focus:border-[#D95510] bg-white text-neutral-800 placeholder:text-neutral-400 transition-colors"
          />
        </div>
        <div className="shrink-0 flex border border-[#E5E7EB] rounded-lg overflow-hidden bg-white">
          <button
            onClick={() => setVista('lista')}
            title="Vista lista"
            className={cn(
              'h-9 w-9 inline-flex items-center justify-center transition-colors',
              vista === 'lista' ? 'bg-[#D95510] text-white' : 'text-neutral-400 hover:bg-neutral-50'
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setVista('grilla')}
            title="Vista grilla"
            className={cn(
              'h-9 w-9 inline-flex items-center justify-center transition-colors',
              vista === 'grilla' ? 'bg-[#D95510] text-white' : 'text-neutral-400 hover:bg-neutral-50'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Tabs de filtro estilo Linear ── */}
      <div className="flex items-center border-b border-[#E5E7EB] mb-5 overflow-x-auto">
        {FILTROS.map(f => {
          const active = filtro === f.id;
          return (
            <button
              key={f.id}
              onClick={() => cambiarFiltro(f.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-all border-b-2 -mb-px shrink-0',
                active
                  ? 'border-[#D95510] text-[#D95510]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-200'
              )}
            >
              {f.label}
              <span className={cn(
                'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-bold tabular-nums',
                active ? 'bg-[#D95510] text-white' : 'bg-neutral-100 text-neutral-500'
              )}>
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

        /* ════════════════════════════════════════
           VISTA LISTA — tabla principal
           ════════════════════════════════════════ */
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#F3F4F6] bg-[#F8F9FA]">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">
                    Proyecto
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">
                    Presupuestos
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">
                    Valor total
                  </th>
                  <th className="w-10 px-2 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
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
                      className="hover:bg-[#FAFAFA] cursor-pointer transition-colors group"
                    >
                      {/* Proyecto */}
                      <td className="px-5 py-3 max-w-[260px]">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            'shrink-0 flex items-center justify-center w-7 h-7 rounded-lg',
                            tipoCfg?.bg ?? 'bg-orange-50',
                            tipoCfg?.fg ?? 'text-[#D95510]',
                          )}>
                            <TipoIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-800 truncate text-[13px] leading-tight">
                              {p.nombre}
                            </p>
                            {subtitulo && (
                              <p className="text-[11px] text-neutral-400 truncate mt-0.5">{subtitulo}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn('px-2.5 py-1 rounded-md text-[11px] font-semibold', est.cls)}>
                          {est.label}
                        </span>
                      </td>

                      {/* Presupuestos */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(p.presupuestos_count ?? 0) > 0 ? (
                          <span className="text-[13px] text-neutral-600 font-medium tabular-nums">
                            {p.presupuestos_count} {p.presupuestos_count === 1 ? 'activo' : 'activos'}
                          </span>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>

                      {/* Valor total */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {(p.valor_total ?? 0) > 0 ? (
                          <span className="font-bold text-[#D95510] text-[13px] tabular-nums">
                            {formatCurrency(p.valor_total)}
                          </span>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>

                      {/* Menú ⋮ */}
                      <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors opacity-40 group-hover:opacity-100 focus:opacity-100">
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
          </div>

          {/* ── Footer: texto + paginación numerada ── */}
          <div className="px-5 py-3 border-t border-[#F3F4F6] flex items-center justify-between bg-[#FAFAFA]">
            <p className="text-xs text-neutral-400">
              Mostrando {inicio + 1} a {Math.min(inicio + PAGE_SIZE, filtrados.length)} de{' '}
              {filtrados.length} proyecto{filtrados.length !== 1 ? 's' : ''}
            </p>
            {totalPaginas > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina(prev => Math.max(1, prev - 1))}
                  disabled={paginaActual === 1}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-neutral-500 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                        'h-7 w-7 inline-flex items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                        paginaActual === pg
                          ? 'bg-[#D95510] text-white border border-[#D95510]'
                          : 'border border-[#E5E7EB] bg-white text-neutral-500 hover:border-neutral-300'
                      )}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPagina(prev => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-neutral-500 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

      ) : (

        /* ════════════════════════════════════════
           VISTA GRILLA — cards compactas
           ════════════════════════════════════════ */
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
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-xl',
                      tipoCfg?.bg ?? 'bg-orange-50',
                      tipoCfg?.fg ?? 'text-[#D95510]',
                    )}>
                      <TipoIcon className="h-5 w-5" />
                    </div>
                    <span className={cn('px-2.5 py-1 rounded-md text-[11px] font-semibold', est.cls)}>
                      {est.label}
                    </span>
                  </div>
                  <p className="font-semibold text-neutral-800 truncate text-[13px] mb-0.5">{p.nombre}</p>
                  {subtitulo && (
                    <p className="text-[11px] text-neutral-400 truncate mb-3">{subtitulo}</p>
                  )}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#F3F4F6]">
                    <span className="text-[11px] text-neutral-400">
                      {p.presupuestos_count ?? 0}{' '}
                      presupuesto{(p.presupuestos_count ?? 0) !== 1 ? 's' : ''}
                    </span>
                    {(p.valor_total ?? 0) > 0 && (
                      <span className="font-bold text-[#D95510] text-[13px] tabular-nums">
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
            <div className="mt-4 flex items-center justify-between bg-[#FAFAFA] rounded-2xl border border-[#E5E7EB] px-5 py-3">
              <p className="text-xs text-neutral-400">
                Mostrando {inicio + 1} a {Math.min(inicio + PAGE_SIZE, filtrados.length)} de{' '}
                {filtrados.length} proyecto{filtrados.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina(prev => Math.max(1, prev - 1))}
                  disabled={paginaActual === 1}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-neutral-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-medium text-neutral-600 px-2 tabular-nums">
                  {paginaActual} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(prev => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-neutral-500 disabled:opacity-40 disabled:cursor-not-allowed"
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
