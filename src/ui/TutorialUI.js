import { TUTORIAL_METHODS } from '../solver/TutorialData.js';
import { solverService } from '../solver/SolverService.js';

export class TutorialUI {
  constructor(rubiksCube, stepPlayer) {
    this.cube = rubiksCube;
    this.player = stepPlayer;
    this.methods = TUTORIAL_METHODS;
    this.currentMethodKey = 'beginner';
    this.currentStage = this.methods.beginner.stages[0];

    this.drawer = document.getElementById('tutorial-drawer');
    this.closeBtn = document.getElementById('btn-close-tutorial');
    this.methodTabsEl = document.getElementById('tutorial-method-tabs');
    this.stagesListEl = document.getElementById('tutorial-stage-list');
    this.stageDetailEl = document.getElementById('tutorial-stage-detail');

    this.init();
  }

  init() {
    this.closeBtn?.addEventListener('click', () => this.close());
    this.renderMethodTabs();
    this.renderStageList();
    this.renderStageDetail(this.currentStage);
  }

  open() {
    if (this.drawer) {
      this.drawer.classList.add('open');
      document.body.classList.add('has-tutorial-drawer');
    }
  }

  close() {
    if (this.drawer) {
      this.drawer.classList.remove('open');
      document.body.classList.remove('has-tutorial-drawer');
    }
  }

  renderMethodTabs() {
    if (!this.methodTabsEl) return;
    this.methodTabsEl.innerHTML = '';

    Object.keys(this.methods).forEach(key => {
      const method = this.methods[key];
      const tab = document.createElement('button');
      tab.className = `method-tab ${key === this.currentMethodKey ? 'active' : ''}`;
      tab.textContent = method.shortName;
      tab.addEventListener('click', () => {
        this.currentMethodKey = key;
        this.currentStage = this.methods[key].stages[0];
        document.querySelectorAll('.method-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderStageList();
        this.renderStageDetail(this.currentStage);
      });
      this.methodTabsEl.appendChild(tab);
    });
  }

  renderStageList() {
    if (!this.stagesListEl) return;
    this.stagesListEl.innerHTML = '';

    const currentMethod = this.methods[this.currentMethodKey];

    // Method info header
    const infoCard = document.createElement('div');
    infoCard.className = 'method-info-card';
    infoCard.innerHTML = `
      <div class="method-badge-pill">${currentMethod.badge}</div>
      <p class="method-summary">${currentMethod.desc}</p>
    `;
    this.stagesListEl.appendChild(infoCard);

    currentMethod.stages.forEach(stage => {
      const item = document.createElement('button');
      item.className = `tutorial-item ${stage.id === this.currentStage.id ? 'active' : ''}`;
      item.innerHTML = `
        <div class="stage-num">${stage.id}</div>
        <div class="stage-info">
          <div class="stage-title">${stage.title}</div>
          <div class="stage-sub">${stage.subtitle}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        this.currentStage = stage;
        document.querySelectorAll('.tutorial-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        this.renderStageDetail(stage);
      });
      this.stagesListEl.appendChild(item);
    });
  }

  renderStageDetail(stage) {
    if (!this.stageDetailEl) return;

    const currentMethod = this.methods[this.currentMethodKey];

    this.stageDetailEl.innerHTML = `
      <div class="detail-header">
        <div class="detail-meta-row">
          <span class="stage-badge">${currentMethod.name}</span>
          <span class="stage-badge stage-badge-num">Stage ${stage.id} of ${currentMethod.stages.length}</span>
        </div>
        <h3>${stage.title}</h3>
        <div class="stage-subtitle">${stage.subtitle}</div>
      </div>

      <div class="detail-section">
        <h4>🎯 Objective</h4>
        <p>${stage.goal}</p>
      </div>

      <div class="detail-section">
        <h4>⚡ Key Algorithm</h4>
        <div class="algorithm-chip">${stage.algorithm}</div>
        <div class="mnemonic-note"><strong>Mnemonic / Concept:</strong> ${stage.mnemonic}</div>
      </div>

      <div class="detail-section">
        <h4>📖 Step Guide</h4>
        <p>${stage.explanation}</p>
      </div>

      <div class="detail-actions">
        <button id="btn-demo-stage" class="btn btn-primary btn-block">
          <span class="icon">✨</span> Load & Demonstrate on 3D Cube
        </button>
      </div>
    `;

    document.getElementById('btn-demo-stage')?.addEventListener('click', () => {
      this.demonstrateStage(stage, currentMethod);
    });
  }

  demonstrateStage(stage, currentMethod) {
    this.close();

    // Reset cube
    this.cube.reset();

    // Apply setup scramble instantly to place cube in textbook configuration
    if (stage.setupScramble) {
      this.cube.twistInstant(stage.setupScramble);
    }

    // Apply educational highlighting filter
    if (stage.filter) {
      this.cube.highlightPieces(stage.filter);
    }

    // Parse demo moves
    const moves = stage.demoMoves.trim().split(/\s+/).filter(m => m.length > 0);
    const steps = moves.map((move, idx) => ({
      index: idx,
      total: moves.length,
      move: move,
      inverseMove: solverService.getInverseMove(move),
      description: solverService.describeMove(move),
      stageIndex: 0,
      stageName: stage.title,
      stageTotal: 1,
      stageDescription: stage.goal,
    }));

    // Load into player
    this.player.loadSteps(steps, `${currentMethod.shortName}: ${stage.title}`, [{
      stageIndex: 0,
      stageName: stage.title,
      startMoveIndex: 0,
      moveCount: moves.length,
    }]);
  }
}