import Cube from 'cubejs';

const moveVal = {
  U: 1, "U'": 3, U2: 2,
  D: 1, "D'": 3, D2: 2,
  F: 1, "F'": 3, F2: 2,
  B: 1, "B'": 3, B2: 2,
  R: 1, "R'": 3, R2: 2,
  L: 1, "L'": 3, L2: 2,
  M: 1, "M'": 3, M2: 2,
};

const valToMove = {
  U: ['', 'U', 'U2', "U'"],
  D: ['', 'D', 'D2', "D'"],
  F: ['', 'F', 'F2', "F'"],
  B: ['', 'B', 'B2', "B'"],
  R: ['', 'R', 'R2', "R'"],
  L: ['', 'L', 'L2', "L'"],
  M: ['', 'M', 'M2', "M'"],
};

export function cancelMoves(moves) {
  let prevLen = -1;
  let curr = moves.filter(Boolean);
  while (curr.length !== prevLen) {
    prevLen = curr.length;
    const result = [];
    for (const m of curr) {
      if (!m) continue;
      if (result.length === 0) {
        result.push(m);
        continue;
      }
      const prev = result[result.length - 1];
      if (prev[0] === m[0]) {
        const face = prev[0];
        const sum = (moveVal[prev] + moveVal[m]) % 4;
        result.pop();
        const combined = valToMove[face][sum];
        if (combined) result.push(combined);
      } else {
        result.push(m);
      }
    }
    curr = result;
  }
  return curr;
}

const MOVES_18 = ['U', "U'", 'U2', 'D', "D'", 'D2', 'F', "F'", 'F2', 'B', "B'", 'B2', 'L', "L'", 'L2', 'R', "R'", 'R2'];
const SB_MOVES = ['U', "U'", 'U2', 'R', "R'", 'R2', 'M', "M'", 'M2'];
const M_MOVES = ['M', "M'", 'M2'];
const U_MOVES = ['U', "U'", 'U2'];
const ALL_MU = [...M_MOVES, ...U_MOVES];

function invertMove(m) {
  if (m.endsWith('2')) return m;
  if (m.endsWith("'")) return m.slice(0, -1);
  return m + "'";
}

function invertAlg(alg) {
  return alg.trim().split(/\s+/).reverse().map(invertMove).join(' ');
}

// ==========================================
// STAGE 1: First Block (FB: Left 1x2x3)
// ==========================================
function hashFront(c) {
  const cPos = c.cp.indexOf(5);
  const cOri = c.co[cPos];
  const dlPos = c.ep.indexOf(6);
  const dlOri = c.eo[dlPos];
  const flPos = c.ep.indexOf(9);
  const flOri = c.eo[flPos];
  return `${cPos},${cOri},${dlPos},${dlOri},${flPos},${flOri}`;
}

const frontTable = new Map();
frontTable.set('5,0,6,0,9,0', 0);
{
  const q = [new Cube()];
  while (q.length > 0) {
    const curr = q.shift();
    const d = frontTable.get(hashFront(curr));
    if (d >= 5) continue;
    for (const m of MOVES_18) {
      const next = new Cube(curr);
      next.move(m);
      const h = hashFront(next);
      if (!frontTable.has(h)) {
        frontTable.set(h, d + 1);
        q.push(next);
      }
    }
  }
}

// Precomputed BL table for FB (preserving Front 1x2x2)
function hashBL(c) {
  const cPos = c.cp.indexOf(6);
  const cOri = c.co[cPos];
  const ePos = c.ep.indexOf(10);
  const eOri = c.eo[ePos];
  return `${cPos}_${cOri}_${ePos}_${eOri}`;
}

const blTable = new Map();
blTable.set('6_0_10_0', []);
{
  const BL_MOVES = ['U', "U'", 'U2', 'B', "B'", 'B2', 'R', "R'", 'R2', 'M', "M'", 'M2'];
  const q = [{ cube: new Cube(), path: [] }];
  while (q.length > 0) {
    const curr = q.shift();
    if (curr.path.length >= 6) continue;
    for (const m of BL_MOVES) {
      if (curr.path.length > 0 && curr.path[curr.path.length - 1][0] === m[0]) continue;
      const next = new Cube(curr.cube);
      next.move(m);
      const frontPreserved = next.cp[5] === 5 && next.co[5] === 0 &&
                             next.ep[6] === 6 && next.eo[6] === 0 &&
                             next.ep[9] === 9 && next.eo[9] === 0;
      if (!frontPreserved) continue;

      const h = hashBL(next);
      if (!blTable.has(h)) {
        const toSolved = [invertMove(m), ...curr.path];
        blTable.set(h, toSolved);
        if (toSolved.length < 6) {
          q.push({ cube: next, path: toSolved });
        }
      }
    }
  }
}

