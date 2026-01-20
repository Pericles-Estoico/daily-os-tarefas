import { useState, useMemo } from 'react';
import { useOps } from '@/contexts/OpsContext';
import { Objective, KeyResult } from '@/types/marketplace-ops';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, TrendingUp, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function OKRs() {
  const { state, updateState } = useOps();
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
    return state.objectives.map(obj => {
      const krs = state.keyResults.filter(kr => kr.objectiveId === obj.id);
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
  }, [state.objectives, state.keyResults]);

  const openCreateObjectiveDialog = () => {
    setEditingObjective(null);
    setObjTitle('');
    setObjOwnerId(state.settings.currentOwnerId);
    setObjDueDate('');
    setObjDescription('');
    setIsObjectiveDialogOpen(true);
  };

  const openEditObjectiveDialog = (obj: Objective) => {
    setEditingObjective(obj);
    setObjTitle(obj.title);
    setObjOwnerId(obj.ownerId);
    setObjDueDate(obj.dueDate);
    setObjDescription(obj.description);
    setIsObjectiveDialogOpen(true);
  };

  const handleSaveObjective = () => {
    if (!objTitle.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const objectiveData: Objective = {
      id: editingObjective?.id || `obj-${Date.now()}`,
      title: objTitle.trim(),
      ownerId: objOwnerId,
      dueDate: objDueDate,
      description: objDescription.trim(),
    };

    updateState((prev) => {
      if (editingObjective) {
        const objectives = prev.objectives.map(o =>
          o.id === editingObjective.id ? objectiveData : o
        );
        toast.success('Objetivo atualizado!');
        return { ...prev, objectives };
      } else {
        toast.success('Objetivo criado!');
        return { ...prev, objectives: [...prev.objectives, objectiveData] };
      }
    });

    setIsObjectiveDialogOpen(false);
  };

  const handleDeleteObjective = (id: string) => {
    if (!confirm('Excluir objetivo e todos os Key Results associados?')) return;

    updateState((prev) => ({
      ...prev,
      objectives: prev.objectives.filter(o => o.id !== id),
      keyResults: prev.keyResults.filter(kr => kr.objectiveId !== id),
    }));

    toast.success('Objetivo excluído!');
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
    setSelectedObjectiveId(kr.objectiveId);
    setKrMetricName(kr.metricName);
    setKrUnit(kr.unit);
    setKrBaseline(kr.baseline.toString());
    setKrTarget(kr.target.toString());
    setKrCurrent(kr.current.toString());
    setIsKRDialogOpen(true);
  };

  const handleSaveKR = () => {
    if (!krMetricName.trim() || !krUnit.trim()) {
      toast.error('Métrica e Unidade são obrigatórios');
      return;
    }

    const baseline = parseFloat(krBaseline) || 0;
    const target = parseFloat(krTarget) || 0;
    const current = parseFloat(krCurrent) || baseline;

    const krData: KeyResult = {
      id: editingKR?.id || `kr-${Date.now()}`,
      objectiveId: selectedObjectiveId,
      metricName: krMetricName.trim(),
      unit: krUnit.trim(),
      baseline,
      target,
      current,
    };

    updateState((prev) => {
      if (editingKR) {
        const keyResults = prev.keyResults.map(kr =>
          kr.id === editingKR.id ? krData : kr
        );
        toast.success('Key Result atualizado!');
        return { ...prev, keyResults };
      } else {
        toast.success('Key Result criado!');
        return { ...prev, keyResults: [...prev.keyResults, krData] };
      }
    });

    setIsKRDialogOpen(false);
  };

  const handleDeleteKR = (id: string) => {
    if (!confirm('Excluir este Key Result?')) return;

    updateState((prev) => ({
      ...prev,
      keyResults: prev.keyResults.filter(kr => kr.id !== id),
    }));

    toast.success('Key Result excluído!');
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
                      {state.owners.filter(o => o.active).map(owner => (
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
              <Button onClick={handleSaveObjective}>
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
            <div className="text-2xl font-bold">{state.objectives.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Key Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.keyResults.length}</div>
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

      {/* Objectives List */}
      <div className="space-y-4">
        {objectivesWithKRs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum objetivo cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          objectivesWithKRs.map((obj) => {
            const owner = state.owners.find(o => o.id === obj.ownerId);
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
                        <Badge variant="outline">{owner?.name}</Badge>
                        {obj.dueDate && (
                          <Badge variant="outline">
                            {new Date(obj.dueDate).toLocaleDateString('pt-BR')}
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
                                  <p className="font-medium">{kr.metricName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatNumber(kr.baseline)} → {formatNumber(kr.target)} {kr.unit}
                                  </p>
                                </div>
                                <div className="flex gap-1">
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
              <Label htmlFor="krMetric">Métrica *</Label>
              <Input
                id="krMetric"
                value={krMetricName}
                onChange={(e) => setKrMetricName(e.target.value)}
                placeholder="Ex: Faturamento mensal"
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
                <Label htmlFor="krTarget">Meta</Label>
                <Input
                  id="krTarget"
                  type="number"
                  value={krTarget}
                  onChange={(e) => setKrTarget(e.target.value)}
                  placeholder="100"
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
            <Button onClick={handleSaveKR}>
              {editingKR ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
