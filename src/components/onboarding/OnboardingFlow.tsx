import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Users, Store, CheckCircle2 } from 'lucide-react';

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState('Minha Operação');
  const [metaDiaria, setMetaDiaria] = useState(10000);

  const updateConfig = useStore((state) => state.updateConfig);
  const loadSeedData = useStore((state) => state.loadSeedData);
  const completeOnboarding = useStore((state) => state.completeOnboarding);
  const owners = useStore((state) => state.owners);
  const marketplaces = useStore((state) => state.marketplaces);

  const handleComplete = () => {
    updateConfig({ nome: workspaceName, metaDiaria });
    completeOnboarding();
  };

  const steps = [
    { title: 'Bem-vindo ao OS Marketplaces', description: 'Configure seu workspace para atingir R$ 10K/dia', icon: Rocket },
    { title: 'Equipe', description: 'Confirme os owners da operação', icon: Users },
    { title: 'Marketplaces', description: 'Confirme os canais de venda', icon: Store },
    { title: 'Pronto!', description: 'Seu sistema operacional está configurado', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {(() => { const StepIcon = steps[step].icon; return <StepIcon className="h-6 w-6 text-primary" />; })()}
          </div>
          <CardTitle>{steps[step].title}</CardTitle>
          <CardDescription>{steps[step].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Workspace</Label>
                <Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Meta Diária (R$)</Label>
                <Input type="number" value={metaDiaria} onChange={(e) => setMetaDiaria(Number(e.target.value))} />
              </div>
              <Button className="w-full" onClick={() => { updateConfig({ nome: workspaceName, metaDiaria }); loadSeedData(); setStep(1); }}>
                Carregar Dados Demo & Continuar
              </Button>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {owners.map((owner) => (
                  <div key={owner.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: owner.avatarColor }}>{owner.nome.charAt(0)}</div>
                      <div><p className="font-medium">{owner.nome}</p><p className="text-xs text-muted-foreground">{owner.cargo}</p></div>
                    </div>
                    <Badge variant="secondary">{owner.schedule === 'ALL_DAYS' ? 'Todo dia' : 'Seg-Sex'}</Badge>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Voltar</Button>
                <Button onClick={() => setStep(2)} className="flex-1">Continuar</Button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {marketplaces.map((mp) => (
                  <div key={mp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant={mp.priority === 'P1' ? 'destructive' : 'secondary'}>{mp.priority}</Badge>
                      <div><p className="font-medium text-sm">{mp.name}</p><p className="text-xs text-muted-foreground">{mp.stage}</p></div>
                    </div>
                    <Badge variant="outline">{mp.cadence}</Badge>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
                <Button onClick={() => setStep(3)} className="flex-1">Continuar</Button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
              <p className="text-muted-foreground">Workspace <strong>{workspaceName}</strong> pronto com {owners.length} owners e {marketplaces.length} marketplaces!</p>
              <Button className="w-full" size="lg" onClick={handleComplete}>Começar a Executar 🚀</Button>
            </div>
          )}
        </CardContent>
        <div className="px-6 pb-6 flex justify-center gap-2">
          {steps.map((_, i) => <div key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />)}
        </div>
      </Card>
    </div>
  );
}
