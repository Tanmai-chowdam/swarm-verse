import { FixtureData } from './fixtures';
import { runPSO } from '../engine/pso';
import { EngineConfig, SwarmSnapshot } from '../engine/types';

export interface ComparisonCell {
  iteration: number;
  target: string; // e.g. "P1 v", "P2 x", "gbest", "gbest f"
  expected: number;
  actual: number;
  diff: number;
  tolerance: number;
  passed: boolean;
}

export interface VerificationResult {
  fixtureId: string;
  name: string;
  mode: 'full-chain' | 'per-step';
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  cells: ComparisonCell[];
  snapshots: SwarmSnapshot[];
}

/**
 * Compare two numbers within tolerance
 */
export function withinTolerance(actual: number, expected: number, tol: number): boolean {
  if (Number.isNaN(actual) || Number.isNaN(expected)) return false;
  return Math.abs(actual - expected) <= tol;
}

/**
 * Run verification on a textbook fixture.
 * 
 * In 'full-chain' mode: runs entire simulation from x0 and v0 using recorded r1, r2.
 * In 'per-step' mode: at each step, feeds previous printed textbook state to check single-step calculation.
 */
export function verifyFixture(
  fixture: FixtureData,
  mode: 'full-chain' | 'per-step' = 'full-chain'
): VerificationResult {
  const cells: ComparisonCell[] = [];
  let passedCount = 0;
  let totalCount = 0;

  if (mode === 'full-chain') {
    const snapshots = runPSO(fixture.config);

    for (const expectedStep of fixture.expectedPerIteration) {
      const iter = expectedStep.iteration;
      const snap = snapshots[iter];
      if (!snap) continue;

      // Allow 5e-4 tolerance, or 1.5e-3 from iteration 3 for rounding accumulation
      const tol = iter >= 3 ? 1.5e-3 : 5e-4;

      // Check each particle
      for (const expectedP of expectedStep.particles) {
        const actualP = snap.particles.find((p) => p.id === expectedP.id);
        if (!actualP) continue;

        // Check velocity
        for (let d = 0; d < expectedP.v.length; d++) {
          const exp = expectedP.v[d];
          const act = actualP.v[d];
          const diff = Math.abs(act - exp);
          const ok = withinTolerance(act, exp, tol);
          totalCount++;
          if (ok) passedCount++;
          cells.push({
            iteration: iter,
            target: `P${expectedP.id + 1} v[${d}]`,
            expected: exp,
            actual: act,
            diff,
            tolerance: tol,
            passed: ok,
          });
        }

        // Check position x
        for (let d = 0; d < expectedP.x.length; d++) {
          const exp = expectedP.x[d];
          const act = actualP.x[d];
          const diff = Math.abs(act - exp);
          const ok = withinTolerance(act, exp, tol);
          totalCount++;
          if (ok) passedCount++;
          cells.push({
            iteration: iter,
            target: `P${expectedP.id + 1} x[${d}]`,
            expected: exp,
            actual: act,
            diff,
            tolerance: tol,
            passed: ok,
          });
        }

        // Check pbest
        for (let d = 0; d < expectedP.pbest.length; d++) {
          const exp = expectedP.pbest[d];
          const act = actualP.pbest[d];
          const diff = Math.abs(act - exp);
          const ok = withinTolerance(act, exp, tol);
          totalCount++;
          if (ok) passedCount++;
          cells.push({
            iteration: iter,
            target: `P${expectedP.id + 1} pbest[${d}]`,
            expected: exp,
            actual: act,
            diff,
            tolerance: tol,
            passed: ok,
          });
        }
      }

      // Check gbest position
      for (let d = 0; d < expectedStep.gbest.length; d++) {
        const exp = expectedStep.gbest[d];
        const act = snap.gbest[d];
        const diff = Math.abs(act - exp);
        const ok = withinTolerance(act, exp, tol);
        totalCount++;
        if (ok) passedCount++;
        cells.push({
          iteration: iter,
          target: `gbest[${d}]`,
          expected: exp,
          actual: act,
          diff,
          tolerance: tol,
          passed: ok,
        });
      }

      // Check gbest fitness
      const expF = expectedStep.gbestFitness;
      const actF = snap.gbestFitness;
      const diffF = Math.abs(actF - expF);
      const okF = withinTolerance(actF, expF, tol);
      totalCount++;
      if (okF) passedCount++;
      cells.push({
        iteration: iter,
        target: `f(gbest)`,
        expected: expF,
        actual: actF,
        diff: diffF,
        tolerance: tol,
        passed: okF,
      });
    }

    return {
      fixtureId: fixture.id,
      name: fixture.name,
      mode,
      passed: passedCount === totalCount,
      totalChecks: totalCount,
      passedChecks: passedCount,
      cells,
      snapshots,
    };
  } else {
    // Per-step verification: feed previous printed step state
    const tol = 5e-4;
    const allSnapshots: SwarmSnapshot[] = [];

    // Initial state before step 1
    let prevPositions = fixture.config.initialPositions!;
    let prevVelocities = fixture.config.initialVelocities!;
    let prevPbests = fixture.config.initialPositions!.map((x) => ({ x: [...x] }));
    
    // Find initial gbest
    let initialBestScore = -Infinity;
    let initialBestGbest = prevPositions[0];
    let initialBestIdx = 0;
    for (let i = 0; i < prevPositions.length; i++) {
      const f = fixture.config.evalFitness(prevPositions[i]);
      const s = fixture.config.goal === 'maximize' ? f : -f;
      if (s > initialBestScore) {
        initialBestScore = s;
        initialBestGbest = prevPositions[i];
        initialBestIdx = i;
      }
    }
    let prevGbest = { x: initialBestGbest, particleId: initialBestIdx };

    for (let stepIdx = 0; stepIdx < fixture.expectedPerIteration.length; stepIdx++) {
      const expectedStep = fixture.expectedPerIteration[stepIdx];
      const iter = expectedStep.iteration;

      const singleStepConfig: EngineConfig = {
        ...fixture.config,
        maxIterations: 1,
        initialPositions: prevPositions,
        initialVelocities: prevVelocities,
        initialPbests: prevPbests,
        initialGbest: prevGbest,
        manualRandomDraws: [fixture.config.manualRandomDraws![iter - 1]],
      };

      const stepSnaps = runPSO(singleStepConfig);
      const snap = stepSnaps[1]; // Result after 1 step
      allSnapshots.push(snap);

      for (const expectedP of expectedStep.particles) {
        const actualP = snap.particles.find((p) => p.id === expectedP.id);
        if (!actualP) continue;

        // Check velocity
        for (let d = 0; d < expectedP.v.length; d++) {
          const exp = expectedP.v[d];
          const act = actualP.v[d];
          const diff = Math.abs(act - exp);
          const ok = withinTolerance(act, exp, tol);
          totalCount++;
          if (ok) passedCount++;
          cells.push({
            iteration: iter,
            target: `P${expectedP.id + 1} v[${d}]`,
            expected: exp,
            actual: act,
            diff,
            tolerance: tol,
            passed: ok,
          });
        }

        // Check position x
        for (let d = 0; d < expectedP.x.length; d++) {
          const exp = expectedP.x[d];
          const act = actualP.x[d];
          const diff = Math.abs(act - exp);
          const ok = withinTolerance(act, exp, tol);
          totalCount++;
          if (ok) passedCount++;
          cells.push({
            iteration: iter,
            target: `P${expectedP.id + 1} x[${d}]`,
            expected: exp,
            actual: act,
            diff,
            tolerance: tol,
            passed: ok,
          });
        }

        // Check pbest
        for (let d = 0; d < expectedP.pbest.length; d++) {
          const exp = expectedP.pbest[d];
          const act = actualP.pbest[d];
          const diff = Math.abs(act - exp);
          const ok = withinTolerance(act, exp, tol);
          totalCount++;
          if (ok) passedCount++;
          cells.push({
            iteration: iter,
            target: `P${expectedP.id + 1} pbest[${d}]`,
            expected: exp,
            actual: act,
            diff,
            tolerance: tol,
            passed: ok,
          });
        }
      }

      // Check gbest
      for (let d = 0; d < expectedStep.gbest.length; d++) {
        const exp = expectedStep.gbest[d];
        const act = snap.gbest[d];
        const diff = Math.abs(act - exp);
        const ok = withinTolerance(act, exp, tol);
        totalCount++;
        if (ok) passedCount++;
        cells.push({
          iteration: iter,
          target: `gbest[${d}]`,
          expected: exp,
          actual: act,
          diff,
          tolerance: tol,
          passed: ok,
        });
      }

      // Advance prev state to this expected step for next iteration
      prevPositions = expectedStep.particles.map((p) => [...p.x]);
      prevVelocities = expectedStep.particles.map((p) => [...p.v]);
      prevPbests = expectedStep.particles.map((p) => ({ x: [...p.pbest] }));
      prevGbest = { x: [...expectedStep.gbest], particleId: 0 };
    }

    return {
      fixtureId: fixture.id,
      name: fixture.name,
      mode,
      passed: passedCount === totalCount,
      totalChecks: totalCount,
      passedChecks: passedCount,
      cells,
      snapshots: allSnapshots,
    };
  }
}
