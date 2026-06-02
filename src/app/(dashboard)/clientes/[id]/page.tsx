import { getCliente } from '@/actions/clientes';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, User, MapPin, Phone, Mail,
  ChevronLeft,
  AlertTriangle,
} from 'lucide-react';
import { ProyectosAsociadosCliente } from '@/components/clientes/ProyectosAsociadosCliente';
import { formatCurrency } from '@/lib/utils/format';
import { ClienteDetailActions } from '@/components/clientes/ClienteDetailActions';
import { cn } from '@/lib/utils';

// ── KPI Card ───────────────────────────────────────────────────────────────────
// Tres métricas clave escaneables en el tope de la página — patrón Stripe Analytics.
// highlight=true aplica border-l de acento en la métrica principal (inversión).

function KPICard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-[#E5E7EB] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] px-5 py-4',
        highlight && 'border-l-[3px] border-l-[#D95510]',
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-1.5 leading-none">
        {label}
      </p>
      <p className="text-[21px] font-bold tabular-nums leading-none text-[#111827]">{value}</p>
      {sub && (
        <p className="text-[11px] text-[#9CA3AF] mt-1.5 leading-none">{sub}</p>
      )}
    </div>
  );
}

// ── Contact item ───────────────────────────────────────────────────────────────
// Íconos en gris neutro — el color naranja se reserva para los valores
// interactivos (teléfono, email), no para decoración de fila.

