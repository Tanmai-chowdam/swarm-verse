import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from 'recharts';
import { SwarmSnapshot, PrecisionMode } from '../engine/types';

interface ConvergenceChartProps {
  snapshots: SwarmSnapshot[];
  cursor: number;
  onSelectCursor: (val: number) => void;
  precisionMode: PrecisionMode;
}

export const ConvergenceChart: React.FC<ConvergenceChartProps> = ({
  snapshots,
  cursor,
  onSelectCursor,
  precisionMode,
}) => {
  const chartData = snapshots.map((s) => ({
    iteration: s.iteration,
    gbestFitness: Number.isFinite(s.gbestFitness) ? s.gbestFitness : null,
    avgFitness: Number.isFinite(s.avgFitness) ? s.avgFitness : null,
    improved: s.gbestUpdated,
  }));

  const currentSnapshot = snapshots[cursor];
  const fmt = (v: number | null) => {
    if (v === null || v === undefined) return '—';
    return precisionMode === 'full' ? v.toString() : v.toFixed(4);
  };

  return (
    <div className="bg-space-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Convergence Curve: Global Best f(x)
          </h4>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-400" /> Best Found
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-500 stroke-dasharray-2" /> Swarm Avg
          </span>
        </div>
      </div>

      <div className="w-full h-44 select-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            onClick={(e) => {
              if (e && e.activeTooltipIndex !== undefined) {
                onSelectCursor(e.activeTooltipIndex);
              }
            }}
            margin={{ top: 10, right: 15, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis
              dataKey="iteration"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              label={{ value: 'Iteration (t)', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 10 }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              domain={['auto', 'auto']}
              width={45}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-space-950/95 border border-slate-700 p-2 rounded shadow-lg text-xs font-mono">
                      <div className="text-cyan-400 font-bold mb-1">Iteration {label}</div>
                      <div className="text-amber-400">
                        Best: {fmt(payload[0]?.value as number)}
                      </div>
                      {payload[1] && (
                        <div className="text-slate-300">
                          Avg: {fmt(payload[1]?.value as number)}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="gbestFitness"
              name="Best Fitness"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="avgFitness"
              name="Avg Fitness"
              stroke="#06b6d4"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              opacity={0.6}
              isAnimationActive={false}
            />
            {currentSnapshot && Number.isFinite(currentSnapshot.gbestFitness) && (
              <ReferenceDot
                x={cursor}
                y={currentSnapshot.gbestFitness}
                r={5}
                fill="#f59e0b"
                stroke="#fff"
                strokeWidth={1.5}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