export function solveFirstBlock(cube) {
  const stageMoves = [];
  const apply = (mStr) => {
    mStr.trim().split(/\s+/).filter(Boolean).forEach(m => {
      cube.move(m);
      stageMoves.push(m);
    });
  };

  // 1a: Front 1x2x2
  const isFrontOk = (c) => c.cp[5] === 5 && c.co[5] === 0 &&
                           c.ep[6] === 6 && c.eo[6] === 0 &&
                           c.ep[9] === 9 && c.eo[9] === 0;
  if (!isFrontOk(cube)) {
    const getH = (c) => frontTable.has(hashFront(c)) ? frontTable.get(hashFront(c)) : 5;
    const search = (c, g, bound, path, lastFace) => {
      const hVal = getH(c);
      const f = g + hVal;
      if (f > bound) return { min: f, found: null };
      if (isFrontOk(c)) return { min: f, found: path };
      let min = Infinity;
      for (const m of MOVES_18) {
        if (m[0] === lastFace) continue;
        const next = new Cube(c);
        next.move(m);
        const res = search(next, g + 1, bound, [...path, m], m[0]);
        if (res.found) return res;
        if (res.min < min) min = res.min;
      }
      return { min, found: null };
    };

    let bound = getH(cube);
    while (bound <= 8) {
      const res = search(cube, 0, bound, [], null);
      if (res.found) {
        apply(res.found.join(' '));
        break;
      }
      bound = res.min;
    }
  }

  // 1b: Back-Left pair from precomputed table
  const isFBOk = (c) => isFrontOk(c) && c.cp[6] === 6 && c.co[6] === 0 &&
                        c.ep[10] === 10 && c.eo[10] === 0;
  if (!isFBOk(cube)) {
    const h = hashBL(cube);
    if (blTable.has(h)) {
      blTable.get(h).forEach(m => apply(m));
    } else {
      // 1-2 step forward fallback
      const BL_MOVES = ['U', "U'", 'U2', 'B', "B'", 'B2', 'R', "R'", 'R2', 'M', "M'", 'M2'];
      for (const m of BL_MOVES) {
        const test = new Cube(cube);
        test.move(m);
        const h2 = hashBL(test);
        if (blTable.has(h2)) {
          apply(m);
          blTable.get(h2).forEach(move => apply(move));
          break;
        }
      }
    }
  }

  return cancelMoves(stageMoves);
}

// ==========================================
// STAGE 2: Second Block (SB: Right 1x2x3)
// ==========================================
// Precompute BR table (preserves DR and FB)
const BR_TRIGGERS = [
  "R' U' R", "R' U R", "R' U2 R",
  "R U R'", "R U' R'", "R U2 R'",
  "R' M U' M' R", "R' M U M' R", "R' M U2 M' R",
  "M' U2 M", "M' U M", "M' U' M",
  "M U2 M'", "M U M'", "M U' M'"
];
const brStepMoves = [];
for (const u of ["", "U", "U'", "U2"]) {
  for (const t of BR_TRIGGERS) {
    brStepMoves.push([u, t].filter(Boolean).join(' '));
  }
}
brStepMoves.push("U", "U'", "U2");

function hashBR(c) {
  const cPos = c.cp.indexOf(7);
  const cOri = c.co[cPos];
  const ePos = c.ep.indexOf(11);
  const eOri = c.eo[ePos];
  return `${cPos}_${cOri}_${ePos}_${eOri}`;
}

const brTable = new Map();
brTable.set('7_0_11_0', []);
{
  const q = [{ cube: new Cube(), path: [] }];
  while (q.length > 0) {
    const curr = q.shift();
    if (curr.path.length >= 3) continue;
    for (const sm of brStepMoves) {
      const next = new Cube(curr.cube);
      sm.split(' ').forEach(m => next.move(m));
      const h = hashBR(next);
      if (!brTable.has(h)) {
        const toSolved = [invertAlg(sm), ...curr.path];
        brTable.set(h, toSolved);
        q.push({ cube: next, path: toSolved });
      }
    }
  }
}

