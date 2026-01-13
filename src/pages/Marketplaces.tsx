import { useState } from 'react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SemaforoBadge } from '@/components/ui/semaforo-badge';
import { 
  Search, Plus, Store, Edit2, Trash2, AlertTriangle, 
  TrendingUp, Clock, ShieldAlert, Pause, Play
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Marketplace, MarketplacePriority, MarketplaceStage, MarketplaceCadence } from '@/types';

const PRIORITIES: { value: MarketplacePriority; label: string; color: string }[] = [
  { value: 'P0', label: 'P0 (Emergência)', color: 'bg-red-600' },
  { value: 'P1', label: 'P1 (Motor de Caixa)', color: 'bg-orange-500' },
  { value: 'P2', label: 'P2 (Importante)', color: 'bg-blue-500' },
  { value: 'P3', label: 'P3 (Manutenção)', color: 'bg-gray-500' },
];

const STAGES: { value: MarketplaceStage; label: string; icon: React.ReactNode }[] = [
  { value: 'SCALE', label: 'Scale', icon: <TrendingUp className="h-3 w-3" /> },
  { value: 'SETUP', label: 'Setup', icon: <Clock className="h-3 w-3" /> },
  { value: 'RECOVER', label: 'Recover', icon: <ShieldAlert className="h-3 w-3" /> },
  { value: 'PAUSED', label: 'Pausado', icon: <Pause className="h-3 w-3" /> },
];

const CADENCES: { value: MarketplaceCadence; label: string }[] = [
  { value: 'DAILY', label: 'Diário' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'SETUP_SPRINT', label: 'Sprint Setup' },
  { value: 'RECOVER', label: 'Recover Sprint' },
];

