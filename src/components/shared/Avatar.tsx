import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-[13px]',
  lg: 'h-14 w-14 text-[17px]',
};

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium tracking-[0.04em] bg-[#C84B1A] text-white select-none shrink-0',
        sizeClasses[size],
        className,
      )}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
