import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListChecks, 
  FileText, 
  Store, 
  Package, 
  Target, 
  AlertTriangle, 
  FlaskConical, 
  Trophy, 
  Settings,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MENU_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/rotina', label: 'Rotina', icon: ListChecks },
  { path: '/importar-vendas', label: 'Importar Vendas', icon: Upload },
  { path: '/templates', label: 'Templates', icon: FileText },
  { path: '/marketplaces', label: 'Marketplaces', icon: Store },
  { path: '/produtos', label: 'Produtos', icon: Package },
  { path: '/okrs', label: 'OKRs & KPIs', icon: Target },
  { path: '/incidentes', label: 'Incidentes', icon: AlertTriangle },
  { path: '/testes', label: 'Testes', icon: FlaskConical },
  { path: '/pontos', label: 'Pontos', icon: Trophy },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function OpsLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r bg-card">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Marketplace Ops OS</h1>
          <p className="text-xs text-muted-foreground">v1.0</p>
        </div>
        
        <nav className="p-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
