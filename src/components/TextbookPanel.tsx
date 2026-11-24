import React, { useState } from 'react';
import {
  FIXTURE_PROBLEM_1,
  FIXTURE_PROBLEM_3,
  FIXTURE_EXERCISE_1,
  FixtureData,
} from '../textbook/fixtures';
import { verifyFixture, VerificationResult } from '../textbook/compare';
import { CheckCircle2, XCircle, BookOpen, AlertCircle, Play } from 'lucide-react';

interface TextbookPanelProps {
  onLoadFixtureIntoSolver: (fixture: FixtureData) => void;
}

export const TextbookPanel: React.FC<TextbookPanelProps> = ({
  onLoadFixtureIntoSolver,
}) => {
  const [selectedFixture, setSelectedFixture] = useState<FixtureData>(FIXTURE_PROBLEM_1);
  const [mode, setMode] = useState<'full-chain' | 'per-step'>('full-chain');
  const [result, setResult] = useState<VerificationResult | null>(() =>
    verifyFixture(FIXTURE_PROBLEM_1, 'full-chain')
  );

  const handleRunVerify = (f: FixtureData, m: 'full-chain' | 'per-step') => {
    setSelectedFixture(f);
    setMode(m);
    const res = verifyFixture(f, m);
    setResult(res);
  };

  return (
    <div className="bg-space-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-5 text-slate-200">
      {/* Title & Info */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-semibold text-slate-100 text-base">
              Textbook Verification Engine
            </h3>
            <p className="text-xs text-slate-400">
              Validates SwarmVerse against exact numerical tables from Engelbrecht and lecture notes.
            </p>
          </div>
        </div>
      </div>

      {/* Fixture Selector Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[FIXTURE_PROBLEM_1, FIXTURE_PROBLEM_3, FIXTURE_EXERCISE_1].map((f) => {
          const isSelected = selectedFixture.id === f.id;
          return (
            <button
              key={f.id}
              onClick={() => handleRunVerify(f, mode)}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                isSelected
                  ? 'bg-cyan-950/70 border-cyan-500/70 shadow-lg shadow-cyan-950/50'
                  : 'bg-space-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-mono font-bold text-cyan-300">{f.name}</div>
              <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {f.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mode Selector and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-space-950 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Verification Mode:</span>
          <div className="flex rounded-md bg-space-900 border border-slate-700 p-0.5 text-xs font-mono">
            <button
              onClick={() => handleRunVerify(selectedFixture, 'full-chain')}
              className={`px-3 py-1 rounded transition ${
                mode === 'full-chain'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full-Chain Reproduction
            </button>
            <button
              onClick={() => handleRunVerify(selectedFixture, 'per-step')}
              className={`px-3 py-1 rounded transition ${
                mode === 'per-step'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Per-Step Isolated Check
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onLoadFixtureIntoSolver(selectedFixture)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-space-850 hover:bg-space-800 text-slate-200 border border-slate-700 transition"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Into Interactive Solver</span>
          </button>
        </div>
      </div>

      {/* Verification Pass/Fail Banner */}
      {result && (
        <div
          className={`flex items-center justify-between p-3 rounded-lg border text-sm font-mono ${
            result.passed
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {result.passed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
            <span className="font-bold">
              {result.passed
                ? 'All Checks Passed: Perfect Reproduction of Textbook Data!'
                : 'Verification Discrepancies Detected'}
            </span>
          </div>
          <div className="text-xs">
            Checks Passed: <strong className="font-bold">{result.passedChecks}</strong> / {result.totalChecks} (
            {Math.round((result.passedChecks / result.totalChecks) * 100)}%)
          </div>
        </div>
      )}

      {/* Cell Comparison Table */}
      {result && (
        <div className="max-h-72 overflow-y-auto scrollbar-thin border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-space-950 text-slate-400 sticky top-0 text-[11px] uppercase">
              <tr>
                <th className="py-2 px-3">Iter</th>
                <th className="py-2 px-3">Target Metric</th>
                <th className="py-2 px-3">Textbook Expected</th>
                <th className="py-2 px-3">SwarmVerse Computed</th>
                <th className="py-2 px-3">Absolute Delta</th>
                <th className="py-2 px-3">Tolerance</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {result.cells.map((cell, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-space-850/50 ${
                    cell.passed ? '' : 'bg-rose-950/20 text-rose-200'
                  }`}
                >
                  <td className="py-1.5 px-3 text-slate-400">t = {cell.iteration}</td>
                  <td className="py-1.5 px-3 font-semibold text-cyan-300">{cell.target}</td>
                  <td className="py-1.5 px-3 text-slate-200">{cell.expected.toFixed(4)}</td>
                  <td className="py-1.5 px-3 text-white font-bold">{cell.actual.toFixed(4)}</td>
                  <td className="py-1.5 px-3 text-slate-400">{cell.diff.toExponential(2)}</td>
                  <td className="py-1.5 px-3 text-slate-500">{cell.tolerance}</td>
                  <td className="py-1.5 px-3 text-center">
                    {cell.passed ? (
                      <span className="text-emerald-400 font-bold">✓ Pass</span>
                    ) : (
                      <span className="text-rose-400 font-bold">✗ Fail</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* In-App Notes on Textbook Ambiguities Section */}
      <div className="bg-space-950/70 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-2 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-semibold font-mono">
          <AlertCircle className="w-4 h-4" />
          <span>Settled Textbook Ambiguities & Mathematical Proofs</span>
        </div>
        <ul className="list-disc pl-5 text-slate-400 space-y-1 leading-relaxed">
          <li>
            <strong className="text-slate-200">Synchronous vs Asynchronous:</strong> In Problem 1 (Iteration 1), P3 at x=2 equals gbest=2 and receives exactly zero social pull, proving gbest is frozen during the step and updated synchronously.
          </li>
          <li>
            <strong className="text-slate-200">Velocity After Boundary Clipping:</strong> Problem 1 (P1 at iteration 5) holds at boundary 5. Keeping velocity intact (rather than zeroing) explains subsequent inertia pull. SwarmVerse preserves velocity after clipping.
          </li>
          <li>
            <strong className="text-slate-200">Inertia Weight w:</strong> Engelbrecht Algorithm 16.1 corresponds to w=1.0; lecture notes add explicit inertia w=0.7. SwarmVerse supports both fixed and dynamic linear schedules.
          </li>
          <li>
            <strong className="text-slate-200">Rounding Tolerance:</strong> Textbook tables round printed values to 4 decimal places (e.g., 0.91875 printed as 0.9187). SwarmVerse maintains full 64-bit IEEE 754 precision internally and validates within 5e-4 tolerance.
          </li>
        </ul>
      </div>
    </div>
  );
};
