import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dimension,
  Bound,
  BoundaryMode,
  InertiaConfig,
  OptimizationGoal,
  VelocityClamping,
  SwarmSnapshot,
  EngineConfig,
  PresetProblem,
} from '../engine/types';
import { runPSO } from '../engine/pso';
import { validateExpression, ValidationResult } from '../parser/validate';
import { compileExpression } from '../parser/compile';

export interface DisplayOptions {
  showTrails: boolean;
  showVelocities: boolean;
  showComponents: boolean;
  showPbest: boolean;
  showDropLines: boolean;
}

export type ActiveTab = 'solver' | 'textbook' | 'manual' | 'reference';
export type PrecisionMode = 'standard' | 'full';

export function useSimulation() {
  // Mode Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('solver');

  // Problem Definition
  const [expression, setExpression] = useState<string>('x^2');
  const [dimension, setDimension] = useState<Dimension>(1);
  const [goal, setGoal] = useState<OptimizationGoal>('minimize');
  const [bounds, setBounds] = useState<Bound[]>([{ min: -5, max: 5 }]);
  const [activePresetId, setActivePresetId] = useState<string>('preset-1');

  // Swarm Parameters
  const [numParticles, setNumParticles] = useState<number>(15);
  const [maxIterations, setMaxIterations] = useState<number>(30);
  const [inertia, setInertia] = useState<InertiaConfig>({
    type: 'fixed',
    w: 0.7,
    w0: 0.7,
    w1: 0.7,
  });
  const [c1, setC1] = useState<number>(1.5);
  const [c2, setC2] = useState<number>(1.5);
  const [boundaryMode, setBoundaryMode] = useState<BoundaryMode>('clip');
  const [velocityClamping, setVelocityClamping] = useState<VelocityClamping>({
    enabled: false,
    maxPercentage: 20,
  });
  const [seed, setSeed] = useState<number>(1337);

  // Manual Inputs
  const [manualPositions, setManualPositions] = useState<number[][] | undefined>(undefined);
  const [manualVelocities, setManualVelocities] = useState<number[][] | undefined>(undefined);
  const [manualRandomDraws, setManualRandomDraws] = useState<number[][][][] | undefined>(undefined);

  // Playback & Inspector State
  const [snapshots, setSnapshots] = useState<SwarmSnapshot[]>([]);
  const [cursor, setCursor] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(4); // iterations per second
  const [selectedParticleId, setSelectedParticleId] = useState<number>(0);
  const [precisionMode, setPrecisionMode] = useState<PrecisionMode>('standard');

  // Visual Display Overlays
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showTrails: true,
    showVelocities: true,
    showComponents: true,
    showPbest: true,
    showDropLines: true,
  });

  // Validation
  const [validation, setValidation] = useState<ValidationResult>(() =>
    validateExpression('x^2', 1, [{ min: -5, max: 5 }])
  );

  // Live expression validation on change
  useEffect(() => {
    const res = validateExpression(expression, dimension, bounds);
    setValidation(res);
  }, [expression, dimension, bounds]);

  // Run Simulation PSO Engine
  const runSimulation = useCallback(() => {
    const val = validateExpression(expression, dimension, bounds);
    setValidation(val);
    if (!val.isValid) return;

    const evalFitness = compileExpression(expression);

    const config: EngineConfig = {
      dimension,
      bounds,
      numParticles,
      maxIterations,
      goal,
      inertia,
      c1,
      c2,
      boundaryMode,
      velocityClamping,
      seed,
      evalFitness,
      initialPositions:
        manualPositions &&
        manualPositions.length === numParticles &&
        manualPositions[0]?.length === dimension
          ? manualPositions
          : undefined,
      initialVelocities:
        manualVelocities &&
        manualVelocities.length === numParticles &&
        manualVelocities[0]?.length === dimension
          ? manualVelocities
          : undefined,
      manualRandomDraws,
    };

    const newSnapshots = runPSO(config);
    setSnapshots(newSnapshots);
    setCursor(0);
    setIsPlaying(false);
  }, [
    expression,
    dimension,
    bounds,
    numParticles,
    maxIterations,
    goal,
    inertia,
    c1,
    c2,
    boundaryMode,
    velocityClamping,
    seed,
    manualPositions,
    manualVelocities,
    manualRandomDraws,
  ]);

  // Initial Run on Mount
  useEffect(() => {
    runSimulation();
  }, []);

  // Animation Playback Loop using requestAnimationFrame with accumulator
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      accumulatorRef.current = 0;
      return;
    }

    let animId: number;

    const tick = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Accumulate time based on speed (iter/sec)
      const stepDurationMs = 1000 / Math.max(0.5, playbackSpeed);
      accumulatorRef.current += deltaMs;

      if (accumulatorRef.current >= stepDurationMs) {
        const stepsToAdvance = Math.floor(accumulatorRef.current / stepDurationMs);
        accumulatorRef.current %= stepDurationMs;

        setCursor((prevCursor) => {
          const nextCursor = prevCursor + stepsToAdvance;
          if (nextCursor >= snapshots.length - 1) {
            setIsPlaying(false);
            return snapshots.length - 1;
          }
          return nextCursor;
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed, snapshots.length]);

  // Playback Control Handlers
  const play = useCallback(() => {
    if (cursor >= snapshots.length - 1) {
      setCursor(0);
    }
    setIsPlaying(true);
  }, [cursor, snapshots.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setCursor((c) => Math.min(snapshots.length - 1, c + 1));
  }, [snapshots.length]);

  const stepBackward = useCallback(() => {
    setIsPlaying(false);
    setCursor((c) => Math.max(0, c - 1));
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCursor(0);
  }, []);

  const jumpToEnd = useCallback(() => {
    setIsPlaying(false);
    setCursor(Math.max(0, snapshots.length - 1));
  }, [snapshots.length]);

  const rerollSeed = useCallback(() => {
    const nextSeed = Math.floor(Math.random() * 1000000);
    setSeed(nextSeed);
  }, []);

  // Load a Preset
  const loadPreset = useCallback((preset: PresetProblem) => {
    setActivePresetId(preset.id);
    setExpression(preset.expression);
    setDimension(preset.dimension);
    setGoal(preset.goal);
    setBounds(preset.bounds.map((b) => ({ ...b })));

    if (preset.defaultParams) {
      if (preset.defaultParams.numParticles !== undefined) {
        setNumParticles(preset.defaultParams.numParticles);
      }
      if (preset.defaultParams.maxIterations !== undefined) {
        setMaxIterations(preset.defaultParams.maxIterations);
      }
      if (preset.defaultParams.c1 !== undefined) setC1(preset.defaultParams.c1);
      if (preset.defaultParams.c2 !== undefined) setC2(preset.defaultParams.c2);
      if (preset.defaultParams.inertia) setInertia({ ...preset.defaultParams.inertia });
      if (preset.defaultParams.boundaryMode) setBoundaryMode(preset.defaultParams.boundaryMode);
      if (preset.defaultParams.velocityClamping) {
        setVelocityClamping({ ...preset.defaultParams.velocityClamping });
      }
    }

    setManualPositions(undefined);
    setManualVelocities(undefined);
    setManualRandomDraws(undefined);

    // Compute immediately for the new preset
    const evalFitness = compileExpression(preset.expression);
    const config: EngineConfig = {
      dimension: preset.dimension,
      bounds: preset.bounds,
      numParticles: preset.defaultParams?.numParticles ?? numParticles,
      maxIterations: preset.defaultParams?.maxIterations ?? maxIterations,
      goal: preset.goal,
      inertia: preset.defaultParams?.inertia ?? inertia,
      c1: preset.defaultParams?.c1 ?? c1,
      c2: preset.defaultParams?.c2 ?? c2,
      boundaryMode: preset.defaultParams?.boundaryMode ?? boundaryMode,
      velocityClamping: preset.defaultParams?.velocityClamping ?? velocityClamping,
      seed,
      evalFitness,
    };
    const newSnaps = runPSO(config);
    setSnapshots(newSnaps);
    setCursor(0);
    setIsPlaying(false);
  }, [numParticles, maxIterations, c1, c2, inertia, boundaryMode, velocityClamping, seed]);

  return {
    // Tab & Mode
    activeTab,
    setActiveTab,
    precisionMode,
    setPrecisionMode,

    // Problem State
    expression,
    setExpression,
    dimension,
    setDimension,
    goal,
    setGoal,
    bounds,
    setBounds,
    activePresetId,
    setActivePresetId,
    loadPreset,
    validation,

    // Parameters
    numParticles,
    setNumParticles,
    maxIterations,
    setMaxIterations,
    inertia,
    setInertia,
    c1,
    setC1,
    c2,
    setC2,
    boundaryMode,
    setBoundaryMode,
    velocityClamping,
    setVelocityClamping,
    seed,
    setSeed,
    rerollSeed,

    // Manual Setup
    manualPositions,
    setManualPositions,
    manualVelocities,
    setManualVelocities,
    manualRandomDraws,
    setManualRandomDraws,

    // Simulation Data & Controls
    snapshots,
    currentSnapshot: snapshots[cursor] || snapshots[0],
    cursor,
    setCursor,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    play,
    pause,
    togglePlay,
    stepForward,
    stepBackward,
    reset,
    jumpToEnd,
    runSimulation,

    // Inspector & Display Options
    selectedParticleId,
    setSelectedParticleId,
    displayOptions,
    setDisplayOptions,
  };
}
