# SwarmVerse: Implementation Plan

I checked every number in both PDFs. The Problem 1 and Problem 3 tables (iterations 1–3) reproduce exactly from the printed random values, so they work as test fixtures. Section 7 lists a few ambiguities the engine must settle explicitly.

## 1. Features and workflow

**Workflow:** pick a preset or type `f(x)` / `f(x,y)`, choose min or max, set bounds and parameters, press Run. The engine precomputes all snapshots. The user then plays, steps, or scrubs, and clicks a particle to see its calculation.

**Modes:**
- **Solver mode:** seeded random, any function.
- **Manual mode:** the user supplies x₀, v₀ and optionally r₁, r₂ per iteration.
- **Textbook mode:** loads fixtures and shows pass/fail against the PDF values.

**Presets (5 required):**
- `x^2` on [-5,5], minimize (Problem 1).
- `(x-3)^2` on [-10,10], minimize.
- `10-(x-3)^2` on [-10,10], maximize (Problem 3).
- 2D sphere `x^2+y^2` on [-5,5].
- 2D Rastrigin on [-5.12,5.12], minimize, with 121 local minima.

Peaks (maximize, [-3,3]) is optional. Its global maximum is about 8.106 near (-0.01, 1.58).

**Honesty rule:** always label results "best found by PSO". Show "known optimum" only on presets that have one, labelled as supplied by the preset.

## 2. Architecture

```
src/
  engine/   types.ts  rng.ts  pso.ts  snapshot.ts  fitness.ts
  parser/   compile.ts  validate.ts
  textbook/ fixtures.ts  compare.ts
  state/    useSimulation.ts  (reducer: snapshots[], cursor, playing, speed)
  components/ ProblemPanel, ParamPanel, ManualInitTable, PlotCanvas1D,
              PlotCanvas2D, ParticleInspector, FormulaBlock, Controls,
              ConvergenceChart, HistoryTable, TextbookPanel, PresetPicker
  tests/    engine.test.ts parser.test.ts textbook.test.ts
```

- `engine/` and `parser/` must not import React. They are pure TypeScript, so Vitest tests them directly.
- The engine is a pure function: `runPSO(config) → Snapshot[]`.
- The UI only reads snapshots. All calculation breakdowns are computed in the engine and stored, not recomputed in the UI.

## 3. PSO engine and mathematical decisions

**Update rule** (per particle i, per dimension d):
`v' = w·v + c1·r1·(pbest−x) + c2·r2·(gbest−x)`, then `x' = x + v'`.

Setting w=1 gives the Engelbrecht eq. 16.2 exactly.

**Core decisions:**
- **Internal score:** `score = (maximize ? +1 : −1) · f(x)`. Larger score is always better, as in the lecture reference code. One code path serves min and max. The UI always displays the raw f.
- **Iteration order:** matches the lecture notes.
  - t=0: initialize x, v, set pbest=x, evaluate, set gbest=best pbest.
  - Each iteration: compute all new v and x using the gbest from the end of the previous iteration, then clip, evaluate, update pbests, then update gbest.
- **Synchronous update:** gbest is frozen during the movement loop. The notes prove this. In Problem 1, iteration 1, P3 sits at x=2 equal to gbest=2 and gets zero social pull, even though P2 found −1.125 earlier in the same iteration.
- **Random numbers:**
  - r1 and r2 are drawn fresh for every particle, dimension and iteration.
  - Draw order is fixed: for t, for i, for d, r1 then r2. Document this in the README.
  - Manual mode accepts a `r[t][i][d] = [r1, r2]` array that bypasses the RNG.
- **Seeded RNG:** mulberry32 (or similar). Store the seed in the config. Same config gives an identical snapshot array, which gives deterministic replay.
- **Initialization:**
  - x = lo + r·(hi−lo) per dimension (eq. 16.9). Manual positions override this.
  - Default v=0 (eq. 16.10).
  - Optional "random v, ±10% of range", as in the notes' simulated problems.
