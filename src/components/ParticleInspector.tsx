import React, { useState } from 'react';
import { SwarmSnapshot, PrecisionMode } from '../engine/types';
import { FormulaBlock } from './FormulaBlock';
import { Sparkles, ShieldAlert, CheckCircle } from 'lucide-react';

interface ParticleInspectorProps {
  snapshot?: SwarmSnapshot;
  selectedParticleId: number;
  onSelectParticle: (id: number) => void;
  precisionMode: PrecisionMode;
  onTogglePrecision: () => void;
}

export const ParticleInspector: React.FC<ParticleInspectorProps> = ({
  snapshot,
  selectedParticleId,
  onSelectParticle,
  precisionMode,
  onTogglePrecision,
}) => {
  const [activeDimTab, setActiveDimTab] = useState<number>(0);

  const particles = snapshot?.particles || [];
  const particle = particles.find((p) => p.id === selectedParticleId) || particles[0];

  if (!particle) {
    return (
      <div className="bg-space-900 border border-slate-800 rounded-xl p-4 text-slate-400 text-sm">
        No particle selected.
      </div>
    );
  }

  const dimCount = particle.x.length;
  const comp = particle.components[activeDimTab] || particle.components[0];
  const dimName = activeDimTab === 0 ? 'x' : 'y';

  const fmt = (v: number) => {
    if (v === undefined || Number.isNaN(v)) return '—';
    return precisionMode === 'full' ? v.toString() : v.toFixed(4);
  };

  // Math equations for KaTeX
  const formulaGeneral = `v_{i,d}^{(t)} = w v_{i,d}^{(t-1)} + c_1 r_1 (p_{best} - x) + c_2 r_2 (g_{best} - x)`;
  const formulaSubstituted = comp
    ? `v = (${fmt(comp.w)} \\times ${fmt(comp.vPrev)}) + (${fmt(comp.c1)} \\times ${fmt(comp.r1)} \\times [${fmt(comp.pbestDiff)}]) + (${fmt(comp.c2)} \\times ${fmt(comp.r2)} \\times [${fmt(comp.gbestDiff)}])`
    : '';

  return (
    <div className="bg-space-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 text-slate-200">
      {/* Top Header & Particle Selector */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="font-semibold text-slate-100 text-base">Particle Inspector</h3>
        </div>

        {/* Precision Toggle */}
        <button
          onClick={onTogglePrecision}
          className="text-[11px] font-mono px-2 py-0.5 rounded bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-300 transition"
          title="Toggle decimal rounding vs raw double precision"
        >
          {precisionMode === 'full' ? 'Precision: IEEE 754' : 'Precision: 4 Decimals'}
        </button>
      </div>

      {/* Particle Selector Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {particles.map((p) => {
          const isSelected = p.id === selectedParticleId;
          return (
            <button
              key={p.id}
              onClick={() => onSelectParticle(p.id)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                  : 'bg-space-850 hover:bg-space-800 text-slate-400 border border-slate-800'
              }`}
            >
              P{p.id + 1}
            </button>
          );
        })}
      </div>

      {/* Overview Cards: Position, Fitness, Best */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-space-950/70 border border-slate-800/80 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Position</div>
          <div className="text-xs font-mono font-semibold text-cyan-300 mt-1 truncate">
            {particle.x.length === 1 ? fmt(particle.x[0]) : `(${fmt(particle.x[0])}, ${fmt(particle.x[1])})`}
          </div>
        </div>

        <div className="bg-space-950/70 border border-slate-800/80 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Fitness f(x)</div>
          <div className="text-xs font-mono font-semibold text-white mt-1 truncate">
            {fmt(particle.fitness)}
          </div>
        </div>

        <div className="bg-space-950/70 border border-slate-800/80 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Personal Best</div>
          <div className="text-xs font-mono font-semibold text-emerald-400 mt-1 truncate">
            {fmt(particle.pbestFitness)}
          </div>
        </div>
      </div>

      {/* Dimension Tabs (if 2D) */}
      {dimCount > 1 && (
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveDimTab(0)}
            className={`px-3 py-1 text-xs font-mono rounded-md transition ${
              activeDimTab === 0
                ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dimension 1 (x)
          </button>
          <button
            onClick={() => setActiveDimTab(1)}
            className={`px-3 py-1 text-xs font-mono rounded-md transition ${
              activeDimTab === 1
                ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dimension 2 (y)
          </button>
        </div>
      )}

      {/* Step Calculation Breakdown */}
      {comp && (
        <div className="flex flex-col gap-3">
          {/* General Mathematical Formula */}
          <div className="bg-space-950/80 border border-slate-800 rounded-lg p-3 text-center overflow-x-auto">
            <div className="text-[10px] text-slate-400 uppercase font-mono mb-1">PSO Velocity Update Formula</div>
            <FormulaBlock math={formulaGeneral} displayMode={true} className="text-sm text-cyan-300" />
          </div>

          {/* Substituted Numbers Formula */}
          <div className="bg-space-950/80 border border-slate-800 rounded-lg p-3 text-center overflow-x-auto">
            <div className="text-[10px] text-slate-400 uppercase font-mono mb-1">
              Evaluated with Current Values ({dimName})
            </div>
            <FormulaBlock math={formulaSubstituted} displayMode={true} className="text-xs text-slate-200" />
          </div>

          {/* Color-Coded Component Breakdown Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Inertia Component */}
            <div className="bg-blue-950/30 border border-blue-800/40 rounded-lg p-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-blue-400 font-semibold">
                <span>Inertia</span>
                <span>w · v</span>
              </div>
              <div className="text-sm font-mono font-bold text-blue-200 mt-1">
                {fmt(comp.inertia)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                Preserves {fmt(comp.w * 100)}% of previous velocity ({fmt(comp.vPrev)}).
              </div>
            </div>

            {/* Cognitive Component */}
            <div className="bg-purple-950/30 border border-purple-800/40 rounded-lg p-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-purple-400 font-semibold">
                <span>Cognitive</span>
                <span>c₁ · r₁ · Δp</span>
              </div>
              <div className="text-sm font-mono font-bold text-purple-200 mt-1">
                {fmt(comp.cognitive)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                Pull towards personal memory (r₁ = {fmt(comp.r1)}).
              </div>
            </div>

            {/* Social Component */}
            <div className="bg-pink-950/30 border border-pink-800/40 rounded-lg p-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-pink-400 font-semibold">
                <span>Social</span>
                <span>c₂ · r₂ · Δg</span>
              </div>
              <div className="text-sm font-mono font-bold text-pink-200 mt-1">
                {fmt(comp.social)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                Pull towards swarm best (r₂ = {fmt(comp.r2)}).
              </div>
            </div>
          </div>

          {/* Position and Boundary Summary */}
          <div className="bg-space-950/60 border border-slate-800 rounded-lg p-3 flex flex-col gap-2 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Sum Velocity (v&apos;):</span>
              <span className="font-semibold text-white">{fmt(comp.vRaw)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Raw New Position (x + v&apos;):</span>
              <span className="text-slate-200">{fmt(comp.xRaw)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">Final Position (after boundary):</span>
              <span className="font-bold text-cyan-300">{fmt(comp.xFinal)}</span>
            </div>

            {/* Boundary Clipping Notice */}
            {comp.clipped && (
              <div className="mt-2 flex items-center gap-2 p-2 rounded bg-amber-950/40 border border-amber-800/50 text-amber-300 text-[11px]">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Boundary clipped:</strong> Position held at domain boundary. Per textbook rules, velocity is preserved for momentum continuity.
                </span>
              </div>
            )}
          </div>

          {/* Improvement Status Badges */}
          <div className="flex items-center gap-3 pt-1">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono ${
                particle.pbestUpdated
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  : 'bg-space-950 text-slate-500 border border-slate-800'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>pbest: {particle.pbestUpdated ? 'Improved!' : 'Unchanged'}</span>
            </div>

            {snapshot?.gbestParticleId === particle.id && snapshot?.gbestUpdated && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-amber-950/60 text-amber-300 border border-amber-800/60">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Leader: Discovered new Global Best!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
