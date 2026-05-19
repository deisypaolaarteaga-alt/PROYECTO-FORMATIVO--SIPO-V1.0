import { getCliente } from '@/actions/clientes';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, User, MapPin, Phone, Mail,
  Briefcase, Calendar, ChevronLeft, ArrowRight, Layers,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { ClienteDetailActions } from '@/components/clientes/ClienteDetailActions';
import { cn } from '@/lib/utils';

// ── Tipo de obra badge ─────────────────────────────────────────────────────────
// Paleta semántica por categoría — ayuda escaneo visual en la tabla de proyectos

const TIPO_OBRA_MAP: Record<string, { label: string; cls: string }> = {
  residencial:     { label: 'Residencial',     cls: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'  },
  comercial:       { label: 'Comercial',        cls: 'bg-[#FFF4EE] text-[#D95510] border-[#FDBA74]'  },
  infraestructura: { label: 'Infraestructura',  cls: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]'  },
  institucional:   { label: 'Institucional',    cls: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]'  },
  industrial:      { label: 'Industrial',       cls: 'bg-[#FFF7ED] text-[#D97706] border-[#FDE68A]'  },
  hotelero:        { label: 'Hotelero',         cls: 'bg-[#FDF2F8] text-[#9D174D] border-[#FBCFE8]'  },
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

  const proyectos = (cliente as any).projects ?? [];

  // Inversión acumulada = suma de costo_directo de todos los presupuestos
  let inversionTotal = 0;
  proyectos.forEach((p: any) => {
    (p.budgets ?? []).forEach((b: any) => {
      inversionTotal += Number(b.costo_directo ?? 0);
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
                    : 'bg-[#FFF7ED] text-[#D97706] border-[#FDE68A]',
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

        {/* ── Right column: projects table ─────────────────────────────────── */}
        <div className="lg:col-span-2">
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

              /* ── Empty state ──────────────────────────────────────────────── */
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

                {/* ── Column header row — alineación visual de tabla ─────────── */}
                <div className="flex items-center gap-4 px-5 py-2 bg-[#F8F9FA] border-b border-[#F3F4F6]">
                  {/* icon spacer */}
                  <div className="hidden sm:block w-9 shrink-0" />
                  <p className="flex-1 min-w-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
                    Proyecto
                  </p>
                  <p className="hidden md:block w-[120px] shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
                    Tipo de obra
                  </p>
                  <p className="w-[136px] shrink-0 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
                    Costo directo
                  </p>
                  {/* arrow spacer */}
                  <div className="w-8 shrink-0" />
                </div>

                {/* ── Project rows ───────────────────────────────────────────── */}
                <div className="divide-y divide-[#F3F4F6]">
                  {proyectos.map((proyecto: any) => {
                    const totalProyecto: number = (proyecto.budgets ?? []).reduce(
                      (acc: number, b: any) => acc + Number(b.costo_directo ?? 0),
                      0,
                    );
                    const numPresupuestos: number = proyecto.budgets?.length ?? 0;

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
                        {/* Project icon — cambia a naranja en hover del row */}
                        <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F4F6] shrink-0 group-hover:bg-[#FFF4EE] transition-colors duration-150">
                          <Layers className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#D95510] transition-colors duration-150" />
                        </div>

                        {/* Name + meta */}
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

                        {/* Tipo badge — columna fija en md+ */}
                        <div className="hidden md:flex w-[120px] shrink-0">
                          <TipoObraBadge tipo={proyecto.tipo_obra} />
                        </div>

                        {/* Cost — columna fija, alineada con header */}
                        <div className="w-[136px] shrink-0 text-right">
                          <p className="text-[14px] font-bold text-[#111827] tabular-nums leading-tight">
                            {formatCurrency(totalProyecto)}
                          </p>
                          <p className="text-[11px] text-[#9CA3AF] mt-0.5 leading-none">
                            {numPresupuestos} {numPresupuestos === 1 ? 'presupuesto' : 'presupuestos'}
                          </p>
                        </div>

                        {/* Navigation arrow */}
                        <Link
                          href={`/proyectos/${proyecto.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#9CA3AF] hover:bg-[#D95510] hover:text-white transition-all duration-150 shrink-0"
                          title="Ver proyecto"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {/* ── Table footer ───────────────────────────────────────────── */}
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
        </div>
      </div>
    </div>
  );
}