- **Ties:** strict improvement only. pbest and gbest change only if strictly better. For the initial gbest, ties go to the lowest particle index.
- **Boundaries:**
  - Selectable: `clip` (default, per the notes), `reflect`, `none`.
  - Optional velocity clamp as a percentage of range, default off. Textbook mode uses none.
  - Decision: after clipping, **keep the velocity unchanged**. See Section 7 for the evidence.
- **Inertia schedule:** `fixed` or `linear w0→w1` with `w = w0 − (w0−w1)·t/(T−1)`.
- **Non-finite fitness** (NaN, ±Infinity): treat as the worst possible score and show a warning.
- **Stopping:** max iterations. Optional early stop when gbest improves by less than a tolerance for k iterations.
- **Floating point:** use raw doubles internally and never round during calculation. Round only at display time (4 decimals by default, with a toggle for full precision).
- **Snapshot** (one per iteration, plus iteration 0):
  - Per particle: x, v, f, pbest, f(pbest), r1, r2, w.
  - Per particle and dimension: the three terms (inertia, cognitive, social), the new v, the raw new x, the clipped x, and a clipped flag.
  - Global: gbest, f(gbest), the average swarm f, and an "improved" flag.

## 4. Components and layout

- **Left:** `ProblemPanel` (function input, min/max, bounds, live validation message), `ParamPanel` (N, T, w or schedule, c1, c2, seed, boundary mode), `ManualInitTable` (x₀, v₀, optional random values), `PresetPicker`.
- **Center:** `PlotCanvas1D` and `PlotCanvas2D` (canvas for the heatmap and contour layers, SVG for the particle overlay). Trails, velocity arrows, pbest markers and a gbest star. Click to select a particle.
- **Right:** `ParticleInspector`. KaTeX formula with numbers substituted, shown per coordinate in 2D. Show inertia, cognitive and social terms separately, then new v, new x, f and pbest/gbest updates. Add a plain-English sentence for each term. A "Textbook" tab shows pass/fail.
- **Bottom:** `Controls` (Play, Pause, Resume, Step, Back, Reset, speed, scrubber), `ConvergenceChart` (Recharts, gbest f against iteration), `HistoryTable` (iteration, gbest position, gbest f, improved flag).
- **Theme:** a dark "deep-space" scientific look with one accent colour for the swarm. Use CSS variables. Collapse to tabs on narrow screens.

## 5. Parser and validation

- Use math.js `parse()` to build an AST. Never use `eval` or `new Function`.
- Walk the AST and allow only:
  - **Nodes:** constants, operators, parentheses, function calls, and symbols.
  - **Functions:** `sin cos tan exp log sqrt abs pow`.
  - **Constants:** `pi e`.
  - **Variables:** `x` (1D) or `x, y` (2D).
- Reject assignments, functions that define other functions, matrices, strings, and unknown symbols. Reject any use of `y` while in 1D mode.
- Accept `^` and implicit multiplication (`2x`). Convert `2π` to `pi`.
- Compile once, then evaluate with `{x, y}` scopes.
- Dimension is detected from the variables used. Warn if the user's chosen dimension disagrees.
- **Validation at input time:**
  - Syntax errors show the message and the position.
  - Check lo < hi.
  - Evaluate f at 25 sample points. Warn on NaN or Infinity, for example `log(x)` on a negative bound. Block the run if every point is invalid.
  - Check N ≥ 2, T ≥ 1, w ≥ 0, c1, c2 ≥ 0.
  - Warn if w ≥ 1 (possible divergence) or if c1+c2 is large.
- Cap expression length and the evaluation count.

## 6. Visualization and playback

- **State:** `snapshots[]` and `cursor`. Every view (plot, inspector, chart, table) renders `snapshots[cursor]` and nothing else. Play, Step and scrub only move the cursor.
- **Play loop:** `requestAnimationFrame` with a time accumulator. Speed means iterations per second.
- **Interpolation:** between snapshots k and k+1, interpolate positions with an easing function for smooth motion. Calculation panels always show the exact numbers of the snapshot, never interpolated values. Pause finishes the current transition.
- **Layers:**
  - 1D: curve, particles on the curve, vertical drop lines, pbest ticks.
  - 2D: pre-rendered heatmap and contours (low resolution for speed, cached per function and bounds), then particle overlay.
  - Trails (the last k positions), velocity arrows, and an optional arrow for each of the three components.
