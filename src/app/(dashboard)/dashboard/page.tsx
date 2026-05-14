import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { EstadoBadge } from '@/components/shared/Badge';
import {
  FolderOpen,
  DollarSign,
  FileText,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { Project, Budget } from '@/types';
import { cn } from '@/lib/utils';
import { DashboardActions } from '@/components/dashboard/DashboardActions';

/**
 * Dashboard — construcción palette
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre_completo, empresa')
    .eq('id', user?.id ?? '')
    .maybeSingle();

  const nombre = profile?.nombre_completo?.split(' ')[0]
    || user?.user_metadata?.nombre_completo?.split(' ')[0]
    || user?.user_metadata?.full_name?.split(' ')[0]
    || 'Usuario';

  const ahora = new Date();
  const horaBogota = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    hour12: false,
  }).format(ahora);
  const hora = parseInt(horaBogota, 10);
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  const hoy = ahora.toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user?.id ?? '')
    .order('updated_at', { ascending: false })
    .limit(5);

  const { data: budgets } = await supabase
    .from('budgets')
    .select('id, costo_directo, estado, created_at')
    .eq('user_id', user?.id ?? '');

  const proyectosActivos = (projects as Project[] | null)?.filter(
    (p) => ['activo', 'cotizacion', 'ejecucion'].includes(p.estado)
  ).length ?? 0;

  const totalPresupuestado = (budgets as Budget[] | null)?.reduce(
    (sum, b) => sum + (Number(b.costo_directo) || 0),
    0
  ) ?? 0;

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const presupuestosEsteMes = (budgets as Budget[] | null)?.filter(
    (b) => new Date(b.created_at) >= inicioMes
  ).length ?? 0;

  const ultimoProyecto = (projects as Project[] | null)?.[0] ?? null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-ink">
            {saludo}, {nombre}
          </h1>
          <p className="text-[13px] text-stone capitalize">{hoy}</p>
        </div>
        <DashboardActions />
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<FolderOpen className="h-5 w-5" />}
          label="Proyectos activos"
          value={String(proyectosActivos)}
          color="steel"
        />
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Total presupuestado"
          value={formatCurrency(totalPresupuestado)}
          color="success"
        />
        <MetricCard
          icon={<FileText className="h-5 w-5" />}
          label="Presupuestos este mes"
          value={String(presupuestosEsteMes)}
          color="burn"
        />
        <MetricCard
          icon={<Clock className="h-5 w-5" />}
          label="Último actualizado"
          value={ultimoProyecto ? formatDate(ultimoProyecto.updated_at) : '—'}
          color="info"
        />
      </div>

      {/* ── Proyectos recientes ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-semibold text-ink">
            Proyectos recientes
          </h2>
          <Link
            href="/proyectos"
            className="text-[13px] text-[var(--accent-primary)] hover:text-[var(--accent-hover)] font-medium flex items-center gap-1 transition-colors"
          >
            Ver todos
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {!projects || projects.length === 0 ? (
            <EmptyState
              icon="folder"
              title="Sin proyectos aún"
              description="Crea tu primer proyecto para empezar a presupuestar."
              actionLabel="Crear proyecto"
              actionHref="/proyectos/nuevo"
            />
        ) : (
          <div className="space-y-2">
            {(projects as Project[]).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Metric Card ──
function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'steel' | 'success' | 'burn' | 'info';
}) {
  const bgMap = {
    steel: 'bg-steel-fog',
    success: 'bg-success-bg',
    burn: 'bg-burn-pale',
    info: 'bg-info-bg',
  };
  const iconMap = {
    steel: 'text-steel-mid',
    success: 'text-success-text',
    burn: 'text-burn-deep',
    info: 'text-info-text',
  };

  return (
    <Card padding="md">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-[8px] ${bgMap[color]}`}>
          <span className={iconMap[color]}>{icon}</span>
        </div>
        <div>
          <p className="text-[11px] text-stone font-medium mb-0.5">{label}</p>
          <p className="text-[20px] font-semibold text-ink leading-tight">{value}</p>
        </div>
      </div>
    </Card>
  );
}

// ── Project Card ──
function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/proyectos/${project.id}`}>
      <Card hover padding="md" className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-ink truncate">
            {project.nombre}
          </p>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone">
            {project.cliente_nombre && <span>{project.cliente_nombre}</span>}
            {project.cliente_nombre && project.ubicacion && <span>·</span>}
            {project.ubicacion && <span>{project.ubicacion}</span>}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          <EstadoBadge estado={project.estado} />
          <span className="text-[11px] text-stone hidden sm:block">
            {formatDate(project.updated_at)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
