import { useState, useMemo } from 'react';
import { useOps } from '@/contexts/OpsContext';
import { Test, TestDecision } from '@/types/marketplace-ops';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Beaker, Pencil, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function Testes() {
  const { state, updateState } = useOps();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [filterDecision, setFilterDecision] = useState<string>('all');
  const [filterMarketplace, setFilterMarketplace] = useState<string>('all');

  // Form state
  const [formMarketplaceId, setFormMarketplaceId] = useState('');
  const [formOwnerId, setFormOwnerId] = useState('');
  const [formHypothesis, setFormHypothesis] = useState('');
  const [formChange, setFormChange] = useState('');
  const [formDateStart, setFormDateStart] = useState('');
  const [formDateEnd, setFormDateEnd] = useState('');
  const [formResult, setFormResult] = useState('');
  const [formDecision, setFormDecision] = useState<TestDecision>('PENDENTE');
  const [formNotes, setFormNotes] = useState('');

  // Filtered tests
  const filteredTests = useMemo(() => {
    return state.tests.filter(test => {
      const matchesDecision = filterDecision === 'all' || test.decision === filterDecision;
      const matchesMarketplace = filterMarketplace === 'all' || test.marketplaceId === filterMarketplace;
      return matchesDecision && matchesMarketplace;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.tests, filterDecision, filterMarketplace]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: state.tests.length,
      pendente: state.tests.filter(t => t.decision === 'PENDENTE').length,
      manter: state.tests.filter(t => t.decision === 'MANTER').length,
      matar: state.tests.filter(t => t.decision === 'MATAR').length,
    };
  }, [state.tests]);

  const openCreateDialog = () => {
    setEditingTest(null);
    setFormMarketplaceId('');
    setFormOwnerId(state.settings.currentOwnerId);
    setFormHypothesis('');
    setFormChange('');
    setFormDateStart('');
    setFormDateEnd('');
    setFormResult('');
    setFormDecision('PENDENTE');
    setFormNotes('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (test: Test) => {
    setEditingTest(test);
    setFormMarketplaceId(test.marketplaceId);
    setFormOwnerId(test.ownerId);
    setFormHypothesis(test.hypothesis);
    setFormChange(test.change);
    setFormDateStart(test.dateStart);
    setFormDateEnd(test.dateEnd);
    setFormResult(test.result);
    setFormDecision(test.decision);
    setFormNotes(test.notes);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formHypothesis.trim() || !formMarketplaceId || !formDateStart) {
      toast.error('Hipótese, Marketplace e Data de Início são obrigatórios');
      return;
    }

    const testData: Test = {
      id: editingTest?.id || `test-${Date.now()}`,
      createdAt: editingTest?.createdAt || new Date().toISOString(),
      marketplaceId: formMarketplaceId,
      ownerId: formOwnerId,
      hypothesis: formHypothesis.trim(),
      change: formChange.trim(),
      dateStart: formDateStart,
      dateEnd: formDateEnd,
      result: formResult.trim(),
      decision: formDecision,
      notes: formNotes.trim(),
    };

    updateState((prev) => {
      if (editingTest) {
        const tests = prev.tests.map(t =>
          t.id === editingTest.id ? testData : t
        );
        toast.success('Teste atualizado!');
        return { ...prev, tests };
      } else {
        toast.success('Teste criado!');
        return { ...prev, tests: [...prev.tests, testData] };
      }
    });

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este teste?')) return;

    updateState((prev) => ({
      ...prev,
      tests: prev.tests.filter(t => t.id !== id),
    }));

    toast.success('Teste excluído!');
  };

  const getDecisionBadge = (decision: TestDecision) => {
    const config = {
      MANTER: { color: 'bg-green-500', icon: CheckCircle, label: 'Manter' },
      MATAR: { color: 'bg-red-500', icon: XCircle, label: 'Matar' },
      PENDENTE: { color: 'bg-yellow-500', icon: Clock, label: 'Pendente' },
    };
    const { color, icon: Icon, label } = config[decision];
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const isTestActive = (test: Test) => {
    const today = new Date().toISOString().split('T')[0];
    return test.dateStart <= today && (!test.dateEnd || test.dateEnd >= today);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Beaker className="h-8 w-8" />
            Testes
          </h1>
          <p className="text-muted-foreground mt-1">
            Experimentos e testes A/B
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Teste
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTest ? 'Editar Teste' : 'Novo Teste'}
              </DialogTitle>
              <DialogDescription>
                Registre experimentos e hipóteses
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

              <div>
                <Label htmlFor="hypothesis">Hipótese *</Label>
                <Textarea
                  id="hypothesis"
                  value={formHypothesis}
                  onChange={(e) => setFormHypothesis(e.target.value)}
                  placeholder="Se fizermos X, esperamos que Y aconteça..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="change">Mudança Implementada</Label>
                <Textarea
                  id="change"
                  value={formChange}
                  onChange={(e) => setFormChange(e.target.value)}
                  placeholder="Descreva o que foi alterado..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateStart">Data de Início *</Label>
                  <Input
                    id="dateStart"
                    type="date"
                    value={formDateStart}
                    onChange={(e) => setFormDateStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateEnd">Data de Término</Label>
                  <Input
                    id="dateEnd"
                    type="date"
                    value={formDateEnd}
                    onChange={(e) => setFormDateEnd(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="result">Resultado</Label>
                <Textarea
                  id="result"
                  value={formResult}
                  onChange={(e) => setFormResult(e.target.value)}
                  placeholder="Descreva os resultados observados..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="decision">Decisão</Label>
                <Select value={formDecision} onValueChange={(v) => setFormDecision(v as TestDecision)}>
                  <SelectTrigger id="decision">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="MANTER">Manter (funcionou)</SelectItem>
                    <SelectItem value="MATAR">Matar (não funcionou)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Notas adicionais..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingTest ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendente}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mantidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.manter}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mortos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.matar}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="filterDecision">Decisão</Label>
              <Select value={filterDecision} onValueChange={setFilterDecision}>
                <SelectTrigger id="filterDecision">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="MANTER">Manter</SelectItem>
                  <SelectItem value="MATAR">Matar</SelectItem>
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

      {/* Tests List */}
      <div className="space-y-4">
        {filteredTests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <Beaker className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum teste cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredTests.map((test) => {
            const marketplace = state.marketplaces.find(m => m.id === test.marketplaceId);
            const owner = state.owners.find(o => o.id === test.ownerId);
            const active = isTestActive(test);
            
            return (
              <Card key={test.id} className={active ? 'border-blue-500' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {test.hypothesis}
                      </CardTitle>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {getDecisionBadge(test.decision)}
                        <Badge variant="outline">{marketplace?.name}</Badge>
                        <Badge variant="outline">{owner?.name}</Badge>
                        {active && (
                          <Badge className="bg-blue-500">Ativo</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(test)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(test.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold">Período:</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(test.dateStart).toLocaleDateString('pt-BR')}
                      {test.dateEnd && ` até ${new Date(test.dateEnd).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>

                  {test.change && (
                    <div>
                      <p className="text-sm font-semibold">Mudança:</p>
                      <p className="text-sm text-muted-foreground">{test.change}</p>
                    </div>
                  )}

                  {test.result && (
                    <div>
                      <p className="text-sm font-semibold">Resultado:</p>
                      <p className="text-sm text-muted-foreground">{test.result}</p>
                    </div>
                  )}

                  {test.notes && (
                    <div>
                      <p className="text-sm font-semibold">Observações:</p>
                      <p className="text-sm text-muted-foreground">{test.notes}</p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Criado em: {new Date(test.createdAt).toLocaleString('pt-BR')}
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
