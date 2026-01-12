import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SemaforoBadge } from '@/components/ui/semaforo-badge';
import {
  Beaker,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lightbulb,
  Calendar,
  Copy,
} from 'lucide-react';
import type { Experiment, ExperimentDecision, TaskStatus } from '@/types';

const decisionConfig: Record<ExperimentDecision, { label: string; color: string; icon: React.ElementType }> = {
  pendente: { label: 'Pendente', color: 'bg-muted text-muted-foreground', icon: RefreshCw },
  duplicar: { label: 'Duplicar', color: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]', icon: Copy },
  iterar: { label: 'Iterar', color: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]', icon: RefreshCw },
  matar: { label: 'Matar', color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

export default function Testes() {
  const experiments = useStore((state) => state.experiments);
  const owners = useStore((state) => state.owners);
  const addExperiment = useStore((state) => state.addExperiment);
  const updateExperiment = useStore((state) => state.updateExperiment);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newExperiment, setNewExperiment] = useState({
    titulo: '',
    hipotese: '',
    variavel: '',
    ownerId: '',
    metricaSucesso: '',
  });

  const today = new Date().toISOString().split('T')[0];

  const getOwnerName = (ownerId: string) => {
    return owners.find((o) => o.id === ownerId)?.nome || 'Desconhecido';
  };

  const filteredExperiments = experiments.filter((exp) => {
    const matchesSearch =
      exp.titulo.toLowerCase().includes(search.toLowerCase()) ||
      exp.hipotese.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayTest = experiments.find(
    (exp) => exp.dataInicio === today && exp.status === 'doing'
  );

  const activeTests = experiments.filter((e) => e.status === 'doing');
  const completedTests = experiments.filter((e) => e.status === 'done');
  const winners = completedTests.filter((e) => e.decisao === 'duplicar');

  const handleCreateExperiment = () => {
    const experiment: Experiment = {
      id: crypto.randomUUID(),
      ...newExperiment,
      resultado: '',
      decisao: 'pendente',
      evidencia: '',
      dataInicio: today,
      dataFim: '',
      status: 'doing',
    };
    addExperiment(experiment);
    setIsCreateOpen(false);
    setNewExperiment({
      titulo: '',
      hipotese: '',
      variavel: '',
      ownerId: '',
      metricaSucesso: '',
    });
  };

  const suggestedHypotheses = [
    { hipotese: 'Frete grátis acima de R$150 aumenta ticket médio em 15%', variavel: 'Threshold de frete', metrica: 'Ticket médio' },
    { hipotese: 'CTA "Comprar Agora" converte 20% mais que "Adicionar"', variavel: 'Texto do CTA', metrica: 'Taxa de conversão' },
    { hipotese: 'Criativo UGC tem CTR 30% maior que estúdio', variavel: 'Tipo de criativo', metrica: 'CTR' },
    { hipotese: 'Timer de urgência no checkout aumenta conversão em 10%', variavel: 'Elemento de urgência', metrica: 'Checkout completion' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Beaker className="h-6 w-6" />
            Testes (Experimentos)
          </h1>
          <p className="text-muted-foreground">
            {activeTests.length} ativos • {winners.length} vencedores
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Novo Teste
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Teste do Dia</DialogTitle>
              <DialogDescription>
                Defina a hipótese que será testada hoje
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={newExperiment.titulo}
                  onChange={(e) => setNewExperiment({ ...newExperiment, titulo: e.target.value })}
                  placeholder="Ex: Teste de urgência no checkout"
                />
              </div>

              <div>
                <Label>Hipótese *</Label>
                <Textarea
                  value={newExperiment.hipotese}
                  onChange={(e) => setNewExperiment({ ...newExperiment, hipotese: e.target.value })}
                  placeholder="Se [fazermos X], então [resultado Y] porque [razão Z]"
                />
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    Sugestões baseadas nos seus números:
                  </p>
                  <div className="space-y-1">
                    {suggestedHypotheses.slice(0, 2).map((sug, i) => (
                      <div
                        key={i}
                        className="p-2 rounded bg-muted/50 cursor-pointer hover:bg-muted text-xs"
                        onClick={() =>
                          setNewExperiment({
                            ...newExperiment,
                            hipotese: sug.hipotese,
                            variavel: sug.variavel,
                            metricaSucesso: sug.metrica,
                          })
                        }
                      >
                        <p className="font-medium">{sug.hipotese}</p>
                        <p className="text-muted-foreground">
                          Variável: {sug.variavel} | Métrica: {sug.metrica}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Variável a Testar *</Label>
                <Input
                  value={newExperiment.variavel}
                  onChange={(e) => setNewExperiment({ ...newExperiment, variavel: e.target.value })}
                  placeholder="Ex: Timer de 15min no checkout"
                />
              </div>

              <div>
                <Label>Métrica de Sucesso *</Label>
                <Input
                  value={newExperiment.metricaSucesso}
                  onChange={(e) => setNewExperiment({ ...newExperiment, metricaSucesso: e.target.value })}
                  placeholder="Ex: Taxa de conversão do checkout"
                />
              </div>

              <div>
                <Label>Owner *</Label>
                <Select
                  value={newExperiment.ownerId}
                  onValueChange={(v) => setNewExperiment({ ...newExperiment, ownerId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateExperiment}
                disabled={
                  !newExperiment.titulo ||
                  !newExperiment.hipotese ||
                  !newExperiment.variavel ||
                  !newExperiment.ownerId
                }
              >
                Criar Teste
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Test Highlight */}
      {todayTest ? (
        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Teste do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-lg">{todayTest.titulo}</h3>
            <p className="text-sm text-muted-foreground mt-1">{todayTest.hipotese}</p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span>
                <strong>Variável:</strong> {todayTest.variavel}
              </span>
              <span>
                <strong>Métrica:</strong> {todayTest.metricaSucesso}
              </span>
              <span>
                <strong>Owner:</strong> {getOwnerName(todayTest.ownerId)}
              </span>
            </div>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => setSelectedExperiment(todayTest)}
            >
              Registrar Resultado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Beaker className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium">Nenhum teste ativo hoje</h3>
            <p className="text-sm text-muted-foreground">
              Crie um teste para começar a experimentar
            </p>
            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Criar Teste do Dia
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar teste..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="doing">Ativos</SelectItem>
            <SelectItem value="done">Finalizados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos ({experiments.length})</TabsTrigger>
          <TabsTrigger value="active">Ativos ({activeTests.length})</TabsTrigger>
          <TabsTrigger value="winners">Vencedores ({winners.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {filteredExperiments.map((exp) => {
              const DecisionIcon = decisionConfig[exp.decisao].icon;
              return (
                <Card
                  key={exp.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedExperiment(exp)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{exp.titulo}</h3>
                          <Badge className={decisionConfig[exp.decisao].color}>
                            <DecisionIcon className="h-3 w-3 mr-1" />
                            {decisionConfig[exp.decisao].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {exp.hipotese}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{getOwnerName(exp.ownerId)}</span>
                          <span>•</span>
                          <span>{new Date(exp.dataInicio).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {activeTests.map((exp) => (
              <Card
                key={exp.id}
                className="cursor-pointer hover:border-primary/50"
                onClick={() => setSelectedExperiment(exp)}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium">{exp.titulo}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{exp.hipotese}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <Badge variant="outline">Ativo</Badge>
                    <span className="text-muted-foreground">
                      Desde {new Date(exp.dataInicio).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="winners" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {winners.map((exp) => (
              <Card
                key={exp.id}
                className="cursor-pointer hover:border-primary/50 border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5"
                onClick={() => setSelectedExperiment(exp)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                    <h3 className="font-medium">{exp.titulo}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{exp.resultado}</p>
                  <Button size="sm" variant="outline" className="mt-3">
                    <Copy className="h-3 w-3 mr-1" />
                    Duplicar Teste
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Experiment Detail Dialog */}
      <Dialog open={!!selectedExperiment} onOpenChange={() => setSelectedExperiment(null)}>
        <DialogContent className="max-w-lg">
          {selectedExperiment && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge className={decisionConfig[selectedExperiment.decisao].color}>
                    {decisionConfig[selectedExperiment.decisao].label}
                  </Badge>
                  <Badge variant="outline">{selectedExperiment.status === 'doing' ? 'Ativo' : 'Finalizado'}</Badge>
                </div>
                <DialogTitle>{selectedExperiment.titulo}</DialogTitle>
                <DialogDescription>
                  Owner: {getOwnerName(selectedExperiment.ownerId)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Hipótese</Label>
                  <p className="text-sm mt-1">{selectedExperiment.hipotese}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Variável</Label>
                    <p className="text-sm mt-1">{selectedExperiment.variavel}</p>
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Métrica</Label>
                    <p className="text-sm mt-1">{selectedExperiment.metricaSucesso}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Resultado</Label>
                  <Textarea
                    value={selectedExperiment.resultado}
                    onChange={(e) => {
                      updateExperiment(selectedExperiment.id, { resultado: e.target.value });
                      setSelectedExperiment({ ...selectedExperiment, resultado: e.target.value });
                    }}
                    placeholder="Descreva o resultado do teste..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Evidência</Label>
                  <Input
                    value={selectedExperiment.evidencia}
                    onChange={(e) => {
                      updateExperiment(selectedExperiment.id, { evidencia: e.target.value });
                      setSelectedExperiment({ ...selectedExperiment, evidencia: e.target.value });
                    }}
                    placeholder="Link da evidência..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Decisão</Label>
                  <div className="flex gap-2 mt-2">
                    {(['duplicar', 'iterar', 'matar'] as ExperimentDecision[]).map((dec) => {
                      const config = decisionConfig[dec];
                      const Icon = config.icon;
                      return (
                        <Button
                          key={dec}
                          variant={selectedExperiment.decisao === dec ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            updateExperiment(selectedExperiment.id, {
                              decisao: dec,
                              status: 'done',
                              dataFim: today,
                            });
                            setSelectedExperiment({
                              ...selectedExperiment,
                              decisao: dec,
                              status: 'done',
                              dataFim: today,
                            });
                          }}
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedExperiment(null)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
