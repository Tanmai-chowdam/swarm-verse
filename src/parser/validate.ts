import * as math from 'mathjs';
import { Bound, Dimension } from '../engine/types';

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  position?: number;
}

export interface ValidationResult {
  isValid: boolean;
  detectedDimension: Dimension;
  issues: ValidationIssue[];
  usedVariables: string[];
}

const ALLOWED_FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh',
  'exp', 'log', 'log10', 'log2', 'ln',
  'sqrt', 'cbrt', 'abs', 'pow', 'min', 'max',
  'round', 'floor', 'ceil', 'sign'
]);

const ALLOWED_CONSTANTS = new Set([
  'pi', 'e', 'PI', 'E', 'Infinity', 'NaN'
]);

/**
 * Preprocess expression string to normalize user input:
 * - Strips leading "f(x) =", "f(x, y) =", "y =", "z ="
 * - Converts Python power operator "**" to "^"
 * - Converts Greek "π" to "pi"
 * - Normalizes standalone uppercase "X" and "Y"
 * - Replaces "ln(" with "log("
 * - Replaces "×" with "*", "÷" with "/"
 */
export function preprocessExpression(expr: string): string {
  if (!expr) return '';
  let cleaned = expr.trim();

  // Strip leading "f(x, y) =" or "f(x) =" or "y =" or "z ="
  cleaned = cleaned.replace(/^(?:f\s*\([^)]*\)|z|y)\s*=\s*/i, '');

  // Normalize Python power operator ** to ^
  cleaned = cleaned.replace(/\*\*/g, '^');

  // Normalize Greek pi and symbols
  cleaned = cleaned
    .replace(/π/g, 'pi')
    .replace(/\bln\(/gi, 'log(')
    .replace(/×/g, '*')
    .replace(/÷/g, '/');

  // Handle case-insensitive standalone X and Y variables
  cleaned = cleaned.replace(/\bX\b/g, 'x').replace(/\bY\b/g, 'y');

  return cleaned;
}

/**
 * Validate math expression AST and ensure safe mathematical execution.
 */
