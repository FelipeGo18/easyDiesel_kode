import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ReportesPage } from '@/pages/ReportesPage';
import { AuditoriaPage } from '@/pages/AuditoriaPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ZonasPage } from '@/pages/admin/ZonasPage';
import { DecretosPage } from '@/pages/admin/DecretosPage';
import { PreciosPage } from '@/pages/admin/PreciosPage';
import { UsuariosPage } from '@/pages/admin/UsuariosPage';
import { InventarioPage } from '@/pages/admin/InventarioPage';
import { ActoresPage } from '@/pages/admin/ActoresPage';
import { TanquesPage } from '@/pages/admin/TanquesPage';
import type { ReactNode } from 'react';

/* ── Protected route wrapper ── */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-enter">
          <div className="w-12 h-12">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                <radialGradient id="dg-load" cx="38%" cy="28%" r="70%">
                  <stop offset="0%" stopColor="#FFD580" />
                  <stop offset="50%" stopColor="#F5A623" />
                  <stop offset="100%" stopColor="#AA6A00" />
                </radialGradient>
                <radialGradient id="hbg-load" cx="50%" cy="38%" r="62%">
                  <stop offset="0%" stopColor="#1e1100" />
                  <stop offset="100%" stopColor="#060400" />
                </radialGradient>
              </defs>
              <path d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z" fill="url(#hbg-load)" />
              <path d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z" stroke="#F5A623" strokeWidth="2.2" fill="none" strokeLinejoin="miter" className="status-live" />
              <path d="M50 21 C50 21 34 43 34 57 C34 67.5 41.3 76 50 76 C58.7 76 66 67.5 66 57 C66 43 50 21 50 21 Z" fill="url(#dg-load)" />
            </svg>
          </div>
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
            Cargando...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public routes ── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Protected routes — inside AppLayout ── */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/zonas" element={<ZonasPage />} />
        <Route path="/precios" element={<PreciosPage />} />
        <Route path="/actores" element={<ActoresPage />} />
        <Route path="/tanques" element={<TanquesPage />} />
        <Route path="/normativa" element={<DecretosPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/estacion" element={<InventarioPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/auditoria" element={<AuditoriaPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ── Placeholder for future modules ── */
function PlaceholderPage({ title, moduleId }: { title: string; moduleId: string }) {
  return (
    <div className="animate-enter">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-h1 text-text-primary">{title}</h1>
        <span className="text-[9px] font-mono text-text-muted tracking-wider bg-bg-elevated px-2 py-0.5 rounded-[2px] border border-border-subtle">
          {moduleId}
        </span>
      </div>
      <p className="text-small text-text-secondary mb-8">
        Este módulo está en desarrollo.
      </p>

      <div className="border border-border-subtle border-dashed rounded-brand p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-brand bg-bg-elevated border border-border-default flex items-center justify-center">
            <span className="text-amber-500 font-mono text-[14px] font-semibold">{moduleId}</span>
          </div>
          <p className="text-[13px] text-text-secondary">Contenido del módulo {title}</p>
          <p className="text-[10px] font-mono text-text-muted mt-1 tracking-wider uppercase">Próximamente</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
