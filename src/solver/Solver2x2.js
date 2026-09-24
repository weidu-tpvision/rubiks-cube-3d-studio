import * as CubeModule from 'cubejs';

const Cube = CubeModule.default || CubeModule;

const CORNER_COLOR = [
  ['U', 'R', 'F'],
  ['U', 'F', 'L'],
  ['U', 'L', 'B'],
  ['U', 'B', 'R'],
  ['D', 'F', 'R'],
  ['D', 'L', 'F'],
  ['D', 'B', 'L'],
  ['D', 'R', 'B'],
];

const CORNER_FACELET_2X2 = [
  [3, 4, 9],    // URF
  [2, 8, 17],   // UFL
  [0, 16, 21],  // ULB
  [1, 20, 5],   // UBR
  [13, 11, 6],  // DFR
  [12, 19, 10], // DLF
  [14, 23, 18], // DBL
  [15, 7, 22],  // DRB
];

const ROTATIONS = [
  "",
  "y", "y2", "y'",
  "x", "x y", "x y2", "x y'",
  "x2", "x2 y", "x2 y2", "x2 y'",
  "x'", "x' y", "x' y2", "x' y'",
  "z", "z y", "z y2", "z y'",
  "z'", "z' y", "z' y2", "z' y'"
];

const URF_MOVES = ['U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2'];
const STAGE1_MOVES = ['R', "R'", 'R2', 'F', "F'", 'F2', 'U', "U'", 'U2', 'D', "D'", 'D2', 'L', "L'", 'L2'];

const OLL_ALGS = [
  { name: 'Sune', alg: "R U R' U R U2 R'", desc: "Right Sune algorithm" },
  { name: 'Anti-Sune', alg: "R U2 R' U' R U' R'", desc: "Anti-Sune algorithm" },
  { name: 'H Case', alg: "R2 U2 R U2 R2", desc: "Double headlights orientation" },
  { name: 'Pi Case', alg: "F R U R' U' R U R' U' F'", desc: "Opposite headlights orientation" },
  { name: 'T Case', alg: "R U R' U' R' F R F'", desc: "Single headlight orientation" },
  { name: 'U Case', alg: "F R U R' U' F'", desc: "Front headlights orientation" },
  { name: 'L Case', alg: "F R' F' R U R U' R'", desc: "Diagonal corners orientation" },
];

const T_PERM = "R U R' U' R' F R2 U' R' U' R U R' F'";
const Y_PERM = "F R U' R' U' R U R' F' R U R' U' R' F R F'";
const AUFS = ['', 'U', 'U2', "U'"];

function cornerHash(c) {
  return c.cp.join('') + '_' + c.co.join('');
}

function isCubeSolved(c) {
  return [0, 1, 2, 3, 4, 5, 6, 7].every(i => c.cp[i] === i && c.co[i] === 0);
}

function isTopOriented(c) {
  return c.co[0] === 0 && c.co[1] === 0 && c.co[2] === 0 && c.co[3] === 0;
}

function isDLayerSolved(c) {
  return c.cp[4] === 4 && c.co[4] === 0 &&
         c.cp[5] === 5 && c.co[5] === 0 &&
         c.cp[6] === 6 && c.co[6] === 0 &&
         c.cp[7] === 7 && c.co[7] === 0;
}

function isDFaceOriented(c) {
  return [4, 5, 6, 7].every(idx => {
    const piece = c.cp[idx];
    return (piece >= 4 && c.co[idx] === 0);
  });
}

export class Solver2x2 {
  constructor() {}

  parse2x2Facelets(str) {
    const cube = new Cube();
    for (let i = 0; i < 8; i++) {
      let ori = 0;
      for (ori = 0; ori <= 2; ori++) {
        const f = str[CORNER_FACELET_2X2[i][ori]];
        if (f === 'U' || f === 'D') break;
      }
      const col1 = str[CORNER_FACELET_2X2[i][(ori + 1) % 3]];
      const col2 = str[CORNER_FACELET_2X2[i][(ori + 2) % 3]];
      for (let j = 0; j < 8; j++) {
        if (col1 === CORNER_COLOR[j][1] && col2 === CORNER_COLOR[j][2]) {
          cube.cp[i] = j;
          cube.co[i] = ori % 3;
          break;
        }
      }
    }
    return cube;
  }

