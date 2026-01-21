import { useState, useEffect } from 'react';
import { useOps } from '@/contexts/OpsContext';
import { 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Flame,
  Target,
  Users,
  FileUp,
  Settings,
  ListTodo,
  CalendarIcon,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  useTodayKPIs,
  useKPIsLast7Days,
  useMarketplacesP1,
  useTodayTasks,
  useOpenIncidents,
  usePointsRankingWeek,
  useOwners,
  useAppSettings,
  useLatestDataDate,
} from '@/hooks/useSupabaseData';

export function Dashboard() {
  const { state } = useOps();
  const now = new Date();
  const todayISO = format(now, 'yyyy-MM-dd');
  
  // Date selector state
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const selectedDateISO = format(selectedDate, 'yyyy-MM-dd');
  
  // Fetch latest date with data for fallback
  const { data: latestDataDate } = useLatestDataDate();
  
  // Auto-select latest date with data if today has no data
  const { data: todayKPIs, isLoading: loadingKPIs } = useTodayKPIs(selectedDateISO);
  
  useEffect(() => {
    // If today has no data and we have a latest date, use it
    if (!loadingKPIs && todayKPIs?.length === 0 && latestDataDate && selectedDateISO === todayISO) {
      setSelectedDate(new Date(latestDataDate + 'T12:00:00'));
    }
  }, [loadingKPIs, todayKPIs, latestDataDate, selectedDateISO, todayISO]);
  
  const isViewingDifferentDate = selectedDateISO !== todayISO;
  const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const displayDate = selectedDate.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Fetch data from Supabase
  const { data: last7DaysKPIs, isLoading: loadingChart } = useKPIsLast7Days();
  const { data: marketplacesP1, isLoading: loadingMarketplaces } = useMarketplacesP1();
  const { data: todayTasks, isLoading: loadingTasks } = useTodayTasks(selectedDateISO);
  const { data: openIncidents, isLoading: loadingIncidents } = useOpenIncidents();
  const { data: ranking, isLoading: loadingRanking } = usePointsRankingWeek();
  const { data: owners } = useOwners();
  const { data: appSettings } = useAppSettings();

  // Calculate real KPIs
  const todayGMV = todayKPIs?.reduce((sum, kpi) => sum + Number(kpi.gmv), 0) || 0;
  const todayOrders = todayKPIs?.reduce((sum, kpi) => sum + kpi.orders, 0) || 0;
  const avgTicket = todayOrders > 0 ? todayGMV / todayOrders : 0;
  const dailyGoal = appSettings?.daily_goal ? Number(appSettings.daily_goal) : 10000;
  const goalProgress = dailyGoal > 0 ? Math.min(100, (todayGMV / dailyGoal) * 100) : 0;

  // Process chart data - aggregate by day
  const chartData = (() => {
    if (!last7DaysKPIs || last7DaysKPIs.length === 0) return [];
    
    const byDay: Record<string, number> = {};
    last7DaysKPIs.forEach((kpi) => {
      const day = kpi.date_iso;
      byDay[day] = (byDay[day] || 0) + Number(kpi.gmv);
    });

    // Ensure all 7 days are present
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const dateISO = format(date, 'yyyy-MM-dd');
      const dayName = format(date, 'EEE', { locale: ptBR });
      result.push({
        day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        gmv: byDay[dateISO] || 0,
      });
    }
    return result;
  })();

  // Get current owner name
  const currentOwner = owners?.find(o => o.id === state.settings.currentOwnerId);
  const ownerName = currentOwner?.name || state.settings.currentOwnerId || 'Usuário';

  // Critical tasks count
  const criticalTasks = todayTasks?.filter(t => t.is_critical && t.status !== 'DONE').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-blue-950 dark:to-slate-950">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Date different from today banner */}
        {isViewingDifferentDate && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Exibindo dados de <strong>{format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>.
              {latestDataDate && (
                <Button 
                  variant="link" 
                  className="text-amber-700 dark:text-amber-300 p-0 h-auto ml-1 underline"
                  onClick={() => setSelectedDate(now)}
                >
                  Voltar para hoje
                </Button>
              )}
            </p>
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Olá, {ownerName}! 👋</h1>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="text-blue-100 hover:text-white hover:bg-white/20 text-lg capitalize p-0 h-auto font-normal"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {displayDate}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-blue-200 text-sm mt-1">{currentTime} • Marketplace Ops OS v1.0</p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-blue-100">Meta Diária</p>
                <p className="text-3xl font-bold">R$ {dailyGoal.toLocaleString('pt-BR')}</p>
                <Progress value={goalProgress} className="mt-2 h-2" />
                <p className="text-xs text-blue-100 mt-1">{goalProgress.toFixed(0)}% alcançado</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                GMV Hoje
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              {loadingKPIs ? (
                <Skeleton className="h-9 w-32" />
              ) : todayGMV > 0 ? (
                <>
                  <div className="text-3xl font-bold text-green-600">
                    R$ {todayGMV.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {todayKPIs?.length || 0} marketplace(s)
                  </p>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground mb-2">Sem KPI registrado</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/importar-vendas"><FileUp className="h-4 w-4 mr-1" /> Importar</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pedidos
              </CardTitle>
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loadingKPIs ? (
                <Skeleton className="h-9 w-20" />
              ) : todayOrders > 0 ? (
                <>
                  <div className="text-3xl font-bold text-blue-600">{todayOrders}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ticket: R$ {avgTicket.toFixed(2)}
                  </p>
                </>
              ) : (
                <div className="text-3xl font-bold text-muted-foreground">—</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Conversão
              </CardTitle>
              <Target className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">—</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requer integração de visitas
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tarefas Hoje
              </CardTitle>
              <CheckCircle2 className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <Skeleton className="h-9 w-16" />
              ) : (todayTasks?.length || 0) > 0 ? (
                <>
                  <div className="text-3xl font-bold text-orange-600">
                    {todayTasks?.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {criticalTasks > 0 ? (
                      <span className="text-orange-600 font-semibold">{criticalTasks} críticas</span>
                    ) : (
                      'Nenhuma crítica'
                    )}
                  </p>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground mb-2">Sem tarefas</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/rotina"><ListTodo className="h-4 w-4 mr-1" /> Gerar</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráfico + Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Gráfico GMV */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                GMV Últimos 7 Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingChart ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : chartData.some(d => d.gmv > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'GMV']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="gmv" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm mb-4">Sem dados de GMV nos últimos 7 dias</p>
                  <Button asChild variant="outline">
                    <Link to="/importar-vendas"><FileUp className="h-4 w-4 mr-2" /> Importar Vendas</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertas Críticos */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Incidentes Críticos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingIncidents ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (openIncidents?.length || 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-2" />
                  <p className="text-sm">Nenhum incidente aberto! 🎉</p>
                </div>
              ) : (
                openIncidents?.slice(0, 3).map((incident) => (
                  <div 
                    key={incident.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      incident.severity === 'CRITICA' 
                        ? 'bg-red-50 dark:bg-red-950 border-red-600' 
                        : incident.severity === 'ALTA'
                        ? 'bg-orange-50 dark:bg-orange-950 border-orange-600'
                        : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{incident.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(incident.marketplaces as { name: string } | null)?.name || 'N/A'}
                        </p>
                      </div>
                      <Badge 
                        variant={incident.severity === 'CRITICA' ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {incident.severity}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
              {(openIncidents?.length || 0) > 3 && (
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link to="/incidentes">Ver todos ({openIncidents?.length})</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Marketplaces P1 + Tarefas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Marketplaces P1 */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-600" />
                Marketplaces P1
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingMarketplaces ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (marketplacesP1?.length || 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flame className="h-12 w-12 mx-auto opacity-50 mb-2" />
                  <p className="text-sm mb-4">Nenhum marketplace P1 cadastrado</p>
                  <Button asChild variant="outline">
                    <Link to="/marketplaces"><Settings className="h-4 w-4 mr-2" /> Configurar</Link>
                  </Button>
                </div>
              ) : (
                marketplacesP1?.map((marketplace) => (
                  <div 
                    key={marketplace.id}
                    className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{marketplace.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {marketplace.is_selling ? '🟢 Vendendo' : '⚪ Aguardando'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={marketplace.stage === 'SCALE' ? 'default' : 'destructive'}
                          className="mb-2"
                        >
                          {marketplace.stage}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Próximas Tarefas */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Próximas Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingTasks ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : (todayTasks?.length || 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="h-12 w-12 mx-auto opacity-50 mb-2" />
                  <p className="text-sm mb-4">Nenhuma tarefa para hoje</p>
                  <Button asChild variant="outline">
                    <Link to="/rotina"><ListTodo className="h-4 w-4 mr-2" /> Gerar Tarefas</Link>
                  </Button>
                </div>
              ) : (
                todayTasks?.slice(0, 5).map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-300">
                          {task.time_hhmm}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {(task.owners as { name: string } | null)?.name || 'N/A'}
                      </p>
                    </div>
                    <Badge 
                      variant={task.is_critical ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {task.is_critical ? 'CRÍTICA' : 'NORMAL'}
                    </Badge>
                  </div>
                ))
              )}
              {(todayTasks?.length || 0) > 5 && (
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link to="/rotina">Ver todas ({todayTasks?.length})</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ranking */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Ranking de Pontos (Semana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRanking ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : (ranking?.length || 0) === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto opacity-50 mb-2" />
                <p className="text-sm">Sem pontos registrados esta semana</p>
                <p className="text-xs mt-2">Complete tarefas para ganhar pontos!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {ranking?.slice(0, 4).map((person, index) => (
                  <div 
                    key={person.ownerId}
                    className={`p-4 rounded-xl text-center transition-all hover:scale-105 ${
                      index === 0 
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg' 
                        : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900'
                    }`}
                  >
                    <div 
                      className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: index === 0 ? 'rgba(255,255,255,0.3)' : person.color }}
                    >
                      {person.initials}
                    </div>
                    <p className={`font-semibold ${index === 0 ? 'text-white' : ''}`}>
                      {person.name}
                    </p>
                    <p className={`text-2xl font-bold ${index === 0 ? 'text-white' : 'text-purple-600'}`}>
                      {person.total}
                    </p>
                    <p className={`text-xs ${index === 0 ? 'text-yellow-100' : 'text-muted-foreground'}`}>
                      pontos
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
