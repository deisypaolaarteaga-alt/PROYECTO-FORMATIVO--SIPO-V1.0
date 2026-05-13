'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] active:opacity-90',
  secondary:
    'bg-transparent text-charcoal border border-concrete hover:bg-sand active:bg-concrete',
  ghost:
    'bg-transparent text-stone hover:text-charcoal hover:bg-sand',
  danger:
    'bg-danger-text text-white hover:opacity-90',
  outline:
    'bg-transparent text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-pale)]',
};

const sizeClasses = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-[18px] text-[13px] gap-2 rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2.5 rounded-lg',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizeClasses;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Button — SIPO design system
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]',
          'cursor-pointer select-none',
          variants[variant],
          sizeClasses[size],
          isDisabled && 'opacity-40 pointer-events-none cursor-not-allowed',
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
