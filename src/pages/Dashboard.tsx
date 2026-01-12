import { useStore } from '@/lib/store';
import { MetricCard } from '@/components/ui/metric-card';
import { SemaforoBadge } from '@/components/ui/semaforo-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const config = useStore((state) => state.config);
  const scoreEntries = useStore((state) => state.scoreEntries);
  const routineTasks = useStore((state) => state.routineTasks);
  const sectors = useStore((state) => state.sectors);
  const incidents = useStore((state) => state.incidents);
  const krs = useStore((state) => state.krs);

  const today = new Date().toISOString().split('T')[0];
  const todayScore = scoreEntries.find((s) => s.date === today);
  const todayTasks = routineTasks.filter((t) => t.date === today);

  const criticalTasks = todayTasks.filter((t) => t.isCritical);
  const completedCritical = criticalTasks.filter((t) => t.status === 'done').length;
  const pendingCritical = criticalTasks.filter((t) => t.status !== 'done');

  const openIncidents = incidents.filter((i) => i.status !== 'done');
  const urgentIncidents = openIncidents.filter((i) => i.prioridade === 'urgent');

  const redKRs = krs.filter((kr) => kr.semaforo === 'vermelho');

  // Calculate sector progress
  const sectorProgress = sectors.map((sector) => {
    const sectorTasks = todayTasks.filter((t) => t.sectorId === sector.id);
    const completed = sectorTasks.filter((t) => t.status === 'done').length;
    return {
      ...sector,
      total: sectorTasks.length,
      completed,
      progress: sectorTasks.length > 0 ? (completed / sectorTasks.length) * 100 : 0,
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: config.moeda,
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Funnel data (mock editables)
  const funnelData = {
    sessoes: todayScore?.pedidos ? todayScore.pedidos * 50 : 2500,
    atc: todayScore?.pedidos ? Math.round(todayScore.pedidos * 8) : 400,
    checkout: todayScore?.pedidos ? Math.round(todayScore.pedidos * 2) : 100,
    compras: todayScore?.pedidos || 50,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <Button asChild>
          <Link to="/rotina">
            <Plus className="h-4 w-4 mr-1" />
            Nova Tarefa
          </Link>
        </Button>
      </div>

      {/* NBA - Next Best Action */}
      {pendingCritical.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-primary uppercase tracking-wider">
                  🎯 Próxima Martelada
                </p>
                <p className="font-semibold">{pendingCritical[0]?.nome}</p>
                <p className="text-sm text-muted-foreground">
                  Horário: {pendingCritical[0]?.horario} • Tarefa crítica pendente
                </p>
              </div>
              <Button size="sm" asChild>
                <Link to="/rotina">
                  Executar
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placar do Dia */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Placar do Dia
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricCard
            label="Receita"
            value={formatCurrency(todayScore?.receita || 0)}
            meta={formatCurrency(config.metaDiaria)}
            semaforo={
              !todayScore
                ? 'vermelho'
                : todayScore.receita >= config.metaDiaria
                ? 'verde'
                : todayScore.receita >= config.metaDiaria * 0.7
                ? 'amarelo'
                : 'vermelho'
            }
            className="col-span-2 lg:col-span-1"
          />
          <MetricCard
            label="Pedidos"
            value={todayScore?.pedidos || 0}
            meta={Math.round(config.metaDiaria / 180)}
            semaforo={todayScore?.pedidos ? (todayScore.pedidos >= 55 ? 'verde' : 'amarelo') : 'vermelho'}
          />
          <MetricCard
            label="Ticket Médio"
            value={formatCurrency(todayScore?.ticketMedio || 0)}
            meta={formatCurrency(180)}
            semaforo={todayScore?.ticketMedio ? (todayScore.ticketMedio >= 170 ? 'verde' : 'amarelo') : 'vermelho'}
          />
          <MetricCard
            label="Margem"
            value={todayScore?.margemBruta || 0}
            suffix="%"
            meta={45}
            semaforo={todayScore?.margemBruta ? (todayScore.margemBruta >= 45 ? 'verde' : 'amarelo') : 'vermelho'}
          />
          <MetricCard
            label="CPA"
            value={formatCurrency(todayScore?.cpa || 0)}
            meta={formatCurrency(25)}
            semaforo={todayScore?.cpa ? (todayScore.cpa <= 25 ? 'verde' : todayScore.cpa <= 30 ? 'amarelo' : 'vermelho') : 'amarelo'}
          />
        </div>
        {!todayScore && (
          <Card className="mt-3 border-dashed">
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground">
                Painel 5 números ainda não preenchido hoje
              </p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link to="/registros">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Preencher Agora
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Execução - Disciplina */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Tarefas Críticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">
                      {task.horario}
                    </span>
                    <span className="text-sm font-medium">{task.nome}</span>
                  </div>
                  <Badge
                    variant={task.status === 'done' ? 'default' : 'outline'}
                    className={task.status === 'done' ? 'bg-[hsl(var(--success))]' : ''}
                  >
                    {task.status === 'done' ? 'Feito' : 'Pendente'}
                  </Badge>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Progresso crítico</span>
                <span className="text-sm font-semibold">
                  {completedCritical}/{criticalTasks.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Rotina por Setor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sectorProgress.slice(0, 5).map((sector) => (
                <div key={sector.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{sector.nome}</span>
                    <span className="text-muted-foreground">
                      {sector.completed}/{sector.total}
                    </span>
                  </div>
                  <Progress value={sector.progress} className="h-1.5" />
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
                <Link to="/rotina">
                  Ver Rotina Completa
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funil */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Funil de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold font-mono">
                {funnelData.sessoes.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Sessões</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold font-mono">
                {funnelData.atc.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Add to Cart</p>
              <p className="text-xs text-[hsl(var(--success))]">
                {((funnelData.atc / funnelData.sessoes) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold font-mono">
                {funnelData.checkout.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Checkout</p>
              <p className="text-xs text-[hsl(var(--warning))]">
                {((funnelData.checkout / funnelData.atc) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <p className="text-2xl font-bold font-mono text-primary">
                {funnelData.compras.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Compras</p>
              <p className="text-xs text-primary">
                {((funnelData.compras / funnelData.checkout) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidentes & KPIs */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Incidentes Abertos */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pedras (Incidentes)
              </CardTitle>
              {urgentIncidents.length > 0 && (
                <Badge variant="destructive">{urgentIncidents.length} urgentes</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {openIncidents.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--success))]" />
                <p className="text-sm">Nenhum incidente aberto</p>
              </div>
            ) : (
              <div className="space-y-2">
                {openIncidents.slice(0, 3).map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <SemaforoBadge
                        status={
                          incident.prioridade === 'urgent'
                            ? 'vermelho'
                            : incident.prioridade === 'high'
                            ? 'amarelo'
                            : 'verde'
                        }
                      />
                      <span className="text-sm">{incident.titulo}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {incident.status}
                    </Badge>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link to="/incidentes">
                    Ver Todos ({openIncidents.length})
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPIs Críticos */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                KPIs em Alerta
              </CardTitle>
              {redKRs.length > 0 && (
                <Badge variant="destructive">{redKRs.length} vermelhos</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {redKRs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--success))]" />
                <p className="text-sm">Todos os KPIs estão saudáveis</p>
              </div>
            ) : (
              <div className="space-y-2">
                {redKRs.slice(0, 3).map((kr) => (
                  <div
                    key={kr.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-destructive/5"
                  >
                    <div className="flex items-center gap-2">
                      <SemaforoBadge status="vermelho" />
                      <span className="text-sm">{kr.nome}</span>
                    </div>
                    <span className="text-sm font-mono">
                      {kr.valorAtual} / {kr.meta}
                    </span>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link to="/okrs">
                    Ver OKRs
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
