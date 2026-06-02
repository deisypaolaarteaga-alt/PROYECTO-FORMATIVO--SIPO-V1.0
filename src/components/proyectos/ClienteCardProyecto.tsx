'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, User, Phone, Mail, MapPin, UserPlus, ExternalLink, RefreshCw,
} from 'lucide-react';
import { ClienteSelector } from '@/components/clientes/ClienteSelector';
import { asignarClienteAProyecto } from '@/actions/proyectos';

interface ClienteData {
  id: string;
  tipo: 'persona_natural' | 'empresa';
  nombre_razon_social: string;
  nit_cedula?: string | null;
  nombre_contacto?: string | null;
  cargo_contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  ciudad?: string | null;
}

interface ClienteCardProyectoProps {
  projectId: string;
  cliente: ClienteData | null;
}

function ContactRow({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-[#F3F4F6] shrink-0">
        <Icon className="h-3.5 w-3.5 text-[#6B7280]" />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function ClienteCardProyecto({ projectId, cliente }: ClienteCardProyectoProps) {
  const router = useRouter();
  const [cambiando, setCambiando] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAsignar(clienteId: string | null) {
    if (!clienteId) return;
    setLoading(true);
    const result = await asignarClienteAProyecto(projectId, clienteId);
    setLoading(false);
    if (result.success) {
      setCambiando(false);
      router.refresh();
    }
  }

  const esEmpresa = cliente?.tipo === 'empresa';

  // ── Sin cliente ──────────────────────────────────────────────────────────
  if (!cliente) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#F3F4F6]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
            Cliente
          </p>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]">
              <UserPlus className="h-5 w-5 text-[#9CA3AF]" />
            </div>
            <p className="text-[13px] text-[#9CA3AF]">Sin cliente asignado</p>
          </div>
          {loading ? (
            <p className="text-center text-[12px] text-[#9CA3AF]">Asignando…</p>
          ) : (
            <ClienteSelector
              selectedId={null}
              onSelect={handleAsignar}
              required={false}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Con cliente ──────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
      <div className="px-5 py-3 border-b border-[#F3F4F6] flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
          Cliente
        </p>
        <button
          onClick={() => setCambiando(v => !v)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9CA3AF] hover:text-[#374151] transition-colors duration-150"
        >
          <RefreshCw className="h-3 w-3" />
          {cambiando ? 'Cancelar' : 'Cambiar'}
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Identidad */}
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF4EE] border border-[#FDBA74]/30 shrink-0">
            {esEmpresa
              ? <Building2 className="h-5 w-5 text-[#D95510]" />
              : <User className="h-5 w-5 text-[#D95510]" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <p className="text-[15px] font-bold text-[#111827] leading-tight truncate">
                {cliente.nombre_razon_social}
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border leading-none shrink-0 ${
                  esEmpresa
                    ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                    : 'bg-[#FFF7ED] text-[#D97706] border-[#FDE68A]'
                }`}
              >
                {esEmpresa ? 'Empresa' : 'Persona natural'}
              </span>
            </div>
            {cliente.nit_cedula ? (
              <p className="text-[11px] text-[#9CA3AF] leading-none">
                {esEmpresa ? 'NIT' : 'Cédula'} {cliente.nit_cedula}
              </p>
            ) : (
              <p className="text-[11px] text-[#C4C9D4] italic leading-none">Sin {esEmpresa ? 'NIT' : 'cédula'}</p>
            )}
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-[#F3F4F6]" />

        {/* Contacto */}
        <div className="space-y-3">
          {(cliente.nombre_contacto || cliente.cargo_contacto) && (
            <ContactRow icon={esEmpresa ? Building2 : User}>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-0.5 leading-none">
                Contacto principal
              </p>
              {cliente.nombre_contacto && (
                <p className="text-[13px] font-semibold text-[#111827] leading-snug">
                  {cliente.nombre_contacto}
                </p>
              )}
              {cliente.cargo_contacto && (
                <p className="text-[12px] text-[#6B7280] leading-snug">{cliente.cargo_contacto}</p>
              )}
            </ContactRow>
          )}

          <ContactRow icon={Phone}>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-0.5 leading-none">
              Teléfono
            </p>
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
          </ContactRow>

          <ContactRow icon={Mail}>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-0.5 leading-none">
              Email
            </p>
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
          </ContactRow>

          {cliente.ciudad && (
            <ContactRow icon={MapPin}>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-0.5 leading-none">
                Ciudad
              </p>
              <p className="text-[13px] font-semibold text-[#111827] leading-snug">{cliente.ciudad}</p>
            </ContactRow>
          )}
        </div>

        {/* Selector de cambio de cliente */}
        {cambiando && (
          <div className="border-t border-[#F3F4F6] pt-4">
            {loading ? (
              <p className="text-center text-[12px] text-[#9CA3AF]">Actualizando…</p>
            ) : (
              <ClienteSelector
                selectedId={cliente.id}
                initialCliente={{
                  id: cliente.id,
                  nombre_razon_social: cliente.nombre_razon_social,
                  nit_cedula: cliente.nit_cedula,
                  ciudad: cliente.ciudad,
                }}
                onSelect={handleAsignar}
                required={false}
              />
            )}
          </div>
        )}

        {/* Acciones */}
        {!cambiando && (
          <div className="border-t border-[#F3F4F6] pt-3">
            <Link
              href={`/clientes/${cliente.id}`}
              className="flex items-center justify-center gap-1.5 w-full h-8 rounded-lg border border-[#E5E7EB] text-[12px] font-semibold text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-colors duration-150"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver cliente completo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
