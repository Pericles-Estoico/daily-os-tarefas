import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Download, Upload, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Config() {
  const config = useStore((state) => state.config);
  const updateConfig = useStore((state) => state.updateConfig);
  const resetData = useStore((state) => state.resetData);
  const loadSeedData = useStore((state) => state.loadSeedData);
  const exportData = useStore((state) => state.exportData);
  const importData = useStore((state) => state.importData);

  const handleExport = () => { const data = exportData(); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `os-marketplaces-backup-${new Date().toISOString().split('T')[0]}.json`; a.click(); toast.success('Backup exportado!'); };
  const handleImport = () => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'; input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { if (importData(ev.target?.result as string)) toast.success('Dados importados!'); else toast.error('Erro ao importar'); }; reader.readAsText(file); } }; input.click(); };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Configurações</h1><p className="text-muted-foreground">Gerencie seu workspace</p></div>
      <Card><CardHeader><CardTitle>Workspace</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Nome</Label><Input value={config.nome} onChange={(e) => updateConfig({ nome: e.target.value })} /></div>
          <div className="space-y-2"><Label>Meta Diária (R$)</Label><Input type="number" value={config.metaDiaria} onChange={(e) => updateConfig({ metaDiaria: Number(e.target.value) })} /></div>
        </div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Módulos</CardTitle><CardDescription>Ative ou desative funcionalidades</CardDescription></CardHeader><CardContent className="space-y-4">
        {(['crm', 'paidAds', 'live', 'affiliates'] as const).map((mod) => (
          <div key={mod} className="flex items-center justify-between"><span className="capitalize">{mod}</span><Switch checked={config.modulesEnabled[mod]} onCheckedChange={(c) => updateConfig({ modulesEnabled: { ...config.modulesEnabled, [mod]: c } })} /></div>
        ))}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Dados</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Exportar JSON</Button>
        <Button variant="outline" onClick={handleImport}><Upload className="h-4 w-4 mr-2" />Importar JSON</Button>
        <Button variant="outline" onClick={() => { loadSeedData(); toast.success('Demo carregado!'); }}><RefreshCw className="h-4 w-4 mr-2" />Carregar Demo</Button>
        <Button variant="destructive" onClick={() => { if (confirm('Resetar tudo?')) { resetData(); toast.success('Dados resetados'); } }}><Trash2 className="h-4 w-4 mr-2" />Resetar</Button>
      </CardContent></Card>
    </div>
  );
}
