import { useState } from 'react';
import { Plus, RefreshCw, SlidersHorizontal } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';

export default function Pipeline() {
  const [boardKey, setBoardKey] = useState(0);

  return (
    <div className="h-full flex flex-col gap-5">

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
            onClick={() => setBoardKey((k) => k + 1)}
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
