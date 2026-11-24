import { EngineConfig } from '../engine/types';

export interface FixtureData {
  id: string;
  name: string;
  description: string;
  config: EngineConfig;
  iterationsToTest: number;
  expectedPerIteration: {
    iteration: number;
    particles: {
      id: number;
      v: number[];
      x: number[];
      fitness: number;
      pbest: number[];
    }[];
    gbest: number[];
    gbestFitness: number;
  }[];
}

/**
 * Fixture A: Lecture Notes Problem 1
 * f(x) = x^2, bounds [-5, 5], minimize
 * w = 0.7, c1 = 1.5, c2 = 1.5
 * x0 = [4, -3, 2], v0 = [0, 0, 0]
 */
export const FIXTURE_PROBLEM_1: FixtureData = {
  id: 'fixture-problem-1',
  name: 'Problem 1: f(x) = x²',
  description: 'Minimizing x² with 3 particles on [-5, 5]. Exact match with textbook lecture tables.',
  config: {
    dimension: 1,
    bounds: [{ min: -5, max: 5 }],
    numParticles: 3,
    maxIterations: 3,
    goal: 'minimize',
    inertia: { type: 'fixed', w: 0.7, w0: 0.7, w1: 0.7 },
    c1: 1.5,
    c2: 1.5,
    boundaryMode: 'clip',
    velocityClamping: { enabled: false, maxPercentage: 0 },
    seed: 12345,
    evalFitness: (pos) => pos[0] * pos[0],
    initialPositions: [[4], [-3], [2]],
    initialVelocities: [[0], [0], [0]],
    manualRandomDraws: [
      // Iteration 1: P1(0.61, 0.86), P2(0.75, 0.25), P3(0.32, 0.84)
      [[[0.61, 0.86]], [[0.75, 0.25]], [[0.32, 0.84]]],
      // Iteration 2: P1(0.05, 0.79), P2(0.77, 0.47), P3(0.32, 0.30)
      [[[0.05, 0.79]], [[0.77, 0.47]], [[0.32, 0.30]]],
      // Iteration 3: P1(0.28, 0.45), P2(0.50, 0.55), P3(0.95, 0.76)
      [[[0.28, 0.45]], [[0.50, 0.55]], [[0.95, 0.76]]],
    ],
  },
  iterationsToTest: 3,
  expectedPerIteration: [
    {
      iteration: 1,
      particles: [
        { id: 0, v: [-2.58], x: [1.42], fitness: 2.0164, pbest: [1.42] },
        { id: 1, v: [1.875], x: [-1.125], fitness: 1.2656, pbest: [-1.125] },
        { id: 2, v: [0], x: [2], fitness: 4, pbest: [2] },
      ],
      gbest: [-1.125],
      gbestFitness: 1.2656,
    },
    {
      iteration: 2,
      particles: [
        { id: 0, v: [-4.8218], x: [-3.4018], fitness: 11.5724, pbest: [1.42] },
        { id: 1, v: [1.3125], x: [0.1875], fitness: 0.0352, pbest: [0.1875] },
        { id: 2, v: [-1.4062], x: [0.5938], fitness: 0.3525, pbest: [0.5938] },
      ],
      gbest: [0.1875],
      gbestFitness: 0.0352,
    },
    {
      iteration: 3,
      particles: [
        { id: 0, v: [1.0727], x: [-2.3291], fitness: 5.4249, pbest: [1.42] },
        { id: 1, v: [0.9187], x: [1.1062], fitness: 1.2238, pbest: [0.1875] },
        { id: 2, v: [-1.4475], x: [-0.8537], fitness: 0.7289, pbest: [0.5938] },
      ],
      gbest: [0.1875],
      gbestFitness: 0.0352,
    },
  ],
};

/**
 * Fixture B: Lecture Notes Problem 3 (Maximization!)
 * f(x) = 10 - (x - 3)^2, bounds [-10, 10], maximize
 * w = 0.7, c1 = 1.5, c2 = 1.5
 * x0 = [-4, 1, 8], v0 = [0, 0, 0]
 */
