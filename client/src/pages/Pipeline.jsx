import { useState } from 'react';
import { Plus, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import API from '../api/axios';

const STAGES = ['New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

function AddLeadModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    companyName: '', contactName: '', contactEmail: '',
    contactPhone: '', value: '', stage: 'New', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await API.post('/leads', { ...form, value: Number(form.value) });
      onCreated();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-slate-800">Add New Lead</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name *</label>
              <input required value={form.companyName} onChange={set('companyName')} placeholder="Acme Manufacturing"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Name *</label>
              <input required value={form.contactName} onChange={set('contactName')} placeholder="John Smith"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Deal Value ($) *</label>
              <input required type="number" min="0" value={form.value} onChange={set('value')} placeholder="50000"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input type="email" value={form.contactEmail} onChange={set('contactEmail')} placeholder="john@acme.com"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
              <input value={form.contactPhone} onChange={set('contactPhone')} placeholder="+1 555 0100"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Stage</label>
              <select value={form.stage} onChange={set('stage')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white">
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
              <textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Any context about this lead…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-md shadow-indigo-200">
              {loading ? 'Creating…' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Pipeline() {
  const [boardKey, setBoardKey]   = useState(0);
  const [showModal, setShowModal] = useState(false);

  const refresh = () => setBoardKey((k) => k + 1);

  return (
    <div className="h-full flex flex-col gap-5">

      {showModal && (
        <AddLeadModal
          onClose={() => setShowModal(false)}
          onCreated={refresh}
        />
      )}

      {/* Page header */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lead Pipeline</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Drag cards between columns to update a lead's stage in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={refresh}
            title="Refresh board"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-gray-200
                       bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:block">Refresh</span>
          </button>

          <button
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-gray-200
                       bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:block">Filter</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white
                       bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
          >
            <Plus size={15} />
            Add Lead
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard key={boardKey} />
      </div>
    </div>
  );
}
