import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Users, Building2, CheckCircle2 } from 'lucide-react';

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState('Minha Empresa');
  const [metaDiaria, setMetaDiaria] = useState(10000);

  const updateConfig = useStore((state) => state.updateConfig);
  const loadSeedData = useStore((state) => state.loadSeedData);
  const completeOnboarding = useStore((state) => state.completeOnboarding);
  const owners = useStore((state) => state.owners);
  const sectors = useStore((state) => state.sectors);

  const handleComplete = () => {
    updateConfig({ nome: workspaceName, metaDiaria });
    completeOnboarding();
  };

  const steps = [
    {
      title: 'Bem-vindo ao OS Execução',
      description: 'Configure seu workspace para começar',
      icon: Rocket,
    },
    {
      title: 'Equipe',
      description: 'Confirme os donos de cada área',
      icon: Users,
    },
    {
      title: 'Setores',
      description: 'Confirme os setores da operação',
      icon: Building2,
    },
    {
      title: 'Pronto!',
      description: 'Seu sistema está configurado',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {(() => {
              const StepIcon = steps[step].icon;
              return <StepIcon className="h-6 w-6 text-primary" />;
            })()}
          </div>
          <CardTitle>{steps[step].title}</CardTitle>
          <CardDescription>{steps[step].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace">Nome do Workspace</Label>
                <Input
                  id="workspace"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Ex: Loja Premium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta">Meta Diária (R$)</Label>
                <Input
                  id="meta"
                  type="number"
                  value={metaDiaria}
                  onChange={(e) => setMetaDiaria(Number(e.target.value))}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  updateConfig({ nome: workspaceName, metaDiaria });
                  loadSeedData();
                  setStep(1);
                }}
              >
                Continuar
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {owners.map((owner) => (
                  <div
                    key={owner.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{ backgroundColor: owner.avatarColor, color: 'white' }}
                      >
                        {owner.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{owner.nome}</p>
                        <p className="text-xs text-muted-foreground">{owner.cargo}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Ativo</Badge>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                  Voltar
                </Button>
                <Button onClick={() => setStep(2)} className="flex-1">
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {sectors.map((sector) => {
                  const owner = owners.find((o) => o.id === sector.ownerId);
                  return (
                    <div
                      key={sector.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium text-sm">{sector.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Owner: {owner?.nome}
                        </p>
                      </div>
                      <Badge variant="outline">Ativo</Badge>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Voltar
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="py-4">
                <CheckCircle2 className="h-16 w-16 mx-auto text-[hsl(var(--success))]" />
                <p className="mt-4 text-muted-foreground">
                  Seu workspace <strong>{workspaceName}</strong> está pronto com:
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-muted">
                    <p className="font-bold text-lg">{owners.length}</p>
                    <p className="text-muted-foreground">Owners</p>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <p className="font-bold text-lg">{sectors.length}</p>
                    <p className="text-muted-foreground">Setores</p>
                  </div>
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={handleComplete}>
                Começar a Executar 🚀
              </Button>
            </div>
          )}
        </CardContent>

        {/* Step Indicator */}
        <div className="px-6 pb-6">
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  index <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
