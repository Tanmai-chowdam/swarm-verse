import { OptimizationGoal } from './types';

/**
 * Computes the internal score from raw fitness.
 * A higher score is ALWAYS better, unifying minimization and maximization into one code path.
 * 
 * Minimization: score = -f(x)
 * Maximization: score = +f(x)
 */
export function toScore(fitness: number, goal: OptimizationGoal): number {
  if (Number.isNaN(fitness) || !Number.isFinite(fitness)) {
    return -Infinity;
  }
  return goal === 'maximize' ? fitness : -fitness;
}

/**
 * Returns true if candidateScore is strictly better than currentScore.
 * Adheres to the strict improvement requirement from textbook & plan.
 */
export function isStrictlyBetter(candidateScore: number, currentScore: number): boolean {
  if (Number.isNaN(candidateScore) || candidateScore === -Infinity) return false;
  if (Number.isNaN(currentScore) || currentScore === -Infinity) return true;
  return candidateScore > currentScore;
}
