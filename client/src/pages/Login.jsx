import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';

const DEMO = [
  { label: 'Admin',  email: 'admin@nexus.com', pass: 'password123' },
  { label: 'BDA',    email: 'bda@nexus.com',   pass: 'password123' },
];

export default function Login() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (d) => { setEmail(d.email); setPassword(d.pass); };

  return (
    <div className="min-h-screen flex">

      {/* ── Left dark panel ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">Nexus</p>
            <p className="text-indigo-400 text-xs">BDA Pipeline Engine</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-4">
            Manufacturing CRM
          </p>
          <h1 className="text-5xl font-bold text-white leading-tight mb-5">
            Close deals<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              faster.
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            From first inquiry to signed contract — track every stage of your manufacturing sales cycle in one unified workspace.
          </p>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { n: '6',     l: 'Pipeline Stages' },
              { n: 'JWT',   l: 'Secure Auth' },
              { n: 'RBAC',  l: 'Role Access' },
            ].map(({ n, l }) => (
              <div key={l} className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <p className="text-indigo-400 font-bold text-lg">{n}</p>
                <p className="text-slate-500 text-xs mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-700 text-xs relative">© 2024 Nexus BDA Pipeline Engine</p>
      </div>

      {/* ── Right light panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" fill="white" />
            </div>
            <span className="text-slate-800 font-bold text-lg">Nexus CRM</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Sign in</h2>
          <p className="text-slate-500 text-sm mb-7">Access your BDA workspace.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                <span className="text-rose-500 mt-0.5">⚠</span>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                           transition-all placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white border border-gray-300 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                             transition-all placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700
                         disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-xl text-sm
                         transition-colors shadow-md shadow-indigo-200"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>Sign in to Nexus <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-bold text-amber-800 mb-2">🔑 Demo credentials</p>
            <div className="space-y-1.5">
              {DEMO.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => fillDemo(d)}
                  className="w-full text-left px-3 py-1.5 bg-white border border-amber-200 rounded-lg
                             hover:border-amber-400 hover:bg-amber-50 transition-colors"
                >
                  <span className="text-xs font-semibold text-amber-800">{d.label}:</span>
                  <span className="text-xs text-amber-700 ml-1">{d.email}</span>
                  <span className="text-xs text-amber-500 ml-1">/ {d.pass}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-amber-600 mt-2">Click a row to auto-fill the form.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
