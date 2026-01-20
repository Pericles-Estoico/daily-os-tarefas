import { useState } from 'react';
import { useOps } from '@/contexts/OpsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Download, 
  Upload, 
  Trash2, 
  Shield, 
  CheckCircle2,
  AlertTriangle,
  Settings,
  FileSpreadsheet,
  Eye
} from 'lucide-react';
import { exportStateToJSON, clearState, importStateFromJSON } from '@/lib/storage';
import { parseXLSXFile, importKPIsFromSheet, downloadTemplate, type XLSXValidationError } from '@/lib/xlsx-import';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { KPIDaily } from '@/types/marketplace-ops';

export function Configuracoes() {
  const { state, updateState, resetState } = useOps();
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    kpis: KPIDaily[];
    errors: XLSXValidationError[];
  } | null>(null);

  const handleOwnerChange = (ownerId: string) => {
    updateState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        currentOwnerId: ownerId,
      },
    }));
    toast.success(`Usuário alterado para ${state.owners.find(o => o.id === ownerId)?.name}`);
  };

  const handleExport = () => {
    try {
      exportStateToJSON();
      toast.success('Backup exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar backup');
    }
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const importedState = await importStateFromJSON(file);
      updateState(() => importedState);
      toast.success('Backup importado com sucesso!');
      window.location.reload();
    } catch (error) {
      toast.error('Erro ao importar backup. Verifique o arquivo.');
    } finally {
      setImporting(false);
    }
  };

  const handleImportXLSX = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await parseXLSXFile(file);
      const { kpis, errors } = importKPIsFromSheet(data, state.marketplaces);
      
      setImportPreview({ kpis, errors });
      
      if (errors.length > 0) {
        toast.warning(`${errors.length} erros encontrados. Revise o preview.`);
      } else {
        toast.success(`${kpis.length} registros válidos! Revise o preview.`);
      }
    } catch (error: any) {
      toast.error('Erro ao processar planilha: ' + error.message);
      setImportPreview(null);
    } finally {
      setImporting(false);
      // Limpa input para permitir re-upload do mesmo arquivo
      event.target.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;

    // UPSERT: não duplica KPIs existentes (por dateISO + marketplaceId)
    updateState((prev) => {
      const existingKeys = new Set(
        prev.kpis.map(k => `${k.dateISO}:${k.marketplaceId}`)
      );
      
      const newKpis = importPreview.kpis.filter(
        k => !existingKeys.has(`${k.dateISO}:${k.marketplaceId}`)
      );
      
      return {
        ...prev,
        kpis: [...prev.kpis, ...newKpis],
        settings: {
          ...prev.settings,
          lastImportDate: new Date().toISOString(),
        },
      };
    });

    toast.success(`${importPreview.kpis.length} registros importados!`);
    setImportPreview(null);
  };

  const handleReset = () => {
    resetState();
    clearState();
    toast.success('Sistema resetado com sucesso!');
    window.location.reload();
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
    toast.success('Template baixado! Preencha e importe.');
  };

  const currentOwner = state.owners.find((o) => o.id === state.settings.currentOwnerId);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie owners, usuário atual, import/export e backup
        </p>
      </div>

      {/* Usuário Atual */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Usuário Atual
          </CardTitle>
          <CardDescription>
            Define qual owner está usando o sistema (filtro "Só minhas")
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={state.settings.currentOwnerId} onValueChange={handleOwnerChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um owner" />
                </SelectTrigger>
                <SelectContent>
                  {state.owners
                    .filter((o) => o.active)
                    .map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        <div className="flex items-center gap-2">
                          <span>{owner.name}</span>
                          <span className="text-xs text-muted-foreground">({owner.role})</span>
                          {owner.isAdmin && (
                            <Badge variant="secondary" className="text-xs">Admin</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {currentOwner && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                  {currentOwner.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{currentOwner.name}</p>
                  <p className="text-sm text-muted-foreground">{currentOwner.role}</p>
                </div>
                {currentOwner.isAdmin && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import XLSX Vendas */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Importar Vendas (XLSX/CSV)
          </CardTitle>
          <CardDescription>
            Importe vendas diárias do Bling ou outro ERP via planilha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Botões */}
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={handleDownloadTemplate} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Baixar Template
            </Button>
            
            <label htmlFor="import-xlsx" className="w-full">
              <Button variant="default" className="w-full" disabled={importing} asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {importing ? 'Processando...' : 'Importar Planilha'}
                </span>
              </Button>
            </label>
            <input
              id="import-xlsx"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImportXLSX}
              className="hidden"
            />
          </div>

          {/* Instruções */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
            <h4 className="font-semibold mb-2 text-sm">📋 Como usar:</h4>
            <ol className="text-xs space-y-1 text-muted-foreground">
              <li>1. Baixe o template CSV</li>
              <li>2. Exporte vendas do Bling (ou copie dados)</li>
              <li>3. Cole no template (mesmas colunas)</li>
              <li>4. Salve como CSV</li>
              <li>5. Importe aqui</li>
              <li>6. Revise preview e confirme</li>
            </ol>
          </div>

          {/* Colunas esperadas */}
          <div className="text-xs">
            <p className="font-semibold mb-1">Colunas obrigatórias:</p>
            <code className="bg-muted p-2 rounded block">
              data, marketplace, gmv, pedidos
            </code>
            <p className="font-semibold mb-1 mt-2">Colunas opcionais:</p>
            <code className="bg-muted p-2 rounded block text-[10px]">
              itens, ticket_medio, taxa_cancelamento, sla_minutos, rating
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Owners Cadastrados */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-600" />
            Owners Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {state.owners.map((owner) => (
              <div key={owner.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {owner.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{owner.name}</p>
                    <p className="text-xs text-muted-foreground">{owner.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {owner.isAdmin && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                  {owner.active ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Inativo</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backup JSON */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-600" />
            Backup e Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <Download className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100">Exportar Backup (JSON)</h3>
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                Baixa todos os dados em formato JSON
              </p>
              <Button onClick={handleExport} variant="default" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar JSON
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <Upload className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Importar Backup (JSON)</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Restaura dados de backup. <strong>Substitui tudo!</strong>
              </p>
              <label htmlFor="import-file">
                <Button variant="default" size="sm" disabled={importing} asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {importing ? 'Importando...' : 'Importar JSON'}
                  </span>
                </Button>
              </label>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-100">Resetar Sistema</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                Apaga TODOS os dados. <strong>Irreversível!</strong>
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Resetar Sistema
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      ⚠️ Esta ação não pode ser desfeita!
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
                      Sim, Resetar Tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Info do Sistema */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-600" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Versão:</span>
            <span className="font-semibold">{state.settings.appVersion}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">KPIs Importados:</span>
            <span className="font-semibold">{state.kpis.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Último Import:</span>
            <span className="font-semibold">
              {state.settings.lastImportDate 
                ? new Date(state.settings.lastImportDate).toLocaleString('pt-BR')
                : 'Nunca'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Preview Import */}
      <Dialog open={!!importPreview} onOpenChange={() => setImportPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview da Importação
            </DialogTitle>
            <DialogDescription>
              Revise os dados antes de confirmar a importação
            </DialogDescription>
          </DialogHeader>

          {importPreview && (
            <div className="space-y-4 py-4">
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">{importPreview.kpis.length}</div>
                    <p className="text-xs text-muted-foreground">Registros Válidos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">{importPreview.errors.length}</div>
                    <p className="text-xs text-muted-foreground">Erros</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {importPreview.kpis.reduce((sum, k) => sum + k.gmv, 0).toLocaleString('pt-BR')}
                    </div>
                    <p className="text-xs text-muted-foreground">GMV Total</p>
                  </CardContent>
                </Card>
              </div>

              {/* Erros */}
              {importPreview.errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-600">❌ Erros Encontrados:</h3>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {importPreview.errors.map((error, i) => (
                      <div key={i} className="text-xs p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
                        Linha {error.row}, Coluna "{error.column}": {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Dados */}
              <div className="space-y-2">
                <h3 className="font-semibold text-green-600">✅ Dados Válidos (Primeiros 10):</h3>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Data</th>
                        <th className="p-2 text-left">Marketplace</th>
                        <th className="p-2 text-right">GMV</th>
                        <th className="p-2 text-right">Pedidos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.kpis.slice(0, 10).map((kpi, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2">{kpi.dateISO}</td>
                          <td className="p-2">{kpi.marketplaceId}</td>
                          <td className="p-2 text-right">R$ {kpi.gmv.toLocaleString('pt-BR')}</td>
                          <td className="p-2 text-right">{kpi.orders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.kpis.length > 10 && (
                    <p className="text-xs text-muted-foreground p-2">
                      ... e mais {importPreview.kpis.length - 10} registros
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportPreview(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmImport}
              disabled={!importPreview || importPreview.kpis.length === 0}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar Importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
