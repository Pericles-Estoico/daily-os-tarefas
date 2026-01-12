import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { SemaforoBadge } from '@/components/ui/semaforo-badge';
import {
  AlertTriangle,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Lightbulb,
} from 'lucide-react';
import type { Incident, Priority, TaskStatus } from '@/types';

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  normal: { label: 'Normal', color: 'bg-muted text-muted-foreground' },
  high: { label: 'Alta', color: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]' },
  urgent: { label: 'Urgente', color: 'bg-destructive/10 text-destructive' },
};

const statusConfig: Record<TaskStatus, { label: string; icon: React.ElementType }> = {
  todo: { label: 'A Fazer', icon: Clock },
  doing: { label: 'Em Progresso', icon: AlertTriangle },
  done: { label: 'Resolvido', icon: CheckCircle2 },
  blocked: { label: 'Bloqueado', icon: XCircle },
};

export default function Incidentes() {
  const incidents = useStore((state) => state.incidents);
  const sectors = useStore((state) => state.sectors);
  const owners = useStore((state) => state.owners);
  const addIncident = useStore((state) => state.addIncident);
  const updateIncident = useStore((state) => state.updateIncident);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New incident form
  const [newIncident, setNewIncident] = useState({
    titulo: '',
    sectorId: '',
    ownerId: '',
    descricao: '',
    evidencia: '',
    causaRaiz: '',
    acaoCorretiva: '',
    prazo: '',
    prioridade: 'high' as Priority,
  });

  const getSectorName = (sectorId: string) => {
    return sectors.find((s) => s.id === sectorId)?.nome || 'Desconhecido';
  };

  const getOwnerName = (ownerId: string) => {
    return owners.find((o) => o.id === ownerId)?.nome || 'Desconhecido';
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.titulo.toLowerCase().includes(search.toLowerCase()) ||
      incident.descricao.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || incident.prioridade === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const openIncidents = incidents.filter((i) => i.status !== 'done');
  const urgentCount = openIncidents.filter((i) => i.prioridade === 'urgent').length;

  const handleCreateIncident = () => {
    const incident: Incident = {
      id: crypto.randomUUID(),
      ...newIncident,
      status: 'todo',
      validacao: [
        { id: 'v1', text: 'Teste 1: Verificar correção aplicada', checked: false },
        { id: 'v2', text: 'Teste 2: Monitorar por 24h', checked: false },
        { id: 'v3', text: 'Teste 3: Validar com usuário/cliente', checked: false },
      ],
      createdAt: new Date().toISOString(),
    };
    addIncident(incident);
    setIsCreateOpen(false);
    setNewIncident({
      titulo: '',
      sectorId: '',
      ownerId: '',
      descricao: '',
      evidencia: '',
      causaRaiz: '',
      acaoCorretiva: '',
      prazo: '',
      prioridade: 'high',
    });
  };

  const handleValidationToggle = (incidentId: string, validationId: string, checked: boolean) => {
    const incident = incidents.find((i) => i.id === incidentId);
    if (incident) {
      const updatedValidacao = incident.validacao.map((v) =>
        v.id === validationId ? { ...v, checked } : v
      );
      updateIncident(incidentId, { validacao: updatedValidacao });

      // Auto-complete if all validations checked
      if (updatedValidacao.every((v) => v.checked)) {
        updateIncident(incidentId, { status: 'done' });
      }
    }
  };

  const suggestedCorrections = [
    'Reverter para versão anterior + fix urgente',
    'Pausar campanha/processo e investigar',
    'Escalar para owner do setor imediatamente',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Incidentes (Pedras)
          </h1>
          <p className="text-muted-foreground">
            {openIncidents.length} abertos • {urgentCount} urgentes
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Novo Incidente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Incidente</DialogTitle>
              <DialogDescription>
                Registre um problema que impacta a operação
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={newIncident.titulo}
                  onChange={(e) => setNewIncident({ ...newIncident, titulo: e.target.value })}
                  placeholder="Ex: Checkout travando no mobile"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Setor *</Label>
                  <Select
                    value={newIncident.sectorId}
                    onValueChange={(v) => setNewIncident({ ...newIncident, sectorId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Owner *</Label>
                  <Select
                    value={newIncident.ownerId}
                    onValueChange={(v) => setNewIncident({ ...newIncident, ownerId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prioridade *</Label>
                  <Select
                    value={newIncident.prioridade}
                    onValueChange={(v) => setNewIncident({ ...newIncident, prioridade: v as Priority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prazo</Label>
                  <Input
                    type="date"
                    value={newIncident.prazo}
                    onChange={(e) => setNewIncident({ ...newIncident, prazo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={newIncident.descricao}
                  onChange={(e) => setNewIncident({ ...newIncident, descricao: e.target.value })}
                  placeholder="Descreva o problema em detalhes..."
                />
              </div>

              <div>
                <Label>Evidência</Label>
                <Input
                  value={newIncident.evidencia}
                  onChange={(e) => setNewIncident({ ...newIncident, evidencia: e.target.value })}
                  placeholder="Link do screenshot ou documento"
                />
              </div>

              <div>
                <Label>Causa Raiz</Label>
                <Textarea
                  value={newIncident.causaRaiz}
                  onChange={(e) => setNewIncident({ ...newIncident, causaRaiz: e.target.value })}
                  placeholder="Qual a causa raiz do problema?"
                />
              </div>

              <div>
                <Label>Ação Corretiva</Label>
                <Textarea
                  value={newIncident.acaoCorretiva}
                  onChange={(e) => setNewIncident({ ...newIncident, acaoCorretiva: e.target.value })}
                  placeholder="O que será feito para corrigir?"
                />
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    Sugestões:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {suggestedCorrections.map((sug, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent text-xs"
                        onClick={() =>
                          setNewIncident({ ...newIncident, acaoCorretiva: sug })
                        }
                      >
                        {sug}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateIncident}
                disabled={!newIncident.titulo || !newIncident.sectorId || !newIncident.ownerId}
              >
                Criar Incidente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar incidente..."
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
            <SelectItem value="doing">Em Progresso</SelectItem>
            <SelectItem value="done">Resolvido</SelectItem>
            <SelectItem value="blocked">Bloqueado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Prioridades</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-[hsl(var(--success))] mb-4" />
              <h3 className="text-lg font-medium">Nenhum incidente encontrado</h3>
              <p className="text-muted-foreground">
                {incidents.length === 0
                  ? 'Crie um incidente quando identificar um problema'
                  : 'Ajuste os filtros para ver mais resultados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredIncidents.map((incident) => {
            const StatusIcon = statusConfig[incident.status].icon;
            const validationProgress =
              (incident.validacao.filter((v) => v.checked).length / incident.validacao.length) * 100;

            return (
              <Card
                key={incident.id}
                className={`cursor-pointer hover:border-primary/50 transition-colors ${
                  incident.prioridade === 'urgent' ? 'border-destructive/50' : ''
                }`}
                onClick={() => setSelectedIncident(incident)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <SemaforoBadge
                      status={
                        incident.prioridade === 'urgent'
                          ? 'vermelho'
                          : incident.prioridade === 'high'
                          ? 'amarelo'
                          : 'verde'
                      }
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{incident.titulo}</h3>
                        <Badge className={priorityConfig[incident.prioridade].color}>
                          {priorityConfig[incident.prioridade].label}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[incident.status].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{getSectorName(incident.sectorId)}</span>
                        <span>•</span>
                        <span>Owner: {getOwnerName(incident.ownerId)}</span>
                        {incident.prazo && (
                          <>
                            <span>•</span>
                            <span>Prazo: {new Date(incident.prazo).toLocaleDateString('pt-BR')}</span>
                          </>
                        )}
                      </div>
                      {incident.descricao && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {incident.descricao}
                        </p>
                      )}

                      {/* Validation Progress */}
                      {incident.status !== 'done' && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Validação:</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-32">
                            <div
                              className="h-full bg-[hsl(var(--success))] transition-all"
                              style={{ width: `${validationProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {incident.validacao.filter((v) => v.checked).length}/
                            {incident.validacao.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Incident Detail Dialog */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedIncident && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <SemaforoBadge
                    status={
                      selectedIncident.prioridade === 'urgent'
                        ? 'vermelho'
                        : selectedIncident.prioridade === 'high'
                        ? 'amarelo'
                        : 'verde'
                    }
                  />
                  <Badge className={priorityConfig[selectedIncident.prioridade].color}>
                    {priorityConfig[selectedIncident.prioridade].label}
                  </Badge>
                </div>
                <DialogTitle>{selectedIncident.titulo}</DialogTitle>
                <DialogDescription>
                  {getSectorName(selectedIncident.sectorId)} • Owner:{' '}
                  {getOwnerName(selectedIncident.ownerId)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selectedIncident.descricao && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Descrição</Label>
                    <p className="text-sm mt-1">{selectedIncident.descricao}</p>
                  </div>
                )}

                {selectedIncident.evidencia && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Evidência</Label>
                    <p className="text-sm mt-1 text-primary">{selectedIncident.evidencia}</p>
                  </div>
                )}

                {selectedIncident.causaRaiz && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Causa Raiz</Label>
                    <p className="text-sm mt-1">{selectedIncident.causaRaiz}</p>
                  </div>
                )}

                {selectedIncident.acaoCorretiva && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Ação Corretiva</Label>
                    <p className="text-sm mt-1">{selectedIncident.acaoCorretiva}</p>
                  </div>
                )}

                {/* Validation Checklist */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">
                    Validação (3 Testes)
                  </Label>
                  <div className="space-y-2 mt-2">
                    {selectedIncident.validacao.map((v) => (
                      <div key={v.id} className="flex items-center gap-2">
                        <Checkbox
                          id={v.id}
                          checked={v.checked}
                          onCheckedChange={(checked) =>
                            handleValidationToggle(selectedIncident.id, v.id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={v.id}
                          className={`text-sm ${v.checked ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {v.text}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Status</Label>
                  <Select
                    value={selectedIncident.status}
                    onValueChange={(v) => {
                      updateIncident(selectedIncident.id, { status: v as TaskStatus });
                      setSelectedIncident({ ...selectedIncident, status: v as TaskStatus });
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">A Fazer</SelectItem>
                      <SelectItem value="doing">Em Progresso</SelectItem>
                      <SelectItem value="done">Resolvido</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedIncident(null)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
