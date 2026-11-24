import { describe, it, expect } from 'vitest';
import {
  FIXTURE_PROBLEM_1,
  FIXTURE_PROBLEM_3,
  FIXTURE_EXERCISE_1,
} from '../textbook/fixtures';
import { verifyFixture } from '../textbook/compare';

describe('Textbook Verification Fixtures', () => {
  it('passes Problem 1 (Fixture A) full-chain reproduction within stated tolerance', () => {
    const result = verifyFixture(FIXTURE_PROBLEM_1, 'full-chain');
    if (!result.passed) {
      const failed = result.cells.filter((c) => !c.passed);
      console.error('Fixture 1 failed cells:', failed);
    }
    expect(result.passed).toBe(true);
    expect(result.passedChecks).toBe(result.totalChecks);
  });

  it('passes Problem 1 (Fixture A) per-step verification within strict 5e-4 tolerance', () => {
    const result = verifyFixture(FIXTURE_PROBLEM_1, 'per-step');
    expect(result.passed).toBe(true);
    expect(result.passedChecks).toBe(result.totalChecks);
  });

  it('passes Problem 3 Maximization (Fixture B) full-chain reproduction', () => {
    const result = verifyFixture(FIXTURE_PROBLEM_3, 'full-chain');
    if (!result.passed) {
      const failed = result.cells.filter((c) => !c.passed);
      console.error('Fixture 3 failed cells:', failed);
    }
    expect(result.passed).toBe(true);
    expect(result.passedChecks).toBe(result.totalChecks);
  });

  it('passes Problem 3 Maximization (Fixture B) per-step verification', () => {
    const result = verifyFixture(FIXTURE_PROBLEM_3, 'per-step');
    expect(result.passed).toBe(true);
    expect(result.passedChecks).toBe(result.totalChecks);
  });

  it('passes Exercise 1 (Fixture C) with r1=r2=0.5', () => {
    const result = verifyFixture(FIXTURE_EXERCISE_1, 'full-chain');
    expect(result.passed).toBe(true);
    expect(result.passedChecks).toBe(result.totalChecks);
  });
});
