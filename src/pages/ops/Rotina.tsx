import { useState, useMemo } from 'react';
import { useOps } from '@/contexts/OpsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Flame,
  Shield,
  Calendar,
  User,
  Store,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TaskInstance, TaskStatus } from '@/types/marketplace-ops';

export function Rotina() {
  const { state, updateState } = useOps();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [onlyMine, setOnlyMine] = useState(false);
  const [executingTask, setExecutingTask] = useState<TaskInstance | null>(null);
  const [evidenceLink, setEvidenceLink] = useState('');
  const [notes, setNotes] = useState('');
  const [stepsState, setStepsState] = useState<{ label: string; checked: boolean }[]>([]);

  // Filtrar tarefas do dia
  const filteredTasks = useMemo(() => {
    let tasks = state.tasks.filter((t) => t.dateISO === selectedDate);

    // Se MEMBER: sempre mostra APENAS suas tarefas (sem opção de ver outras)
    if (state.settings.currentUserRole === 'MEMBER') {
      tasks = tasks.filter((t) => t.ownerId === state.settings.currentOwnerId);
    } else {
      // Se ADMIN: pode usar filtros
      // Filtro "Só minhas"
      if (onlyMine) {
        tasks = tasks.filter((t) => t.ownerId === state.settings.currentOwnerId);
      }

      // Filtro dropdown Owner
      if (filterOwner !== 'all') {
        tasks = tasks.filter((t) => t.ownerId === filterOwner);
      }
    }

    // Ordenar: horário -> critical first
    return tasks.sort((a, b) => {
      if (a.timeHHMM !== b.timeHHMM) {
        return a.timeHHMM.localeCompare(b.timeHHMM);
      }
      return a.isCritical && !b.isCritical ? -1 : 1;
    });
  }, [state.tasks, selectedDate, onlyMine, filterOwner, state.settings.currentOwnerId, state.settings.currentUserRole]);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter((t) => t.status === 'DONE').length;
    const skipped = filteredTasks.filter((t) => t.status === 'SKIPPED').length;
    const todo = filteredTasks.filter((t) => t.status === 'TODO').length;
    const critical = filteredTasks.filter((t) => t.isCritical && t.status === 'TODO').length;
    return { total, done, skipped, todo, critical };
  }, [filteredTasks]);

  const handleExecute = (task: TaskInstance) => {
    setExecutingTask(task);
    setEvidenceLink(task.evidenceUrl || '');
    setNotes(task.notes || '');
    setStepsState(task.stepsState || []);
  };

  const handleComplete = () => {
    if (!executingTask) return;

    if (executingTask.requireEvidence && !evidenceLink) {
      toast.error('Evidência obrigatória para esta tarefa!');
      return;
    }

    // Award points
    const template = state.templates.find((t) => t.id === executingTask.templateId);
    const points = template?.points || 10;

    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === executingTask.id
          ? {
              ...t,
              status: 'DONE' as TaskStatus,
              evidenceUrl: evidenceLink,
              notes,
              stepsState,
              completedAt: new Date().toISOString(),
              pointsAwarded: points,
            }
          : t
      ),
      points: [
        ...prev.points,
        {
          ownerId: executingTask.ownerId,
          dateISO: executingTask.dateISO,
          points: template?.pointsOnDone || 10,
          reason: `Concluiu: ${executingTask.title}`,
          source: 'TASK_DONE' as const,
        },
      ],
    }));

    toast.success('Tarefa concluída! +' + (template?.pointsOnDone || 10) + ' pontos');
    setExecutingTask(null);
  };

  const handleSkip = () => {
    if (!executingTask) return;

    const template = state.templates.find((t) => t.id === executingTask.templateId);

    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === executingTask.id
          ? {
              ...t,
              status: 'SKIPPED' as TaskStatus,
              notes,
              completedAt: new Date().toISOString(),
            }
          : t
      ),
      points: [
        ...prev.points,
        {
          ownerId: executingTask.ownerId,
          dateISO: executingTask.dateISO,
          points: template?.pointsOnSkip || -5,
          reason: `Pulou: ${executingTask.title}`,
          source: 'TASK_SKIPPED' as const,
        },
      ],
    }));

    toast.error('Tarefa pulada. ' + (template?.pointsOnSkip || -5) + ' pontos');
    setExecutingTask(null);
  };

  const getStatusBadge = (status: TaskStatus) => {
    if (status === 'DONE') {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Concluído
        </Badge>
      );
    }
    if (status === 'SKIPPED') {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Pulado
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Clock className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      HIGIENE: 'bg-blue-600',
      PROTECAO: 'bg-orange-600',
      CRESCIMENTO: 'bg-green-600',
      SETUP: 'bg-purple-600',
    };
    return colors[type] || 'bg-slate-600';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Rotina</h1>
        <p className="text-muted-foreground">
          Lista do dia com execução (Concluir/Pular) e evidências
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.todo}</div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.done}</div>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.skipped}</div>
            <p className="text-xs text-muted-foreground">Puladas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Críticas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Dono - Apenas para ADMIN */}
            {state.settings.currentUserRole === 'ADMIN' && (
              <div className="space-y-2">
                <Label>Dono</Label>
                <Select value={filterOwner} onValueChange={setFilterOwner}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {state.owners
                      .filter((o) => o.active)
                      .map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Só minhas - Apenas para ADMIN */}
            {state.settings.currentUserRole === 'ADMIN' && (
              <div className="space-y-2">
                <Label>Filtro Rápido</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="only-mine"
                    checked={onlyMine}
                    onCheckedChange={setOnlyMine}
                  />
                  <Label htmlFor="only-mine" className="cursor-pointer">
                    Só minhas ({state.owners.find(o => o.id === state.settings.currentOwnerId)?.name})
                  </Label>
                </div>
              </div>
            )}
            
            {/* Aviso para MEMBER */}
            {state.settings.currentUserRole === 'MEMBER' && (
              <div className="col-span-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  🔒 <strong>Modo Member:</strong> Você vê apenas suas tarefas atribuídas.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tarefas */}
      {filteredTasks.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa para este dia</h3>
            <p className="text-muted-foreground mb-4">
              {state.templates.length === 0
                ? 'Crie templates primeiro e depois aplique o mês.'
                : 'Vá em Templates e clique em "Aplicar Este Mês".'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const marketplace = state.marketplaces.find((m) => m.id === task.marketplaceId);
            const owner = state.owners.find((o) => o.id === task.ownerId);
            const template = state.templates.find((t) => t.id === task.templateId);

            return (
              <Card
                key={task.id}
                className={`border-0 shadow-lg hover:shadow-xl transition-all ${
                  task.status === 'DONE' ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    
                    {/* Time Badge */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-16 h-16 rounded-xl ${getTypeColor(task.type)} flex flex-col items-center justify-center text-white`}
                      >
                        <Clock className="h-4 w-4 mb-1" />
                        <span className="text-xs font-bold">{task.timeHHMM}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            {marketplace && (
                              <span className="flex items-center gap-1">
                                <Store className="h-3 w-3" />
                                {marketplace.name}
                              </span>
                            )}
                            {!marketplace && <span>Global</span>}
                            <span>•</span>
                            {owner && (
                              <span className="flex items-center gap-1">
                                <div 
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: owner.color || '#6B7280' }}
                                >
                                  {owner.initials}
                                </div>
                                {owner.name}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {getStatusBadge(task.status)}
                            <Badge className={getTypeColor(task.type)}>{task.type}</Badge>
                            {task.isCritical && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                Crítica
                              </Badge>
                            )}
                            {task.requireEvidence && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Evidência Obrigatória
                              </Badge>
                            )}
                          </div>
                        </div>
                        {task.status === 'TODO' && (
                          <Button onClick={() => handleExecute(task)}>Executar</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Execução */}
      <Dialog open={!!executingTask} onOpenChange={() => setExecutingTask(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg ${getTypeColor(executingTask?.type || '')} flex items-center justify-center text-white`}>
                <Clock className="h-5 w-5" />
              </div>
              {executingTask?.title}
            </DialogTitle>
            <DialogDescription>
              {executingTask?.timeHHMM} •{' '}
              {state.marketplaces.find((m) => m.id === executingTask?.marketplaceId)?.name || 'Global'} •{' '}
              {state.owners.find((o) => o.id === executingTask?.ownerId)?.name}
            </DialogDescription>
          </DialogHeader>

          {executingTask && (
            <div className="space-y-6 py-4">
              
              {/* SOP */}
              {executingTask.descriptionMarkdown && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">📋 SOP (Passo a Passo)</Label>
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{executingTask.descriptionMarkdown}</pre>
                  </div>
                </div>
              )}

              {/* DoD */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">✅ Definition of Done (DoD)</Label>
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm">{executingTask.DoD}</p>
                </div>
              </div>

              {/* Steps */}
              {stepsState.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">📝 Checklist</Label>
                  <div className="space-y-2">
                    {stepsState.map((step, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`step-${index}`}
                          checked={step.checked}
                          onCheckedChange={(checked) => {
                            const newSteps = [...stepsState];
                            newSteps[index].checked = !!checked;
                            setStepsState(newSteps);
                          }}
                        />
                        <Label htmlFor={`step-${index}`} className="cursor-pointer">
                          {step.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidência */}
              {state.templates.find((t) => t.id === executingTask.templateId)?.evidenceRequired && (
                <div className="space-y-2">
                  <Label htmlFor="evidence" className="text-base font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-600" />
                    Evidência (Obrigatória) *
                  </Label>
                  <Input
                    id="evidence"
                    placeholder="Cole o link da evidência (print, dashboard, etc)"
                    value={evidenceLink}
                    onChange={(e) => setEvidenceLink(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tarefa crítica requer evidência (link de print, dashboard, etc)
                  </p>
                </div>
              )}

              {/* Notas */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base font-semibold">📝 Notas (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações, dúvidas, problemas encontrados..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Alert */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Concluir:</strong> Marca como DONE e registra pontos (+
                  {state.templates.find((t) => t.id === executingTask.templateId)?.pointsOnDone || 10}).
                  <br />
                  <strong>Pular:</strong> Marca como SKIPPED e aplica penalidade (
                  {state.templates.find((t) => t.id === executingTask.templateId)?.pointsOnSkip || -5} pontos).
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExecutingTask(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleSkip}>
              <XCircle className="h-4 w-4 mr-2" />
              Pular
            </Button>
            <Button onClick={handleComplete}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
