import { describe, it, expect, beforeAll } from 'vitest';
import { solver4x4 } from '../src/solver/Solver4x4.js';
import { solverService } from '../src/solver/SolverService.js';
import { VirtualCube4x4 } from '../src/solver/VirtualCube4x4.js';

describe('4x4 Rubik\'s Revenge Solvers', () => {
  const SOLVED_4X4 = 'U'.repeat(16) + 'R'.repeat(16) + 'F'.repeat(16) + 'D'.repeat(16) + 'L'.repeat(16) + 'B'.repeat(16);

  beforeAll(async () => {
    await solverService.init();
  });

  it('detects solved 4x4 facelet string', () => {
    expect(solver4x4.isFaceletsSolved(SOLVED_4X4)).toBe(true);
    const res = solverService.solveFromFaceletString(SOLVED_4X4, 'reduction');
    expect(res.isSolved).toBe(true);
  });

  it('provides OLL parity fix sequence', () => {
    const res = solver4x4.solveOLLParity();
    expect(res.rawMoves.length).toBe(15);
    expect(res.stages[0].stageName).toBe('OLL Parity Fix');
    expect(res.rawMoves).toContain("2R'");
    expect(res.rawMoves).toContain('2L');
  });

  it('provides PLL parity fix sequence', () => {
    const res = solver4x4.solvePLLParity();
    expect(res.rawMoves.length).toBe(6);
    expect(res.rawMoves).toEqual(['2R2', 'U2', '2R2', 'Uw2', '2R2', '2U2']);
  });

  it('solves 4x4 using VirtualCube4x4 and reduction method', () => {
    const vc = new VirtualCube4x4();
    const scramble = ['R', 'U', "R'", 'F'];
    vc.twist(scramble.join(' '));

    const faceletStr = vc.asString();
    const res = solver4x4.solveReduction(faceletStr, { moveHistory: scramble });
    expect(res.error).toBeUndefined();
    expect(res.rawMoves.length).toBeGreaterThan(0);
  });
});
