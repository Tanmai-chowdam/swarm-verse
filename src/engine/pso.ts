import { EngineConfig, SwarmSnapshot, ParticleState, StepComponentBreakdown } from './types';
import { Mulberry32 } from './rng';
import { toScore, isStrictlyBetter } from './fitness';

/**
 * Calculates Euclidean distance between two points
 */
export function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Calculates the diameter of the swarm (maximum distance between any pair of particles)
 */
export function computeSwarmDiameter(particles: { x: number[] }[]): number {
  let maxDist = 0;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dist = euclideanDistance(particles[i].x, particles[j].x);
      if (dist > maxDist) maxDist = dist;
    }
  }
  return maxDist;
}

/**
 * Get inertia weight for iteration t (1-indexed for simulation iterations)
 */
export function getInertiaWeight(config: EngineConfig, iteration: number): number {
  if (config.inertia.type === 'fixed') {
    return config.inertia.w;
  }
  const { w0, w1 } = config.inertia;
  const maxIter = Math.max(1, config.maxIterations);
  // Linear schedule: w = w0 - (w0 - w1) * (t - 1) / (T - 1)
  const progress = (iteration - 1) / Math.max(1, maxIter - 1);
  return w0 - (w0 - w1) * Math.min(1, Math.max(0, progress));
}

/**
 * Clamp a value between min and max
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * Core PSO engine function.
 * Pure function: takes an EngineConfig and returns the complete immutable snapshot history.
 */
