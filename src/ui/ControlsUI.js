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
    this.wideActive = false;
    this.selectedMethod = 'kociemba';

    this.timerInterval = null;
    this.timerStartTime = null;
    this.isTimerRunning = false;

    this.initControls();
    this.renderSolveMenu();
    this.initTimer();

    // Initialize wide button visibility
    const wideToggle = document.getElementById('mod-wide');
    if (this.cube.dimension < 4) {
      wideToggle?.classList.add('hidden');
    }
  }

  initControls() {
    // Cube Shape / Variation Dropdown toggle
    const cubeMenuBtn = document.getElementById('btn-cube-dropdown');
    const cubeMenu = document.getElementById('cube-variation-menu');

    cubeMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      cubeMenu?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.cube-dropdown-container')) {
        cubeMenu?.classList.add('hidden');
      }
    });

    cubeMenu?.querySelectorAll('.cube-option[data-dim]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dim = parseInt(btn.dataset.dim, 10);
        this.setCubeDimension(dim);
        cubeMenu?.classList.add('hidden');
      });
    });

    // Top Bar Actions
    document.getElementById('btn-scramble')?.addEventListener('click', () => this.scramble());
    document.getElementById('btn-reset')?.addEventListener('click', () => this.resetCube());
    document.getElementById('btn-solve-step')?.addEventListener('click', () => this.startStepByStepSolve());

    // Solve Method Dropdown toggle
    const solveMenuBtn = document.getElementById('btn-solve-menu');
    const solveMenu = document.getElementById('solve-method-menu');

    solveMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      solveMenu?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.solve-dropdown-container')) {
        solveMenu?.classList.add('hidden');
      }
    });

    document.getElementById('btn-tutorial')?.addEventListener('click', () => {
      if (this.onOpenTutorial) this.onOpenTutorial();
    });
    document.getElementById('btn-reset-cam')?.addEventListener('click', () => this.resetCamera());

    // Move Pad Modifier Toggles
    const primeToggle = document.getElementById('mod-prime');
    const doubleToggle = document.getElementById('mod-double');
    const wideToggle = document.getElementById('mod-wide');

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

    wideToggle?.addEventListener('click', () => {
      this.wideActive = !this.wideActive;
      wideToggle.classList.toggle('active', this.wideActive);
    });

    // Face Move Buttons
    document.querySelectorAll('.move-btn[data-move]').forEach(btn => {
      btn.addEventListener('click', () => {
        const baseMove = btn.dataset.move;
        let finalMove = baseMove;

        if (this.wideActive && this.cube.dimension >= 4) finalMove += 'w';
        if (this.primeActive) finalMove += "'";
        if (this.doubleActive) finalMove += '2';

        this.cube.twist(finalMove);

        // Reset single-move modifiers after click
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

  setCubeDimension(dim) {
    if (this.cube.dimension === dim) return;
    this.player.stopAndClose();
    this.cube.resetHighlights();
    this.cube.setDimension(dim);
    this.resetTimer();

    // Toggle wide button visibility for 4x4
    const wideToggle = document.getElementById('mod-wide');
    if (wideToggle) {
      if (dim >= 4) {
        wideToggle.classList.remove('hidden');
      } else {
        wideToggle.classList.add('hidden');
        this.wideActive = false;
        wideToggle.classList.remove('active');
      }
    }

    // Update active state in cube shape dropdown
    const cubeMenu = document.getElementById('cube-variation-menu');
    const cubeLabel = document.getElementById('btn-cube-label');
    const cubeIcon = document.getElementById('btn-cube-icon');

    cubeMenu?.querySelectorAll('.cube-option[data-dim]').forEach(btn => {
      const match = parseInt(btn.dataset.dim, 10) === dim;
      btn.classList.toggle('active', match);
      if (match) {
        if (cubeLabel) cubeLabel.textContent = btn.dataset.name || `${dim}×${dim} Cube`;
        if (cubeIcon) cubeIcon.textContent = btn.dataset.icon || '🧊';
      }
    });

    this.selectedMethod = dim === 2 ? 'optimal' : (dim === 4 ? 'reduction' : 'kociemba');
    this.renderSolveMenu();
    this.setStatusMessage(`Switched to ${dim}×${dim} Cube.`);
  }

  renderSolveMenu() {
    const solveMenu = document.getElementById('solve-method-menu');
    const solveLabel = document.getElementById('btn-solve-label');
    if (!solveMenu) return;

    const is4x4 = this.cube.dimension === 4;
    const is2x2 = this.cube.dimension === 2;
    const methods = is2x2 ? [
      { key: 'optimal', name: "Optimal (God's Algorithm)", hint: "≤ 11 moves • Mathematical shortest path", icon: "⚡", label: "Solve: Optimal" },
      { key: 'beginner', name: "Beginner (Layer-by-Layer)", hint: "~15–20 moves • 3 standard learning stages", icon: "🔰", label: "Solve: Beginner" },
      { key: 'ortega', name: "Ortega Method", hint: "~11–15 moves • Speedcubing (Face → OLL → PBL)", icon: "👑", label: "Solve: Ortega" },
    ] : (is4x4 ? [
      { key: 'reduction', name: "4×4 Reduction Method", hint: "Centers → Dedges → 3×3 Stage & Parities", icon: "🔮", label: "Solve: Reduction" },
    ] : [
      { key: 'kociemba', name: "Optimal (Kociemba)", hint: "~20 moves • Mathematical shortest path", icon: "⚡", label: "Solve: Optimal" },
      { key: 'beginner', name: "Beginner (Layer-by-Layer)", hint: "~110–120 moves • 7 standard learning stages", icon: "🔰", label: "Solve: Beginner" },
      { key: 'cfop', name: "CFOP / Fridrich", hint: "~70–75 moves • Cross → F2L → OLL → PLL", icon: "👑", label: "Solve: CFOP" },
      { key: 'roux', name: "Roux Method", hint: "~70–75 moves • Left/Right Blocks & M-Slice", icon: "💡", label: "Solve: Roux" },
    ]);

    const validKeys = methods.map(m => m.key);
    if (!validKeys.includes(this.selectedMethod)) {
      this.selectedMethod = validKeys[0];
    }

    const currentMethodObj = methods.find(m => m.key === this.selectedMethod) || methods[0];
    if (solveLabel) {
      solveLabel.textContent = currentMethodObj.label;
    }

    solveMenu.innerHTML = `
      <div class="menu-heading">Select Solving Method (${this.cube.dimension}×${this.cube.dimension})</div>
      ${methods.map(m => `
        <button class="method-option ${m.key === this.selectedMethod ? 'active' : ''}" data-method="${m.key}">
          <span class="method-icon">${m.icon}</span>
          <div class="method-text">
            <div class="method-name">${m.name}</div>
            <div class="method-hint">${m.hint}</div>
          </div>
        </button>
      `).join('')}
    `;

    solveMenu.querySelectorAll('.method-option[data-method]').forEach(btn => {
      btn.addEventListener('click', () => {
        const method = btn.dataset.method;
        this.selectedMethod = method;
        const selObj = methods.find(m => m.key === method);
        if (solveLabel && selObj) {
          solveLabel.textContent = selObj.label;
        }
        solveMenu.querySelectorAll('.method-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        solveMenu.classList.add('hidden');
        this.startStepByStepSolve();
      });
    });
  }

  generateScramble(length = 20) {
    if (this.cube.dimension === 2) {
      const faces = ['U', 'R', 'F'];
      const modifiers = ['', "'", '2'];
      const moves = [];
      let lastFace = '';
      const len = 11;
      for (let i = 0; i < len; i++) {
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

    if (this.cube.dimension === 4) {
      const outerFaces = ['U', 'D', 'L', 'R', 'F', 'B'];
      const wideFaces = ['Uw', 'Dw', 'Lw', 'Rw', 'Fw', 'Bw'];
      const allFaces = [...outerFaces, ...wideFaces];
      const modifiers = ['', "'", '2'];
      const moves = [];
      let lastBase = '';
      const len = 40; // Standard WCA 4x4 scramble length
      for (let i = 0; i < len; i++) {
        let face = allFaces[Math.floor(Math.random() * allFaces.length)];
        let base = face.replace('w', '');
        while (base === lastBase) {
          face = allFaces[Math.floor(Math.random() * allFaces.length)];
          base = face.replace('w', '');
        }
        lastBase = base;
        const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
        moves.push(face + mod);
      }
      return moves.join(' ');
    }

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
