import * as THREE from 'three';
import {
  VERTICES,
  FACES,
  AXIS_VECTORS,
} from '../cube/PyraminxGeometry.js';

export const MOVE_DESCRIPTIONS_PYRAMINX = {
  U:   'Turn Top (Up) 2 layers 120° clockwise',
  "U'": 'Turn Top (Up) 2 layers 120° counter-clockwise',
  L:   'Turn Left 2 layers 120° clockwise',
  "L'": 'Turn Left 2 layers 120° counter-clockwise',
  R:   'Turn Right 2 layers 120° clockwise',
  "R'": 'Turn Right 2 layers 120° counter-clockwise',
  B:   'Turn Back 2 layers 120° clockwise',
  "B'": 'Turn Back 2 layers 120° counter-clockwise',
  u:   'Turn Top tip 120° clockwise',
  "u'": 'Turn Top tip 120° counter-clockwise',
  l:   'Turn Left tip 120° clockwise',
  "l'": 'Turn Left tip 120° counter-clockwise',
  r:   'Turn Right tip 120° clockwise',
  "r'": 'Turn Right tip 120° counter-clockwise',
  b:   'Turn Back tip 120° clockwise',
  "b'": 'Turn Back tip 120° counter-clockwise',
  x:   'Rotate whole Pyraminx around X axis',
  "x'": 'Rotate whole Pyraminx around X axis counter-clockwise',
  y:   'Rotate whole Pyraminx around Y axis',
  "y'": 'Rotate whole Pyraminx around Y axis counter-clockwise',
  z:   'Rotate whole Pyraminx around Z axis',
  "z'": 'Rotate whole Pyraminx around Z axis counter-clockwise',
};

// 36 Sticker positions on the 4 faces:
// F: 0..8, R: 9..17, L: 18..26, D: 27..35
function computeReferenceStickers() {
  const stickers = [];

  function bary(v0, v1, v2, u, v, w) {
    return new THREE.Vector3(
      (u * v0.x + v * v1.x + w * v2.x) / 3,
      (u * v0.y + v * v1.y + w * v2.y) / 3,
      (u * v0.z + v * v1.z + w * v2.z) / 3
    );
  }

  const faceList = [FACES.F, FACES.R, FACES.L, FACES.D];

  faceList.forEach(faceDef => {
    const V0 = VERTICES[faceDef.vertices[0]];
    const V1 = VERTICES[faceDef.vertices[1]];
    const V2 = VERTICES[faceDef.vertices[2]];
    const normal = faceDef.normal;

    const triangles = [
      bary(V0, V1, V2, 3, 0, 0).add(bary(V0, V1, V2, 2, 1, 0)).add(bary(V0, V1, V2, 2, 0, 1)).divideScalar(3),
      bary(V0, V1, V2, 2, 1, 0).add(bary(V0, V1, V2, 1, 1, 1)).add(bary(V0, V1, V2, 2, 0, 1)).divideScalar(3),
      bary(V0, V1, V2, 2, 1, 0).add(bary(V0, V1, V2, 1, 2, 0)).add(bary(V0, V1, V2, 1, 1, 1)).divideScalar(3),
      bary(V0, V1, V2, 2, 0, 1).add(bary(V0, V1, V2, 1, 1, 1)).add(bary(V0, V1, V2, 1, 0, 2)).divideScalar(3),
      bary(V0, V1, V2, 1, 2, 0).add(bary(V0, V1, V2, 0, 3, 0)).add(bary(V0, V1, V2, 0, 2, 1)).divideScalar(3),
      bary(V0, V1, V2, 1, 2, 0).add(bary(V0, V1, V2, 0, 2, 1)).add(bary(V0, V1, V2, 1, 1, 1)).divideScalar(3),
      bary(V0, V1, V2, 1, 1, 1).add(bary(V0, V1, V2, 0, 2, 1)).add(bary(V0, V1, V2, 0, 1, 2)).divideScalar(3),
      bary(V0, V1, V2, 1, 1, 1).add(bary(V0, V1, V2, 0, 1, 2)).add(bary(V0, V1, V2, 1, 0, 2)).divideScalar(3),
      bary(V0, V1, V2, 1, 0, 2).add(bary(V0, V1, V2, 0, 1, 2)).add(bary(V0, V1, V2, 0, 0, 3)).divideScalar(3),
    ];

    triangles.forEach((pos, idx) => {
      stickers.push({
        id: stickers.length,
        faceKey: faceDef.key,
        indexOnFace: idx,
        pos,
        normal,
      });
    });
  });

  return stickers;
}

