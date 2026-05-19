'use client';

import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

type EstadoPresupuesto = 'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'archivado';

interface EstadoBadgeProps {
  estado: EstadoPresupuesto;
  fechaActualizacion?: string;
  mostrarFecha?: boolean;
  className?: string;
}

const ESTADOS_CONFIG: Record<EstadoPresupuesto, { label: string; styles: string }> = {
  borrador:    { label: 'Borrador',    styles: 'bg-[#E4E7EC] text-[#4B5563]' },
  en_revision: { label: 'En Revisión', styles: 'bg-[#FEF3E2] text-[#7A4B00]' },
  aprobado:    { label: 'Aprobado',    styles: 'bg-[#EBFAF0] text-[#166534]' },
  rechazado:   { label: 'Rechazado',   styles: 'bg-[#FEF0F0] text-[#991B1B]' },
  archivado:   { label: 'Archivado',   styles: 'bg-[#E4E7EC] text-[#6B7A8D] border border-[#C8CDD6]' },
};

export function EstadoBadge({ estado, fechaActualizacion, mostrarFecha, className }: EstadoBadgeProps) {
  const config = ESTADOS_CONFIG[estado] ?? ESTADOS_CONFIG.borrador;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-[20px] text-[11px] font-medium leading-tight transition-colors duration-150',
        config.styles
      )}>
        {config.label}
      </span>

      {mostrarFecha && fechaActualizacion && (
        <div className="flex items-center gap-1.5 text-[10px] text-stone font-medium">
          <Clock className="h-3 w-3" />
          {new Date(fechaActualizacion).toLocaleDateString('es-CO', {
            timeZone: 'America/Bogota',
            day: '2-digit',
            month: 'short',
          })}
        </div>
      )}
    </div>
  );
}
