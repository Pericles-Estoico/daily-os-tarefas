import { useState } from 'react';
import { useOps } from '@/contexts/OpsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Store, 
  Plus, 
  Edit, 
  Trash2,
  TrendingUp,
  AlertCircle,
  Rocket,
  Pause,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Marketplace, MarketplacePriority, MarketplaceStage, MarketplaceCadence } from '@/types/marketplace-ops';

const PRIORITY_OPTIONS: { value: MarketplacePriority; label: string; color: string }[] = [
  { value: 'P0', label: 'P0 - Crise', color: 'bg-red-600' },
  { value: 'P1', label: 'P1 - Motor do Caixa', color: 'bg-orange-600' },
  { value: 'P2', label: 'P2 - Expansão/Setup', color: 'bg-blue-600' },
  { value: 'P3', label: 'P3 - Baixa Prioridade', color: 'bg-slate-600' },
];

const STAGE_OPTIONS: { value: MarketplaceStage; label: string; icon: any }[] = [
  { value: 'SCALE', label: 'Scale - Vende e Escala', icon: Rocket },
  { value: 'SETUP_SPRINT', label: 'Setup Sprint - Canal Novo', icon: Plus },
  { value: 'RECOVER', label: 'Recover - Em Crise', icon: AlertCircle },
  { value: 'WEEKLY', label: 'Weekly - Manutenção', icon: TrendingUp },
  { value: 'PAUSED', label: 'Paused - Congelado', icon: Pause },
];

const CADENCE_OPTIONS: { value: MarketplaceCadence; label: string }[] = [
  { value: 'DAILY', label: 'Diário' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'SETUP_SPRINT', label: 'Setup Sprint (14 dias)' },
  { value: 'RECOVER_SPRINT', label: 'Recover Sprint (7 dias)' },
];

