import * as THREE from 'three';

export class CubeInteraction {
  constructor(rubiksCube, camera, canvas, orbitControls, options = {}) {
    this.cube = rubiksCube;
    this.camera = camera;
    this.canvas = canvas;
    this.orbitControls = orbitControls;
    this.onUserMove = options.onUserMove || null;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.isPointerDown = false;
    this.isDraggingFace = false;
    this.startScreenPos = new THREE.Vector2();
    this.hitSticker = null;
    this.hitNormal = new THREE.Vector3();
    this.hitCubiePos = new THREE.Vector3();

    this.enabled = true;

    this.initPointerEvents();
    this.initKeyboardEvents();
  }

  updateCursor(isHoveringTurnableLayer = false) {
    this.canvas.style.cursor = isHoveringTurnableLayer ? 'pointer' : 'default';
  }

  initPointerEvents() {
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('pointercancel', (e) => this.onPointerUp(e));
  }

  getPointerPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
      screenX: e.clientX,
      screenY: e.clientY,
    };
  }

  onPointerDown(e) {
    if (!this.enabled || this.cube.isAnimating) return;

    // Right-click: Handled strictly by OrbitControls to rotate the 3D cube
    if (e.button === 2) {
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    // Strict FreeCAD style: Only Left-click (button 0) turns layers. Anything else is ignored.
    if (e.button !== 0) return;

    // Left-click strictly turns a layer when clicking on an edge or corner piece
    const p = this.getPointerPos(e);
    this.pointer.set(p.x, p.y);
    this.startScreenPos.set(p.screenX, p.screenY);

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cube.allStickers, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const cubiePos = new THREE.Vector3();
      hit.object.parent.getWorldPosition(cubiePos);
      cubiePos.x = Math.round(cubiePos.x);
      cubiePos.y = Math.round(cubiePos.y);
      cubiePos.z = Math.round(cubiePos.z);

      // Only edge or corner pieces can be turned (sum of abs coordinates >= 2).
      // Center pieces and background do nothing on left-click.
      const isTurnableLayer = (Math.abs(cubiePos.x) + Math.abs(cubiePos.y) + Math.abs(cubiePos.z)) >= 2;

      if (isTurnableLayer) {
        this.hitSticker = hit.object;
        this.hitNormal.copy(this.hitSticker.userData.localNormal)
          .applyQuaternion(this.hitSticker.parent.quaternion)
          .normalize();
        this.hitCubiePos.copy(cubiePos);

        this.isPointerDown = true;
        this.isDraggingFace = true;
      }
    }
  }

  onPointerMove(e) {
    // Hover cursor feedback: 'pointer' only over turnable layers, otherwise 'default'
    if (!this.isPointerDown) {
      const p = this.getPointerPos(e);
      this.pointer.set(p.x, p.y);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(this.cube.allStickers, false);
      if (intersects.length > 0) {
        const cubiePos = new THREE.Vector3();
        intersects[0].object.parent.getWorldPosition(cubiePos);
        const isTurnable = (Math.abs(Math.round(cubiePos.x)) + Math.abs(Math.round(cubiePos.y)) + Math.abs(Math.round(cubiePos.z))) >= 2;
        this.updateCursor(isTurnable);
      } else {
        this.updateCursor(false);
      }
    }

    if (!this.isPointerDown || !this.isDraggingFace || this.cube.isAnimating) return;

    const p = this.getPointerPos(e);
    const dx = p.screenX - this.startScreenPos.x;
    const dy = p.screenY - this.startScreenPos.y;
    const distance = Math.hypot(dx, dy);

    // Responsive 22px threshold for turning
    if (distance > 22) {
      this.resolveFaceDrag(dx, dy);
      this.isDraggingFace = false;
    }
  }

  onPointerUp(e) {
    this.isPointerDown = false;
    this.isDraggingFace = false;
    this.canvas.style.cursor = 'default';
  }

  projectVectorToScreen(vec3) {
    const origin = this.hitCubiePos.clone();
    const target = origin.clone().add(vec3);

    origin.project(this.camera);
    target.project(this.camera);

    const rect = this.canvas.getBoundingClientRect();
    const originScreen = new THREE.Vector2(
      ((origin.x + 1) * rect.width) / 2,
      ((-origin.y + 1) * rect.height) / 2
    );
    const targetScreen = new THREE.Vector2(
      ((target.x + 1) * rect.width) / 2,
      ((-target.y + 1) * rect.height) / 2
    );

    return targetScreen.sub(originScreen).normalize();
  }

  resolveFaceDrag(screenDx, screenDy) {
    const dragDir = new THREE.Vector2(screenDx, screenDy).normalize();
    const normal = this.hitNormal;
    const pos = this.hitCubiePos;

    // Determine orthogonal tangent vectors on this face in 3D
    let tangent1, tangent2;

    if (Math.abs(normal.y) > 0.8) {
      // Up (+Y) or Down (-Y)
      tangent1 = new THREE.Vector3(1, 0, 0); // X
      tangent2 = new THREE.Vector3(0, 0, 1); // Z
    } else if (Math.abs(normal.x) > 0.8) {
      // Right (+X) or Left (-X)
      tangent1 = new THREE.Vector3(0, 1, 0); // Y
      tangent2 = new THREE.Vector3(0, 0, 1); // Z
    } else {
      // Front (+Z) or Back (-Z)
      tangent1 = new THREE.Vector3(1, 0, 0); // X
      tangent2 = new THREE.Vector3(0, 1, 0); // Y
    }

    const screenT1 = this.projectVectorToScreen(tangent1);
    const screenT2 = this.projectVectorToScreen(tangent2);

    const dot1 = dragDir.dot(screenT1);
    const dot2 = dragDir.dot(screenT2);

    // Alignment verification: if neither tangent aligns well (diagonal or off-axis drag),
    // abort slice twist so the user can orbit/rotate the view without accidental move
    const maxAlignment = Math.max(Math.abs(dot1), Math.abs(dot2));
    if (maxAlignment < 0.65) {
      return false;
    }

    let chosenTangent, sign;
    if (Math.abs(dot1) > Math.abs(dot2)) {
      chosenTangent = tangent1;
      sign = dot1 > 0 ? 1 : -1;
    } else {
      chosenTangent = tangent2;
      sign = dot2 > 0 ? 1 : -1;
    }

    const move3D = chosenTangent.clone().multiplyScalar(sign);

    // Now cross normal with move3D to find rotation axis vector: axis = normal x move3D
    const rotAxis = new THREE.Vector3().crossVectors(normal, move3D).normalize();

    // Map to Rubiks Move
    const moveNotation = this.getNotationFromAxisAndPos(rotAxis, pos);
    if (moveNotation) {
      this.cube.twist(moveNotation);
      if (this.onUserMove) this.onUserMove(moveNotation);
      return true;
    }
    return false;
  }

  getNotationFromAxisAndPos(rotAxis, pos) {
    const faces = ['U', 'D', 'F', 'B', 'R', 'L'];
    for (const f of faces) {
      const normal = this.cube.getCenterNormal(f);
      if (!normal) continue;

      // Check if pos belongs to this face slice
      if (Math.round(pos.dot(normal)) === 1) {
        // Check rotation direction relative to this face's outward normal
        const dot = rotAxis.dot(normal);
        if (dot < -0.6) {
          return f;
        } else if (dot > 0.6) {
          return f + "'";
        }
      }
    }

    return null;
  }

  initKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts if focus is in an input field
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (!this.enabled || this.cube.isAnimating) return;

      const key = e.key;
      const isShift = e.shiftKey;
      const upper = key.toUpperCase();

      const validMoves = ['U', 'D', 'L', 'R', 'F', 'B'];
      if (validMoves.includes(upper)) {
        const move = isShift ? `${upper}'` : upper;
        this.cube.twist(move);
        if (this.onUserMove) this.onUserMove(move);
        e.preventDefault();
      }

      // Whole cube rotation: X, Y, Z keys (with Alt or when lower)
      if (['x', 'y', 'z'].includes(key.toLowerCase()) && e.ctrlKey) {
        const rotMove = isShift ? `${key.toLowerCase()}'` : key.toLowerCase();
        this.cube.twist(rotMove);
        if (this.onUserMove) this.onUserMove(rotMove);
        e.preventDefault();
      }
    });
  }
}