  kociembaTo2x2(str3) {
    if (!str3 || str3.length !== 54) return '';
    return [
      str3[0], str3[2], str3[6], str3[8], // U
      str3[9], str3[11], str3[15], str3[17], // R
      str3[18], str3[20], str3[24], str3[26], // F
      str3[27], str3[29], str3[33], str3[35], // D
      str3[36], str3[38], str3[42], str3[44], // L
      str3[45], str3[47], str3[51], str3[53], // B
    ].join('');
  }

  isFaceletsSolved(str) {
    if (!str || str.length !== 24) return false;
    for (let f = 0; f < 6; f++) {
      const base = f * 4;
      const ch = str[base];
      if (str[base + 1] !== ch || str[base + 2] !== ch || str[base + 3] !== ch) {
        return false;
      }
    }
    return true;
  }

  findOrientation(c) {
    for (const rot of ROTATIONS) {
      const test = new Cube();
      test.cp = c.cp.slice();
      test.co = c.co.slice();
      if (rot) test.move(rot);
      if (test.cp[6] === 6 && test.co[6] === 0) {
        return rot;
      }
    }
    return "";
  }

  solveFixedOptimal(cube) {
    const startState = cornerHash(cube);
    const solved = new Cube();
    const targetState = cornerHash(solved);
    if (startState === targetState) return [];

    const fwdVisited = new Map();
    fwdVisited.set(startState, { prev: null, move: null });
    const bwdVisited = new Map();
    bwdVisited.set(targetState, { prev: null, move: null });

    let fwdQueue = [cube];
    let bwdQueue = [solved];

    const invMove = {
      'U': "U'", "U'": 'U', 'U2': 'U2',
      'R': "R'", "R'": 'R', 'R2': 'R2',
      'F': "F'", "F'": 'F', 'F2': 'F2'
    };

    for (let depth = 0; depth <= 6; depth++) {
      const nextFwd = [];
      for (const c of fwdQueue) {
        const s = cornerHash(c);
        for (const m of URF_MOVES) {
          const c2 = new Cube();
          c2.cp = c.cp.slice();
          c2.co = c.co.slice();
          c2.move(m);
          const s2 = cornerHash(c2);
          if (!fwdVisited.has(s2)) {
            fwdVisited.set(s2, { prev: s, move: m });
            if (bwdVisited.has(s2)) {
              return this.reconstructMeet(s2, fwdVisited, bwdVisited);
            }
            nextFwd.push(c2);
          }
        }
      }
      fwdQueue = nextFwd;

      const nextBwd = [];
      for (const c of bwdQueue) {
        const s = cornerHash(c);
        for (const m of URF_MOVES) {
          const c2 = new Cube();
          c2.cp = c.cp.slice();
          c2.co = c.co.slice();
          c2.move(m);
          const s2 = cornerHash(c2);
          if (!bwdVisited.has(s2)) {
            bwdVisited.set(s2, { prev: s, move: invMove[m] });
            if (fwdVisited.has(s2)) {
              return this.reconstructMeet(s2, fwdVisited, bwdVisited);
            }
            nextBwd.push(c2);
          }
        }
      }
      bwdQueue = nextBwd;
    }

    return null;
  }

  reconstructMeet(meet, fwd, bwd) {
    const res1 = [];
    let cur = meet;
    while (fwd.get(cur).move !== null) {
      res1.unshift(fwd.get(cur).move);
      cur = fwd.get(cur).prev;
    }
    const res2 = [];
    cur = meet;
    while (bwd.get(cur).move !== null) {
      res2.push(bwd.get(cur).move);
      cur = bwd.get(cur).prev;
    }
    return [...res1, ...res2];
  }

  solveOptimal(faceletStr) {
    const cube = this.parse2x2Facelets(faceletStr);
    const rot = this.findOrientation(cube);
    const cRot = new Cube();
    cRot.cp = cube.cp.slice();
    cRot.co = cube.co.slice();
    if (rot) cRot.move(rot);

    const sol = this.solveFixedOptimal(cRot);
    const allMoves = [];
    if (rot) {
      rot.trim().split(/\s+/).filter(m => m.length > 0).forEach(m => allMoves.push(m));
    }
    if (sol) {
      sol.forEach(m => allMoves.push(m));
    }

    return [{
      stageIndex: 0,
      stageName: "Optimal Solution (God's Algorithm)",
      description: `Shortest path mathematical solution (${allMoves.length} moves, max 11 for 2×2).`,
      moves: allMoves,
    }];
  }