- **Reset:** back to cursor 0. A new Run recomputes snapshots.
- **Performance:** at most about 100 particles and 1000 iterations. Compute in the main thread, but chunk very long runs.
- **Extras (after core works):** a parameter comparison with two configs and a shared seed, drawn as two lines on the chart. A "Predict the Next Move" quiz that hides the calculation until the user guesses.

## 7. Textbook verification

**Sources:**
- Engelbrecht ch. 16 gives eq. 16.1–16.3, Algorithm 16.1, and initialization (16.9–16.11). The lecture notes add w and the worked problems.
- Problems 2 and 4 (Rastrigin and peaks) have no printed random numbers, so they cannot be reproduced step by step. Treat them as statistical presets only.

**Fixtures (tolerance: absolute 5e-4, because the PDFs round to 4 decimals):**

Fixture A: Problem 1.
- f=x², bounds [-5,5], minimize, w=0.7, c1=c2=1.5, x₀=[4,−3,2], v₀=0.
- r (r1,r2) per particle:

| Iteration | P1 | P2 | P3 |
|---|---|---|---|
| 1 | (0.61, 0.86) | (0.75, 0.25) | (0.32, 0.84) |
| 2 | (0.05, 0.79) | (0.77, 0.47) | (0.32, 0.30) |
| 3 | (0.28, 0.45) | (0.50, 0.55) | (0.95, 0.76) |

- Expected v:

| Iteration | P1 | P2 | P3 |
|---|---|---|---|
| 1 | −2.58 | 1.875 | 0 |
| 2 | −4.8218 | 1.3125 | −1.4062 |
| 3 | 1.0727 | 0.9187 | −1.4475 |

- Expected x:

| Iteration | P1 | P2 | P3 |
|---|---|---|---|
| 1 | 1.42 | −1.125 | 2 |
| 2 | −3.4018 | 0.1875 | 0.5938 |
| 3 | −2.3291 | 1.1062 | −0.8537 |

- Expected gbest: −1.125 (f=1.2656) after iteration 1, then 0.1875 (f=0.0352) after iterations 2 and 3.
- Iterations 4–5 give only x and f, with no random values. Use them as consistency checks: P1 clipped to 5 (unclipped 5.4006), and f values recomputed from the printed x.

Fixture B: Problem 3.
- f=10−(x−3)², bounds [-10,10], **maximize**, x₀=[−4,1,8], same w, c1, c2.
- r:

| Iteration | P1 | P2 | P3 |
|---|---|---|---|
| 1 | (0.17, 0.50) | (0.59, 0.08) | (0.18, 0.89) |
| 2 | (0.11, 0.17) | (0.90, 0.61) | (0.38, 0.51) |
| 3 | (0.65, 0.30) | (0.17, 0.76) | (0.65, 0.51) |

- Expected x:

| Iteration | P1 | P2 | P3 |
|---|---|---|---|
| 1 | −0.25 | 1 | −1.345 |
| 2 | 2.6937 | 1 | −6.0926 |
| 3 | 4.7543 | 2.9308 | 1.9345 |

- Expected v:

| Iteration | P1 | P2 | P3 |
|---|---|---|---|
| 1 | 3.75 | 0 | −9.345 |
| 2 | 2.9437 | 0 | −4.7476 |
| 3 | 2.0606 | 1.9308 | 8.0271 |

- Expected gbest: 1 (f=6) after iteration 1, 2.6937 (f=9.9062) after iteration 2, 2.9308 (f=9.9952) after iteration 3.

Fixture C: Exercise 1.
- Problem 1 iteration 1 with r1=r2=0.5 gives v=[−1.5, 3.75, 0], x=[2.5, 0.75, 2], and new gbest 0.75 (f=0.5625).

**Two verification modes:**
1. **Reproduce:** run the full chain from x₀ and v₀. Errors can accumulate because the PDF rounds each step, so the tolerance is the one above, widened to 1e-3 from iteration 3.
2. **Per-step:** feed in the PDF's printed old state at each iteration and compare only that iteration's output. This isolates one calculation and stays within 5e-4.

