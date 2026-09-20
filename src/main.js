import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RubiksCube } from './cube/RubiksCube.js';
import { CubeInteraction } from './cube/CubeInteraction.js';
import { solverService } from './solver/SolverService.js';
import { StepPlayer } from './ui/StepPlayer.js';
import { ControlsUI } from './ui/ControlsUI.js';
import { TutorialUI } from './ui/TutorialUI.js';

class App {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.viewport = document.getElementById('app-viewport') || document.body;
    window.app = this;
    this.initThree();
    this.initCube();
    this.initSolver();
    this.initUI();
    this.initEvents();
    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1117);

    const width = this.viewport.clientWidth || window.innerWidth;
    const height = this.viewport.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(4.8, 3.8, 5.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Orbit Controls (Strict FreeCAD style: Right-Click strictly for 3D view rotation)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 12.0;
    this.controls.target.set(0, 0, 0);
    this.controls.enablePan = true;

    // Strict button mapping: Left-click is disabled in OrbitControls, Right-click rotates
    this.controls.mouseButtons = {
      LEFT: null,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };

    // Mobile touch mapping: 1-finger rotates camera (when not twisting), 2-fingers pinch/pan
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    // Prevent context menu on canvas so right-clicking doesn't show browser menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(8, 12, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa5c9eb, 0.7);
    fillLight.position.set(-8, -6, -8);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfff0dd, 0.6);
    rimLight.position.set(-6, 8, -6);
    this.scene.add(rimLight);
  }

  initCube() {
    this.rubiksCube = new RubiksCube(this.scene);

    this.interaction = new CubeInteraction(
      this.rubiksCube,
      this.camera,
      this.canvas,
      this.controls,
      {
        onUserMove: (move) => {
          this.controlsUI?.setStatusMessage(`Moved: ${move}`);
        },
      }
    );
  }

  initSolver() {
    // Precalculate solver tables asynchronously
    solverService.init().then(() => {
      const statusEl = document.getElementById('status-msg');
      if (statusEl) {
        statusEl.textContent = 'Rubik Studio ready. Play or click Solve Step-by-Step!';
      }
    });
  }

  initUI() {
    this.stepPlayer = new StepPlayer(this.rubiksCube, {
      onClose: () => {
        this.rubiksCube.resetHighlights();
      },
      onComplete: () => {
        this.rubiksCube.resetHighlights();
      },
    });

    this.tutorialUI = new TutorialUI(this.rubiksCube, this.stepPlayer, {
      onCubeDimensionChange: (dim) => {
        this.controlsUI?.setCubeDimension(dim);
      },
    });

    this.controlsUI = new ControlsUI(
      this.rubiksCube,
      this.camera,
      this.controls,
      this.stepPlayer,
      {
        interaction: this.interaction,
        onOpenTutorial: () => this.tutorialUI.open(),
      }
    );
  }

  initEvents() {
    const updateSize = () => {
      if (!this.viewport) return;
      const width = this.viewport.clientWidth;
      const height = this.viewport.clientHeight;
      if (width === 0 || height === 0) return;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.render(this.scene, this.camera);
    };

    window.addEventListener('resize', updateSize);

    if (window.ResizeObserver && this.viewport) {
      const ro = new ResizeObserver(() => updateSize());
      ro.observe(this.viewport);
    }

    this.viewport.addEventListener('transitionend', updateSize);

    // Touch Mode Switch: Twist Cube vs Orbit Camera (convenience for mobile touchscreens without right-click)
    const touchModeBtn = document.getElementById('btn-touch-mode');
    if (touchModeBtn) {
      touchModeBtn.addEventListener('click', () => {
        const mode = this.interaction.toggleTouchMode();
        const icon = touchModeBtn.querySelector('.icon');
        const text = touchModeBtn.querySelector('.mode-text');
        if (mode === 'orbit') {
          if (icon) icon.textContent = '🔄';
          if (text) text.textContent = 'Orbit';
          touchModeBtn.classList.add('mode-orbit-active');
        } else {
          if (icon) icon.textContent = '✋';
          if (text) text.textContent = 'Twist';
          touchModeBtn.classList.remove('mode-orbit-active');
        }
        this.interaction.triggerHaptic(15);
      });
    }

    // Android Hardware Back Button Handling
    document.addEventListener('backbutton', (e) => {
      const tutDrawer = document.getElementById('tutorial-drawer');
      const stepPlayer = document.getElementById('step-player');
      if (tutDrawer && !tutDrawer.classList.contains('hidden') && tutDrawer.classList.contains('open')) {
        this.tutorialUI?.close();
        e.preventDefault();
        return;
      }
      if (stepPlayer && !stepPlayer.classList.contains('hidden')) {
        this.stepPlayer?.stopAndClose();
        e.preventDefault();
        return;
      }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