// Precompute FR table (preserves BR, DR, FB)
const FR_PRESERVE_BR = [
  "R U R' U' R U R'",
  "R U' R' U R U' R'",
  "R U2 R' U' R U R'",
  "R' U2 R2 U R' U' R' U2 R",
  "R M' U' M R' U R M' U M R'",
  "R M' U M R' U' R M' U' M R'",
  "R U R' U R U2 R'",
  "R U2 R' U' R U' R'",
  "M' U2 M", "M' U M", "M' U' M",
  "M U2 M'", "M U M'", "M U' M'"
];
const frStepMoves = [];
for (const u of ["", "U", "U'", "U2"]) {
  for (const t of FR_PRESERVE_BR) {
    frStepMoves.push([u, t].filter(Boolean).join(' '));
  }
}
frStepMoves.push("U", "U'", "U2");

function hashFR(c) {
  const cPos = c.cp.indexOf(4);
  const cOri = c.co[cPos];
  const ePos = c.ep.indexOf(8);
  const eOri = c.eo[ePos];
  return `${cPos}_${cOri}_${ePos}_${eOri}`;
}

const frTable = new Map();
frTable.set('4_0_8_0', []);
{
  const q = [{ cube: new Cube(), path: [] }];
  while (q.length > 0) {
    const curr = q.shift();
    if (curr.path.length >= 3) continue;
    for (const sm of frStepMoves) {
      const next = new Cube(curr.cube);
      sm.split(' ').forEach(m => next.move(m));
      const h = hashFR(next);
      if (!frTable.has(h)) {
        const toSolved = [invertAlg(sm), ...curr.path];
        frTable.set(h, toSolved);
        q.push({ cube: next, path: toSolved });
      }
    }
  }
}

export function solveSecondBlock(cube) {
  const stageMoves = [];
  const apply = (mStr) => {
    mStr.trim().split(/\s+/).filter(Boolean).forEach(m => {
      cube.move(m);
      stageMoves.push(m);
    });
  };

  // 2a: DR edge (edge 4)
  if (!(cube.ep[4] === 4 && cube.eo[4] === 0)) {
    const q = [{ cube: new Cube(cube), path: [], lastFace: null }];
    while (q.length > 0) {
      const curr = q.shift();
      if (curr.path.length >= 6) continue;
      for (const m of SB_MOVES) {
        if (m[0] === curr.lastFace) continue;
        const next = new Cube(curr.cube);
        next.move(m);
        const newPath = [...curr.path, m];
        if (next.ep[4] === 4 && next.eo[4] === 0) {
          apply(newPath.join(' '));
          q.length = 0;
          break;
        }
        if (newPath.length < 5) {
          q.push({ cube: next, path: newPath, lastFace: m[0] });
        }
      }
    }
  }

  // 2b: BR pair
  const isBROk = (c) => c.cp[7] === 7 && c.co[7] === 0 && c.ep[11] === 11 && c.eo[11] === 0;
  if (!isBROk(cube)) {
    if (cube.ep.indexOf(11) === 5) apply("M' U M");
    else if (cube.ep.indexOf(11) === 7) apply("M U M'");

    if (cube.cp.indexOf(7) === 4 || cube.ep.indexOf(11) === 8) {
      apply("R U R'");
      apply("U");
    }

    const h = hashBR(cube);
    if (brTable.has(h)) {
      brTable.get(h).forEach(alg => apply(alg));
    } else {
      apply("R' U' R");
      const h2 = hashBR(cube);
      if (brTable.has(h2)) {
        brTable.get(h2).forEach(alg => apply(alg));
      }
    }
  }

  // 2c: FR pair (preserving BR, DR, FB)
  const isFROk = (c) => c.cp[4] === 4 && c.co[4] === 0 && c.ep[8] === 8 && c.eo[8] === 0;
  if (!isFROk(cube)) {
    if (cube.ep.indexOf(8) === 5) apply("M' U M");
    else if (cube.ep.indexOf(8) === 7) apply("M U M'");

    const h = hashFR(cube);
    if (frTable.has(h)) {
      frTable.get(h).forEach(alg => apply(alg));
    } else {
      apply("R U R' U' R U R'");
      const h2 = hashFR(cube);
      if (frTable.has(h2)) {
        frTable.get(h2).forEach(alg => apply(alg));
      }
    }
  }

  return cancelMoves(stageMoves);
}

