import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { PacientesPage } from './pages/PacientesPage';
import { EntradaDadosPage } from './pages/EntradaDadosPage';
import { DashboardPage } from './pages/DashboardPage';
import { ComparacaoPage } from './pages/ComparacaoPage';
import { ExportarPage } from './pages/ExportarPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pacientes" element={<PacientesPage />} />
          <Route path="/entrada" element={<EntradaDadosPage />} />
          <Route path="/entrada/:id" element={<EntradaDadosPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/comparacao" element={<ComparacaoPage />} />
          <Route path="/exportar" element={<ExportarPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
