import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SemaforoBadge } from '@/components/ui/semaforo-badge';
import { Target, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function OKRsPage() {
  const marketplaces = useStore((state) => state.marketplaces);
  const kpiEntries = useStore((state) => state.kpiEntries);
  const owners = useStore((state) => state.owners);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayKPIs = kpiEntries.filter((k) => k.date === today);

  const getOwnerName = (id: string) => owners.find((o) => o.id === id)?.nome || 'Desconhecido';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="h-6 w-6" />OKRs & KPIs por Marketplace</h1>
        <p className="text-muted-foreground">{marketplaces.length} marketplaces • {todayKPIs.length} KPIs registrados hoje</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {marketplaces.map((mp) => {
          const kpi = todayKPIs.find((k) => k.marketplaceId === mp.id);
          return (
            <Card key={mp.id} className={mp.stage === 'RECOVER' ? 'border-red-500/50' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-base">{mp.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={mp.priority === 'P1' ? 'destructive' : 'secondary'}>{mp.priority}</Badge>
                    <SemaforoBadge status={kpi?.semaforo || 'YELLOW'} size="sm" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">{mp.stage}</Badge>
                  <span className="text-xs text-muted-foreground">Owner: {getOwnerName(mp.ownerId)}</span>
                </div>
                {kpi ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 rounded bg-muted/50"><p className="text-muted-foreground text-xs">GMV</p><p className="font-mono font-medium">R$ {kpi.values.gmv.toLocaleString('pt-BR')}</p></div>
                    <div className="p-2 rounded bg-muted/50"><p className="text-muted-foreground text-xs">Pedidos</p><p className="font-mono font-medium">{kpi.values.pedidos}</p></div>
                    <div className="p-2 rounded bg-muted/50"><p className="text-muted-foreground text-xs">Conversão</p><p className="font-mono font-medium">{kpi.values.conversao}%</p></div>
                    <div className="p-2 rounded bg-muted/50"><p className="text-muted-foreground text-xs">Reputação</p><p className="font-mono font-medium">{kpi.values.reputacao}%</p></div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Sem KPIs registrados hoje</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
