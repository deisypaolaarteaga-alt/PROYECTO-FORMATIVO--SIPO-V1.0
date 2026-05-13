import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  shadow?: 'none' | 'sm' | 'lg';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  border?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'px-6 py-5',
  lg: 'p-6',
};

/**
 * Card — white bg, 0.5px concrete border, 12px radius, no shadow
 */
export function Card({
  className,
  shadow = 'none',
  padding = 'md',
  hover = false,
  border = true,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-[12px]',
        paddingClasses[padding],
        border && 'border border-concrete',
        shadow === 'sm' && 'shadow-xs',
        hover && 'transition-all duration-150 hover:border-mortar hover:scale-[1.005] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('pb-4 border-b border-concrete', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('pt-4 border-t border-concrete', className)} {...props}>
      {children}
    </div>
  );
}
