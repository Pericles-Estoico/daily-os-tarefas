import { useOps } from '@/contexts/OpsContext';
import { 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Flame,
  Target,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data para demonstração
const MOCK_GMV_CHART = [
  { day: 'Seg', gmv: 12500 },
  { day: 'Ter', gmv: 15800 },
  { day: 'Qua', gmv: 18200 },
  { day: 'Qui', gmv: 16900 },
  { day: 'Sex', gmv: 21300 },
  { day: 'Sáb', gmv: 24500 },
  { day: 'Dom', gmv: 19800 },
];

const MOCK_MARKETPLACES_P1 = [
  { id: 'shein', name: 'Shein', gmv: 8500, trend: '+12%', status: 'SCALE' },
  { id: 'shopee', name: 'Shopee', gmv: 6200, trend: '+8%', status: 'SCALE' },
  { id: 'mercadolivre', name: 'Mercado Livre', gmv: 5100, trend: '-3%', status: 'RECOVER' },
];

const MOCK_TASKS_TODAY = [
  { id: 1, time: '09:00', title: 'Análise de conversão Shein', severity: 'CRITICA', owner: 'Péricles' },
  { id: 2, time: '10:30', title: 'Atualizar estoque Shopee', severity: 'NORMAL', owner: 'Elisangela' },
  { id: 3, time: '14:00', title: 'Review de anúncios ML', severity: 'CRITICA', owner: 'Walistter' },
  { id: 4, time: '15:30', title: 'Relatório financeiro semanal', severity: 'NORMAL', owner: 'Stella' },
  { id: 5, time: '16:00', title: 'Testes A/B pricing', severity: 'NORMAL', owner: 'Péricles' },
];

const MOCK_INCIDENTS = [
  { id: 1, title: 'Queda de conversão Shopee', severity: 'ALTA', marketplace: 'Shopee' },
  { id: 2, title: 'Reclamações ML sobre entrega', severity: 'CRITICA', marketplace: 'Mercado Livre' },
];

const MOCK_RANKING = [
  { owner: 'Péricles', points: 145, avatar: '👨‍💼' },
  { owner: 'Elisangela', points: 132, avatar: '👩‍💼' },
  { owner: 'Walistter', points: 118, avatar: '👨‍🎨' },
  { owner: 'Stella', points: 105, avatar: '👩‍💻' },
];

export function Dashboard() {
  const { state } = useOps();
  const now = new Date();
  const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const currentDate = now.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // GMV do dia (mock)
  const todayGMV = 19800;
  const todayOrders = 84;
  const avgTicket = todayGMV / todayOrders;
  const conversionRate = 3.2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-blue-950 dark:to-slate-950">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Olá, {state.settings.currentOwnerId === 'pericles' ? 'Péricles' : state.settings.currentOwnerId}! 👋</h1>
              <p className="text-blue-100 text-lg capitalize">{currentDate}</p>
              <p className="text-blue-200 text-sm mt-1">{currentTime} • Marketplace Ops OS v1.0</p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-blue-100">Meta Mensal</p>
                <p className="text-3xl font-bold">+30%</p>
                <Progress value={42} className="mt-2 h-2" />
                <p className="text-xs text-blue-100 mt-1">42% alcançado</p>
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
              <div className="text-3xl font-bold text-green-600">
                R$ {todayGMV.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 font-semibold">↑ 18%</span> vs ontem
              </p>
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
              <div className="text-3xl font-bold text-blue-600">{todayOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ticket: R$ {avgTicket.toFixed(2)}
              </p>
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
              <div className="text-3xl font-bold text-purple-600">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-purple-600 font-semibold">↑ 0.3pp</span> vs semana
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
              <div className="text-3xl font-bold text-orange-600">
                {MOCK_TASKS_TODAY.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-orange-600 font-semibold">3 críticas</span> pendentes
              </p>
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
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={MOCK_GMV_CHART}>
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
              {MOCK_INCIDENTS.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-2" />
                  <p className="text-sm">Nenhum incidente aberto! 🎉</p>
                </div>
              ) : (
                MOCK_INCIDENTS.map((incident) => (
                  <div 
                    key={incident.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      incident.severity === 'CRITICA' 
                        ? 'bg-red-50 border-red-600' 
                        : 'bg-orange-50 border-orange-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{incident.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {incident.marketplace}
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
              {MOCK_MARKETPLACES_P1.map((marketplace) => (
                <div 
                  key={marketplace.id}
                  className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{marketplace.name}</p>
                      <p className="text-2xl font-bold text-blue-600">
                        R$ {marketplace.gmv.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={marketplace.status === 'SCALE' ? 'default' : 'destructive'}
                        className="mb-2"
                      >
                        {marketplace.status}
                      </Badge>
                      <p className={`text-sm font-semibold ${
                        marketplace.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {marketplace.trend}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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
              {MOCK_TASKS_TODAY.map((task) => (
                <div 
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-300">
                        {task.time}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.owner}</p>
                  </div>
                  <Badge 
                    variant={task.severity === 'CRITICA' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {task.severity}
                  </Badge>
                </div>
              ))}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {MOCK_RANKING.map((person, index) => (
                <div 
                  key={person.owner}
                  className={`p-4 rounded-xl text-center transition-all hover:scale-105 ${
                    index === 0 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg' 
                      : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900'
                  }`}
                >
                  <div className="text-4xl mb-2">{person.avatar}</div>
                  <p className={`font-semibold ${index === 0 ? 'text-white' : ''}`}>
                    {person.owner}
                  </p>
                  <p className={`text-2xl font-bold ${index === 0 ? 'text-white' : 'text-purple-600'}`}>
                    {person.points}
                  </p>
                  <p className={`text-xs ${index === 0 ? 'text-yellow-100' : 'text-muted-foreground'}`}>
                    pontos
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
