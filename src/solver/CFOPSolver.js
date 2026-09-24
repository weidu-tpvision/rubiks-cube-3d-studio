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

function invertMove(m) {
  if (m.endsWith('2')) return m;
  if (m.endsWith("'")) return m.slice(0, -1);
  return m + "'";
}

function invertAlg(alg) {
  return alg.trim().split(/\s+/).reverse().map(invertMove).join(' ');
}

// STAGE 1: Cross on D
function hashCross(c) {
  return `${c.ep[4]},${c.eo[4]},${c.ep[5]},${c.eo[5]},${c.ep[6]},${c.eo[6]},${c.ep[7]},${c.eo[7]}`;
}

let crossPruningTable = null;

function getCrossPruningTable() {
  if (crossPruningTable) return crossPruningTable;
  crossPruningTable = new Map();
  crossPruningTable.set('4,0,5,0,6,0,7,0', 0);

  const queue = [new Cube()];
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const d = crossPruningTable.get(hashCross(curr));
    if (d >= 4) continue;
    for (const m of MOVES_18) {
      const next = new Cube(curr);
      next.move(m);
      const h = hashCross(next);
      if (!crossPruningTable.has(h)) {
        crossPruningTable.set(h, d + 1);
        queue.push(next);
      }
    }
  }
  return crossPruningTable;
}

export function solveCross(cube) {
  const isGoal = (c) => c.ep[4] === 4 && c.eo[4] === 0 &&
                        c.ep[5] === 5 && c.eo[5] === 0 &&
                        c.ep[6] === 6 && c.eo[6] === 0 &&
                        c.ep[7] === 7 && c.eo[7] === 0;
  if (isGoal(cube)) return [];

  const pruningTable = getCrossPruningTable();

  function getH(c) {
    const h = hashCross(c);
    if (pruningTable.has(h)) return pruningTable.get(h);
    return 4;
  }

  function search(c, g, bound, path, lastFace) {
    const hVal = getH(c);
    const f = g + hVal;
    if (f > bound) return { min: f, found: null };
    if (isGoal(c)) return { min: f, found: path };

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
  }

  let bound = getH(cube);
  while (bound <= 8) {
    const res = search(cube, 0, bound, [], null);
    if (res.found) {
      res.found.forEach(m => cube.move(m));
      return cancelMoves(res.found);
    }
    bound = res.min;
  }
  return [];
}

// STAGE 2: F2L
const slotDefs = [
  {
    corner: 4, edge: 8,
    triggers: [
      "R U R'", "R U' R'", "R U2 R'",
      "F' U' F", "F' U F", "F' U2 F",
      "R' F R F'", "F R' F' R"
    ],
    pop: "R U R'"
  },
  {
    corner: 5, edge: 9,
    triggers: [
      "F U F'", "F U' F'", "F U2 F'",
      "L' U' L", "L' U L", "L' U2 L",
      "F' L F L'", "L F' L' F"
    ],
    pop: "L' U' L"
  },
  {
    corner: 6, edge: 10,
    triggers: [
      "L U L'", "L U' L'", "L U2 L'",
      "B' U' B", "B' U B", "B' U2 B",
      "L' B L B'", "B L' B' L"
    ],
    pop: "L U L'"
  },
  {
    corner: 7, edge: 11,
    triggers: [
      "B U B'", "B U' B'", "B U2 B'",
      "R' U' R", "R' U R", "R' U2 R",
      "B' R B R'", "R B' R' B"
    ],
    pop: "R' U' R"
  }
];