export function runPSO(config: EngineConfig): SwarmSnapshot[] {
  const rng = new Mulberry32(config.seed);
  const snapshots: SwarmSnapshot[] = [];

  const dim = config.dimension;
  const numParticles = config.numParticles;
  const maxIterations = config.maxIterations;
  const bounds = config.bounds;

  // 1. Initial State (Iteration 0)
  const initialParticles: ParticleState[] = [];
  let bestInitialIdx = 0;
  let bestInitialScore = -Infinity;

  for (let i = 0; i < numParticles; i++) {
    const x: number[] = [];
    const v: number[] = [];

    for (let d = 0; d < dim; d++) {
      const b = bounds[d];
      if (config.initialPositions && config.initialPositions[i] && config.initialPositions[i][d] !== undefined) {
        x.push(config.initialPositions[i][d]);
      } else {
        const rInit = rng.next();
        x.push(b.min + rInit * (b.max - b.min));
      }

      if (config.initialVelocities && config.initialVelocities[i] && config.initialVelocities[i][d] !== undefined) {
        v.push(config.initialVelocities[i][d]);
      } else {
        v.push(0); // Default v0 = 0 (eq. 16.10)
      }
    }

    const fitness = config.evalFitness(x);
    const score = toScore(fitness, config.goal);

    // Initial pbest
    let pbest = [...x];
    let pbestFitness = fitness;
    let pbestScore = score;

    if (config.initialPbests && config.initialPbests[i]) {
      pbest = [...config.initialPbests[i].x];
      pbestFitness = config.initialPbests[i].fitness ?? config.evalFitness(pbest);
      pbestScore = toScore(pbestFitness, config.goal);
    }

    if (isStrictlyBetter(pbestScore, bestInitialScore)) {
      bestInitialScore = pbestScore;
      bestInitialIdx = i;
    }

    initialParticles.push({
      id: i,
      x: [...x],
      v: [...v],
      fitness,
      score,
      pbest,
      pbestFitness,
      pbestScore,
      pbestUpdated: true,
      r1: new Array(dim).fill(0),
      r2: new Array(dim).fill(0),
      components: [],
    });
  }

  let initialGbest = [...initialParticles[bestInitialIdx].pbest];
  let initialGbestFitness = initialParticles[bestInitialIdx].pbestFitness;
  let initialGbestScore = initialParticles[bestInitialIdx].pbestScore;
  let initialGbestParticleId = bestInitialIdx;

  if (config.initialGbest) {
    initialGbest = [...config.initialGbest.x];
    initialGbestFitness = config.initialGbest.fitness ?? config.evalFitness(initialGbest);
    initialGbestScore = toScore(initialGbestFitness, config.goal);
    initialGbestParticleId = config.initialGbest.particleId ?? 0;
  }

  const avgInitialFitness =
    initialParticles.reduce((acc, p) => acc + (Number.isFinite(p.fitness) ? p.fitness : 0), 0) / numParticles;

  snapshots.push({
    iteration: 0,
    w: getInertiaWeight(config, 1),
    particles: initialParticles,
    gbest: [...initialGbest],
    gbestFitness: initialGbestFitness,
    gbestScore: initialGbestScore,
    gbestParticleId: initialGbestParticleId,
    gbestUpdated: true,
    avgFitness: avgInitialFitness,
    swarmDiameter: computeSwarmDiameter(initialParticles),
  });

  // 2. Iterations 1 to T
  let currentParticles = initialParticles.map((p) => ({
    ...p,
    x: [...p.x],
    v: [...p.v],
    pbest: [...p.pbest],
  }));

  let currentGbest = [...initialGbest];
  let currentGbestFitness = initialGbestFitness;
  let currentGbestScore = initialGbestScore;
  let currentGbestParticleId = initialGbestParticleId;

  let stagnationCount = 0;

  for (let t = 1; t <= maxIterations; t++) {
    const w = getInertiaWeight(config, t);
    // Frozen gbest from end of previous iteration (Synchronous PSO)
    const frozenGbest = [...currentGbest];

    const nextParticles: ParticleState[] = [];

    // Movement and evaluation loop
    for (let i = 0; i < numParticles; i++) {
      const p = currentParticles[i];
      const newX: number[] = [];
      const newV: number[] = [];
      const r1Arr: number[] = [];
      const r2Arr: number[] = [];
      const components: StepComponentBreakdown[] = [];

      for (let d = 0; d < dim; d++) {
        const b = bounds[d];

        // Draw order: r1, then r2 per dimension
        let r1 = 0;
        let r2 = 0;
        if (config.manualRandomDraws?.[t - 1]?.[i]?.[d]) {
          r1 = config.manualRandomDraws[t - 1][i][d][0];
          r2 = config.manualRandomDraws[t - 1][i][d][1];
        } else {
          r1 = rng.next();
          r2 = rng.next();
        }
        r1Arr.push(r1);
        r2Arr.push(r2);

        // Core PSO formula: v' = w*v + c1*r1*(pbest - x) + c2*r2*(gbest - x)
        const vPrev = p.v[d];
        const xPrev = p.x[d];
        const inertiaTerm = w * vPrev;
        const pbestDiff = p.pbest[d] - xPrev;
        const cognitiveTerm = config.c1 * r1 * pbestDiff;
        const gbestDiff = frozenGbest[d] - xPrev;
        const socialTerm = config.c2 * r2 * gbestDiff;

        const vRaw = inertiaTerm + cognitiveTerm + socialTerm;

        // Velocity Clamping
        let vClamped = vRaw;
        if (config.velocityClamping.enabled && config.velocityClamping.maxPercentage > 0) {
          const maxV = (config.velocityClamping.maxPercentage / 100) * (b.max - b.min);
          vClamped = clamp(vRaw, -maxV, maxV);
        }

        // Position Update: x' = x + v'
        const xRaw = xPrev + vClamped;
        let xFinal = xRaw;
        let clipped = false;

        // Boundary Handling
        let vFinal = vClamped;
        if (config.boundaryMode === 'clip') {
          if (xRaw < b.min) {
            xFinal = b.min;
            clipped = true;
          } else if (xRaw > b.max) {
            xFinal = b.max;
            clipped = true;
          }
          // Note from Sections 3 & 7: keep velocity unchanged after clipping
        } else if (config.boundaryMode === 'reflect') {
          if (xRaw < b.min) {
            xFinal = b.min + (b.min - xRaw);
            vFinal = -vClamped;
            clipped = true;
          } else if (xRaw > b.max) {
            xFinal = b.max - (xRaw - b.max);
            vFinal = -vClamped;
            clipped = true;
          }
        }

        newX.push(xFinal);
        newV.push(vFinal);

        components.push({
          dim: d,
          w,
          vPrev,
          inertia: inertiaTerm,
          c1: config.c1,
          r1,
          pbestDiff,
          cognitive: cognitiveTerm,
          c2: config.c2,
          r2,
          gbestDiff,
          social: socialTerm,
          vRaw,
          vClamped,
          xPrev,
          xRaw,
          xFinal,
          clipped,
        });
      }

      // Evaluate candidate fitness
      const fitness = config.evalFitness(newX);
      const score = toScore(fitness, config.goal);

      // pbest update (strict improvement)
      let pbestUpdated = false;
      let newPbest = [...p.pbest];
      let newPbestFitness = p.pbestFitness;
      let newPbestScore = p.pbestScore;

      if (isStrictlyBetter(score, p.pbestScore)) {
        newPbest = [...newX];
        newPbestFitness = fitness;
        newPbestScore = score;
        pbestUpdated = true;
      }

      nextParticles.push({
        id: i,
        x: newX,
        v: newV,
        fitness,
        score,
        pbest: newPbest,
        pbestFitness: newPbestFitness,
        pbestScore: newPbestScore,
        pbestUpdated,
        r1: r1Arr,
        r2: r2Arr,
        components,
      });
    }

    // Synchronous gbest update (after all particles have moved and updated pbest)
    let gbestUpdated = false;
    let iterBestScore = currentGbestScore;
    let iterBestIdx = currentGbestParticleId;
    let iterBestPbest = [...currentGbest];
    let iterBestFitness = currentGbestFitness;

    for (let i = 0; i < numParticles; i++) {
      const p = nextParticles[i];
      if (isStrictlyBetter(p.pbestScore, iterBestScore)) {
        iterBestScore = p.pbestScore;
        iterBestIdx = i;
        iterBestPbest = [...p.pbest];
        iterBestFitness = p.pbestFitness;
        gbestUpdated = true;
      }
    }

    if (gbestUpdated) {
      currentGbest = iterBestPbest;
      currentGbestFitness = iterBestFitness;
      currentGbestScore = iterBestScore;
      currentGbestParticleId = iterBestIdx;
      stagnationCount = 0;
    } else {
      stagnationCount++;
    }

    currentParticles = nextParticles;

    const avgFitness =
      nextParticles.reduce((acc, p) => acc + (Number.isFinite(p.fitness) ? p.fitness : 0), 0) / numParticles;

    snapshots.push({
      iteration: t,
      w,
      particles: nextParticles,
      gbest: [...currentGbest],
      gbestFitness: currentGbestFitness,
      gbestScore: currentGbestScore,
      gbestParticleId: currentGbestParticleId,
      gbestUpdated,
      avgFitness,
      swarmDiameter: computeSwarmDiameter(nextParticles),
    });

    // Check early stop
    if (
      config.earlyStop?.enabled &&
      stagnationCount >= config.earlyStop.patience
    ) {
      break;
    }
  }

  return snapshots;
}
