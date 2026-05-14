'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProyectoCard } from '@/components/proyectos/ProyectoCard';
import { EmptyState } from '@/components/shared/EmptyState';
import type { EstadoProyecto } from '@/types';

type Filtro = 'activos' | 'todos' | 'en_progreso' | 'finalizado' | 'archivado';

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'activos',     label: 'Todos'        },
  { id: 'en_progreso', label: 'En progreso'  },
  { id: 'finalizado',  label: 'Finalizados'  },
  { id: 'archivado',   label: 'Archivados'   },
];

function filtrarPorEstado(projects: any[], filtro: Filtro): any[] {
  if (filtro === 'todos')   return projects;
  if (filtro === 'activos') return projects.filter(p => p.estado === 'borrador' || p.estado === 'en_progreso');
  return projects.filter(p => p.estado === filtro);
}

function filtrarPorBusqueda(projects: any[], termino: string): any[] {
  const t = termino.trim().toLowerCase();
  if (!t) return projects;
  return projects.filter(p => {
    const nombre       = (p.nombre                            ?? '').toLowerCase();
    const ciudad       = (p.ubicacion                         ?? '').toLowerCase();
    const tipoObra     = (p.tipo_obra                         ?? '').toLowerCase();
    const clienteNombre = (p.clientes?.nombre_razon_social    ?? p.cliente_nombre ?? '').toLowerCase();
    return nombre.includes(t) || ciudad.includes(t) || tipoObra.includes(t) || clienteNombre.includes(t);
  });
}

interface ProyectosGridProps {
  projects: any[];
}

export function ProyectosGrid({ projects }: ProyectosGridProps) {
  const [filtro,    setFiltro]    = useState<Filtro>('activos');
  const [busqueda,  setBusqueda]  = useState('');

  const porEstado  = filtrarPorEstado(projects, filtro);
  const filtrados  = filtrarPorBusqueda(porEstado, busqueda);

  // Contadores por filtro para mostrar badges
  const contadores: Record<Filtro, number> = {
    activos:     projects.filter(p => p.estado === 'borrador' || p.estado === 'en_progreso').length,
    todos:       projects.length,
    en_progreso: projects.filter(p => p.estado === 'en_progreso').length,
    finalizado:  projects.filter(p => p.estado === 'finalizado').length,
    archivado:   projects.filter(p => p.estado === 'archivado').length,
  };

  return (
    <div className="space-y-4">
      {/* Búsqueda por nombre */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, ciudad, cliente o tipo de obra…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
      </div>

      {/* Pills de filtro */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(f => {
          const count = contadores[f.id];
          const active = filtro === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                active
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              {f.label}
              <span className={cn(
                "inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[10px] font-bold",
                active ? "bg-white/20 text-white" : "bg-neutral-300 text-neutral-600"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contador dinámico */}
      <p className="text-sm text-neutral-500">
        {filtrados.length} proyecto{filtrados.length !== 1 ? 's' : ''}
        {busqueda.trim() && filtro !== 'activos' && filtro !== 'todos'
          ? ` ${FILTROS.find(f => f.id === filtro)?.label.toLowerCase()} con "${busqueda.trim()}"`
          : busqueda.trim()
          ? ` con "${busqueda.trim()}"`
          : filtro !== 'activos' && filtro !== 'todos'
          ? ` ${FILTROS.find(f => f.id === filtro)?.label.toLowerCase()}`
          : ''}
      </p>

      {/* Grid o empty state */}
      {filtrados.length === 0 ? (
        <EmptyState
          icon="folder"
          title="Sin resultados"
          description={
            busqueda.trim()
              ? `No se encontraron proyectos con "${busqueda.trim()}". Intenta con otro término.`
              : filtro === 'archivado'
              ? 'No tienes proyectos archivados.'
              : filtro === 'finalizado'
              ? 'No tienes proyectos finalizados.'
              : filtro === 'en_progreso'
              ? 'No tienes proyectos en progreso.'
              : 'Crea tu primer proyecto para empezar a presupuestar.'
          }
          actionLabel={!busqueda.trim() && (filtro === 'activos' || filtro === 'todos') ? 'Crear proyecto' : undefined}
          actionHref={!busqueda.trim() && (filtro === 'activos' || filtro === 'todos') ? '/proyectos/nuevo' : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtrados.map((p: any) => (
            <ProyectoCard key={p.id} proyecto={p} />
          ))}
        </div>
      )}
    </div>
  );
}
