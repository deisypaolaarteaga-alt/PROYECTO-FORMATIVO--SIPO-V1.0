import { cn } from '@/lib/utils';

type BadgeVariant = 'borrador' | 'revision' | 'enviado' | 'aprobado' | 'accent' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
  borrador: 'bg-draft-bg text-draft-text',
  revision: 'bg-warning-bg text-warning-text',
  enviado:  'bg-info-bg text-info-text',
  aprobado: 'bg-success-bg text-success-text',
  accent:   'bg-burn-pale text-burn-deep',
  neutral:  'bg-sand text-stone',
};

/**
 * Badge — 11px, 500 weight, 20px radius
 */
export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-[20px] text-[11px] font-medium leading-tight',
        badgeStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Mapea estado de presupuesto a badge
 */
export function EstadoBadge({ estado }: { estado: string }) {
  const labels: Record<string, string> = {
    borrador: 'Borrador',
    revision: 'En revisión',
    enviado: 'Enviado',
    aprobado: 'Aprobado',
  };
  const variant = (estado in badgeStyles ? estado : 'neutral') as BadgeVariant;
  return <Badge variant={variant}>{labels[estado] || estado}</Badge>;
}
