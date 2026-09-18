import { solverService } from '../solver/SolverService.js';

export class ControlsUI {
  constructor(rubiksCube, camera, orbitControls, stepPlayer, options = {}) {
    this.cube = rubiksCube;
    this.camera = camera;
    this.controls = orbitControls;
    this.player = stepPlayer;
    this.interaction = options.interaction || null;
    this.onOpenTutorial = options.onOpenTutorial || null;

    this.primeActive = false;
    this.doubleActive = false;
    this.selectedMethod = 'kociemba';

    this.timerInterval = null;
    this.timerStartTime = null;
    this.isTimerRunning = false;

    this.initControls();
    this.initTimer();
  }

  initControls() {
    // Top Bar Actions
    document.getElementById('btn-scramble')?.addEventListener('click', () => this.scramble());
    document.getElementById('btn-reset')?.addEventListener('click', () => this.resetCube());
    document.getElementById('btn-solve-step')?.addEventListener('click', () => this.startStepByStepSolve());

    // Solve Method Dropdown
    const solveMenuBtn = document.getElementById('btn-solve-menu');
    const solveMenu = document.getElementById('solve-method-menu');
    const solveLabel = document.getElementById('btn-solve-label');

    solveMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      solveMenu?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.solve-dropdown-container')) {
        solveMenu?.classList.add('hidden');
      }
    });

    const methodLabels = {
      kociemba: 'Solve: Optimal',
      beginner: 'Solve: Beginner',
      cfop: 'Solve: CFOP',
      roux: 'Solve: Roux',
    };

    document.querySelectorAll('.method-option[data-method]').forEach(btn => {
      btn.addEventListener('click', () => {
        const method = btn.dataset.method;
        this.selectedMethod = method;

        document.querySelectorAll('.method-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (solveLabel) {
          solveLabel.textContent = methodLabels[method] || 'Solve Step-by-Step';
        }

        solveMenu?.classList.add('hidden');
        this.startStepByStepSolve();
      });
    });

    document.getElementById('btn-tutorial')?.addEventListener('click', () => {
      if (this.onOpenTutorial) this.onOpenTutorial();
    });
    document.getElementById('btn-reset-cam')?.addEventListener('click', () => this.resetCamera());

    // Move Pad Modifier Toggles
    const primeToggle = document.getElementById('mod-prime');
    const doubleToggle = document.getElementById('mod-double');

    primeToggle?.addEventListener('click', () => {
      this.primeActive = !this.primeActive;
      primeToggle.classList.toggle('active', this.primeActive);
      if (this.primeActive && this.doubleActive) {
        this.doubleActive = false;
        doubleToggle?.classList.remove('active');
      }
    });

    doubleToggle?.addEventListener('click', () => {
      this.doubleActive = !this.doubleActive;
      doubleToggle.classList.toggle('active', this.doubleActive);
      if (this.doubleActive && this.primeActive) {
        this.primeActive = false;
        primeToggle?.classList.remove('active');
      }
    });

    // Face Move Buttons
    document.querySelectorAll('.move-btn[data-move]').forEach(btn => {
      btn.addEventListener('click', () => {
        const baseMove = btn.dataset.move;
        let finalMove = baseMove;
        if (this.primeActive) finalMove += "'";
        if (this.doubleActive) finalMove += '2';

        this.cube.twist(finalMove);

        // Reset modifiers after click
        if (this.primeActive) {
          this.primeActive = false;
          primeToggle?.classList.remove('active');
        }
        if (this.doubleActive) {
          this.doubleActive = false;
          doubleToggle?.classList.remove('active');
        }
      });
    });

    // Cube Rotation Buttons (X, Y, Z)
    document.querySelectorAll('.rot-btn[data-rot]').forEach(btn => {
      btn.addEventListener('click', () => {
        const baseRot = btn.dataset.rot;
        let finalRot = baseRot;
        if (this.primeActive) finalRot += "'";
        this.cube.twist(finalRot);
      });
    });
  }

  generateScramble(length = 20) {
    const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
    const modifiers = ['', "'", '2'];
    const moves = [];
    let lastFace = '';

    for (let i = 0; i < length; i++) {
      let face = faces[Math.floor(Math.random() * faces.length)];
      while (face === lastFace) {
        face = faces[Math.floor(Math.random() * faces.length)];
      }
      lastFace = face;
      const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
      moves.push(face + mod);
    }
    return moves.join(' ');
  }

  scramble() {
    if (this.cube.isAnimating) return;
    this.player.stopAndClose();
    this.cube.resetHighlights();

    const scrambleSequence = this.generateScramble(20);
    this.setStatusMessage('Scrambling cube...');

    // Execute with fast animation
    this.cube.twist(scrambleSequence, { duration: 120 });
    this.cube.onQueueEmpty = () => {
      this.setStatusMessage('Cube scrambled! Try solving it or click "Solve Step-by-Step".');
      this.cube.onQueueEmpty = null;
    };
  }

  resetCube() {
    this.player.stopAndClose();
    this.cube.resetHighlights();
    this.cube.reset();
    this.resetTimer();
    this.setStatusMessage('Cube reset to solved state.');
  }

  resetCamera() {
    this.camera.position.set(4.8, 3.8, 5.2);
    this.camera.lookAt(0, 0, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  startStepByStepSolve() {
    this.player?.pause();
    this.cube.resetHighlights();

    if (this.cube.isAnimating) {
      this.cube.onQueueEmpty = () => {
        this.cube.onQueueEmpty = null;
        this.startStepByStepSolve();
      };
      return;
    }

    const method = this.selectedMethod || 'kociemba';
    this.setStatusMessage(`Computing ${method.toUpperCase()} solution...`);
    const result = solverService.solve(this.cube, method);

    if (result.error) {
      this.setStatusMessage(`Solve error: ${result.error}`, true);
      alert(`Could not solve: ${result.error}`);
      return;
    }

    if (result.isSolved || result.steps.length === 0) {
      this.setStatusMessage('Cube is already solved! 🎉');
      return;
    }

    this.setStatusMessage(`Found ${result.steps.length}-move ${result.methodName} solution.`);
    this.player.loadSteps(
      result.steps,
      `${result.methodName} (${result.steps.length} moves)`,
      result.stages || []
    );
  }

  setStatusMessage(msg, isError = false) {
    const el = document.getElementById('status-msg');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? '#ff5555' : '#4ecca3';
    setTimeout(() => {
      if (el.textContent === msg) {
        el.style.color = '#a0a5b5';
      }
    }, 4000);
  }

  initTimer() {
    const timerEl = document.getElementById('cube-timer');
    if (!timerEl) return;

    timerEl.addEventListener('click', () => {
      if (this.isTimerRunning) {
        this.stopTimer();
      } else {
        this.startTimer();
      }
    });
  }

  startTimer() {
    this.isTimerRunning = true;
    this.timerStartTime = performance.now();
    const timerEl = document.getElementById('cube-timer');
    if (timerEl) timerEl.classList.add('running');

    this.timerInterval = setInterval(() => {
      const elapsed = performance.now() - this.timerStartTime;
      const seconds = (elapsed / 1000).toFixed(2);
      if (timerEl) timerEl.textContent = `${seconds}s`;
    }, 30);
  }

  stopTimer() {
    this.isTimerRunning = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    const timerEl = document.getElementById('cube-timer');
    if (timerEl) timerEl.classList.remove('running');
  }

  resetTimer() {
    this.stopTimer();
    const timerEl = document.getElementById('cube-timer');
    if (timerEl) timerEl.textContent = '0.00s';
  }
}
