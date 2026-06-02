export const maxDuration = 60;

import { getProject } from '@/actions/proyectos';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, MapPin, User, Calendar, Building2, FileText,
} from 'lucide-react';
import { ProjectActions } from '@/components/proyectos/ProjectActions';
import { BudgetListItem } from '@/components/proyectos/BudgetListItem';
import { NuevoPresupuestoEnProyecto } from '@/components/proyectos/NuevoPresupuestoEnProyecto';
import { ClienteCardProyecto } from '@/components/proyectos/ClienteCardProyecto';
import { NuevoPresupuestoHeaderButton } from '@/components/proyectos/NuevoPresupuestoHeaderButton';
import { cn } from '@/lib/utils';

interface Props { params: Promise<{ id: string }> }

const TIPO_OBRA_LABELS: Record<string, string> = {
  residencial:     'Residencial',
  comercial:       'Comercial',
  infraestructura: 'Infraestructura',
  hotelero:        'Hotelero',
  industrial:      'Industrial',
  institucional:   'Institucional',
  otro:            'Otro',
};

const ESTADO_PROYECTO: Record<string, { label: string; cls: string }> = {
  borrador:    { label: 'Borrador',    cls: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]'    },
  en_progreso: { label: 'En progreso', cls: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]'    },
  finalizado:  { label: 'Finalizado',  cls: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'    },
  archivado:   { label: 'Archivado',   cls: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]'    },
};

const fmtFecha = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Bogota',
  }).format(new Date(iso));

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const supabase = await createClient();
  const { data: budgets } = await supabase
    .from('budgets')
    .select('id, titulo, estado, updated_at, created_at, vigencia_dias')
    .eq('project_id', id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  const totalesMap: Record<string, number> = {};
  if (budgets && budgets.length > 0) {
    const { data: resumenes } = await supabase
      .from('v_resumen_presupuesto')
      .select('budget_id, costo_directo, total_oferta')
      .in('budget_id', budgets.map(b => b.id));
    for (const r of resumenes ?? []) {
      totalesMap[r.budget_id] = Number(r.total_oferta || r.costo_directo) || 0;
    }
  }

  const estadoCfg = ESTADO_PROYECTO[project.estado] ?? ESTADO_PROYECTO.borrador;
  const tipoObraLabel = project.tipo_obra ? (TIPO_OBRA_LABELS[project.tipo_obra] ?? project.tipo_obra) : null;
  const cliente = (project as any).clientes ?? null;

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav>
        <Link
          href="/proyectos"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-[#9CA3AF] hover:text-[#374151] transition-colors duration-150 group"
        >
          <ChevronLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
          Proyectos
        </Link>
      </nav>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

        {/* Bloque de identidad */}
        <div className="flex items-start gap-3.5">
          {/* Ícono de tipo de obra */}
          <div className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF4EE] border border-[#FDBA74]/30 shrink-0">
            <Building2 className="h-5 w-5 text-[#D95510]" />
          </div>

          <div>
            {/* Nombre + badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-[22px] font-bold text-[#111827] leading-tight">
                {project.nombre}
              </h1>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border leading-none',
                  estadoCfg.cls,
                )}
              >
                {estadoCfg.label}
              </span>
              {tipoObraLabel && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border leading-none bg-[#F5F0EA] text-[#5A5248] border-[#E8E4DE]">
                  {tipoObraLabel}
                </span>
              )}
              {project.area_m2 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border leading-none bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]">
                  {project.area_m2} m²
                </span>
              )}
            </div>

            {/* Meta line */}
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#9CA3AF]">
              {project.ubicacion && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {project.ubicacion}
                </span>
              )}
              {cliente?.nombre_razon_social && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  {cliente.nombre_razon_social}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Creado {fmtFecha(project.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="shrink-0">
          <ProjectActions
            projectId={id}
            projectNombre={project.nombre}
            projectEstado={project.estado}
            projectTipoObra={project.tipo_obra ?? undefined}
            projectDescripcion={project.descripcion}
            projectUbicacion={project.ubicacion}
            projectClienteId={project.cliente_id ?? null}
            projectClienteNombre={cliente?.nombre_razon_social ?? project.cliente_nombre ?? null}
            projectAreaM2={project.area_m2 ?? null}
          />
        </div>
      </div>

      {/* ── Cuerpo — dos columnas ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── Columna izquierda: Presupuestos (60%) ─────────────────────── */}
        <div className="lg:col-span-3 space-y-3">

          {/* Cabecera de sección */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-[#111827]">Presupuestos</h2>
              {budgets && budgets.length > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-[#F3F4F6] text-[#6B7280] text-[11px] font-bold leading-none">
                  {budgets.length}
                </span>
              )}
            </div>
            {budgets && budgets.length > 0 && (
              <NuevoPresupuestoHeaderButton
                proyectoId={id}
                proyectoNombre={project.nombre}
                proyectoTipoObra={project.tipo_obra}
                proyectoUbicacion={project.ubicacion}
              />
            )}
          </div>

          {/* Lista o estado vacío */}
          {!budgets || budgets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB]">
              <NuevoPresupuestoEnProyecto
                proyectoId={id}
                proyectoNombre={project.nombre}
                proyectoTipoObra={project.tipo_obra}
                proyectoUbicacion={project.ubicacion}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {budgets.map((b: any) => (
                <BudgetListItem
                  key={b.id}
                  budget={b}
                  projectId={id}
                  total={totalesMap[b.id] ?? 0}
                  tipoObra={project.tipo_obra ?? null}
                  areaM2={project.area_m2 ?? null}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Columna derecha: Info + Cliente (40%) ──────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Tarjeta Información del proyecto */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F3F4F6]">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
                Información del proyecto
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* Área + tipo */}
              {(project.area_m2 || tipoObraLabel) && (
                <div className="flex flex-wrap gap-2">
                  {project.area_m2 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">Área</span>
                      <span className="text-[13px] font-semibold text-[#111827]">{project.area_m2} m²</span>
                    </div>
                  )}
                  {project.area_m2 && tipoObraLabel && (
                    <span className="text-[#D1D5DB]">·</span>
                  )}
                  {tipoObraLabel && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">Tipo</span>
                      <span className="text-[13px] font-semibold text-[#111827]">{tipoObraLabel}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Ciudad de la obra */}
              {project.ubicacion && (
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F3F4F6]">
                    <MapPin className="h-3.5 w-3.5 text-[#6B7280]" />
                  </div>
                  <span className="text-[13px] text-[#374151]">{project.ubicacion}</span>
                </div>
              )}

              {/* Fecha de creación */}
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F3F4F6]">
                  <Calendar className="h-3.5 w-3.5 text-[#6B7280]" />
                </div>
                <span className="text-[13px] text-[#374151]">Creado el {fmtFecha(project.created_at)}</span>
              </div>

              {/* Descripción */}
              {project.descripcion && (
                <div className="pt-2 border-t border-[#F3F4F6]">
                  <p className="text-[13px] text-[#6B7280] leading-relaxed">{project.descripcion}</p>
                </div>
              )}

              {/* Empty state info */}
              {!project.area_m2 && !tipoObraLabel && !project.ubicacion && !project.descripcion && (
                <div className="flex items-center gap-2 py-2">
                  <FileText className="h-4 w-4 text-[#D1D5DB]" />
                  <p className="text-[12px] text-[#9CA3AF] italic">Sin información adicional registrada</p>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta Cliente */}
          <ClienteCardProyecto projectId={id} cliente={cliente} />
        </div>
      </div>
    </div>
  );
}

