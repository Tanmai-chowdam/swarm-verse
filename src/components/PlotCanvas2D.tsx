import React, { useRef, useEffect, useState, useMemo } from 'react';
import { SwarmSnapshot, Bound, PrecisionMode } from '../engine/types';
import { DisplayOptions } from '../state/useSimulation';
import { compileExpression } from '../parser/compile';

interface PlotCanvas2DProps {
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

export const PlotCanvas2D: React.FC<PlotCanvas2DProps> = ({
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
  const [hoveredParticle, setHoveredParticle] = useState<{
    id: number;
    x: number;
    y: number;
    f: number;
    px: number;
    py: number;
  } | null>(null);

  const b0 = bounds[0] || { min: -5, max: 5 };
  const b1 = bounds[1] || bounds[0] || { min: -5, max: 5 };

  const evalFitness = useMemo(() => compileExpression(expression), [expression]);

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
    return padding.top + plotHeight - ((y - b1.min) / (b1.max - b1.min || 1)) * plotHeight;
  };

  // Pre-render and cache heatmap on Canvas
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

    // Compute Heatmap on an offscreen buffer (100x100 resolution for high performance)
    const resX = 100;
    const resY = 100;
    const offscreen = document.createElement('canvas');
    offscreen.width = resX;
    offscreen.height = resY;
    const offCtx = offscreen.getContext('2d');

    if (offCtx) {
      const imgData = offCtx.createImageData(resX, resY);
      const data = imgData.data;

      // First pass: compute values and find min/max
      const gridValues = new Float32Array(resX * resY);
      let minF = Infinity;
      let maxF = -Infinity;

      for (let py = 0; py < resY; py++) {
        // py 0 is top (max y)
        const mathY = b1.max - (py / (resY - 1)) * (b1.max - b1.min);
        for (let px = 0; px < resX; px++) {
          const mathX = b0.min + (px / (resX - 1)) * (b0.max - b0.min);
          const val = evalFitness([mathX, mathY]);
          const idx = py * resX + px;
          gridValues[idx] = val;
          if (Number.isFinite(val)) {
            if (val < minF) minF = val;
            if (val > maxF) maxF = val;
          }
        }
      }

      if (!Number.isFinite(minF) || !Number.isFinite(maxF) || minF === maxF) {
        minF = 0;
        maxF = 1;
      }

      const rangeF = maxF - minF || 1;

      // Color mapping: scientific deep-space to amber
      for (let i = 0; i < gridValues.length; i++) {
        const val = gridValues[i];
        const offset = i * 4;

        if (!Number.isFinite(val)) {
          data[offset] = 20;
          data[offset + 1] = 20;
          data[offset + 2] = 35;
          data[offset + 3] = 255;
          continue;
        }

        const t = Math.max(0, Math.min(1, (val - minF) / rangeF));

        // Smooth multi-stop palette: Navy -> Blue -> Teal -> Green -> Amber
        let r = 0, g = 0, b = 0;
        if (t < 0.25) {
          const s = t / 0.25;
          r = Math.floor(10 + s * 15);
          g = Math.floor(15 + s * 45);
          b = Math.floor(40 + s * 120);
        } else if (t < 0.5) {
          const s = (t - 0.25) / 0.25;
          r = Math.floor(25 + s * 10);
          g = Math.floor(60 + s * 120);
          b = Math.floor(160 - s * 20);
        } else if (t < 0.75) {
          const s = (t - 0.5) / 0.25;
          r = Math.floor(35 + s * 180);
          g = Math.floor(180 + s * 40);
          b = Math.floor(140 - s * 100);
        } else {
          const s = (t - 0.75) / 0.25;
          r = Math.floor(215 + s * 40);
          g = Math.floor(220 - s * 60);
          b = Math.floor(40 - s * 30);
        }

        // Contour lines: add subtle dark band at regular intervals
        const contourLevel = (val - minF) / (rangeF / 10);
        const frac = contourLevel - Math.floor(contourLevel);
        if (frac < 0.08) {
          r = Math.floor(r * 0.7);
          g = Math.floor(g * 0.7);
          b = Math.floor(b * 0.7);
        }

        data[offset] = r;
        data[offset + 1] = g;
        data[offset + 2] = b;
        data[offset + 3] = 230; // slight transparency
      }

      offCtx.putImageData(imgData, 0, 0);

      // Draw interpolated heatmap onto plot area
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(offscreen, padding.left, padding.top, plotWidth, plotHeight);
    }

    // Draw Grid Lines & Ticks
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    // X Ticks
    const xTicks = 6;
    for (let i = 0; i <= xTicks; i++) {
      const xVal = b0.min + (i / xTicks) * (b0.max - b0.min);
      const sx = toScreenX(xVal);
      ctx.beginPath();
      ctx.moveTo(sx, padding.top);
      ctx.lineTo(sx, padding.top + plotHeight);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(xVal.toFixed(1), sx, dimensions.height - padding.bottom + 18);
    }

    // Y Ticks
    const yTicks = 6;
    for (let j = 0; j <= yTicks; j++) {
      const yVal = b1.min + (j / yTicks) * (b1.max - b1.min);
      const sy = toScreenY(yVal);
      ctx.beginPath();
      ctx.moveTo(padding.left, sy);
      ctx.lineTo(padding.left + plotWidth, sy);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(1), padding.left - 8, sy + 4);
    }

