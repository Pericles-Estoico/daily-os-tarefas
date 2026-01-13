import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Beaker, Search, Plus, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import type { ExperimentStatus, ExperimentDecision } from '@/types';

const statusLabels: Record<ExperimentStatus, string> = { RUNNING: 'Ativo', WON: 'Vencedor', LOST: 'Perdedor', ITERATE: 'Iterar', KILLED: 'Cancelado' };

export default function Testes() {
  const experiments = useStore((state) => state.experiments);
  const owners = useStore((state) => state.owners);
  const [search, setSearch] = useState('');

  const getOwnerName = (id: string) => owners.find((o) => o.id === id)?.nome || 'Desconhecido';
  const filtered = experiments.filter((e) => e.hypothesis.toLowerCase().includes(search.toLowerCase()));
  const running = filtered.filter((e) => e.status === 'RUNNING');
  const completed = filtered.filter((e) => e.status !== 'RUNNING');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Beaker className="h-6 w-6" />Testes & Experimentos</h1><p className="text-muted-foreground">{running.length} ativos • {completed.filter((e) => e.status === 'WON').length} vencedores</p></div>
        <Button><Plus className="h-4 w-4 mr-1" />Novo Teste</Button>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      
      {running.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardHeader><CardTitle className="text-sm">Testes Ativos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {running.map((exp) => (
              <div key={exp.id} className="p-3 rounded-lg bg-background">
                <div className="flex items-center justify-between"><h3 className="font-medium">{exp.hypothesis}</h3><Badge>RUNNING</Badge></div>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground"><span>Variável: {exp.variable}</span><span>Métrica: {exp.metric}</span><span>Owner: {getOwnerName(exp.ownerId)}</span></div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {completed.map((exp) => (
          <Card key={exp.id} className={exp.status === 'WON' ? 'border-green-500/30 bg-green-500/5' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {exp.status === 'WON' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {exp.status === 'LOST' && <XCircle className="h-4 w-4 text-red-500" />}
                {exp.status === 'ITERATE' && <RefreshCw className="h-4 w-4 text-amber-500" />}
                <h3 className="font-medium flex-1">{exp.hypothesis}</h3>
                <Badge variant="outline">{statusLabels[exp.status]}</Badge>
              </div>
              {exp.resultNotes && <p className="text-sm text-muted-foreground">{exp.resultNotes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