// ==========================================
// STAGE 3: CMLL (Corners of Last Layer)
// ==========================================
const sune = "R U R' U R U2 R'";
const antiSune = "R U2 R' U' R U' R'";
const hCase = "R U R' U R U' R' U R U2 R'";
const piCase = "R U2 R' U' R U R' U' R U' R'";
const cornerAlgs = [sune, antiSune, hCase, piCase];

const tPerm = "R U R' U' R' F R2 U' R' U' R U R' F'";
const yPerm = "F R U' R' U' R U R' F' R U R' U' R' F R F'";


export function solveCMLL(cube) {
  const stageMoves = [];
  const apply = (mStr) => {
    mStr.trim().split(/\s+/).filter(Boolean).forEach(m => {
      cube.move(m);
      stageMoves.push(m);
    });
  };

  // 3a: Orient top corners
  const cornersOriented = (c) => [0, 1, 2, 3].every(i => c.co[i] === 0);
  if (!cornersOriented(cube)) {
    let done = false;
    for (const alg of cornerAlgs) {
      for (const u of ["", "U", "U'", "U2"]) {
        const test = new Cube(cube);
        if (u) test.move(u);
        test.move(alg);
        if (cornersOriented(test)) {
          if (u) apply(u);
          apply(alg);
          done = true;
          break;
        }
      }
      if (done) break;
    }

    if (!done) {
      for (const a1 of cornerAlgs) {
        for (const u1 of ["", "U", "U'", "U2"]) {
          for (const a2 of cornerAlgs) {
            for (const u2 of ["", "U", "U'", "U2"]) {
              const test = new Cube(cube);
              if (u1) test.move(u1);
              test.move(a1);
              if (u2) test.move(u2);
              test.move(a2);
              if (cornersOriented(test)) {
                if (u1) apply(u1);
                apply(a1);
                if (u2) apply(u2);
                apply(a2);
                done = true;
                break;
              }
            }
            if (done) break;
          }
          if (done) break;
        }
        if (done) break;
      }
    }
  }

  // 3b: Permute top corners
  const cornersPermuted = (c) => {
    for (let u = 0; u < 4; u++) {
      const test = new Cube(c);
      if (u > 0) Array(u).fill('U').forEach(m => test.move(m));
      if (test.cp[0] === 0 && test.cp[1] === 1 && test.cp[2] === 2 && test.cp[3] === 3) {
        return true;
      }
    }
    return false;
  };

  if (!cornersPermuted(cube)) {
    for (const alg of [tPerm, yPerm]) {
      for (const u of ["", "U", "U'", "U2"]) {
        const test = new Cube(cube);
        if (u) test.move(u);
        test.move(alg);
        if (cornersPermuted(test)) {
          if (u) apply(u);
          apply(alg);
          break;
        }
      }
      if (cornersPermuted(cube)) break;
    }
  }

  // Align top corners
  for (const u of ["", "U", "U'", "U2"]) {
    const test = new Cube(cube);
    if (u) test.move(u);
    if (test.cp[0] === 0 && test.cp[1] === 1 && test.cp[2] === 2 && test.cp[3] === 3) {
      if (u) apply(u);
      break;
    }
  }

  return cancelMoves(stageMoves);
}

// ==========================================
// STAGE 4: LSE (Last Six Edges with M & U)
// ==========================================
function hashLSE(c) {
  return `${c.center[0]}_${c.cp[0]}_${c.ep[0]}_${c.eo[0]}_${c.ep[1]}_${c.eo[1]}_${c.ep[2]}_${c.eo[2]}_${c.ep[3]}_${c.eo[3]}_${c.ep[5]}_${c.eo[5]}_${c.ep[7]}_${c.eo[7]}`;
}

console.log('Building LSE backward table (depth 8)...');
const lseBwdTable = new Map();
lseBwdTable.set(hashLSE(new Cube()), []);

