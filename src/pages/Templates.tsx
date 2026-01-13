import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, Plus, Calendar, Clock, Edit2, Trash2, Play, AlertTriangle, 
  Copy, CheckCircle2, User
} from 'lucide-react';
import { format, addMonths, getDaysInMonth, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { TaskTemplate, TaskType, WeekDay } from '@/types';

const WEEK_DAYS: { value: WeekDay; label: string }[] = [
  { value: 'seg', label: 'Seg' },
  { value: 'ter', label: 'Ter' },
  { value: 'qua', label: 'Qua' },
  { value: 'qui', label: 'Qui' },
  { value: 'sex', label: 'Sex' },
];

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'HIGIENE', label: 'Higiene' },
  { value: 'PROTECAO', label: 'Proteção' },
  { value: 'CRESCIMENTO', label: 'Crescimento' },
  { value: 'SETUP', label: 'Setup' },
  { value: 'ATIVACAO', label: 'Ativação' },
  { value: 'WEEKLY', label: 'Semanal' },
];

export default function Templates() {
  const taskTemplates = useStore((state) => state.taskTemplates);
  const marketplaces = useStore((state) => state.marketplaces);
  const owners = useStore((state) => state.owners);
  const config = useStore((state) => state.config);
  const addTaskTemplate = useStore((state) => state.addTaskTemplate);
  const updateTaskTemplate = useStore((state) => state.updateTaskTemplate);
  const deleteTaskTemplate = useStore((state) => state.deleteTaskTemplate);
  const generateMonthTasks = useStore((state) => state.generateMonthTasks);
  const routineTasks = useStore((state) => state.routineTasks);

  const [search, setSearch] = useState('');
  const [editTemplate, setEditTemplate] = useState<TaskTemplate | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Find CEO for global tasks visibility
  const ceoOwner = owners.find(o => o.cargo === 'CEO');

  // Filter templates based on user mode
  const visibleTemplates = useMemo(() => {
    let templates = taskTemplates;
    
    if (config.restrictViewToCurrentUser && config.currentUserId) {
      templates = templates.filter((t) => {
        if (t.ownerId === config.currentUserId) return true;
        if (t.marketplaceId === null) {
          if (config.globalTasksVisibleTo === 'ALL') return true;
          if (config.globalTasksVisibleTo === 'CEO' && ceoOwner?.id === config.currentUserId) return true;
          return false;
        }
        return false;
      });
    }
    
    return templates;
  }, [taskTemplates, config, ceoOwner]);

  const filteredTemplates = visibleTemplates.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const activeTemplates = filteredTemplates.filter((t) => t.isActive);
  const inactiveTemplates = filteredTemplates.filter((t) => !t.isActive);

  const getMarketplaceName = (id: string | null) =>
    id ? marketplaces.find((m) => m.id === id)?.name || 'Global' : 'Global';

  const getOwner = (ownerId: string) => owners.find((o) => o.id === ownerId);

  const getOwnerInitials = (nome: string) => {
    const parts = nome.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  // Calculate how many instances will be generated
  const countInstancesForMonth = (template: TaskTemplate, monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    
    const weekDayMap: Record<number, WeekDay> = {
      1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex'
    };
    
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = getDay(date);
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const weekDayStr = weekDayMap[dayOfWeek];
        if (template.weekDays.includes(weekDayStr)) {
          count++;
        }
      }
    }
    return count;
  };

  // Check if month has instances
  const currentMonthKey = format(new Date(), 'yyyy-MM');
  const nextMonthKey = format(addMonths(new Date(), 1), 'yyyy-MM');

  const hasInstancesForMonth = (monthKey: string) => {
    return routineTasks.some((t) => t.date.startsWith(monthKey));
  };

  const handleGenerateMonth = (monthKey: string) => {
    generateMonthTasks(monthKey);
    toast.success(`Tarefas geradas para ${format(new Date(monthKey + '-01'), 'MMMM yyyy', { locale: ptBR })}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir este template?')) {
      deleteTaskTemplate(id);
      toast.success('Template excluído');
    }
  };

  const handleToggleActive = (template: TaskTemplate) => {
    updateTaskTemplate(template.id, { isActive: !template.isActive });
    toast.success(template.isActive ? 'Template desativado' : 'Template ativado');
  };

  // Alert for templates without instances
  const templatesWithoutInstances = activeTemplates.filter((t) => {
    const count = countInstancesForMonth(t, currentMonthKey);
    const existingInstances = routineTasks.filter(
      (r) => r.date.startsWith(currentMonthKey) && r.title === t.title && r.ownerId === t.ownerId
    );
    return count > 0 && existingInstances.length < count;
  });

  const currentUser = config.currentUserId ? getOwner(config.currentUserId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Templates de Rotina
          </h1>
          <p className="text-muted-foreground">
            {activeTemplates.length} ativos • {inactiveTemplates.length} inativos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleGenerateMonth(currentMonthKey)} disabled={hasInstancesForMonth(currentMonthKey) && activeTemplates.length === 0}>
            <Play className="h-4 w-4 mr-1" />
            Aplicar este mês
          </Button>
          <Button variant="outline" onClick={() => handleGenerateMonth(nextMonthKey)}>
            <Calendar className="h-4 w-4 mr-1" />
            Aplicar próximo mês
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* User mode warning */}
      {config.restrictViewToCurrentUser && currentUser && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span>
            Visão restrita ativa: exibindo apenas templates de <strong>{currentUser.nome}</strong>
          </span>
        </div>
      )}

      {/* Alert for missing instances */}
      {templatesWithoutInstances.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div className="flex-1">
              <p className="font-medium">
                {templatesWithoutInstances.length} template(s) ativos sem instâncias para este mês
              </p>
              <p className="text-sm text-muted-foreground">
                Clique em "Aplicar este mês" para gerar as tarefas.
              </p>
            </div>
            <Button size="sm" onClick={() => handleGenerateMonth(currentMonthKey)}>
              Gerar agora
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Active templates */}
      {activeTemplates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-primary">Templates Ativos</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activeTemplates.map((template) => {
              const owner = getOwner(template.ownerId);
              const instancesThisMonth = countInstancesForMonth(template, currentMonthKey);
              return (
                <Card key={template.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{template.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {getMarketplaceName(template.marketplaceId)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {template.time}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {owner && (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback style={{ backgroundColor: owner.avatarColor, color: 'white', fontSize: '8px' }}>
                              {getOwnerInitials(owner.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{owner.nome}</span>
                        </div>
                      )}
                      {template.critical && <Badge variant="destructive" className="text-xs">Crítica</Badge>}
                      <Badge variant="secondary" className="text-xs">{template.type}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {WEEK_DAYS.map((day) => (
                        <Badge
                          key={day.value}
                          variant={template.weekDays.includes(day.value) ? 'default' : 'outline'}
                          className="text-xs px-1.5"
                        >
                          {day.label}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {instancesThisMonth} instâncias em {format(new Date(), 'MMMM', { locale: ptBR })}
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" variant="ghost" className="flex-1" onClick={() => setEditTemplate(template)}>
                        <Edit2 className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleToggleActive(template)}>
                        Desativar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Inactive templates */}
      {inactiveTemplates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Templates Inativos</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {inactiveTemplates.map((template) => {
              const owner = getOwner(template.ownerId);
              return (
                <Card key={template.id} className="opacity-60">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm truncate flex-1">{template.title}</p>
                      <Badge variant="secondary" className="text-xs">Inativo</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{getMarketplaceName(template.marketplaceId)}</p>
                    {owner && (
                      <div className="flex items-center gap-1">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback style={{ backgroundColor: owner.avatarColor, color: 'white', fontSize: '8px' }}>
                            {getOwnerInitials(owner.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{owner.nome}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleToggleActive(template)}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ativar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum template encontrado</p>
          <Button variant="link" onClick={() => setIsCreateOpen(true)}>
            Criar primeiro template
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <TemplateDialog
        open={isCreateOpen || !!editTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditTemplate(null);
          }
        }}
        template={editTemplate}
        owners={owners}
        marketplaces={marketplaces}
        currentUserId={config.currentUserId}
        onSave={(data) => {
          if (editTemplate) {
            updateTaskTemplate(editTemplate.id, data);
            toast.success('Template atualizado');
          } else {
            addTaskTemplate({
              ...data,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            } as TaskTemplate);
            toast.success('Template criado');
          }
          setIsCreateOpen(false);
          setEditTemplate(null);
        }}
      />
    </div>
  );
}

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TaskTemplate | null;
  owners: import('@/types').Owner[];
  marketplaces: import('@/types').Marketplace[];
  currentUserId: string | null;
  onSave: (data: Partial<TaskTemplate>) => void;
}

function TemplateDialog({ open, onOpenChange, template, owners, marketplaces, currentUserId, onSave }: TemplateDialogProps) {
  const [formData, setFormData] = useState<Partial<TaskTemplate>>(() =>
    template || {
      title: '',
      marketplaceId: null,
      ownerId: currentUserId || owners[0]?.id || '',
      time: '09:00',
      type: 'HIGIENE',
      dod: '',
      evidenceRequired: true,
      critical: false,
      points: 1,
      weekDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
      isActive: true,
    }
  );

  // Reset form when template changes
  useState(() => {
    if (template) {
      setFormData(template);
    }
  });

  const handleWeekDayToggle = (day: WeekDay) => {
    const current = formData.weekDays || [];
    if (current.includes(day)) {
      setFormData({ ...formData, weekDays: current.filter((d) => d !== day) });
    } else {
      setFormData({ ...formData, weekDays: [...current, day] });
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.ownerId) {
      toast.error('Preencha título e dono');
      return;
    }
    onSave({
      ...formData,
      points: formData.critical ? 3 : 1,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{template ? 'Editar Template' : 'Novo Template'}</DialogTitle>
          <DialogDescription>
            Templates geram tarefas automaticamente para os dias selecionados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="[CANAL] Tarefa..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marketplace</Label>
              <Select
                value={formData.marketplaceId || 'global'}
                onValueChange={(v) => setFormData({ ...formData, marketplaceId: v === 'global' ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Global" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (sem canal)</SelectItem>
                  {marketplaces.map((mp) => (
                    <SelectItem key={mp.id} value={mp.id}>{mp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dono *</Label>
              <Select
                value={formData.ownerId || ''}
                onValueChange={(v) => setFormData({ ...formData, ownerId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: owner.avatarColor }} />
                        {owner.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input
                type="time"
                value={formData.time || '09:00'}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type || 'HIGIENE'}
                onValueChange={(v) => setFormData({ ...formData, type: v as TaskType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dias da Semana</Label>
            <div className="flex gap-2">
              {WEEK_DAYS.map((day) => (
                <Button
                  key={day.value}
                  type="button"
                  size="sm"
                  variant={(formData.weekDays || []).includes(day.value) ? 'default' : 'outline'}
                  onClick={() => handleWeekDayToggle(day.value)}
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>DoD (Critério de Pronto)</Label>
            <Textarea
              value={formData.dod || ''}
              onChange={(e) => setFormData({ ...formData, dod: e.target.value })}
              placeholder="Descreva o que define a tarefa como concluída..."
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.critical || false}
                onCheckedChange={(c) => setFormData({ ...formData, critical: c, points: c ? 3 : 1 })}
              />
              <Label>Tarefa Crítica</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.evidenceRequired || false}
                onCheckedChange={(c) => setFormData({ ...formData, evidenceRequired: c })}
              />
              <Label>Exige Evidência</Label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.isActive !== false}
              onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
            />
            <Label>Template Ativo</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>{template ? 'Salvar' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
