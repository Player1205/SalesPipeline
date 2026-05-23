import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Building2, DollarSign, Calendar, MoreHorizontal, Plus, AlertCircle } from 'lucide-react';
import API from '../api/axios';

// ── Stage configuration ─────────────────────────────────
const STAGES = [
  { id: 'New',           label: 'New',           dotColor: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700',      countBg: 'bg-blue-50 text-blue-600'    },
  { id: 'Contacted',     label: 'Contacted',     dotColor: 'bg-purple-500',  badge: 'bg-purple-100 text-purple-700',  countBg: 'bg-purple-50 text-purple-600' },
  { id: 'Proposal Sent', label: 'Proposal Sent', dotColor: 'bg-yellow-500',  badge: 'bg-yellow-100 text-yellow-800',  countBg: 'bg-yellow-50 text-yellow-700' },
  { id: 'Negotiation',   label: 'Negotiation',   dotColor: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-800',  countBg: 'bg-orange-50 text-orange-700' },
  { id: 'Won',           label: 'Won',           dotColor: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700',countBg: 'bg-emerald-50 text-emerald-600'},
  { id: 'Lost',          label: 'Lost',          dotColor: 'bg-rose-500',    badge: 'bg-rose-100 text-rose-700',      countBg: 'bg-rose-50 text-rose-600'    },
];

// ── Helpers ─────────────────────────────────────────────
const fmt$ = (v) => {
  if (!v && v !== 0) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

const initials = (str) =>
  str ? str.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '?';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

// ── Lead Card ───────────────────────────────────────────
function LeadCard({ lead, index }) {
  return (
    <Draggable draggableId={lead._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-white rounded-lg border p-3.5 cursor-grab active:cursor-grabbing
            transition-all duration-150
            ${snapshot.isDragging
              ? 'shadow-xl border-indigo-300 rotate-1 scale-105'
              : 'shadow-sm border-gray-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300'}
          `}
        >
          {/* Company + menu */}
          <div className="flex items-start justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Building2 size={13} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="font-semibold text-slate-800 text-sm leading-tight truncate">
                {lead.companyName || lead.company || 'Unknown Company'}
              </p>
            </div>
            <button className="p-0.5 text-gray-400 hover:text-gray-600 rounded flex-shrink-0 transition-colors">
              <MoreHorizontal size={15} />
            </button>
          </div>

          {/* Contact name */}
          {lead.contactName && (
            <p className="text-xs text-slate-500 ml-5 mb-2 truncate">{lead.contactName}</p>
          )}

          {/* Deal value */}
          <div className="flex items-center gap-1.5 mb-3">
            <DollarSign size={13} className="text-emerald-500 flex-shrink-0" />
            <span className="text-emerald-600 font-bold text-sm">{fmt$(lead.value)}</span>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
            {lead.assignedTo && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold
                                flex items-center justify-center text-[10px] flex-shrink-0">
                  {initials(lead.assignedTo?.name || String(lead.assignedTo))}
                </div>
                <span className="text-[11px] text-slate-500 truncate max-w-[72px]">
                  {lead.assignedTo?.name || lead.assignedTo}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <Calendar size={11} className="text-gray-400" />
              <span className="text-[11px] text-gray-400">
                {fmtDate(lead.createdAt) || 'Recently'}
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

// ── Stage Column ────────────────────────────────────────
function StageColumn({ stage, leads }) {
  return (
    <div className="flex-shrink-0 w-72 bg-gray-100 rounded-xl flex flex-col max-h-full overflow-hidden">

      {/* Column header */}
      <div className="flex items-center justify-between px-3.5 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stage.dotColor}`} />
          <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${stage.countBg}`}>
            {leads.length}
          </span>
        </div>
        <button className="p-1 text-slate-400 hover:text-slate-700 hover:bg-gray-200 rounded-lg transition-colors">
          <Plus size={14} />
        </button>
      </div>

      {/* Droppable list */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 px-3 pb-3 space-y-2.5 overflow-y-auto scrollbar-thin
              min-h-[100px] rounded-b-xl transition-colors duration-150
              ${snapshot.isDraggingOver ? 'bg-indigo-50/60' : ''}
            `}
          >
            {leads.length === 0 ? (
              <div className="flex items-center justify-center h-20 mt-1">
                <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <p className="text-xs text-gray-400 select-none">No leads in this stage</p>
                </div>
              </div>
            ) : (
              leads.map((lead, idx) => (
                <LeadCard key={lead._id} lead={lead} index={idx} />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

// ── Main KanbanBoard ────────────────────────────────────
export default function KanbanBoard() {
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.get('/leads');
      setLeads(Array.isArray(data) ? data : data.leads ?? []);
    } catch (err) {
      console.error('KanbanBoard fetch error:', err);
      setError('Could not load leads. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Group by stage
  const byStage = (stageId) => leads.filter((l) => l.status === stageId);

  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l._id === draggableId ? { ...l, status: newStatus } : l))
    );

    try {
      await API.put(`/leads/${draggableId}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to persist status change:', err);
      fetchLeads(); // revert on failure
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading pipeline…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center max-w-xs">
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={22} className="text-rose-500" />
        </div>
        <p className="text-slate-700 font-semibold mb-1">Failed to load leads</p>
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <button
          onClick={fetchLeads}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2 h-full scrollbar-thin">
        {STAGES.map((stage) => (
          <StageColumn key={stage.id} stage={stage} leads={byStage(stage.id)} />
        ))}
      </div>
    </DragDropContext>
  );
}
