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
    this.sliceActive = false;
    this.selectedMethod = 'kociemba';

    this.timerInterval = null;
    this.timerStartTime = null;
    this.isTimerRunning = false;

    this.initControls();
    this.renderSolveMenu();
    this.initTimer();

    // Initialize wide & slice button visibility
    const wideToggle = document.getElementById('mod-wide');
    const sliceToggle = document.getElementById('mod-slice');
    if (this.cube.dimension < 4) {
      wideToggle?.classList.add('hidden');
      sliceToggle?.classList.add('hidden');
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

    cubeMenu?.querySelectorAll('.cube-option:not(.option-disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const shape = btn.dataset.shape || 'cube';
        const dim = parseInt(btn.dataset.dim, 10) || 3;
        if (shape === 'pyraminx') {
          this.setPuzzle('pyraminx');
        } else {
          this.setPuzzle('cube', dim);
        }
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
    const sliceToggle = document.getElementById('mod-slice');
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

    sliceToggle?.addEventListener('click', () => {
      this.sliceActive = !this.sliceActive;
      sliceToggle.classList.toggle('active', this.sliceActive);
      if (this.sliceActive && this.wideActive) {
        this.wideActive = false;
        wideToggle?.classList.remove('active');
      }
    });

    wideToggle?.addEventListener('click', () => {
      this.wideActive = !this.wideActive;
      wideToggle.classList.toggle('active', this.wideActive);
      if (this.wideActive && this.sliceActive) {
        this.sliceActive = false;
        sliceToggle?.classList.remove('active');
      }
    });

    // Face Move Buttons
    document.querySelectorAll('.move-btn[data-move]').forEach(btn => {
      btn.addEventListener('click', () => {
        const baseMove = btn.dataset.move;
        let finalMove = baseMove;

        if (this.cube.puzzleType === 'pyraminx') {
          if (this.primeActive) finalMove += "'";
        } else if (this.sliceActive && this.cube.dimension >= 4) {
          finalMove = '2' + baseMove;
          if (this.primeActive) finalMove += "'";
          if (this.doubleActive) finalMove += '2';
        } else {
          if (this.wideActive && this.cube.dimension >= 4) finalMove += 'w';
          if (this.primeActive) finalMove += "'";
          if (this.doubleActive) finalMove += '2';
        }

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
    this.setPuzzle('cube', dim);
  }

  setPuzzle(shape, dim = 3) {
    const isPyra = shape === 'pyraminx';
    if (!isPyra && this.cube.puzzleType === 'cube' && this.cube.dimension === dim) return;
    if (isPyra && this.cube.puzzleType === 'pyraminx') return;

    this.player.stopAndClose();
    this.cube.resetHighlights();

    if (isPyra) {
      this.cube.setPuzzleType('pyraminx');
    } else {
      this.cube.setPuzzleType('cube', dim);
    }
    this.resetCamera();
    this.resetTimer();

    // Toggle wide, slice, double buttons and move grids
    const wideToggle = document.getElementById('mod-wide');
    const sliceToggle = document.getElementById('mod-slice');
    const doubleToggle = document.getElementById('mod-double');
    const gridCube = document.getElementById('move-grid-cube');
    const gridPyra = document.getElementById('move-grid-pyraminx');
    const padHint = document.getElementById('move-pad-hint');

    if (isPyra) {
      wideToggle?.classList.add('hidden');
      sliceToggle?.classList.add('hidden');
      doubleToggle?.classList.add('hidden');
      this.wideActive = false;
      this.sliceActive = false;
      this.doubleActive = false;
      wideToggle?.classList.remove('active');
      sliceToggle?.classList.remove('active');
      doubleToggle?.classList.remove('active');

      gridCube?.classList.add('hidden');
      gridPyra?.classList.remove('hidden');

      if (padHint) {
        padHint.innerHTML = '💡 Drag faces directly or use keys <strong>U, L, R, B</strong> (Shift for Prime, Alt for tips).';
      }
    } else {
      doubleToggle?.classList.remove('hidden');
      gridPyra?.classList.add('hidden');
      gridCube?.classList.remove('hidden');

      if (dim >= 4) {
        wideToggle?.classList.remove('hidden');
        sliceToggle?.classList.remove('hidden');
      } else {
        wideToggle?.classList.add('hidden');
        sliceToggle?.classList.add('hidden');
        this.wideActive = false;
        this.sliceActive = false;
        wideToggle?.classList.remove('active');
        sliceToggle?.classList.remove('active');
      }

      if (padHint) {
        padHint.innerHTML = '💡 Drag faces directly or use keys <strong>U, D, L, R, F, B</strong> (Shift for Prime).';
      }
    }

    // Update active state in cube variation dropdown
    const cubeMenu = document.getElementById('cube-variation-menu');
    const cubeLabel = document.getElementById('btn-cube-label');
    const cubeIcon = document.getElementById('btn-cube-icon');

    cubeMenu?.querySelectorAll('.cube-option').forEach(btn => {
      let match = false;
      if (isPyra) {
        match = btn.dataset.shape === 'pyraminx';
      } else {
        match = btn.dataset.shape !== 'pyraminx' && parseInt(btn.dataset.dim, 10) === dim;
      }
      btn.classList.toggle('active', match);
      if (match) {
        if (cubeLabel) cubeLabel.textContent = btn.dataset.name || (isPyra ? 'Pyraminx' : `${dim}×${dim} Cube`);
        if (cubeIcon) cubeIcon.textContent = btn.dataset.icon || (isPyra ? '🔺' : '🧊');
      }
    });

    this.selectedMethod = isPyra ? 'optimal' : (dim === 2 ? 'optimal' : (dim === 4 ? 'reduction' : 'kociemba'));
    this.renderSolveMenu();
    this.setStatusMessage(`Switched to ${isPyra ? 'Pyraminx' : `${dim}×${dim} Cube`}.`);
  }

  renderSolveMenu() {
    const solveMenu = document.getElementById('solve-method-menu');
    const solveLabel = document.getElementById('btn-solve-label');
    if (!solveMenu) return;

    const isPyra = this.cube.puzzleType === 'pyraminx';
    const is4x4 = !isPyra && this.cube.dimension === 4;
    const is2x2 = !isPyra && this.cube.dimension === 2;

    const methods = isPyra ? [
      { key: 'optimal', name: "Optimal (God's Algorithm)", hint: "≤ 11 moves • Shortest path solution", icon: "⚡", label: "Solve: Optimal" },
      { key: 'beginner', name: "Beginner (Layer-by-Layer)", hint: "~12–16 moves • 4 stages (Tips → Centers → Edges)", icon: "🔰", label: "Solve: Beginner" },
    ] : (is2x2 ? [
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
    ]));

    const validKeys = methods.map(m => m.key);
    if (!validKeys.includes(this.selectedMethod)) {
      this.selectedMethod = validKeys[0];
    }

    const currentMethodObj = methods.find(m => m.key === this.selectedMethod) || methods[0];
    if (solveLabel) {
      solveLabel.textContent = currentMethodObj.label;
    }

    const headingText = isPyra ? 'Pyraminx' : `${this.cube.dimension}×${this.cube.dimension}`;
    solveMenu.innerHTML = `
      <div class="menu-heading">Select Solving Method (${headingText})</div>
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
    if (this.cube.puzzleType === 'pyraminx') {
      const layerFaces = ['U', 'L', 'R', 'B'];
      const modifiers = ['', "'"];
      const moves = [];
      let lastFace = '';
      const layerMoveCount = 11;

      for (let i = 0; i < layerMoveCount; i++) {
        let face = layerFaces[Math.floor(Math.random() * layerFaces.length)];
        while (face === lastFace) {
          face = layerFaces[Math.floor(Math.random() * layerFaces.length)];
        }
        lastFace = face;
        const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
        moves.push(face + mod);
      }

      // Random tip moves
      const tipFaces = ['u', 'l', 'r', 'b'];
      tipFaces.forEach(tip => {
        if (Math.random() > 0.35) {
          const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
          moves.push(tip + mod);
        }
      });

      return moves.join(' ');
    }
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
    if (this.cube.puzzleType === 'pyraminx') {
      this.camera.position.set(4.4, 3.2, 3.2);
      this.camera.lookAt(0, 0.35, 0);
      this.controls.target.set(0, 0.35, 0);
    } else {
      this.camera.position.set(4.8, 3.8, 5.2);
      this.camera.lookAt(0, 0, 0);
      this.controls.target.set(0, 0, 0);
    }
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
