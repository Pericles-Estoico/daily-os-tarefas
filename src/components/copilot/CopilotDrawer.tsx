import { useStore } from '@/lib/store';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle, Target, Lightbulb, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export function CopilotDrawer() {
  const marketplaces = useStore((state) => state.marketplaces);
  const routineTasks = useStore((state) => state.routineTasks);
  const incidents = useStore((state) => state.incidents);

  const today = format(new Date(), 'yyyy-MM-dd');
  const pendingCritical = routineTasks.filter((t) => t.date === today && t.critical && t.status !== 'DONE');
  const openCriticalIncidents = incidents.filter((i) => (i.severity === 'CRITICAL' || i.severity === 'HIGH') && (i.status === 'OPEN' || i.status === 'IN_PROGRESS'));
  const recoverMarketplaces = marketplaces.filter((m) => m.stage === 'RECOVER');

  const suggestions = [];
  if (pendingCritical.length > 0) suggestions.push({ type: 'warning', title: `${pendingCritical.length} tarefa(s) crítica(s) pendente(s)`, desc: pendingCritical[0]?.title });
  if (openCriticalIncidents.length > 0) suggestions.push({ type: 'warning', title: `${openCriticalIncidents.length} incidente(s) crítico(s)`, desc: openCriticalIncidents[0]?.title });
  if (recoverMarketplaces.length > 0) suggestions.push({ type: 'action', title: 'Foco em RECOVER', desc: recoverMarketplaces.map((m) => m.name).join(', ') });
  if (suggestions.length === 0) suggestions.push({ type: 'insight', title: 'Tudo sob controle! 🎉', desc: 'Continue executando a rotina.' });

  return (
    <Sheet>
      <SheetTrigger asChild><Button variant="outline" size="icon" className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50"><Sparkles className="h-5 w-5" /></Button></SheetTrigger>
      <SheetContent className="w-[400px]">
        <SheetHeader><SheetTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Copiloto IA</SheetTitle></SheetHeader>
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">Sugestões baseadas na operação:</p>
          {suggestions.map((s, i) => (
            <Card key={i}><CardContent className="p-4 flex items-start gap-3">
              <div className={s.type === 'warning' ? 'text-red-500' : s.type === 'action' ? 'text-blue-500' : 'text-amber-500'}>
                {s.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> : s.type === 'action' ? <Target className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />}
              </div>
              <div className="flex-1"><p className="font-medium text-sm">{s.title}</p><p className="text-sm text-muted-foreground">{s.desc}</p></div>
            </CardContent></Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
