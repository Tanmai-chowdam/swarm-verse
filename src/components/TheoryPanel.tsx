import React from 'react';
import { FormulaBlock } from './FormulaBlock';
import { GraduationCap, Compass, Layers, CheckCircle } from 'lucide-react';

export const TheoryPanel: React.FC = () => {
  return (
    <div className="bg-space-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-6 text-slate-200">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <GraduationCap className="w-6 h-6 text-cyan-400" />
        <div>
          <h3 className="font-bold text-slate-100 text-lg">
            Mathematical Foundations of Particle Swarm Optimization (PSO)
          </h3>
          <p className="text-xs text-slate-400">
            Theoretical analysis, velocity vector decomposition, and convergence criteria.
          </p>
        </div>
      </div>

      {/* Core Update Equations */}
      <div className="bg-space-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm font-semibold">
          <Layers className="w-4 h-4" />
          <span>Fundamental Kinematic Equations</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          In PSO, each particle <FormulaBlock math="i" /> maintains position <FormulaBlock math="\mathbf{x}_i" />, velocity <FormulaBlock math="\mathbf{v}_i" />, and memory of its personal best location <FormulaBlock math="\mathbf{p}_{i}" />. The entire swarm shares knowledge of the global best position <FormulaBlock math="\mathbf{g}" /> discovered so far.
        </p>

        <div className="bg-space-900 p-3 rounded-lg border border-slate-800 text-center my-1 overflow-x-auto">
          <FormulaBlock
            math="\mathbf{v}_{i}^{(t)} = w \mathbf{v}_{i}^{(t-1)} + c_1 r_1 \left(\mathbf{p}_{i} - \mathbf{x}_{i}^{(t-1)}\right) + c_2 r_2 \left(\mathbf{g} - \mathbf{x}_{i}^{(t-1)}\right)"
            displayMode={true}
            className="text-cyan-300 text-sm"
          />
          <FormulaBlock
            math="\mathbf{x}_{i}^{(t)} = \mathbf{x}_{i}^{(t-1)} + \mathbf{v}_{i}^{(t)}"
            displayMode={true}
            className="text-emerald-300 text-sm mt-1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-2">
          <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-lg">
            <strong className="text-blue-400 font-mono block mb-1">1. Inertia Component (w · v)</strong>
            <span>Preserves kinetic momentum, preventing abrupt directional oscillations and enabling broad exploration.</span>
          </div>
          <div className="p-3 bg-purple-950/20 border border-purple-900/40 rounded-lg">
            <strong className="text-purple-400 font-mono block mb-1">2. Cognitive Component (c₁ · r₁ · Δp)</strong>
            <span>Attracts the particle back towards its individual best historical experience (private memory).</span>
          </div>
          <div className="p-3 bg-pink-950/20 border border-pink-900/40 rounded-lg">
            <strong className="text-pink-400 font-mono block mb-1">3. Social Component (c₂ · r₂ · Δg)</strong>
            <span>Draws the particle towards the global consensus of the entire swarm (collective intelligence).</span>
          </div>
        </div>
      </div>

      {/* Synchronous vs Asynchronous Section */}
      <div className="bg-space-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-sm font-semibold">
          <Compass className="w-4 h-4" />
          <span>Synchronous Update Convention</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          SwarmVerse uses the textbook <strong>synchronous update scheme</strong>. During iteration <FormulaBlock math="t" />, the leader position <FormulaBlock math="\mathbf{g}" /> is frozen from iteration <FormulaBlock math="t-1" /> across all particle updates. Only after every particle in the swarm has completed its movement and evaluated candidate fitness are the personal bests and global best updated simultaneously.
        </p>
      </div>

      {/* Heuristic Transparency Rule */}
      <div className="bg-space-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-semibold">
          <CheckCircle className="w-4 h-4" />
          <span>Heuristic Integrity & &quot;Best Found&quot; Transparency</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Particle Swarm Optimization is a stochastic metaheuristic without formal guarantees of global optimality on non-convex or multimodal objective functions. SwarmVerse strictly adheres to scientific honesty by labelling all simulation outcomes as <strong>&quot;Best Found by PSO&quot;</strong> rather than claiming guaranteed global optima. Known theoretical optima are only presented on verified benchmark presets for comparison.
        </p>
      </div>
    </div>
  );
};
