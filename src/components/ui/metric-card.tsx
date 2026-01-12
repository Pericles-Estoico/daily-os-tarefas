import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { SemaforoBadge } from '@/components/ui/semaforo-badge';
import type { SemaforoStatus } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  meta?: string | number;
  variacao?: number;
  semaforo?: SemaforoStatus;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  meta,
  variacao,
  semaforo,
  prefix = '',
  suffix = '',
  className,
}: MetricCardProps) {
  const getTrend = () => {
    if (variacao === undefined) return null;
    if (variacao > 0) return <TrendingUp className="h-3 w-3 text-[hsl(var(--success))]" />;
    if (variacao < 0) return <TrendingDown className="h-3 w-3 text-[hsl(var(--danger))]" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <Card className={cn('industrial-card', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="metric-label">{label}</p>
            <p className="metric-value mt-1">
              {prefix}
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
              {suffix}
            </p>
            {meta !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                Meta: {prefix}
                {typeof meta === 'number' ? meta.toLocaleString('pt-BR') : meta}
                {suffix}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {semaforo && <SemaforoBadge status={semaforo} size="lg" />}
            {variacao !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                {getTrend()}
                <span
                  className={cn(
                    variacao > 0
                      ? 'text-[hsl(var(--success))]'
                      : variacao < 0
                      ? 'text-[hsl(var(--danger))]'
                      : 'text-muted-foreground'
                  )}
                >
                  {variacao > 0 ? '+' : ''}
                  {variacao.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
