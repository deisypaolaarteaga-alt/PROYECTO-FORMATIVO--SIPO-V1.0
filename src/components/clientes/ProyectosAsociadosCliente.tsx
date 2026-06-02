'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layers, MapPin, Calendar, ArrowRight, Briefcase } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

const TIPO_OBRA_MAP: Record<string, { label: string; cls: string }> = {
  residencial:     { label: 'Residencial',    cls: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]' },
  comercial:       { label: 'Comercial',      cls: 'bg-[#FFF4EE] text-[#D95510] border-[#FDBA74]' },
  infraestructura: { label: 'Infraestructura',cls: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]' },
  institucional:   { label: 'Institucional',  cls: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]' },
  industrial:      { label: 'Industrial',     cls: 'bg-[#FFF7ED] text-[#D97706] border-[#FDE68A]' },
  hotelero:        { label: 'Hotelero',       cls: 'bg-[#FDF2F8] text-[#9D174D] border-[#FBCFE8]' },
};

function TipoObraBadge({ tipo }: { tipo: string | null }) {
  const cfg = TIPO_OBRA_MAP[tipo ?? ''] ?? {
    label: tipo ?? 'Otro',
    cls: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase border whitespace-nowrap',
        cfg.cls,
      )}
    >
      {cfg.label}
    </span>
  );
}

interface ProyectoItem {
  id: string;
  nombre: string;
  tipo_obra: string | null;
  ubicacion: string | null;
  created_at: string;
  budgets: Array<{ id: string; costo_directo: number | null; total_oferta: number | null }>;
}

interface ProyectosAsociadosClienteProps {
  initialProyectos: ProyectoItem[];
}

export function ProyectosAsociadosCliente({ initialProyectos }: ProyectosAsociadosClienteProps) {
  console.log('ProyectosAsociadosCliente render:', initialProyectos?.length);
  const [proyectos] = useState<ProyectoItem[]>(initialProyectos);

  const inversionTotal = proyectos.reduce(
    (acc, p) => acc + (p.budgets ?? []).reduce((s, b) => s + Number(b.total_oferta ?? 0), 0),
    0,
  );
  const totalPresupuestos = proyectos.reduce((acc, p) => acc + (p.budgets?.length ?? 0), 0);

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">

        {/* Card title bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#F3F4F6]">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-[#111827]">
              Proyectos asociados
            </p>
            {proyectos.length > 0 && (
              <span className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full bg-[#D95510] text-white text-[10px] font-bold tabular-nums leading-none">
                {proyectos.length}
              </span>
            )}
          </div>
        </div>

        {proyectos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F4F6] mb-3">
              <Briefcase className="h-5 w-5 text-[#D1D5DB]" />
            </div>
            <p className="text-[13px] font-semibold text-[#374151] mb-1">
              Sin proyectos asociados
            </p>
            <p className="text-[12px] text-[#9CA3AF] mb-5 max-w-xs">
              Este cliente no tiene proyectos vinculados todavía.
            </p>
            <Link
              href="/proyectos/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-[#D95510] border border-[#FDBA74] hover:bg-[#FFF4EE] transition-colors duration-150"
            >
              Vincular nuevo proyecto
            </Link>
          </div>
        ) : (
          <>
            {/* Column header row */}
            <div className="flex items-center gap-4 px-5 py-2 bg-[#F8F9FA] border-b border-[#F3F4F6]">
              <div className="hidden sm:block w-9 shrink-0" />
              <p className="flex-1 min-w-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
                Proyecto
              </p>
              <p className="hidden md:block w-[120px] shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
                Tipo de obra
              </p>
              <p className="w-[136px] shrink-0 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
                Total oferta
              </p>
              {/* spacer for action buttons */}
              <div className="w-[72px] shrink-0" />
            </div>

            {/* Project rows */}
            <div className="divide-y divide-[#F3F4F6]">
              {proyectos.map((proyecto) => {
                const totalProyecto = (proyecto.budgets ?? []).reduce(
                  (acc, b) => acc + Number(b.total_oferta ?? 0),
                  0,
                );
                const numPresupuestos = proyecto.budgets?.length ?? 0;
                const fechaStr = new Date(proyecto.created_at).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'America/Bogota',
                });

                return (
                  <div
                    key={proyecto.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors duration-100 group"
                  >
                    <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F4F6] shrink-0 group-hover:bg-[#FFF4EE] transition-colors duration-150">
                      <Layers className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#D95510] transition-colors duration-150" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#111827] truncate leading-snug">
                        {proyecto.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {proyecto.ubicacion && (
                          <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF] leading-none">
                            <MapPin className="h-[11px] w-[11px] shrink-0" />
                            <span className="truncate max-w-[120px]">{proyecto.ubicacion}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF] leading-none">
                          <Calendar className="h-[11px] w-[11px] shrink-0" />
                          {fechaStr}
                        </span>
                      </div>
                    </div>

                    <div className="hidden md:flex w-[120px] shrink-0">
                      <TipoObraBadge tipo={proyecto.tipo_obra} />
                    </div>

                    <div className="w-[136px] shrink-0 text-right">
                      {totalProyecto > 0 ? (
                        <p className="text-[14px] font-bold text-[#111827] tabular-nums leading-tight">
                          {formatCurrency(totalProyecto)}
                        </p>
                      ) : (
                        <p className="text-[13px] text-[#9CA3AF] italic leading-tight">Sin valorar</p>
                      )}
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5 leading-none">
                        {numPresupuestos} {numPresupuestos === 1 ? 'presupuesto' : 'presupuestos'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 w-[72px] shrink-0 justify-end">
                      <Link
                        href={`/proyectos/${proyecto.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#9CA3AF] hover:bg-[#D95510] hover:text-white transition-all duration-150 shrink-0"
                        title="Ver proyecto"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table footer */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-[#F8F9FA] border-t border-[#F3F4F6]">
              <p className="text-[11px] text-[#9CA3AF]">
                {proyectos.length} {proyectos.length === 1 ? 'proyecto' : 'proyectos'}
                {' · '}
                {totalPresupuestos} {totalPresupuestos === 1 ? 'presupuesto' : 'presupuestos'}
              </p>
              <p className="text-[12px] font-bold text-[#374151] tabular-nums">
                {formatCurrency(inversionTotal)}
              </p>
            </div>
          </>
        )}
      </div>

    </>
  );
}
