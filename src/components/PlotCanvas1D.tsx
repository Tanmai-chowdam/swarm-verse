import React, { useRef, useEffect, useState, useMemo } from 'react';
import { SwarmSnapshot, Bound, PrecisionMode } from '../engine/types';
import { DisplayOptions } from '../state/useSimulation';
import { compileExpression } from '../parser/compile';

interface PlotCanvas1DProps {
  snapshot?: SwarmSnapshot;
  allSnapshots: SwarmSnapshot[];
  cursor: number;
  expression: string;
  bounds: Bound[];
  selectedParticleId: number;
  onSelectParticle: (id: number) => void;
  displayOptions: DisplayOptions;
  precisionMode: PrecisionMode;
}

export const PlotCanvas1D: React.FC<PlotCanvas1DProps> = ({
  snapshot,
  allSnapshots,
  cursor,
  expression,
  bounds,
  selectedParticleId,
  onSelectParticle,
  displayOptions,
  precisionMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredParticle, setHoveredParticle] = useState<{ id: number; x: number; f: number; px: number; py: number } | null>(null);

  const b0 = bounds[0] || { min: -5, max: 5 };
  const evalFitness = useMemo(() => compileExpression(expression), [expression]);

  // Compute curve points and bounds
  const { samples, yMin, yMax } = useMemo(() => {
    const numSamples = 300;
    const pts: { x: number; y: number }[] = [];
    let minY = Infinity;
    let maxY = -Infinity;
    const step = (b0.max - b0.min) / numSamples;

    for (let i = 0; i <= numSamples; i++) {
      const x = b0.min + i * step;
      const y = evalFitness([x]);
      if (Number.isFinite(y)) {
        pts.push({ x, y });
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    if (!Number.isFinite(minY) || !Number.isFinite(maxY) || minY === maxY) {
      minY = -10;
      maxY = 10;
    } else {
      // Add 15% vertical padding
      const pad = (maxY - minY) * 0.15 || 1;
      minY -= pad;
      maxY += pad;
    }

    return { samples: pts, yMin: minY, yMax: maxY };
  }, [b0.min, b0.max, evalFitness]);

  // Canvas size and rendering
  const [dimensions, setDimensions] = useState({ width: 700, height: 420 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const padding = { top: 30, right: 35, bottom: 45, left: 55 };
  const plotWidth = Math.max(10, dimensions.width - padding.left - padding.right);
  const plotHeight = Math.max(10, dimensions.height - padding.top - padding.bottom);

  // Coordinate transforms
  const toScreenX = (x: number) => {
    if (!Number.isFinite(x)) return padding.left + plotWidth / 2;
    return padding.left + ((x - b0.min) / (b0.max - b0.min || 1)) * plotWidth;
  };
  const toScreenY = (y: number) => {
    if (!Number.isFinite(y)) return padding.top + plotHeight / 2;
    return padding.top + plotHeight - ((y - yMin) / (yMax - yMin || 1)) * plotHeight;
  };

  // Draw background grid and mathematical curve on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Vertical grid ticks (X)
    const xTicks = 8;
    for (let i = 0; i <= xTicks; i++) {
      const xVal = b0.min + (i / xTicks) * (b0.max - b0.min);
      const sx = toScreenX(xVal);
      ctx.beginPath();
      ctx.moveTo(sx, padding.top);
      ctx.lineTo(sx, padding.top + plotHeight);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(xVal.toFixed(1), sx, dimensions.height - padding.bottom + 18);
    }

    // Horizontal grid ticks (Y)
    const yTicks = 6;
    for (let j = 0; j <= yTicks; j++) {
      const yVal = yMin + (j / yTicks) * (yMax - yMin);
      const sy = toScreenY(yVal);
      ctx.beginPath();
      ctx.moveTo(padding.left, sy);
      ctx.lineTo(padding.left + plotWidth, sy);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(1), padding.left - 8, sy + 4);
    }

    ctx.setLineDash([]); // Reset dash

    // Draw Zero Axis Lines if in range
    if (yMin <= 0 && yMax >= 0) {
      const zeroY = toScreenY(0);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padding.left, zeroY);
      ctx.lineTo(padding.left + plotWidth, zeroY);
      ctx.stroke();
    }
    if (b0.min <= 0 && b0.max >= 0) {
      const zeroX = toScreenX(0);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(zeroX, padding.top);
      ctx.lineTo(zeroX, padding.top + plotHeight);
      ctx.stroke();
    }

    // Draw Objective Function Curve
    if (samples.length > 1) {
      // Area Fill under curve
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotHeight);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.01)');

      ctx.beginPath();
      ctx.moveTo(toScreenX(samples[0].x), toScreenY(samples[0].y));
      for (let i = 1; i < samples.length; i++) {
        ctx.lineTo(toScreenX(samples[i].x), toScreenY(samples[i].y));
      }
      ctx.lineTo(toScreenX(samples[samples.length - 1].x), padding.top + plotHeight);
      ctx.lineTo(toScreenX(samples[0].x), padding.top + plotHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Curve Stroke
      ctx.beginPath();
      ctx.moveTo(toScreenX(samples[0].x), toScreenY(samples[0].y));
      for (let i = 1; i < samples.length; i++) {
        ctx.lineTo(toScreenX(samples[i].x), toScreenY(samples[i].y));
      }
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }

    // Outer Border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding.left, padding.top, plotWidth, plotHeight);
  }, [dimensions, samples, b0.min, b0.max, yMin, yMax, plotWidth, plotHeight]);

  const particles = snapshot?.particles || [];
  const gbest = snapshot?.gbest || [0];
  const gbestFitness = snapshot?.gbestFitness ?? evalFitness(gbest);

  const formatVal = (v: number) => (precisionMode === 'full' ? v.toString() : v.toFixed(4));

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] select-none bg-space-950 rounded-xl overflow-hidden border border-slate-800">
      {/* Canvas for Grid & Mathematical Curve */}
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height }}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />

      {/* Interactive SVG Overlay for Particles and Annotations */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="absolute top-0 left-0 w-full h-full overflow-visible"
      >
        <defs>
          <radialGradient id="gbest-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>

        {/* Historical Breadcrumb Trails */}
        {displayOptions.showTrails && cursor > 0 && (
          <g className="trails">
            {particles.map((p) => {
              const trailPoints: string[] = [];
              const startIter = Math.max(0, cursor - 6);
              for (let iter = startIter; iter <= cursor; iter++) {
                const pastSnap = allSnapshots[iter];
                if (pastSnap) {
                  const pastP = pastSnap.particles.find((item) => item.id === p.id);
                  if (pastP) {
                    const sx = toScreenX(pastP.x[0]);
                    const sy = toScreenY(pastP.fitness);
                    trailPoints.push(`${sx},${sy}`);
                  }
                }
              }
              return (
                <polyline
                  key={`trail-${p.id}`}
                  points={trailPoints.join(' ')}
                  fill="none"
                  stroke={p.id === selectedParticleId ? '#38bdf8' : '#334155'}
                  strokeWidth={p.id === selectedParticleId ? 2 : 1}
                  strokeDasharray="2,2"
                  opacity={p.id === selectedParticleId ? 0.9 : 0.4}
                />
              );
            })}
          </g>
        )}

        {/* Vertical Drop Lines */}
        {displayOptions.showDropLines &&
          particles.map((p) => {
            const sx = toScreenX(p.x[0]);
            const sy = toScreenY(p.fitness);
            const baseline = padding.top + plotHeight;
            const isSelected = p.id === selectedParticleId;

            return (
              <line
                key={`drop-${p.id}`}
                x1={sx}
                y1={sy}
                x2={sx}
                y2={baseline}
                stroke={isSelected ? '#38bdf8' : '#475569'}
                strokeWidth={isSelected ? 1.5 : 1}
                strokeDasharray="3,3"
                opacity={isSelected ? 0.8 : 0.3}
              />
            );
          })}

        {/* Personal Best (pbest) Markers */}
        {displayOptions.showPbest &&
          particles.map((p) => {
            const px = toScreenX(p.pbest[0]);
            const py = toScreenY(p.pbestFitness);
            return (
              <g key={`pbest-${p.id}`} transform={`translate(${px}, ${py})`}>
                <polygon
                  points="0,-5 5,0 0,5 -5,0"
                  fill="#10b981"
                  stroke="#047857"
                  strokeWidth={1}
                  opacity={0.85}
                />
              </g>
            );
          })}

        {/* Global Best (gbest) Beacon Star */}
        {Number.isFinite(gbest[0]) && (
          <g
            transform={`translate(${toScreenX(gbest[0])}, ${toScreenY(gbestFitness)})`}
            className="transition-all duration-300"
          >
            {/* Pulsing Aura */}
            <circle r={18} fill="url(#gbest-glow)" />
            <circle
              r={12}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4,2"
              className="animate-spin"
              style={{ transformOrigin: 'center' }}
            />
            {/* Star Icon */}
            <path
              d="M0,-8 L2.4,-2.4 L8,-2.4 L3.6,1.4 L5.4,7 L0,3.6 L-5.4,7 L-3.6,1.4 L-8,-2.4 L-2.4,-2.4 Z"
              fill="#fbbf24"
              stroke="#b45309"
              strokeWidth={1}
            />
          </g>
        )}

        {/* Particles */}
        {particles.map((p) => {
          const sx = toScreenX(p.x[0]);
          const sy = toScreenY(p.fitness);
          const isSelected = p.id === selectedParticleId;

          // Velocity Vector Arrow
          const vx = p.v[0] || 0;
          const arrowLen = Math.max(-40, Math.min(40, vx * 12));
          const arrowEndX = sx + arrowLen;

          return (
            <g
              key={`p-${p.id}`}
              className="cursor-pointer group"
              onClick={() => onSelectParticle(p.id)}
              onMouseEnter={() => setHoveredParticle({ id: p.id, x: p.x[0], f: p.fitness, px: sx, py: sy })}
              onMouseLeave={() => setHoveredParticle(null)}
            >
              {/* Velocity Arrow */}
              {displayOptions.showVelocities && Math.abs(vx) > 0.001 && (
                <g>
                  <line
                    x1={sx}
                    y1={sy}
                    x2={arrowEndX}
                    y2={sy}
                    stroke={isSelected ? '#38bdf8' : '#3b82f6'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    markerEnd="url(#arrowhead)"
                  />
                  <polygon
                    points={`${arrowEndX},${sy - 3} ${arrowEndX + (arrowLen > 0 ? 5 : -5)},${sy} ${arrowEndX},${sy + 3}`}
                    fill={isSelected ? '#38bdf8' : '#3b82f6'}
                  />
                </g>
              )}

              {/* Selection Halo */}
              {isSelected && (
                <circle
                  cx={sx}
                  cy={sy}
                  r={12}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  className="animate-pulse"
                />
              )}

              {/* Particle Disc */}
              <circle
                cx={sx}
                cy={sy}
                r={isSelected ? 7 : 5}
                fill={isSelected ? '#38bdf8' : '#06b6d4'}
                stroke="#0b1021"
                strokeWidth={2}
                className="transition-transform duration-100 hover:scale-125"
              />

              {/* Particle ID Label */}
              <text
                x={sx}
                y={sy - 9}
                fill={isSelected ? '#e0f2fe' : '#94a3b8'}
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                className="font-semibold"
              >
                P{p.id + 1}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredParticle && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-900/95 backdrop-blur border border-cyan-500/50 shadow-xl shadow-cyan-950/50 rounded-lg px-3 py-2 text-xs font-mono transform -translate-x-1/2 -translate-y-full mb-2"
          style={{ left: hoveredParticle.px, top: hoveredParticle.py }}
        >
          <div className="font-bold text-cyan-400">Particle P{hoveredParticle.id + 1}</div>
          <div className="text-slate-300">x: <span className="text-white">{formatVal(hoveredParticle.x)}</span></div>
          <div className="text-slate-300">f(x): <span className="text-white">{formatVal(hoveredParticle.f)}</span></div>
        </div>
      )}

      {/* Legend & Coordinate Tags in Top Corner */}
      <div className="absolute top-2 right-3 pointer-events-none flex items-center gap-3 text-[11px] font-mono bg-space-900/80 backdrop-blur px-2.5 py-1 rounded-md border border-slate-800 text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Particle</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 transform rotate-45"></span> pbest</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 text-amber-400">★</span> gbest</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500"></span> Velocity</span>
      </div>
    </div>
  );
};
