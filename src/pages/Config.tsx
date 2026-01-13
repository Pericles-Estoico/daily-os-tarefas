import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, RefreshCw, Trash2, User, Eye, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function Config() {
  const config = useStore((state) => state.config);
  const owners = useStore((state) => state.owners);
  const updateConfig = useStore((state) => state.updateConfig);
  const resetData = useStore((state) => state.resetData);
  const loadSeedData = useStore((state) => state.loadSeedData);
  const exportData = useStore((state) => state.exportData);
  const importData = useStore((state) => state.importData);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `os-marketplaces-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Backup exportado!');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (importData(ev.target?.result as string)) {
            toast.success('Dados importados!');
          } else {
            toast.error('Erro ao importar');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleCurrentUserChange = (value: string) => {
    updateConfig({ currentUserId: value === 'none' ? null : value });
    toast.success('Usuário atual atualizado!');
  };

  const handleRestrictViewChange = (checked: boolean) => {
    updateConfig({ restrictViewToCurrentUser: checked });
    toast.success(checked ? 'Visão restrita ativada' : 'Visão restrita desativada');
  };

  const handleGlobalTasksVisibleToChange = (value: string) => {
    updateConfig({ globalTasksVisibleTo: value as 'CEO' | 'ALL' });
    toast.success('Configuração de tarefas globais atualizada');
  };

  const currentUser = config.currentUserId ? owners.find(o => o.id === config.currentUserId) : null;
  const ceoOwner = owners.find(o => o.cargo === 'CEO');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seu workspace</p>
      </div>

      {/* Modo Usuário */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Modo Usuário
          </CardTitle>
          <CardDescription>
            Configure qual usuário está usando o sistema e como a visão será filtrada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usuário atual */}
          <div className="space-y-2">
            <Label>Usuário Atual (Simulação)</Label>
            <div className="flex items-center gap-4">
              <Select value={config.currentUserId || 'none'} onValueChange={handleCurrentUserChange}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Selecione o usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum selecionado</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: owner.avatarColor }} />
                        <span>{owner.nome}</span>
                        <span className="text-muted-foreground text-xs">({owner.cargo})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentUser && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-6 w-6 rounded-full" style={{ backgroundColor: currentUser.avatarColor }} />
                  Logado como: <strong>{currentUser.nome}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Toggle Restringir Visão */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Restringir visão ao usuário atual</Label>
                <p className="text-xs text-muted-foreground">
                  Quando ativo, o usuário vê apenas suas próprias tarefas
                </p>
              </div>
            </div>
            <Switch
              checked={config.restrictViewToCurrentUser}
              onCheckedChange={handleRestrictViewChange}
            />
          </div>

          {/* Tarefas Globais */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Label>Tarefas globais visíveis para:</Label>
            </div>
            <Select value={config.globalTasksVisibleTo} onValueChange={handleGlobalTasksVisibleToChange}>
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CEO">
                  <div className="flex items-center gap-2">
                    <span>Apenas CEO</span>
                    {ceoOwner && (
                      <span className="text-xs text-muted-foreground">({ceoOwner.nome})</span>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="ALL">Todos os usuários</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define quem pode ver tarefas sem marketplace vinculado quando a visão está restrita.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Workspace */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={config.nome} onChange={(e) => updateConfig({ nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Meta Diária (R$)</Label>
              <Input type="number" value={config.metaDiaria} onChange={(e) => updateConfig({ metaDiaria: Number(e.target.value) })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Módulos */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos</CardTitle>
          <CardDescription>Ative ou desative funcionalidades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(['crm', 'paidAds', 'live', 'affiliates'] as const).map((mod) => (
            <div key={mod} className="flex items-center justify-between">
              <span className="capitalize">{mod === 'paidAds' ? 'Paid Ads' : mod}</span>
              <Switch
                checked={config.modulesEnabled[mod]}
                onCheckedChange={(c) => updateConfig({ modulesEnabled: { ...config.modulesEnabled, [mod]: c } })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Dados</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Importar JSON
          </Button>
          <Button variant="outline" onClick={() => { loadSeedData(); toast.success('Demo carregado!'); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Carregar Demo
          </Button>
          <Button variant="destructive" onClick={() => { if (confirm('Resetar tudo?')) { resetData(); toast.success('Dados resetados'); } }}>
            <Trash2 className="h-4 w-4 mr-2" />
            Resetar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}