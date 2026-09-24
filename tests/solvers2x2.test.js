import { describe, it, expect } from 'vitest';
import { solver2x2 } from '../src/solver/Solver2x2.js';
import { solverService } from '../src/solver/SolverService.js';
import * as CubeModule from 'cubejs';

const Cube = CubeModule.default || CubeModule;

describe('2x2 Pocket Cube Solving Engines', () => {
  const SOLVED_2X2 = 'UUUURRRRFFFFDDDDLLLLBBBB';

  it('recognizes solved 2x2 state', () => {
    expect(solver2x2.isFaceletsSolved(SOLVED_2X2)).toBe(true);
    const res = solverService.solveFromFaceletString(SOLVED_2X2, 'optimal');
    expect(res.isSolved).toBe(true);
  });

  it('solves 2x2 with Optimal bidirectional BFS (God\'s Algorithm)', () => {
    // Generate a 2x2 facelet string scrambled by R U R' F2 R U' R'
    const cube = new Cube();
    cube.move("R U R' F2 R U' R'");
    const facelet54 = cube.asString();
    const facelet24 = solver2x2.kociembaTo2x2(facelet54);

    const stages = solver2x2.solveOptimal(facelet24);
    expect(stages.length).toBe(1);
    const moves = stages[0].moves;
    expect(moves.length).toBeLessThanOrEqual(11);

    // Verify moves applied solve the cube
    moves.forEach(m => cube.move(m));
    expect(solver2x2.isFaceletsSolved(solver2x2.kociembaTo2x2(cube.asString()))).toBe(true);
  });

  it('solves 2x2 with Beginner Layer-by-Layer method', () => {
    const cube = new Cube();
    cube.move("R U R' F2");
    const facelet24 = solver2x2.kociembaTo2x2(cube.asString());

    const stages = solver2x2.solveBeginner(facelet24);
    expect(stages.length).toBeGreaterThan(0);
    const allMoves = stages.flatMap(s => s.moves);
    allMoves.forEach(m => cube.move(m));
    expect(solver2x2.isFaceletsSolved(solver2x2.kociembaTo2x2(cube.asString()))).toBe(true);
  });

  it('solves 2x2 with Ortega speedcubing method', () => {
    const cube = new Cube();
    cube.move("R U R' U R U2 R'"); // Sune
    const facelet24 = solver2x2.kociembaTo2x2(cube.asString());

    const stages = solver2x2.solveOrtega(facelet24);
    expect(stages.length).toBeGreaterThan(0);
    const allMoves = stages.flatMap(s => s.moves);
    allMoves.forEach(m => cube.move(m));
    expect(solver2x2.isFaceletsSolved(solver2x2.kociembaTo2x2(cube.asString()))).toBe(true);
  });
});
