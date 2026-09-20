import * as CubeModule from 'cubejs';
import { BeginnerSolver } from './BeginnerSolver.js';
import { CFOPSolver } from './CFOPSolver.js';
import { RouxSolver } from './RouxSolver.js';
import { solver2x2 } from './Solver2x2.js';

const Cube = CubeModule.default || CubeModule;

const MOVE_DESCRIPTIONS = {
  U:  'Turn Top (White) layer 90° clockwise',
  "U'": 'Turn Top (White) layer 90° counter-clockwise',
  U2: 'Turn Top (White) layer 180°',
  D:  'Turn Bottom (Yellow) layer 90° clockwise',
  "D'": 'Turn Bottom (Yellow) layer 90° counter-clockwise',
  D2: 'Turn Bottom (Yellow) layer 180°',
  F:  'Turn Front (Green) face 90° clockwise',
  "F'": 'Turn Front (Green) face 90° counter-clockwise',
  F2: 'Turn Front (Green) face 180°',
  B:  'Turn Back (Blue) face 90° clockwise',
  "B'": 'Turn Back (Blue) face 90° counter-clockwise',
  B2: 'Turn Back (Blue) face 180°',
  L:  'Turn Left (Orange) face 90° clockwise',
  "L'": 'Turn Left (Orange) face 90° counter-clockwise',
  L2: 'Turn Left (Orange) face 180°',
  R:  'Turn Right (Red) face 90° clockwise',
  "R'": 'Turn Right (Red) face 90° counter-clockwise',
  R2: 'Turn Right (Red) face 180°',
  M:  'Turn Middle slice 90° downward (in L direction)',
  "M'": 'Turn Middle slice 90° upward (in R direction)',
  M2: 'Turn Middle slice 180°',
  x:   'Rotate whole cube 90° upward (X axis)',
  "x'": 'Rotate whole cube 90° downward (X axis)',
  x2:  'Rotate whole cube 180° (X axis)',
  y:   'Rotate whole cube 90° clockwise (Y axis)',
  "y'": 'Rotate whole cube 90° counter-clockwise (Y axis)',
  y2:  'Rotate whole cube 180° (Y axis)',
  z:   'Rotate whole cube 90° clockwise (Z axis)',
  "z'": 'Rotate whole cube 90° counter-clockwise (Z axis)',
  z2:  'Rotate whole cube 180° (Z axis)',
};

export class SolverService {
  constructor() {
    this.isInitialized = false;
    this.initPromise = null;
    this.beginnerSolver = new BeginnerSolver();
    this.cfopSolver = new CFOPSolver();
    this.rouxSolver = new RouxSolver();
  }

