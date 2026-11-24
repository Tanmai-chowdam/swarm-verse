import * as math from 'mathjs';
import { preprocessExpression } from './validate';

export type FitnessEvaluator = (pos: number[]) => number;

/**
 * Safely compiles a mathematical expression into a high-performance evaluation function.
 * Catches any syntax or parsing errors safely so incomplete keystrokes never crash the UI.
 */
export function compileExpression(rawExpr: string): FitnessEvaluator {
  try {
    const expr = preprocessExpression(rawExpr);
    if (!expr) {
      return () => NaN;
    }

    const ast = math.parse(expr);
    const compiled = ast.compile();

    return (pos: number[]): number => {
      try {
        const scope: Record<string, number> = {
          x: pos[0] ?? 0,
          y: pos[1] ?? 0,
        };
        const res = compiled.evaluate(scope);
        if (typeof res === 'number') {
          return Number.isFinite(res) ? res : NaN;
        }
        if (typeof res === 'object' && res !== null && 're' in res) {
          // Complex number result, treat as NaN for real PSO
          return NaN;
        }
        const num = Number(res);
        return Number.isFinite(num) ? num : NaN;
      } catch {
        return NaN;
      }
    };
  } catch {
    // Graceful fallback for incomplete or currently typing equations
    return () => NaN;
  }
}
