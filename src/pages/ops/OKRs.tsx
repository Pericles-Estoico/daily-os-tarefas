import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Target, TrendingUp, Pencil, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { 
  useObjectives, 
  useKeyResults, 
  useCreateObjective, 
  useUpdateObjective, 
  useDeleteObjective,
  useCreateKeyResult,
  useUpdateKeyResult,
  useDeleteKeyResult,
  useMonthlyKPISummary,
  useActiveMarketplacesP1Count,
  type Objective,
  type KeyResult 
} from '@/hooks/useOKRsData';
import { useOwners } from '@/hooks/useSupabaseData';

export function OKRs() {
  const { data: objectives = [], isLoading: loadingObjectives } = useObjectives();
  const { data: keyResults = [], isLoading: loadingKRs } = useKeyResults();
  const { data: owners = [] } = useOwners();
  const { data: kpiSummary } = useMonthlyKPISummary(2026, 1);
  const { data: p1Count = 0 } = useActiveMarketplacesP1Count();
  
  const createObjective = useCreateObjective();
  const updateObjective = useUpdateObjective();
  const deleteObjective = useDeleteObjective();
  const createKeyResult = useCreateKeyResult();
  const updateKeyResult = useUpdateKeyResult();
  const deleteKeyResult = useDeleteKeyResult();

  const [isObjectiveDialogOpen, setIsObjectiveDialogOpen] = useState(false);
  const [isKRDialogOpen, setIsKRDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [editingKR, setEditingKR] = useState<KeyResult | null>(null);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>('');

  // Objective form
  const [objTitle, setObjTitle] = useState('');
  const [objOwnerId, setObjOwnerId] = useState('');
  const [objDueDate, setObjDueDate] = useState('');
  const [objDescription, setObjDescription] = useState('');

  // Key Result form
  const [krMetricName, setKrMetricName] = useState('');
  const [krUnit, setKrUnit] = useState('');
  const [krBaseline, setKrBaseline] = useState('');
  const [krTarget, setKrTarget] = useState('');
  const [krCurrent, setKrCurrent] = useState('');

  // Get objectives with their key results
  const objectivesWithKRs = useMemo(() => {
    return objectives.map(obj => {
      const krs = keyResults.filter(kr => kr.objective_id === obj.id);
      const totalProgress = krs.length > 0
        ? krs.reduce((sum, kr) => {
            const progress = ((kr.current - kr.baseline) / (kr.target - kr.baseline)) * 100;
            return sum + Math.max(0, Math.min(100, progress));
          }, 0) / krs.length
        : 0;
      
      return {
        ...obj,
        keyResults: krs,
        progress: totalProgress,
      };
    });
  }, [objectives, keyResults]);

  const openCreateObjectiveDialog = () => {
    setEditingObjective(null);
    setObjTitle('');
    setObjOwnerId(owners[0]?.id || '');
    setObjDueDate('');
    setObjDescription('');
    setIsObjectiveDialogOpen(true);
  };

  const openEditObjectiveDialog = (obj: Objective) => {
    setEditingObjective(obj);
    setObjTitle(obj.title);
    setObjOwnerId(obj.owner_id || '');
    setObjDueDate(obj.due_date || '');
    setObjDescription(obj.description || '');
    setIsObjectiveDialogOpen(true);
  };

  const handleSaveObjective = async () => {
    if (!objTitle.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    try {
      if (editingObjective) {
        await updateObjective.mutateAsync({
          id: editingObjective.id,
          updates: {
            title: objTitle.trim(),
            owner_id: objOwnerId || null,
            due_date: objDueDate || null,
            description: objDescription.trim() || null,
          },
        });
        toast.success('Objetivo atualizado!');
      } else {
        await createObjective.mutateAsync({
          id: `obj-${Date.now()}`,
          title: objTitle.trim(),
          owner_id: objOwnerId || null,
          due_date: objDueDate || null,
          description: objDescription.trim() || null,
        });
        toast.success('Objetivo criado!');
      }
      setIsObjectiveDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar objetivo');
      console.error(error);
    }
  };

  const handleDeleteObjective = async (id: string) => {
    if (!confirm('Excluir objetivo e todos os Key Results associados?')) return;

    try {
      await deleteObjective.mutateAsync(id);
      toast.success('Objetivo excluído!');
    } catch (error) {
      toast.error('Erro ao excluir objetivo');
      console.error(error);
    }
  };

  const openCreateKRDialog = (objectiveId: string) => {
    setEditingKR(null);
    setSelectedObjectiveId(objectiveId);
    setKrMetricName('');
    setKrUnit('');
    setKrBaseline('');
    setKrTarget('');
    setKrCurrent('');
    setIsKRDialogOpen(true);
  };

  const openEditKRDialog = (kr: KeyResult) => {
    setEditingKR(kr);
    setSelectedObjectiveId(kr.objective_id);
    setKrMetricName(kr.metric_name);
    setKrUnit(kr.unit || '');
    setKrBaseline(kr.baseline.toString());
    setKrTarget(kr.target.toString());
    setKrCurrent(kr.current.toString());
    setIsKRDialogOpen(true);
  };

  const handleSaveKR = async () => {
    if (!krMetricName.trim() || !krUnit.trim()) {
      toast.error('Métrica e Unidade são obrigatórios');
      return;
    }

    const baseline = parseFloat(krBaseline) || 0;
    const target = parseFloat(krTarget) || 0;
    const current = parseFloat(krCurrent) || baseline;

    try {
      if (editingKR) {
        await updateKeyResult.mutateAsync({
          id: editingKR.id,
          updates: {
            metric_name: krMetricName.trim(),
            unit: krUnit.trim(),
            baseline,
            target,
            current,
          },
        });
        toast.success('Key Result atualizado!');
      } else {
        await createKeyResult.mutateAsync({
          id: `kr-${Date.now()}`,
          objective_id: selectedObjectiveId,
          metric_name: krMetricName.trim(),
          unit: krUnit.trim(),
          baseline,
          target,
          current,
        });
        toast.success('Key Result criado!');
      }
      setIsKRDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar Key Result');
      console.error(error);
    }
  };

  const handleDeleteKR = async (id: string) => {
    if (!confirm('Excluir este Key Result?')) return;

    try {
      await deleteKeyResult.mutateAsync(id);
      toast.success('Key Result excluído!');
    } catch (error) {
      toast.error('Erro ao excluir Key Result');
      console.error(error);
    }
  };

  // Update KR with current data from Supabase
  const handleSyncKR = async (kr: KeyResult) => {
    if (!kpiSummary) return;
    
    let newCurrent = kr.current;
    
    // Auto-update based on metric name
    if (kr.metric_name.toLowerCase().includes('gmv') && kr.metric_name.toLowerCase().includes('mensal')) {
      newCurrent = kpiSummary.totalGMV;
    } else if (kr.metric_name.toLowerCase().includes('gmv') && kr.metric_name.toLowerCase().includes('diário')) {
      newCurrent = kpiSummary.avgGMV;
    } else if (kr.metric_name.toLowerCase().includes('pedido')) {
      newCurrent = kpiSummary.totalOrders;
    } else if (kr.metric_name.toLowerCase().includes('cancelamento')) {
      newCurrent = kpiSummary.avgCancelRate * 100;
    } else if (kr.metric_name.toLowerCase().includes('marketplace') && kr.metric_name.toLowerCase().includes('p1')) {
      newCurrent = p1Count;
    }
    
    if (newCurrent !== kr.current) {
      try {
        await updateKeyResult.mutateAsync({
          id: kr.id,
          updates: { current: newCurrent },
        });
        toast.success(`KR atualizado: ${formatNumber(newCurrent)} ${kr.unit}`);
      } catch (error) {
        toast.error('Erro ao sincronizar KR');
      }
    } else {
      toast.info('Valor já está atualizado');
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600';
    if (progress >= 70) return 'text-blue-600';
    if (progress >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const isLoading = loadingObjectives || loadingKRs;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
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
            <Target className="h-8 w-8" />
            OKRs
          </h1>
          <p className="text-muted-foreground mt-1">
            Objectives and Key Results
          </p>
        </div>
        <Dialog open={isObjectiveDialogOpen} onOpenChange={setIsObjectiveDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateObjectiveDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Objetivo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingObjective ? 'Editar Objetivo' : 'Novo Objetivo'}
              </DialogTitle>
              <DialogDescription>
                Defina um objetivo estratégico
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="objTitle">Título *</Label>
                <Input
                  id="objTitle"
                  value={objTitle}
                  onChange={(e) => setObjTitle(e.target.value)}
                  placeholder="Ex: Aumentar vendas no marketplace X"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="objOwner">Responsável</Label>
                  <Select value={objOwnerId} onValueChange={setObjOwnerId}>
                    <SelectTrigger id="objOwner">
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
                  <Label htmlFor="objDueDate">Data Limite</Label>
                  <Input
                    id="objDueDate"
                    type="date"
                    value={objDueDate}
                    onChange={(e) => setObjDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="objDescription">Descrição</Label>
                <Textarea
                  id="objDescription"
                  value={objDescription}
                  onChange={(e) => setObjDescription(e.target.value)}
                  placeholder="Descreva o objetivo..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsObjectiveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveObjective} disabled={createObjective.isPending || updateObjective.isPending}>
                {editingObjective ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Objetivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{objectives.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Key Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keyResults.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {objectivesWithKRs.filter(o => o.progress >= 100).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {objectivesWithKRs.length > 0
                ? Math.round(objectivesWithKRs.reduce((sum, o) => sum + o.progress, 0) / objectivesWithKRs.length)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Summary Card */}
      {kpiSummary && kpiSummary.daysWithData > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumo Janeiro 2026 (Auto-calculado)
            </CardTitle>
            <CardDescription>
              Dados do Supabase para atualizar KRs automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">GMV Total</p>
                <p className="text-lg font-bold">R$ {formatNumber(kpiSummary.totalGMV)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">GMV Médio/Dia</p>
                <p className="text-lg font-bold">R$ {formatNumber(kpiSummary.avgGMV)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pedidos</p>
                <p className="text-lg font-bold">{formatNumber(kpiSummary.totalOrders)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dias com Dados</p>
                <p className="text-lg font-bold">{kpiSummary.daysWithData}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Marketplaces P1</p>
                <p className="text-lg font-bold">{p1Count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Objectives List */}
      <div className="space-y-4">
        {objectivesWithKRs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum objetivo cadastrado</p>
              <p className="text-sm mt-2">Crie o objetivo "Faturar R$ 10.000 em Janeiro 2026" para começar!</p>
            </CardContent>
          </Card>
        ) : (
          objectivesWithKRs.map((obj) => {
            const owner = owners.find(o => o.id === obj.owner_id);
            const isCompleted = obj.progress >= 100;
            
            return (
              <Card key={obj.id} className={isCompleted ? 'border-green-500' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        {obj.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {obj.description}
                      </CardDescription>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{owner?.name || 'Sem dono'}</Badge>
                        {obj.due_date && (
                          <Badge variant="outline">
                            {new Date(obj.due_date).toLocaleDateString('pt-BR')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditObjectiveDialog(obj)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteObjective(obj.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso</span>
                      <span className={getProgressColor(obj.progress)}>
                        {Math.round(obj.progress)}%
                      </span>
                    </div>
                    <Progress value={obj.progress} className="h-2" />
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Key Results ({obj.keyResults.length})
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCreateKRDialog(obj.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar KR
                      </Button>
                    </div>

                    {obj.keyResults.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum Key Result cadastrado
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {obj.keyResults.map((kr) => {
                          const progress = ((kr.current - kr.baseline) / (kr.target - kr.baseline)) * 100;
                          const clampedProgress = Math.max(0, Math.min(100, progress));
                          
                          return (
                            <div key={kr.id} className="border rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="font-medium">{kr.metric_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatNumber(kr.baseline)} → {formatNumber(kr.target)} {kr.unit}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSyncKR(kr)}
                                    title="Sincronizar com dados atuais"
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditKRDialog(kr)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteKR(kr.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Progress value={clampedProgress} className="h-1.5 flex-1" />
                                <span className={`text-sm font-semibold ${getProgressColor(clampedProgress)}`}>
                                  {formatNumber(kr.current)} {kr.unit}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Key Result Dialog */}
      <Dialog open={isKRDialogOpen} onOpenChange={setIsKRDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingKR ? 'Editar Key Result' : 'Novo Key Result'}
            </DialogTitle>
            <DialogDescription>
              Defina uma métrica mensurável
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="krMetricName">Métrica *</Label>
              <Input
                id="krMetricName"
                value={krMetricName}
                onChange={(e) => setKrMetricName(e.target.value)}
                placeholder="Ex: GMV Total Mensal"
              />
            </div>

            <div>
              <Label htmlFor="krUnit">Unidade *</Label>
              <Input
                id="krUnit"
                value={krUnit}
                onChange={(e) => setKrUnit(e.target.value)}
                placeholder="Ex: R$, %, pedidos"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="krBaseline">Baseline</Label>
                <Input
                  id="krBaseline"
                  type="number"
                  value={krBaseline}
                  onChange={(e) => setKrBaseline(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="krTarget">Target</Label>
                <Input
                  id="krTarget"
                  type="number"
                  value={krTarget}
                  onChange={(e) => setKrTarget(e.target.value)}
                  placeholder="10000"
                />
              </div>
              <div>
                <Label htmlFor="krCurrent">Atual</Label>
                <Input
                  id="krCurrent"
                  type="number"
                  value={krCurrent}
                  onChange={(e) => setKrCurrent(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsKRDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveKR} disabled={createKeyResult.isPending || updateKeyResult.isPending}>
              {editingKR ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}