import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SemaforoBadge } from '@/components/ui/semaforo-badge';
import {
  Target,
  Search,
  Plus,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import type { OKR, KR, SemaforoStatus } from '@/types';
import { Link } from 'react-router-dom';

export default function OKRsPage() {
  const okrs = useStore((state) => state.okrs);
  const krs = useStore((state) => state.krs);
  const sectors = useStore((state) => state.sectors);
  const owners = useStore((state) => state.owners);
  const updateKR = useStore((state) => state.updateKR);

  const [search, setSearch] = useState('');
  const [selectedKR, setSelectedKR] = useState<KR | null>(null);
  const [krValue, setKrValue] = useState('');
  const [krEvidencia, setKrEvidencia] = useState('');

  const getSectorName = (sectorId: string) => {
    return sectors.find((s) => s.id === sectorId)?.nome || 'Desconhecido';
  };

  const getOwnerName = (ownerId: string) => {
    return owners.find((o) => o.id === ownerId)?.nome || 'Desconhecido';
  };

  const getKRsForOKR = (okrId: string) => {
    return krs.filter((kr) => kr.okrId === okrId);
  };

  const calculateOKRProgress = (okrId: string) => {
    const okrKRs = getKRsForOKR(okrId);
    if (okrKRs.length === 0) return 0;
    const avgProgress = okrKRs.reduce((acc, kr) => {
      return acc + Math.min((kr.valorAtual / kr.meta) * 100, 100);
    }, 0) / okrKRs.length;
    return avgProgress;
  };

  const calculateSemaforo = (valor: number, meta: number): SemaforoStatus => {
    const percent = (valor / meta) * 100;
    if (percent >= 90) return 'verde';
    if (percent >= 70) return 'amarelo';
    return 'vermelho';
  };

  const filteredOKRs = okrs.filter((okr) =>
    okr.titulo.toLowerCase().includes(search.toLowerCase()) ||
    getSectorName(okr.sectorId).toLowerCase().includes(search.toLowerCase())
  );

  // Group by sector
  const okrsBySector = sectors.map((sector) => ({
    sector,
    okrs: filteredOKRs.filter((okr) => okr.sectorId === sector.id),
  })).filter((group) => group.okrs.length > 0);

  const handleUpdateKR = () => {
    if (selectedKR) {
      const newValue = parseFloat(krValue) || selectedKR.valorAtual;
      const newSemaforo = calculateSemaforo(newValue, selectedKR.meta);
      updateKR(selectedKR.id, {
        valorAtual: newValue,
        evidencia: krEvidencia || selectedKR.evidencia,
        semaforo: newSemaforo,
      });
      setSelectedKR(null);
      setKrValue('');
      setKrEvidencia('');
    }
  };

  const redKRsCount = krs.filter((kr) => kr.semaforo === 'vermelho').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            OKRs & KPIs
          </h1>
          <p className="text-muted-foreground">
            {okrs.length} OKRs • {krs.length} KRs monitorados
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          Novo OKR
        </Button>
      </div>

      {/* Alert for Red KRs */}
      {redKRsCount > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-destructive">
                  {redKRsCount} KPI{redKRsCount > 1 ? 's' : ''} em alerta vermelho
                </p>
                <p className="text-sm text-muted-foreground">
                  Ação corretiva obrigatória para KPIs vermelhos
                </p>
              </div>
              <Button variant="destructive" size="sm" asChild>
                <Link to="/incidentes">
                  Criar Incidente
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar OKR ou setor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* OKRs by Sector */}
      <div className="space-y-6">
        {okrsBySector.map(({ sector, okrs: sectorOKRs }) => (
          <div key={sector.id}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: owners.find((o) => o.id === sector.ownerId)?.avatarColor }}
              />
              {sector.nome}
            </h2>

            <Accordion type="multiple" className="space-y-2">
              {sectorOKRs.map((okr) => {
                const okrKRs = getKRsForOKR(okr.id);
                const progress = calculateOKRProgress(okr.id);
                const hasRedKR = okrKRs.some((kr) => kr.semaforo === 'vermelho');

                return (
                  <AccordionItem
                    key={okr.id}
                    value={okr.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <SemaforoBadge status={okr.semaforo} size="lg" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{okr.titulo}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{getOwnerName(okr.ownerId)}</span>
                            <span>•</span>
                            <span className="capitalize">{okr.periodo}</span>
                            <span>•</span>
                            <span>{okrKRs.length} KRs</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mr-4">
                          {hasRedKR && (
                            <Badge variant="destructive" className="text-xs">
                              Alerta
                            </Badge>
                          )}
                          <div className="w-24 hidden sm:block">
                            <Progress value={progress} className="h-2" />
                          </div>
                          <span className="text-sm font-mono w-12 text-right">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        {okr.descricao}
                      </p>

                      <div className="space-y-2">
                        {okrKRs.map((kr) => {
                          const progressPercent = Math.min(
                            (kr.valorAtual / kr.meta) * 100,
                            100
                          );
                          return (
                            <Card
                              key={kr.id}
                              className={`cursor-pointer hover:border-primary/50 transition-colors ${
                                kr.semaforo === 'vermelho' ? 'border-destructive/50 bg-destructive/5' : ''
                              }`}
                              onClick={() => {
                                setSelectedKR(kr);
                                setKrValue(kr.valorAtual.toString());
                                setKrEvidencia(kr.evidencia);
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <SemaforoBadge status={kr.semaforo} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">{kr.nome}</p>
                                      <Badge variant="outline" className="text-[10px]">
                                        {kr.frequencia}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {kr.definicao}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-mono font-medium">
                                      {kr.valorAtual} / {kr.meta}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {progressPercent.toFixed(0)}%
                                    </p>
                                  </div>
                                </div>
                                <Progress
                                  value={progressPercent}
                                  className={`h-1 mt-2 ${
                                    kr.semaforo === 'vermelho'
                                      ? '[&>div]:bg-destructive'
                                      : kr.semaforo === 'amarelo'
                                      ? '[&>div]:bg-[hsl(var(--warning))]'
                                      : ''
                                  }`}
                                />
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {hasRedKR && (
                        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <div className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <p className="text-sm font-medium">Ação corretiva obrigatória</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            KPI vermelho detectado. Crie um incidente para tratar a causa raiz.
                          </p>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="mt-2"
                            asChild
                          >
                            <Link to="/incidentes">
                              Criar Incidente
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        ))}
      </div>

      {/* KR Update Dialog */}
      <Dialog open={!!selectedKR} onOpenChange={() => setSelectedKR(null)}>
        <DialogContent>
          {selectedKR && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <SemaforoBadge status={selectedKR.semaforo} />
                  {selectedKR.nome}
                </DialogTitle>
                <DialogDescription>{selectedKR.definicao}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valor Atual</Label>
                    <Input
                      type="number"
                      value={krValue}
                      onChange={(e) => setKrValue(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Meta</Label>
                    <Input value={selectedKR.meta} disabled className="mt-1" />
                  </div>
                </div>

                <div>
                  <Label>Frequência</Label>
                  <p className="text-sm text-muted-foreground capitalize mt-1">
                    {selectedKR.frequencia}
                  </p>
                </div>

                <div>
                  <Label>Fonte de Dados</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedKR.fonte || 'Não especificada'}
                  </p>
                </div>

                <div>
                  <Label>Evidência / Link</Label>
                  <Textarea
                    placeholder="Cole o link da evidência..."
                    value={krEvidencia}
                    onChange={(e) => setKrEvidencia(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {selectedKR.notes && (
                  <div>
                    <Label>Notas</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedKR.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedKR(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateKR}>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Atualizar KR
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
