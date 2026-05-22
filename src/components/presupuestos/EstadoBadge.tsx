'use client';

import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { ESTADO_PRESUPUESTO_CONFIG } from '@/types';
import type { EstadoPresupuesto } from '@/types';

interface EstadoBadgeProps {
  estado: EstadoPresupuesto;
  fechaActualizacion?: string;
  mostrarFecha?: boolean;
  className?: string;
}

export function EstadoBadge({ estado, fechaActualizacion, mostrarFecha, className }: EstadoBadgeProps) {
  const config = ESTADO_PRESUPUESTO_CONFIG[estado] ?? ESTADO_PRESUPUESTO_CONFIG.borrador;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-[20px] text-[11px] font-medium leading-tight transition-colors duration-150',
        config.badge
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
