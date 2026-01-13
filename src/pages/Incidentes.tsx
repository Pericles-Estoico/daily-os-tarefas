import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SemaforoBadge } from '@/components/ui/semaforo-badge';
import { AlertTriangle, Search, Plus, Clock, CheckCircle2 } from 'lucide-react';
import type { IncidentStatus, IncidentSeverity, SemaforoStatus } from '@/types';

const statusLabels: Record<IncidentStatus, string> = { OPEN: 'Aberto', IN_PROGRESS: 'Em Progresso', RESOLVED: 'Resolvido', VALIDATED: 'Validado' };

export default function Incidentes() {
  const incidents = useStore((state) => state.incidents);
  const marketplaces = useStore((state) => state.marketplaces);
  const updateIncident = useStore((state) => state.updateIncident);
  const [search, setSearch] = useState('');

  const getMarketplaceName = (id: string | null) => id ? marketplaces.find((m) => m.id === id)?.name || 'Global' : 'Global';
  const getSemaforo = (severity: IncidentSeverity): SemaforoStatus => severity === 'CRITICAL' || severity === 'HIGH' ? 'RED' : severity === 'MED' ? 'YELLOW' : 'GREEN';

  const filtered = incidents.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()));
  const grouped: Record<IncidentStatus, typeof incidents> = { OPEN: [], IN_PROGRESS: [], RESOLVED: [], VALIDATED: [] };
  filtered.forEach((i) => grouped[i.status].push(i));

  const advanceStatus = (id: string, current: IncidentStatus) => {
    const next: Record<IncidentStatus, IncidentStatus> = { OPEN: 'IN_PROGRESS', IN_PROGRESS: 'RESOLVED', RESOLVED: 'VALIDATED', VALIDATED: 'VALIDATED' };
    updateIncident(id, { status: next[current] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="h-6 w-6" />Incidentes</h1><p className="text-muted-foreground">{incidents.filter((i) => i.status === 'OPEN').length} abertos</p></div>
        <Button><Plus className="h-4 w-4 mr-1" />Novo Incidente</Button>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      <div className="grid gap-4 md:grid-cols-4">
        {(Object.keys(grouped) as IncidentStatus[]).map((status) => (
          <Card key={status}>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">{status === 'OPEN' ? <AlertTriangle className="h-4 w-4" /> : status === 'IN_PROGRESS' ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}{statusLabels[status]}<Badge variant="secondary" className="ml-auto">{grouped[status].length}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {grouped[status].map((inc) => (
                <div key={inc.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-start justify-between gap-2"><p className="font-medium text-sm">{inc.title}</p><SemaforoBadge status={getSemaforo(inc.severity)} size="sm" /></div>
                  <p className="text-xs text-muted-foreground">{getMarketplaceName(inc.marketplaceId)}</p>
                  {status !== 'VALIDATED' && <Button size="sm" variant="ghost" className="h-6 text-xs w-full" onClick={() => advanceStatus(inc.id, status)}>Avançar →</Button>}
                </div>
              ))}
              {grouped[status].length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