    ctx.setLineDash([]);

    // Zero axis lines
    if (b0.min <= 0 && b0.max >= 0) {
      const zx = toScreenX(0);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(zx, padding.top);
      ctx.lineTo(zx, padding.top + plotHeight);
      ctx.stroke();
    }
    if (b1.min <= 0 && b1.max >= 0) {
      const zy = toScreenY(0);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padding.left, zy);
      ctx.lineTo(padding.left + plotWidth, zy);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding.left, padding.top, plotWidth, plotHeight);
  }, [dimensions, b0.min, b0.max, b1.min, b1.max, evalFitness, plotWidth, plotHeight]);

  const particles = snapshot?.particles || [];
  const gbest = snapshot?.gbest || [0, 0];

  const formatVal = (v: number) => (precisionMode === 'full' ? v.toString() : v.toFixed(4));

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] select-none bg-space-950 rounded-xl overflow-hidden border border-slate-800">
      {/* 2D Contour Heatmap Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height }}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />

      {/* SVG Overlay for 2D Swarm Nodes and Trajectory Vectors */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="absolute top-0 left-0 w-full h-full overflow-visible"
      >
        <defs>
          <radialGradient id="gbest-glow-2d" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Historical 2D Particle Trails */}
        {displayOptions.showTrails && cursor > 0 && (
          <g className="trails">
            {particles.map((p) => {
              const pts: string[] = [];
              const startIter = Math.max(0, cursor - 8);
              for (let iter = startIter; iter <= cursor; iter++) {
                const pastSnap = allSnapshots[iter];
                if (pastSnap) {
                  const pastP = pastSnap.particles.find((item) => item.id === p.id);
                  if (pastP) {
                    const sx = toScreenX(pastP.x[0]);
                    const sy = toScreenY(pastP.x[1]);
                    pts.push(`${sx},${sy}`);
                  }
                }
              }
              return (
                <polyline
                  key={`trail2d-${p.id}`}
                  points={pts.join(' ')}
                  fill="none"
                  stroke={p.id === selectedParticleId ? '#38bdf8' : '#94a3b8'}
                  strokeWidth={p.id === selectedParticleId ? 2 : 1}
                  strokeDasharray="2,2"
                  opacity={p.id === selectedParticleId ? 0.9 : 0.4}
                />
              );
            })}
          </g>
        )}

        {/* Personal Best (pbest) Markers */}
        {displayOptions.showPbest &&
          particles.map((p) => {
            const px = toScreenX(p.pbest[0]);
            const py = toScreenY(p.pbest[1]);
            return (
              <circle
                key={`pbest2d-${p.id}`}
                cx={px}
                cy={py}
                r={3}
                fill="#10b981"
                stroke="#047857"
                strokeWidth={1}
                opacity={0.8}
              />
            );
          })}

        {/* Global Best (gbest) Beacon Star */}
        {Number.isFinite(gbest[0]) && Number.isFinite(gbest[1]) && (
          <g
            transform={`translate(${toScreenX(gbest[0])}, ${toScreenY(gbest[1])})`}
            className="transition-all duration-300"
          >
            <circle r={20} fill="url(#gbest-glow-2d)" />
            <circle
              r={13}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4,2"
              className="animate-spin"
              style={{ transformOrigin: 'center' }}
            />
            <path
              d="M0,-9 L2.7,-2.7 L9,-2.7 L4,1.6 L6,8 L0,4 L-6,8 L-4,1.6 L-9,-2.7 L-2.7,-2.7 Z"
              fill="#fbbf24"
              stroke="#b45309"
              strokeWidth={1}
            />
          </g>
        )}

        {/* Particles and Vector Arrows */}
        {particles.map((p) => {
          const sx = toScreenX(p.x[0]);
          const sy = toScreenY(p.x[1]);
          const isSelected = p.id === selectedParticleId;

          const vx = p.v[0] || 0;
          const vy = p.v[1] || 0;
          // Scale velocity for display
          const scale = 8;
          const vEndX = sx + vx * scale;
          const vEndY = sy - vy * scale; // in screen coordinates y is inverted

          // Vector Components for selected particle (Inertia, Cognitive, Social)
          const compX = p.components[0];
          const compY = p.components[1];

          return (
            <g
              key={`p2d-${p.id}`}
              className="cursor-pointer group"
              onClick={() => onSelectParticle(p.id)}
              onMouseEnter={() =>
                setHoveredParticle({
                  id: p.id,
                  x: p.x[0],
                  y: p.x[1],
                  f: p.fitness,
                  px: sx,
                  py: sy,
                })
              }
              onMouseLeave={() => setHoveredParticle(null)}
            >
              {/* Component Vectors Decomposition for Selected Particle */}
              {isSelected && displayOptions.showComponents && compX && compY && (
                <g className="component-vectors pointer-events-none">
                  {/* Inertia Vector (Blue) */}
                  <line
                    x1={sx}
                    y1={sy}
                    x2={sx + compX.inertia * scale}
                    y2={sy - compY.inertia * scale}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="3,2"
                  />
                  {/* Cognitive Vector (Purple) */}
                  <line
                    x1={sx}
                    y1={sy}
                    x2={sx + compX.cognitive * scale}
                    y2={sy - compY.cognitive * scale}
                    stroke="#a855f7"
                    strokeWidth={2}
                    strokeDasharray="3,2"
                  />
                  {/* Social Vector (Pink) */}
                  <line
                    x1={sx}
                    y1={sy}
                    x2={sx + compX.social * scale}
                    y2={sy - compY.social * scale}
                    stroke="#ec4899"
                    strokeWidth={2}
                    strokeDasharray="3,2"
                  />
                </g>
              )}

              {/* Net Velocity Vector Arrow */}
              {displayOptions.showVelocities && (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01) && (
                <line
                  x1={sx}
                  y1={sy}
                  x2={vEndX}
                  y2={vEndY}
                  stroke={isSelected ? '#38bdf8' : '#60a5fa'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  opacity={isSelected ? 1 : 0.75}
                />
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

              {/* Particle Circle */}
              <circle
                cx={sx}
                cy={sy}
                r={isSelected ? 7 : 5}
                fill={isSelected ? '#38bdf8' : '#06b6d4'}
                stroke="#0b1021"
                strokeWidth={2}
                className="transition-transform duration-100 hover:scale-125"
              />

              {/* Label */}
              <text
                x={sx}
                y={sy - 9}
                fill={isSelected ? '#e0f2fe' : '#cbd5e1'}
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                className="font-semibold pointer-events-none"
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
          <div className="text-slate-300">y: <span className="text-white">{formatVal(hoveredParticle.y)}</span></div>
          <div className="text-slate-300">f(x, y): <span className="text-white">{formatVal(hoveredParticle.f)}</span></div>
        </div>
      )}

      {/* 2D Landscape Legend */}
      <div className="absolute top-2 right-3 pointer-events-none flex flex-wrap items-center gap-3 text-[11px] font-mono bg-space-900/85 backdrop-blur px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Particle</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> pbest</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 text-amber-400">★</span> gbest</span>
        {displayOptions.showComponents && (
          <>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500"></span> Inertia</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-500"></span> Cognitive</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-pink-500"></span> Social</span>
          </>
        )}
      </div>
    </div>
  );
};
