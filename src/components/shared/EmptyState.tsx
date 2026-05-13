import { cn } from '@/lib/utils';
import Link from 'next/link';
import { FileX, Inbox, Search, FolderOpen } from 'lucide-react';
import { Button } from './Button';

const icons = {
  empty: Inbox,
  search: Search,
  file: FileX,
  folder: FolderOpen,
};

interface EmptyStateProps {
  icon?: keyof typeof icons;
  customIcon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

/**
 * EmptyState — sand palette
 */
export function EmptyState({
  icon = 'empty',
  customIcon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  const IconComponent = icons[icon];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[12px] bg-concrete/50">
        {customIcon || (
          <IconComponent className="h-7 w-7 text-stone" strokeWidth={1.5} />
        )}
      </div>

      <h3 className="text-[17px] font-semibold text-ink">{title}</h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] text-stone leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button variant="primary" size="md" className="mt-6">
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}