{
  const q = [{ cube: new Cube(), path: [], lastType: null }];
  while (q.length > 0) {
    const curr = q.shift();
    if (curr.path.length >= 8) continue;
    const candidates = curr.lastType === 'M' ? U_MOVES : (curr.lastType === 'U' ? M_MOVES : ALL_MU);
    for (const m of candidates) {
      const next = new Cube(curr.cube);
      next.move(m);
      const h = hashLSE(next);
      const nextType = m[0] === 'M' ? 'M' : 'U';
      const toSolved = [invertMove(m), ...curr.path];

      if (!lseBwdTable.has(h)) {
        lseBwdTable.set(h, toSolved);
        if (toSolved.length < 8) {
          q.push({ cube: next, path: toSolved, lastType: nextType });
        }
      }
    }
  }
}
console.log(`LSE backward table size: ${lseBwdTable.size}`);

export function solveLSE(cube) {
  if (cube.isSolved()) return [];
  const startH = hashLSE(cube);
  if (lseBwdTable.has(startH)) {
    const sol = lseBwdTable.get(startH);
    sol.forEach(m => cube.move(m));
    return cancelMoves(sol);
  }

  const q = [{ cube: new Cube(cube), path: [], lastType: null }];
  while (q.length > 0) {
    const curr = q.shift();
    if (curr.path.length >= 8) continue;
    const candidates = curr.lastType === 'M' ? U_MOVES : (curr.lastType === 'U' ? M_MOVES : ALL_MU);
    for (const m of candidates) {
      const next = new Cube(curr.cube);
      next.move(m);
      const h = hashLSE(next);
      const newPath = [...curr.path, m];
      const nextType = m[0] === 'M' ? 'M' : 'U';

      if (lseBwdTable.has(h)) {
        const full = [...newPath, ...lseBwdTable.get(h)];
        full.forEach(move => cube.move(move));
        return cancelMoves(full);
      }

      if (newPath.length < 8) {
        q.push({ cube: next, path: newPath, lastType: nextType });
      }
    }
  }

  // Fallback: 1-move pre-step if state was depth 16
  for (const m of ALL_MU) {
    const next = new Cube(cube);
    next.move(m);
    const h = hashLSE(next);
    if (lseBwdTable.has(h)) {
      const full = [m, ...lseBwdTable.get(h)];
      full.forEach(move => cube.move(move));
      return cancelMoves(full);
    }
  }

  // 2-move pre-step fallback
  for (const m1 of ALL_MU) {
    const next1 = new Cube(cube);
    next1.move(m1);
    for (const m2 of ALL_MU) {
      const next2 = new Cube(next1);
      next2.move(m2);
      const h = hashLSE(next2);
      if (lseBwdTable.has(h)) {
        const full = [m1, m2, ...lseBwdTable.get(h)];
        full.forEach(move => cube.move(move));
        return cancelMoves(full);
      }
    }
  }

  return [];
}

export class RouxSolver {
  constructor() {
    this.stageNames = [
      'First Block (1x2x3 Left)',
      'Second Block (1x2x3 Right)',
      'CMLL (Corners of Last Layer)',
      'LSE (Last Six Edges with M & U)',
    ];
  }

  solve(faceletStr) {
    const cube = Cube.fromString(faceletStr);
    const stages = [];

    // Stage 1: First Block
    const stage1Moves = solveFirstBlock(cube);
    stages.push({
      stageIndex: 0,
      stageName: this.stageNames[0],
      description: 'Build an intuitive 1x2x3 block on the left side (DL edge, DFL corner/FL edge, DBL corner/BL edge).',
      moves: stage1Moves,
    });

    // Stage 2: Second Block
    const stage2Moves = solveSecondBlock(cube);
    stages.push({
      stageIndex: 1,
      stageName: this.stageNames[1],
      description: 'Build the matching 1x2x3 block on the right side using only r, R, U, and M turns.',
      moves: stage2Moves,
    });

    // Stage 3: CMLL
    const stage3Moves = solveCMLL(cube);
    stages.push({
      stageIndex: 2,
      stageName: this.stageNames[2],
      description: 'Orient and permute all 4 top corners simultaneously while keeping both side blocks intact.',
      moves: stage3Moves,
    });

    // Stage 4: LSE
    const stage4Moves = solveLSE(cube);
    stages.push({
      stageIndex: 3,
      stageName: this.stageNames[3],
      description: 'Finish the remaining 6 edges using exclusively Middle Slice (M) and Top (U) turns.',
      moves: stage4Moves,
    });

    return stages;
  }
}

