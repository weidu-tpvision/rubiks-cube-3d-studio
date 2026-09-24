import { describe, it, expect } from 'vitest';
import { solverService } from '../src/solver/SolverService.js';

describe('Notation & Move Inversion Tests', () => {
  it('correctly inverts 3x3 standard moves', () => {
    expect(solverService.getInverseMove('U')).toBe("U'");
    expect(solverService.getInverseMove("U'")).toBe('U');
    expect(solverService.getInverseMove('U2')).toBe('U2');

    expect(solverService.getInverseMove('R')).toBe("R'");
    expect(solverService.getInverseMove("R'")).toBe('R');
    expect(solverService.getInverseMove('R2')).toBe('R2');

    expect(solverService.getInverseMove('F')).toBe("F'");
    expect(solverService.getInverseMove("F'")).toBe('F');
    expect(solverService.getInverseMove('F2')).toBe('F2');
  });

  it('correctly inverts double turns as themselves', () => {
    ['U2', 'D2', 'L2', 'R2', 'F2', 'B2', 'M2', 'x2', 'y2', 'z2'].forEach(m => {
      expect(solverService.getInverseMove(m)).toBe(m);
    });
  });

  it('correctly inverts slice and wide moves', () => {
    expect(solverService.getInverseMove('Rw')).toBe("Rw'");
    expect(solverService.getInverseMove("Rw'")).toBe('Rw');
    expect(solverService.getInverseMove('2R')).toBe("2R'");
    expect(solverService.getInverseMove("2R'")).toBe('2R');
    expect(solverService.getInverseMove('M')).toBe("M'");
    expect(solverService.getInverseMove("M'")).toBe('M');
  });

  it('correctly inverts Pyraminx tip moves', () => {
    expect(solverService.getInverseMove('u')).toBe("u'");
    expect(solverService.getInverseMove("u'")).toBe('u');
    expect(solverService.getInverseMove('r')).toBe("r'");
    expect(solverService.getInverseMove("r'")).toBe('r');
  });

  it('provides descriptive text for standard and special moves', () => {
    expect(solverService.describeMove('R')).toContain('Right');
    expect(solverService.describeMove("U'")).toContain('Top');
    expect(solverService.describeMove('F2')).toContain('180°');
    expect(solverService.describeMove('u')).toContain('tip');
    expect(solverService.describeMove('Rw')).toContain('layer');
  });
});