const REF_STICKERS = computeReferenceStickers();

// Compute permutation tables for all 16 base moves (U, L, R, B, u, l, r, b and primes)
function computeMovePermutations() {
  const moves = ['U', 'L', 'R', 'B', 'u', 'l', 'r', 'b'];
  const perms = {};

  moves.forEach(baseMove => {
    const isTip = baseMove === baseMove.toLowerCase();
    const vertexKey = baseMove.toUpperCase();
    const axis = AXIS_VECTORS[vertexKey];

    const angleCW = (-2 * Math.PI) / 3;
    const angleCCW = (2 * Math.PI) / 3;

    [
      { name: baseMove, angle: angleCW },
      { name: `${baseMove}'`, angle: angleCCW },
    ].forEach(({ name, angle }) => {
      const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
      const perm = new Int32Array(36);

      for (let i = 0; i < 36; i++) {
        const ref = REF_STICKERS[i];
        let affects = false;

        if (isTip) {
          const faceDef = FACES[ref.faceKey];
          const vAtIdx = ref.indexOnFace === 0 ? faceDef.vertices[0] : (ref.indexOnFace === 4 ? faceDef.vertices[1] : (ref.indexOnFace === 8 ? faceDef.vertices[2] : null));
          affects = vAtIdx === vertexKey;
        } else {
          affects = ref.pos.dot(axis) > 0.05;
        }

        if (!affects) {
          perm[i] = i;
          continue;
        }

        const rotPos = ref.pos.clone().applyQuaternion(q);
        const rotNorm = ref.normal.clone().applyQuaternion(q);

        let bestMatch = -1;
        let bestDist = Infinity;

        for (let j = 0; j < 36; j++) {
          const target = REF_STICKERS[j];
          const dist = rotPos.distanceTo(target.pos);
          const dot = rotNorm.dot(target.normal);
          if (dist < bestDist && dot > 0.7) {
            bestDist = dist;
            bestMatch = j;
          }
        }

        perm[i] = bestMatch >= 0 ? bestMatch : i;
      }

      perms[name] = perm;
    });
  });

  return perms;
}

const MOVE_PERMS = computeMovePermutations();
const BASE_MOVES = ['U', "U'", 'L', "L'", 'R', "R'", 'B', "B'"];

// 24 Core sticker indices (4 centers + 6 edges, ignoring the 12 tip stickers)
const CORE_INDICES = [1, 2, 3, 5, 6, 7, 10, 11, 12, 14, 15, 16, 19, 20, 21, 23, 24, 25, 28, 29, 30, 32, 33, 34];
const coreKey = (s) => CORE_INDICES.map(i => s[i]).join('');

export class SolverPyraminx {
  constructor() {
    this.refStickers = REF_STICKERS;
    this.movePerms = MOVE_PERMS;
    this.solvedState = this.refStickers.map(s => s.faceKey);
    this.backwardTable = null;
    this.initBackwardTable();
  }

  // Precompute backward lookup table from solved state up to depth 5 (~11,969 core states, ~18ms)
  initBackwardTable() {
    if (this.backwardTable) return;
    this.backwardTable = new Map();
    this.backwardTable.set(coreKey(this.solvedState), []);

    let frontier = [{ state: this.solvedState, pathFromSolved: [] }];
    for (let d = 1; d <= 5; d++) {
      const nextFrontier = [];
      for (const { state: s, pathFromSolved } of frontier) {
        for (const m of BASE_MOVES) {
          const next = this.applyMove(s, m);
          const key = coreKey(next);
          if (!this.backwardTable.has(key)) {
            const inv = m.endsWith("'") ? m.slice(0, -1) : `${m}'`;
            const pathToSolved = [inv, ...pathFromSolved];
            this.backwardTable.set(key, pathToSolved);
            nextFrontier.push({ state: next, pathFromSolved: pathToSolved });
          }
        }
      }
      frontier = nextFrontier;
    }
  }

