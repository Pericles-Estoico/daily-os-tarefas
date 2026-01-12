import { cn } from '@/lib/utils';
import type { SemaforoStatus } from '@/types';

interface SemaforoBadgeProps {
  status: SemaforoStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const semaforoConfig = {
  verde: {
    label: 'Verde',
    bgClass: 'bg-[hsl(var(--success))]',
    textClass: 'text-[hsl(var(--success-foreground))]',
  },
  amarelo: {
    label: 'Amarelo',
    bgClass: 'bg-[hsl(var(--warning))]',
    textClass: 'text-[hsl(var(--warning-foreground))]',
  },
  vermelho: {
    label: 'Vermelho',
    bgClass: 'bg-[hsl(var(--danger))]',
    textClass: 'text-[hsl(var(--danger-foreground))]',
  },
};

const sizeConfig = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export function SemaforoBadge({
  status,
  size = 'md',
  showLabel = false,
  className,
}: SemaforoBadgeProps) {
  const config = semaforoConfig[status];

  if (showLabel) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
          config.bgClass,
          config.textClass,
          className
        )}
      >
        <span className={cn('rounded-full bg-current/30', sizeConfig[size])} />
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        sizeConfig[size],
        config.bgClass,
        className
      )}
    />
  );
}
