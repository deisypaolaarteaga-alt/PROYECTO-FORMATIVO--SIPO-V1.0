import { Card, CardHeader } from '@/components/shared/Card';
import { Clock, AlertTriangle, CalendarClock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { VencimientoItem } from '@/actions/analytics';

interface Props {
  items: VencimientoItem[];
}

// Paleta de semáforo técnico — obra, no genérico
function semaforo(dias: number): {
  icon: React.ReactNode;
  bg: string;
  border: string;
  text: string;
  label: string;
  dot: string;
} {
  if (dias <= 0)
    return {
      icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
      bg:     '#FAF0EB',
      border: '#E8956A',
      text:   '#A83A14',
      dot:    '#C84B1A',
      label:  'Vencido',
    };
  if (dias <= 7)
    return {
      icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
      bg:     '#FAF0EB',
      border: '#E8956A',
      text:   '#A83A14',
      dot:    '#C84B1A',
      label:  `Vence en ${dias} día${dias === 1 ? '' : 's'}`,
    };
  if (dias <= 15)
    return {
      icon: <Clock className="h-3.5 w-3.5 shrink-0" />,
      bg:     '#FEF9EC',
      border: '#E8C870',
      text:   '#8C5E00',
      dot:    '#B8821A',
      label:  `Vence en ${dias} días`,
    };
  return {
    icon: <CalendarClock className="h-3.5 w-3.5 shrink-0" />,
    bg:     '#E8F0F8',
    border: '#8BA3B8',
    text:   '#2D5F8A',
    dot:    '#2D5F8A',
    label:  `Vence en ${dias} días`,
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
          <span
            className="ml-auto inline-flex items-center px-2 py-[3px] rounded text-[10px] font-semibold tracking-[0.04em]"
            style={{ background: '#FEF9EC', color: '#8C5E00' }}
          >
            {items.length} próximo{items.length === 1 ? '' : 's'} a vencer
          </span>
        </div>
        <p className="text-[11px] text-stone mt-0.5">
          Presupuestos cuya vigencia de oferta vence en los próximos 30 días
        </p>
      </CardHeader>

      <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => {
          const s = semaforo(item.dias_restantes);
          return (
            <div
              key={item.budget_id}
              className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-[12px]"
              style={{ background: s.bg, borderColor: s.border, color: s.text }}
            >
              {s.icon}
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate" title={item.titulo}>
                  {item.titulo}
                </p>
                {item.proyecto_nombre && (
                  <p className="text-[10px] opacity-70 truncate">{item.proyecto_nombre}</p>
                )}
                <p className="text-[10px] opacity-70 mt-0.5">
                  {s.label} · vence {formatDate(item.fecha_vence)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {items.some((i) => i.dias_restantes <= 7) && (
        <p className="mt-3 text-[11px] text-stone">
          Actualiza la vigencia en el presupuesto para renovarlo.{' '}
          <Link href="/proyectos" className="font-medium hover:underline" style={{ color: '#C84B1A' }}>
            Ver proyectos →
          </Link>
        </p>
      )}
    </Card>
  );
}
