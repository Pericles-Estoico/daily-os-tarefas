import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { MetricCard } from '@/components/ui/metric-card';
import { SemaforoBadge } from '@/components/ui/semaforo-badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Target, AlertTriangle, Clock, CalendarIcon, Plus, FileText, ListTodo, 
  ExternalLink, AlertCircle, Play, CheckCircle2, ChevronDown, Zap, 
  AlertOctagon, TrendingUp, Award, BarChart3, Users
} from 'lucide-react';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import type { RoutineTask, SemaforoStatus } from '@/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const config = useStore((state) => state.config);
  const owners = useStore((state) => state.owners);
  const marketplaces = useStore((state) => state.marketplaces);
  const routineTasks = useStore((state) => state.routineTasks);
  const kpiEntries = useStore((state) => state.kpiEntries);
  const incidents = useStore((state) => state.incidents);
  const pointsLedger = useStore((state) => state.pointsLedger);
  const generateMonthTasks = useStore((state) => state.generateMonthTasks);
  const updateRoutineTask = useStore((state) => state.updateRoutineTask);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [nextTaskExpanded, setNextTaskExpanded] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RoutineTask | null>(null);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isCEO = config.currentUserId === 'owner-1';

  // Encontrar o último dia com dados
  const lastDateWithData = useMemo(() => {
    const allDates = [...new Set([
      ...routineTasks.map(t => t.date),
      ...kpiEntries.map(k => k.date),
    ])].filter(Boolean).sort().reverse();
    return allDates.find(d => d && d <= selectedDateStr) || allDates[0] || null;
  }, [routineTasks, kpiEntries, selectedDateStr]);

  // Filtrar tarefas pela data e owner
  const selectedTasks = useMemo(() => {
    let tasks = routineTasks.filter((t) => t.date === selectedDateStr);
    if (config.restrictViewToCurrentUser && config.currentUserId && !isCEO) {
      tasks = tasks.filter(t => t.ownerId === config.currentUserId);
    }
    return tasks;
  }, [routineTasks, selectedDateStr, config.restrictViewToCurrentUser, config.currentUserId, isCEO]);

  const hasTasksForDate = selectedTasks.length > 0;
  const completedTasks = selectedTasks.filter((t) => t.status === 'DONE');
  const pendingCritical = selectedTasks.filter((t) => t.critical && t.status !== 'DONE');

  // PRÓXIMA TAREFA: CRITICAL primeiro, depois horário, TODO antes DOING, mais antigo
  const nextTask = useMemo(() => {
    const pending = selectedTasks.filter(t => t.status === 'TODO' || t.status === 'DOING');
    return pending.sort((a, b) => {
      if (a.critical && !b.critical) return -1;
      if (!a.critical && b.critical) return 1;
      if (a.status === 'TODO' && b.status === 'DOING') return 1;
      if (a.status === 'DOING' && b.status === 'TODO') return -1;
      return a.time.localeCompare(b.time);
    })[0] || null;
  }, [selectedTasks]);

  // Próximas 5 tarefas
  const upcomingTasks = useMemo(() => {
    return selectedTasks
      .filter((t) => t.status === 'TODO' || t.status === 'DOING')
      .sort((a, b) => {
        if (a.critical && !b.critical) return -1;
        if (!a.critical && b.critical) return 1;
        return a.time.localeCompare(b.time);
      })
      .slice(0, 5);
  }, [selectedTasks]);

  // Incidentes ordenados: CRITICAL > HIGH > dueDate
  const topIncidents = useMemo(() => {
    const severityOrder = { CRITICAL: 0, HIGH: 1, MED: 2, LOW: 3 };
    return incidents
      .filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS')
      .sort((a, b) => {
        const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return (a.dueDate || '').localeCompare(b.dueDate || '');
      })
      .slice(0, 3);
  }, [incidents]);

  const hasCriticalIncident = topIncidents.some(i => i.severity === 'CRITICAL');

  // KPIs do dia
  const selectedKPIs = kpiEntries.filter((k) => k.date === selectedDateStr);
  const hasKPIsForDate = selectedKPIs.length > 0;
  const totalGMV = selectedKPIs.reduce((acc, k) => acc + (k.values.gmv || 0), 0);

  // P1 Marketplaces
  const p1Marketplaces = marketplaces.filter((m) => m.priority === 'P1');

  // Pontos do dia do owner atual
  const todayPoints = useMemo(() => {
    if (!config.currentUserId) return 0;
    return pointsLedger
      .filter(p => p.date === selectedDateStr && p.ownerId === config.currentUserId)
      .reduce((acc, p) => acc + (p.tipo === 'PREMIO' ? p.pontos : -p.pontos), 0);
  }, [pointsLedger, selectedDateStr, config.currentUserId]);

  // Semáforo geral
  const overallSemaforo: SemaforoStatus = hasCriticalIncident ? 'RED' : pendingCritical.length > 0 ? 'RED' : topIncidents.length > 0 ? 'YELLOW' : 'GREEN';

  const getOwnerName = (ownerId: string | null) => {
    if (!ownerId) return 'Global';
    return owners.find(o => o.id === ownerId)?.nome || 'Desconhecido';
  };

  const getOwnerInitials = (ownerId: string | null) => {
    if (!ownerId) return 'GL';
    const owner = owners.find(o => o.id === ownerId);
    return owner?.nome?.substring(0, 2).toUpperCase() || '??';
  };

  const getMarketplaceName = (mpId: string | null) => {
    if (!mpId) return 'Global';
    return marketplaces.find(m => m.id === mpId)?.name || 'Canal';
  };

  const handleStartTask = () => {
    if (nextTask) {
      updateRoutineTask(nextTask.id, { status: 'DOING' });
    }
  };

  const handleCompleteTask = () => {
    if (nextTask) {
      setSelectedTask(nextTask);
    }
  };

  const handleGenerateToday = () => {
    const monthKey = format(selectedDate, 'yyyy-MM');
    generateMonthTasks(monthKey);
  };

  const handleGenerateMonth = () => {
    const monthKey = format(selectedDate, 'yyyy-MM');
    generateMonthTasks(monthKey);
  };

  // Calcular semáforo por marketplace P1
  const getP1Semaforo = (mpId: string): SemaforoStatus => {
    const mpKPI = selectedKPIs.find(k => k.marketplaceId === mpId);
    const mpIncidents = topIncidents.filter(i => i.marketplaceId === mpId);
    const hasCriticalInc = mpIncidents.some(i => i.severity === 'CRITICAL');
    
    if (hasCriticalInc || mpKPI?.semaforo === 'RED') return 'RED';
    if (mpIncidents.some(i => i.severity === 'HIGH') || mpKPI?.semaforo === 'YELLOW') return 'YELLOW';
    return mpKPI?.semaforo || 'GREEN';
  };

  return (
    <div className="space-y-6">
      {/* Header com Date Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{config.nome || 'Command Center'}</h1>
            <p className="text-muted-foreground">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
          </div>
          
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, 'dd/MM/yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
                locale={ptBR}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <SemaforoBadge status={overallSemaforo} size="lg" />
      </div>

      {/* Banner: Sem dados para esta data */}
      {!hasKPIsForDate && !hasTasksForDate && lastDateWithData && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">
                  Sem dados para esta data. Último dia com dados: {format(parse(lastDateWithData, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/okrs')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar KPI do dia
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerateToday}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Gerar tarefas do dia
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BLOCO A: AGORA - Próxima Tarefa */}
      <Card className={cn(
        "border-2",
        nextTask?.critical ? "border-destructive bg-destructive/5" : "border-primary bg-primary/5"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className={cn("h-5 w-5", nextTask?.critical ? "text-destructive" : "text-primary")} />
              AGORA
            </CardTitle>
            {nextTask && (
              <div className="flex items-center gap-2">
                {nextTask.status === 'TODO' && (
                  <Button size="sm" variant="outline" onClick={handleStartTask}>
                    <Play className="h-4 w-4 mr-1" />
                    Iniciar
                  </Button>
                )}
                <Button size="sm" variant={nextTask.critical ? "destructive" : "default"} onClick={handleCompleteTask}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Concluir
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {nextTask ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-mono font-bold">{nextTask.time}</span>
                  <span className="text-lg font-semibold">{nextTask.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={nextTask.status === 'DOING' ? 'default' : 'secondary'}>
                    {nextTask.status}
                  </Badge>
                  {nextTask.critical && <Badge variant="destructive">CRITICAL</Badge>}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {getMarketplaceName(nextTask.marketplaceId)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {getOwnerName(nextTask.ownerId)}
                </span>
              </div>

              <Collapsible open={nextTaskExpanded} onOpenChange={setNextTaskExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span>DoD & Passos</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", nextTaskExpanded && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  <div className="p-3 rounded bg-background">
                    <p className="text-sm font-medium">DoD: {nextTask.dod}</p>
                  </div>
                  {(nextTask.steps?.length ?? 0) > 0 && (
                    <div className="p-3 rounded bg-background space-y-1">
                      <p className="text-sm font-medium mb-2">Passos:</p>
                      {nextTask.steps?.map((step, idx) => (
                        <div key={step.id} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{idx + 1}.</span>
                          <span>{step.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <ListTodo className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">Nenhuma tarefa gerada para esta data</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Gere tarefas a partir dos templates ou crie manualmente.
                </p>
              </div>
              <div className="flex justify-center gap-3 flex-wrap">
                <Button onClick={handleGenerateToday} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Gerar tarefas de HOJE
                </Button>
                <Button onClick={handleGenerateMonth} variant="default">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Gerar tarefas do MÊS
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/templates">
                    <FileText className="h-4 w-4 mr-2" />
                    Ir para Templates
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BLOCO B: RISCO / PEDRAS */}
      {topIncidents.length > 0 && (
        <Card className={cn(
          "border-2",
          hasCriticalIncident ? "border-destructive bg-destructive/5" : "border-warning bg-warning/5"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertOctagon className="h-5 w-5" />
              RISCO / PEDRAS
            </CardTitle>
            {hasCriticalIncident && (
              <CardDescription className="text-destructive font-medium">
                ⚠️ CRITICAL aberto bloqueia tarefas de GROWTH do canal até VALIDATED.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {topIncidents.map((inc) => (
              <div key={inc.id} className="flex items-center justify-between p-3 rounded bg-background">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{inc.title}</span>
                    <Badge variant={inc.severity === 'CRITICAL' ? 'destructive' : inc.severity === 'HIGH' ? 'default' : 'secondary'}>
                      {inc.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{getMarketplaceName(inc.marketplaceId)}</span>
                    <span>{getOwnerName(inc.ownerId)}</span>
                    <span>{inc.status}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/incidentes')}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* BLOCO D: EXECUÇÃO DO DIA - Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          label={`GMV ${format(selectedDate, 'dd/MM')}`}
          value={hasKPIsForDate ? totalGMV : 'Sem KPI'} 
          prefix={hasKPIsForDate ? "R$ " : ""} 
          meta={config.metaDiaria}
          semaforo={hasKPIsForDate ? (totalGMV >= config.metaDiaria ? 'GREEN' : totalGMV >= config.metaDiaria * 0.7 ? 'YELLOW' : 'RED') : 'YELLOW'}
        />
        <MetricCard 
          label="Tarefas do Dia" 
          value={hasTasksForDate ? `${completedTasks.length}/${selectedTasks.length}` : 'Sem tarefas'}
          semaforo={hasTasksForDate ? (completedTasks.length === selectedTasks.length ? 'GREEN' : 'YELLOW') : undefined}
        />
        <MetricCard 
          label="Críticas Pendentes" 
          value={pendingCritical.length}
          semaforo={pendingCritical.length === 0 ? 'GREEN' : 'RED'}
        />
        <MetricCard 
          label="Pontos Hoje" 
          value={todayPoints > 0 ? `+${todayPoints}` : todayPoints}
          semaforo={todayPoints >= 5 ? 'GREEN' : todayPoints >= 0 ? 'YELLOW' : 'RED'}
        />
      </div>

      {/* GMV sem KPI: botão para registrar */}
      {!hasKPIsForDate && (
        <Card className="border-dashed">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-5 w-5" />
              <span>Nenhum KPI registrado para {format(selectedDate, 'dd/MM')}.</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/okrs')}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar KPI do dia
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* BLOCO C: MOTOR DO CAIXA (P1) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Motor do Caixa (P1)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {p1Marketplaces.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum marketplace P1 configurado</p>
            ) : (
              p1Marketplaces.map((mp) => {
                const mpKPI = selectedKPIs.find((k) => k.marketplaceId === mp.id);
                const mpIncidents = topIncidents.filter(i => i.marketplaceId === mp.id);
                const mpCriticalTasks = pendingCritical.filter(t => t.marketplaceId === mp.id);
                const mpSemaforo = getP1Semaforo(mp.id);
                
                return (
                  <div key={mp.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{mp.name}</span>
                        <Badge variant="outline" className="text-xs">{mp.stage}</Badge>
                        <Badge variant="secondary" className="text-xs">{mp.priority}</Badge>
                      </div>
                      <SemaforoBadge status={mpSemaforo} size="sm" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span>Owner:</span>
                        <span className="font-medium text-foreground">{getOwnerName(mp.ownerId)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span>GMV:</span>
                        <span className="font-medium text-foreground">
                          {mpKPI ? `R$ ${mpKPI.values.gmv.toLocaleString('pt-BR')}` : 'Sem KPI'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Incidentes:</span>
                        <Badge variant={mpIncidents.length > 0 ? 'destructive' : 'secondary'} className="text-xs">
                          {mpIncidents.length}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Críticas:</span>
                        <Badge variant={mpCriticalTasks.length > 0 ? 'destructive' : 'secondary'} className="text-xs">
                          {mpCriticalTasks.length}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => navigate(`/marketplaces?id=${mp.id}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir canal
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Próximas Tarefas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próximas Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((t) => (
                <div 
                  key={t.id} 
                  className={cn(
                    "flex items-center justify-between p-2 rounded cursor-pointer hover:bg-accent transition-colors",
                    t.critical ? 'bg-destructive/10' : 'bg-muted/50'
                  )}
                  onClick={() => setSelectedTask(t)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-12">{t.time}</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: owners.find(o => o.id === t.ownerId)?.avatarColor || 'hsl(var(--muted))' }}
                      >
                        {getOwnerInitials(t.ownerId)}
                      </div>
                      <span className="text-sm">{t.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.status === 'DOING' && <Badge variant="default" className="text-xs">Em andamento</Badge>}
                    {t.critical && <Badge variant="destructive" className="text-xs">Crítica</Badge>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 space-y-3">
                <ListTodo className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Nenhuma tarefa pendente</p>
                {!hasTasksForDate && (
                  <Button variant="outline" size="sm" onClick={handleGenerateToday}>
                    <Plus className="h-4 w-4 mr-2" />
                    Gerar tarefas de hoje
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Tarefa */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onComplete={(evidenceLinks) => {
            useStore.getState().completeRoutineTask(selectedTask.id, evidenceLinks, config.currentUserId || 'owner-1');
            setSelectedTask(null);
          }}
          onSkip={(reason) => {
            useStore.getState().skipRoutineTask(selectedTask.id, reason);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
