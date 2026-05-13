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
  borrador:    { label: 'Borrador',    styles: 'bg-draft-bg text-draft-text' },
  en_revision: { label: 'En Revisión', styles: 'bg-warning-bg text-warning-text' },
  aprobado:    { label: 'Aprobado',    styles: 'bg-success-bg text-success-text' },
  rechazado:   { label: 'Rechazado',   styles: 'bg-danger-bg text-danger-text' },
  archivado:   { label: 'Archivado',   styles: 'bg-concrete text-stone' },
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
