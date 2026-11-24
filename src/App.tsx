import React from 'react';
import { useSimulation } from './state/useSimulation';
import { Header } from './components/Header';
import { ProblemPanel } from './components/ProblemPanel';
import { ParamPanel } from './components/ParamPanel';
import { PlotCanvas1D } from './components/PlotCanvas1D';
import { PlotCanvas2D } from './components/PlotCanvas2D';
import { ParticleInspector } from './components/ParticleInspector';
import { Controls } from './components/Controls';
import { ConvergenceChart } from './components/ConvergenceChart';
import { HistoryTable } from './components/HistoryTable';
import { TextbookPanel } from './components/TextbookPanel';
import { ManualInitTable } from './components/ManualInitTable';
import { TheoryPanel } from './components/TheoryPanel';
import { PRESET_PROBLEMS } from './engine/presets';
import { FixtureData } from './textbook/fixtures';
import { Sparkles, Activity, Target, Compass, Award } from 'lucide-react';

export const App: React.FC = () => {
  const sim = useSimulation();

  const currentPreset = PRESET_PROBLEMS.find((p) => p.id === sim.activePresetId);
  const totalIterations = Math.max(0, sim.snapshots.length - 1);
  const curSnap = sim.currentSnapshot;

  const fmt = (v: number) => {
    if (v === undefined || Number.isNaN(v)) return '—';
    return sim.precisionMode === 'full' ? v.toString() : v.toFixed(4);
  };

  const handleToggleDisplayOption = (key: keyof typeof sim.displayOptions) => {
    sim.setDisplayOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLoadFixture = (fixture: FixtureData) => {
    sim.setExpression(fixture.config.evalFitness.toString()); // default text
    if (fixture.id === 'fixture-problem-1' || fixture.id === 'fixture-exercise-1') {
      sim.setExpression('x^2');
      sim.setGoal('minimize');
      sim.setBounds([{ min: -5, max: 5 }]);
    } else if (fixture.id === 'fixture-problem-3') {
      sim.setExpression('10 - (x - 3)^2');
      sim.setGoal('maximize');
      sim.setBounds([{ min: -10, max: 10 }]);
    }
    sim.setDimension(fixture.config.dimension);
    sim.setNumParticles(fixture.config.numParticles);
    sim.setMaxIterations(fixture.config.maxIterations);
    sim.setC1(fixture.config.c1);
    sim.setC2(fixture.config.c2);
    sim.setInertia({ ...fixture.config.inertia });
    sim.setBoundaryMode(fixture.config.boundaryMode);
    sim.setManualPositions(fixture.config.initialPositions);
    sim.setManualVelocities(fixture.config.initialVelocities);
    sim.setManualRandomDraws(fixture.config.manualRandomDraws);
    sim.setActiveTab('solver');
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={sim.activeTab}
        onSelectTab={sim.setActiveTab}
        displayOptions={sim.displayOptions}
        onToggleDisplayOption={handleToggleDisplayOption}
        precisionMode={sim.precisionMode}
        onTogglePrecision={() =>
          sim.setPrecisionMode((m) => (m === 'standard' ? 'full' : 'standard'))
        }
        dimension={sim.dimension}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-3 md:p-4 max-w-[1700px] w-full mx-auto flex flex-col gap-4">
        {/* KPI Summary Banner */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Best Found Fitness */}
          <div className="bg-space-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Award className="w-3.5 h-3.5" /> Best Found by PSO
              </span>
              <span className="text-[10px] bg-amber-950/60 text-amber-300 px-1.5 py-0.5 rounded border border-amber-900/60">
                f(x)
              </span>
            </div>
            <div className="text-lg md:text-xl font-bold font-mono text-white mt-1 truncate">
              {curSnap ? fmt(curSnap.gbestFitness) : '—'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Stochastic exploration result
            </div>
          </div>

          {/* Best Found Location */}
          <div className="bg-space-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Target className="w-3.5 h-3.5" /> Best Position (gbest)
              </span>
            </div>
            <div className="text-sm md:text-base font-bold font-mono text-cyan-300 mt-1 truncate">
              {curSnap
                ? curSnap.gbest.length === 1
                  ? `x = ${fmt(curSnap.gbest[0])}`
                  : `(${fmt(curSnap.gbest[0])}, ${fmt(curSnap.gbest[1])})`
                : '—'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Found by P{curSnap ? curSnap.gbestParticleId + 1 : 1}
            </div>
          </div>

          {/* Known Optimum (if preset) */}
          <div className="bg-space-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Compass className="w-3.5 h-3.5" /> Known Benchmark
              </span>
            </div>
            <div className="text-sm font-semibold font-mono text-emerald-300 mt-1 truncate">
              {currentPreset?.knownOptimum ? `f* = ${fmt(currentPreset.knownOptimum.f)}` : 'Custom Problem'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
              {currentPreset?.knownOptimum
                ? currentPreset.knownOptimum.description
                : 'No preset reference'}
            </div>
          </div>

          {/* Average Swarm Fitness */}
          <div className="bg-space-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
                <Activity className="w-3.5 h-3.5" /> Swarm Average
              </span>
            </div>
            <div className="text-lg md:text-xl font-bold font-mono text-purple-200 mt-1 truncate">
              {curSnap ? fmt(curSnap.avgFitness) : '—'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Mean over {sim.numParticles} particles
            </div>
          </div>

          {/* Swarm Dispersion / Diameter */}
          <div className="bg-space-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-pink-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Swarm Diameter
              </span>
            </div>
            <div className="text-lg md:text-xl font-bold font-mono text-pink-300 mt-1 truncate">
              {curSnap ? fmt(curSnap.swarmDiameter) : '—'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Max Euclidean distance
            </div>
          </div>
        </section>

        {/* Tab 1: Custom Solver (Main Focus) */}
        {sim.activeTab === 'solver' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: Problem Input & Parameters */}
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
              <ProblemPanel
                expression={sim.expression}
                onExpressionChange={sim.setExpression}
                dimension={sim.dimension}
                onDimensionChange={sim.setDimension}
                goal={sim.goal}
                onGoalChange={sim.setGoal}
                bounds={sim.bounds}
                onBoundsChange={sim.setBounds}
                validation={sim.validation}
                onRun={sim.runSimulation}
                activePresetId={sim.activePresetId}
                onSelectPreset={sim.loadPreset}
              />

              <ParamPanel
                numParticles={sim.numParticles}
                onNumParticlesChange={sim.setNumParticles}
                maxIterations={sim.maxIterations}
                onMaxIterationsChange={sim.setMaxIterations}
                inertia={sim.inertia}
                onInertiaChange={sim.setInertia}
                c1={sim.c1}
                onC1Change={sim.setC1}
                c2={sim.c2}
                onC2Change={sim.setC2}
                boundaryMode={sim.boundaryMode}
                onBoundaryModeChange={sim.setBoundaryMode}
                velocityClamping={sim.velocityClamping}
                onVelocityClampingChange={sim.setVelocityClamping}
                seed={sim.seed}
                onSeedChange={sim.setSeed}
                onRerollSeed={sim.rerollSeed}
              />
            </div>

            {/* Center Column: Plot Canvas, Playback Controls, Charts */}
            <div className="lg:col-span-8 xl:col-span-6 flex flex-col gap-4">
              {/* Canvas Plot Container */}
              <div className="w-full h-[430px] shadow-2xl">
                {sim.dimension === 1 ? (
                  <PlotCanvas1D
                    snapshot={curSnap}
                    allSnapshots={sim.snapshots}
                    cursor={sim.cursor}
                    expression={sim.expression}
                    bounds={sim.bounds}
                    selectedParticleId={sim.selectedParticleId}
                    onSelectParticle={sim.setSelectedParticleId}
                    displayOptions={sim.displayOptions}
                    precisionMode={sim.precisionMode}
                  />
                ) : (
                  <PlotCanvas2D
                    snapshot={curSnap}
                    allSnapshots={sim.snapshots}
                    cursor={sim.cursor}
                    expression={sim.expression}
                    bounds={sim.bounds}
                    selectedParticleId={sim.selectedParticleId}
                    onSelectParticle={sim.setSelectedParticleId}
                    displayOptions={sim.displayOptions}
                    precisionMode={sim.precisionMode}
                  />
                )}
              </div>

              {/* Playback Controls */}
              <Controls
                cursor={sim.cursor}
                totalIterations={totalIterations}
                isPlaying={sim.isPlaying}
                playbackSpeed={sim.playbackSpeed}
                onTogglePlay={sim.togglePlay}
                onStepForward={sim.stepForward}
                onStepBackward={sim.stepBackward}
                onReset={sim.reset}
                onJumpToEnd={sim.jumpToEnd}
                onSetCursor={sim.setCursor}
                onSetSpeed={sim.setPlaybackSpeed}
              />

              {/* Convergence Curve & Step-by-Step History Log */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ConvergenceChart
                  snapshots={sim.snapshots}
                  cursor={sim.cursor}
                  onSelectCursor={sim.setCursor}
                  precisionMode={sim.precisionMode}
                />
                <HistoryTable
                  snapshots={sim.snapshots}
                  cursor={sim.cursor}
                  onSelectCursor={sim.setCursor}
                  precisionMode={sim.precisionMode}
                />
              </div>
            </div>

            {/* Right Column: Particle Step Inspector */}
            <div className="lg:col-span-12 xl:col-span-3 flex flex-col gap-4">
              <ParticleInspector
                snapshot={curSnap}
                selectedParticleId={sim.selectedParticleId}
                onSelectParticle={sim.setSelectedParticleId}
                precisionMode={sim.precisionMode}
                onTogglePrecision={() =>
                  sim.setPrecisionMode((m) => (m === 'standard' ? 'full' : 'standard'))
                }
              />
            </div>
          </div>
        )}

        {/* Tab 2: Textbook Verification */}
        {sim.activeTab === 'textbook' && (
          <TextbookPanel onLoadFixtureIntoSolver={handleLoadFixture} />
        )}

        {/* Tab 3: Manual Initialization */}
        {sim.activeTab === 'manual' && (
          <div className="max-w-3xl mx-auto w-full">
            <ManualInitTable
              dimension={sim.dimension}
              numParticles={sim.numParticles}
              initialPositions={sim.manualPositions}
              initialVelocities={sim.manualVelocities}
              onSaveManualState={(pos, vel) => {
                sim.setManualPositions(pos);
                sim.setManualVelocities(vel);
                sim.runSimulation();
                sim.setActiveTab('solver');
              }}
            />
          </div>
        )}

        {/* Tab 4: Theory & Reference */}
        {sim.activeTab === 'reference' && (
          <div className="max-w-4xl mx-auto w-full">
            <TheoryPanel />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-space-950 py-3 px-4 text-center text-xs font-mono text-slate-500 flex flex-wrap justify-between items-center gap-2">
        <span>SwarmVerse v1.0 • Deterministic Particle Swarm Optimization Studio</span>
        <span>Honesty Rule: All outcomes labelled &quot;Best Found by PSO&quot; • Synchronous Update Model</span>
      </footer>
    </div>
  );
};

export default App;