export default function Marketplaces() {
  const marketplaces = useStore((state) => state.marketplaces);
  const owners = useStore((state) => state.owners);
  const kpiEntries = useStore((state) => state.kpiEntries);
  const incidents = useStore((state) => state.incidents);
  const addMarketplace = useStore((state) => state.addMarketplace);
  const updateMarketplace = useStore((state) => state.updateMarketplace);
  const deleteMarketplace = useStore((state) => state.deleteMarketplace);

  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<MarketplaceStage | 'ALL'>('ALL');
  const [editMarketplace, setEditMarketplace] = useState<Marketplace | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  const filteredMarketplaces = marketplaces.filter((mp) => {
    if (search && !mp.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStage !== 'ALL' && mp.stage !== filterStage) return false;
    return true;
  });

  // Group by priority
  const groupedByPriority = PRIORITIES.reduce((acc, p) => {
    acc[p.value] = filteredMarketplaces.filter((mp) => mp.priority === p.value);
    return acc;
  }, {} as Record<MarketplacePriority, Marketplace[]>);

  const getOwner = (ownerId: string) => owners.find((o) => o.id === ownerId);

  const getOwnerInitials = (nome: string) => {
    const parts = nome.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  const getLatestKPI = (marketplaceId: string) => {
    const kpis = kpiEntries.filter((k) => k.marketplaceId === marketplaceId);
    return kpis.sort((a, b) => b.date.localeCompare(a.date))[0];
  };

  const getOpenIncidents = (marketplaceId: string) => {
    return incidents.filter(
      (i) => i.marketplaceId === marketplaceId && (i.status === 'OPEN' || i.status === 'IN_PROGRESS')
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir este marketplace? Todas as tarefas, KPIs e incidentes vinculados serão removidos.')) {
      deleteMarketplace(id);
      toast.success('Marketplace excluído');
    }
  };

  const handleEnterRecover = (mp: Marketplace) => {
    updateMarketplace(mp.id, { stage: 'RECOVER', cadence: 'RECOVER' });
    toast.warning(`${mp.name} entrou em modo RECOVER`);
  };

  const handleExitRecover = (mp: Marketplace) => {
    const openIncs = getOpenIncidents(mp.id);
    if (openIncs.length > 0) {
      toast.error(`Resolva os ${openIncs.length} incidente(s) aberto(s) antes de sair do RECOVER`);
      return;
    }
    updateMarketplace(mp.id, { stage: 'SCALE', cadence: 'DAILY' });
    toast.success(`${mp.name} saiu do modo RECOVER`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6" />
            Marketplaces
          </h1>
          <p className="text-muted-foreground">
            {marketplaces.length} canais • {marketplaces.filter((m) => m.isSelling).length} vendendo
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Marketplace
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar marketplace..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStage} onValueChange={(v) => setFilterStage(v as MarketplaceStage | 'ALL')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os stages</SelectItem>
            {STAGES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <div className="flex items-center gap-2">
                  {s.icon}
                  {s.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* RECOVER Warning */}
      {marketplaces.filter((m) => m.stage === 'RECOVER').length > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium">
                {marketplaces.filter((m) => m.stage === 'RECOVER').length} marketplace(s) em RECOVER
              </p>
              <p className="text-sm text-muted-foreground">
                Tarefas de crescimento bloqueadas até resolução de incidentes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marketplaces by Priority */}
      {PRIORITIES.map((priority) => {
        const mps = groupedByPriority[priority.value];
        if (mps.length === 0) return null;
        return (
          <div key={priority.value} className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Badge className={priority.color}>{priority.value}</Badge>
              {priority.label}
              <span className="text-muted-foreground font-normal">({mps.length})</span>
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mps.map((mp) => {
                const owner = getOwner(mp.ownerId);
                const kpi = getLatestKPI(mp.id);
                const openIncs = getOpenIncidents(mp.id);
                return (
                  <Card
                    key={mp.id}
                    className={`${mp.stage === 'RECOVER' ? 'border-red-500/50' : ''} ${mp.stage === 'PAUSED' ? 'opacity-60' : ''}`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{mp.name}</p>
                            {mp.isSelling ? (
                              <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                                Vendendo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Sem vendas
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Cutoff: {mp.cutoffTime}</p>
                        </div>
                        <SemaforoBadge status={kpi?.semaforo || 'YELLOW'} size="sm" />
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={mp.stage === 'RECOVER' ? 'destructive' : mp.stage === 'SETUP' ? 'secondary' : 'outline'}
                        >
                          {STAGES.find((s) => s.value === mp.stage)?.icon}
                          <span className="ml-1">{mp.stage}</span>
                        </Badge>
                        <Badge variant="outline">{CADENCES.find((c) => c.value === mp.cadence)?.label}</Badge>
                        {openIncs.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {openIncs.length} inc.
                          </Badge>
                        )}
                      </div>

                      {owner && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback style={{ backgroundColor: owner.avatarColor, color: 'white', fontSize: '10px' }}>
                              {getOwnerInitials(owner.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {owner.nome} ({owner.cargo})
                          </span>
                        </div>
                      )}

                      {kpi && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="p-2 rounded bg-muted/50">
                            <p className="text-muted-foreground">GMV</p>
                            <p className="font-mono font-medium">R$ {kpi.values.gmv.toLocaleString('pt-BR')}</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <p className="text-muted-foreground">Pedidos</p>
                            <p className="font-mono font-medium">{kpi.values.pedidos}</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <p className="text-muted-foreground">Rep.</p>
                            <p className="font-mono font-medium">{kpi.values.reputacao}</p>
                          </div>
                        </div>
                      )}

                      {mp.notes && (
                        <p className="text-xs text-muted-foreground border-t pt-2">{mp.notes}</p>
                      )}

                      <div className="flex gap-2 pt-2 border-t">
                        <Button size="sm" variant="ghost" className="flex-1" onClick={() => setEditMarketplace(mp)}>
                          <Edit2 className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        {mp.stage === 'RECOVER' ? (
                          <Button size="sm" variant="outline" onClick={() => handleExitRecover(mp)}>
                            <Play className="h-3 w-3 mr-1" />
                            Sair RECOVER
                          </Button>
                        ) : mp.stage !== 'PAUSED' ? (
                          <Button size="sm" variant="destructive" onClick={() => handleEnterRecover(mp)}>
                            <ShieldAlert className="h-3 w-3 mr-1" />
                            RECOVER
                          </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(mp.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {filteredMarketplaces.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum marketplace encontrado</p>
          <Button variant="link" onClick={() => setIsCreateOpen(true)}>
            Criar primeiro marketplace
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <MarketplaceDialog
        open={isCreateOpen || !!editMarketplace}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditMarketplace(null);
          }
        }}
        marketplace={editMarketplace}
        owners={owners}
        onSave={(data) => {
          if (editMarketplace) {
            updateMarketplace(editMarketplace.id, data);
            toast.success('Marketplace atualizado');
          } else {
            addMarketplace({
              ...data,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            } as Marketplace);
            toast.success('Marketplace criado');
          }
          setIsCreateOpen(false);
          setEditMarketplace(null);
        }}
      />
    </div>
  );
}

interface MarketplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketplace: Marketplace | null;
  owners: import('@/types').Owner[];
  onSave: (data: Partial<Marketplace>) => void;
}

function MarketplaceDialog({ open, onOpenChange, marketplace, owners, onSave }: MarketplaceDialogProps) {
  const [formData, setFormData] = useState<Partial<Marketplace>>(() =>
    marketplace || {
      name: '',
      priority: 'P2',
      stage: 'SCALE',
      isSelling: false,
      cadence: 'DAILY',
      ownerId: owners[0]?.id || '',
      modulesEnabled: { crm: false, paidAds: false, supportSla: true, live: false, affiliates: false },
      cutoffTime: '14:00',
      notes: '',
    }
  );

  const handleSubmit = () => {
    if (!formData.name || !formData.ownerId) {
      toast.error('Preencha nome e dono');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{marketplace ? 'Editar Marketplace' : 'Novo Marketplace'}</DialogTitle>
          <DialogDescription>
            Configure os detalhes do canal de vendas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Shopee Matriz"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={formData.priority || 'P2'}
                onValueChange={(v) => setFormData({ ...formData, priority: v as MarketplacePriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${p.color}`} />
                        {p.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={formData.stage || 'SCALE'}
                onValueChange={(v) => setFormData({ ...formData, stage: v as MarketplaceStage })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center gap-2">
                        {s.icon}
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cadência</Label>
              <Select
                value={formData.cadence || 'DAILY'}
                onValueChange={(v) => setFormData({ ...formData, cadence: v as MarketplaceCadence })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CADENCES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
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
              <Label>Cutoff</Label>
              <Input
                type="time"
                value={formData.cutoffTime || '14:00'}
                onChange={(e) => setFormData({ ...formData, cutoffTime: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch
                checked={formData.isSelling || false}
                onCheckedChange={(c) => setFormData({ ...formData, isSelling: c })}
              />
              <Label>Vendendo</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o canal..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>{marketplace ? 'Salvar' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