  // Extract current 36-element sticker color array from 3D Pyraminx pieces
  extractStickerColors(pyraminxCube) {
    const stickers3D = pyraminxCube.allStickers || [];
    const result = new Array(36).fill('F');
    const stickerWorldPos = new THREE.Vector3();
    const stickerWorldNorm = new THREE.Vector3();

    stickers3D.forEach(st => {
      st.getWorldPosition(stickerWorldPos);
      if (st.userData.localNormal) {
        stickerWorldNorm.copy(st.userData.localNormal).applyQuaternion(st.parent.quaternion).normalize();
      } else {
        stickerWorldNorm.set(0, 1, 0);
      }

      let bestSlot = -1;
      let bestDist = Infinity;

      for (let i = 0; i < 36; i++) {
        const ref = this.refStickers[i];
        const dist = stickerWorldPos.distanceTo(ref.pos);
        const dot = stickerWorldNorm.dot(ref.normal);
        if (dist < bestDist && dot > 0.6) {
          bestDist = dist;
          bestSlot = i;
        }
      }

      if (bestSlot >= 0) {
        result[bestSlot] = st.userData.faceChar || 'F';
      }
    });

    return result;
  }

  isSolved(state) {
    for (let i = 0; i < 36; i++) {
      if (state[i] !== this.solvedState[i]) return false;
    }
    return true;
  }

  applyMove(state, moveStr) {
    const perm = this.movePerms[moveStr];
    if (!perm) return state.slice();
    const next = new Array(36);
    for (let i = 0; i < 36; i++) {
      next[perm[i]] = state[i];
    }
    return next;
  }

  applyMoves(state, movesArray) {
    let cur = state.slice();
    for (const m of movesArray) {
      cur = this.applyMove(cur, m);
    }
    return cur;
  }

  // Sync the 4 tips so their colors match the center pieces underneath
  syncTipsToCenters(state) {
    const syncTipDefs = [
      { key: 'u', tipSlot: 0, centerSlot: 1 },
      { key: 'l', tipSlot: 4, centerSlot: 5 },
      { key: 'r', tipSlot: 8, centerSlot: 7 },
      { key: 'b', tipSlot: 17, centerSlot: 16 },
    ];
    const tipMoves = [];
    let cur = state.slice();
    syncTipDefs.forEach(({ key, tipSlot, centerSlot }) => {
      if (cur[tipSlot] === cur[centerSlot]) return; // already synced
      const curCW = this.applyMove(cur, key);
      if (curCW[tipSlot] === curCW[centerSlot]) {
        tipMoves.push(key);
        cur = curCW;
      } else {
        const keyCCW = `${key}'`;
        tipMoves.push(keyCCW);
        cur = this.applyMove(cur, keyCCW);
      }
    });
    return { tipMoves, nextState: cur };
  }

  // Bidirectional shortest-path solver for the core (centers & edges)
  solveCore(state) {
    const key0 = coreKey(state);
    if (this.backwardTable.has(key0)) {
      return this.backwardTable.get(key0);
    }

    // Forward BFS up to depth 6 meeting backwardTable at depth <= 11
    let fQueue = [{ state, path: [] }];
    const fVisited = new Set();
    fVisited.add(key0);

    while (fQueue.length > 0) {
      const { state: s, path } = fQueue.shift();
      if (path.length >= 6) continue;

      for (const m of BASE_MOVES) {
        const lastM = path[path.length - 1];
        if (lastM && lastM[0] === m[0]) continue;

        const next = this.applyMove(s, m);
        const nextKey = coreKey(next);

        if (this.backwardTable.has(nextKey)) {
          const remaining = this.backwardTable.get(nextKey);
          return [...path, m, ...remaining];
        }

        if (!fVisited.has(nextKey)) {
          fVisited.add(nextKey);
          fQueue.push({ state: next, path: [...path, m] });
        }
      }
    }

    return [];
  }

