import { describe, it, expect } from 'vitest';
import * as CubeModule from 'cubejs';
import {
  countInversions,
  validateFaceletString,
  solverService,
} from '../src/solver/SolverService.js';

const Cube = CubeModule.default || CubeModule;

describe('Rubik\'s State Parity & Solvability Validation', () => {
  const SOLVED_3X3 = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
  const SOLVED_2X2 = 'UUUURRRRFFFFDDDDLLLLBBBB';
  const SOLVED_4X4 = 'U'.repeat(16) + 'R'.repeat(16) + 'F'.repeat(16) + 'D'.repeat(16) + 'L'.repeat(16) + 'B'.repeat(16);

  it('validates solved 3x3, 2x2, and 4x4 cubes', () => {
    expect(validateFaceletString(SOLVED_3X3).valid).toBe(true);
    expect(validateFaceletString(SOLVED_2X2).valid).toBe(true);
    expect(validateFaceletString(SOLVED_4X4).valid).toBe(true);
  });

  it('validates a legally scrambled 3x3 cube', () => {
    const cube = new Cube();
    cube.move("R U R' U' F2 D B2 L D2");
    const faceletStr = cube.asString();
    const result = validateFaceletString(faceletStr);
    expect(result.valid).toBe(true);
  });

  it('detects single corner twist parity error', () => {
    const cube = new Cube();
    cube.move("R U R' U'");
    // Twist corner 0 by 120 degrees
    cube.co[0] = (cube.co[0] + 1) % 3;
    const faceletStr = cube.asString();
    const result = validateFaceletString(faceletStr);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Corner twist parity error');
  });

  it('detects single edge flip parity error', () => {
    const cube = new Cube();
    cube.move("R U R' U'");
    // Flip edge 0
    cube.eo[0] = (cube.eo[0] + 1) % 2;
    const faceletStr = cube.asString();
    const result = validateFaceletString(faceletStr);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Edge flip parity error');
  });

  it('detects permutation parity error (single swap of two corners)', () => {
    const cube = new Cube();
    cube.move("R U R' U'");
    // Swap corner 0 and corner 1 without swapping edges
    const tmp = cube.cp[0];
    cube.cp[0] = cube.cp[1];
    cube.cp[1] = tmp;
    const faceletStr = cube.asString();
    const result = validateFaceletString(faceletStr);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Permutation parity error');
  });

  it('detects invalid facelet color distribution', () => {
    // Replace one 'B' with 'F' so F has 10 and B has 8
    const invalidColors = SOLVED_3X3.slice(0, -1) + 'F';
    const result = validateFaceletString(invalidColors);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid 3x3 facelet counts');
  });

  it('detects invalid string lengths', () => {
    expect(validateFaceletString('UUUU').valid).toBe(false);
    expect(validateFaceletString('').valid).toBe(false);
    expect(validateFaceletString(null).valid).toBe(false);
  });

  it('correctly calculates permutation inversions parity', () => {
    // Identity permutation: [0, 1, 2, 3] -> 0 inversions -> even parity (0)
    expect(countInversions([0, 1, 2, 3])).toBe(0);
    // Single swap: [1, 0, 2, 3] -> 1 inversion -> odd parity (1)
    expect(countInversions([1, 0, 2, 3])).toBe(1);
    // Reverse: [3, 2, 1, 0] -> 6 inversions -> even parity (0)
    expect(countInversions([3, 2, 1, 0])).toBe(0);
  });

  it('returns clean error object from solverService when given an invalid state', () => {
    const cube = new Cube();
    cube.co[0] = 1; // single corner twist
    const invalidFacelets = cube.asString();

    const res = solverService.solveFromFaceletString(invalidFacelets, 'kociemba');
    expect(res.error).toBeDefined();
    expect(res.isSolved).toBe(false);
    expect(res.steps).toEqual([]);
    expect(res.rawMoves).toEqual([]);
  });
});
