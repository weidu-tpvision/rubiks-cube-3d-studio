import { describe, it, expect } from 'vitest';
import { solverPyraminx } from '../src/solver/SolverPyraminx.js';

describe('Pyraminx Solving Engines', () => {
  it('detects solved Pyraminx state', () => {
    const solved = [...solverPyraminx.solvedState];
    expect(solverPyraminx.isSolved(solved)).toBe(true);
    const stages = solverPyraminx.solveOptimal(solved);
    expect(stages[0].moves.length).toBe(0);
  });

  it('solves Pyraminx with tip moves and core moves using God\'s algorithm', () => {
    let state = [...solverPyraminx.solvedState];
    const scramble = ['u', 'U', 'R', "U'", "R'"];
    scramble.forEach(m => {
      state = solverPyraminx.applyMove(state, m);
    });

    expect(solverPyraminx.isSolved(state)).toBe(false);

    const stages = solverPyraminx.solveOptimal(state);
    expect(stages.length).toBe(1);
    const moves = stages[0].moves;
    expect(moves.length).toBeGreaterThan(0);

    // Apply solution moves to the scrambled state
    let finalState = [...state];
    moves.forEach(m => {
      finalState = solverPyraminx.applyMove(finalState, m);
    });

    expect(solverPyraminx.isSolved(finalState)).toBe(true);
  });

  it('solves Pyraminx with pedagogical Beginner method', () => {
    let state = [...solverPyraminx.solvedState];
    const scramble = ['r', 'R', 'U', "R'"];
    scramble.forEach(m => {
      state = solverPyraminx.applyMove(state, m);
    });

    const stages = solverPyraminx.solveBeginner(state);
    expect(stages.length).toBeGreaterThan(0);

    let finalState = [...state];
    stages.forEach(st => {
      st.moves.forEach(m => {
        finalState = solverPyraminx.applyMove(finalState, m);
      });
    });

    expect(solverPyraminx.isSolved(finalState)).toBe(true);
  });
});