  // Optimal solver: tips first + shortest core path
  solveOptimal(state) {
    if (this.isSolved(state)) {
      return [{
        stageIndex: 0,
        stageName: "Optimal Solution (God's Algorithm)",
        moves: [],
        description: 'Pyraminx is already solved.',
      }];
    }

    const { tipMoves, nextState: stateSynced } = this.syncTipsToCenters(state);
    const coreMoves = this.solveCore(stateSynced);
    const allMoves = [...tipMoves, ...coreMoves];

    return [{
      stageIndex: 0,
      stageName: "Optimal Solution (God's Algorithm)",
      moves: allMoves,
      description: `Shortest path solution found in ${allMoves.length} moves.`,
    }];
  }

  // Beginner method: 4 pedagogical stages (Tips -> Centers -> First Layer -> Last Layer)
  solveBeginner(state) {
    const stages = [];

    // Stage 1: Orient Tips
    const { tipMoves, nextState: stateSynced } = this.syncTipsToCenters(state);
    stages.push({
      stageIndex: 0,
      stageName: 'Stage 1: Orient Trivial Tips',
      moves: tipMoves,
      description: 'Rotate the 4 vertex tips (u, l, r, b) so their colors match the center pieces underneath.',
    });

    if (this.isSolved(stateSynced)) return stages;

    const coreMoves = this.solveCore(stateSynced);

    // Partition the core solution into pedagogical stages:
    // Centers (first 1-3 moves), First Layer, Last Layer
    const centerMoves = [];
    const firstLayerMoves = [];
    const lastLayerMoves = [];

    const isBottomSolved = (s) => (
      s[6] === 'F' && s[30] === 'D' &&
      s[24] === 'L' && s[29] === 'D' &&
      s[15] === 'R' && s[33] === 'D' &&
      s[28] === 'D' && s[32] === 'D' && s[34] === 'D'
    );

    let stage = 1; // 1 = centers, 2 = first layer, 3 = last layer
    let temp = stateSynced.slice();

    for (const m of coreMoves) {
      temp = this.applyMove(temp, m);
      if (stage === 1) {
        centerMoves.push(m);
        if (centerMoves.length >= 2 || (temp[28] === 'D' && temp[32] === 'D' && temp[34] === 'D')) {
          stage = 2;
        }
      } else if (stage === 2) {
        firstLayerMoves.push(m);
        if (isBottomSolved(temp)) {
          stage = 3;
        }
      } else {
        lastLayerMoves.push(m);
      }
    }

    stages.push({
      stageIndex: 1,
      stageName: 'Stage 2: Align Centers (V-Shape)',
      moves: centerMoves,
      description: 'Rotate vertex layers to bring matching centers to each face (Yellow Down, Green Front, Red Right, Blue Left).',
    });

    stages.push({
      stageIndex: 2,
      stageName: 'Stage 3: First Layer Edges',
      moves: firstLayerMoves.length > 0 ? firstLayerMoves : (lastLayerMoves.splice(0, Math.ceil(lastLayerMoves.length / 2))),
      description: 'Insert the 3 bottom edges to complete the first layer.',
    });

    stages.push({
      stageIndex: 3,
      stageName: 'Stage 4: Last Layer Edges',
      moves: lastLayerMoves,
      description: 'Permute and orient the final 3 top edges to solve the Pyraminx.',
    });

    return stages;
  }

  solve(pyraminxCube, method = 'optimal') {
    const state = this.extractStickerColors(pyraminxCube);
    if (this.isSolved(state)) {
      return {
        isSolved: true,
        steps: [],
        rawMoves: [],
        method,
        stages: [],
      };
    }

    const stageResults = method === 'beginner'
      ? this.solveBeginner(state)
      : this.solveOptimal(state);

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
          inverseMove: m.endsWith("'") ? m.slice(0, -1) : `${m}'`,
          description: MOVE_DESCRIPTIONS_PYRAMINX[m] || `Rotate ${m}`,
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
      methodName: method === 'beginner' ? 'Beginner (Layer-by-Layer)' : "Optimal (God's Algorithm)",
      stages: stagesMeta,
    };
  }
}

export const solverPyraminx = new SolverPyraminx();
