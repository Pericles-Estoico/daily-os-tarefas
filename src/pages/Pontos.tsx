import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown, User } from 'lucide-react';

export default function Pontos() {
  const pointsLedger = useStore((state) => state.pointsLedger);
  const owners = useStore((state) => state.owners);

  const getOwnerName = (ownerId: string) => owners.find((o) => o.id === ownerId)?.nome || 'Desconhecido';
  const getOwner = (ownerId: string) => owners.find((o) => o.id === ownerId);

  const pointsByOwner = owners.map((owner) => {
    const ownerPoints = pointsLedger.filter((p) => p.ownerId === owner.id);
    const total = ownerPoints.reduce((acc, p) => acc + (p.tipo === 'premio' ? p.pontos : -Math.abs(p.pontos)), 0);
    return { owner, total, entries: ownerPoints };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Pontos (Penas & Prêmios)
        </h1>
        <p className="text-muted-foreground">{pointsLedger.length} registros</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pointsByOwner.map(({ owner, total }) => (
          <Card key={owner.id} className={total >= 0 ? 'border-[hsl(var(--success))]/30' : 'border-destructive/30'}>
            <CardContent className="p-4 text-center">
              <div className="h-12 w-12 rounded-full mx-auto flex items-center justify-center text-lg font-bold text-primary-foreground" style={{ backgroundColor: owner.avatarColor }}>
                {owner.nome.charAt(0)}
              </div>
              <p className="font-medium mt-2">{owner.nome}</p>
              <p className={`text-2xl font-bold font-mono ${total >= 0 ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                {total >= 0 ? '+' : ''}{total} pts
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
        <CardContent>
          {pointsLedger.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum ponto registrado ainda. Complete tarefas para ganhar pontos!</p>
          ) : (
            <div className="space-y-2">
              {pointsLedger.slice().reverse().map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-3">
                    {entry.tipo === 'premio' ? <TrendingUp className="h-4 w-4 text-[hsl(var(--success))]" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                    <div>
                      <p className="text-sm font-medium">{entry.motivo}</p>
                      <p className="text-xs text-muted-foreground">{getOwnerName(entry.ownerId)} • {new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <Badge className={entry.tipo === 'premio' ? 'bg-[hsl(var(--success))]' : 'bg-destructive'}>
                    {entry.tipo === 'premio' ? '+' : ''}{entry.pontos} pts
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
