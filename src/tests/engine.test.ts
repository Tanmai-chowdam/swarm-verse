import { describe, it, expect } from 'vitest';
import { runPSO } from '../engine/pso';
import { EngineConfig } from '../engine/types';

describe('Deterministic PSO Engine', () => {
  it('produces identical snapshots for the same seed and different for different seeds', () => {
    const configBase: EngineConfig = {
      dimension: 1,
      bounds: [{ min: -5, max: 5 }],
      numParticles: 10,
      maxIterations: 10,
      goal: 'minimize',
      inertia: { type: 'fixed', w: 0.7, w0: 0.7, w1: 0.7 },
      c1: 1.5,
      c2: 1.5,
      boundaryMode: 'clip',
      velocityClamping: { enabled: false, maxPercentage: 0 },
      seed: 42,
      evalFitness: (pos) => pos[0] * pos[0],
    };

    const run1 = runPSO(configBase);
    const run2 = runPSO(configBase);
    const run3 = runPSO({ ...configBase, seed: 99 });

    // Same seed -> exactly identical
    expect(run1).toEqual(run2);

    // Different seed -> different
    expect(run1[run1.length - 1].gbest).not.toEqual(run3[run3.length - 1].gbest);
  });

  it('ensures gbest fitness never worsens for minimization', () => {
    const config: EngineConfig = {
      dimension: 2,
      bounds: [{ min: -5, max: 5 }, { min: -5, max: 5 }],
      numParticles: 20,
      maxIterations: 25,
      goal: 'minimize',
      inertia: { type: 'fixed', w: 0.7, w0: 0.7, w1: 0.7 },
      c1: 1.5,
      c2: 1.5,
      boundaryMode: 'clip',
      velocityClamping: { enabled: false, maxPercentage: 0 },
      seed: 1234,
      evalFitness: (p) => p[0] * p[0] + p[1] * p[1],
    };

    const snapshots = runPSO(config);
    for (let t = 1; t < snapshots.length; t++) {
      expect(snapshots[t].gbestFitness).toBeLessThanOrEqual(snapshots[t - 1].gbestFitness);
    }
  });

  it('ensures gbest fitness never worsens for maximization', () => {
    const config: EngineConfig = {
      dimension: 2,
      bounds: [{ min: -5, max: 5 }, { min: -5, max: 5 }],
      numParticles: 20,
      maxIterations: 25,
      goal: 'maximize',
      inertia: { type: 'fixed', w: 0.7, w0: 0.7, w1: 0.7 },
      c1: 1.5,
      c2: 1.5,
      boundaryMode: 'clip',
      velocityClamping: { enabled: false, maxPercentage: 0 },
      seed: 5678,
      evalFitness: (p) => -(p[0] * p[0] + p[1] * p[1]),
    };

    const snapshots = runPSO(config);
    for (let t = 1; t < snapshots.length; t++) {
      expect(snapshots[t].gbestFitness).toBeGreaterThanOrEqual(snapshots[t - 1].gbestFitness);
    }
  });

  it('minimizing -f and maximizing f with identical seed give identical trajectory (Exercise 3 symmetry)', () => {
    const baseConfig = {
      dimension: 1 as const,
      bounds: [{ min: -10, max: 10 }],
      numParticles: 5,
      maxIterations: 10,
      inertia: { type: 'fixed' as const, w: 0.7, w0: 0.7, w1: 0.7 },
      c1: 1.5,
      c2: 1.5,
      boundaryMode: 'clip' as const,
      velocityClamping: { enabled: false, maxPercentage: 0 },
      seed: 777,
    };

    const minSnaps = runPSO({
      ...baseConfig,
      goal: 'minimize',
      evalFitness: (p) => -(10 - Math.pow(p[0] - 3, 2)), // -f
    });

    const maxSnaps = runPSO({
      ...baseConfig,
      goal: 'maximize',
      evalFitness: (p) => 10 - Math.pow(p[0] - 3, 2), // +f
    });

    expect(minSnaps.length).toBe(maxSnaps.length);
    for (let t = 0; t < minSnaps.length; t++) {
      for (let i = 0; i < minSnaps[t].particles.length; i++) {
        expect(minSnaps[t].particles[i].x[0]).toBeCloseTo(maxSnaps[t].particles[i].x[0], 10);
        expect(minSnaps[t].particles[i].v[0]).toBeCloseTo(maxSnaps[t].particles[i].v[0], 10);
      }
      expect(minSnaps[t].gbest[0]).toBeCloseTo(maxSnaps[t].gbest[0], 10);
    }
  });

  it('clip boundary keeps position within bounds and retains velocity unchanged', () => {
    const config: EngineConfig = {
      dimension: 1,
      bounds: [{ min: -2, max: 2 }],
      numParticles: 1,
      maxIterations: 1,
      goal: 'minimize',
      inertia: { type: 'fixed', w: 1, w0: 1, w1: 1 },
      c1: 0,
      c2: 0,
      boundaryMode: 'clip',
      velocityClamping: { enabled: false, maxPercentage: 0 },
      seed: 1,
      evalFitness: (p) => p[0],
      initialPositions: [[1.5]],
      initialVelocities: [[2.0]], // Will overshoot 1.5 + 2.0 = 3.5 > max 2.0
    };

    const snapshots = runPSO(config);
    const snap1 = snapshots[1];
    expect(snap1.particles[0].x[0]).toBe(2.0); // Clipped to bound.max
    expect(snap1.particles[0].v[0]).toBe(2.0); // Velocity remains unchanged per plan Section 3 & 7!
    expect(snap1.particles[0].components[0].clipped).toBe(true);
  });

  it('with w=1, c1=0, c2=0 positions follow x + v * t', () => {
    const config: EngineConfig = {
      dimension: 1,
      bounds: [{ min: -100, max: 100 }],
      numParticles: 1,
      maxIterations: 5,
      goal: 'minimize',
      inertia: { type: 'fixed', w: 1, w0: 1, w1: 1 },
      c1: 0,
      c2: 0,
      boundaryMode: 'none',
      velocityClamping: { enabled: false, maxPercentage: 0 },
      seed: 1,
      evalFitness: (p) => p[0],
      initialPositions: [[10]],
      initialVelocities: [[2]],
    };

    const snapshots = runPSO(config);
    for (let t = 0; t <= 5; t++) {
      expect(snapshots[t].particles[0].x[0]).toBeCloseTo(10 + 2 * t, 8);
      expect(snapshots[t].particles[0].v[0]).toBeCloseTo(2, 8);
    }
  });

  it('a particle already at gbest and pbest with v=0 stays put', () => {
    const config: EngineConfig = {
      dimension: 1,
      bounds: [{ min: -5, max: 5 }],
      numParticles: 1,
      maxIterations: 3,
      goal: 'minimize',
      inertia: { type: 'fixed', w: 0.7, w0: 0.7, w1: 0.7 },
      c1: 1.5,
      c2: 1.5,
      boundaryMode: 'clip',
      velocityClamping: { enabled: false, maxPercentage: 0 },
      seed: 1,
      evalFitness: (p) => p[0] * p[0],
      initialPositions: [[0]],
      initialVelocities: [[0]],
    };

    const snapshots = runPSO(config);
    for (let t = 0; t <= 3; t++) {
      expect(snapshots[t].particles[0].x[0]).toBe(0);
      expect(snapshots[t].particles[0].v[0]).toBe(0);
    }
  });

  it('runs Rastrigin benchmark over 10 seeds and successfully finds global optimum near 0', () => {
    // f(x, y) = x^2 + y^2 - 10*(cos(2*pi*x) + cos(2*pi*y)) + 20 on [-5.12, 5.12]
    const rastrigin = (p: number[]) =>
      p[0] * p[0] +
      p[1] * p[1] -
      10 * (Math.cos(2 * Math.PI * p[0]) + Math.cos(2 * Math.PI * p[1])) +
      20;

    let successfulRuns = 0;
    const testSeeds = [101, 202, 303, 404, 505, 606, 707, 808, 909, 1001];

    for (const seed of testSeeds) {
      const config: EngineConfig = {
        dimension: 2,
        bounds: [
          { min: -5.12, max: 5.12 },
          { min: -5.12, max: 5.12 },
        ],
        numParticles: 35,
        maxIterations: 80,
        goal: 'minimize',
        inertia: { type: 'linear', w: 0.9, w0: 0.9, w1: 0.4 },
        c1: 2.0,
        c2: 2.0,
        boundaryMode: 'clip',
        velocityClamping: { enabled: true, maxPercentage: 20 },
        seed,
        evalFitness: rastrigin,
      };

      const snaps = runPSO(config);
      const finalBest = snaps[snaps.length - 1].gbestFitness;
      if (finalBest < 0.1) {
        successfulRuns++;
      }
    }

    // High success rate on 121 local minima surface
    expect(successfulRuns).toBeGreaterThanOrEqual(7);
  });
});
