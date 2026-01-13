import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Clock, Search, CheckCircle2, Plus, User, Calendar, AlertTriangle } from 'lucide-react';
import { format, endOfMonth, isLastDayOfMonth, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { RoutineTask } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const STORAGE_KEY = 'rotina-owner-filter';

interface OwnerFilterState {
  selectedOwnerId: string;
  onlyMine: boolean;
}

export default function Rotina() {
  const routineTasks = useStore((state) => state.routineTasks);
  const marketplaces = useStore((state) => state.marketplaces);
  const owners = useStore((state) => state.owners);
  const config = useStore((state) => state.config);
  const taskTemplates = useStore((state) => state.taskTemplates);
  const lastMonthGenerated = useStore((state) => state.lastMonthGenerated);
  const completeRoutineTask = useStore((state) => state.completeRoutineTask);
  const skipRoutineTask = useStore((state) => state.skipRoutineTask);
  const generateMonthTasks = useStore((state) => state.generateMonthTasks);
  const setLastMonthGenerated = useStore((state) => state.setLastMonthGenerated);

  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState<RoutineTask | null>(null);
  const [evidencia, setEvidencia] = useState('');
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [monthToGenerate, setMonthToGenerate] = useState<string>('');
  
  // Filtros persistidos
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilterState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { selectedOwnerId: 'all', onlyMine: false };
      }
    }
    return { selectedOwnerId: 'all', onlyMine: false };
  });

  // Persistir filtros no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ownerFilter));
  }, [ownerFilter]);

  // Check if it's the last day of the month and show modal
  useEffect(() => {
    const today = new Date();
    if (isLastDayOfMonth(today)) {
      const nextMonth = addMonths(today, 1);
      const nextMonthKey = format(nextMonth, 'yyyy-MM');
      if (lastMonthGenerated !== nextMonthKey) {
        setMonthToGenerate(nextMonthKey);
        setShowMonthModal(true);
      }
    }
  }, [lastMonthGenerated]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonthKey = format(new Date(), 'yyyy-MM');
  
  // Find CEO owner for global tasks visibility
  const ceoOwner = owners.find(o => o.cargo === 'CEO');

  const todayTasks = useMemo(() => {
    let tasks = routineTasks.filter((t) => t.date === today).sort((a, b) => a.time.localeCompare(b.time));
    
    // Apply "Modo Usuário" restriction
    if (config.restrictViewToCurrentUser && config.currentUserId) {
      tasks = tasks.filter((t) => {
        // User's own tasks
        if (t.ownerId === config.currentUserId) return true;
        
        // Global tasks (no marketplace)
        if (t.marketplaceId === null) {
          if (config.globalTasksVisibleTo === 'ALL') return true;
          if (config.globalTasksVisibleTo === 'CEO' && ceoOwner?.id === config.currentUserId) return true;
          return false;
        }
        
        return false;
      });
    }
    
    return tasks;
  }, [routineTasks, today, config, ceoOwner]);
  
  // Aplicar filtros adicionais (busca e filtro manual)
  const filteredTasks = todayTasks.filter((t) => {
    // Filtro de busca
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    // Filtro "Só minhas" (quando modo usuário está desativado)
    if (!config.restrictViewToCurrentUser && ownerFilter.onlyMine && config.currentUserId) {
      if (t.ownerId !== config.currentUserId) {
        return false;
      }
    }
    
    // Filtro por dono específico (quando modo usuário está desativado)
    if (!config.restrictViewToCurrentUser && ownerFilter.selectedOwnerId !== 'all' && !ownerFilter.onlyMine) {
      if (t.ownerId !== ownerFilter.selectedOwnerId) {
        return false;
      }
    }
    
    return true;
  });
  
  const completedCount = todayTasks.filter((t) => t.status === 'DONE').length;

  const getMarketplaceName = (id: string | null) => id ? marketplaces.find((m) => m.id === id)?.name || 'Global' : 'Global';
  
  const getOwner = (ownerId: string) => owners.find((o) => o.id === ownerId);
  
  const getOwnerInitials = (nome: string) => {
    const parts = nome.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  const handleComplete = () => {
    if (selectedTask) {
      if (selectedTask.evidenceRequired && !evidencia.trim()) return;
      completeRoutineTask(selectedTask.id, evidencia ? [evidencia] : [], config.currentUserId || owners[0]?.id || '');
      setSelectedTask(null);
      setEvidencia('');
    }
  };

  const handleSkip = () => {
    if (selectedTask) {
      skipRoutineTask(selectedTask.id, 'Pulada manualmente');
      setSelectedTask(null);
    }
  };

  const handleOwnerFilterChange = (value: string) => {
    setOwnerFilter(prev => ({ ...prev, selectedOwnerId: value, onlyMine: false }));
  };

  const handleOnlyMineChange = (checked: boolean) => {
    setOwnerFilter(prev => ({ ...prev, onlyMine: checked }));
  };

  const handleGenerateMonth = (monthKey: string) => {
    generateMonthTasks(monthKey);
    setShowMonthModal(false);
  };

  const handleGenerateCurrentMonth = () => {
    generateMonthTasks(currentMonthKey);
  };

  const handleAdvanceMonth = () => {
    const nextMonth = addMonths(new Date(), 1);
    const nextMonthKey = format(nextMonth, 'yyyy-MM');
    generateMonthTasks(nextMonthKey);
    setShowMonthModal(false);
  };

  const handleSkipMonthGeneration = () => {
    setLastMonthGenerated(monthToGenerate);
    setShowMonthModal(false);
  };

  const currentUser = config.currentUserId ? getOwner(config.currentUserId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rotina Diária</h1>
          <p className="text-muted-foreground">{completedCount} de {todayTasks.length} tarefas concluídas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateCurrentMonth} disabled={taskTemplates.length === 0}>
            <Calendar className="h-4 w-4 mr-1" />
            Aplicar para este mês
          </Button>
          <Button><Plus className="h-4 w-4 mr-1" />Nova Tarefa</Button>
        </div>
      </div>

      {/* Aviso de visão restrita */}
      {config.restrictViewToCurrentUser && currentUser && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span>
            Visão restrita ativa: exibindo apenas tarefas de <strong>{currentUser.nome}</strong>
            {config.globalTasksVisibleTo === 'CEO' && ceoOwner?.id === config.currentUserId && (
              <span className="text-muted-foreground"> + tarefas globais (CEO)</span>
            )}
          </span>
        </div>
      )}

      {/* Filtros (só aparecem quando modo usuário está desativado) */}
      {!config.restrictViewToCurrentUser && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar tarefa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Dono:</Label>
            <Select value={ownerFilter.selectedOwnerId} onValueChange={handleOwnerFilterChange} disabled={ownerFilter.onlyMine}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: owner.avatarColor }} />
                      {owner.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch 
              id="only-mine" 
              checked={ownerFilter.onlyMine} 
              onCheckedChange={handleOnlyMineChange}
              disabled={!config.currentUserId}
            />
            <Label htmlFor="only-mine" className="text-sm whitespace-nowrap flex items-center gap-1">
              Só minhas
              {currentUser && (
                <span className="text-muted-foreground">({currentUser.nome})</span>
              )}
            </Label>
          </div>
        </div>
      )}

      {/* Busca quando modo usuário está ativo */}
      {config.restrictViewToCurrentUser && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar tarefa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      )}

      {/* Aviso se não há usuário configurado */}
      {!config.currentUserId && (
        <div className="bg-muted/50 border border-border rounded-lg p-3 text-sm text-muted-foreground">
          <User className="h-4 w-4 inline mr-2" />
          Configure o "Usuário atual" em <strong>Configurações</strong> para usar o modo de visão restrita.
        </div>
      )}

      {/* Aviso se não há templates */}
      {taskTemplates.length === 0 && (
        <div className="bg-muted/50 border border-border rounded-lg p-3 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          Nenhum template de tarefa configurado. Carregue dados de demo ou crie templates para usar a geração mensal.
        </div>
      )}

      {/* Lista de tarefas */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma tarefa encontrada para hoje.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const owner = getOwner(task.ownerId);
            return (
              <Card key={task.id} className={`cursor-pointer hover:border-primary/50 ${task.critical ? 'border-destructive/30' : ''}`} onClick={() => setSelectedTask(task)}>
                <CardContent className="p-3 flex items-center gap-4">
                  <span className="font-mono text-sm text-muted-foreground w-12">{task.time}</span>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center ${task.status === 'DONE' ? 'bg-green-500/20' : 'bg-muted'}`}>
                    {task.status === 'DONE' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {getMarketplaceName(task.marketplaceId)}
                      {owner && (
                        <span className="ml-1">· Dono: {owner.nome}</span>
                      )}
                    </p>
                  </div>
                  {owner && (
                    <Avatar className="h-7 w-7">
                      <AvatarFallback style={{ backgroundColor: owner.avatarColor, color: 'white', fontSize: '10px' }}>
                        {getOwnerInitials(owner.nome)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {task.critical && <Badge variant="destructive">Crítica</Badge>}
                  <Badge variant="outline">{task.status}</Badge>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">{selectedTask.time}</span>
                  {selectedTask.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label>Dono:</Label>
                  {(() => {
                    const owner = getOwner(selectedTask.ownerId);
                    return owner ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback style={{ backgroundColor: owner.avatarColor, color: 'white', fontSize: '10px' }}>
                            {getOwnerInitials(owner.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{owner.nome} ({owner.cargo})</span>
                      </div>
                    ) : <span className="text-sm text-muted-foreground">Não definido</span>;
                  })()}
                </div>
                <div><Label>DoD (Critério de Pronto)</Label><p className="text-sm text-muted-foreground mt-1">{selectedTask.dod}</p></div>
                {selectedTask.status !== 'DONE' && (
                  <div>
                    <Label>Evidência {selectedTask.evidenceRequired && <span className="text-destructive">*</span>}</Label>
                    <Textarea placeholder="Cole o link da evidência..." value={evidencia} onChange={(e) => setEvidencia(e.target.value)} className="mt-1" />
                  </div>
                )}
              </div>
              <DialogFooter>
                {selectedTask.status !== 'DONE' && (
                  <>
                    <Button variant="outline" onClick={handleSkip}>Pular</Button>
                    <Button onClick={handleComplete} disabled={selectedTask.evidenceRequired && !evidencia.trim()}>Concluir</Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Monthly Generation Modal */}
      <Dialog open={showMonthModal} onOpenChange={setShowMonthModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Gerar rotinas do próximo mês?
            </DialogTitle>
            <DialogDescription>
              É o último dia do mês! Deseja gerar as tarefas de rotina para {monthToGenerate ? format(new Date(monthToGenerate + '-01'), 'MMMM yyyy', { locale: ptBR }) : ''}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            <p>Serão geradas tarefas para todos os dias úteis (seg-sex) baseado nos {taskTemplates.filter(t => t.isActive).length} templates ativos.</p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleSkipMonthGeneration}>
              Não
            </Button>
            <Button variant="outline" onClick={handleAdvanceMonth}>
              Adiantar (gerar agora)
            </Button>
            <Button onClick={() => handleGenerateMonth(monthToGenerate)}>
              Sim, gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}