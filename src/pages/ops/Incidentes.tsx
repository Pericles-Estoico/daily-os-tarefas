import { useState, useMemo } from 'react';
import { useOps } from '@/contexts/OpsContext';
import { Incident, IncidentSeverity, IncidentStatus } from '@/types/marketplace-ops';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, AlertTriangle, Pencil, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function Incidentes() {
  const { state, updateState } = useOps();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterMarketplace, setFilterMarketplace] = useState<string>('all');

  // Form state
  const [formMarketplaceId, setFormMarketplaceId] = useState('');
  const [formOwnerId, setFormOwnerId] = useState('');
  const [formSeverity, setFormSeverity] = useState<IncidentSeverity>('MEDIA');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEvidenceLinks, setFormEvidenceLinks] = useState('');
  const [formRootCause, setFormRootCause] = useState('');
  const [formCorrectiveAction, setFormCorrectiveAction] = useState('');
  const [formValidationTests, setFormValidationTests] = useState<string>('');
  const [formStatus, setFormStatus] = useState<IncidentStatus>('A_FAZER');
  const [formDueDate, setFormDueDate] = useState('');

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return state.incidents.filter(incident => {
      const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
      const matchesSeverity = filterSeverity === 'all' || incident.severity === filterSeverity;
      const matchesMarketplace = filterMarketplace === 'all' || incident.marketplaceId === filterMarketplace;
      return matchesStatus && matchesSeverity && matchesMarketplace;
    }).sort((a, b) => {
      // Sort by status (A_FAZER first), then by severity (CRITICA first), then by date
      if (a.status !== b.status) {
        const statusOrder = { A_FAZER: 0, EM_PROGRESSO: 1, RESOLVIDO: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      if (a.severity !== b.severity) {
        const severityOrder = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [state.incidents, filterStatus, filterSeverity, filterMarketplace]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: state.incidents.length,
      aFazer: state.incidents.filter(i => i.status === 'A_FAZER').length,
      emProgresso: state.incidents.filter(i => i.status === 'EM_PROGRESSO').length,
      resolvido: state.incidents.filter(i => i.status === 'RESOLVIDO').length,
      critica: state.incidents.filter(i => i.severity === 'CRITICA' && i.status !== 'RESOLVIDO').length,
    };
  }, [state.incidents]);

  const openCreateDialog = () => {
    setEditingIncident(null);
    setFormMarketplaceId('');
    setFormOwnerId(state.settings.currentOwnerId);
    setFormSeverity('MEDIA');
    setFormTitle('');
    setFormDescription('');
    setFormEvidenceLinks('');
    setFormRootCause('');
    setFormCorrectiveAction('');
    setFormValidationTests('');
    setFormStatus('A_FAZER');
    setFormDueDate('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (incident: Incident) => {
    setEditingIncident(incident);
    setFormMarketplaceId(incident.marketplaceId);
    setFormOwnerId(incident.ownerId);
    setFormSeverity(incident.severity);
    setFormTitle(incident.title);
    setFormDescription(incident.description);
    setFormEvidenceLinks(incident.evidenceLinks.join('\n'));
    setFormRootCause(incident.rootCause);
    setFormCorrectiveAction(incident.correctiveAction);
    setFormValidationTests(incident.validationTests.map(t => t.label).join('\n'));
    setFormStatus(incident.status);
    setFormDueDate(incident.dueDate || '');
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formTitle.trim() || !formMarketplaceId) {
      toast.error('Título e Marketplace são obrigatórios');
      return;
    }

    const evidenceLinks = formEvidenceLinks
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    const validationTests = formValidationTests
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(label => ({ label, done: false }));

    const incidentData: Incident = {
      id: editingIncident?.id || `inc-${Date.now()}`,
      createdAt: editingIncident?.createdAt || new Date().toISOString(),
      marketplaceId: formMarketplaceId,
      ownerId: formOwnerId,
      severity: formSeverity,
      title: formTitle.trim(),
      description: formDescription.trim(),
      evidenceLinks,
      rootCause: formRootCause.trim(),
      correctiveAction: formCorrectiveAction.trim(),
      validationTests: editingIncident ? editingIncident.validationTests : validationTests,
      status: formStatus,
      dueDate: formDueDate || null,
      autoCreated: editingIncident?.autoCreated || false,
    };

    updateState((prev) => {
      if (editingIncident) {
        const incidents = prev.incidents.map(i =>
          i.id === editingIncident.id ? incidentData : i
        );
        toast.success('Incidente atualizado!');
        return { ...prev, incidents };
      } else {
        toast.success('Incidente criado!');
        return { ...prev, incidents: [...prev.incidents, incidentData] };
      }
    });

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este incidente?')) return;

    updateState((prev) => ({
      ...prev,
      incidents: prev.incidents.filter(i => i.id !== id),
    }));

    toast.success('Incidente excluído!');
  };

  const toggleValidationTest = (incidentId: string, testIndex: number) => {
    updateState((prev) => ({
      ...prev,
      incidents: prev.incidents.map(incident => {
        if (incident.id === incidentId) {
          const validationTests = [...incident.validationTests];
          validationTests[testIndex] = {
            ...validationTests[testIndex],
            done: !validationTests[testIndex].done,
          };
          return { ...incident, validationTests };
        }
        return incident;
      }),
    }));
  };

  const getSeverityBadge = (severity: IncidentSeverity) => {
    const config = {
      CRITICA: { color: 'bg-red-500', icon: AlertTriangle },
      ALTA: { color: 'bg-orange-500', icon: AlertCircle },
      MEDIA: { color: 'bg-yellow-500', icon: AlertCircle },
      BAIXA: { color: 'bg-blue-500', icon: AlertCircle },
    };
    const { color, icon: Icon } = config[severity];
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {severity}
      </Badge>
    );
  };

  const getStatusBadge = (status: IncidentStatus) => {
    const config = {
      A_FAZER: { color: 'bg-gray-500', icon: Clock, label: 'A Fazer' },
      EM_PROGRESSO: { color: 'bg-blue-500', icon: AlertCircle, label: 'Em Progresso' },
      RESOLVIDO: { color: 'bg-green-500', icon: CheckCircle, label: 'Resolvido' },
    };
    const { color, icon: Icon, label } = config[status];
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8" />
            Incidentes
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro e acompanhamento de problemas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Incidente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIncident ? 'Editar Incidente' : 'Novo Incidente'}
              </DialogTitle>
              <DialogDescription>
                Registre e acompanhe problemas operacionais
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="marketplace">Marketplace *</Label>
                  <Select value={formMarketplaceId} onValueChange={setFormMarketplaceId}>
                    <SelectTrigger id="marketplace">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {state.marketplaces.filter(m => m.active).map(mp => (
                        <SelectItem key={mp.id} value={mp.id}>
                          {mp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="owner">Responsável</Label>
                  <Select value={formOwnerId} onValueChange={setFormOwnerId}>
                    <SelectTrigger id="owner">
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="severity">Severidade</Label>
                  <Select value={formSeverity} onValueChange={(v) => setFormSeverity(v as IncidentSeverity)}>
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRITICA">CRÍTICA</SelectItem>
                      <SelectItem value="ALTA">ALTA</SelectItem>
                      <SelectItem value="MEDIA">MÉDIA</SelectItem>
                      <SelectItem value="BAIXA">BAIXA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formStatus} onValueChange={(v) => setFormStatus(v as IncidentStatus)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A_FAZER">A Fazer</SelectItem>
                      <SelectItem value="EM_PROGRESSO">Em Progresso</SelectItem>
                      <SelectItem value="RESOLVIDO">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Data Limite</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Descreva o problema brevemente"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descreva o incidente em detalhes..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="evidenceLinks">Links de Evidência (um por linha)</Label>
                <Textarea
                  id="evidenceLinks"
                  value={formEvidenceLinks}
                  onChange={(e) => setFormEvidenceLinks(e.target.value)}
                  placeholder="https://exemplo.com/screenshot1&#10;https://exemplo.com/screenshot2"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="rootCause">Causa Raiz</Label>
                <Textarea
                  id="rootCause"
                  value={formRootCause}
                  onChange={(e) => setFormRootCause(e.target.value)}
                  placeholder="O que causou este problema?"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="correctiveAction">Ação Corretiva</Label>
                <Textarea
                  id="correctiveAction"
                  value={formCorrectiveAction}
                  onChange={(e) => setFormCorrectiveAction(e.target.value)}
                  placeholder="Como foi/será resolvido?"
                  rows={2}
                />
              </div>

              {!editingIncident && (
                <div>
                  <Label htmlFor="validationTests">Testes de Validação (um por linha)</Label>
                  <Textarea
                    id="validationTests"
                    value={formValidationTests}
                    onChange={(e) => setFormValidationTests(e.target.value)}
                    placeholder="Teste 1: Verificar se...&#10;Teste 2: Validar que..."
                    rows={2}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingIncident ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">A Fazer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.aFazer}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.emProgresso}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolvido}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Críticos Abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critica}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filterStatus">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filterStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="A_FAZER">A Fazer</SelectItem>
                  <SelectItem value="EM_PROGRESSO">Em Progresso</SelectItem>
                  <SelectItem value="RESOLVIDO">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterSeverity">Severidade</Label>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger id="filterSeverity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="CRITICA">Crítica</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="MEDIA">Média</SelectItem>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterMarketplace">Marketplace</Label>
              <Select value={filterMarketplace} onValueChange={setFilterMarketplace}>
                <SelectTrigger id="filterMarketplace">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {state.marketplaces.map(mp => (
                    <SelectItem key={mp.id} value={mp.id}>{mp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum incidente encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredIncidents.map((incident) => {
            const marketplace = state.marketplaces.find(m => m.id === incident.marketplaceId);
            const owner = state.owners.find(o => o.id === incident.ownerId);
            const allTestsDone = incident.validationTests.length > 0 && 
              incident.validationTests.every(t => t.done);
            
            return (
              <Card key={incident.id} className={incident.severity === 'CRITICA' ? 'border-red-500' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 flex-wrap">
                        {incident.title}
                        {incident.autoCreated && (
                          <Badge variant="outline" className="text-xs">Auto</Badge>
                        )}
                      </CardTitle>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {getSeverityBadge(incident.severity)}
                        {getStatusBadge(incident.status)}
                        <Badge variant="outline">{marketplace?.name}</Badge>
                        <Badge variant="outline">{owner?.name}</Badge>
                        {incident.dueDate && (
                          <Badge variant="outline">
                            Prazo: {new Date(incident.dueDate).toLocaleDateString('pt-BR')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(incident)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(incident.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {incident.description && (
                    <div>
                      <p className="text-sm font-semibold">Descrição:</p>
                      <p className="text-sm text-muted-foreground">{incident.description}</p>
                    </div>
                  )}
                  
                  {incident.rootCause && (
                    <div>
                      <p className="text-sm font-semibold">Causa Raiz:</p>
                      <p className="text-sm text-muted-foreground">{incident.rootCause}</p>
                    </div>
                  )}
                  
                  {incident.correctiveAction && (
                    <div>
                      <p className="text-sm font-semibold">Ação Corretiva:</p>
                      <p className="text-sm text-muted-foreground">{incident.correctiveAction}</p>
                    </div>
                  )}
                  
                  {incident.validationTests.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">
                        Testes de Validação:
                        {allTestsDone && (
                          <CheckCircle className="inline h-4 w-4 ml-2 text-green-600" />
                        )}
                      </p>
                      <div className="space-y-1">
                        {incident.validationTests.map((test, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Checkbox
                              checked={test.done}
                              onCheckedChange={() => toggleValidationTest(incident.id, idx)}
                            />
                            <span className={`text-sm ${test.done ? 'line-through text-muted-foreground' : ''}`}>
                              {test.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {incident.evidenceLinks.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold">Evidências:</p>
                      <div className="flex flex-wrap gap-2">
                        {incident.evidenceLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Link {idx + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Criado em: {new Date(incident.createdAt).toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
