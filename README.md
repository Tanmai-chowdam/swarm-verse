# SwarmVerse 🌌

> **Interactive Particle Swarm Optimization (PSO) Studio & Scientific Mathematical Engine**
> Built with React 18, TypeScript, Tailwind CSS, MathJS, KaTeX, and Recharts.

---

## 🌟 Executive Overview

**SwarmVerse** is a deterministic, mathematically rigorous Particle Swarm Optimization dashboard designed for university research, live classroom demonstrations, and benchmark verification.

Unlike visualization tools that rely on mocked data or hardcoded animations, **SwarmVerse runs a real synchronous PSO numerical simulation** on user-provided mathematical expressions.

---

## 🚀 Key Features

1. **Custom Mathematical Problem Solver (Homepage Focus)**
   - Type custom single-variable $f(x)$ or two-variable $f(x, y)$ equations.
   - Safe Abstract Syntax Tree (AST) compilation via MathJS (no `eval` or `new Function`).
   - Real-time domain validation sampling 25 points to detect singularities, division-by-zero, or undefined regions.
   - Dual-mode optimization: **Minimization** or **Maximization**.
   - Search space bound specification per dimension.

2. **Benchmark Presets**
   - **Problem 1:** $f(x) = x^2$ on $[-5, 5]$, minimize (Lecture Notes Problem 1).
   - **Shifted:** $f(x) = (x - 3)^2$ on $[-10, 10]$, minimize.
   - **Problem 3:** $f(x) = 10 - (x - 3)^2$ on $[-10, 10]$, maximize (Lecture Notes Problem 3).
   - **2D Sphere:** $f(x, y) = x^2 + y^2$ on $[-5, 5]$, minimize.
   - **2D Rastrigin:** $f(x, y) = x^2 + y^2 - 10(\cos(2\pi x) + \cos(2\pi y)) + 20$ on $[-5.12, 5.12]$ with 121 local minima.
   - **2D Peaks:** Multimodal non-convex surface on $[-3, 3]$, maximize.

3. **Dynamic Scientific Visualization**
   - **1D Curve View:** High-performance Canvas rendering of $f(x)$ with dynamic SVG particle overlay, vertical drop lines, velocity vectors, personal best marks ($p_{best}$), and glowing global best ($g_{best}$) beacon.
   - **2D Landscape View:** Cached topographic heatmap with isoline contour bands and animated particle swarm overlay.
   - **Vector Decomposition:** Toggleable 2D arrows decomposing velocity into **Inertia** (Blue), **Cognitive** (Purple), and **Social** (Pink) vectors.
   - **Breadcrumb Trails:** Historical trajectory traces over prior iterations.

4. **Deep Step Inspector with KaTeX Formula Substitution**
   - Click any particle in the swarm to inspect its exact mathematical derivation at the current iteration:
     $$v_{i,d}^{(t)} = w \cdot v_{i,d}^{(t-1)} + c_1 r_1 (p_{best, i, d} - x_{i,d}^{(t-1)}) + c_2 r_2 (g_{best, d} - x_{i,d}^{(t-1)})$$
     $$x_{i,d}^{(t)} = x_{i,d}^{(t-1)} + v_{i,d}^{(t)}$$
   - Displays real numerical values substituted into the formula with color-coded term tiles.
   - Boundary clipping detection and velocity preservation alerts.
   - Precision toggle: **Standard (4 decimal places)** vs **Full IEEE-754 64-bit float**.

5. **Complete Playback Controls & History**
   - Play, Pause, Step Forward, Step Backward, Reset to $t=0$, Jump to End.
   - Continuous timeline scrubber.
   - Adjustable playback speed from $1\times$ to $30\times$ iterations/sec.
   - Interactive Recharts convergence curve tracking Global Best and Swarm Average.
   - Iteration history table with jump-to-step navigation.

