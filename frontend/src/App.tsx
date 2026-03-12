import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { useAuth } from '@/context/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import type { ReactNode } from 'react';
import { protectedRoutes, publicRoutes } from '@/features/routing/appRoutes';
import { useAccess } from '@/hooks/useAccess';
import { useLenis } from '@/hooks/useLenis';

/* ── Protected route wrapper ── */
function ProtectedRoute({ children, requiredPermissions = [] }: { children: ReactNode; requiredPermissions?: string[] }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasAnyPermission } = useAccess();

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

  if (requiredPermissions.length && !hasAnyPermission(...requiredPermissions)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {publicRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {/* ── Protected routes — inside AppLayout ── */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {protectedRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<ProtectedRoute requiredPermissions={route.requiredPermissions}>{route.element}</ProtectedRoute>}
          />
        ))}
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  useLenis();
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
