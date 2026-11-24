import React from 'react';
import { ActiveTab, DisplayOptions, PrecisionMode } from '../state/useSimulation';
import {
  Sparkles,
  BookOpen,
  Sliders,
  GraduationCap,
  Eye,
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  displayOptions: DisplayOptions;
  onToggleDisplayOption: (key: keyof DisplayOptions) => void;
  precisionMode: PrecisionMode;
  onTogglePrecision: () => void;
  dimension: 1 | 2;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  displayOptions,
  onToggleDisplayOption,
  precisionMode,
  onTogglePrecision,
  dimension,
}) => {
  return (
    <header className="bg-space-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-amber-500 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-space-950 rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-base tracking-tight text-white font-mono">
              Swarm<span className="text-cyan-400">Verse</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold uppercase tracking-wider">
              University Demo
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Scientific Particle Swarm Optimization Studio &amp; Mathematical Engine
          </p>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-space-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
        <button
          onClick={() => onSelectTab('solver')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
            activeTab === 'solver'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Custom Solver</span>
        </button>

        <button
          onClick={() => onSelectTab('textbook')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
            activeTab === 'textbook'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Textbook Mode</span>
        </button>

        <button
          onClick={() => onSelectTab('manual')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
            activeTab === 'manual'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Manual Init</span>
        </button>

        <button
          onClick={() => onSelectTab('reference')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
            activeTab === 'reference'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Theory</span>
        </button>
      </nav>

      {/* Visual Overlay Options & Precision */}
      <div className="flex items-center gap-2">
        {/* Visual Overlay Toggles Dropdown / Pills */}
        <div className="hidden lg:flex items-center gap-1 bg-space-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
          <Eye className="w-3.5 h-3.5 text-slate-400 mx-1" />
          <button
            onClick={() => onToggleDisplayOption('showTrails')}
            className={`px-2 py-0.5 rounded transition ${
              displayOptions.showTrails ? 'bg-space-850 text-cyan-300 font-semibold' : 'text-slate-500'
            }`}
          >
            Trails
          </button>
          <button
            onClick={() => onToggleDisplayOption('showVelocities')}
            className={`px-2 py-0.5 rounded transition ${
              displayOptions.showVelocities ? 'bg-space-850 text-cyan-300 font-semibold' : 'text-slate-500'
            }`}
          >
            Vectors
          </button>
          {dimension === 2 && (
            <button
              onClick={() => onToggleDisplayOption('showComponents')}
              className={`px-2 py-0.5 rounded transition ${
                displayOptions.showComponents ? 'bg-space-850 text-cyan-300 font-semibold' : 'text-slate-500'
              }`}
            >
              Components
            </button>
          )}
          <button
            onClick={() => onToggleDisplayOption('showPbest')}
            className={`px-2 py-0.5 rounded transition ${
              displayOptions.showPbest ? 'bg-space-850 text-emerald-300 font-semibold' : 'text-slate-500'
            }`}
          >
            pbest
          </button>
        </div>

        {/* Precision Toggle */}
        <button
          onClick={onTogglePrecision}
          className="text-xs font-mono px-2.5 py-1.5 rounded-lg bg-space-950 hover:bg-space-850 border border-slate-800 text-slate-300 transition"
          title="Toggle decimal rounding (4 decimal places) vs raw IEEE-754 precision"
        >
          {precisionMode === 'full' ? 'IEEE 754' : '4-Dec'}
        </button>
      </div>
    </header>
  );
};
