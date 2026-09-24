export const SPEED_PRESETS = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0];
const BASE_DELAY_MS = 360;

export class StepPlayer {
  constructor(rubiksCube, options = {}) {
    this.cube = rubiksCube;
    this.steps = [];
    this.stages = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.playTimer = null;
    this.speedMultiplier = 1.0;
    this.speedMs = BASE_DELAY_MS;

    this.onStateChange = options.onStateChange || null;
    this.onComplete = options.onComplete || null;
    this.onClose = options.onClose || null;

    this.container = document.getElementById('step-player');
    this.badgeEl = document.getElementById('player-move-badge');
    this.descEl = document.getElementById('player-move-desc');
    this.stepCountEl = document.getElementById('player-step-count');
    this.progressFillEl = document.getElementById('player-progress-fill');
    this.stagePill = document.getElementById('player-stage-pill');

    this.playBtn = document.getElementById('player-btn-play');
    this.prevBtn = document.getElementById('player-btn-prev');
    this.nextBtn = document.getElementById('player-btn-next');
    this.resetBtn = document.getElementById('player-btn-start');
    this.closeBtn = document.getElementById('player-btn-close');

    this.speedSlider = document.getElementById('player-speed-slider');
    this.speedLabel = document.getElementById('player-speed-val');

    this.initDOM();
    this.initCubeListeners();
  }

  initCubeListeners() {
    if (this.cube && typeof this.cube.addQueueEmptyListener === 'function') {
      this.cube.addQueueEmptyListener(() => {
        this.updateUI();
      });
    }
    if (this.cube && typeof this.cube.addMoveCompleteListener === 'function') {
      this.cube.addMoveCompleteListener(() => {
        this.updateUI();
      });
    }
  }

  initDOM() {
    if (!this.container) return;

    this.playBtn?.addEventListener('click', () => this.togglePlay());
    this.prevBtn?.addEventListener('click', () => this.stepBack());
    this.nextBtn?.addEventListener('click', () => this.stepForward());
    this.resetBtn?.addEventListener('click', () => this.jumpToStart());
    this.closeBtn?.addEventListener('click', () => this.stopAndClose());

    this.speedSlider?.addEventListener('input', (e) => {
      const idx = parseInt(e.target.value, 10);
      const mult = SPEED_PRESETS[idx] ?? 1.0;
      this.setSpeed(mult);
    });
  }

  setSpeed(multiplier) {
    this.speedMultiplier = multiplier;
    this.speedMs = Math.round(BASE_DELAY_MS / multiplier);
    if (this.speedLabel) {
      const formatted = multiplier % 1 === 0 ? `${multiplier}.0x` : `${multiplier}x`;
      this.speedLabel.textContent = formatted;
    }
    if (this.cube) {
      this.cube.animationSpeed = Math.max(60, Math.round(this.speedMs * 0.72));
    }
  }

  loadSteps(steps, title = 'Solution', stages = []) {
    this.pause();
    this.steps = steps;
    this.stages = stages;
    this.currentIndex = -1;
    this.title = title;

    // Ensure tutorial drawer is closed so two large panels do not occlude viewport
    const tutDrawer = document.getElementById('tutorial-drawer');
    if (tutDrawer && tutDrawer.classList.contains('open')) {
      tutDrawer.classList.remove('open');
      document.body.classList.remove('has-tutorial-drawer');
    }

    if (this.container) {
      this.container.classList.remove('hidden');
    }
    document.body.classList.add('has-player-dock');

    const titleEl = document.getElementById('player-title');
    if (titleEl) titleEl.textContent = title;

    this.updateUI();
  }

