import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { LayoutDashboard, ListChecks, Target, AlertTriangle, Beaker, Trophy, Settings, Store, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const nav = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/rotina', icon: ListChecks, label: 'Rotina' },
  { href: '/okrs', icon: Target, label: 'OKRs & KPIs' },
  { href: '/incidentes', icon: AlertTriangle, label: 'Incidentes' },
  { href: '/testes', icon: Beaker, label: 'Testes' },
  { href: '/pontos', icon: Trophy, label: 'Pontos' },
  { href: '/config', icon: Settings, label: 'Configurações' },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const config = useStore((state) => state.config);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur h-14 flex items-center px-4 gap-4">
        <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button></SheetTrigger><SheetContent side="left" className="w-64"><nav className="space-y-1 mt-4">{nav.map((n) => <Link key={n.href} to={n.href} onClick={() => setOpen(false)} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm', location.pathname === n.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}><n.icon className="h-4 w-4" />{n.label}</Link>)}</nav></SheetContent></Sheet>
        <Link to="/" className="flex items-center gap-2"><Store className="h-6 w-6 text-primary" /><span className="font-bold hidden sm:inline">{config.nome || 'OS Marketplaces'}</span></Link>
      </header>
      <div className="flex">
        <aside className="hidden lg:flex w-56 flex-col border-r min-h-[calc(100vh-3.5rem)] p-4"><nav className="space-y-1">{nav.map((n) => <Link key={n.href} to={n.href} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm', location.pathname === n.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}><n.icon className="h-4 w-4" />{n.label}</Link>)}</nav></aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
