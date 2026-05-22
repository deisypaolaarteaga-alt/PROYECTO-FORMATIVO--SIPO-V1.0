import { getProveedor, getInsumosDelProveedor } from '@/actions/proveedores';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, User, MapPin, Phone, Mail, Globe,
  ChevronLeft, Package, FileText, Calendar,
} from 'lucide-react';
import { ProveedorDetailActions } from '@/components/proveedores/ProveedorDetailActions';
import { CATEGORIA_PROVEEDOR_LABELS } from '@/types';
import type { CategoriaProveedor } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const CATEGORIA_COLORS: Record<CategoriaProveedor, string> = {
  ferreteria:  'bg-[#E4E7EC] text-[#1F2937] border-[#C8CDD6]',
  contratista: 'bg-[#FAF0EB] text-[#B8440C] border-[#F0A882]',
  equipos:     'bg-[#EBF2FA] text-[#1E4D8C] border-[#A8C4DC]',
  laboratorio: 'bg-[#EBFAF0] text-[#166534] border-[#B8D9B8]',
  transporte:  'bg-[#E4E7EC] text-[#4B5563] border-[#C8CDD6]',
  servicios:   'bg-[#FEF3E2] text-[#7A4B00] border-[#F0D080]',
  otro:        'bg-[#DDE0E6] text-[#6B7A8D] border-[#C8CDD6]',
};

const TIPO_INSUMO_LABELS: Record<string, { label: string; color: string }> = {
  material:          { label: 'Material',         color: 'bg-[#EFF6FF] text-[#1E6FB8] border-[#BFDBFE]' },
  mano_obra:         { label: 'Mano de Obra',      color: 'bg-[#F0FDF4] text-[#2D7A45] border-[#BBF7D0]' },
  equipo:            { label: 'Equipo',            color: 'bg-[#FFF7ED] text-[#D97706] border-[#FDE68A]' },
  herramienta_menor: { label: 'Herr. Menor',       color: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]' },
  epp:               { label: 'EPP',               color: 'bg-[#FFF4EE] text-[#D95510] border-[#FDBA74]' },
};

function KPICard({ label, value, sub, highlight = false }: {
  label: string; value: string; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={cn(
      'bg-white rounded-xl border border-[#E5E7EB] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] px-5 py-4',
      highlight && 'border-l-[3px] border-l-[#D95510]',
    )}>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-1.5 leading-none">{label}</p>
      <p className="text-[21px] font-bold tabular-nums leading-none text-[#111827]">{value}</p>
      {sub && <p className="text-[11px] text-[#9CA3AF] mt-1.5 leading-none">{sub}</p>}
    </div>
  );
}

function ContactItem({ icon: Icon, label, children, topBorder = false }: {
  icon: React.ElementType; label: string; children: React.ReactNode; topBorder?: boolean;
}) {
  return (
    <div className={cn('flex items-start gap-3', topBorder && 'pt-4 border-t border-[#F3F4F6]')}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F4F6] shrink-0 mt-0.5">
        <Icon className="h-[15px] w-[15px] text-[#6B7280]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-0.5 leading-none">{label}</p>
        {children}
      </div>
    </div>
  );
}

