import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trophy, Star, Award, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { 
  usePoints, 
  useCreatePoint, 
  usePointsRanking, 
  usePointsMonths, 
  useFilteredPoints,
  POINTS_CONFIG,
  type PointSource 
} from '@/hooks/usePointsData';
import { useOwners } from '@/hooks/useSupabaseData';

export function Pontos() {
  const { data: owners = [], isLoading: loadingOwners } = useOwners();
  const { data: months = [] } = usePointsMonths();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterOwnerId, setFilterOwnerId] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  const { data: ranking = [], isLoading: loadingRanking } = usePointsRanking(filterMonth);
  const { data: filteredPoints = [], isLoading: loadingPoints } = useFilteredPoints(filterOwnerId, filterMonth);
  
  const createPoint = useCreatePoint();

  // Form state
  const [formOwnerId, setFormOwnerId] = useState('');
  const [formDateISO, setFormDateISO] = useState('');
  const [formPoints, setFormPoints] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formSource, setFormSource] = useState<PointSource>('MANUAL');

  const openCreateDialog = () => {
    setFormOwnerId(owners[0]?.id || '');
    setFormDateISO(new Date().toISOString().split('T')[0]);
    setFormPoints('');
    setFormReason('');
    setFormSource('MANUAL');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formOwnerId || !formDateISO || !formPoints.trim() || !formReason.trim()) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    const points = parseInt(formPoints);
    if (isNaN(points)) {
      toast.error('Pontos deve ser um número válido');
      return;
    }

    try {
      await createPoint.mutateAsync({
        owner_id: formOwnerId,
        date_iso: formDateISO,
        points,
        reason: formReason.trim(),
        source: formSource,
      });
      toast.success('Pontos adicionados!');
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao adicionar pontos');
      console.error(error);
    }
  };

  const getSourceBadge = (source: PointSource) => {
    const config = {
      TASK_DONE: { color: 'bg-green-500', label: 'Tarefa Concluída' },
      TASK_SKIPPED: { color: 'bg-yellow-500', label: 'Tarefa Pulada' },
      INCIDENT_RESOLVED: { color: 'bg-blue-500', label: 'Incidente Resolvido' },
      MANUAL: { color: 'bg-purple-500', label: 'Manual' },
    };
    const { color, label } = config[source];
    return <Badge className={color}>{label}</Badge>;
  };

  const getMedalIcon = (position: number) => {
    if (position === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (position === 1) return <Award className="h-6 w-6 text-gray-400" />;
    if (position === 2) return <Award className="h-6 w-6 text-orange-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{position + 1}</span>;
  };

  const isLoading = loadingOwners || loadingRanking || loadingPoints;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8" />
            Pontos
          </h1>
          <p className="text-muted-foreground mt-1">
            Sistema de gamificação e ranking
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pontos
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Pontos</DialogTitle>
              <DialogDescription>
                Registre pontos manualmente
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="owner">Pessoa *</Label>
                <Select value={formOwnerId} onValueChange={setFormOwnerId}>
                  <SelectTrigger id="owner">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map(owner => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formDateISO}
                  onChange={(e) => setFormDateISO(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="points">Pontos *</Label>
                <Input
                  id="points"
                  type="number"
                  value={formPoints}
                  onChange={(e) => setFormPoints(e.target.value)}
                  placeholder="100"
                />
              </div>

              <div>
                <Label htmlFor="reason">Motivo *</Label>
                <Textarea
                  id="reason"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Descreva o motivo dos pontos..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="source">Origem</Label>
                <Select value={formSource} onValueChange={(v) => setFormSource(v as PointSource)}>
                  <SelectTrigger id="source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="TASK_DONE">Tarefa Concluída</SelectItem>
                    <SelectItem value="TASK_SKIPPED">Tarefa Pulada</SelectItem>
                    <SelectItem value="INCIDENT_RESOLVED">Incidente Resolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={createPoint.isPending}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Points Config Info */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-sm">Tabela de Pontuação Automática</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Tarefa Normal</p>
              <p className="font-bold text-green-600">+{POINTS_CONFIG.TASK_DONE_NORMAL}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tarefa Crítica</p>
              <p className="font-bold text-green-600">+{POINTS_CONFIG.TASK_DONE_CRITICAL}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tarefa Pulada</p>
              <p className="font-bold text-red-600">{POINTS_CONFIG.TASK_SKIPPED}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Incidente Resolvido</p>
              <p className="font-bold text-blue-600">+{POINTS_CONFIG.INCIDENT_RESOLVED}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Meta Diária</p>
              <p className="font-bold text-purple-600">+{POINTS_CONFIG.DAILY_GOAL_MET}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="filterOwner">Pessoa</Label>
              <Select value={filterOwnerId} onValueChange={setFilterOwnerId}>
                <SelectTrigger id="filterOwner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {owners.map(owner => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterMonth">Mês</Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger id="filterMonth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>
                      {new Date(month + '-01').toLocaleDateString('pt-BR', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ranking
            {filterMonth !== 'all' && (
              <span className="text-sm font-normal text-muted-foreground">
                ({new Date(filterMonth + '-01').toLocaleDateString('pt-BR', { 
                  year: 'numeric', 
                  month: 'long' 
                })})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum ponto registrado ainda</p>
              <p className="text-sm mt-1">Os pontos serão adicionados automaticamente ao concluir tarefas!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ranking.map((entry, index) => (
                <div
                  key={entry.owner.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {getMedalIcon(index)}
                    <div>
                      <p className="font-semibold">{entry.owner.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.owner.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold">{entry.points}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pontos ({filteredPoints.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPoints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum registro de pontos</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Pessoa</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPoints.map((point) => {
                  const owner = owners.find(o => o.id === point.owner_id);
                  return (
                    <TableRow key={point.id}>
                      <TableCell>
                        {new Date(point.date_iso).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{owner?.name}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${point.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {point.points > 0 ? '+' : ''}{point.points}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {point.reason}
                      </TableCell>
                      <TableCell>{getSourceBadge(point.source)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}