import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { MetricCard } from '@/components/ui/metric-card';
import { SemaforoBadge } from '@/components/ui/semaforo-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Target, AlertTriangle, Clock, CalendarIcon, Plus, FileText, ListTodo, ExternalLink, AlertCircle } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const config = useStore((state) => state.config);
  const owners = useStore((state) => state.owners);
  const marketplaces = useStore((state) => state.marketplaces);
  const routineTasks = useStore((state) => state.routineTasks);
  const kpiEntries = useStore((state) => state.kpiEntries);
  const incidents = useStore((state) => state.incidents);
  const generateMonthTasks = useStore((state) => state.generateMonthTasks);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Encontrar o último dia com dados se não houver dados no dia selecionado
  const lastDateWithData = useMemo(() => {
    const allDates = [...new Set([
      ...routineTasks.map(t => t.date),
      ...kpiEntries.map(k => k.date),
    ])].filter(Boolean).sort().reverse();
    
    return allDates.find(d => d && d <= selectedDateStr) || allDates[0] || null;
  }, [routineTasks, kpiEntries, selectedDateStr]);

  // Filtrar tarefas pela data selecionada
  const selectedTasks = useMemo(() => {
    let tasks = routineTasks.filter((t) => t.date === selectedDateStr);
    
    // Filtrar por owner se restrito
    if (config.restrictViewToCurrentUser && config.currentUserId) {
      tasks = tasks.filter(t => t.ownerId === config.currentUserId);
    }
    
    return tasks;
  }, [routineTasks, selectedDateStr, config.restrictViewToCurrentUser, config.currentUserId]);

  const hasTasksForDate = selectedTasks.length > 0;
  const completedTasks = selectedTasks.filter((t) => t.status === 'DONE');
  const pendingCritical = selectedTasks.filter((t) => t.critical && t.status !== 'DONE');
  
  // Próximas tarefas: CRITICAL primeiro, depois por horário
  const upcomingTasks = useMemo(() => {
    return selectedTasks
      .filter((t) => t.status === 'TODO')
      .sort((a, b) => {
        // Críticas primeiro
        if (a.critical && !b.critical) return -1;
        if (!a.critical && b.critical) return 1;
        // Depois por horário
        return a.time.localeCompare(b.time);
      })
      .slice(0, 5);
  }, [selectedTasks]);

  const openIncidents = incidents.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS');
  
  // KPIs do dia selecionado
  const selectedKPIs = kpiEntries.filter((k) => k.date === selectedDateStr);
  const hasKPIsForDate = selectedKPIs.length > 0;
  const totalGMV = selectedKPIs.reduce((acc, k) => acc + (k.values.gmv || 0), 0);
  
  // P1 Marketplaces com dados completos
  const p1Marketplaces = marketplaces.filter((m) => m.priority === 'P1' && m.stage === 'SCALE');

  const overallSemaforo = pendingCritical.length > 0 ? 'RED' : openIncidents.length > 0 ? 'YELLOW' : 'GREEN';
  const gmvSemaforo = totalGMV >= config.metaDiaria ? 'GREEN' : totalGMV >= config.metaDiaria * 0.7 ? 'YELLOW' : 'RED';

  const getOwnerName = (ownerId: string | null) => {
    if (!ownerId) return 'Global';
    return owners.find(o => o.id === ownerId)?.nome || 'Desconhecido';
  };

  const handleGenerateToday = () => {
    const monthKey = format(selectedDate, 'yyyy-MM');
    generateMonthTasks(monthKey);
  };

  const handleGenerateMonth = () => {
    const monthKey = format(selectedDate, 'yyyy-MM');
    generateMonthTasks(monthKey);
  };

  return (
    <div className="space-y-6">
      {/* Header com Date Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{config.nome || 'Dashboard'}</h1>
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

      {/* Alerta se não houver dados no dia selecionado */}
      {!hasKPIsForDate && !hasTasksForDate && lastDateWithData && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">
                  Sem dados para esta data. Último dia com dados: {format(parse(lastDateWithData, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/okrs')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar KPI do dia
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          label={`GMV ${format(selectedDate, 'dd/MM')}`}
          value={totalGMV} 
          prefix="R$ " 
          meta={config.metaDiaria}
          semaforo={hasKPIsForDate ? gmvSemaforo : 'YELLOW'}
        />
        <MetricCard 
          label="Marketplaces P1" 
          value={p1Marketplaces.length}
        />
        <MetricCard 
          label="Tarefas" 
          value={hasTasksForDate ? `${completedTasks.length}/${selectedTasks.length}` : 'Sem tarefas'}
        />
        <MetricCard 
          label="Incidentes Abertos" 
          value={openIncidents.length}
          semaforo={openIncidents.length === 0 ? 'GREEN' : openIncidents.length > 2 ? 'RED' : 'YELLOW'}
        />
      </div>

      {/* Empty State para Tasks */}
      {!hasTasksForDate && (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <ListTodo className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">Nenhuma tarefa gerada para {format(selectedDate, 'dd/MM/yyyy')}</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Gere tarefas a partir dos templates ou crie manualmente.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button onClick={handleGenerateMonth} variant="default">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Gerar tarefas do mês
                </Button>
                <Button onClick={handleGenerateToday} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Gerar tarefas de hoje
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/templates">
                    <FileText className="h-4 w-4 mr-2" />
                    Ir para Templates
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tarefas Críticas Pendentes */}
      {pendingCritical.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Tarefas Críticas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingCritical.slice(0, 3).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded bg-background">
                <div>
                  <p className="font-medium text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />{t.time}
                  </p>
                </div>
                <Badge variant="destructive">Crítica</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Foco P1 - Card Completo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Foco P1 (Motor do Caixa)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {p1Marketplaces.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum P1 em SCALE</p>
            ) : (
              p1Marketplaces.map((mp) => {
                const mpKPI = selectedKPIs.find((k) => k.marketplaceId === mp.id);
                const mpIncidents = openIncidents.filter(i => i.marketplaceId === mp.id);
                const mpCriticalTasks = pendingCritical.filter(t => t.marketplaceId === mp.id);
                
                return (
                  <div key={mp.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{mp.name}</span>
                        <Badge variant="outline" className="text-xs">{mp.stage}</Badge>
                        <Badge variant="secondary" className="text-xs">{mp.priority}</Badge>
                      </div>
                      <SemaforoBadge status={mpKPI?.semaforo || 'YELLOW'} size="sm" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span>Owner:</span>
                        <span className="font-medium text-foreground">{getOwnerName(mp.ownerId)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span>GMV:</span>
                        <span className="font-medium text-foreground">
                          R$ {(mpKPI?.values.gmv || 0).toLocaleString('pt-BR')}
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
                <div key={t.id} className={cn(
                  "flex items-center justify-between p-2 rounded",
                  t.critical ? 'bg-destructive/10' : 'bg-muted/50'
                )}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-12">{t.time}</span>
                    <span className="text-sm">{t.title}</span>
                  </div>
                  {t.critical && <Badge variant="destructive" className="text-xs">Crítica</Badge>}
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
    </div>
  );
}
