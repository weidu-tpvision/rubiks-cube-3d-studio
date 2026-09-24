import * as CubeModule from 'cubejs';

const Cube = CubeModule.default || CubeModule;

// Move cancellation utility
export function cancelMoves(moves) {
  const moveVal = {
    U: 1, "U'": 3, U2: 2,
    D: 1, "D'": 3, D2: 2,
    F: 1, "F'": 3, F2: 2,
    B: 1, "B'": 3, B2: 2,
    R: 1, "R'": 3, R2: 2,
    L: 1, "L'": 3, L2: 2,
  };
  const valToMove = {
    U: ['', 'U', 'U2', "U'"],
    D: ['', 'D', 'D2', "D'"],
    F: ['', 'F', 'F2', "F'"],
    B: ['', 'B', 'B2', "B'"],
    R: ['', 'R', 'R2', "R'"],
    L: ['', 'L', 'L2', "L'"],
  };

  const stack = [];
  for (const m of moves) {
    if (!m) continue;
    if (stack.length === 0) {
      stack.push(m);
      continue;
    }
    const prev = stack[stack.length - 1];
    if (prev[0] === m[0]) {
      const face = prev[0];
      const sum = (moveVal[prev] + moveVal[m]) % 4;
      stack.pop();
      const combined = valToMove[face][sum];
      if (combined) stack.push(combined);
    } else {
      stack.push(m);
    }
  }
  return stack;
}

const MOVES_18 = ['U', "U'", 'U2', 'D', "D'", 'D2', 'F', "F'", 'F2', 'B', "B'", 'B2', 'L', "L'", 'L2', 'R', "R'", 'R2'];

function hashCross(c) {
  return `${c.ep[0]},${c.eo[0]},${c.ep[1]},${c.eo[1]},${c.ep[2]},${c.eo[2]},${c.ep[3]},${c.eo[3]}`;
}

const SOLVED_CROSS_HASH = '0,0,1,0,2,0,3,0';

// Global pruning table for Cross IDA* (depth <= 4)
let crossPruningTable = null;

