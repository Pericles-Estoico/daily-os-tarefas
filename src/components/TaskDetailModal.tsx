import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { RoutineTask, TaskStep } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Clock, ExternalLink, AlertTriangle, CheckCircle2, Edit, Lock, Plus, X } from 'lucide-react';

interface TaskDetailModalProps {
  task: RoutineTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (evidenceLinks: string[]) => void;
  onSkip: (reason: string) => void;
}

export function TaskDetailModal({ task, open, onOpenChange, onComplete, onSkip }: TaskDetailModalProps) {
  const owners = useStore((state) => state.owners);
  const marketplaces = useStore((state) => state.marketplaces);
  const config = useStore((state) => state.config);
  const updateRoutineTask = useStore((state) => state.updateRoutineTask);
  
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>([]);
  const [newEvidence, setNewEvidence] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [isEditingOperational, setIsEditingOperational] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  
  // Check if current user is CEO (manager)
  const isManager = config.currentUserId === 'owner-1';
  const isOwner = config.currentUserId === task?.ownerId;
  
  if (!task) return null;
  
  const owner = owners.find(o => o.id === task.ownerId);
  const marketplace = task.marketplaceId ? marketplaces.find(m => m.id === task.marketplaceId) : null;
  
  const getOwnerInitials = (nome: string) => {
    const parts = nome.split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : nome.substring(0, 2).toUpperCase();
  };

  const handleAddEvidence = () => {
    if (newEvidence.trim()) {
      setEvidenceLinks([...evidenceLinks, newEvidence.trim()]);
      setNewEvidence('');
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceLinks(evidenceLinks.filter((_, i) => i !== index));
  };

  const handleToggleStep = (stepId: string) => {
    const updatedSteps = task.steps.map(s => 
      s.id === stepId ? { ...s, completed: !s.completed } : s
    );
    updateRoutineTask(task.id, { steps: updatedSteps });
  };

  const handleComplete = () => {
    if (task.evidenceRequired && evidenceLinks.length === 0) return;
    onComplete(evidenceLinks);
    setEvidenceLinks([]);
  };

  const handleSkip = () => {
    if (!skipReason.trim()) return;
    onSkip(skipReason);
    setSkipReason('');
  };

  const handleSaveOperational = () => {
    updateRoutineTask(task.id, { description: editedDescription });
    setIsEditingOperational(false);
  };

  const completedSteps = task.steps.filter(s => s.completed).length;
  const totalSteps = task.steps.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">{task.time}</Badge>
            {task.critical && <Badge variant="destructive">Crítica</Badge>}
            <Badge variant="secondary">{task.type}</Badge>
            {task.timeboxMinutes > 0 && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {task.timeboxMinutes}min
              </Badge>
            )}
          </div>
          <DialogTitle className="text-lg mt-2">{task.title}</DialogTitle>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{marketplace?.name || 'Global'}</span>
            {owner && (
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarFallback style={{ backgroundColor: owner.avatarColor, color: 'white', fontSize: '9px' }}>
                    {getOwnerInitials(owner.nome)}
                  </AvatarFallback>
                </Avatar>
                <span>{owner.nome}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <Tabs defaultValue="operacional" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="operacional">Operacional</TabsTrigger>
              <TabsTrigger value="passos">Passos {totalSteps > 0 && `(${completedSteps}/${totalSteps})`}</TabsTrigger>
              <TabsTrigger value="dod">DoD</TabsTrigger>
              <TabsTrigger value="evidencias">Evidências</TabsTrigger>
            </TabsList>

            <TabsContent value="operacional" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Descrição Operacional</Label>
                {isManager ? (
                  <Button variant="ghost" size="sm" onClick={() => { setEditedDescription(task.description); setIsEditingOperational(!isEditingOperational); }}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Somente gestor edita
                  </span>
                )}
              </div>
              
              {isEditingOperational && isManager ? (
                <div className="space-y-2">
                  <Textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} rows={6} placeholder="Descrição operacional (markdown)..." />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveOperational}>Salvar</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingOperational(false)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/50 p-3 rounded-md">
                  {task.description || <span className="text-muted-foreground italic">Sem descrição operacional</span>}
                </div>
              )}

              {task.inputs.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Inputs (o que preciso)</Label>
                  <ul className="mt-1 text-sm list-disc pl-4 text-muted-foreground">
                    {task.inputs.map((input, i) => <li key={i}>{input}</li>)}
                  </ul>
                </div>
              )}

              {task.outputs.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Outputs (o que entrego)</Label>
                  <ul className="mt-1 text-sm list-disc pl-4 text-muted-foreground">
                    {task.outputs.map((output, i) => <li key={i}>{output}</li>)}
                  </ul>
                </div>
              )}

              {task.commonMistakes.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-4 w-4" /> Erros Comuns
                  </Label>
                  <ul className="mt-1 text-sm list-disc pl-4 text-muted-foreground">
                    {task.commonMistakes.map((mistake, i) => <li key={i}>{mistake}</li>)}
                  </ul>
                </div>
              )}

              {task.toolsLinks.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Ferramentas</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {task.toolsLinks.map((tool, i) => (
                      <a key={i} href={tool.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" /> {tool.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {task.escalationRule && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  <Label className="text-sm font-semibold text-destructive">Escalonamento</Label>
                  <p className="text-sm mt-1">{task.escalationRule}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="passos" className="space-y-3 mt-4">
              {task.steps.length > 0 ? (
                task.steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <Checkbox checked={step.completed} onCheckedChange={() => handleToggleStep(step.id)} disabled={task.status === 'DONE'} />
                    <span className={step.completed ? 'line-through text-muted-foreground' : ''}>{step.text}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhum passo definido</p>
              )}
            </TabsContent>

            <TabsContent value="dod" className="space-y-4 mt-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3">
                <Label className="text-sm font-semibold flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> Definition of Done
                </Label>
                <p className="text-sm mt-1">{task.dod}</p>
              </div>

              {task.evidenceExamples.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Exemplos de Evidência Aceitos</Label>
                  <ul className="mt-1 text-sm list-disc pl-4 text-muted-foreground">
                    {task.evidenceExamples.map((ex, i) => <li key={i}>{ex}</li>)}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="evidencias" className="space-y-4 mt-4">
              {task.status === 'DONE' ? (
                <div>
                  <Label className="text-sm font-semibold">Evidências Registradas</Label>
                  {task.evidenceLinks.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {task.evidenceLinks.map((link, i) => (
                        <li key={i} className="text-sm text-primary hover:underline">
                          <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma evidência</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Label>Adicionar Evidências {task.evidenceRequired && <span className="text-destructive">*</span>}</Label>
                  <div className="flex gap-2">
                    <Input value={newEvidence} onChange={(e) => setNewEvidence(e.target.value)} placeholder="Cole o link da evidência..." onKeyDown={(e) => e.key === 'Enter' && handleAddEvidence()} />
                    <Button variant="outline" onClick={handleAddEvidence}><Plus className="h-4 w-4" /></Button>
                  </div>
                  {evidenceLinks.length > 0 && (
                    <ul className="space-y-1">
                      {evidenceLinks.map((link, i) => (
                        <li key={i} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                          <span className="truncate flex-1">{link}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveEvidence(i)}><X className="h-4 w-4" /></Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <Separator />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {task.status !== 'DONE' && task.status !== 'SKIPPED' && (
            <>
              <div className="flex-1 flex gap-2">
                <Input value={skipReason} onChange={(e) => setSkipReason(e.target.value)} placeholder="Motivo para pular..." className="flex-1" />
                <Button variant="outline" onClick={handleSkip} disabled={!skipReason.trim()}>Pular</Button>
              </div>
              <Button onClick={handleComplete} disabled={task.evidenceRequired && evidenceLinks.length === 0}>
                Concluir
              </Button>
            </>
          )}
          {(task.status === 'DONE' || task.status === 'SKIPPED') && (
            <Badge variant={task.status === 'DONE' ? 'default' : 'secondary'}>{task.status}</Badge>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