The pass/fail table lists each cell with expected value, computed value, difference and a ✓ or ✗.

**Ambiguities to document in the README and in an in-app "Notes on the textbook" panel:**
1. **Iteration order.** Engelbrecht's Algorithm 16.1 updates pbest and gbest at the start of each iteration and then moves the particles. The notes move first and then update. These are the same sequence shifted by one step. Use the notes' convention.
2. **Inertia.** Engelbrecht's equation has no w. The notes add it. Treat Engelbrecht as w=1.
3. **gbest definition.** Engelbrecht allows the best pbest (eq. 16.4) or the best current position (eq. 16.5). The notes use the best pbest. Use that.
4. **Velocity after clipping.** The notes never say what happens to v. Evidence: in Problem 1, P1 stays at 5 in iteration 5. With v reset to 0 that would need r1 and r2 both near 0, whereas with v kept (≈7.73) the inertia term is about 5.4 and a small r pair keeps it outside. So keep v unchanged. Mark this as an inference.
5. **Rounding.** The tables round, for example 0.91875 is printed as 0.9187.
6. **Convergence table** (30 iterations) and **Problems 2 and 4** use recorded random draws that the notes do not print. Mark them "informational, not reproducible".

## 8. Development phases

1. Scaffold the project (Vite, TypeScript, Tailwind, Vitest), the folder structure and the types.
2. Engine: init, step, pbest and gbest, min and max, clipping, schedule, seeded RNG, snapshots. Write the Fixture A, B and C tests **first** and make them pass.
3. Parser and validation, with tests.
4. UI shell: panels, state reducer, presets, 1D plot.
5. Playback, convergence chart, history table.
6. 2D heatmap and contours, particle inspector with KaTeX.
7. Textbook panel, manual-init and manual-random inputs, pass/fail table.
8. Polish: tooltips, "found vs proven" labelling, responsive layout, animations.
9. Extras, only if time remains: parameter comparison, Predict the Next Move.
10. README, deployment, demo video.

## 9. Tests and acceptance criteria

**Engine (Vitest):**
- Fixtures A, B and C pass at the stated tolerance.
- The same seed gives identical snapshots. A different seed gives a different result.
- gbest f never worsens for min or max.
- Minimizing −f and maximizing f with identical random values give identical paths (Exercise 3).
- Clip boundary: the position stays within bounds and v is unchanged.
- Ties do not replace pbest.
- With w=1, c1=c2=0, positions follow x + v·t.
- A particle already at gbest and pbest with v=0 stays put.
- Statistical presets: Rastrigin over 30 seeds should have ≥28 runs under f < 0.01 with the notes' parameters (N=30, 100 iterations, w 0.9→0.4, c=2, 20% clamp). Peaks should have ≥28 runs within 0.01 of 8.106. The notes report 30 of 30 for both, but the JS RNG differs from NumPy, so exact reproduction is not expected.

**Parser:**
- Accepts `x^2`, `(x-3)^2`, `sin(x)+x^2`, `x^2+y^2`, `2x`.
- Rejects `eval(...)`, `import`, assignments, unknown symbols, `y` in 1D, and empty input.
- Gives clear errors for unbalanced parentheses.

**UI acceptance:**
- Play, Pause, Resume, Step, Back and Reset keep the plot, inspector, chart and table in sync.
- The inspector's numbers match the engine snapshot for the selected iteration.
- No text says PSO guarantees a global optimum.

## 10. Deployment and submission checklist

- `npm run build` passes with no TypeScript errors, and `npm test` passes.
- Deploy to Vercel (Vite preset) and open the public URL in a fresh browser.
- Public GitHub repo with a sensible history and a `.gitignore`.
- README: setup, features, the update formulas, the decisions in Sections 3 and 7, how to run the tests, and the verification results table.
- Demo video (3–5 minutes): a custom function, 1D and 2D runs, the inspector, textbook mode with all passes shown, and a maximization example.
- Submit the URL, the repo link and the video link.