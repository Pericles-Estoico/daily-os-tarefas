import { useState } from 'react';
import { useOps } from '@/contexts/OpsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Eye,
  Calendar,
  Store,
  X,
  Package
} from 'lucide-react';
import { exportStateToJSON, clearState, importStateFromJSON } from '@/lib/storage';
import { parseXLSXFile, importKPIsFromSheet, importSalesFromSheet, downloadTemplate, downloadSalesTemplate, downloadSummaryTemplate, type XLSXValidationError } from '@/lib/xlsx-import';
import { applySeedData } from '@/lib/seed-data';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { KPIDaily, SalesBySKU, StagedDailySales } from '@/types/marketplace-ops';

export function Configuracoes() {
  const { state, updateState, resetState } = useOps();
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    kpis: KPIDaily[];
    errors: XLSXValidationError[];
  } | null>(null);

  // Daily Sales Upload State
  const [selectedMarketplaceId, setSelectedMarketplaceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Summary Upload State
  const [summaryDate, setSummaryDate] = useState<string>(new Date().toISOString().split('T')[0]);

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

  // Upload Daily Sales by Marketplace
  const handleUploadDailySales = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedMarketplaceId) {
      toast.error('Selecione um marketplace');
      return;
    }

    setImporting(true);
    try {
      const data = await parseXLSXFile(file);
      const { sales, errors } = importSalesFromSheet(data, state.marketplaces);

      if (errors.length > 0) {
        toast.error(`${errors.length} erros encontrados na planilha`);
        return;
      }

      // Add to staging
      const staged: StagedDailySales = {
        id: `staged-${Date.now()}`,
        marketplaceId: selectedMarketplaceId,
        dateISO: selectedDate,
        fileName: file.name,
        sales: sales.map(s => ({
          ...s,
          dateStart: selectedDate,
          dateEnd: selectedDate,
          marketplaceId: selectedMarketplaceId,
        })),
        uploadedAt: new Date().toISOString(),
      };

      updateState((prev) => ({
        ...prev,
        importStaging: {
          ...prev.importStaging,
          dailySales: [...prev.importStaging.dailySales, staged],
        },
      }));

      toast.success(`${sales.length} vendas adicionadas ao staging!`);
    } catch (error: any) {
      toast.error('Erro ao processar planilha: ' + error.message);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  // Upload Daily Summary
  const handleUploadDailySummary = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await parseXLSXFile(file);
      const { kpis, errors } = importKPIsFromSheet(data, state.marketplaces);

      if (errors.length > 0) {
        toast.error(`${errors.length} erros encontrados na planilha`);
        return;
      }

      // Add to staging
      updateState((prev) => ({
        ...prev,
        importStaging: {
          ...prev.importStaging,
          dailySummary: {
            dateISO: summaryDate,
            fileName: file.name,
            kpis: kpis.map(k => ({
              ...k,
              dateISO: summaryDate,
            })),
            uploadedAt: new Date().toISOString(),
          },
        },
      }));

      toast.success(`Resumo do dia adicionado ao staging!`);
    } catch (error: any) {
      toast.error('Erro ao processar planilha: ' + error.message);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  // Remove staged item
  const handleRemoveStagedSales = (id: string) => {
    updateState((prev) => ({
      ...prev,
      importStaging: {
        ...prev.importStaging,
        dailySales: prev.importStaging.dailySales.filter(s => s.id !== id),
      },
    }));
    toast.info('Vendas removidas do staging');
  };

  const handleRemoveStagedSummary = () => {
    updateState((prev) => ({
      ...prev,
      importStaging: {
        ...prev.importStaging,
        dailySummary: null,
      },
    }));
    toast.info('Resumo removido do staging');
  };

  // Confirm and process all
  const handleConfirmAllImports = () => {
    const { dailySales, dailySummary } = state.importStaging;

    if (dailySales.length === 0 && !dailySummary) {
      toast.error('Nenhum dado para importar');
      return;
    }

    updateState((prev) => {
      // Add all sales
      const allSales = dailySales.flatMap(ds => ds.sales);
      
      // Add all KPIs
      const allKpis = dailySummary ? dailySummary.kpis : [];

      return {
        ...prev,
        salesBySku: [...prev.salesBySku, ...allSales],
        kpis: [...prev.kpis, ...allKpis],
        importStaging: {
          dailySales: [],
          dailySummary: null,
        },
        settings: {
          ...prev.settings,
          lastImportDate: new Date().toISOString(),
        },
      };
    });

    toast.success(`✅ Importação concluída! ${dailySales.length} marketplace(s), ${dailySummary ? dailySummary.kpis.length : 0} KPI(s)`);
  };

  // Clear staging
  const handleClearStaging = () => {
    updateState((prev) => ({
      ...prev,
      importStaging: {
        dailySales: [],
        dailySummary: null,
      },
    }));
    toast.info('Staging limpo');
  };

  const handleLoadDemo = () => {
    updateState((prev) => applySeedData(prev));
    toast.success('✅ Demo carregado! Mercado Livre Matriz + 5 tarefas de hoje criadas');
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

      {/* 🎮 Demo Data - Carregar dados completos */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            🎮 Demo Data Completo
          </CardTitle>
          <CardDescription>
            Carregue dados de demonstração para testar filtros, tarefas e o sistema completo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">📦 O que será criado:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✅ <strong>Marketplace:</strong> Mercado Livre Matriz (playbook completo)</li>
                <li>✅ <strong>5 Templates</strong> de tarefas (diferentes donos e horários)</li>
                <li>✅ <strong>5 Tarefas para HOJE</strong> (testar filtros por dono)</li>
                <li>✅ <strong>Donos:</strong> Péricles, Stella, Walistter, Elisangela</li>
              </ul>
            </div>
            <Button
              onClick={handleLoadDemo}
              variant="default"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Carregar Demo Completo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 📦 SEÇÃO 1: Upload de Vendas Diárias por Marketplace */}
      <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-600" />
            1. Upload de Vendas Diárias por Marketplace
          </CardTitle>
          <CardDescription>
            Importe as vendas de cada marketplace separadamente (um arquivo por marketplace)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marketplace-select">Marketplace *</Label>
              <Select value={selectedMarketplaceId} onValueChange={setSelectedMarketplaceId}>
                <SelectTrigger id="marketplace-select">
                  <SelectValue placeholder="Selecione o marketplace..." />
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
              <Label htmlFor="date-select">Data *</Label>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Upload Button */}
          <div>
            <label htmlFor="upload-daily-sales">
              <Button 
                variant="default" 
                className="w-full" 
                disabled={importing || !selectedMarketplaceId}
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {importing ? 'Processando...' : 'Upload Vendas do Marketplace'}
                </span>
              </Button>
            </label>
            <input
              id="upload-daily-sales"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleUploadDailySales}
              className="hidden"
            />
          </div>

          {/* Instructions */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border text-xs space-y-2">
            <p className="font-semibold mb-1">📋 Colunas esperadas:</p>
            <code className="bg-muted p-2 rounded block">
              Código (SKU), Quantidade, Valor
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadSalesTemplate();
                toast.success('Template de vendas baixado!');
              }}
              className="w-full mt-2"
            >
              <Download className="h-3 w-3 mr-2" />
              Baixar Template de Vendas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 📊 SEÇÃO 2: Upload do Resumo Total do Dia */}
      <Card className="border-2 border-green-200 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            2. Upload do Resumo Total do Dia
          </CardTitle>
          <CardDescription>
            Importe o resumo consolidado com número de pedidos, ticket médio e totais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Date Selector */}
          <div>
            <Label htmlFor="summary-date">Data do Resumo *</Label>
            <Input
              id="summary-date"
              type="date"
              value={summaryDate}
              onChange={(e) => setSummaryDate(e.target.value)}
            />
          </div>

          {/* Upload Button */}
          <div>
            <label htmlFor="upload-summary">
              <Button 
                variant="default" 
                className="w-full" 
                disabled={importing}
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {importing ? 'Processando...' : 'Upload Resumo Total'}
                </span>
              </Button>
            </label>
            <input
              id="upload-summary"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleUploadDailySummary}
              className="hidden"
            />
          </div>

          {/* Instructions */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border text-xs space-y-2">
            <p className="font-semibold mb-1">📋 Colunas esperadas:</p>
            <code className="bg-muted p-2 rounded block">
              Loja, Pedidos, Ticket Médio, Quantidade, Valor
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadSummaryTemplate();
                toast.success('Template de resumo baixado!');
              }}
              className="w-full mt-2"
            >
              <Download className="h-3 w-3 mr-2" />
              Baixar Template de Resumo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 🎯 SEÇÃO 3: Staging Area - Preview e Confirmação */}
      {(state.importStaging.dailySales.length > 0 || state.importStaging.dailySummary) && (
        <Card className="border-2 border-purple-200 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              3. Preview - Confirme os Dados
            </CardTitle>
            <CardDescription>
              Revise tudo antes de confirmar a importação final
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {state.importStaging.dailySales.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Marketplaces</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-green-600">
                    {state.importStaging.dailySummary ? '✓' : '-'}
                  </div>
                  <p className="text-xs text-muted-foreground">Resumo</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {state.importStaging.dailySales.reduce((sum, ds) => sum + ds.sales.length, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">SKUs Total</p>
                </CardContent>
              </Card>
            </div>

            {/* Staged Sales List */}
            {state.importStaging.dailySales.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Vendas por Marketplace:</h4>
                {state.importStaging.dailySales.map((staged) => {
                  const mp = state.marketplaces.find(m => m.id === staged.marketplaceId);
                  return (
                    <div key={staged.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-semibold text-sm">{mp?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(staged.dateISO).toLocaleDateString('pt-BR')} • {staged.sales.length} SKUs • {staged.fileName}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveStagedSales(staged.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Staged Summary */}
            {state.importStaging.dailySummary && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Resumo Total:</h4>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-semibold text-sm">Resumo do Dia</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(state.importStaging.dailySummary.dateISO).toLocaleDateString('pt-BR')} • {state.importStaging.dailySummary.kpis.length} KPIs • {state.importStaging.dailySummary.fileName}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveStagedSummary}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleClearStaging}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Tudo
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmAllImports}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar e Processar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usuário Atual - Sistema de Acesso */}
      <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            👤 Usuário Atual (Sistema de Acesso)
          </CardTitle>
          <CardDescription>
            Quem está operando o sistema agora. Define o que você pode ver e fazer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current-user-select" className="text-sm font-medium mb-2 block">
              Selecione o Usuário
            </Label>
            <Select
              value={state.settings.currentOwnerId}
              onValueChange={(value) => {
                const selectedOwner = state.owners.find(o => o.id === value);
                const newRole = selectedOwner?.isManager ? 'ADMIN' : 'MEMBER';
                
                updateState((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    currentOwnerId: value,
                    currentUserRole: newRole,
                  },
                }));
                
                toast.success(`Usuário alterado para ${selectedOwner?.name} (${newRole})`);
              }}
            >
              <SelectTrigger id="current-user-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.owners.filter((o) => o.active).map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: owner.color || '#6B7280' }}
                      >
                        {owner.initials}
                      </div>
                      {owner.name} - {owner.role}
                      {owner.isManager && <Badge variant="default" className="ml-2 text-xs">Admin</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {currentOwner && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border-2">
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: currentOwner.color || '#6B7280' }}
                >
                  {currentOwner.initials}
                </div>
                <div>
                  <p className="font-semibold text-lg">{currentOwner.name}</p>
                  <p className="text-sm text-muted-foreground">{currentOwner.role}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="font-medium">Nível de Acesso:</span>
                  <Badge variant={state.settings.currentUserRole === 'ADMIN' ? 'default' : 'secondary'}>
                    {state.settings.currentUserRole}
                  </Badge>
                </div>
                
                {state.settings.currentUserRole === 'ADMIN' ? (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">🔓 Admin - Acesso Total</p>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                      <li>✅ Vê TODAS as tarefas (todos os owners)</li>
                      <li>✅ Pode editar descrições e templates</li>
                      <li>✅ Pode criar/editar marketplaces</li>
                      <li>✅ Acesso completo a configurações</li>
                    </ul>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">🔒 Member - Acesso Limitado</p>
                    <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                      <li>✅ Vê APENAS suas tarefas atribuídas</li>
                      <li>✅ Pode executar/pular suas tarefas</li>
                      <li>✅ Pode anexar evidências</li>
                      <li>❌ Não pode editar templates/descrições</li>
                    </ul>
                  </div>
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
                  {owner.isManager && (
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