  updateUI() {
    const total = this.steps.length;
    const currentStep = this.currentIndex >= 0 && this.currentIndex < total
      ? this.steps[this.currentIndex]
      : null;

    const nextStep = this.currentIndex + 1 < total
      ? this.steps[this.currentIndex + 1]
      : null;

    const activeStep = nextStep || currentStep;

    // Stage indicator pill
    if (this.stagePill) {
      if (activeStep && activeStep.stageName) {
        this.stagePill.classList.remove('hidden');
        if (activeStep.stageTotal > 1) {
          this.stagePill.textContent = `Stage ${activeStep.stageIndex + 1}/${activeStep.stageTotal}: ${activeStep.stageName}`;
        } else {
          this.stagePill.textContent = activeStep.stageName;
        }
      } else {
        this.stagePill.classList.add('hidden');
      }
    }

    if (this.badgeEl) {
      this.badgeEl.textContent = nextStep ? nextStep.move : (currentStep ? '✓' : 'Ready');
    }

    if (this.descEl) {
      if (this.currentIndex >= total - 1 && total > 0) {
        this.descEl.textContent = '🎉 All steps completed! Cube is solved.';
      } else if (nextStep) {
        const stagePrefix = nextStep.stageName && nextStep.stageTotal > 1 ? `[${nextStep.stageName}] ` : '';
        this.descEl.textContent = `${stagePrefix}${nextStep.description || `Execute ${nextStep.move}`}`;
      } else {
        this.descEl.textContent = 'Press Play or Next to begin step demonstration.';
      }
    }

    if (this.stepCountEl) {
      this.stepCountEl.textContent = `Step ${Math.max(0, this.currentIndex + 1)} / ${total}`;
    }

    if (this.progressFillEl) {
      const pct = total === 0 ? 0 : Math.round(((this.currentIndex + 1) / total) * 100);
      this.progressFillEl.style.width = `${pct}%`;
    }

    if (this.playBtn) {
      this.playBtn.innerHTML = this.isPlaying
        ? '<span class="icon">⏸</span> Pause'
        : '<span class="icon">▶</span> Play';
      this.playBtn.disabled = total === 0;
    }

    if (this.prevBtn) {
      this.prevBtn.disabled = this.currentIndex < 0 || this.isPlaying;
    }
    if (this.nextBtn) {
      this.nextBtn.disabled = this.currentIndex >= total - 1 || this.isPlaying;
    }
    if (this.resetBtn) {
      this.resetBtn.disabled = this.currentIndex < 0 || this.isPlaying;
    }

    if (this.onStateChange) {
      this.onStateChange({
        currentIndex: this.currentIndex,
        total,
        currentStep,
        nextStep,
        isPlaying: this.isPlaying,
      });
    }
  }

  stepForward() {
    if (this.cube.isAnimating) return;
    if (this.currentIndex >= this.steps.length - 1) {
      this.pause();
      return;
    }

    this.currentIndex++;
    const step = this.steps[this.currentIndex];

    this.cube.twist(step.move, { duration: Math.floor(this.speedMs * 0.75) });
    this.updateUI();

    if (this.currentIndex === this.steps.length - 1) {
      this.pause();
      if (this.onComplete) this.onComplete();
    }
  }

  stepBack() {
    if (this.cube.isAnimating) return;
    if (this.currentIndex < 0) return;

    this.pause();
    const step = this.steps[this.currentIndex];
    this.cube.twist(step.inverseMove, { duration: Math.floor(this.speedMs * 0.75) });

    this.currentIndex--;
    this.updateUI();
  }

  jumpToStart() {
    if (this.cube.isAnimating) return;
    this.pause();
    while (this.currentIndex >= 0) {
      const step = this.steps[this.currentIndex];
      this.cube.twistInstant(step.inverseMove);
      this.currentIndex--;
    }
    this.updateUI();
  }

  play() {
    if (this.isPlaying) return;
    if (this.currentIndex >= this.steps.length - 1) {
      this.jumpToStart();
    }

    this.isPlaying = true;
    this.updateUI();

    const loop = () => {
      if (!this.isPlaying) return;

      if (this.currentIndex >= this.steps.length - 1) {
        this.pause();
        if (this.onComplete) this.onComplete();
        return;
      }

      if (!this.cube.isAnimating) {
        this.stepForward();
      }

      this.playTimer = setTimeout(loop, this.speedMs + 50);
    };

    loop();
  }

  pause() {
    this.isPlaying = false;
    if (this.playTimer) {
      clearTimeout(this.playTimer);
      this.playTimer = null;
    }
    this.updateUI();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  stopAndClose() {
    this.pause();
    if (this.container) {
      this.container.classList.add('hidden');
    }
    document.body.classList.remove('has-player-dock');
    if (this.onClose) this.onClose();
  }
}
