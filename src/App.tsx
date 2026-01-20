import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OpsProvider } from '@/contexts/OpsContext';
import { OpsLayout } from '@/components/ops/OpsLayout';
import { Toaster } from 'sonner';

// Pages
import { Dashboard } from '@/pages/ops/Dashboard';
import { Rotina } from '@/pages/ops/Rotina';
import { Templates } from '@/pages/ops/Templates';
import { Marketplaces } from '@/pages/ops/Marketplaces';
import { Produtos } from '@/pages/ops/Produtos';
import { OKRs } from '@/pages/ops/OKRs';
import { Incidentes } from '@/pages/ops/Incidentes';
import { Testes } from '@/pages/ops/Testes';
import { Pontos } from '@/pages/ops/Pontos';
import { Configuracoes } from '@/pages/ops/Configuracoes';
import { ImportarVendas } from '@/pages/ops/ImportarVendas';

function App() {
  return (
    <OpsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<OpsLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/rotina" element={<Rotina />} />
            <Route path="/importar-vendas" element={<ImportarVendas />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/marketplaces" element={<Marketplaces />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/okrs" element={<OKRs />} />
            <Route path="/incidentes" element={<Incidentes />} />
            <Route path="/testes" element={<Testes />} />
            <Route path="/pontos" element={<Pontos />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </OpsProvider>
  );
}

export default App;