function getCrossPruningTable() {
  if (crossPruningTable) return crossPruningTable;
  crossPruningTable = new Map();
  crossPruningTable.set(SOLVED_CROSS_HASH, 0);

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

// Stage 6: Precomputed Niklas permutations with true inverses
let cpSolveTable = null;

function getCpSolveTable() {
  if (cpSolveTable) return cpSolveTable;
  cpSolveTable = new Map();
  cpSolveTable.set('4,5,6,7', []);

  const n1 = "D R D' L' D R' D' L";
  const inv1 = "L' D R D' L D R' D'";
  const n2 = "D F D' B' D F' D' B";
  const inv2 = "B' D F D' B D F' D'";

  const niklasPairs = [
    { fwd: n1, inv: inv1 },
    { fwd: inv1, inv: n1 },
    { fwd: n2, inv: inv2 },
    { fwd: inv2, inv: n2 },
  ];

  const q = [{ cube: new Cube(), path: [] }];
  let qHead = 0;
  while (qHead < q.length) {
    const curr = q[qHead++];
    if (curr.path.length >= 3) continue;
    for (const { fwd, inv } of niklasPairs) {
      const next = new Cube(curr.cube);
      fwd.split(' ').forEach(m => next.move(m));
      const h = `${next.cp[4]},${next.cp[5]},${next.cp[6]},${next.cp[7]}`;
      if (!cpSolveTable.has(h)) {
        const toSolved = [inv, ...curr.path];
        cpSolveTable.set(h, toSolved);
        q.push({ cube: next, path: toSolved });
      }
    }
  }
  return cpSolveTable;
}

export class BeginnerSolver {
  constructor() {
    this.stageNames = [
      'White Cross (Layer 1)',
      'First Layer White Corners (Layer 1 Complete)',
      'Second Layer Middle Edges (Layer 2 Complete)',
      'Yellow Cross (Layer 3)',
      'Align Yellow Edges (Layer 3)',
      'Position Yellow Corners (Layer 3)',
      'Orient Yellow Corners (Solved!)',
    ];
  }

  solve(faceletStr) {
    const cube = Cube.fromString(faceletStr);
    const stages = [];

    // Stage 1: White Cross on U
    const s1Moves = this.solveWhiteCross(cube);
    stages.push({
      stageIndex: 0,
      stageName: this.stageNames[0],
      description: 'Form the White Cross on the top layer matching lateral center colors.',
      moves: s1Moves,
    });

    // Stage 2: First Layer White Corners on U (Layer 1 complete)
    const s2Moves = this.solveWhiteCorners(cube);
    stages.push({
      stageIndex: 1,
      stageName: this.stageNames[1],
      description: 'Insert the 4 white corners into the top layer using direct 3-to-7 move human insertions. Layer 1 is completely solved.',
      moves: s2Moves,
    });

    // Stage 3: Second Layer Middle Edges (Layer 2 complete)
    const s3Moves = this.solveMiddleEdges(cube);
    stages.push({
      stageIndex: 2,
      stageName: this.stageNames[2],
      description: 'Insert the 4 middle-layer edges using the Left and Right Insert algorithms. Layer 2 is completely solved.',
      moves: s3Moves,
    });

    // Stage 4: Yellow Cross on D
    const s4Moves = this.solveYellowCross(cube);
    stages.push({
      stageIndex: 3,
      stageName: this.stageNames[3],
      description: 'Orient the bottom yellow edges into a cross on the yellow face using F D L D\' L\' F\'.',
      moves: s4Moves,
    });

    // Stage 5: Align Yellow Edges
    const s5Moves = this.alignYellowEdges(cube);
    stages.push({
      stageIndex: 4,
      stageName: this.stageNames[4],
      description: 'Permute the yellow edges to match their lateral center colors using Sune (R D R\' D R D2 R\').',
      moves: s5Moves,
    });

    // Stage 6: Position Yellow Corners
    const s6Moves = this.positionYellowCorners(cube);
    stages.push({
      stageIndex: 5,
      stageName: this.stageNames[5],
      description: 'Position the 4 yellow corners into their correct slots using Niklas (D R D\' L\' D R\' D\' L).',
      moves: s6Moves,
    });

    // Stage 7: Orient Yellow Corners
    const s7Moves = this.orientYellowCorners(cube);
    stages.push({
      stageIndex: 6,
      stageName: this.stageNames[6],
      description: 'Twist the 4 yellow corners with corner-twist commutators to complete the third layer and solve the cube!',
      moves: s7Moves,
    });

    return stages;
  }

  // --- STAGE 1: White Cross on Top Layer (U face) ---
  solveWhiteCross(cube) {
    const isGoal = (c) => c.ep[0] === 0 && c.eo[0] === 0 &&
                          c.ep[1] === 1 && c.eo[1] === 0 &&
                          c.ep[2] === 2 && c.eo[2] === 0 &&
                          c.ep[3] === 3 && c.eo[3] === 0;

    if (isGoal(cube)) return [];

    const pTable = getCrossPruningTable();

    function getH(c) {
      const h = hashCross(c);
      if (pTable.has(h)) return pTable.get(h);
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

  // --- STAGE 2: First Layer White Corners on Top Layer (U face) ---
  solveWhiteCorners(cube) {
    const stageMoves = [];
    const apply = (mStr) => {
      const list = mStr.trim().split(/\s+/).filter(Boolean);
      list.forEach(m => {
        cube.move(m);
        stageMoves.push(m);
      });
    };

    const popMoves = [
      "R' D' R", // Slot 0 (URF)
      "F' D' F", // Slot 1 (UFL)
      "L' D' L", // Slot 2 (ULB)
      "B' D' B", // Slot 3 (UBR)
    ];

    for (let target = 0; target < 4; target++) {
      if (cube.cp[target] === target && cube.co[target] === 0) continue;

      let currPos = cube.cp.indexOf(target);
      // If trapped in U layer (0..3):
      if (currPos < 4) {
        apply(popMoves[currPos]);
        currPos = cube.cp.indexOf(target);
      }

      // Rotate D until directly below target slot (target + 4):
      while (cube.cp.indexOf(target) !== target + 4) {
        apply('D');
      }

      // Exact human corner orientation check:
      const s = cube.asString();
      let insertAlg = "R' D' R D";
      if (target === 0) {
        if (s[15] === 'U') insertAlg = "R' D' R";
        else if (s[26] === 'U') insertAlg = "F D F'";
        else if (s[29] === 'U') insertAlg = "R' D2 R D R' D' R";
      } else if (target === 1) {
        if (s[24] === 'U') insertAlg = "F' D' F";
        else if (s[44] === 'U') insertAlg = "L D L'";
        else if (s[27] === 'U') insertAlg = "F' D2 F D F' D' F";
      } else if (target === 2) {
        if (s[42] === 'U') insertAlg = "L' D' L";
        else if (s[53] === 'U') insertAlg = "B D B'";
        else if (s[33] === 'U') insertAlg = "L' D2 L D L' D' L";
      } else if (target === 3) {
        if (s[51] === 'U') insertAlg = "B' D' B";
        else if (s[17] === 'U') insertAlg = "R D R'";
        else if (s[35] === 'U') insertAlg = "B' D2 B D B' D' B";
      }

      apply(insertAlg);
    }

    return cancelMoves(stageMoves);
  }

  // --- STAGE 3: Second Layer Middle Edges ---
  solveMiddleEdges(cube) {
    const stageMoves = [];
    const apply = (mStr) => {
      const list = mStr.trim().split(/\s+/).filter(Boolean);
      list.forEach(m => {
        cube.move(m);
        stageMoves.push(m);
      });
    };

    const slotData = {
      8:  { pop: "D2 F D' F' D' R' D R", alg1: "D2 F D' F' D' R' D R", alg2: "D' R' D R D F D' F'" },
      9:  { pop: "D2 F' D F D L D' L'", alg1: "D2 F' D F D L D' L'", alg2: "D L D' L' D' F' D F" },
      10: { pop: "D2 B D' B' D' L' D L", alg1: "D2 B D' B' D' L' D L", alg2: "D' L' D L D B D' B'" },
      11: { pop: "D2 B' D B D R D' R'", alg1: "D2 B' D B D R D' R'", alg2: "D R D' R' D' B' D B" },
    };

    for (let loop = 0; loop < 8; loop++) {
      const unsolved = [8, 9, 10, 11].filter(e => !(cube.ep[e] === e && cube.eo[e] === 0));
      if (unsolved.length === 0) break;

      // Prioritize edges currently in the D layer
      const inD = unsolved.find(e => cube.ep.indexOf(e) < 8);
      let target = inD;

      if (!target) {
        target = unsolved[0];
        const pos = cube.ep.indexOf(target);
        apply(slotData[pos].pop);
      }

      let solved = false;
      for (let d = 0; d < 4; d++) {
        for (const alg of [slotData[target].alg1, slotData[target].alg2]) {
          const testCube = new Cube(cube);
          const seq = (d > 0 ? Array(d).fill('D').join(' ') + ' ' : '') + alg;
          seq.trim().split(/\s+/).forEach(m => testCube.move(m));
          if (testCube.ep[target] === target && testCube.eo[target] === 0) {
            apply(seq);
            solved = true;
            break;
          }
        }
        if (solved) break;
      }
    }

    return cancelMoves(stageMoves);
  }

  // --- STAGE 4: Yellow Cross on Bottom (D face) ---
  solveYellowCross(cube) {
    const stageMoves = [];
    const apply = (mStr) => {
      const list = mStr.trim().split(/\s+/).filter(Boolean);
      list.forEach(m => {
        cube.move(m);
        stageMoves.push(m);
      });
    };

    const isCross = (c) => c.eo[4] === 0 && c.eo[5] === 0 && c.eo[6] === 0 && c.eo[7] === 0;
    if (isCross(cube)) return [];

    const alg = "F D L D' L' F'";

    for (let attempt = 0; attempt < 6; attempt++) {
      if (isCross(cube)) break;

      let bestD = -1;
      for (let d = 0; d < 4; d++) {
        const test = new Cube(cube);
        if (d > 0) Array(d).fill('D').forEach(m => test.move(m));
        test.move(alg);
        if (isCross(test)) {
          bestD = d;
          break;
        }
      }

      if (bestD !== -1) {
        if (bestD > 0) apply(Array(bestD).fill('D').join(' '));
        apply(alg);
        break;
      }

      const currentCount = [4, 5, 6, 7].filter(e => cube.eo[e] === 0).length;
      let chosenD = 0;
      for (let d = 0; d < 4; d++) {
        const test = new Cube(cube);
        if (d > 0) Array(d).fill('D').forEach(m => test.move(m));
        test.move(alg);
        const cnt = [4, 5, 6, 7].filter(e => test.eo[e] === 0).length;
        if (cnt > currentCount) {
          chosenD = d;
          break;
        }
      }
      if (chosenD > 0) apply(Array(chosenD).fill('D').join(' '));
      apply(alg);
    }

    return cancelMoves(stageMoves);
  }

  // --- STAGE 5: Align Yellow Edges on Bottom (D face) ---
  alignYellowEdges(cube) {
    const stageMoves = [];
    const apply = (mStr) => {
      const list = mStr.trim().split(/\s+/).filter(Boolean);
      list.forEach(m => {
        cube.move(m);
        stageMoves.push(m);
      });
    };

    const isAligned = (c) => c.ep[4] === 4 && c.ep[5] === 5 && c.ep[6] === 6 && c.ep[7] === 7;

    for (let d = 0; d < 4; d++) {
      const test = new Cube(cube);
      if (d > 0) Array(d).fill('D').forEach(m => test.move(m));
      if (isAligned(test)) {
        if (d > 0) apply(Array(d).fill('D').join(' '));
        return cancelMoves(stageMoves);
      }
    }

    const sunePool = [
      "R D R' D R D2 R'",
      "F D F' D F D2 F'",
      "L D L' D L D2 L'",
      "B D B' D B D2 B'",
      "R' D' R D' R' D2 R",
      "F' D' F D' F' D2 F",
      "L' D' L D' L' D2 L",
      "B' D' B D' B' D2 B",
    ];

    for (const sune of sunePool) {
      for (let dPre = 0; dPre < 4; dPre++) {
        const test = new Cube(cube);
        if (dPre > 0) Array(dPre).fill('D').forEach(m => test.move(m));
        sune.split(' ').forEach(m => test.move(m));
        for (let dPost = 0; dPost < 4; dPost++) {
          const check = new Cube(test);
          if (dPost > 0) Array(dPost).fill('D').forEach(m => check.move(m));
          if (isAligned(check)) {
            if (dPre > 0) apply(Array(dPre).fill('D').join(' '));
            apply(sune);
            if (dPost > 0) apply(Array(dPost).fill('D').join(' '));
            return cancelMoves(stageMoves);
          }
        }
      }
    }

    for (const s1 of sunePool) {
      for (const s2 of sunePool) {
        const test = new Cube(cube);
        s1.split(' ').forEach(m => test.move(m));
        s2.split(' ').forEach(m => test.move(m));
        for (let d = 0; d < 4; d++) {
          const check = new Cube(test);
          if (d > 0) Array(d).fill('D').forEach(m => check.move(m));
          if (isAligned(check)) {
            apply(s1);
            apply(s2);
            if (d > 0) apply(Array(d).fill('D').join(' '));
            return cancelMoves(stageMoves);
          }
        }
      }
    }

    return cancelMoves(stageMoves);
  }

  // --- STAGE 6: Position Yellow Corners on Bottom (D face) ---
  positionYellowCorners(cube) {
    const stageMoves = [];
    const apply = (mStr) => {
      const list = mStr.trim().split(/\s+/).filter(Boolean);
      list.forEach(m => {
        cube.move(m);
        stageMoves.push(m);
      });
    };

    const h = `${cube.cp[4]},${cube.cp[5]},${cube.cp[6]},${cube.cp[7]}`;
    const table = getCpSolveTable();
    if (table.has(h)) {
      const movesList = table.get(h);
      movesList.forEach(alg => apply(alg));
    }

    return cancelMoves(stageMoves);
  }

  // --- STAGE 7: Orient Yellow Corners (Solved!) ---
  orientYellowCorners(cube) {
    const stageMoves = [];
    const apply = (mStr) => {
      const list = mStr.trim().split(/\s+/).filter(Boolean);
      list.forEach(m => {
        cube.move(m);
        stageMoves.push(m);
      });
    };

    const isSolved = (c) => c.co[4] === 0 && c.co[5] === 0 && c.co[6] === 0 && c.co[7] === 0;
    if (isSolved(cube)) return [];

    const T1 = "R D R' D R D2 R' L' D' L D' L' D2 L";
    const T2 = "L' D' L D' L' D2 L R D R' D R D2 R'";
    const twistMoves = [];
    for (const t of [T1, T2]) {
      for (let d = 0; d < 4; d++) {
        const dPre = d === 1 ? 'D' : (d === 2 ? 'D2' : (d === 3 ? "D'" : ''));
        const dPost = d === 1 ? "D'" : (d === 2 ? 'D2' : (d === 3 ? 'D' : ''));
        const full = [dPre, t, dPost].filter(Boolean).join(' ');
        twistMoves.push(full);
      }
    }

    const q = [{ cube: new Cube(cube), path: [] }];
    while (q.length > 0) {
      const curr = q.shift();
      if (curr.path.length >= 3) continue;
      for (const tm of twistMoves) {
        const next = new Cube(curr.cube);
        tm.split(' ').forEach(m => next.move(m));
        const newPath = [...curr.path, tm];
        if (isSolved(next)) {
          newPath.forEach(alg => apply(alg));
          return cancelMoves(stageMoves);
        }
        q.push({ cube: next, path: newPath });
      }
    }

    return cancelMoves(stageMoves);
  }
}
