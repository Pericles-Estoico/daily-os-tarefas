import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, RotateCcw, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function Config() {
  const config = useStore((state) => state.config);
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
    a.download = `os-execucao-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Dados exportados com sucesso!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = importData(event.target?.result as string);
        if (result) {
          toast.success('Dados importados com sucesso!');
        } else {
          toast.error('Erro ao importar dados. Verifique o arquivo.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6" />Configurações</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Workspace</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome do Workspace</Label>
            <Input value={config.nome} onChange={(e) => updateConfig({ nome: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Meta Diária (R$)</Label>
            <Input type="number" value={config.metaDiaria} onChange={(e) => updateConfig({ metaDiaria: Number(e.target.value) })} className="mt-1" />
          </div>
          <div>
            <Label>Tolerância Semáforo (%)</Label>
            <Input type="number" value={config.toleranciaSemaforo} onChange={(e) => updateConfig({ toleranciaSemaforo: Number(e.target.value) })} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Dados</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Exportar JSON</Button>
            <Button variant="outline" asChild><label className="cursor-pointer"><Upload className="h-4 w-4 mr-1" />Importar JSON<input type="file" accept=".json" className="hidden" onChange={handleImport} /></label></Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { loadSeedData(); toast.success('Dados demo carregados!'); }}><RotateCcw className="h-4 w-4 mr-1" />Carregar Demo</Button>
            <Button variant="destructive" onClick={() => { resetData(); toast.success('Dados resetados!'); }}>Resetar Tudo</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Como Usar</CardTitle></CardHeader>
        <CardContent className="prose prose-sm text-muted-foreground">
          <p><strong>Rotina Diária:</strong> Complete as tarefas críticas (11h, 13h, 18h, 18h15) com evidência obrigatória.</p>
          <p><strong>Painel 5 Números:</strong> Preencha diariamente receita, pedidos, ticket, margem e CPA.</p>
          <p><strong>OKRs:</strong> Monitore KPIs e crie incidentes para KPIs vermelhos.</p>
          <p><strong>Incidentes:</strong> Registre problemas com causa raiz e valide com 3 testes.</p>
          <p><strong>Testes:</strong> Execute 1 teste por dia com hipótese clara.</p>
        </CardContent>
      </Card>
    </div>
  );
}
