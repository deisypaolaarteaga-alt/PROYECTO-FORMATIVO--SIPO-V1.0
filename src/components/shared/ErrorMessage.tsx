import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, XCircle } from 'lucide-react';

type Severity = 'error' | 'warning' | 'info';

const severityConfig = {
  error: {
    icon: XCircle,
    bg: 'bg-danger-50',
    border: 'border-danger-200',
    text: 'text-danger-700',
    iconColor: 'text-danger-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    text: 'text-warning-700',
    iconColor: 'text-warning-500',
  },
  info: {
    icon: AlertCircle,
    bg: 'bg-info-50',
    border: 'border-info-200',
    text: 'text-info-700',
    iconColor: 'text-info-500',
  },
};

interface ErrorMessageProps {
  message: string;
  severity?: Severity;
  className?: string;
  onDismiss?: () => void;
}

/**
 * ErrorMessage — Mensajes de error consistentes en español
 */
export function ErrorMessage({
  message,
  severity = 'error',
  className,
  onDismiss,
}: ErrorMessageProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        config.bg,
        config.border,
        className
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconColor)} />
      <p className={cn('text-sm flex-1', config.text)}>{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn('shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors cursor-pointer', config.text)}
          aria-label="Cerrar mensaje"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