const slotSolvers = slotDefs.map(def => {
  const stepMoves = [];
  for (const u of ["", "U", "U'", "U2"]) {
    for (const t of def.triggers) {
      stepMoves.push([u, t].filter(Boolean).join(' '));
    }
  }
  stepMoves.push("U", "U'", "U2");

  function hash(c) {
    const cPos = c.cp.indexOf(def.corner);
    const cOri = c.co[cPos];
    const ePos = c.ep.indexOf(def.edge);
    const eOri = c.eo[ePos];
    return `${cPos}_${cOri}_${ePos}_${eOri}`;
  }

  const visited = new Map();
  const solvedH = `${def.corner}_0_${def.edge}_0`;
  visited.set(solvedH, []);

  const queue = [{ cube: new Cube(), path: [] }];
  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr.path.length >= 3) continue;

    for (const sm of stepMoves) {
      const next = new Cube(curr.cube);
      sm.split(' ').forEach(m => next.move(m));
      const h = hash(next);
      if (!visited.has(h)) {
        const toSolved = [invertAlg(sm), ...curr.path];
        visited.set(h, toSolved);
        queue.push({ cube: next, path: toSolved });
      }
    }
  }

  return { def, visited, hash };
});

export function solveF2L(cube) {
  const stageMoves = [];
  const apply = (mStr) => {
    const list = mStr.trim().split(/\s+/).filter(Boolean);
    list.forEach(m => {
      cube.move(m);
      stageMoves.push(m);
    });
  };

  for (let sIdx = 0; sIdx < 4; sIdx++) {
    const { def, visited, hash } = slotSolvers[sIdx];
    if (cube.cp[def.corner] === def.corner && cube.co[def.corner] === 0 &&
        cube.ep[def.edge] === def.edge && cube.eo[def.edge] === 0) {
      continue;
    }

    let popAttempts = 0;
    while (popAttempts < 6 && (
      (cube.cp.indexOf(def.corner) >= 4 && cube.cp.indexOf(def.corner) !== def.corner) ||
      (cube.ep.indexOf(def.edge) >= 8 && cube.ep.indexOf(def.edge) !== def.edge)
    )) {
      const cPos = cube.cp.indexOf(def.corner);
      if (cPos >= 4 && cPos !== def.corner) {
        const s = slotDefs.find(d => d.corner === cPos);
        if (s) {
          apply(s.pop);
          apply('U');
        }
      }
      const ePos = cube.ep.indexOf(def.edge);
      if (ePos >= 8 && ePos !== def.edge) {
        const s = slotDefs.find(d => d.edge === ePos);
        if (s) {
          apply(s.pop);
          apply('U');
        }
      }
      popAttempts++;
    }

    if (cube.cp[def.corner] === def.corner && cube.co[def.corner] === 0 &&
        cube.ep[def.edge] === def.edge && cube.eo[def.edge] === 0) {
      continue;
    }

    const startH = hash(cube);
    if (visited.has(startH)) {
      visited.get(startH).forEach(mStr => apply(mStr));
    } else {
      let solvedSlot = false;
      for (const sm of ["U", "U'", "U2"]) {
        const test = new Cube(cube);
        test.move(sm);
        const h = hash(test);
        if (visited.has(h)) {
          apply(sm);
          visited.get(h).forEach(mStr => apply(mStr));
          solvedSlot = true;
          break;
        }
      }

      if (!solvedSlot) {
        apply(def.pop);
        apply('U');
        const h2 = hash(cube);
        if (visited.has(h2)) {
          visited.get(h2).forEach(mStr => apply(mStr));
        }
      }
    }
  }

  return cancelMoves(stageMoves);
}

// STAGE 3: OLL (2-Look OLL with 7 full corner cases)
const OLL_CORNER_ALGS = [
  "R U R' U R U2 R'", // Sune
  "R U2 R' U' R U' R'", // Anti-Sune
  "R U R' U R U' R' U R U2 R'", // H
  "R U2 R2 U' R2 U' R2 U2 R", // Pi
  "R U2 R' U' R U R' U' R U' R'", // Pi alt
  "R' F' L F R F' L' F", // T
  "R2 D R' U2 R D' R' U2 R'", // U
  "F R' F' r U R U' r'" // L
];

