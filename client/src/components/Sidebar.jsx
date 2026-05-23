import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Kanban, Users, Zap, Settings } from 'lucide-react';

const NAV = [
  { to: '/dashboard', label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/pipeline',  label: 'Lead Pipeline',   icon: Kanban },
  { to: '/team',      label: 'Team Performance', icon: Users },
];

const BOTTOM_NAV = [
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full flex-shrink-0 select-none">

      {/* ── Logo ── */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <Zap size={15} className="text-white" fill="white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Nexus</span>
          <span className="bg-indigo-600/20 text-indigo-400 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30">
            BDA
          </span>
        </div>
      </div>

      {/* ── Main Nav ── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">
          Workspace
        </p>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all duration-150 group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}

        <div className="my-4 border-t border-slate-800" />

        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">
          System
        </p>
        {BOTTOM_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-150 group"
          >
            <Icon size={17} className="flex-shrink-0 text-slate-500 group-hover:text-slate-300" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── User Footer ── */}
      <div className="p-3 border-t border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">BD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-300 text-xs font-semibold truncate">BDA Team</p>
            <p className="text-slate-600 text-[10px] truncate">Manufacturing Division</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
