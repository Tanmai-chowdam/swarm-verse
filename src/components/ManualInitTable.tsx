import React, { useState } from 'react';
import { Dimension } from '../engine/types';

interface ManualInitTableProps {
  dimension: Dimension;
  numParticles: number;
  initialPositions?: number[][];
  initialVelocities?: number[][];
  onSaveManualState: (positions?: number[][], velocities?: number[][]) => void;
}

export const ManualInitTable: React.FC<ManualInitTableProps> = ({
  dimension,
  numParticles,
  initialPositions,
  initialVelocities,
  onSaveManualState,
}) => {
  // Local state for manual positions and velocities
  const [positions, setPositions] = useState<number[][]>(() => {
    if (initialPositions && initialPositions.length >= numParticles) {
      return initialPositions.map((p) => [...p]);
    }
    return Array.from({ length: numParticles }, () =>
      Array.from({ length: dimension }, () => 0)
    );
  });

  const [velocities, setVelocities] = useState<number[][]>(() => {
    if (initialVelocities && initialVelocities.length >= numParticles) {
      return initialVelocities.map((v) => [...v]);
    }
    return Array.from({ length: numParticles }, () =>
      Array.from({ length: dimension }, () => 0)
    );
  });

  const handlePosChange = (pIdx: number, dIdx: number, val: number) => {
    const updated = positions.map((p, i) =>
      i === pIdx ? p.map((coord, d) => (d === dIdx ? val : coord)) : [...p]
    );
    setPositions(updated);
  };

  const handleVelChange = (pIdx: number, dIdx: number, val: number) => {
    const updated = velocities.map((v, i) =>
      i === pIdx ? v.map((coord, d) => (d === dIdx ? val : coord)) : [...v]
    );
    setVelocities(updated);
  };

  const handleApply = () => {
    onSaveManualState(positions, velocities);
  };

  const handleResetToRandom = () => {
    onSaveManualState(undefined, undefined);
  };

  return (
    <div className="bg-space-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="font-semibold text-slate-100 text-sm">
          Manual Particle Initialization (x₀, v₀)
        </h3>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
          Deterministic Override
        </span>
      </div>

      <div className="text-xs text-slate-400">
        Explicitly configure initial starting coordinates (x₀) and initial velocities (v₀) for each particle. Overrides random initialization.
      </div>

      <div className="max-h-64 overflow-y-auto scrollbar-thin border border-slate-800 rounded">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-space-950 text-slate-400 sticky top-0 text-[11px] uppercase">
            <tr>
              <th className="py-2 px-3">Particle</th>
              <th className="py-2 px-3">x₀ (dim 1)</th>
              {dimension === 2 && <th className="py-2 px-3">y₀ (dim 2)</th>}
              <th className="py-2 px-3">v₀ (dim 1)</th>
              {dimension === 2 && <th className="py-2 px-3">v_y₀ (dim 2)</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {positions.map((p, i) => (
              <tr key={i} className="hover:bg-space-850">
                <td className="py-1.5 px-3 font-bold text-cyan-400">P{i + 1}</td>
                <td className="py-1.5 px-3">
                  <input
                    type="number"
                    step={0.1}
                    value={p[0] ?? 0}
                    onChange={(e) => handlePosChange(i, 0, Number(e.target.value))}
                    className="w-20 bg-space-950 border border-slate-700 rounded px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
                  />
                </td>
                {dimension === 2 && (
                  <td className="py-1.5 px-3">
                    <input
                      type="number"
                      step={0.1}
                      value={p[1] ?? 0}
                      onChange={(e) => handlePosChange(i, 1, Number(e.target.value))}
                      className="w-20 bg-space-950 border border-slate-700 rounded px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
                    />
                  </td>
                )}
                <td className="py-1.5 px-3">
                  <input
                    type="number"
                    step={0.1}
                    value={velocities[i]?.[0] ?? 0}
                    onChange={(e) => handleVelChange(i, 0, Number(e.target.value))}
                    className="w-20 bg-space-950 border border-slate-700 rounded px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
                  />
                </td>
                {dimension === 2 && (
                  <td className="py-1.5 px-3">
                    <input
                      type="number"
                      step={0.1}
                      value={velocities[i]?.[1] ?? 0}
                      onChange={(e) => handleVelChange(i, 1, Number(e.target.value))}
                      className="w-20 bg-space-950 border border-slate-700 rounded px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleApply}
          className="flex-1 py-2 rounded-lg font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition active:scale-98 shadow"
        >
          Apply Manual State
        </button>
        <button
          onClick={handleResetToRandom}
          className="px-3 py-2 rounded-lg font-mono text-xs bg-space-850 hover:bg-space-800 text-slate-300 border border-slate-700 transition"
        >
          Revert to Random
        </button>
      </div>
    </div>
  );
};