export function solveOLL(cube) {
  const stageMoves = [];
  const apply = (mStr) => {
    const list = mStr.trim().split(/\s+/).filter(Boolean);
    list.forEach(m => {
      cube.move(m);
      stageMoves.push(m);
    });
  };

  // 3a: Orient Edges
  const edgesOriented = (c) => [0, 1, 2, 3].every(idx => c.eo[idx] === 0);
  if (!edgesOriented(cube)) {
    const edgeAlgs = [
      "F R U R' U' F'",
      "F U R U' R' F'",
      "F R U R' U' F' U2 F R U R' U' F'"
    ];
    let solvedEdges = false;
    for (const alg of edgeAlgs) {
      for (const u of ["", "U", "U'", "U2"]) {
        const test = new Cube(cube);
        if (u) test.move(u);
        test.move(alg);
        if (edgesOriented(test)) {
          if (u) apply(u);
          apply(alg);
          solvedEdges = true;
          break;
        }
      }
      if (solvedEdges) break;
    }

    if (!solvedEdges) {
      apply("F R U R' U' F'");
      for (const alg of edgeAlgs) {
        for (const u of ["", "U", "U'", "U2"]) {
          const test = new Cube(cube);
          if (u) test.move(u);
          test.move(alg);
          if (edgesOriented(test)) {
            if (u) apply(u);
            apply(alg);
            solvedEdges = true;
            break;
          }
        }
        if (solvedEdges) break;
      }
    }
  }

  // 3b: Orient Corners
  const cornersOriented = (c) => [0, 1, 2, 3].every(c_idx => c.co[c_idx] === 0);
  if (!cornersOriented(cube)) {
    let solvedCorners = false;
    for (const alg of OLL_CORNER_ALGS) {
      for (const u of ["", "U", "U'", "U2"]) {
        const test = new Cube(cube);
        if (u) test.move(u);
        test.move(alg);
        if (cornersOriented(test)) {
          if (u) apply(u);
          apply(alg);
          solvedCorners = true;
          break;
        }
      }
      if (solvedCorners) break;
    }

    if (!solvedCorners) {
      const sune = "R U R' U R U2 R'";
      apply(sune);
      for (const alg of OLL_CORNER_ALGS) {
        for (const u of ["", "U", "U'", "U2"]) {
          const test = new Cube(cube);
          if (u) test.move(u);
          test.move(alg);
          if (cornersOriented(test)) {
            if (u) apply(u);
            apply(alg);
            solvedCorners = true;
            break;
          }
        }
        if (solvedCorners) break;
      }
    }
  }

  return cancelMoves(stageMoves);
}

// STAGE 4: PLL (1-Look PLL with 2-Look fallback)
const PLL_ALGS = [
  "R2 U R U R' U' R' U' R' U R'", // Ua
  "R U' R U R U R U' R' U' R2", // Ub
  "M2 U M2 U2 M2 U M2", // H
  "M' U M2 U M2 U M' U2 M2", // Z
  "R' F R' B2 R F' R' B2 R2", // Aa
  "R2 B2 R F R' B2 R F' R", // Ab
  "R U R' U' R' F R2 U' R' U' R U R' F'", // T
  "R' U L' U2 R U' R' U2 R L", // Ja
  "R U R' F' R U R' U' R' F R2 U' R'", // Jb
  "R U' R' U' R U R D R' U' R D' R' U2 R'", // Ra
  "R' U2 R U2 R' F R U R' U' R' F' R2", // Rb
  "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R", // F
  "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2", // V
  "F R U' R' U' R U R' F' R U R' U' R' F R F'", // Y
  "R B' R' F R B R' F' R B R' F R B' R' F'", // E
  "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'", // Na
  "R' U R U' R' F' U' F R U R' F R' F' R U' R", // Nb
  "R2 U R' U R' U' R U' R2 D U' R' U R D'", // Ga
  "R' U' R U D' R2 U R' U R U' R U' R2 D", // Gb
  "R2 U' R U' R U R' U R2 D' U R U' R' D", // Gc
  "R U R' U' D R2 U' R U' R' U R' U R2 D'" // Gd
];

