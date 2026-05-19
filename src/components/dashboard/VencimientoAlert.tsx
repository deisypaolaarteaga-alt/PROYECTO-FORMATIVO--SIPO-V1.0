import { Card, CardHeader } from '@/components/shared/Card';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { VencimientoItem } from '@/actions/analytics';

interface Props {
  items: VencimientoItem[];
}

function semaforo(dias: number): { icon: React.ReactNode; cls: string; label: string } {
  if (dias <= 0)
    return {
      icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
      cls: 'text-danger-text bg-danger-bg border-danger-border',
      label: 'Vencido',
    };
  if (dias <= 7)
    return {
      icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
      cls: 'text-danger-text bg-danger-bg border-danger-border',
      label: `Vence en ${dias} día${dias === 1 ? '' : 's'}`,
    };
  if (dias <= 15)
    return {
      icon: <Clock className="h-3.5 w-3.5 shrink-0" />,
      cls: 'text-warning-text bg-warning-bg border-warning-border',
      label: `Vence en ${dias} días`,
    };
  return {
    icon: <CheckCircle className="h-3.5 w-3.5 shrink-0" />,
    cls: 'text-info-text bg-info-bg border-info-border',
    label: `Vence en ${dias} días`,
  };
}

export function VencimientoAlert({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-stone" />
          <h3 className="text-[14px] font-semibold text-ink">Vigencia de presupuestos</h3>
          <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-[20px] text-[10px] font-medium bg-warning-bg text-warning-text">
            {items.length} próximo{items.length === 1 ? '' : 's'} a vencer
          </span>
        </div>
        <p className="text-[11px] text-stone mt-0.5">
          Presupuestos cuya vigencia de oferta vence en los próximos 30 días
        </p>
      </CardHeader>

      <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => {
          const { icon, cls, label } = semaforo(item.dias_restantes);
          return (
            <div
              key={item.budget_id}
              className={cn(
                'flex items-start gap-2.5 px-3 py-2.5 rounded-[8px] border text-[12px]',
                cls
              )}
            >
              {icon}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate" title={item.titulo}>
                  {item.titulo}
                </p>
                {item.proyecto_nombre && (
                  <p className="text-[10px] opacity-75 truncate">{item.proyecto_nombre}</p>
                )}
                <p className="text-[10px] opacity-75 mt-0.5">
                  {label} · vence {formatDate(item.fecha_vence)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {items.some((i) => i.dias_restantes <= 7) && (
        <p className="mt-3 text-[11px] text-stone">
          Ingresa al presupuesto y actualiza la fecha de elaboración o la vigencia para renovarlo.{' '}
          <Link href="/proyectos" className="text-burn-orange hover:underline font-medium">
            Ver proyectos →
          </Link>
        </p>
      )}
    </Card>
  );
}
