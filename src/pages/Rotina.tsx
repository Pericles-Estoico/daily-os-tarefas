import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SemaforoBadge } from '@/components/ui/semaforo-badge';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Camera,
} from 'lucide-react';
import type { RoutineTask, TaskStatus, Priority } from '@/types';

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: React.ElementType }> = {
  todo: { label: 'A Fazer', color: 'bg-muted text-muted-foreground', icon: Clock },
  doing: { label: 'Fazendo', color: 'bg-primary/10 text-primary', icon: AlertCircle },
  done: { label: 'Feito', color: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]', icon: CheckCircle2 },
  blocked: { label: 'Bloqueado', color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  normal: { label: 'Normal', color: 'bg-muted text-muted-foreground' },
  high: { label: 'Alta', color: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]' },
  urgent: { label: 'Urgente', color: 'bg-destructive/10 text-destructive' },
};

export default function Rotina() {
  const routineTasks = useStore((state) => state.routineTasks);
  const sectors = useStore((state) => state.sectors);
  const owners = useStore((state) => state.owners);
  const updateRoutineTask = useStore((state) => state.updateRoutineTask);
  const completeRoutineTask = useStore((state) => state.completeRoutineTask);
  const failRoutineTask = useStore((state) => state.failRoutineTask);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<RoutineTask | null>(null);
  const [evidencia, setEvidencia] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = routineTasks
    .filter((t) => t.date === today)
    .sort((a, b) => a.horario.localeCompare(b.horario));

  const filteredTasks = todayTasks.filter((task) => {
    const matchesSearch = task.nome.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesSector = sectorFilter === 'all' || task.sectorId === sectorFilter;
    return matchesSearch && matchesStatus && matchesSector;
  });

  const getSectorName = (sectorId: string) => {
    return sectors.find((s) => s.id === sectorId)?.nome || 'Desconhecido';
  };

  const getOwnerBySector = (sectorId: string) => {
    const sector = sectors.find((s) => s.id === sectorId);
    return owners.find((o) => o.id === sector?.ownerId);
  };

  const handleComplete = () => {
    if (selectedTask) {
      if (selectedTask.isCritical && !evidencia.trim()) {
        return; // Require evidence for critical tasks
      }
      completeRoutineTask(selectedTask.id, evidencia);
      setSelectedTask(null);
      setEvidencia('');
    }
  };

  const handleFail = () => {
    if (selectedTask) {
      failRoutineTask(selectedTask.id);
      setSelectedTask(null);
    }
  };

  const handleChecklistToggle = (taskId: string, checkId: string, checked: boolean) => {
    const task = routineTasks.find((t) => t.id === taskId);
    if (task) {
      const updatedChecklist = task.checklist.map((item) =>
        item.id === checkId ? { ...item, checked } : item
      );
      updateRoutineTask(taskId, { checklist: updatedChecklist });
    }
  };

  const completedCount = todayTasks.filter((t) => t.status === 'done').length;
  const totalCount = todayTasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rotina Diária</h1>
          <p className="text-muted-foreground">
            {completedCount} de {totalCount} tarefas concluídas ({progressPercent.toFixed(0)}%)
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          Nova Tarefa
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="todo">A Fazer</SelectItem>
            <SelectItem value="doing">Fazendo</SelectItem>
            <SelectItem value="done">Feito</SelectItem>
            <SelectItem value="blocked">Bloqueado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sectorFilter} onValueChange={setSectorFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Setores</SelectItem>
            {sectors.map((sector) => (
              <SelectItem key={sector.id} value={sector.id}>
                {sector.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline View */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="sector">Por Setor</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <div className="relative">
            <div className="absolute left-[52px] top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const StatusIcon = statusConfig[task.status].icon;
                const owner = getOwnerBySector(task.sectorId);
                return (
                  <div
                    key={task.id}
                    className="flex gap-4 cursor-pointer group"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex-shrink-0 w-14 text-right">
                      <span className="text-sm font-mono font-medium text-muted-foreground">
                        {task.horario}
                      </span>
                    </div>
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 bg-background z-10 flex items-center justify-center ${
                        task.status === 'done'
                          ? 'border-[hsl(var(--success))] bg-[hsl(var(--success))]/10'
                          : task.status === 'blocked'
                          ? 'border-destructive bg-destructive/10'
                          : 'border-border'
                      }`}
                    >
                      <StatusIcon className="h-3 w-3" />
                    </div>
                    <Card className="flex-1 group-hover:border-primary/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{task.nome}</span>
                              {task.isCritical && (
                                <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                  CRÍTICA
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{getSectorName(task.sectorId)}</span>
                              {owner && (
                                <>
                                  <span>•</span>
                                  <span
                                    className="inline-flex items-center gap-1"
                                  >
                                    <span
                                      className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] text-primary-foreground"
                                      style={{ backgroundColor: owner.avatarColor }}
                                    >
                                      {owner.nome.charAt(0)}
                                    </span>
                                    {owner.nome}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge className={priorityConfig[task.prioridade].color}>
                            {priorityConfig[task.prioridade].label}
                          </Badge>
                        </div>

                        {/* Mini checklist progress */}
                        {task.checklist.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{
                                  width: `${
                                    (task.checklist.filter((c) => c.checked).length /
                                      task.checklist.length) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {task.checklist.filter((c) => c.checked).length}/{task.checklist.length}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    <span className="font-mono text-sm text-muted-foreground w-12">
                      {task.horario}
                    </span>
                    <Badge className={statusConfig[task.status].color}>
                      {statusConfig[task.status].label}
                    </Badge>
                    <span className="flex-1 truncate">{task.nome}</span>
                    {task.isCritical && <SemaforoBadge status="vermelho" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sector" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {sectors.map((sector) => {
              const sectorTasks = filteredTasks.filter((t) => t.sectorId === sector.id);
              if (sectorTasks.length === 0) return null;
              return (
                <Card key={sector.id}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">{sector.nome}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {sectorTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 p-2 rounded bg-muted/50 cursor-pointer hover:bg-muted"
                          onClick={() => setSelectedTask(task)}
                        >
                          <span className="text-xs font-mono">{task.horario}</span>
                          <span className="flex-1 text-sm truncate">{task.nome}</span>
                          <Badge className={statusConfig[task.status].color} variant="outline">
                            {statusConfig[task.status].label}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-lg">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">{selectedTask.horario}</span>
                  {selectedTask.isCritical && (
                    <Badge variant="destructive">CRÍTICA</Badge>
                  )}
                </div>
                <DialogTitle>{selectedTask.nome}</DialogTitle>
                <DialogDescription>
                  {getSectorName(selectedTask.sectorId)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* DoD */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">
                    Critério de Pronto (DoD)
                  </Label>
                  <p className="text-sm mt-1 p-2 rounded bg-muted/50">{selectedTask.dod}</p>
                </div>

                {/* Checklist */}
                {selectedTask.checklist.length > 0 && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Checklist</Label>
                    <div className="space-y-2 mt-2">
                      {selectedTask.checklist.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <Checkbox
                            id={item.id}
                            checked={item.checked}
                            onCheckedChange={(checked) =>
                              handleChecklistToggle(selectedTask.id, item.id, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={item.id}
                            className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {item.text}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidência */}
                {selectedTask.status !== 'done' && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">
                      Evidência {selectedTask.isCritical && <span className="text-destructive">*</span>}
                    </Label>
                    <Textarea
                      placeholder="Cole o link da evidência ou descreva..."
                      value={evidencia}
                      onChange={(e) => setEvidencia(e.target.value)}
                      className="mt-1"
                    />
                    {selectedTask.isCritical && !evidencia.trim() && (
                      <p className="text-xs text-destructive mt-1">
                        Evidência obrigatória para tarefas críticas
                      </p>
                    )}
                  </div>
                )}

                {selectedTask.evidencia && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Evidência Registrada</Label>
                    <p className="text-sm mt-1 p-2 rounded bg-muted/50">{selectedTask.evidencia}</p>
                  </div>
                )}

                {/* Points Info */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[hsl(var(--success))]">
                    +{selectedTask.pontosOnDone} pts ao concluir
                  </span>
                  <span className="text-destructive">
                    {selectedTask.pontosOnFail} pts se falhar
                  </span>
                </div>
              </div>

              <DialogFooter className="gap-2">
                {selectedTask.status !== 'done' && (
                  <>
                    <Button variant="destructive" onClick={handleFail}>
                      Falhou
                    </Button>
                    <Button
                      onClick={handleComplete}
                      disabled={selectedTask.isCritical && !evidencia.trim()}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Concluir
                    </Button>
                  </>
                )}
                {selectedTask.status === 'done' && (
                  <Button variant="outline" onClick={() => setSelectedTask(null)}>
                    Fechar
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