export function solvePLL(cube) {
  const stageMoves = [];
  const apply = (mStr) => {
    const list = mStr.trim().split(/\s+/).filter(Boolean);
    list.forEach(m => {
      cube.move(m);
      stageMoves.push(m);
    });
  };

  if (cube.isSolved()) return [];

  // Try 1-look PLL
  let solved = false;
  for (const u1 of ["", "U", "U'", "U2"]) {
    for (const alg of PLL_ALGS) {
      for (const u2 of ["", "U", "U'", "U2"]) {
        const test = new Cube(cube);
        if (u1) test.move(u1);
        test.move(alg);
        if (u2) test.move(u2);
        if (test.isSolved()) {
          if (u1) apply(u1);
          apply(alg);
          if (u2) apply(u2);
          solved = true;
          break;
        }
      }
      if (solved) break;
    }
    if (solved) break;
  }

  // 2-look PLL fallback if 1-look didn't catch it
  if (!solved && !cube.isSolved()) {
    const tPerm = "R U R' U' R' F R2 U' R' U' R U R' F'";
    const yPerm = "F R U' R' U' R U R' F' R U R' U' R' F R F'";
    for (const alg of [tPerm, yPerm]) {
      for (const u of ["", "U", "U'", "U2"]) {
        const test = new Cube(cube);
        if (u) test.move(u);
        test.move(alg);
        const cornersOk = (c) => [0, 1, 2, 3].every(idx => c.cp[idx] === idx);
        if (cornersOk(test)) {
          if (u) apply(u);
          apply(alg);
          break;
        }
      }
    }

    const uaPerm = "R2 U R U R' U' R' U' R' U R'";
    const ubPerm = "R U' R U R U R U' R' U' R2";
    for (const alg of [uaPerm, ubPerm]) {
      for (const u of ["", "U", "U'", "U2"]) {
        const test = new Cube(cube);
        if (u) test.move(u);
        test.move(alg);
        if (test.isSolved()) {
          if (u) apply(u);
          apply(alg);
          break;
        }
      }
      if (cube.isSolved()) break;
    }
  }

  // Final AUF
  for (const u of ["", "U", "U'", "U2"]) {
    const test = new Cube(cube);
    if (u) test.move(u);
    if (test.isSolved()) {
      if (u) apply(u);
      break;
    }
  }

  return cancelMoves(stageMoves);
}

export class CFOPSolver {
  constructor() {
    this.stageNames = [
      'Cross on D (Yellow opposite)',
      'F2L (First Two Layers - 4 Pairs)',
      'OLL (Orientation of the Last Layer)',
      'PLL (Permutation of the Last Layer)',
    ];
  }

  solve(faceletStr) {
    const cube = Cube.fromString(faceletStr);
    const stages = [];

    // Stage 1: Cross
    const stage1Moves = solveCross(cube);
    stages.push({
      stageIndex: 0,
      stageName: this.stageNames[0],
      description: 'Solve the 4 white/bottom cross edges on the D face aligned with center colors.',
      moves: stage1Moves,
    });

    // Stage 2: F2L
    const stage2Moves = solveF2L(cube);
    stages.push({
      stageIndex: 1,
      stageName: this.stageNames[1],
      description: 'Pair up each corner and edge piece and insert all 4 slots into the first two layers.',
      moves: stage2Moves,
    });

    // Stage 3: OLL
    const stage3Moves = solveOLL(cube);
    stages.push({
      stageIndex: 2,
      stageName: this.stageNames[2],
      description: 'Orient all pieces on the top (U) face so the entire top layer color faces upward.',
      moves: stage3Moves,
    });

    // Stage 4: PLL
    const stage4Moves = solvePLL(cube);
    stages.push({
      stageIndex: 3,
      stageName: this.stageNames[3],
      description: 'Permute all pieces in the top layer into their solved spots, completing the cube.',
      moves: stage4Moves,
    });

    return stages;
  }
}

