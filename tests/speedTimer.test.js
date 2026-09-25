import { describe, it, expect, beforeEach } from 'vitest';
import { SpeedTimer } from '../src/ui/SpeedTimer.js';

describe('Speedcubing Timer & Statistics', () => {
  let timer;

  beforeEach(() => {
    // Mock local DOM elements
    const mockEl = {
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      textContent: '',
      addEventListener: () => {},
    };
    timer = new SpeedTimer({
      timerEl: mockEl,
      pbEl: mockEl,
      ao5El: mockEl,
      ao12El: mockEl,
      scrambleEl: mockEl,
      inspectionBtn: mockEl,
    });
    timer.solves = [];
  });

  it('calculates personal best (PB) accurately', () => {
    expect(timer.getBest()).toBeNull();
    timer.solves = [{ time: 14.5 }, { time: 11.2 }, { time: 16.8 }];
    expect(timer.getBest()).toBe(11.2);
  });

  it('calculates Average of 5 (Ao5) by dropping best and worst times', () => {
    expect(timer.getAo5()).toBeNull();
    // 5 solves: 10.0 (best), 12.0, 14.0, 16.0, 20.0 (worst)
    // Middle 3: 12.0 + 14.0 + 16.0 = 42.0 / 3 = 14.0
    timer.solves = [
      { time: 12.0 },
      { time: 10.0 },
      { time: 20.0 },
      { time: 14.0 },
      { time: 16.0 },
    ];
    expect(timer.getAo5()).toBe(14.0);
  });

  it('calculates Average of 12 (Ao12) correctly according to WCA regulations', () => {
    expect(timer.getAo12()).toBeNull();
    // 12 solves: 1 to 12
    // Best: 1, Worst: 12
    // Middle 10: 2..11 -> sum = 65, average = 6.5
    timer.solves = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(t => ({ time: t }));
    expect(timer.getAo12()).toBe(6.5);
  });

  it('correctly toggles inspection mode state', () => {
    const initial = timer.isInspectionEnabled;
    timer.toggleInspection();
    expect(timer.isInspectionEnabled).toBe(!initial);
    timer.toggleInspection();
    expect(timer.isInspectionEnabled).toBe(initial);
  });

  it('resets timer state and stops intervals cleanly', () => {
    timer.state = 'running';
    timer.timerInterval = 12345;
    timer.inspectionInterval = 54321;
    timer.solves = [{ time: 14.5 }];
    timer.reset();
    expect(timer.state).toBe('idle');
    expect(timer.timerEl.textContent).toBe('0.00s');
  });

  it('clears solve history and resets stats display', () => {
    timer.solves = [{ time: 10.5 }, { time: 12.3 }];
    timer.clearHistory();
    expect(timer.solves).toEqual([]);
    expect(timer.getBest()).toBeNull();
  });
});
