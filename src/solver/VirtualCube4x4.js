// VirtualCube4x4.js - Fast headless 4x4 permutation simulation
import { PERMS_4X4 } from './perms4x4.js';

export function getMovePermutations() {
  return PERMS_4X4;
}

export class VirtualCube4x4 {
  constructor(initialFacelets) {
    this.perms = PERMS_4X4;
    if (initialFacelets && initialFacelets.length === 96) {
      this.state = [...initialFacelets];
    } else {
      this.state = [
        ...'U'.repeat(16),
        ...'R'.repeat(16),
        ...'F'.repeat(16),
        ...'D'.repeat(16),
        ...'L'.repeat(16),
        ...'B'.repeat(16),
      ];
    }
    this.moveHistory = [];
  }

  clone() {
    const copy = new VirtualCube4x4(this.asString());
    copy.moveHistory = [...this.moveHistory];
    return copy;
  }

  asString() {
    return this.state.join('');
  }

  twist(moveStr) {
    if (!moveStr) return;
    const moves = moveStr.trim().split(/\s+/).filter(m => m.length > 0);
    for (const m of moves) {
      this.applySingleMove(m);
      this.moveHistory.push(m);
    }
  }

  applySingleMove(m) {
    const isPrime = m.includes("'");
    const isDouble = m.endsWith('2');
    let base = m;
    if (isPrime) base = base.slice(0, -1);
    if (isDouble) base = base.slice(0, -1);

    const p = this.perms[base];
    if (!p) return;

    const times = isDouble ? 2 : (isPrime ? 3 : 1);
    for (let t = 0; t < times; t++) {
      const next = new Array(96);
      for (let i = 0; i < 96; i++) {
        next[p[i]] = this.state[i];
      }
      this.state = next;
    }
  }

  // Check if all 6 centers are solved
  areCentersSolved() {
    const centerIndices = [5, 6, 9, 10];
    const expected = ['U', 'R', 'F', 'D', 'L', 'B'];

    for (let f = 0; f < 6; f++) {
      const offset = f * 16;
      for (const idx of centerIndices) {
        if (this.state[offset + idx] !== expected[f]) return false;
      }
    }
    return true;
  }

  // Check if all 12 dedges are paired
  areDedgesPaired() {
    const edgePairs = [
      // [face1, idx1a, idx1b, face2, idx2a, idx2b]
      [0, 13, 14, 2, 1, 2],    // UF
      [0, 7, 11, 1, 1, 2],     // UR
      [0, 1, 2, 5, 1, 2],      // UB
      [0, 4, 8, 4, 1, 2],      // UL
      [3, 1, 2, 2, 13, 14],   // DF
      [3, 7, 11, 1, 13, 14],  // DR
      [3, 13, 14, 5, 13, 14], // DB
      [3, 4, 8, 4, 13, 14],   // DL
      [2, 7, 11, 1, 4, 8],    // FR
      [2, 4, 8, 4, 7, 11],    // FL
      [5, 4, 8, 1, 7, 11],    // BR
      [5, 7, 11, 4, 4, 8],    // BL
    ];

    for (const [f1, i1a, i1b, f2, i2a, i2b] of edgePairs) {
      const c1a = this.state[f1 * 16 + i1a];
      const c1b = this.state[f1 * 16 + i1b];
      const c2a = this.state[f2 * 16 + i2a];
      const c2b = this.state[f2 * 16 + i2b];

      if (c1a !== c1b || c2a !== c2b) return false;
    }
    return true;
  }

  // Check if cube is in a reduced 3x3 state
  isReducedTo3x3() {
    return this.areCentersSolved() && this.areDedgesPaired();
  }

  // Extract standard 54 facelet string for Kociemba 3x3 solver
  extract3x3String() {
    const mapFace = (offset) => {
      const c = (idx) => this.state[offset + idx];
      return [
        c(0),  c(1),  c(3),
        c(4),  c(5),  c(7),
        c(12), c(13), c(15),
      ].join('');
    };

    return [0, 1, 2, 3, 4, 5].map(f => mapFace(f * 16)).join('');
  }
}
