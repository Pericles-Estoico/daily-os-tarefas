import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import {
  LayoutDashboard,
  ListChecks,
  Target,
  AlertTriangle,
  Beaker,
  FileText,
  Trophy,
  Database,
  Settings,
  Menu,
  X,
  Plus,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { CopilotDrawer } from '@/components/copilot/CopilotDrawer';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Rotina', href: '/rotina', icon: ListChecks },
  { name: 'OKRs & KPIs', href: '/okrs', icon: Target },
  { name: 'Incidentes', href: '/incidentes', icon: AlertTriangle },
  { name: 'Testes', href: '/testes', icon: Beaker },
  { name: 'Canvas & Ritual', href: '/canvas', icon: FileText },
  { name: 'Pontos', href: '/pontos', icon: Trophy },
  { name: 'Registros', href: '/registros', icon: Database },
  { name: 'Configurações', href: '/config', icon: Settings },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const config = useStore((state) => state.config);
  const scoreEntries = useStore((state) => state.scoreEntries);

  const today = new Date().toISOString().split('T')[0];
  const todayScore = scoreEntries.find((s) => s.date === today);
  const receita = todayScore?.receita || 0;
  const progress = Math.min((receita / config.metaDiaria) * 100, 100);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: config.moeda,
    }).format(value);
  };

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-sidebar lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-sidebar-border p-4">
            <h1 className="text-lg font-bold text-sidebar-foreground">
              OS Execução
            </h1>
            <p className="text-xs text-muted-foreground">Máquina R$10K/DIA</p>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <NavLinks />
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background lg:hidden">
        <div className="flex items-center justify-around py-2">
          {navigation.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            );
          })}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground">
                <Menu className="h-5 w-5" />
                <span className="text-[10px]">Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-background">
              <div className="py-4">
                <NavLinks onNavigate={() => setMobileMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Top Bar */}
      <header className="fixed left-0 right-0 top-0 z-30 border-b border-border bg-background lg:left-64">
        <div className="flex h-14 items-center gap-4 px-4">
          {/* Progress to Goal */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <p className="text-xs text-muted-foreground">Hoje</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(receita)} / {formatCurrency(config.metaDiaria)}
                </p>
              </div>
              <div className="flex-1 max-w-xs">
                <Progress value={progress} className="h-2" />
              </div>
              <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setCopilotOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Copiloto</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 pb-20 lg:pl-64 lg:pb-4">
        <div className="p-4 lg:p-6">{children}</div>
      </main>

      {/* Copilot Drawer */}
      <CopilotDrawer open={copilotOpen} onOpenChange={setCopilotOpen} />
    </div>
  );
}