  solveBeginner(faceletStr) {
    const cube = this.parse2x2Facelets(faceletStr);
    const stages = [];

    // Check if already completely solved
    if (isCubeSolved(cube)) {
      return [];
    }

    // Stage 1: Solve White First Layer
    let stage1Moves = [];
    if (!isDLayerSolved(cube)) {
      stage1Moves = this.findStage1Moves(cube, isDLayerSolved, 5);
      if (!stage1Moves) {
        // Fallback: solve DBL corner orientation first, then search
        const rot = this.findOrientation(cube);
        if (rot) {
          const rotMoves = rot.trim().split(/\s+/).filter(m => m.length > 0);
          cube.move(rot);
          stage1Moves = [...rotMoves];
        }
        const remaining = this.findStage1Moves(cube, isDLayerSolved, 5);
        if (remaining) stage1Moves.push(...remaining);
      }
    }

    if (stage1Moves && stage1Moves.length > 0) {
      cube.move(stage1Moves.join(' '));
    }

    stages.push({
      stageIndex: 0,
      stageName: 'Stage 1: First Layer (White Corners)',
      description: 'Place and orient all 4 bottom white corners with matching lateral colors.',
      moves: stage1Moves || [],
    });

    // Stage 2: Orient Top Layer (OLL)
    let stage2Moves = [];
    if (!isTopOriented(cube)) {
      const ollResult = this.findOLL(cube);
      if (ollResult) {
        stage2Moves = ollResult.moves;
        cube.move(stage2Moves.join(' '));
      }
    }

    stages.push({
      stageIndex: 1,
      stageName: 'Stage 2: Orient Last Layer (OLL)',
      description: 'Orient yellow top corners so all 4 yellow stickers face upward.',
      moves: stage2Moves,
    });

    // Stage 3: Permute Last Layer (PLL)
    let stage3Moves = [];
    if (!isCubeSolved(cube)) {
      const pllResult = this.findPLL(cube);
      if (pllResult) {
        stage3Moves = pllResult.moves;
        cube.move(stage3Moves.join(' '));
      }
    }

    stages.push({
      stageIndex: 2,
      stageName: 'Stage 3: Permute Last Layer (PLL)',
      description: 'Swap top layer corners into their solved positions to complete the cube.',
      moves: stage3Moves,
    });

    // Final check: if anything residual is left, solve optimally
    if (!isCubeSolved(cube)) {
      const residual = this.solveOptimal(faceletStr);
      return residual;
    }

    return stages;
  }

  solveOrtega(faceletStr) {
    const cube = this.parse2x2Facelets(faceletStr);
    const stages = [];

    if (isCubeSolved(cube)) {
      return [];
    }

    // Stage 1: Build First Face (White face on bottom, side colors do not need to match)
    let stage1Moves = [];
    if (!isDFaceOriented(cube)) {
      stage1Moves = this.findStage1Moves(cube, isDFaceOriented, 4);
      if (!stage1Moves) {
        stage1Moves = this.findStage1Moves(cube, isDLayerSolved, 5);
      }
      if (stage1Moves && stage1Moves.length > 0) {
        cube.move(stage1Moves.join(' '));
      }
    }

    stages.push({
      stageIndex: 0,
      stageName: 'Stage 1: First Face (White Face)',
      description: 'Form a solid white bottom face (side colors do not need to align yet).',
      moves: stage1Moves || [],
    });

    // Stage 2: Orient Opposite Face (OLL)
    let stage2Moves = [];
    if (!isTopOriented(cube)) {
      const ollResult = this.findOLL(cube);
      if (ollResult) {
        stage2Moves = ollResult.moves;
        cube.move(stage2Moves.join(' '));
      }
    }

    stages.push({
      stageIndex: 1,
      stageName: 'Stage 2: Orient Top Face (OLL)',
      description: 'Orient opposite (yellow) face in one algorithm using standard Ortega OLL.',
      moves: stage2Moves,
    });

    // Stage 3: Permute Both Layers (PBL)
    let stage3Moves = [];
    if (!isCubeSolved(cube)) {
      const pblResult = this.findPBL(cube);
      if (pblResult) {
        stage3Moves = pblResult.moves;
        cube.move(stage3Moves.join(' '));
      }
    }

    stages.push({
      stageIndex: 2,
      stageName: 'Stage 3: Permute Both Layers (PBL)',
      description: 'Simultaneously permute top and bottom layers to finish the solve.',
      moves: stage3Moves,
    });

    // Final check
    if (!isCubeSolved(cube)) {
      const residual = this.solveOptimal(faceletStr);
      return residual;
    }

    return stages;
  }

