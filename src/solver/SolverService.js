import * as CubeModule from 'cubejs';
import { BeginnerSolver } from './BeginnerSolver.js';
import { CFOPSolver } from './CFOPSolver.js';
import { RouxSolver } from './RouxSolver.js';
import { solver2x2 } from './Solver2x2.js';
import { solver4x4, MOVE_DESCRIPTIONS_4X4 } from './Solver4x4.js';
import { solverPyraminx, MOVE_DESCRIPTIONS_PYRAMINX } from './SolverPyraminx.js';

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

export function countInversions(arr) {
  let inv = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] > arr[j]) inv++;
    }
  }
  return inv % 2;
}

export function validateFaceletString(faceletStr) {
  if (!faceletStr || typeof faceletStr !== 'string') {
    return { valid: false, reason: 'Facelet string is missing or not a string' };
  }

  // 2x2 Pocket Cube (24 stickers)
  if (faceletStr.length === 24) {
    const counts = {};
    for (const ch of faceletStr) {
      counts[ch] = (counts[ch] || 0) + 1;
    }
    for (const face of ['U', 'R', 'F', 'D', 'L', 'B']) {
      if (counts[face] !== 4) {
        return { valid: false, reason: `Invalid 2x2 facelet counts: color '${face}' appears ${counts[face] || 0} times (expected 4)` };
      }
    }
    return { valid: true };
  }

  // 4x4 Rubik's Revenge (96 stickers)
  if (faceletStr.length === 96) {
    const counts = {};
    for (const ch of faceletStr) {
      counts[ch] = (counts[ch] || 0) + 1;
    }
    for (const face of ['U', 'R', 'F', 'D', 'L', 'B']) {
      if (counts[face] !== 16) {
        return { valid: false, reason: `Invalid 4x4 facelet counts: color '${face}' appears ${counts[face] || 0} times (expected 16)` };
      }
    }
    return { valid: true };
  }

  // 3x3 Standard Cube (54 stickers)
  if (faceletStr.length === 54) {
    const counts = {};
    for (const ch of faceletStr) {
      counts[ch] = (counts[ch] || 0) + 1;
    }
    for (const face of ['U', 'R', 'F', 'D', 'L', 'B']) {
      if (counts[face] !== 9) {
        return { valid: false, reason: `Invalid 3x3 facelet counts: color '${face}' appears ${counts[face] || 0} times (expected 9)` };
      }
    }

    // Check centers (indices 4, 13, 22, 31, 40, 49)
    const centerIndices = [4, 13, 22, 31, 40, 49];
    const centerChars = centerIndices.map(i => faceletStr[i]);
    const centerSet = new Set(centerChars);
    if (centerSet.size !== 6) {
      return { valid: false, reason: 'Duplicate or missing center facelet colors' };
    }

    let cube;
    try {
      cube = Cube.fromString(faceletStr);
    } catch (err) {
      return { valid: false, reason: `Failed to parse cube state: ${err.message}` };
    }

    // Check corner permutation uniqueness
    const cpSet = new Set(cube.cp);
    if (cpSet.size !== 8) {
      return { valid: false, reason: 'Invalid corner permutation: duplicates or missing corner pieces' };
    }

    // Check edge permutation uniqueness
    const epSet = new Set(cube.ep);
    if (epSet.size !== 12) {
      return { valid: false, reason: 'Invalid edge permutation: duplicates or missing edge pieces' };
    }

    // Corner orientation parity: sum of corner twists must be a multiple of 3
    const coSum = cube.co.reduce((a, b) => a + b, 0);
    if (coSum % 3 !== 0) {
      return { valid: false, reason: 'Corner twist parity error: sum of corner twists must be divisible by 3' };
    }

    // Edge orientation parity: sum of edge flips must be even
    const eoSum = cube.eo.reduce((a, b) => a + b, 0);
    if (eoSum % 2 !== 0) {
      return { valid: false, reason: 'Edge flip parity error: an odd number of edges are flipped' };
    }

    // Total permutation parity: corner and edge permutation signs must match
    if (countInversions(cube.cp) !== countInversions(cube.ep)) {
      return { valid: false, reason: 'Permutation parity error: odd permutation swap detected' };
    }

    return { valid: true };
  }

  return {
    valid: false,
    reason: `Invalid facelet string length: received ${faceletStr.length} (expected 24 for 2x2, 54 for 3x3, or 96 for 4x4)`,
  };
}

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

  validateFaceletString(faceletStr) {
    return validateFaceletString(faceletStr);
  }

  getInverseMove(move) {
    if (move.endsWith('2')) return move;
    if (move.endsWith("'")) return move.slice(0, -1);
    return move + "'";
  }

  describeMove(move) {
    if (MOVE_DESCRIPTIONS_PYRAMINX[move]) return MOVE_DESCRIPTIONS_PYRAMINX[move];
    if (MOVE_DESCRIPTIONS_4X4[move]) return MOVE_DESCRIPTIONS_4X4[move];
    return MOVE_DESCRIPTIONS[move] || `Rotate ${move}`;
  }

  solveFromFaceletString(faceletStr, method = 'kociemba', options = {}) {
    const validation = this.validateFaceletString(faceletStr);
    if (!validation.valid) {
      return {
        error: validation.reason,
        isSolved: false,
        steps: [],
        rawMoves: [],
        method,
        stages: [],
      };
    }

    if (faceletStr && faceletStr.length === 96) {
      if (solver4x4.isFaceletsSolved(faceletStr)) {
        return { isSolved: true, steps: [], rawMoves: [], method, stages: [] };
      }
      return this.solve4x4(faceletStr, method, options);
    }

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

  solve4x4(faceletStr, method = 'reduction', options = {}) {
    if (method === 'parity_oll') {
      return solver4x4.solveOLLParity();
    }
    if (method === 'parity_pll') {
      return solver4x4.solvePLLParity();
    }
    return solver4x4.solveReduction(faceletStr, options);
  }

  solve(rubiksCube, method = 'kociemba', options = {}) {
    if (rubiksCube.puzzleType === 'pyraminx') {
      return solverPyraminx.solve(rubiksCube, method);
    }
    const faceletStr = rubiksCube.getFaceletString();
    const moveHistory = rubiksCube.moveHistory || options.moveHistory || [];
    return this.solveFromFaceletString(faceletStr, method, { ...options, moveHistory });
  }
}

export const solverService = new SolverService();