import { useState, useEffect } from 'react';
import {
  DollarSign, Users, TrendingUp, Target,
  ArrowUpRight, ArrowDownRight, Activity,
} from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

// ── Stage badge colours ─────────────────────────────────
const BADGE = {
  'New':           'bg-blue-100 text-blue-700',
  'Contacted':     'bg-purple-100 text-purple-700',
  'Proposal Sent': 'bg-yellow-100 text-yellow-800',
  'Negotiation':   'bg-orange-100 text-orange-800',
  'Won':           'bg-emerald-100 text-emerald-700',
  'Lost':          'bg-rose-100 text-rose-700',
};

const STAGE_META = {
  'New':           { bar: 'bg-blue-500'    },
  'Contacted':     { bar: 'bg-purple-500'  },
  'Proposal Sent': { bar: 'bg-yellow-500'  },
  'Negotiation':   { bar: 'bg-orange-500'  },
  'Won':           { bar: 'bg-emerald-500' },
  'Lost':          { bar: 'bg-rose-500'    },
};

// ── Helpers ─────────────────────────────────────────────
const fmt$ = (v = 0) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v}`;
};

const initials = (s = '') =>
  s.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

// Returns leads created in the last 7 days
const recentCount = (leads) => {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return leads.filter((l) => new Date(l.createdAt).getTime() > cutoff).length;
};

// ── Metric Card ─────────────────────────────────────────
function MetricCard({ title, value, sub, Icon, iconBg, trend, trendLabel }) {
  const isUp = trend === 'up';
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon size={20} />
        </div>
      </div>
      {trendLabel && (
        <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
          {isUp
            ? <ArrowUpRight size={15} className="text-emerald-500" />
            : <ArrowDownRight size={15} className="text-rose-500" />}
          <span className={`text-xs font-semibold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trendLabel}
          </span>
          <span className="text-xs text-slate-400">vs last month</span>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────
export default function Dashboard() {
  const { user }  = useAuth();
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/leads')
      .then(({ data }) => setLeads(Array.isArray(data) ? data : data.leads ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Computed metrics (all derived from live data) ─────
  const active      = leads.filter((l) => !['Won', 'Lost'].includes(l.status));
  const won         = leads.filter((l) => l.status === 'Won');
  const pipelineVal = active.reduce((s, l) => s + (l.value || 0), 0);
  const wonVal      = won.reduce((s, l) => s + (l.value || 0), 0);
  const convRate    = leads.length ? ((won.length / leads.length) * 100).toFixed(1) : '0.0';
  const newThisWeek = recentCount(leads);

  const stageCounts = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  const recent = [...leads]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 9);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
          {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Here's your pipeline snapshot for{' '}
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Pipeline Value"
          value={fmt$(pipelineVal)}
          sub={`${active.length} active deal${active.length !== 1 ? 's' : ''}`}
          Icon={DollarSign}
          iconBg="bg-indigo-100 text-indigo-600"
        />
        <MetricCard
          title="Active Leads"
          value={active.length}
          sub={`${leads.length} leads total`}
          Icon={Users}
          iconBg="bg-blue-100 text-blue-600"
          trend={newThisWeek > 0 ? 'up' : undefined}
          trendLabel={newThisWeek > 0 ? `+${newThisWeek} this week` : undefined}
        />
        <MetricCard
          title="Won Revenue"
          value={fmt$(wonVal)}
          sub={`${won.length} deal${won.length !== 1 ? 's' : ''} closed`}
          Icon={TrendingUp}
          iconBg="bg-emerald-100 text-emerald-600"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${convRate}%`}
          sub="Lead-to-close ratio"
          Icon={Target}
          iconBg="bg-orange-100 text-orange-600"
          trend={parseFloat(convRate) >= 20 ? 'up' : 'down'}
          trendLabel={`${convRate}% overall`}
        />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent leads table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Recent Leads</h2>
            </div>
            <span className="text-xs text-slate-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {leads.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Company', 'Stage', 'Value', 'Assigned'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                      No leads yet — add your first lead in the Pipeline view.
                    </td>
                  </tr>
                ) : (
                  recent.map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[160px]">
                          {lead.companyName || lead.company || '—'}
                        </p>
                        {lead.contactPerson && (
                          <p className="text-xs text-slate-400 truncate">{lead.contactPerson}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${BADGE[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-bold text-emerald-600">{fmt$(lead.value)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold
                                          flex items-center justify-center text-xs flex-shrink-0">
                            {initials(lead.assignedTo?.name || String(lead.assignedTo || 'U'))}
                          </div>
                          <span className="text-xs text-slate-600 truncate max-w-[80px]">
                            {lead.assignedTo?.name || lead.assignedTo || 'Unassigned'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-slate-800">Pipeline Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Leads by stage</p>
          </div>
          <div className="p-5 space-y-4">
            {Object.entries(STAGE_META).map(([stage, { bar }]) => {
              const count = stageCounts[stage] || 0;
              const pct   = leads.length ? Math.round((count / leads.length) * 100) : 0;
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[stage]}`}>
                      {stage}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-700">{count}</span>
                      <span className="text-xs text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`${bar} h-full rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total summary */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Total leads tracked</span>
              <span className="text-sm font-bold text-slate-800">{leads.length}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
