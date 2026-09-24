// SpeedTimer.js - Professional Speedcubing Timer with WCA 15s Inspection, Stackmat Hold-to-Start & Session Stats
import { cubeAudio } from '../cube/CubeAudio.js';

export class SpeedTimer {
  constructor(options = {}) {
    this.timerEl = options.timerEl || document.getElementById('cube-timer');
    this.pbEl = options.pbEl || document.getElementById('stat-pb');
    this.ao5El = options.ao5El || document.getElementById('stat-ao5');
    this.ao12El = options.ao12El || document.getElementById('stat-ao12');
    this.scrambleEl = options.scrambleEl || document.getElementById('scramble-banner');
    this.inspectionBtn = options.inspectionBtn || document.getElementById('btn-toggle-inspection');

    this.state = 'idle'; // 'idle' | 'holding' | 'ready' | 'inspecting' | 'running'
    this.isInspectionEnabled = false;
    this.holdTimeout = null;
    this.timerInterval = null;
    this.inspectionInterval = null;
    this.startTime = null;
    this.inspectionStartTime = null;
    this.currentScramble = '';

    // Load solves from localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        this.solves = JSON.parse(localStorage.getItem('rubiks_speed_solves') || '[]');
        this.isInspectionEnabled = localStorage.getItem('rubiks_inspection_enabled') === 'true';
      } else {
        this.solves = [];
      }
    } catch (_) {
      this.solves = [];
    }

    this.init();
    this.updateStatsDisplay();
  }

  init() {
    if (!this.timerEl || typeof window === 'undefined') return;

    if (this.inspectionBtn) {
      this.inspectionBtn.classList.toggle('active', this.isInspectionEnabled);
      this.inspectionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleInspection();
      });
    }

    // Keyboard handlers (Spacebar Stackmat emulation)
    let spacePressed = false;

    window.addEventListener('keydown', (e) => {
      // Ignore if typing in an input field or dialog
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (spacePressed) return;
        spacePressed = true;

        if (this.state === 'running') {
          this.stop();
        } else if (this.state === 'inspecting') {
          this.beginHold();
        } else if (this.state === 'idle') {
          this.beginHold();
        }
      } else {
        // Any other key stops the running timer
        if (this.state === 'running') {
          this.stop();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        spacePressed = false;

        if (this.state === 'ready') {
          this.endHoldAndStart();
        } else if (this.state === 'holding') {
          // Released too early
          this.cancelHold();
        }
      }
    });

    // Touch & Mouse click handlers for timer pill
    let touchStartTime = 0;
    this.timerEl.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      touchStartTime = performance.now();
      if (this.state === 'running') {
        this.stop();
      } else if (this.state === 'idle' || this.state === 'inspecting') {
        this.beginHold();
      }
    });

    window.addEventListener('pointerup', () => {
      if (this.state === 'ready') {
        this.endHoldAndStart();
      } else if (this.state === 'holding') {
        this.cancelHold();
      }
    });
  }

  setScramble(scrambleStr) {
    this.currentScramble = scrambleStr;
    if (this.scrambleEl) {
      this.scrambleEl.textContent = scrambleStr;
      this.scrambleEl.classList.remove('hidden');
    }
  }

  toggleInspection() {
    this.isInspectionEnabled = !this.isInspectionEnabled;
    try {
      localStorage.setItem('rubiks_inspection_enabled', String(this.isInspectionEnabled));
    } catch (_) {}
    if (this.inspectionBtn) {
      this.inspectionBtn.classList.toggle('active', this.isInspectionEnabled);
      this.inspectionBtn.title = `WCA 15s Inspection: ${this.isInspectionEnabled ? 'ON' : 'OFF'}`;
    }
  }

  beginHold() {
    this.state = 'holding';
    this.timerEl.classList.add('holding');
    this.timerEl.classList.remove('ready', 'running', 'inspecting');
    this.timerEl.textContent = 'Hold...';

    this.holdTimeout = setTimeout(() => {
      if (this.state === 'holding') {
        this.state = 'ready';
        this.timerEl.classList.remove('holding');
        this.timerEl.classList.add('ready');
        this.timerEl.textContent = 'READY!';
        cubeAudio.playBeep(520, 0.04);
      }
    }, 300);
  }

  cancelHold() {
    if (this.holdTimeout) clearTimeout(this.holdTimeout);
    this.state = 'idle';
    this.timerEl.classList.remove('holding', 'ready');
    if (this.solves.length > 0) {
      this.timerEl.textContent = `${this.solves[this.solves.length - 1].time.toFixed(2)}s`;
    } else {
      this.timerEl.textContent = '0.00s';
    }
  }

  endHoldAndStart() {
    if (this.holdTimeout) clearTimeout(this.holdTimeout);
    this.timerEl.classList.remove('holding', 'ready');

    if (this.state === 'ready') {
      if (this.isInspectionEnabled && this.state !== 'inspecting') {
        this.startInspection();
      } else {
        this.startSolve();
      }
    }
  }

  startInspection() {
    if (this.inspectionInterval) clearInterval(this.inspectionInterval);
    this.state = 'inspecting';
    this.inspectionStartTime = performance.now();
    this.timerEl.classList.add('inspecting');

    let alerted8 = false;
    let alerted12 = false;

    this.inspectionInterval = setInterval(() => {
      const elapsed = (performance.now() - this.inspectionStartTime) / 1000;
      const remaining = Math.max(0, 15 - Math.floor(elapsed));

      if (elapsed >= 8 && !alerted8) {
        alerted8 = true;
        cubeAudio.playBeep(660, 0.08);
      }
      if (elapsed >= 12 && !alerted12) {
        alerted12 = true;
        cubeAudio.playBeep(880, 0.12);
      }

      if (elapsed < 15) {
        this.timerEl.textContent = `${remaining}s`;
      } else if (elapsed < 17) {
        this.timerEl.textContent = '+2s';
      } else {
        this.timerEl.textContent = 'DNF';
      }
    }, 100);
  }

  startSolve() {
    if (this.inspectionInterval) clearInterval(this.inspectionInterval);
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.state = 'running';
    this.startTime = performance.now();
    this.timerEl.classList.remove('inspecting', 'holding', 'ready');
    this.timerEl.classList.add('running');

    cubeAudio.playBeep(880, 0.04);

    this.timerInterval = setInterval(() => {
      const elapsed = (performance.now() - this.startTime) / 1000;
      this.timerEl.textContent = `${elapsed.toFixed(2)}s`;
    }, 25);
  }

  stop() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.inspectionInterval) clearInterval(this.inspectionInterval);

    if (this.state === 'running' && this.startTime) {
      const elapsed = (performance.now() - this.startTime) / 1000;
      this.recordSolve(elapsed);
      cubeAudio.playBeep(1046, 0.08);
    }

    this.state = 'idle';
    this.timerEl.classList.remove('running', 'inspecting', 'holding', 'ready');
  }

  recordSolve(timeSeconds) {
    const solveRecord = {
      id: Date.now(),
      time: parseFloat(timeSeconds.toFixed(2)),
      scramble: this.currentScramble,
      date: new Date().toISOString(),
    };

    this.solves.push(solveRecord);
    try {
      localStorage.setItem('rubiks_speed_solves', JSON.stringify(this.solves));
    } catch (_) {}

    this.updateStatsDisplay();
  }

  getBest() {
    if (this.solves.length === 0) return null;
    return Math.min(...this.solves.map(s => s.time));
  }

  getAo5() {
    if (this.solves.length < 5) return null;
    const last5 = this.solves.slice(-5).map(s => s.time).sort((a, b) => a - b);
    // Discard best and worst, average middle 3
    const sumMiddle3 = last5[1] + last5[2] + last5[3];
    return sumMiddle3 / 3;
  }

  getAo12() {
    if (this.solves.length < 12) return null;
    const last12 = this.solves.slice(-12).map(s => s.time).sort((a, b) => a - b);
    // Discard best and worst, average middle 10
    const sumMiddle10 = last12.slice(1, 11).reduce((acc, v) => acc + v, 0);
    return sumMiddle10 / 10;
  }

  updateStatsDisplay() {
    const pb = this.getBest();
    const ao5 = this.getAo5();
    const ao12 = this.getAo12();

    if (this.pbEl) this.pbEl.textContent = pb !== null ? `${pb.toFixed(2)}s` : '--';
    if (this.ao5El) this.ao5El.textContent = ao5 !== null ? `${ao5.toFixed(2)}s` : '--';
    if (this.ao12El) this.ao12El.textContent = ao12 !== null ? `${ao12.toFixed(2)}s` : '--';
  }

  clearHistory() {
    this.solves = [];
    try {
      localStorage.removeItem('rubiks_speed_solves');
    } catch (_) {}
    this.updateStatsDisplay();
    if (this.timerEl) this.timerEl.textContent = '0.00s';
  }
}
