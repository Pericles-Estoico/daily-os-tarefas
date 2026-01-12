import { useStore } from '@/lib/store';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Target,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { SemaforoBadge } from '@/components/ui/semaforo-badge';

interface CopilotDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CopilotDrawer({ open, onOpenChange }: CopilotDrawerProps) {
  const config = useStore((state) => state.config);
  const scoreEntries = useStore((state) => state.scoreEntries);
  const routineTasks = useStore((state) => state.routineTasks);
  const krs = useStore((state) => state.krs);
  const incidents = useStore((state) => state.incidents);

  const today = new Date().toISOString().split('T')[0];
  const todayScore = scoreEntries.find((s) => s.date === today);
  const receita = todayScore?.receita || 0;
  const isAboveMeta = receita >= config.metaDiaria;

  // Get overdue/blocked tasks
  const criticalTasks = routineTasks.filter(
    (t) => t.date === today && t.isCritical && t.status !== 'done'
  );

  // Get red KRs
  const redKRs = krs.filter((kr) => kr.semaforo === 'vermelho');

  // Get open incidents
  const openIncidents = incidents.filter((i) => i.status !== 'done');

  // Heuristic: Next Best Action
  const getNextBestAction = () => {
    if (criticalTasks.length > 0) {
      return {
        title: 'Concluir Tarefa Crítica',
        description: `"${criticalTasks[0].nome}" está pendente. Complete com evidência.`,
        urgency: 'urgent',
        action: 'Ir para Rotina',
      };
    }
    if (receita < config.metaDiaria * 0.5) {
      return {
        title: 'Acelerar Vendas',
        description: 'Receita abaixo de 50% da meta. Foco em CRM + oferta relâmpago.',
        urgency: 'high',
        action: 'Ver Funil',
      };
    }
    if (redKRs.length > 0) {
      return {
        title: 'Corrigir KPI Vermelho',
        description: `KPI "${redKRs[0].nome}" precisa de ação corretiva urgente.`,
        urgency: 'high',
        action: 'Ver OKRs',
      };
    }
    if (openIncidents.length > 0) {
      return {
        title: 'Resolver Incidente',
        description: `"${openIncidents[0].titulo}" está impactando a operação.`,
        urgency: 'medium',
        action: 'Ver Incidentes',
      };
    }
    return {
      title: 'Manter Ritmo',
      description: 'Execução em dia. Foco em melhorar ticket médio.',
      urgency: 'low',
      action: 'Ver Dashboard',
    };
  };

  // Heuristic: Detect leaks
  const detectLeaks = () => {
    const leaks = [];

    const crmTask = routineTasks.find(
      (t) => t.date === today && t.nome.includes('CRM') && t.status !== 'done'
    );
    if (crmTask && new Date().getHours() >= 14) {
      leaks.push({
        type: 'CRM',
        message: 'Disparo de CRM ainda não foi feito hoje',
      });
    }

    const testeTask = routineTasks.find(
      (t) =>
        t.date === today && t.nome.includes('Teste') && t.status !== 'done'
    );
    if (testeTask && new Date().getHours() >= 12) {
      leaks.push({
        type: 'Testes',
        message: 'Teste do dia ainda não subiu',
      });
    }

    if (openIncidents.filter((i) => i.prioridade === 'urgent').length > 0) {
      leaks.push({
        type: 'Incidente',
        message: 'Incidente urgente ainda não resolvido',
      });
    }

    if (todayScore && todayScore.cpa > 30) {
      leaks.push({
        type: 'CPA',
        message: `CPA em R$${todayScore.cpa.toFixed(2)} - acima do ideal`,
      });
    }

    return leaks;
  };

  const nba = getNextBestAction();
  const leaks = detectLeaks();

  // Suggested tests based on metrics
  const suggestedTests = [
    {
      hipotese: 'Frete grátis acima de R$150 aumenta ticket médio em 15%',
      variavel: 'Threshold de frete grátis',
    },
    {
      hipotese: 'Botão "Comprar Agora" em vez de "Adicionar" aumenta conversão',
      variavel: 'CTA do botão de compra',
    },
    {
      hipotese: 'Oferta 2x1 performa melhor que 50% off',
      variavel: 'Formato da promoção',
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Copiloto de Execução
          </SheetTitle>
          <SheetDescription>
            Diagnóstico automático e sugestões baseadas nos seus dados
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Next Best Action */}
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Próxima Melhor Ação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold">{nba.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {nba.description}
              </p>
              <Button size="sm" className="mt-3">
                {nba.action}
              </Button>
            </CardContent>
          </Card>

          {/* Leak Detector */}
          {leaks.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Vazamentos Detectados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leaks.map((leak, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm"
                  >
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {leak.type}
                      </Badge>
                      <p className="text-muted-foreground mt-1">{leak.message}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Diagnostics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Diagnóstico Rápido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Meta do Dia</span>
                <SemaforoBadge
                  status={isAboveMeta ? 'verde' : receita >= config.metaDiaria * 0.7 ? 'amarelo' : 'vermelho'}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tarefas Críticas</span>
                <SemaforoBadge
                  status={criticalTasks.length === 0 ? 'verde' : criticalTasks.length < 2 ? 'amarelo' : 'vermelho'}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">KPIs Saudáveis</span>
                <SemaforoBadge
                  status={redKRs.length === 0 ? 'verde' : redKRs.length < 2 ? 'amarelo' : 'vermelho'}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Incidentes</span>
                <SemaforoBadge
                  status={
                    openIncidents.length === 0
                      ? 'verde'
                      : openIncidents.filter((i) => i.prioridade === 'urgent').length > 0
                      ? 'vermelho'
                      : 'amarelo'
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Test Suggestions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Sugestões de Teste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestedTests.map((test, index) => (
                <div
                  key={index}
                  className="p-2 rounded-md bg-muted/50 text-sm"
                >
                  <p className="font-medium">{test.hipotese}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Variável: {test.variavel}
                  </p>
                  <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs">
                    Criar Teste
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
