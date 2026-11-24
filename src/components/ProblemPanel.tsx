import React from 'react';
import { Dimension, Bound, OptimizationGoal, PresetProblem } from '../engine/types';
import { ValidationResult } from '../parser/validate';
import { PRESET_PROBLEMS } from '../engine/presets';
import { Play, AlertCircle, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface ProblemPanelProps {
  expression: string;
  onExpressionChange: (expr: string) => void;
  dimension: Dimension;
  onDimensionChange: (dim: Dimension) => void;
  goal: OptimizationGoal;
  onGoalChange: (goal: OptimizationGoal) => void;
  bounds: Bound[];
  onBoundsChange: (bounds: Bound[]) => void;
  validation: ValidationResult;
  onRun: () => void;
  activePresetId?: string;
  onSelectPreset: (preset: PresetProblem) => void;
}

export const ProblemPanel: React.FC<ProblemPanelProps> = ({
  expression,
  onExpressionChange,
  dimension,
  onDimensionChange,
  goal,
  onGoalChange,
  bounds,
  onBoundsChange,
  validation,
  onRun,
  activePresetId,
  onSelectPreset,
}) => {
  const b0 = bounds[0] || { min: -5, max: 5 };
  const b1 = bounds[1] || { min: -5, max: 5 };

  const handleBoundChange = (dimIdx: number, key: 'min' | 'max', val: number) => {
    const nextBounds = bounds.map((b, i) => (i === dimIdx ? { ...b, [key]: val } : { ...b }));
    while (nextBounds.length < dimension) {
      nextBounds.push({ min: -5, max: 5 });
    }
    onBoundsChange(nextBounds);
  };

  const handleDimChange = (newDim: Dimension) => {
    onDimensionChange(newDim);
    if (newDim === 2 && bounds.length < 2) {
      onBoundsChange([...bounds, { min: bounds[0]?.min ?? -5, max: bounds[0]?.max ?? 5 }]);
    }
  };

  return (
    <div className="bg-space-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide">
            Custom PSO Problem Solver
          </h3>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold">
          Live Equation Solver
        </span>
      </div>

      {/* Preset Pickers */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-mono text-slate-400 uppercase">
          Standard Benchmark Presets
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_PROBLEMS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`text-left px-2.5 py-1.5 rounded-lg border text-xs font-mono transition truncate ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-200 font-bold'
                    : 'bg-space-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
                title={`${preset.name}: ${preset.expression}`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Objective Math Expression Input */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono text-slate-400 uppercase">
            Objective Function f({dimension === 1 ? 'x' : 'x, y'})
          </label>
          <span className="text-[11px] font-mono text-slate-500">Press Enter or click Run</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={expression}
            onChange={(e) => {
              const val = e.target.value;
              onExpressionChange(val);
              // Auto-detect if user typed 2D variable y while in 1D
              if (/\by\b/i.test(val) && dimension === 1) {
                handleDimChange(2);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && validation.isValid) {
                onRun();
              }
            }}
            placeholder={dimension === 1 ? 'e.g. x^2 - 4x + 4 or sin(x)' : 'e.g. x^2 + y^2'}
            className="w-full bg-space-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-3 py-2 text-sm font-mono text-cyan-300 outline-none transition"
          />
        </div>

        {/* Quick Example Equation Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-mono text-slate-500">Quick tests:</span>
          {[
            { label: 'x² - 4x + 4', expr: 'x^2 - 4x + 4', dim: 1 as const },
            { label: 'sin(x)', expr: 'sin(x)', dim: 1 as const },
            { label: 'x³ - 3x', expr: 'x^3 - 3*x', dim: 1 as const },
            { label: 'x² + y²', expr: 'x^2 + y^2', dim: 2 as const },
            { label: 'sin(x)cos(y)', expr: 'sin(x) * cos(y)', dim: 2 as const },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                onExpressionChange(chip.expr);
                if (chip.dim !== dimension) {
                  handleDimChange(chip.dim);
                }
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-850 hover:bg-space-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Validation Status Message */}
        <div className="mt-0.5">
          {validation.isValid ? (
            validation.issues.length > 0 ? (
              <div className="flex items-start gap-1.5 text-[11px] text-amber-400 bg-amber-950/40 p-2 rounded border border-amber-900/50">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{validation.issues[0].message}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Valid mathematical AST compiled safely</span>
              </div>
            )
          ) : (
            <div className="flex items-start gap-1.5 text-[11px] text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-900/50">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{validation.issues[0]?.message || 'Invalid expression'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Goal & Dimension Toggles */}
      <div className="grid grid-cols-2 gap-3">
        {/* Goal Toggle (Minimization vs Maximization) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono text-slate-400 uppercase">Optimization Goal</label>
          <div className="grid grid-cols-2 gap-1 bg-space-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => onGoalChange('minimize')}
              className={`py-1 text-xs font-mono rounded-md font-semibold transition ${
                goal === 'minimize'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Minimize
            </button>
            <button
              onClick={() => onGoalChange('maximize')}
              className={`py-1 text-xs font-mono rounded-md font-semibold transition ${
                goal === 'maximize'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Maximize
            </button>
          </div>
        </div>

        {/* Dimension Toggle (1D vs 2D) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono text-slate-400 uppercase">Dimension</label>
          <div className="grid grid-cols-2 gap-1 bg-space-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => handleDimChange(1)}
              className={`py-1 text-xs font-mono rounded-md font-semibold transition ${
                dimension === 1
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1D (x)
            </button>
            <button
              onClick={() => handleDimChange(2)}
              className={`py-1 text-xs font-mono rounded-md font-semibold transition ${
                dimension === 2
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2D (x, y)
            </button>
          </div>
        </div>
      </div>

      {/* Domain Bounds Inputs */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-mono text-slate-400 uppercase">Search Space Bounds</label>
        {/* Dim 1 (x) Bounds */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 w-8">x ∈</span>
          <span className="text-slate-500">[</span>
          <input
            type="number"
            value={b0.min}
            onChange={(e) => handleBoundChange(0, 'min', Number(e.target.value))}
            className="w-20 bg-space-950 border border-slate-700 rounded px-2 py-1 text-center text-slate-200 outline-none focus:border-cyan-500"
          />
          <span className="text-slate-500">,</span>
          <input
            type="number"
            value={b0.max}
            onChange={(e) => handleBoundChange(0, 'max', Number(e.target.value))}
            className="w-20 bg-space-950 border border-slate-700 rounded px-2 py-1 text-center text-slate-200 outline-none focus:border-cyan-500"
          />
          <span className="text-slate-500">]</span>
        </div>

        {/* Dim 2 (y) Bounds if 2D */}
        {dimension === 2 && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 w-8">y ∈</span>
            <span className="text-slate-500">[</span>
            <input
              type="number"
              value={b1.min}
              onChange={(e) => handleBoundChange(1, 'min', Number(e.target.value))}
              className="w-20 bg-space-950 border border-slate-700 rounded px-2 py-1 text-center text-slate-200 outline-none focus:border-cyan-500"
            />
            <span className="text-slate-500">,</span>
            <input
              type="number"
              value={b1.max}
              onChange={(e) => handleBoundChange(1, 'max', Number(e.target.value))}
              className="w-20 bg-space-950 border border-slate-700 rounded px-2 py-1 text-center text-slate-200 outline-none focus:border-cyan-500"
            />
            <span className="text-slate-500">]</span>
          </div>
        )}
      </div>

      {/* Primary Solve Button */}
      <button
        onClick={onRun}
        disabled={!validation.isValid}
        className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-98 transition disabled:opacity-50 disabled:pointer-events-none"
      >
        <Play className="w-4 h-4 fill-current" />
        <span>Run Particle Swarm Optimization</span>
      </button>
    </div>
  );
};
