import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar  from './components/Sidebar';
import Navbar   from './components/Navbar';
import Login    from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';

/**
 * ProtectedLayout
 * ──────────────
 * Renders the full app shell (Sidebar + Navbar + main content area).
 * Redirects to /login if the user is not authenticated.
 */
function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Nexus…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Fixed left sidebar */}
      <Sidebar />

      {/* Main column: top navbar + scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/**
 * App
 * ───
 * Root component. Sets up AuthProvider + React Router.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected shell */}
          <Route element={<ProtectedLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pipeline"  element={<Pipeline />} />
            {/* Catch-all inside shell */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