export function validateExpression(
  rawExpr: string,
  targetDimension: Dimension,
  bounds: Bound[]
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const usedVariables = new Set<string>();

  const expr = preprocessExpression(rawExpr);

  if (!expr) {
    return {
      isValid: false,
      detectedDimension: targetDimension,
      issues: [{ type: 'error', message: 'Please enter a mathematical expression' }],
      usedVariables: [],
    };
  }

  if (expr.length > 500) {
    return {
      isValid: false,
      detectedDimension: targetDimension,
      issues: [{ type: 'error', message: 'Expression is too long (maximum 500 characters)' }],
      usedVariables: [],
    };
  }

  let ast: math.MathNode;
  try {
    ast = math.parse(expr);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid mathematical syntax';
    return {
      isValid: false,
      detectedDimension: targetDimension,
      issues: [{ type: 'error', message: `Syntax error: ${message}` }],
      usedVariables: [],
    };
  }

  // Walk AST to verify security and permitted nodes
  try {
    ast.traverse((node: any, _path: string, parent: any) => {
      const type = node.type;

      // Disallow dangerous or unsupported node types
      if (
        type === 'AssignmentNode' ||
        type === 'FunctionAssignmentNode' ||
        type === 'BlockNode' ||
        type === 'ArrayNode' ||
        type === 'ObjectNode' ||
        type === 'IndexNode' ||
        type === 'RangeNode'
      ) {
        throw new Error(`Syntax construct "${type}" is not permitted for mathematical functions.`);
      }

      if (type === 'FunctionNode') {
        const fnName = node.name.toLowerCase();
        if (!ALLOWED_FUNCTIONS.has(fnName)) {
          throw new Error(`Function "${node.name}" is not supported. Permitted functions: ${Array.from(ALLOWED_FUNCTIONS).slice(0, 10).join(', ')}...`);
        }
      }

      if (type === 'SymbolNode') {
        if (parent && parent.type === 'FunctionNode' && parent.name === node.name) {
          return;
        }

        const symName = node.name;
        if (symName === 'x' || symName === 'y') {
          usedVariables.add(symName);
        } else if (!ALLOWED_CONSTANTS.has(symName)) {
          throw new Error(`Unknown symbol "${symName}". Use variable 'x' (or 'y' in 2D), or constants like 'pi' and 'e'.`);
        }
      }
    });
  } catch (validationErr: unknown) {
    const message = validationErr instanceof Error ? validationErr.message : 'Invalid expression AST';
    return {
      isValid: false,
      detectedDimension: targetDimension,
      issues: [{ type: 'error', message }],
      usedVariables: Array.from(usedVariables),
    };
  }

  // Dimension checks
  const vars = Array.from(usedVariables);
  const detectedDimension: Dimension = vars.includes('y') ? 2 : 1;

  if (targetDimension === 1 && vars.includes('y')) {
    issues.push({
      type: 'error',
      message: 'Expression references 2D variable "y", but 1D mode is currently active. Switch to 2D mode to optimize.',
    });
  }

  if (targetDimension === 2 && !vars.includes('y') && !vars.includes('x')) {
    issues.push({
      type: 'warning',
      message: 'Expression is constant (neither "x" nor "y" is used).',
    });
  }

  // Check bounds validity: lo < hi
  for (let i = 0; i < targetDimension; i++) {
    const b = bounds[i];
    if (b && b.min >= b.max) {
      issues.push({
        type: 'error',
        message: `Bound for dimension ${i + 1} (${i === 0 ? 'x' : 'y'}) is invalid: min (${b.min}) must be strictly less than max (${b.max}).`,
      });
    }
  }

  // If there are errors so far, return early
  if (issues.some((i) => i.type === 'error')) {
    return {
      isValid: false,
      detectedDimension,
      issues,
      usedVariables: vars,
    };
  }

  // 25-point domain evaluation check for NaNs/Infinities
  try {
    const compiled = ast.compile();
    let nanCount = 0;
    let infCount = 0;
    const totalSamples = 25;

    if (targetDimension === 1) {
      const b0 = bounds[0];
      const step = (b0.max - b0.min) / (totalSamples - 1 || 1);
      for (let i = 0; i < totalSamples; i++) {
        const sampleX = b0.min + i * step;
        const val = compiled.evaluate({ x: sampleX });
        if (Number.isNaN(val)) nanCount++;
        else if (!Number.isFinite(val)) infCount++;
      }
    } else {
      const b0 = bounds[0];
      const b1 = bounds[1] || bounds[0];
      const numSteps = 5; // 5x5 = 25
      const step0 = (b0.max - b0.min) / (numSteps - 1 || 1);
      const step1 = (b1.max - b1.min) / (numSteps - 1 || 1);
      for (let i = 0; i < numSteps; i++) {
        for (let j = 0; j < numSteps; j++) {
          const sampleX = b0.min + i * step0;
          const sampleY = b1.min + j * step1;
          const val = compiled.evaluate({ x: sampleX, y: sampleY });
          if (Number.isNaN(val)) nanCount++;
          else if (!Number.isFinite(val)) infCount++;
        }
      }
    }

    if (nanCount + infCount === totalSamples) {
      issues.push({
        type: 'error',
        message: 'The function produces non-finite or undefined values across the entire specified domain. Check your formula and bounds.',
      });
    } else if (nanCount + infCount > 0) {
      issues.push({
        type: 'warning',
        message: `Function produces undefined/infinite values at ${nanCount + infCount} of 25 domain sample points (e.g. division by zero or negative log). PSO will assign lowest score to invalid regions.`,
      });
    }
  } catch (evalErr: unknown) {
    const message = evalErr instanceof Error ? evalErr.message : 'Evaluation error';
    issues.push({
      type: 'error',
      message: `Failed to evaluate expression: ${message}`,
    });
  }

  const isValid = !issues.some((i) => i.type === 'error');
  return {
    isValid,
    detectedDimension,
    issues,
    usedVariables: vars,
  };
}
