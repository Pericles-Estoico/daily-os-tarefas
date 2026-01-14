import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useStore } from "@/lib/store";
import { AppLayout } from "@/components/layout/AppLayout";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import Dashboard from "./pages/Dashboard";
import Rotina from "./pages/Rotina";
import Templates from "./pages/Templates";
import Marketplaces from "./pages/Marketplaces";
import Produtos from "./pages/Produtos";
import OKRs from "./pages/OKRs";
import Incidentes from "./pages/Incidentes";
import Testes from "./pages/Testes";
import Pontos from "./pages/Pontos";
import Config from "./pages/Config";
import NotFound from "./pages/NotFound";
import { CopilotDrawer } from "./components/copilot/CopilotDrawer";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/rotina" element={<Rotina />} />
      <Route path="/templates" element={<Templates />} />
      <Route path="/marketplaces" element={<Marketplaces />} />
      <Route path="/produtos" element={<Produtos />} />
      <Route path="/okrs" element={<OKRs />} />
      <Route path="/incidentes" element={<Incidentes />} />
      <Route path="/testes" element={<Testes />} />
      <Route path="/pontos" element={<Pontos />} />
      <Route path="/config" element={<Config />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function MainApp() {
  const isOnboarded = useStore((state) => state.config.isOnboarded);

  if (!isOnboarded) {
    return <OnboardingFlow />;
  }

  return (
    <AppLayout>
      <AppRoutes />
      <CopilotDrawer />
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
