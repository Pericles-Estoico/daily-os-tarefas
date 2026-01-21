import { useState, useMemo, useRef } from 'react';
import { useOps } from '@/contexts/OpsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import { analyzeDailyData, createAutoIncidents, generateAnalysisSummary } from '@/lib/daily-analysis';
import type { StagedDailySales, StagedDailySummary, SalesBySKU, KPIDaily } from '@/types/marketplace-ops';

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
  const { state, updateState } = useOps();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState('');
  const [showPreview, setShowPreview] = useState<string | null>(null);
  
  // Estado local de staging (antes de consolidar)
  const [staging, setStaging] = useState<LocalStaging>({
    summary: null,
    salesByMarketplace: new Map()
  });

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

  // Sessão do dia (já consolidada)
  const session = useMemo(() => {
    return state.importSessions.find(s => s.dateISO === selectedDate);
  }, [state.importSessions, selectedDate]);

  const activeMarketplaces = state.marketplaces.filter(m => m.active);
  const dailyGoal = state.settings.dailyGoal;

  // Marketplaces identificados no resumo
  const marketplacesFromSummary = useMemo(() => {
    if (!staging.summary) return [];
    return staging.summary.rows
      .filter(r => r.marketplaceId)
      .map(r => ({
        id: r.marketplaceId!,
        name: state.marketplaces.find(m => m.id === r.marketplaceId)?.name || r.lojaName,
        lojaName: r.lojaName,
        valor: r.valor,
        pedidos: r.pedidos,
        hasSKU: staging.salesByMarketplace.has(r.marketplaceId!),
        skuCount: staging.salesByMarketplace.get(r.marketplaceId!)?.rows.length || 0
      }));
  }, [staging, state.marketplaces]);

  // Lojas não mapeadas
  const unmappedLojas = useMemo(() => {
    if (!staging.summary) return [];
    return staging.summary.rows.filter(r => !r.marketplaceId);
  }, [staging]);

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
      const { rows, errors } = parseDailySummarySheet(data, state.marketplaces);

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
    toast.info('Staging limpo');
  };

  const handleConsolidate = () => {
    if (!staging.summary || !canConsolidate) return;

    // Monta KPIs
    const newKPIs: KPIDaily[] = staging.summary.rows
      .filter(r => r.marketplaceId)
      .map(r => ({
        dateISO: selectedDate,
        marketplaceId: r.marketplaceId!,
        gmv: r.valor,
        orders: r.pedidos,
        items: r.quantidade,
        ticketAvg: r.ticketMedio,
        evidenceLinks: [],
        note: `Importado de ${staging.summary!.fileName}`
      }));

    // Monta Sales by SKU
    const newSales: SalesBySKU[] = [];
    staging.salesByMarketplace.forEach((data, marketplaceId) => {
      data.rows.forEach(row => {
        newSales.push({
          dateStart: selectedDate,
          dateEnd: selectedDate,
          marketplaceId,
          sku: row.sku,
          qty: row.quantidade,
          revenue: row.valor,
          orders: 0
        });
      });
    });

    // Atualiza estado global
    updateState((prev) => {
      // Remove dados existentes desta data
      const filteredKPIs = prev.kpis.filter(k => k.dateISO !== selectedDate);
      const filteredSales = prev.salesBySku.filter(s => s.dateStart !== selectedDate);

      // Atualiza/cria sessão
      let sessions = [...prev.importSessions];
      let currentSession = sessions.find(s => s.dateISO === selectedDate);

      if (!currentSession) {
        currentSession = {
          dateISO: selectedDate,
          goalDaily: dailyGoal,
          importedMarketplaces: newKPIs.map(k => k.marketplaceId),
          pendingMarketplaces: [],
          totalGMV: stagingTotalGMV,
          completed: false,
          completedAt: null
        };
        sessions.push(currentSession);
      } else {
        currentSession.importedMarketplaces = newKPIs.map(k => k.marketplaceId);
        currentSession.totalGMV = stagingTotalGMV;
      }

      return {
        ...prev,
        kpis: [...filteredKPIs, ...newKPIs],
        salesBySku: [...filteredSales, ...newSales],
        importSessions: sessions
      };
    });

    // Limpa staging
    setStaging({
      summary: null,
      salesByMarketplace: new Map()
    });

    toast.success(`Consolidado! ${newKPIs.length} marketplaces, ${newSales.length} SKUs`);
  };

  const handleFinalizeDay = () => {
    if (!session) {
      toast.error('Nenhuma importação consolidada');
      return;
    }

    const previousKpis = state.kpis.filter(k => k.dateISO < selectedDate);

    const analysis = analyzeDailyData(
      selectedDate,
      state.kpis,
      state.salesBySku,
      state.marketplaces,
      previousKpis,
      dailyGoal
    );

    const autoIncidents = createAutoIncidents(
      analysis,
      state.settings.currentOwnerId,
      state.marketplaces
    );

    const summary = generateAnalysisSummary(analysis);

    updateState((prev) => {
      const sessions = prev.importSessions.map(s => {
        if (s.dateISO === selectedDate) {
          return {
            ...s,
            completed: true,
            completedAt: new Date().toISOString()
          };
        }
        return s;
      });

      return {
        ...prev,
        dailyAnalyses: [...prev.dailyAnalyses.filter(a => a.dateISO !== selectedDate), analysis],
        incidents: [...prev.incidents, ...autoIncidents],
        importSessions: sessions
      };
    });

    setAnalysisSummary(summary);
    setShowAnalysis(true);
    toast.success('Análise concluída!');
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
                disabled={session?.completed}
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
                R$ {(staging.summary ? stagingTotalGMV : session?.totalGMV || 0).toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((staging.summary ? stagingTotalGMV : session?.totalGMV || 0) / dailyGoal * 100).toFixed(1)}% da meta
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dia já finalizado */}
      {session?.completed && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-accent/20 to-accent/10">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-accent-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Dia Finalizado!</h3>
            <p className="text-muted-foreground mb-4">
              Análise concluída em {new Date(session.completedAt!).toLocaleString('pt-BR')}
            </p>
            <Button onClick={() => {
              const analysis = state.dailyAnalyses.find(a => a.dateISO === selectedDate);
              if (analysis) {
                setAnalysisSummary(generateAnalysisSummary(analysis));
                setShowAnalysis(true);
              }
            }}>
              Ver Análise
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Fluxo de importação */}
      {!session?.completed && (
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

                  {/* Lojas não mapeadas */}
                  {unmappedLojas.length > 0 && (
                    <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <span className="font-semibold text-destructive">
                          {unmappedLojas.length} lojas não mapeadas
                        </span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {unmappedLojas.map((loja, i) => (
                          <li key={i}>• "{loja.lojaName}" - R$ {loja.valor.toLocaleString('pt-BR')}</li>
                        ))}
                      </ul>
                      <p className="text-xs mt-2 text-muted-foreground">
                        Cadastre esses marketplaces em Configurações ou corrija os nomes na planilha.
                      </p>
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
          {session && !session.completed && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" className="w-full">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Finalizar e Analisar Dia
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Finalizar importação do dia?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O sistema vai fazer análise inteligente dos dados:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Verificar meta (R$ {dailyGoal.toLocaleString('pt-BR')})</li>
                      <li>Ranking de marketplaces</li>
                      <li>Top produtos (Pareto)</li>
                      <li>Detectar incidentes automáticos</li>
                    </ul>
                    <p className="mt-3 text-destructive font-semibold">
                      ⚠️ Após finalizar, não pode reimportar este dia.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleFinalizeDay}>
                    Sim, Finalizar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </>
      )}

      {/* Modal Preview SKUs */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Preview SKUs: {state.marketplaces.find(m => m.id === showPreview)?.name}
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
