import { useState } from 'react';
import { useOps } from '@/contexts/OpsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  FileText,
  Plus,
  Edit,
  Trash2,
  Play,
  Calendar,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle2,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { TaskTemplate, TaskType, TaskSeverity, TaskTemplateStep } from '@/types/marketplace-ops';
import { applyCurrentMonth, applyNextMonth, upsertTasks } from '@/lib/task-engine';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

const TYPE_OPTIONS: { value: TaskType; label: string; color: string }[] = [
  { value: 'HIGIENE', label: 'Higiene', color: 'bg-blue-600' },
  { value: 'PROTECAO', label: 'Proteção', color: 'bg-orange-600' },
  { value: 'CRESCIMENTO', label: 'Crescimento', color: 'bg-green-600' },
  { value: 'SETUP', label: 'Setup', color: 'bg-purple-600' },
];

const SEVERITY_OPTIONS: { value: TaskSeverity; label: string }[] = [
  { value: 'CRITICA', label: 'Crítica' },
  { value: 'NORMAL', label: 'Normal' },
];

export function Templates() {
  const { state, updateState } = useOps();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<TaskTemplate>>({
    id: '',
    title: '',
    marketplaceId: null,
    ownerId: state.settings.currentOwnerId,
    timeHHMM: '09:00',
    type: 'HIGIENE',
    severity: 'NORMAL',
    daysOfWeek: [1, 2, 3, 4, 5], // Seg-Sex
    DoD: '',
    isCritical: false,
    requireEvidence: false,
    active: true,
    description: '',
    steps: [],
    expectedMinutes: 30,
    toolsLinks: [],
    whenToOpenIncident: '',
    escalationRule: '',
    points: 10,
    penaltyPoints: -5,
  });

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      id: `tpl_${Date.now()}`,
      title: '',
      marketplaceId: null,
      ownerId: state.settings.currentOwnerId,
      timeHHMM: '09:00',
      type: 'HIGIENE',
      severity: 'NORMAL',
      daysOfWeek: [1, 2, 3, 4, 5],
      DoD: '',
      isCritical: false,
      requireEvidence: false,
      active: true,
      description: '',
      steps: [],
      expectedMinutes: 30,
      toolsLinks: [],
      whenToOpenIncident: '',
      escalationRule: '',
      points: 10,
      penaltyPoints: -5,
    });
    setDialogOpen(true);
  };

  const handleEdit = (template: TaskTemplate) => {
    setEditingId(template.id);
    setFormData(template);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.DoD) {
      toast.error('Preencha título e DoD');
      return;
    }

    const template: TaskTemplate = {
      id: formData.id!,
      title: formData.title!,
      marketplaceId: formData.marketplaceId!,
      ownerId: formData.ownerId!,
      timeHHMM: formData.timeHHMM!,
      type: formData.type!,
      severity: formData.severity!,
      daysOfWeek: formData.daysOfWeek!,
      DoD: formData.DoD!,
      isCritical: formData.isCritical!,
      requireEvidence: formData.requireEvidence!,
      active: formData.active!,
      description: formData.description || '',
      steps: formData.steps || [],
      expectedMinutes: formData.expectedMinutes || 30,
      toolsLinks: formData.toolsLinks || [],
      whenToOpenIncident: formData.whenToOpenIncident || '',
      escalationRule: formData.escalationRule || '',
      points: formData.points || 10,
      penaltyPoints: formData.penaltyPoints || -5,
    };

    updateState((prev) => {
      if (editingId) {
        return {
          ...prev,
          templates: prev.templates.map((t) => (t.id === editingId ? template : t)),
        };
      } else {
        return {
          ...prev,
          templates: [...prev.templates, template],
        };
      }
    });

    toast.success(editingId ? 'Template atualizado' : 'Template criado');
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    updateState((prev) => ({
      ...prev,
      templates: prev.templates.filter((t) => t.id !== id),
    }));
    toast.success('Template removido');
  };

  const handleApplyCurrentMonth = () => {
    const newTasks = applyCurrentMonth(state.templates);
    updateState((prev) => ({
      ...prev,
      tasks: upsertTasks(prev.tasks, newTasks),
    }));
    toast.success(`${newTasks.length} tarefas geradas para este mês!`);
  };

  const handleApplyNextMonth = () => {
    const newTasks = applyNextMonth(state.templates);
    updateState((prev) => ({
      ...prev,
      tasks: upsertTasks(prev.tasks, newTasks),
    }));
    toast.success(`${newTasks.length} tarefas geradas para o próximo mês!`);
  };

  const toggleDay = (day: number) => {
    const current = formData.daysOfWeek || [];
    if (current.includes(day)) {
      setFormData({ ...formData, daysOfWeek: current.filter((d) => d !== day) });
    } else {
      setFormData({ ...formData, daysOfWeek: [...current, day].sort() });
    }
  };

  const getTypeColor = (type: TaskType) => {
    return TYPE_OPTIONS.find((t) => t.value === type)?.color || 'bg-slate-600';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Templates</h1>
          <p className="text-muted-foreground">
            Motor do sistema - Moldes de tarefas recorrentes
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate} variant="default" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* Ações */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Motor de Geração
          </CardTitle>
          <CardDescription>
            Aplica templates e gera tarefas automaticamente para o mês
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" className="w-full">
                  <Calendar className="h-5 w-5 mr-2" />
                  Aplicar Este Mês
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Gerar tarefas para este mês?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso vai gerar tarefas a partir dos templates ativos ({state.templates.filter(t => t.active).length} templates).
                    Tarefas já existentes não serão duplicadas (UPSERT).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApplyCurrentMonth}>
                    Sim, Gerar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" variant="outline" className="w-full">
                  <Calendar className="h-5 w-5 mr-2" />
                  Aplicar Próximo Mês
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Gerar tarefas para o próximo mês?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso vai gerar tarefas do próximo mês a partir dos templates ativos ({state.templates.filter(t => t.active).length} templates).
                    Ideal para planejar com antecedência.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApplyNextMonth}>
                    Sim, Gerar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>{state.templates.length} templates</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>{state.templates.filter(t => t.active).length} ativos</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span>{state.tasks.length} tarefas geradas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Templates */}
      {state.templates.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie templates para gerar tarefas automaticamente
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {state.templates.map((template) => {
            const marketplace = state.marketplaces.find((m) => m.id === template.marketplaceId);
            const owner = state.owners.find((o) => o.id === template.ownerId);

            return (
              <Card key={template.id} className={`border-0 shadow-lg hover:shadow-xl transition-all ${!template.active ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    
                    {/* Time Badge */}
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-xl ${getTypeColor(template.type)} flex flex-col items-center justify-center text-white`}>
                        <Clock className="h-4 w-4 mb-1" />
                        <span className="text-xs font-bold">{template.timeHHMM}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{template.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {marketplace ? marketplace.name : 'Global'} • {owner?.name}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge className={getTypeColor(template.type)}>
                              {template.type}
                            </Badge>
                            {template.severity === 'CRITICA' && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                Crítica
                              </Badge>
                            )}
                            {template.requireEvidence && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Evidência
                              </Badge>
                            )}
                            {!template.active && (
                              <Badge variant="outline">Desativado</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Dias: {template.daysOfWeek.map(d => DAYS_OF_WEEK[d].label).join(', ')}</span>
                            <span>•</span>
                            <span>DoD: {template.DoD.substring(0, 50)}...</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover template?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tarefas já geradas não serão removidas.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(template.id)}>
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Criar/Editar - PARTE 1 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Template' : 'Novo Template'}</DialogTitle>
            <DialogDescription>
              Molde de tarefa recorrente com SOP completo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            
            {/* Básico */}
            <div className="space-y-4">
              <h3 className="font-semibold">Básico</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="ex: Análise de conversão Shein"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Marketplace</Label>
                  <Select value={formData.marketplaceId || 'global'} onValueChange={(v) => setFormData({ ...formData, marketplaceId: v === 'global' ? null : v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global (Todos)</SelectItem>
                      {state.marketplaces.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Owner *</Label>
                  <Select value={formData.ownerId} onValueChange={(v) => setFormData({ ...formData, ownerId: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {state.owners.filter(o => o.active).map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="time">Horário *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.timeHHMM}
                    onChange={(e) => setFormData({ ...formData, timeHHMM: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as TaskType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dias da Semana */}
            <div className="space-y-2">
              <Label>Dias da Semana *</Label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={formData.daysOfWeek?.includes(day.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* DoD */}
            <div className="space-y-2">
              <Label htmlFor="dod">Definition of Done (DoD) *</Label>
              <Textarea
                id="dod"
                placeholder="Critério objetivo de pronto..."
                value={formData.DoD}
                onChange={(e) => setFormData({ ...formData, DoD: e.target.value })}
                rows={2}
              />
            </div>

            {/* SOP */}
            <div className="space-y-2">
              <Label htmlFor="sop">SOP Detalhado (Markdown)</Label>
              <Textarea
                id="sop"
                placeholder="# O que fazer&#10;&#10;- Passo 1...&#10;- Passo 2..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
              />
            </div>

            {/* Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Severidade Crítica?</Label>
                  <p className="text-xs text-muted-foreground">Aparece destacada na rotina</p>
                </div>
                <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v as TaskSeverity })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="evidence">Exigir Evidência?</Label>
                <Switch
                  id="evidence"
                  checked={formData.requireEvidence}
                  onCheckedChange={(v) => setFormData({ ...formData, requireEvidence: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Template Ativo?</Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(v) => setFormData({ ...formData, active: v })}
                />
              </div>
            </div>

            {/* Pontos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pointsDone">Pontos ao Concluir</Label>
                <Input
                  id="pointsDone"
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pointsSkip">Pontos ao Pular</Label>
                <Input
                  id="pointsSkip"
                  type="number"
                  value={formData.penaltyPoints}
                  onChange={(e) => setFormData({ ...formData, penaltyPoints: Number(e.target.value) })}
                />
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? 'Atualizar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
