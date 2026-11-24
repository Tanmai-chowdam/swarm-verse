import React from 'react';
import { InertiaConfig, BoundaryMode, VelocityClamping } from '../engine/types';
import { Sliders, Dices } from 'lucide-react';

interface ParamPanelProps {
  numParticles: number;
  onNumParticlesChange: (val: number) => void;
  maxIterations: number;
  onMaxIterationsChange: (val: number) => void;
  inertia: InertiaConfig;
  onInertiaChange: (val: InertiaConfig) => void;
  c1: number;
  onC1Change: (val: number) => void;
  c2: number;
  onC2Change: (val: number) => void;
  boundaryMode: BoundaryMode;
  onBoundaryModeChange: (val: BoundaryMode) => void;
  velocityClamping: VelocityClamping;
  onVelocityClampingChange: (val: VelocityClamping) => void;
  seed: number;
  onSeedChange: (val: number) => void;
  onRerollSeed: () => void;
}

export const ParamPanel: React.FC<ParamPanelProps> = ({
  numParticles,
  onNumParticlesChange,
  maxIterations,
  onMaxIterationsChange,
  inertia,
  onInertiaChange,
  c1,
  onC1Change,
  c2,
  onC2Change,
  boundaryMode,
  onBoundaryModeChange,
  velocityClamping,
  onVelocityClampingChange,
  seed,
  onSeedChange,
  onRerollSeed,
}) => {
  return (
    <div className="bg-space-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide">
            Swarm Hyperparameters
          </h3>
        </div>
      </div>

      {/* Particle Count N & Iterations T */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-mono text-slate-400 uppercase">
            Swarm Size (N)
          </label>
          <input
            type="number"
            min={2}
            max={100}
            value={numParticles}
            onChange={(e) => onNumParticlesChange(Math.max(2, Number(e.target.value)))}
            className="bg-space-950 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-mono text-slate-400 uppercase">
            Max Iterations (T)
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={maxIterations}
            onChange={(e) => onMaxIterationsChange(Math.max(1, Number(e.target.value)))}
            className="bg-space-950 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Inertia Weight w (Fixed vs Linear Schedule) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono text-slate-400 uppercase">
            Inertia Weight (w)
          </label>
          <div className="flex gap-1 text-[10px] font-mono">
            <button
              onClick={() => onInertiaChange({ type: 'fixed', w: inertia.w, w0: inertia.w, w1: inertia.w })}
              className={`px-2 py-0.5 rounded ${
                inertia.type === 'fixed'
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fixed
            </button>
            <button
              onClick={() => onInertiaChange({ type: 'linear', w: inertia.w, w0: 0.9, w1: 0.4 })}
              className={`px-2 py-0.5 rounded ${
                inertia.type === 'linear'
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Linear Schedule
            </button>
          </div>
        </div>

        {inertia.type === 'fixed' ? (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.05}
              value={inertia.w}
              onChange={(e) =>
                onInertiaChange({ ...inertia, w: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-space-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="font-mono text-xs text-cyan-300 w-12 text-right">
              {inertia.w.toFixed(2)}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">w₀:</span>
              <input
                type="number"
                step={0.05}
                value={inertia.w0}
                onChange={(e) => onInertiaChange({ ...inertia, w0: Number(e.target.value) })}
                className="w-full bg-space-950 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">w₁:</span>
              <input
                type="number"
                step={0.05}
                value={inertia.w1}
                onChange={(e) => onInertiaChange({ ...inertia, w1: Number(e.target.value) })}
                className="w-full bg-space-950 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Acceleration Coefficients c1 & c2 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-mono text-slate-400 uppercase">
            Cognitive c₁
          </label>
          <input
            type="number"
            step={0.1}
            min={0}
            max={4}
            value={c1}
            onChange={(e) => onC1Change(Number(e.target.value))}
            className="bg-space-950 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-purple-300 outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-mono text-slate-400 uppercase">
            Social c₂
          </label>
          <input
            type="number"
            step={0.1}
            min={0}
            max={4}
            value={c2}
            onChange={(e) => onC2Change(Number(e.target.value))}
            className="bg-space-950 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-pink-300 outline-none focus:border-pink-500"
          />
        </div>
      </div>

      {/* Boundary Mode */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-mono text-slate-400 uppercase">
          Boundary Constraint Handling
        </label>
        <div className="grid grid-cols-3 gap-1 bg-space-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => onBoundaryModeChange('clip')}
            className={`py-1 rounded font-semibold transition ${
              boundaryMode === 'clip'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Clip (Standard)
          </button>
          <button
            onClick={() => onBoundaryModeChange('reflect')}
            className={`py-1 rounded font-semibold transition ${
              boundaryMode === 'reflect'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Reflect
          </button>
          <button
            onClick={() => onBoundaryModeChange('none')}
            className={`py-1 rounded font-semibold transition ${
              boundaryMode === 'none'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            None
          </button>
        </div>
      </div>

      {/* Velocity Clamping */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono text-slate-400 uppercase">
            Velocity Clamping (v_max)
          </label>
          <input
            type="checkbox"
            checked={velocityClamping.enabled}
            onChange={(e) =>
              onVelocityClampingChange({ ...velocityClamping, enabled: e.target.checked })
            }
            className="accent-cyan-400 rounded cursor-pointer"
          />
        </div>
        {velocityClamping.enabled && (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={50}
              value={velocityClamping.maxPercentage}
              onChange={(e) =>
                onVelocityClampingChange({ ...velocityClamping, maxPercentage: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-space-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="font-mono text-xs text-cyan-300 w-12 text-right">
              {velocityClamping.maxPercentage}%
            </span>
          </div>
        )}
      </div>

      {/* Deterministic Seed Input & Reroll */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-mono text-slate-400 uppercase">
          RNG Seed (Deterministic)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={seed}
            onChange={(e) => onSeedChange(Number(e.target.value))}
            className="w-full bg-space-950 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-500"
          />
          <button
            onClick={onRerollSeed}
            title="Randomize Seed"
            className="p-2 rounded bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-300 hover:text-white transition"
          >
            <Dices className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
