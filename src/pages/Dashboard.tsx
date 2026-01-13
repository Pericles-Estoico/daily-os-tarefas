import { useStore } from '@/lib/store';
import { MetricCard } from '@/components/ui/metric-card';
import { SemaforoBadge } from '@/components/ui/semaforo-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const config = useStore((state) => state.config);
  const marketplaces = useStore((state) => state.marketplaces);
  const routineTasks = useStore((state) => state.routineTasks);
  const kpiEntries = useStore((state) => state.kpiEntries);
  const incidents = useStore((state) => state.incidents);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = routineTasks.filter((t) => t.date === today);
  const completedTasks = todayTasks.filter((t) => t.status === 'DONE');
  const pendingCritical = todayTasks.filter((t) => t.critical && t.status !== 'DONE');
  const openIncidents = incidents.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS');
  const todayKPIs = kpiEntries.filter((k) => k.date === today);
  const totalGMV = todayKPIs.reduce((acc, k) => acc + (k.values.gmv || 0), 0);
  const p1Marketplaces = marketplaces.filter((m) => m.priority === 'P1' && m.stage === 'SCALE');

  const overallSemaforo = pendingCritical.length > 0 ? 'RED' : openIncidents.length > 0 ? 'YELLOW' : 'GREEN';
  const gmvSemaforo = totalGMV >= config.metaDiaria ? 'GREEN' : totalGMV >= config.metaDiaria * 0.7 ? 'YELLOW' : 'RED';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{config.nome || 'Dashboard'}</h1>
          <p className="text-muted-foreground">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <SemaforoBadge status={overallSemaforo} size="lg" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          label="GMV Hoje" 
          value={totalGMV} 
          prefix="R$ " 
          meta={config.metaDiaria}
          semaforo={gmvSemaforo}
        />
        <MetricCard 
          label="Marketplaces P1" 
          value={p1Marketplaces.length}
        />
        <MetricCard 
          label="Tarefas" 
          value={`${completedTasks.length}/${todayTasks.length}`}
        />
        <MetricCard 
          label="Incidentes Abertos" 
          value={openIncidents.length}
          semaforo={openIncidents.length === 0 ? 'GREEN' : openIncidents.length > 2 ? 'RED' : 'YELLOW'}
        />
      </div>

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
                const mpKPI = todayKPIs.find((k) => k.marketplaceId === mp.id);
                return (
                  <div key={mp.id} className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                    <span className="font-medium">{mp.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        R$ {(mpKPI?.values.gmv || 0).toLocaleString('pt-BR')}
                      </span>
                      <SemaforoBadge status={mpKPI?.semaforo || 'YELLOW'} size="sm" />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próximas Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayTasks
              .filter((t) => t.status === 'TODO')
              .sort((a, b) => a.time.localeCompare(b.time))
              .slice(0, 5)
              .map((t) => (
                <div key={t.id} className={`flex items-center justify-between p-2 rounded ${t.critical ? 'bg-destructive/10' : 'bg-muted/50'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-12">{t.time}</span>
                    <span className="text-sm">{t.title}</span>
                  </div>
                  {t.critical && <Badge variant="destructive" className="text-xs">Crítica</Badge>}
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