export const FIXTURE_PROBLEM_3: FixtureData = {
  id: 'fixture-problem-3',
  name: 'Problem 3: f(x) = 10 - (x - 3)²',
  description: 'Maximizing quadratic concave function with 3 particles on [-10, 10]. Tests maximization logic.',
  config: {
    dimension: 1,
    bounds: [{ min: -10, max: 10 }],
    numParticles: 3,
    maxIterations: 3,
    goal: 'maximize',
    inertia: { type: 'fixed', w: 0.7, w0: 0.7, w1: 0.7 },
    c1: 1.5,
    c2: 1.5,
    boundaryMode: 'clip',
    velocityClamping: { enabled: false, maxPercentage: 0 },
    seed: 54321,
    evalFitness: (pos) => 10 - Math.pow(pos[0] - 3, 2),
    initialPositions: [[-4], [1], [8]],
    initialVelocities: [[0], [0], [0]],
    manualRandomDraws: [
      // Iteration 1: P1(0.17, 0.50), P2(0.59, 0.08), P3(0.18, 0.89)
      [[[0.17, 0.50]], [[0.59, 0.08]], [[0.18, 0.89]]],
      // Iteration 2: P1(0.11, 0.17), P2(0.90, 0.61), P3(0.38, 0.51)
      [[[0.11, 0.17]], [[0.90, 0.61]], [[0.38, 0.51]]],
      // Iteration 3: P1(0.65, 0.30), P2(0.17, 0.76), P3(0.65, 0.51)
      [[[0.65, 0.30]], [[0.17, 0.76]], [[0.65, 0.51]]],
    ],
  },
  iterationsToTest: 3,
  expectedPerIteration: [
    {
      iteration: 1,
      particles: [
        { id: 0, v: [3.75], x: [-0.25], fitness: -0.5625, pbest: [-0.25] },
        { id: 1, v: [0], x: [1], fitness: 6, pbest: [1] },
        { id: 2, v: [-9.345], x: [-1.345], fitness: -8.8790, pbest: [-1.345] },
      ],
      gbest: [1],
      gbestFitness: 6,
    },
    {
      iteration: 2,
      particles: [
        { id: 0, v: [2.9437], x: [2.6937], fitness: 9.9062, pbest: [2.6937] },
        { id: 1, v: [0], x: [1], fitness: 6, pbest: [1] },
        { id: 2, v: [-4.7476], x: [-6.0926], fitness: -72.6754, pbest: [-1.345] },
      ],
      gbest: [2.6937],
      gbestFitness: 9.9062,
    },
    {
      iteration: 3,
      particles: [
        { id: 0, v: [2.0606], x: [4.7543], fitness: 6.9224, pbest: [2.6937] },
        { id: 1, v: [1.9308], x: [2.9308], fitness: 9.9952, pbest: [2.9308] },
        { id: 2, v: [8.0271], x: [1.9345], fitness: 8.8648, pbest: [1.9345] },
      ],
      gbest: [2.9308],
      gbestFitness: 9.9952,
    },
  ],
};

/**
 * Fixture C: Exercise 1
 * Problem 1 Iteration 1 with r1 = r2 = 0.5
 * Expected v = [-1.5, 3.75, 0], x = [2.5, 0.75, 2], new gbest = 0.75 (f = 0.5625)
 */
export const FIXTURE_EXERCISE_1: FixtureData = {
  id: 'fixture-exercise-1',
  name: 'Exercise 1: Deterministic r1=r2=0.5',
  description: 'Problem 1 with constant r1=0.5, r2=0.5 for iteration 1.',
  config: {
    dimension: 1,
    bounds: [{ min: -5, max: 5 }],
    numParticles: 3,
    maxIterations: 1,
    goal: 'minimize',
    inertia: { type: 'fixed', w: 0.7, w0: 0.7, w1: 0.7 },
    c1: 1.5,
    c2: 1.5,
    boundaryMode: 'clip',
    velocityClamping: { enabled: false, maxPercentage: 0 },
    seed: 999,
    evalFitness: (pos) => pos[0] * pos[0],
    initialPositions: [[4], [-3], [2]],
    initialVelocities: [[0], [0], [0]],
    manualRandomDraws: [
      [[[0.5, 0.5]], [[0.5, 0.5]], [[0.5, 0.5]]],
    ],
  },
  iterationsToTest: 1,
  expectedPerIteration: [
    {
      iteration: 1,
      particles: [
        { id: 0, v: [-1.5], x: [2.5], fitness: 6.25, pbest: [2.5] },
        { id: 1, v: [3.75], x: [0.75], fitness: 0.5625, pbest: [0.75] },
        { id: 2, v: [0], x: [2], fitness: 4, pbest: [2] },
      ],
      gbest: [0.75],
      gbestFitness: 0.5625,
    },
  ],
};