6. **Textbook Verification Suite**
   - Validates against exact numerical tables from Engelbrecht (2007) and university lecture notes.
   - **Fixture A (Problem 1):** 3 particles, 3 iterations, exact $v$, $x$, and $g_{best}$ match.
   - **Fixture B (Problem 3 Maximization):** Verifies correct handling of concave maximization.
   - **Fixture C (Exercise 1):** Constant $r_1 = r_2 = 0.5$ single-step test.
   - Supports both **Full-Chain Reproduction** and **Per-Step Isolated Check**.

7. **Scientific Honesty Transparency**
   - Strictly labels heuristic simulation findings as **"Best Found by PSO"**.
   - Distinguishes between empirical findings and known theoretical benchmark optima.

---

## 📐 Settled Textbook Ambiguities & Mathematical Conventions

1. **Synchronous Update Convention:**
   - In Problem 1 (Iteration 1), Particle 3 at $x=2$ is equal to initial $g_{best}=2$ and receives exactly zero social pull ($2 - 2 = 0$), even though Particle 2 found a superior position ($-1.125$) earlier in the movement loop. This proves that $g_{best}$ remains frozen during the movement step and updates synchronously after all particles move.

2. **Velocity After Boundary Clipping:**
   - When a particle hits or exceeds the domain bound in `clip` mode, its position is clamped to the boundary ($x = x_{bound}$), but its velocity vector $v$ is **preserved unchanged**. In Problem 1 (Iteration 5), Particle 1 remains at $5$; preserving its velocity explains the subsequent inertia pull.

3. **Inertia Weight $w$:**
   - Engelbrecht Algorithm 16.1 corresponds to $w = 1.0$.
   - Lecture notes introduce inertia weight $w = 0.7$.
   - SwarmVerse supports both fixed $w$ and dynamic linear schedules $w_0 \to w_1$.

4. **Internal Scoring for Min/Max:**
   - Unified score: $\text{score} = (\text{maximize} ? +1 : -1) \cdot f(x)$. Larger score is always superior. Displayed values are always the true $f(x)$.

5. **Random Number Draw Sequence:**
   - For deterministic replay, draws follow strict index ordering: for each iteration $t$, for each particle $i$, for each dimension $d$, draw $r_1$ then $r_2$.

---

## 🛠️ Installation & Local Development

### Prerequisites
- Node.js $\ge 18.0.0$
- npm $\ge 9.0.0$

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/SwarmVerse.git
cd SwarmVerse

# Install dependencies
npm install

# Run Vitest test suite
npm test

# Run TypeScript compilation and production build
npm run build

# Start local development server
npm run dev
```

---

## 🧪 Automated Test Suite

SwarmVerse includes 22 unit and integration tests passing with 100% success rate:

```
 ✓ src/tests/textbook.test.ts (5 tests)
   ✓ passes Problem 1 (Fixture A) full-chain reproduction
   ✓ passes Problem 1 (Fixture A) per-step verification
   ✓ passes Problem 3 Maximization (Fixture B) full-chain reproduction
   ✓ passes Problem 3 Maximization (Fixture B) per-step verification
   ✓ passes Exercise 1 (Fixture C) with r1=r2=0.5
 ✓ src/tests/engine.test.ts (8 tests)
   ✓ identical snapshots for identical seeds
   ✓ gbest never worsens for minimization
   ✓ gbest never worsens for maximization
   ✓ symmetry: minimizing -f and maximizing f give identical paths
   ✓ clip boundary preserves velocity
   ✓ with w=1, c1=c2=0, positions follow x + v*t
   ✓ particle at gbest with v=0 stays put
   ✓ Rastrigin benchmark over 10 seeds finds global minimum
 ✓ src/tests/parser.test.ts (9 tests)
   ✓ accepts valid 1D expressions (x^2, sin(x)+x^2, 2x, etc.)
   ✓ accepts valid 2D expressions (x^2+y^2, etc.)
   ✓ handles Greek pi and implicit multiplication
   ✓ rejects malicious and forbidden constructs (assignments, code execution)
   ✓ rejects empty input
   ✓ rejects 'y' in 1D mode
   ✓ syntax error detection
   ✓ 25-point domain evaluation checks
```

---

## 🏛️ License

Academic and Educational Use License. Created for live university demonstration and algorithmic research.