  findStage1Moves(startCube, checkFn, maxDepth = 5) {
    if (checkFn(startCube)) return [];
    const queue = [{ cube: startCube, moves: [] }];
    const visited = new Set();
    visited.add(startCube.cp.slice(4, 8).join('') + '_' + startCube.co.slice(4, 8).join(''));

    while (queue.length > 0) {
      const { cube, moves } = queue.shift();
      if (moves.length >= maxDepth) continue;

      for (const m of STAGE1_MOVES) {
        if (moves.length > 0 && moves[moves.length - 1][0] === m[0]) continue;
        const c2 = new Cube();
        c2.cp = cube.cp.slice();
        c2.co = cube.co.slice();
        c2.move(m);

        if (checkFn(c2)) {
          return [...moves, m];
        }

        const key = c2.cp.slice(4, 8).join('') + '_' + c2.co.slice(4, 8).join('');
        if (!visited.has(key) && moves.length < maxDepth - 1) {
          visited.add(key);
          queue.push({ cube: c2, moves: [...moves, m] });
        }
      }
    }
    return null;
  }

  findOLL(cube) {
    if (isTopOriented(cube)) return { moves: [], name: 'Already Oriented' };
    for (const auf of AUFS) {
      for (const oll of OLL_ALGS) {
        const test = new Cube();
        test.cp = cube.cp.slice();
        test.co = cube.co.slice();
        const seq = auf ? `${auf} ${oll.alg}` : oll.alg;
        test.move(seq);
        if (isTopOriented(test)) {
          return { moves: seq.trim().split(/\s+/), name: oll.name };
        }
      }
    }
    return null;
  }

  findPLL(cube) {
    for (const auf of AUFS) {
      const test = new Cube();
      test.cp = cube.cp.slice();
      test.co = cube.co.slice();
      if (auf) test.move(auf);
      if (isCubeSolved(test)) {
        return { moves: auf ? [auf] : [], name: 'AUF Alignment' };
      }
    }

    for (const preAuf of AUFS) {
      for (const perm of [
        { name: 'Adjacent Swap (T-Perm)', alg: T_PERM },
        { name: 'Diagonal Swap (Y-Perm)', alg: Y_PERM },
      ]) {
        for (const postAuf of AUFS) {
          const test = new Cube();
          test.cp = cube.cp.slice();
          test.co = cube.co.slice();
          const parts = [];
          if (preAuf) parts.push(preAuf);
          parts.push(perm.alg);
          if (postAuf) parts.push(postAuf);
          const seq = parts.join(' ');
          test.move(seq);
          if (isCubeSolved(test)) {
            return { moves: seq.trim().split(/\s+/), name: perm.name };
          }
        }
      }
    }
    return null;
  }

  findPBL(cube) {
    // PBL standard algorithms
    const PBL_ALGS = [
      { name: 'T-Perm (Top Adjacent Swap)', alg: T_PERM },
      { name: 'Y-Perm (Top Diagonal Swap)', alg: Y_PERM },
      { name: 'Adjacent/Adjacent Swap', alg: "R2 U' B2 U2 R2 U' R2" },
      { name: 'Diagonal/Diagonal Swap', alg: "R2 F2 R2" },
      { name: 'Top Adjacent, Bottom Diagonal', alg: "R U' R F2 R' U R'" },
      { name: 'Top Diagonal, Bottom Adjacent', alg: "R U' R' U' F2 U' R U R' D R2" },
    ];

    for (const preAuf of AUFS) {
      for (const pbl of PBL_ALGS) {
        for (const postAuf of AUFS) {
          for (const dAuf of ['', 'D', 'D2', "D'"]) {
            const test = new Cube();
            test.cp = cube.cp.slice();
            test.co = cube.co.slice();
            const parts = [];
            if (preAuf) parts.push(preAuf);
            parts.push(pbl.alg);
            if (postAuf) parts.push(postAuf);
            if (dAuf) parts.push(dAuf);
            const seq = parts.join(' ');
            test.move(seq);
            if (isCubeSolved(test)) {
              return { moves: seq.trim().split(/\s+/), name: pbl.name };
            }
          }
        }
      }
    }
    return null;
  }
}

export const solver2x2 = new Solver2x2();
