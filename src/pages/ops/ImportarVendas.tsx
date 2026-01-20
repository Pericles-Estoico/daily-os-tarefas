import { useState, useMemo } from 'react';
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
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { parseXLSXFile, importKPIsFromSheet, importSalesFromSheet } from '@/lib/xlsx-import';
import { analyzeDailyData, createAutoIncidents, generateAnalysisSummary } from '@/lib/daily-analysis';
import type { KPIDaily, SalesBySKU, DailyImportSession } from '@/types/marketplace-ops';

export function ImportarVendas() {
  const { state, updateState } = useOps();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState('');

  // Sessão do dia
  const session = useMemo(() => {
    return state.importSessions.find(s => s.dateISO === selectedDate);
  }, [state.importSessions, selectedDate]);

  const activeMarketplaces = state.marketplaces.filter(m => m.active);
  
  const pendingMarketplaces = useMemo(() => {
    if (!session) return activeMarketplaces.map(m => m.id);
    return activeMarketplaces.filter(m => !session.importedMarketplaces.includes(m.id)).map(m => m.id);
  }, [session, activeMarketplaces]);

  const importedMarketplaces = session?.importedMarketplaces || [];
  const totalGMV = session?.totalGMV || 0;
  const dailyGoal = state.settings.dailyGoal;
  const percentOfGoal = dailyGoal > 0 ? (totalGMV / dailyGoal) * 100 : 0;

  const handleUploadKPI = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedMarketplace) {
      toast.error('Selecione um marketplace primeiro');
      return;
    }

    setUploading(true);
    try {
      const data = await parseXLSXFile(file);
      const { kpis, errors } = importKPIsFromSheet(data, state.marketplaces);

      if (errors.length > 0) {
        toast.error(`${errors.length} erros encontrados`);
        return;
      }

      // Força marketplace e data
      const adjustedKpis = kpis.map(k => ({
        ...k,
        marketplaceId: selectedMarketplace,
        dateISO: selectedDate,
      }));

      // Atualiza estado
      updateState((prev) => {
        // Remove KPIs existentes deste marketplace/data
        const filtered = prev.kpis.filter(
          k => !(k.dateISO === selectedDate && k.marketplaceId === selectedMarketplace)
        );

        // Atualiza sessão
        let sessions = [...prev.importSessions];
        let currentSession = sessions.find(s => s.dateISO === selectedDate);

        if (!currentSession) {
          currentSession = {
            dateISO: selectedDate,
            goalDaily: prev.settings.dailyGoal,
            importedMarketplaces: [],
            pendingMarketplaces: activeMarketplaces.map(m => m.id),
            totalGMV: 0,
            completed: false,
            completedAt: null,
          };
          sessions.push(currentSession);
        }

        if (!currentSession.importedMarketplaces.includes(selectedMarketplace)) {
          currentSession.importedMarketplaces.push(selectedMarketplace);
        }

        currentSession.totalGMV = [...filtered, ...adjustedKpis].reduce((sum, k) => {
          if (k.dateISO === selectedDate) return sum + k.gmv;
          return sum;
        }, 0);

        return {
          ...prev,
          kpis: [...filtered, ...adjustedKpis],
          importSessions: sessions,
        };
      });

      toast.success(`${adjustedKpis.length} KPIs importados!`);
      setSelectedMarketplace('');
    } catch (error: any) {
      toast.error('Erro ao importar: ' + error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleUploadSales = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedMarketplace) {
      toast.error('Selecione um marketplace primeiro');
      return;
    }

    setUploading(true);
    try {
      const data = await parseXLSXFile(file);
      const { sales, errors } = importSalesFromSheet(data, state.marketplaces);

      if (errors.length > 0) {
        toast.error(`${errors.length} erros encontrados`);
        return;
      }

      const adjustedSales = sales.map(s => ({
        ...s,
        marketplaceId: selectedMarketplace,
        dateStart: selectedDate,
        dateEnd: selectedDate,
      }));

      updateState((prev) => {
        const filtered = prev.salesBySku.filter(
          s => !(s.dateStart === selectedDate && s.marketplaceId === selectedMarketplace)
        );

        return {
          ...prev,
          salesBySku: [...filtered, ...adjustedSales],
        };
      });

      toast.success(`${adjustedSales.length} vendas por SKU importadas!`);
    } catch (error: any) {
      toast.error('Erro ao importar: ' + error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleFinalizeDay = () => {
    if (!session) {
      toast.error('Nenhuma importação iniciada');
      return;
    }

    // Analisa dados
    const dayKpis = state.kpis.filter(k => k.dateISO === selectedDate);
    const daySales = state.salesBySku.filter(s => s.dateStart === selectedDate);
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

    // Salva análise e incidentes
    updateState((prev) => {
      const sessions = prev.importSessions.map(s => {
        if (s.dateISO === selectedDate) {
          return {
            ...s,
            completed: true,
            completedAt: new Date().toISOString(),
          };
        }
        return s;
      });

      return {
        ...prev,
        dailyAnalyses: [...prev.dailyAnalyses.filter(a => a.dateISO !== selectedDate), analysis],
        incidents: [...prev.incidents, ...autoIncidents],
        importSessions: sessions,
      };
    });

    setAnalysisSummary(summary);
    setShowAnalysis(true);
    toast.success('Análise concluída!');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Importar Vendas do Dia</h1>
        <p className="text-muted-foreground">
          Importe vendas marketplace por marketplace e finalize para análise automática
        </p>
      </div>

      {/* Data e Meta */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={session?.completed}
              />
            </div>

            {/* Meta */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4" />
                Meta do Dia
              </Label>
              <div className="text-3xl font-bold text-blue-600">
                R$ {dailyGoal.toLocaleString('pt-BR')}
              </div>
            </div>

            {/* GMV Importado */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                Importado
              </Label>
              <div className="text-3xl font-bold text-green-600">
                R$ {totalGMV.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {percentOfGoal.toFixed(1)}% da meta
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{importedMarketplaces.length} / {activeMarketplaces.length} marketplaces</span>
            </div>
            <Progress value={(importedMarketplaces.length / Math.max(activeMarketplaces.length, 1)) * 100} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Marketplaces */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>📦 Status dos Marketplaces</CardTitle>
          <CardDescription>
            Importe os dados de cada marketplace. Mesmo sem vendas, importe com GMV = 0.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeMarketplaces.map((marketplace) => {
            const imported = importedMarketplaces.includes(marketplace.id);
            const kpi = state.kpis.find(k => k.dateISO === selectedDate && k.marketplaceId === marketplace.id);

            return (
              <div
                key={marketplace.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  imported ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  {imported ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-semibold">{marketplace.name}</p>
                    {kpi && (
                      <p className="text-sm text-muted-foreground">
                        R$ {kpi.gmv.toLocaleString('pt-BR')} • {kpi.orders} pedidos
                      </p>
                    )}
                  </div>
                </div>
                
                {!session?.completed && (
                  <Button
                    onClick={() => setSelectedMarketplace(marketplace.id)}
                    variant={imported ? "outline" : "default"}
                    size="sm"
                  >
                    {imported ? 'Reimportar' : 'Importar'}
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Upload */}
      {selectedMarketplace && !session?.completed && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload: {state.marketplaces.find(m => m.id === selectedMarketplace)?.name}
            </CardTitle>
            <CardDescription>
              Faça upload dos 2 arquivos deste marketplace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Arquivo 1: Total do Dia */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
              <Label htmlFor="upload-kpi" className="text-sm font-semibold mb-2 block">
                📈 Arquivo 1: Total do Dia (Resumo)
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                Colunas: Loja, Pedidos, Ticket Médio, Quantidade, Valor, Valor Peça
              </p>
              <label htmlFor="upload-kpi">
                <Button variant="default" disabled={uploading} asChild>
                  <span>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {uploading ? 'Processando...' : 'Selecionar Arquivo'}
                  </span>
                </Button>
              </label>
              <input
                id="upload-kpi"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleUploadKPI}
                className="hidden"
              />
            </div>

            {/* Arquivo 2: Vendas por SKU */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
              <Label htmlFor="upload-sales" className="text-sm font-semibold mb-2 block">
                📊 Arquivo 2: Vendas por Produto (SKU)
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                Colunas: Código, Quantidade, Valor
              </p>
              <label htmlFor="upload-sales">
                <Button variant="default" disabled={uploading} asChild>
                  <span>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {uploading ? 'Processando...' : 'Selecionar Arquivo'}
                  </span>
                </Button>
              </label>
              <input
                id="upload-sales"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleUploadSales}
                className="hidden"
              />
            </div>

            <Button variant="outline" onClick={() => setSelectedMarketplace('')} className="w-full">
              Cancelar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Finalizar */}
      {importedMarketplaces.length > 0 && !session?.completed && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="lg" className="w-full" disabled={importedMarketplaces.length === 0}>
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
                  <li>Gerar alertas e sugestões</li>
                </ul>
                <p className="mt-3 text-yellow-600 font-semibold">
                  ⚠️ Após finalizar, não pode reimportar este dia.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleFinalizeDay}>
                Sim, Finalizar e Analisar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Dia Finalizado */}
      {session?.completed && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Dia Finalizado e Analisado!</h3>
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

      {/* Modal Análise */}
      <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-600" />
              Análise Inteligente do Dia
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
              {analysisSummary}
            </pre>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAnalysis(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
