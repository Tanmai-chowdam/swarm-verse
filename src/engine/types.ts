export type Dimension = 1 | 2;

export interface Bound {
  min: number;
  max: number;
}

export type BoundaryMode = 'clip' | 'reflect' | 'none';

export type ScheduleType = 'fixed' | 'linear';

export interface InertiaConfig {
  type: ScheduleType;
  w: number; // used if 'fixed'
  w0: number; // start weight if 'linear'
  w1: number; // end weight if 'linear'
}

export type OptimizationGoal = 'minimize' | 'maximize';
export type PrecisionMode = 'standard' | 'full';

export interface VelocityClamping {
  enabled: boolean;
  maxPercentage: number; // e.g., 20 means max |v| = 0.20 * (max - min)
}

export interface EarlyStopConfig {
  enabled: boolean;
  tolerance: number;
  patience: number;
}

export interface StepComponentBreakdown {
  dim: number;
  w: number;
  vPrev: number;
  inertia: number;
  c1: number;
  r1: number;
  pbestDiff: number;
  cognitive: number;
  c2: number;
  r2: number;
  gbestDiff: number;
  social: number;
  vRaw: number;
  vClamped: number;
  xPrev: number;
  xRaw: number;
  xFinal: number;
  clipped: boolean;
}

export interface ParticleState {
  id: number;
  x: number[];
  v: number[];
  fitness: number;
  score: number;
  pbest: number[];
  pbestFitness: number;
  pbestScore: number;
  pbestUpdated: boolean;
  r1: number[];
  r2: number[];
  components: StepComponentBreakdown[];
}

export interface SwarmSnapshot {
  iteration: number;
  w: number;
  particles: ParticleState[];
  gbest: number[];
  gbestFitness: number;
  gbestScore: number;
  gbestParticleId: number;
  gbestUpdated: boolean;
  avgFitness: number;
  swarmDiameter: number;
}

export interface EngineConfig {
  dimension: Dimension;
  bounds: Bound[];
  numParticles: number;
  maxIterations: number;
  goal: OptimizationGoal;
  inertia: InertiaConfig;
  c1: number;
  c2: number;
  boundaryMode: BoundaryMode;
  velocityClamping: VelocityClamping;
  seed: number;
  evalFitness: (x: number[]) => number;
  initialPositions?: number[][];
  initialVelocities?: number[][];
  initialPbests?: { x: number[]; fitness?: number }[];
  initialGbest?: { x: number[]; fitness?: number; particleId?: number };
  manualRandomDraws?: number[][][][]; // [iteration: 0..T-1][particle: 0..N-1][dim: 0..D-1][r1, r2]
  earlyStop?: EarlyStopConfig;
}

export interface PresetProblem {
  id: string;
  name: string;
  expression: string;
  dimension: Dimension;
  goal: OptimizationGoal;
  bounds: Bound[];
  defaultParams?: Partial<Omit<EngineConfig, 'bounds' | 'dimension' | 'evalFitness'>>;
  knownOptimum?: {
    x: number[];
    f: number;
    description: string;
  };
  note?: string;
}
