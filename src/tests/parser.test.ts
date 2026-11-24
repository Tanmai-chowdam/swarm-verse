import { describe, it, expect } from 'vitest';
import { validateExpression } from '../parser/validate';
import { compileExpression } from '../parser/compile';

describe('Math Parser and AST Validator', () => {
  const bounds1D = [{ min: -5, max: 5 }];
  const bounds2D = [{ min: -5, max: 5 }, { min: -5, max: 5 }];

  it('accepts valid 1D expressions: x^2, (x-3)^2, sin(x)+x^2, 2x', () => {
    const valid1D = ['x^2', '(x-3)^2', 'sin(x)+x^2', '2x', '3*(x-1)^2 + 4'];
    for (const expr of valid1D) {
      const res = validateExpression(expr, 1, bounds1D);
      expect(res.isValid, `Failed for valid expression: ${expr} - ${JSON.stringify(res.issues)}`).toBe(true);
      const fn = compileExpression(expr);
      expect(typeof fn([2])).toBe('number');
      expect(Number.isFinite(fn([2]))).toBe(true);
    }
  });

  it('accepts valid 2D expressions: x^2 + y^2, sin(x)*cos(y)', () => {
    const valid2D = ['x^2 + y^2', 'sin(x) * cos(y)', 'x^2 + y^2 - 10*(cos(2*pi*x) + cos(2*pi*y)) + 20'];
    for (const expr of valid2D) {
      const res = validateExpression(expr, 2, bounds2D);
      expect(res.isValid, `Failed for 2D expression: ${expr}`).toBe(true);
      const fn = compileExpression(expr);
      expect(typeof fn([1, 2])).toBe('number');
      expect(Number.isFinite(fn([1, 2]))).toBe(true);
    }
  });

  it('handles Greek pi π and implicit multiplication', () => {
    const expr = '2π*x';
    const res = validateExpression(expr, 1, bounds1D);
    expect(res.isValid).toBe(true);
    const fn = compileExpression(expr);
    expect(fn([1])).toBeCloseTo(2 * Math.PI, 5);
  });

  it('rejects forbidden constructs: assignments, code execution, unsupported tokens', () => {
    const malicious = [
      'a = 5',
      'eval("alert(1)")',
      'import("fs")',
      'window.location',
      'function() {}',
      '[1, 2, 3]',
      '{ a: 1 }',
      'console.log(x)',
    ];

    for (const expr of malicious) {
      const res = validateExpression(expr, 1, bounds1D);
      expect(res.isValid, `Should have rejected: ${expr}`).toBe(false);
    }
  });

  it('rejects empty expressions', () => {
    const res = validateExpression('', 1, bounds1D);
    expect(res.isValid).toBe(false);
  });

  it('rejects y in 1D mode', () => {
    const res = validateExpression('x^2 + y', 1, bounds1D);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.message.includes('1D mode'))).toBe(true);
  });

  it('gives clear error for syntax errors like unbalanced parentheses', () => {
    const res = validateExpression('(x + 3', 1, bounds1D);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.message.toLowerCase().includes('syntax error') || i.message.toLowerCase().includes('parenthesis'))).toBe(true);
  });

  it('detects domain issues (e.g. log(x) on negative bounds)', () => {
    // log(x) on [-5, -1] has all invalid sample points
    const res = validateExpression('log(x)', 1, [{ min: -5, max: -1 }]);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.message.toLowerCase().includes('entire specified domain'))).toBe(true);
  });

  it('warns when some sample points are non-finite (e.g. 1/x crossing 0)', () => {
    const res = validateExpression('1/x', 1, [{ min: -2, max: 2 }]);
    expect(res.isValid).toBe(true); // valid to run, but has warning
    expect(res.issues.some((i) => i.type === 'warning')).toBe(true);
  });
});
