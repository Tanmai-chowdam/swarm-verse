import React from 'react';
import { SwarmSnapshot, PrecisionMode } from '../engine/types';
import { Sparkles } from 'lucide-react';

interface HistoryTableProps {
  snapshots: SwarmSnapshot[];
  cursor: number;
  onSelectCursor: (val: number) => void;
  precisionMode: PrecisionMode;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  snapshots,
  cursor,
  onSelectCursor,
  precisionMode,
}) => {
  const fmt = (v: number) => {
    if (v === undefined || Number.isNaN(v)) return '—';
    return precisionMode === 'full' ? v.toString() : v.toFixed(4);
  };

  return (
    <div className="bg-space-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
          Iteration History Log
        </h4>
        <span className="text-[11px] font-mono text-slate-500">
          Click any row to jump
        </span>
      </div>

      <div className="max-h-48 overflow-y-auto scrollbar-thin rounded border border-slate-800/80">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-space-950/90 text-slate-400 sticky top-0 z-10 text-[11px] uppercase">
            <tr>
              <th className="py-1.5 px-3">Iter</th>
              <th className="py-1.5 px-3">Best Position</th>
              <th className="py-1.5 px-3">Best Value f</th>
              <th className="py-1.5 px-3">Swarm Avg</th>
              <th className="py-1.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {snapshots.map((s) => {
              const isSelected = s.iteration === cursor;
              const posStr =
                s.gbest.length === 1
                  ? fmt(s.gbest[0])
                  : `(${fmt(s.gbest[0])}, ${fmt(s.gbest[1])})`;

              return (
                <tr
                  key={s.iteration}
                  onClick={() => onSelectCursor(s.iteration)}
                  className={`cursor-pointer transition ${
                    isSelected
                      ? 'bg-cyan-950/60 text-cyan-200 font-semibold border-l-2 border-cyan-400'
                      : 'hover:bg-space-850/60 text-slate-300'
                  }`}
                >
                  <td className="py-1.5 px-3 text-slate-400">t = {s.iteration}</td>
                  <td className="py-1.5 px-3 text-cyan-300">{posStr}</td>
                  <td className="py-1.5 px-3 font-bold text-white">{fmt(s.gbestFitness)}</td>
                  <td className="py-1.5 px-3 text-slate-400">{fmt(s.avgFitness)}</td>
                  <td className="py-1.5 px-3 text-right">
                    {s.gbestUpdated ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" /> New Best
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
