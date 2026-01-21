// ============================================
// OKR Progress Card - Farol com Meta Proporcional
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { ProportionalProgress, formatCurrency, getStatusColors } from '@/hooks/useOKRProportionalProgress';
import { cn } from '@/lib/utils';

interface OKRProgressCardProps {
  progress: ProportionalProgress;
  title?: string;
}

export function OKRProgressCard({ progress, title = "Meta Janeiro 2026" }: OKRProgressCardProps) {
  const statusColors = getStatusColors(progress.status);
  
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'GREEN':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'YELLOW':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'RED':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
    }
  };

  return (
    <Card className={cn("relative overflow-hidden", statusColors.border, "border-2")}>
      {/* Status indicator stripe */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", statusColors.bg)} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">
              Meta mensal de {formatCurrency(progress.targetMonthly)}
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={cn("gap-1", statusColors.text, statusColors.bgLight, statusColors.border)}
          >
            {getStatusIcon()}
            {progress.statusLabel}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso proporcional ao tempo</span>
            <span className={cn("font-bold", statusColors.text)}>
              {progress.progressPercent.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={progress.progressPercent} 
            className="h-4"
          />
          <p className="text-xs text-muted-foreground">
            {progress.statusDescription}
          </p>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Meta até hoje</p>
            <p className="text-lg font-bold">{formatCurrency(progress.targetToday)}</p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Faturado</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(progress.currentGMV)}</p>
          </div>
          
          <div className={cn("text-center p-3 rounded-lg", statusColors.bgLight)}>
            <p className="text-xs text-muted-foreground mb-1">Gap</p>
            <p className={cn("text-lg font-bold", statusColors.text)}>
              {formatCurrency(progress.gap)}
            </p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Pedidos</p>
            <p className="text-lg font-bold">{progress.currentOrders.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        {/* Recovery metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", statusColors.bgLight)}>
              <TrendingUp className={cn("h-5 w-5", statusColors.text)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Para recuperar</p>
              <p className="font-bold">{formatCurrency(progress.recoveryDailyTarget)}/dia</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Projeção do mês</p>
              <p className="font-bold">{formatCurrency(progress.monthProjection)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dias restantes</p>
              <p className="font-bold">{progress.daysRemaining} de {progress.daysInMonth}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
