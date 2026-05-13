import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-[13px]',
  lg: 'h-14 w-14 text-[17px]',
};

/**
 * Avatar — steel-fog bg, steel-dark text, burn-orange initials
 */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium bg-steel-fog text-steel-mid',
        sizeClasses[size],
        className
      )}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
