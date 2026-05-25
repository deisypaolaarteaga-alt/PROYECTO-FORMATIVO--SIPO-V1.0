import { getProject } from '@/actions/proyectos';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/shared/Button';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Plus, MapPin, User, Calendar, Building2 } from 'lucide-react';
import { ProjectActions } from '@/components/proyectos/ProjectActions';
import { BudgetListItem } from '@/components/proyectos/BudgetListItem';

interface Props { params: Promise<{ id: string }> }

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const supabase = await createClient();
  const { data: budgets } = await supabase
    .from('budgets')
    .select('id, titulo, estado, updated_at')
    .eq('project_id', id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  const totalesMap: Record<string, number> = {};
  if (budgets && budgets.length > 0) {
    const { data: resumenes } = await supabase
      .from('v_resumen_presupuesto')
      .select('budget_id, costo_directo')
      .in('budget_id', budgets.map(b => b.id));
    for (const r of resumenes ?? []) {
      totalesMap[r.budget_id] = Number(r.costo_directo) || 0;
    }
  }

  const estadoStyles: Record<string, string> = {
    borrador:    'bg-[#E4E7EC] text-[#4B5563]',
    en_progreso: 'bg-[#EBFAF0] text-[#166534]',
    finalizado:  'bg-[#EBF2FA] text-[#1E4D8C]',
    archivado:   'bg-[#DDE0E6] text-[#6B7A8D] border border-[#C8CDD6]',
  };

  const estadoLabels: Record<string, string> = {
    borrador:    'Borrador',
    en_progreso: 'En progreso',
    finalizado:  'Finalizado',
    archivado:   'Archivado',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/proyectos" className="inline-flex items-center gap-2 text-sm text-[#6B7A8D] hover:text-[#4B5563] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Proyectos
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1F2937]">{project.nombre}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${estadoStyles[project.estado] ?? estadoStyles.borrador}`}>
              {estadoLabels[project.estado] ?? project.estado}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#6B7A8D]">
            {project.ubicacion && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />{project.ubicacion}
              </span>
            )}
            {(project.clientes?.nombre_razon_social || project.cliente_nombre) && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {project.clientes?.nombre_razon_social || project.cliente_nombre}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />Creado {formatDate(project.created_at)}
            </span>
          </div>
        </div>
        <ProjectActions
          projectId={id}
          projectNombre={project.nombre}
          projectEstado={project.estado}
          projectTipoObra={project.tipo_obra ?? undefined}
          projectDescripcion={project.descripcion}
          projectUbicacion={project.ubicacion}
          projectClienteId={project.cliente_id ?? null}
          projectClienteNombre={(project as any).clientes?.nombre_razon_social ?? project.cliente_nombre ?? null}
        />
      </div>

      {/* Presupuestos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1F2937]">Presupuestos</h2>
          <Link href={`/proyectos/${id}/presupuesto-nuevo`}>
            <Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />}>Agregar manual</Button>
          </Link>
        </div>

        {!budgets || budgets.length === 0 ? (
          <EmptyState
            icon="file"
            title="Sin presupuestos"
            description="Crea un presupuesto manualmente o utiliza la plantilla sugerida."
            actionLabel="Nuevo presupuesto"
            actionHref={`/proyectos/${id}/presupuesto-nuevo`}
          />
        ) : (
          <div className="space-y-3">
            {budgets.map((b: any) => (
              <BudgetListItem
                key={b.id}
                budget={b}
                projectId={id}
                total={totalesMap[b.id] ?? 0}
              />
            ))}
          </div>
        )}
      </section>

      {/* Info & Cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {project.descripcion && (
          <section>
            <h2 className="text-base font-semibold text-[#1F2937] mb-3">Información</h2>
            <Card padding="md">
              <p className="text-sm text-[#4B5563] leading-relaxed">{project.descripcion}</p>
              {project.area_m2 && <p className="text-xs text-[#6B7A8D] mt-2">Área: {project.area_m2} m²</p>}
              {project.tipo_obra && <p className="text-xs text-[#6B7A8D]">Tipo: {project.tipo_obra}</p>}
            </Card>
          </section>
        )}

        {project.clientes && (
          <section>
            <h2 className="text-base font-semibold text-[#1F2937] mb-3">Cliente</h2>
            <Card padding="md" className="flex items-center justify-between group hover:border-[#D95510]/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-[#E4E7EC] flex items-center justify-center text-[#6B7A8D] group-hover:text-[#D95510] group-hover:bg-[#FAF0EB] transition-colors">
                  {project.clientes.tipo === 'empresa' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1F2937]">{project.clientes.nombre_razon_social}</p>
                  <p className="text-xs text-[#6B7A8D]">{project.clientes.nit_cedula || 'Sin NIT'}</p>
                </div>
              </div>
              <Link href={`/clientes/${project.clientes.id}`}>
                <Button variant="ghost" size="sm">Ver cliente</Button>
              </Link>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
