import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
  ChevronsRight,
} from 'lucide-react';

interface ControlsProps {
  cursor: number;
  totalIterations: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onJumpToEnd: () => void;
  onSetCursor: (val: number) => void;
  onSetSpeed: (val: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  cursor,
  totalIterations,
  isPlaying,
  playbackSpeed,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onReset,
  onJumpToEnd,
  onSetCursor,
  onSetSpeed,
}) => {
  return (
    <div className="bg-space-900 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-slate-200">
      {/* Primary Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Reset to 0 */}
        <button
          onClick={onReset}
          title="Reset to Iteration 0"
          className="p-2 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700/80 text-slate-300 hover:text-white transition active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Step Backward */}
        <button
          onClick={onStepBackward}
          disabled={cursor === 0}
          title="Step Backward"
          className="p-2 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700/80 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition active:scale-95"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Play / Pause Primary Button */}
        <button
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition shadow-lg active:scale-95 ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Play</span>
            </>
          )}
        </button>

        {/* Step Forward */}
        <button
          onClick={onStepForward}
          disabled={cursor >= totalIterations}
          title="Step Forward"
          className="p-2 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700/80 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition active:scale-95"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Jump to End */}
        <button
          onClick={onJumpToEnd}
          disabled={cursor >= totalIterations}
          title="Jump to Final Iteration"
          className="p-2 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700/80 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition active:scale-95"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Scrubber Timeline Bar */}
      <div className="flex-1 w-full flex items-center gap-3 max-w-xl mx-2">
        <span className="font-mono text-xs text-slate-400 shrink-0 w-16 text-right">
          t = <strong className="text-cyan-400 font-bold">{cursor}</strong> / {totalIterations}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(1, totalIterations)}
          value={cursor}
          onChange={(e) => onSetCursor(Number(e.target.value))}
          className="w-full h-1.5 bg-space-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition"
        />
      </div>

      {/* Speed Slider */}
      <div className="flex items-center gap-2 shrink-0">
        <FastForward className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-mono text-slate-400">Speed:</span>
        <input
          type="range"
          min={1}
          max={30}
          value={playbackSpeed}
          onChange={(e) => onSetSpeed(Number(e.target.value))}
          className="w-20 h-1.5 bg-space-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
        />
        <span className="text-xs font-mono text-cyan-400 w-9 text-right font-semibold">
          {playbackSpeed}x
        </span>
      </div>
    </div>
  );
};
