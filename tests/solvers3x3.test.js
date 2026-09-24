import { describe, it, expect, beforeAll } from 'vitest';
import * as CubeModule from 'cubejs';
import { solverService } from '../src/solver/SolverService.js';

const Cube = CubeModule.default || CubeModule;

describe('3x3 Solving Engines', () => {
  const SOLVED_3X3 = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

  beforeAll(async () => {
    await solverService.init();
  }, 10000);

  it('handles already solved 3x3 cube immediately', () => {
    const res = solverService.solveFromFaceletString(SOLVED_3X3, 'kociemba');
    expect(res.isSolved).toBe(true);
    expect(res.steps.length).toBe(0);
    expect(res.rawMoves.length).toBe(0);
  });

  it('solves 3x3 with Kociemba optimal two-phase algorithm', () => {
    const cube = new Cube();
    const scramble = "R U R' U' F2 D B2 L";
    cube.move(scramble);
    const faceletStr = cube.asString();

    const res = solverService.solveFromFaceletString(faceletStr, 'kociemba');
    expect(res.error).toBeUndefined();
    expect(res.isSolved).toBe(false);
    expect(res.rawMoves.length).toBeGreaterThan(0);
    expect(res.stages.length).toBe(1);

    // Apply solution to the scrambled cube
    const testCube = new Cube();
    testCube.move(scramble);
    res.rawMoves.forEach(m => testCube.move(m));
    expect(testCube.isSolved()).toBe(true);
  });

  it('solves 3x3 with Beginner Layer-by-Layer method', () => {
    const cube = new Cube();
    const scramble = "R U R' U' F2 D";
    cube.move(scramble);
    const faceletStr = cube.asString();

    const res = solverService.solveFromFaceletString(faceletStr, 'beginner');
    expect(res.error).toBeUndefined();
    expect(res.rawMoves.length).toBeGreaterThan(0);
    expect(res.stages.length).toBeGreaterThanOrEqual(1);

    const testCube = new Cube();
    testCube.move(scramble);
    res.rawMoves.forEach(m => testCube.move(m));
    expect(testCube.isSolved()).toBe(true);
  });

  it('solves 3x3 with CFOP (Fridrich) method', () => {
    const cube = new Cube();
    // Use a moderate scramble
    const scramble = "R U R' U' F' U F";
    cube.move(scramble);
    const faceletStr = cube.asString();

    const res = solverService.solveFromFaceletString(faceletStr, 'cfop');
    expect(res.error).toBeUndefined();
    expect(res.rawMoves.length).toBeGreaterThan(0);
    expect(res.stages.length).toBeGreaterThanOrEqual(1);

    const testCube = new Cube();
    testCube.move(scramble);
    res.rawMoves.forEach(m => testCube.move(m));
    expect(testCube.isSolved()).toBe(true);
  });

  it('solves 3x3 with Roux block-building method', () => {
    const cube = new Cube();
    const scramble = "M' U M U2 M2";
    cube.move(scramble);
    const faceletStr = cube.asString();

    const res = solverService.solveFromFaceletString(faceletStr, 'roux');
    expect(res.error).toBeUndefined();
    expect(res.rawMoves.length).toBeGreaterThan(0);

    const testCube = new Cube();
    testCube.move(scramble);
    res.rawMoves.forEach(m => testCube.move(m));
    expect(testCube.isSolved()).toBe(true);
  });
});