export default async function ProveedorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [proveedor, insumos] = await Promise.all([
    getProveedor(id),
    getInsumosDelProveedor(id),
  ]);

  if (!proveedor) notFound();

  const esEmpresa = proveedor.tipo === 'empresa';

  const registradoEl = new Date(proveedor.created_at).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'America/Bogota',
  });

  const metaParts = [
    proveedor.nit_cedula ? (esEmpresa ? `NIT ${proveedor.nit_cedula}` : `C.C. ${proveedor.nit_cedula}`) : null,
    proveedor.ciudad ?? null,
    `Desde ${registradoEl}`,
  ].filter(Boolean);

  // Agrupar insumos por tipo
  const insumosPorTipo = insumos.reduce<Record<string, typeof insumos>>((acc, item) => {
    const tipo = item.tipo || 'material';
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* Breadcrumb */}
      <nav>
        <Link
          href="/proveedores"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-[#9CA3AF] hover:text-[#374151] transition-colors duration-150 group"
        >
          <ChevronLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
          Proveedores
        </Link>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF4EE] border border-[#FDBA74]/30 shrink-0">
            {esEmpresa
              ? <Building2 className="h-5 w-5 text-[#D95510]" />
              : <User className="h-5 w-5 text-[#D95510]" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-[22px] font-bold text-[#111827] leading-tight">
                {proveedor.nombre_razon_social}
              </h1>
              <span className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border',
                CATEGORIA_COLORS[proveedor.categoria],
              )}>
                {CATEGORIA_PROVEEDOR_LABELS[proveedor.categoria]}
              </span>
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border leading-none',
                esEmpresa
                  ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                  : 'bg-[#FFF7ED] text-[#D97706] border-[#FDE68A]',
              )}>
                {esEmpresa ? 'Empresa' : 'Persona natural'}
              </span>
            </div>
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

        <div className="shrink-0">
          <ProveedorDetailActions proveedor={proveedor} />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KPICard
          label="Insumos asociados"
          value={String(insumos.length)}
          sub={insumos.length === 0 ? 'Sin insumos aún' : `en ${Object.keys(insumosPorTipo).length} tipo${Object.keys(insumosPorTipo).length !== 1 ? 's' : ''}`}
          highlight
        />
        <KPICard
          label="Ciudad"
          value={proveedor.ciudad || '—'}
          sub="Ubicación registrada"
        />
        <KPICard
          label="Registrado el"
          value={registradoEl}
          sub={esEmpresa ? 'Persona jurídica' : 'Persona natural'}
        />
      </div>

      {/* Body dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Columna izquierda: contacto + notas */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F3F4F6]">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
                Información de contacto
              </p>
            </div>
            <div className="px-5 py-4 space-y-3.5">
              <ContactItem icon={Phone} label="Teléfono">
                {proveedor.telefono ? (
                  <a href={`tel:${proveedor.telefono}`} className="text-[13px] font-semibold text-[#D95510] hover:underline leading-snug">
                    {proveedor.telefono}
                  </a>
                ) : (
                  <p className="text-[13px] text-[#C4C9D4] italic leading-snug">No registrado</p>
                )}
              </ContactItem>

              <ContactItem icon={Mail} label="Email">
                {proveedor.email ? (
                  <a href={`mailto:${proveedor.email}`} className="text-[13px] font-semibold text-[#D95510] hover:underline break-all leading-snug">
                    {proveedor.email}
                  </a>
                ) : (
                  <p className="text-[13px] text-[#C4C9D4] italic leading-snug">No registrado</p>
                )}
              </ContactItem>

              <ContactItem icon={Globe} label="Sitio web">
                {proveedor.sitio_web ? (
                  <a href={proveedor.sitio_web} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-[#D95510] hover:underline break-all leading-snug">
                    {proveedor.sitio_web}
                  </a>
                ) : (
                  <p className="text-[13px] text-[#C4C9D4] italic leading-snug">No registrado</p>
                )}
              </ContactItem>

              <ContactItem icon={MapPin} label="Ciudad" topBorder>
                <p className="text-[13px] font-semibold text-[#111827] leading-snug">
                  {proveedor.ciudad || 'No especificada'}
                </p>
              </ContactItem>

              <ContactItem icon={Calendar} label="Identificación" topBorder>
                <p className="text-[13px] font-semibold text-[#111827] leading-snug">
                  {proveedor.nit_cedula || 'No registrado'}
                </p>
                <p className="text-[12px] text-[#6B7280] mt-0.5">
                  {esEmpresa ? 'NIT / Registro mercantil' : 'Cédula de ciudadanía'}
                </p>
              </ContactItem>
            </div>
          </div>

          {proveedor.notas && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F3F4F6]">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">Notas</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[13px] text-[#374151] italic leading-relaxed whitespace-pre-wrap">
                  &ldquo;{proveedor.notas}&rdquo;
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: insumos asociados */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-bold text-[#111827]">Insumos asociados</p>
                {insumos.length > 0 && (
                  <span className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full bg-[#D95510] text-white text-[10px] font-bold tabular-nums leading-none">
                    {insumos.length}
                  </span>
                )}
              </div>
            </div>

            {insumos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F4F6] mb-3">
                  <Package className="h-5 w-5 text-[#D1D5DB]" />
                </div>
                <p className="text-[13px] font-semibold text-[#374151] mb-1">Sin insumos asociados</p>
                <p className="text-[12px] text-[#9CA3AF] max-w-xs">
                  Este proveedor aún no está asignado a ningún insumo en tus APUs.
                  Asígnalo desde la pestaña &ldquo;Explosión de Insumos&rdquo; de un presupuesto.
                </p>
              </div>
            ) : (
              <>
                {/* Tabla de insumos agrupada por tipo */}
                <div className="divide-y divide-[#F3F4F6]">
                  {Object.entries(insumosPorTipo).map(([tipo, items]) => {
                    const cfg = TIPO_INSUMO_LABELS[tipo] ?? { label: tipo, color: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]' };
                    return (
                      <div key={tipo}>
                        {/* Encabezado de grupo */}
                        <div className="flex items-center gap-2 px-5 py-2 bg-[#F8F9FA] border-b border-[#F3F4F6]">
                          <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border', cfg.color)}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-[#9CA3AF]">{items.length} ítem{items.length !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Filas */}
                        <div className="divide-y divide-[#F3F4F6]">
                          {items.map(item => (
                            <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#FAFAFA] transition-colors">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F4F6] shrink-0">
                                <FileText className="h-3.5 w-3.5 text-[#9CA3AF]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-[#111827] truncate">{item.nombre}</p>
                                <p className="text-[11px] text-[#9CA3AF] mt-0.5">{item.unidad}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[13px] font-semibold text-[#111827] tabular-nums">
                                  {formatCurrency(Number(item.precio_unitario ?? 0))}
                                </p>
                                <p className="text-[10px] text-[#9CA3AF]">por {item.unidad}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-5 py-2.5 bg-[#F8F9FA] border-t border-[#F3F4F6]">
                  <p className="text-[11px] text-[#9CA3AF]">
                    {insumos.length} insumo{insumos.length !== 1 ? 's' : ''} · asignados desde Explosión de Insumos
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