export function Marketplaces() {
  const { state, updateState } = useOps();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [playbookDialogOpen, setPlaybookDialogOpen] = useState(false);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Marketplace | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Marketplace>>({
    id: '',
    name: '',
    priority: 'P2',
    stage: 'SETUP_SPRINT',
    cadence: 'DAILY',
    ownerId: state.settings.currentOwnerId,
    isSelling: false,
    active: true,
    notes: '',
    playbookMarkdown: '',
  });

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      id: '',
      name: '',
      priority: 'P2',
      stage: 'SETUP_SPRINT',
      cadence: 'DAILY',
      ownerId: state.settings.currentOwnerId,
      isSelling: false,
      active: true,
      notes: '',
      playbookMarkdown: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (marketplace: Marketplace) => {
    setEditingId(marketplace.id);
    setFormData(marketplace);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.id) {
      toast.error('Preencha nome e ID');
      return;
    }

    const marketplace: Marketplace = {
      id: formData.id!,
      name: formData.name!,
      priority: formData.priority!,
      stage: formData.stage!,
      cadence: formData.cadence!,
      ownerId: formData.ownerId!,
      isSelling: formData.isSelling!,
      active: formData.active!,
      notes: formData.notes || '',
      playbookMarkdown: formData.playbookMarkdown || '',
    };

    updateState((prev) => {
      if (editingId) {
        return {
          ...prev,
          marketplaces: prev.marketplaces.map((m) =>
            m.id === editingId ? marketplace : m
          ),
        };
      } else {
        return {
          ...prev,
          marketplaces: [...prev.marketplaces, marketplace],
        };
      }
    });

    toast.success(editingId ? 'Marketplace atualizado' : 'Marketplace criado');
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    updateState((prev) => ({
      ...prev,
      marketplaces: prev.marketplaces.filter((m) => m.id !== id),
    }));
    toast.success('Marketplace removido');
  };

  const handleViewPlaybook = (marketplace: Marketplace) => {
    setSelectedPlaybook(marketplace);
    setPlaybookDialogOpen(true);
  };

  const getPriorityColor = (priority: MarketplacePriority) => {
    return PRIORITY_OPTIONS.find((p) => p.value === priority)?.color || 'bg-slate-600';
  };

  const getStageIcon = (stage: MarketplaceStage) => {
    return STAGE_OPTIONS.find((s) => s.value === stage)?.icon || Store;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Marketplaces</h1>
          <p className="text-muted-foreground">
            Cadastro de canais com priority, stage, owner e playbook
          </p>
        </div>
        <Button onClick={handleCreate} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Novo Marketplace
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{state.marketplaces.length}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {state.marketplaces.filter((m) => m.priority === 'P1').length}
            </div>
            <p className="text-xs text-muted-foreground">P1 (Motor)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {state.marketplaces.filter((m) => m.isSelling).length}
            </div>
            <p className="text-xs text-muted-foreground">Vendendo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {state.marketplaces.filter((m) => m.stage === 'SCALE').length}
            </div>
            <p className="text-xs text-muted-foreground">Em Scale</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Marketplaces */}
      {state.marketplaces.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum marketplace cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro canal de vendas
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Marketplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.marketplaces.map((marketplace) => {
            const StageIcon = getStageIcon(marketplace.stage);
            const owner = state.owners.find((o) => o.id === marketplace.ownerId);

            return (
              <Card key={marketplace.id} className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{marketplace.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{marketplace.id}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full ${getPriorityColor(marketplace.priority)} flex items-center justify-center text-white font-bold`}>
                      {marketplace.priority}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  
                  {/* Stage */}
                  <div className="flex items-center gap-2">
                    <StageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{STAGE_OPTIONS.find(s => s.value === marketplace.stage)?.label}</span>
                  </div>

                  {/* Owner */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {owner?.name.charAt(0)}
                    </div>
                    <span className="text-sm">{owner?.name}</span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {marketplace.isSelling && (
                      <Badge variant="default" className="bg-green-600">
                        Vendendo
                      </Badge>
                    )}
                    {!marketplace.active && (
                      <Badge variant="destructive">
                        Inativo
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {CADENCE_OPTIONS.find(c => c.value === marketplace.cadence)?.label}
                    </Badge>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPlaybook(marketplace)}
                      className="flex-1"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Playbook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(marketplace)}
                    >
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
                          <AlertDialogTitle>Remover marketplace?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação vai remover <strong>{marketplace.name}</strong>.
                            Templates e tarefas vinculadas não serão removidas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(marketplace.id)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Marketplace' : 'Novo Marketplace'}
            </DialogTitle>
            <DialogDescription>
              Configure priority, stage, owner e cadência do canal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            
            {/* ID e Nome */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id">ID *</Label>
                <Input
                  id="id"
                  placeholder="ex: shein, shopee_150"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                  disabled={!!editingId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="ex: Shein, Shopee Loja 150"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            {/* Priority e Stage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as MarketplacePriority })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stage *</Label>
                <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v as MarketplaceStage })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Owner e Cadence */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Owner *</Label>
                <Select value={formData.ownerId} onValueChange={(v) => setFormData({ ...formData, ownerId: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {state.owners.filter(o => o.active).map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name} ({owner.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cadência *</Label>
                <Select value={formData.cadence} onValueChange={(v) => setFormData({ ...formData, cadence: v as MarketplaceCadence })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CADENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isSelling">Está vendendo?</Label>
                <Switch
                  id="isSelling"
                  checked={formData.isSelling}
                  onCheckedChange={(v) => setFormData({ ...formData, isSelling: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Ativo?</Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(v) => setFormData({ ...formData, active: v })}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Observações sobre o canal..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Playbook */}
            <div className="space-y-2">
              <Label htmlFor="playbook">Playbook (Markdown)</Label>
              <Textarea
                id="playbook"
                placeholder="# SOP do Canal&#10;&#10;## Setup&#10;- Passo 1...&#10;&#10;## Diário&#10;- Tarefa 1..."
                value={formData.playbookMarkdown}
                onChange={(e) => setFormData({ ...formData, playbookMarkdown: e.target.value })}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Use Markdown para documentar SOPs, links, ferramentas, etc.
              </p>
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Playbook */}
      <Dialog open={playbookDialogOpen} onOpenChange={setPlaybookDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Playbook: {selectedPlaybook?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {selectedPlaybook?.playbookMarkdown ? (
              <pre className="whitespace-pre-wrap text-sm">
                {selectedPlaybook.playbookMarkdown}
              </pre>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhum playbook cadastrado ainda.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