function ContactItem({
  icon: Icon,
  label,
  children,
  topBorder = false,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  topBorder?: boolean;
}) {
  return (
    <div className={cn('flex items-start gap-3', topBorder && 'pt-4 border-t border-[#F3F4F6]')}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F4F6] shrink-0 mt-0.5">
        <Icon className="h-[15px] w-[15px] text-[#6B7280]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-0.5 leading-none">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();

  const proyectos = ((cliente as any).projects ?? []).filter((p: any) => !p.deleted_at);
  console.log('[ClienteDetailPage] proyectos recibidos:', (cliente as any).projects?.length ?? 0, '→ activos:', proyectos.length);

  // Inversión acumulada = suma de total_oferta de todos los presupuestos
  let inversionTotal = 0;
  proyectos.forEach((p: any) => {
    (p.budgets ?? []).forEach((b: any) => {
      inversionTotal += Number(b.total_oferta ?? 0);
    });
  });

  const totalPresupuestos: number = proyectos.reduce(
    (acc: number, p: any) => acc + (p.budgets?.length ?? 0),
    0,
  );

  const esEmpresa = cliente.tipo === 'empresa';

  const registradoEl = new Date(cliente.created_at).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Bogota',
  });

  // Meta line: NIT · Ciudad · Registro
  const metaParts = [
    cliente.nit_cedula ? `NIT ${cliente.nit_cedula}` : null,
    cliente.ciudad ?? null,
    `Desde ${registradoEl}`,
  ].filter(Boolean);

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-[#9CA3AF] hover:text-[#374151] transition-colors duration-150 group"
        >
          <ChevronLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
          Clientes
        </Link>
      </nav>

      {/* ── Inactive banner ─────────────────────────────────────────────────── */}
      {!cliente.activo && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#FFF7ED] border border-[#FDBA74]">
          <AlertTriangle className="h-4 w-4 text-[#D97706] shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#92400E]">
            <strong className="font-semibold">Cliente inactivo.</strong>{' '}
            No aparece en búsquedas ni puede vincularse a nuevos proyectos.
            Usa el botón <strong className="font-semibold">Reactivar</strong> para habilitarlo nuevamente.
          </p>
        </div>
      )}

      {/* ── Client header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

        {/* Identity block */}
        <div className="flex items-start gap-3.5">
          {/* Avatar — brand moment, único uso de naranja en esta zona */}
          <div className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF4EE] border border-[#FDBA74]/30 shrink-0">
            {esEmpresa
              ? <Building2 className="h-5 w-5 text-[#D95510]" />
              : <User className="h-5 w-5 text-[#D95510]" />}
          </div>

          <div>
            {/* Name + type badge */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-[22px] font-bold text-[#111827] leading-tight">
                {cliente.nombre_razon_social}
              </h1>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border leading-none',
                  esEmpresa
                    ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                    : 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
                )}
              >
                {esEmpresa ? 'Empresa' : 'Persona natural'}
              </span>
            </div>

            {/* Meta line — puntos separadores, escaneables */}
            <p className="text-[12px] text-[#9CA3AF] leading-none">
              {metaParts.map((part, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-1.5 text-[#D1D5DB]">·</span>}
                  {part}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* Actions — componente cliente, sin tocar */}
        <div className="shrink-0">
          <ClienteDetailActions cliente={cliente as any} />
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────────── */}
      {/* Las 3 métricas clave siempre visibles sin scroll. Elimina la necesidad   */}
      {/* del "financial card" oscuro en la columna izquierda (evita redundancia). */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KPICard
          label="Inversión total acumulada"
          value={formatCurrency(inversionTotal)}
          sub={`en ${proyectos.length} proyecto${proyectos.length !== 1 ? 's' : ''}`}
          highlight
        />
        <KPICard
          label="Proyectos asociados"
          value={String(proyectos.length)}
          sub={
            proyectos.length === 0
              ? 'Sin proyectos aún'
              : `${totalPresupuestos} presupuesto${totalPresupuestos !== 1 ? 's' : ''} en total`
          }
        />
        <KPICard
          label="Promedio por proyecto"
          value={
            proyectos.length > 0
              ? formatCurrency(inversionTotal / proyectos.length)
              : formatCurrency(0)
          }
          sub={
            totalPresupuestos > 0
              ? `${(totalPresupuestos / Math.max(proyectos.length, 1)).toFixed(1)} presupuestos/proyecto`
              : 'Sin datos'
          }
        />
      </div>

      {/* ── Two-column body ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Left column: contact + notes ──────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Contact card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F3F4F6]">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
                Información de contacto
              </p>
            </div>
            <div className="px-5 py-4 space-y-3.5">

              <ContactItem
                icon={esEmpresa ? Building2 : User}
                label="Contacto principal"
              >
                <p className="text-[13px] font-semibold text-[#111827] leading-snug">
                  {cliente.nombre_contacto || 'No especificado'}
                </p>
                {cliente.cargo_contacto && (
                  <p className="text-[12px] text-[#6B7280] mt-0.5 leading-snug">
                    {cliente.cargo_contacto}
                  </p>
                )}
              </ContactItem>

              <ContactItem icon={Phone} label="Teléfono">
                {cliente.telefono ? (
                  <a
                    href={`tel:${cliente.telefono}`}
                    className="text-[13px] font-semibold text-[#D95510] hover:underline leading-snug"
                  >
                    {cliente.telefono}
                  </a>
                ) : (
                  <p className="text-[13px] text-[#C4C9D4] italic leading-snug">No registrado</p>
                )}
              </ContactItem>

              <ContactItem icon={Mail} label="Email">
                {cliente.email ? (
                  <a
                    href={`mailto:${cliente.email}`}
                    className="text-[13px] font-semibold text-[#D95510] hover:underline break-all leading-snug"
                  >
                    {cliente.email}
                  </a>
                ) : (
                  <p className="text-[13px] text-[#C4C9D4] italic leading-snug">No registrado</p>
                )}
              </ContactItem>

              {/* Ubicación separada visualmente — dato de diferente naturaleza */}
              <ContactItem icon={MapPin} label="Ubicación" topBorder>
                <p className="text-[13px] font-semibold text-[#111827] leading-snug">
                  {[cliente.ciudad, cliente.departamento].filter(Boolean).join(', ') || 'No especificado'}
                </p>
                {cliente.direccion && (
                  <p className="text-[12px] text-[#6B7280] mt-0.5 leading-snug">
                    {cliente.direccion}
                  </p>
                )}
              </ContactItem>
            </div>
          </div>

          {/* Notes card — sólo si hay contenido */}
          {cliente.notas && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F3F4F6]">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
                  Notas
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[13px] text-[#374151] italic leading-relaxed whitespace-pre-wrap">
                  "{cliente.notas}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: projects + presupuestos ────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <ProyectosAsociadosCliente initialProyectos={proyectos} />
        </div>
      </div>
    </div>
  );
}