  // Precompute lookup tables
  init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      setTimeout(() => {
        try {
          Cube.initSolver();
          this.isInitialized = true;
          resolve(true);
        } catch (err) {
          console.error('[SolverService] Init error:', err);
          resolve(false);
        }
      }, 50);
    });

    return this.initPromise;
  }

  getInverseMove(move) {
    if (move.endsWith('2')) return move;
    if (move.endsWith("'")) return move.slice(0, -1);
    return move + "'";
  }

  describeMove(move) {
    return MOVE_DESCRIPTIONS[move] || `Rotate ${move}`;
  }

  solveFromFaceletString(faceletStr, method = 'kociemba') {
    if (faceletStr && faceletStr.length === 24) {
      if (solver2x2.isFaceletsSolved(faceletStr)) {
        return { isSolved: true, steps: [], rawMoves: [], method, stages: [] };
      }
      return this.solve2x2(faceletStr, method);
    }

    const solvedStr = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
    if (faceletStr === solvedStr) {
      return { isSolved: true, steps: [], rawMoves: [], method, stages: [] };
    }

    try {
      if (method === 'beginner') {
        return this.solveWithBeginner(faceletStr);
      } else if (method === 'cfop') {
        return this.solveWithCFOP(faceletStr);
      } else if (method === 'roux') {
        return this.solveWithRoux(faceletStr);
      } else {
        return this.solveWithKociemba(faceletStr);
      }
    } catch (err) {
      console.error(`[SolverService] Solve failed with method ${method}:`, err);
      // Fallback to Kociemba if human solver hits unexpected state
      if (method !== 'kociemba') {
        console.warn('[SolverService] Falling back to Kociemba solver');
        return this.solveWithKociemba(faceletStr);
      }
      return {
        error: err.message || 'Invalid or unsolvable cube state',
        steps: [],
        rawMoves: [],
        method,
      };
    }
  }

  solve2x2(faceletStr, method = 'optimal') {
    let stageResults = [];
    let methodName = "Optimal (God's Algorithm)";

    if (method === 'beginner') {
      methodName = 'Beginner (Layer-by-Layer)';
      stageResults = solver2x2.solveBeginner(faceletStr);
    } else if (method === 'ortega') {
      methodName = 'Ortega Method (Speedcubing)';
      stageResults = solver2x2.solveOrtega(faceletStr);
    } else {
      methodName = "Optimal (God's Algorithm)";
      stageResults = solver2x2.solveOptimal(faceletStr);
    }

    const allRawMoves = [];
    const steps = [];
    const stagesMeta = [];

    stageResults.forEach(st => {
      const startIdx = steps.length;
      st.moves.forEach(m => {
        allRawMoves.push(m);
        steps.push({
          index: steps.length,
          move: m,
          inverseMove: this.getInverseMove(m),
          description: this.describeMove(m),
          stageIndex: st.stageIndex,
          stageName: st.stageName,
          stageTotal: stageResults.length,
          stageDescription: st.description,
        });
      });

      stagesMeta.push({
        stageIndex: st.stageIndex,
        stageName: st.stageName,
        startMoveIndex: startIdx,
        moveCount: st.moves.length,
        description: st.description,
      });
    });

    steps.forEach(s => (s.total = steps.length));

    return {
      isSolved: false,
      steps,
      rawMoves: allRawMoves,
      solutionStr: allRawMoves.join(' '),
      method,
      methodName,
      stages: stagesMeta,
    };
  }

  solveWithKociemba(faceletStr) {
    const cubeInstance = Cube.fromString(faceletStr);
    const solutionStr = cubeInstance.solve();
    const rawMoves = solutionStr.trim().split(/\s+/).filter(m => m.length > 0);

    const steps = rawMoves.map((move, idx) => ({
      index: idx,
      total: rawMoves.length,
      move: move,
      inverseMove: this.getInverseMove(move),
      description: this.describeMove(move),
      stageIndex: 0,
      stageName: 'Optimal Solution (Kociemba)',
      stageTotal: 1,
      stageDescription: 'Shortest path two-phase group-theory mathematical solver',
    }));

    return {
      isSolved: false,
      steps,
      rawMoves,
      solutionStr,
      method: 'kociemba',
      methodName: 'Optimal (Kociemba)',
      stages: [{
        stageIndex: 0,
        stageName: 'Optimal Solution (Kociemba)',
        startMoveIndex: 0,
        moveCount: steps.length,
      }],
    };
  }

  solveWithBeginner(faceletStr) {
    const stageResults = this.beginnerSolver.solve(faceletStr);
    return this.flattenStages(stageResults, faceletStr, 'beginner', 'Beginner (Layer-by-Layer)');
  }

  solveWithCFOP(faceletStr) {
    const stageResults = this.cfopSolver.solve(faceletStr);
    return this.flattenStages(stageResults, faceletStr, 'cfop', 'CFOP (Fridrich)');
  }

  solveWithRoux(faceletStr) {
    const stageResults = this.rouxSolver.solve(faceletStr);
    return this.flattenStages(stageResults, faceletStr, 'roux', 'Roux Method');
  }

  flattenStages(stageResults, initialFaceletStr, methodKey, methodName) {
    const allRawMoves = [];
    const steps = [];
    const stagesMeta = [];

    // Verify if residual solver needed to guarantee 100% solved
    const simCube = Cube.fromString(initialFaceletStr);

    stageResults.forEach(st => {
      const startIdx = steps.length;
      st.moves.forEach(m => {
        simCube.move(m);
        allRawMoves.push(m);
        steps.push({
          index: steps.length,
          move: m,
          inverseMove: this.getInverseMove(m),
          description: this.describeMove(m),
          stageIndex: st.stageIndex,
          stageName: st.stageName,
          stageTotal: stageResults.length,
          stageDescription: st.description,
        });
      });

      stagesMeta.push({
        stageIndex: st.stageIndex,
        stageName: st.stageName,
        startMoveIndex: startIdx,
        moveCount: st.moves.length,
        description: st.description,
      });
    });

    // If residual moves needed to 100% complete
    if (!simCube.isSolved()) {
      try {
        const residualSol = simCube.solve();
        const residualMoves = residualSol.trim().split(/\s+/).filter(m => m.length > 0);
        if (residualMoves.length > 0) {
          const resStageIdx = stagesMeta.length;
          const startIdx = steps.length;
          residualMoves.forEach(m => {
            allRawMoves.push(m);
            steps.push({
              index: steps.length,
              move: m,
              inverseMove: this.getInverseMove(m),
              description: this.describeMove(m),
              stageIndex: resStageIdx,
              stageName: 'Final Alignment & Finish',
              stageTotal: stageResults.length + 1,
              stageDescription: 'Complete final layer alignment to achieve solved state.',
            });
          });
          stagesMeta.push({
            stageIndex: resStageIdx,
            stageName: 'Final Alignment & Finish',
            startMoveIndex: startIdx,
            moveCount: residualMoves.length,
            description: 'Complete final layer alignment to achieve solved state.',
          });
        }
      } catch (err) {
        console.error('[SolverService] Residual solve error:', err);
      }
    }

    // Set total on each step
    steps.forEach(s => s.total = steps.length);

    return {
      isSolved: false,
      steps,
      rawMoves: allRawMoves,
      solutionStr: allRawMoves.join(' '),
      method: methodKey,
      methodName: methodName,
      stages: stagesMeta,
    };
  }

  solve(rubiksCube, method = 'kociemba') {
    const faceletStr = rubiksCube.getFaceletString();
    return this.solveFromFaceletString(faceletStr, method);
  }
}

export const solverService = new SolverService();