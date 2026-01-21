import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  FileSpreadsheet,
  Target,
  Calendar,
  Trash2,
  Eye,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  parseXLSXFile, 
  parseDailySummarySheet, 
  parseSKUSalesSheet,
  type ParsedDailySummaryRow,
  type ParsedSKUSaleRow
} from '@/lib/xlsx-import';
import { useMarketplaces } from '@/hooks/useMarketplacesData';
import { useConsolidateSales } from '@/hooks/useSalesImport';
import { useAppSettings } from '@/hooks/useSupabaseData';

// ============================================
// Tipos locais para staging
// ============================================
interface StagedSummaryRow extends ParsedDailySummaryRow {
  marketplaceId: string | null;
}

interface LocalStaging {
  summary: {
    fileName: string;
    rows: StagedSummaryRow[];
    uploadedAt: string;
  } | null;
  salesByMarketplace: Map<string, {
    fileName: string;
    rows: ParsedSKUSaleRow[];
    uploadedAt: string;
  }>;
}

export function ImportarVendas() {
  // Supabase data
  const { data: marketplaces = [], isLoading: loadingMarketplaces } = useMarketplaces();
  const { data: appSettings } = useAppSettings();
  const consolidateMutation = useConsolidateSales();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState('');
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [isConsolidated, setIsConsolidated] = useState(false);
  
  // Estado local de staging (antes de consolidar)
  const [staging, setStaging] = useState<LocalStaging>({
    summary: null,
    salesByMarketplace: new Map()
  });

  // Mapeamentos manuais: lojaName -> marketplaceId (ou null para ignorar)
  const [manualMappings, setManualMappings] = useState<Map<string, string | null>>(new Map());

  // Refs para inputs de arquivo
  const summaryInputRef = useRef<HTMLInputElement>(null);

  // Handlers para abrir seletores de arquivo
  const handleClickUploadSummary = () => {
    summaryInputRef.current?.click();
  };

  const handleClickUploadSKU = (marketplaceId: string) => {
    const input = document.getElementById(`sku-input-${marketplaceId}`) as HTMLInputElement;
    input?.click();
  };

  const dailyGoal = appSettings?.daily_goal || 10000;

  // Handler para mapeamento manual
  const handleManualMapping = (lojaName: string, value: string) => {
    setManualMappings(prev => {
      const newMap = new Map(prev);
      if (value === 'ignore') {
        newMap.set(lojaName, null); // Ignorar esta loja
      } else if (value === '__clear__') {
        newMap.delete(lojaName);
      } else {
        newMap.set(lojaName, value);
      }
      return newMap;
    });
  };

  // Marketplaces identificados no resumo (automático + manual)
  const marketplacesFromSummary = useMemo(() => {
    if (!staging.summary) return [];
    return staging.summary.rows
      .map(r => {
        // Prioriza mapeamento manual sobre automático
        const manualMapping = manualMappings.get(r.lojaName);
        const isIgnored = manualMappings.has(r.lojaName) && manualMapping === null;
        const marketplaceId = manualMapping || r.marketplaceId;
        
        if (isIgnored || !marketplaceId) return null;
        
        return {
          id: marketplaceId,
          name: marketplaces.find(m => m.id === marketplaceId)?.name || r.lojaName,
          lojaName: r.lojaName,
          valor: r.valor,
          pedidos: r.pedidos,
          hasSKU: staging.salesByMarketplace.has(marketplaceId),
          skuCount: staging.salesByMarketplace.get(marketplaceId)?.rows.length || 0
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        name: string;
        lojaName: string;
        valor: number;
        pedidos: number;
        hasSKU: boolean;
        skuCount: number;
      }>;
  }, [staging, marketplaces, manualMappings]);

  // Lojas não mapeadas (sem auto-match e sem mapeamento manual)
  const unmappedLojas = useMemo(() => {
    if (!staging.summary) return [];
    return staging.summary.rows.filter(r => {
      const hasAutoMatch = !!r.marketplaceId;
      const hasManualMapping = manualMappings.has(r.lojaName);
      return !hasAutoMatch && !hasManualMapping;
    });
  }, [staging, manualMappings]);

  // Lojas ignoradas manualmente
  const ignoredLojas = useMemo(() => {
    if (!staging.summary) return [];
    return staging.summary.rows.filter(r => {
      const manualMapping = manualMappings.get(r.lojaName);
      return manualMappings.has(r.lojaName) && manualMapping === null;
    });
  }, [staging, manualMappings]);

  // Total GMV do staging
  const stagingTotalGMV = useMemo(() => {
    if (!staging.summary) return 0;
    return staging.summary.rows.reduce((sum, r) => sum + r.valor, 0);
  }, [staging]);

  // Progresso de SKUs
  const skuProgress = useMemo(() => {
    const total = marketplacesFromSummary.length;
    const uploaded = marketplacesFromSummary.filter(m => m.hasSKU).length;
    return { total, uploaded };
  }, [marketplacesFromSummary]);

  // Pode consolidar?
  const canConsolidate = useMemo(() => {
    return (
      staging.summary !== null &&
      marketplacesFromSummary.length > 0 &&
      skuProgress.uploaded === skuProgress.total &&
      unmappedLojas.length === 0
    );
  }, [staging, marketplacesFromSummary, skuProgress, unmappedLojas]);

  // ============================================
  // Handlers
  // ============================================
  
  const handleUploadSummary = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await parseXLSXFile(file);
      // Convert Supabase marketplace format to the format expected by parseDailySummarySheet
      const marketplacesForParsing = marketplaces.map(m => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        priority: m.priority as any,
        stage: m.stage as any,
        cadence: m.cadence as any,
        ownerId: m.owner_id || '',
        isSelling: m.is_selling,
        active: m.active,
        notes: m.notes || '',
        playbookMarkdown: m.playbook_markdown || '',
      }));
      const { rows, errors } = parseDailySummarySheet(data, marketplacesForParsing);

      if (errors.length > 0) {
        toast.error(errors[0].error);
        return;
      }

      if (rows.length === 0) {
        toast.error('Nenhuma loja encontrada no arquivo');
        return;
      }

      // Mapeia para staging com marketplaceId
      const stagedRows: StagedSummaryRow[] = rows.map(r => ({
        ...r,
        marketplaceId: r.matchedMarketplace?.id || null
      }));

      setStaging(prev => ({
        ...prev,
        summary: {
          fileName: file.name,
          rows: stagedRows,
          uploadedAt: new Date().toISOString()
        },
        // Limpa SKUs anteriores quando novo resumo é carregado
        salesByMarketplace: new Map()
      }));

      const mapped = stagedRows.filter(r => r.marketplaceId).length;
      const unmapped = stagedRows.length - mapped;
      
      toast.success(
        `${rows.length} lojas encontradas! ${mapped} mapeadas${unmapped > 0 ? `, ${unmapped} precisam de mapeamento manual` : ''}`
      );

    } catch (error: any) {
      toast.error('Erro ao ler arquivo: ' + error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleUploadSKU = async (marketplaceId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await parseXLSXFile(file);
      const { rows, errors } = parseSKUSalesSheet(data);

      if (errors.length > 0) {
        toast.error(errors[0].error);
        return;
      }

      if (rows.length === 0) {
        toast.error('Nenhum SKU encontrado no arquivo');
        return;
      }

      setStaging(prev => {
        const newMap = new Map(prev.salesByMarketplace);
        newMap.set(marketplaceId, {
          fileName: file.name,
          rows,
          uploadedAt: new Date().toISOString()
        });
        return { ...prev, salesByMarketplace: newMap };
      });

      toast.success(`${rows.length} SKUs carregados!`);

    } catch (error: any) {
      toast.error('Erro ao ler arquivo: ' + error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveSKU = (marketplaceId: string) => {
    setStaging(prev => {
      const newMap = new Map(prev.salesByMarketplace);
      newMap.delete(marketplaceId);
      return { ...prev, salesByMarketplace: newMap };
    });
    toast.info('SKU removido do staging');
  };

  const handleClearStaging = () => {
    setStaging({
      summary: null,
      salesByMarketplace: new Map()
    });
    setManualMappings(new Map());
    toast.info('Staging limpo');
  };

  const handleConsolidate = async () => {
    if (!staging.summary || !canConsolidate) return;

    // Monta KPIs no formato do Supabase
    const newKPIs = staging.summary.rows
      .filter(r => r.marketplaceId)
      .map(r => ({
        date_iso: selectedDate,
        marketplace_id: r.marketplaceId!,
        gmv: r.valor,
        orders: r.pedidos,
        items: r.quantidade,
        ticket_avg: r.ticketMedio,
        note: `Importado de ${staging.summary!.fileName}`
      }));

    // Monta Sales by SKU no formato do Supabase
    const newSales: Array<{
      date_start: string;
      date_end: string;
      marketplace_id: string;
      sku: string;
      qty: number;
      revenue: number;
      orders: number;
    }> = [];
    staging.salesByMarketplace.forEach((data, marketplaceId) => {
      data.rows.forEach(row => {
        newSales.push({
          date_start: selectedDate,
          date_end: selectedDate,
          marketplace_id: marketplaceId,
          sku: row.sku,
          qty: row.quantidade,
          revenue: row.valor,
          orders: 0
        });
      });
    });

    try {
      await consolidateMutation.mutateAsync({
        kpis: newKPIs,
        sales: newSales,
        dateISO: selectedDate
      });

      // Limpa staging
      setStaging({
        summary: null,
        salesByMarketplace: new Map()
      });

      setIsConsolidated(true);
      toast.success(`Consolidado! ${newKPIs.length} marketplaces, ${newSales.length} SKUs`);
    } catch (error: any) {
      toast.error('Erro ao consolidar: ' + error.message);
    }
  };

  // Por enquanto, desativar a análise automática (precisa ser migrada para Supabase)
  const handleFinalizeDay = () => {
    toast.success('Dados consolidados com sucesso! Análise detalhada será implementada em breve.');
    setShowAnalysis(true);
    setAnalysisSummary(`## Resumo da Importação - ${selectedDate}\n\n` +
      `✅ KPIs salvos no banco de dados\n` +
      `✅ Vendas por SKU registradas\n` +
      `✅ Dashboard atualizado\n\n` +
      `Acesse o Dashboard para visualizar os dados consolidados.`
    );
  };


  // ============================================
  // Render
  // ============================================
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Importar Vendas do Dia</h1>
        <p className="text-muted-foreground">
          Passo 1: Upload do Resumo → Passo 2: SKU por Marketplace → Passo 3: Consolidar
        </p>
      </div>

      {/* Data e Meta */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  handleClearStaging();
                }}
                disabled={isConsolidated}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4" />
                Meta do Dia
              </Label>
              <div className="text-3xl font-bold text-primary">
                R$ {dailyGoal.toLocaleString('pt-BR')}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                {staging.summary ? 'Staging' : 'Consolidado'}
              </Label>
              <div className="text-3xl font-bold text-accent-foreground">
                R$ {stagingTotalGMV.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(stagingTotalGMV / dailyGoal * 100).toFixed(1)}% da meta
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fluxo de importação */}
      {!isConsolidated && (
        <>
          {/* PASSO 1: Upload Resumo */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="text-lg px-3 py-1">1</Badge>
                📊 Resumo do Dia (Upload Único)
              </CardTitle>
              <CardDescription>
                Arquivo com todas as lojas: Loja, Pedidos, Ticket Médio, Quantidade, Valor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!staging.summary ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Arraste ou selecione o arquivo de resumo diário
                  </p>
                  <Button onClick={handleClickUploadSummary} disabled={uploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Processando...' : 'Selecionar Arquivo'}
                  </Button>
                  <input
                    ref={summaryInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleUploadSummary}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-accent-foreground" />
                      <div>
                        <p className="font-semibold">{staging.summary.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {staging.summary.rows.length} lojas • R$ {stagingTotalGMV.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClearStaging}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Lojas não mapeadas - com dropdown para mapeamento manual */}
                  {unmappedLojas.length > 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <span className="font-semibold text-amber-800 dark:text-amber-200">
                          {unmappedLojas.length} lojas precisam de mapeamento manual
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {unmappedLojas.map((loja, i) => (
                          <div key={i} className="flex items-center justify-between gap-4 p-3 bg-background rounded border">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">"{loja.lojaName}"</p>
                              <p className="text-sm text-muted-foreground">
                                R$ {loja.valor.toLocaleString('pt-BR')} • {loja.pedidos} pedidos
                              </p>
                            </div>
                            
                            <Select
                              value=""
                              onValueChange={(value) => handleManualMapping(loja.lojaName, value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent className="bg-popover">
                                {marketplaces.map((mp) => (
                                  <SelectItem key={mp.id} value={mp.id}>
                                    {mp.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="ignore" className="text-muted-foreground">
                                  (Ignorar esta loja)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lojas ignoradas */}
                  {ignoredLojas.length > 0 && (
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">
                          {ignoredLojas.length} lojas ignoradas
                        </span>
                      </div>
                      <div className="space-y-2">
                        {ignoredLojas.map((loja, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">"{loja.lojaName}" - R$ {loja.valor.toLocaleString('pt-BR')}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleManualMapping(loja.lojaName, '__clear__')}
                            >
                              Desfazer
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* PASSO 2: SKU por Marketplace */}
          {staging.summary && marketplacesFromSummary.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">2</Badge>
                  📦 Vendas por SKU (1 arquivo por marketplace)
                </CardTitle>
                <CardDescription>
                  Colunas: Código, Quantidade, Valor • Progresso: {skuProgress.uploaded}/{skuProgress.total}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={(skuProgress.uploaded / Math.max(skuProgress.total, 1)) * 100} 
                  className="h-2 mb-4" 
                />
                
                <div className="space-y-3">
                  {marketplacesFromSummary.map((mp) => (
                    <div
                      key={mp.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        mp.hasSKU ? 'bg-accent/20 border-accent/30' : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {mp.hasSKU ? (
                          <CheckCircle2 className="h-6 w-6 text-accent-foreground" />
                        ) : (
                          <Clock className="h-6 w-6 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-semibold">{mp.name}</p>
                          <p className="text-sm text-muted-foreground">
                            R$ {mp.valor.toLocaleString('pt-BR')} • {mp.pedidos} pedidos
                            {mp.hasSKU && ` • ${mp.skuCount} SKUs`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {mp.hasSKU && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowPreview(mp.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSKU(mp.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant={mp.hasSKU ? "outline" : "default"}
                          size="sm"
                          disabled={uploading}
                          onClick={() => handleClickUploadSKU(mp.id)}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {mp.hasSKU ? 'Trocar' : 'Upload'}
                        </Button>
                        <input
                          id={`sku-input-${mp.id}`}
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={(e) => handleUploadSKU(mp.id, e)}
                          className="hidden"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* PASSO 3: Consolidar */}
          {staging.summary && (
            <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/10 to-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">3</Badge>
                  🚀 Consolidar Vendas
                </CardTitle>
                <CardDescription>
                  {canConsolidate 
                    ? 'Tudo pronto! Clique para salvar os dados no sistema.'
                    : 'Complete todos os uploads acima para habilitar.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={!canConsolidate}
                  onClick={handleConsolidate}
                >
                  <Package className="h-5 w-5 mr-2" />
                  Consolidar {marketplacesFromSummary.length} Marketplaces
                </Button>
                
                {!canConsolidate && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>Pendências:</p>
                    <ul className="list-disc list-inside mt-1">
                      {!staging.summary && <li>Upload do resumo do dia</li>}
                      {unmappedLojas.length > 0 && <li>{unmappedLojas.length} lojas não mapeadas</li>}
                      {skuProgress.uploaded < skuProgress.total && (
                        <li>{skuProgress.total - skuProgress.uploaded} marketplaces sem SKU</li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Finalizar (após consolidar) */}
          {isConsolidated && (
            <Card className="border-0 shadow-lg bg-gradient-to-r from-accent/20 to-accent/10">
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="h-16 w-16 text-accent-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Dados Consolidados!</h3>
                <p className="text-muted-foreground mb-4">
                  KPIs e vendas por SKU salvos no banco de dados.
                </p>
                <Button onClick={() => window.location.href = '/dashboard'}>
                  Ver Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modal Preview SKUs */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Preview SKUs: {marketplaces.find(m => m.id === showPreview)?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {showPreview && staging.salesByMarketplace.get(showPreview)?.rows.map((row, i) => (
                <div key={i} className="flex justify-between p-2 bg-muted rounded text-sm">
                  <span className="font-mono">{row.sku}</span>
                  <span>{row.quantidade}x • R$ {row.valor.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Análise */}
      <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Análise do Dia {selectedDate}
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
              {analysisSummary}
            </pre>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAnalysis(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
