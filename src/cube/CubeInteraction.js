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

    this.touchMode = 'twist'; // 'twist' = 1-finger turns faces; 'orbit' = 1-finger always orbits view (convenience for touchscreens)

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

  triggerHaptic(duration = 20) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch (_) {}
    }
  }

  setTouchMode(mode) {
    this.touchMode = mode;
    return this.touchMode;
  }

  toggleTouchMode() {
    this.touchMode = this.touchMode === 'twist' ? 'orbit' : 'twist';
    return this.touchMode;
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

    const isTouch = e.pointerType === 'touch';

    // Mouse Right-click: Handled strictly by OrbitControls to rotate the 3D cube
    if (!isTouch && e.button === 2) {
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    // Only Left-click or Touch can turn layers
    if (!isTouch && e.button !== 0) return;

    // In mobile Orbit Mode: Always allow OrbitControls to rotate camera, ignore layer twisting
    if (isTouch && this.touchMode === 'orbit') {
      if (this.orbitControls) this.orbitControls.enabled = true;
      return;
    }

    const p = this.getPointerPos(e);
    this.pointer.set(p.x, p.y);
    this.startScreenPos.set(p.screenX, p.screenY);

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cube.allStickers, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const cubiePos = new THREE.Vector3();
      hit.object.parent.getWorldPosition(cubiePos);
      if (this.cube.dimension === 2) {
        cubiePos.x = Math.round(cubiePos.x * 2) / 2;
        cubiePos.y = Math.round(cubiePos.y * 2) / 2;
        cubiePos.z = Math.round(cubiePos.z * 2) / 2;
      } else if (this.cube.dimension === 4) {
        const snapHalf = (v) => Math.round(v - 0.5) + 0.5;
        cubiePos.x = snapHalf(cubiePos.x);
        cubiePos.y = snapHalf(cubiePos.y);
        cubiePos.z = snapHalf(cubiePos.z);
      } else {
        cubiePos.x = Math.round(cubiePos.x);
        cubiePos.y = Math.round(cubiePos.y);
        cubiePos.z = Math.round(cubiePos.z);
      }

      // In 2x2 and 4x4 all outer pieces are turnable. In 3x3, edges and corners (sum of abs >= 2).
      const isTurnableLayer = this.cube.dimension === 2 || this.cube.dimension === 4 || (Math.abs(cubiePos.x) + Math.abs(cubiePos.y) + Math.abs(cubiePos.z)) >= 2;

      if (isTurnableLayer) {
        this.hitSticker = hit.object;
        this.hitNormal.copy(this.hitSticker.userData.localNormal)
          .applyQuaternion(this.hitSticker.parent.quaternion)
          .normalize();
        this.hitCubiePos.copy(cubiePos);

        this.isPointerDown = true;
        this.isDraggingFace = true;

        // When user is dragging to twist a face, temporarily pause OrbitControls so camera doesn't spin
        if (this.orbitControls) {
          this.orbitControls.enabled = false;
        }
        return;
      }
    }

    // If touched background or center piece on mobile, ensure OrbitControls rotates camera
    if (isTouch && this.orbitControls) {
      this.orbitControls.enabled = true;
    }
  }

  onPointerMove(e) {
    // Hover cursor feedback on desktop
    if (!this.isPointerDown && e.pointerType !== 'touch') {
      const p = this.getPointerPos(e);
      this.pointer.set(p.x, p.y);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(this.cube.allStickers, false);
      if (intersects.length > 0) {
        const cubiePos = new THREE.Vector3();
        intersects[0].object.parent.getWorldPosition(cubiePos);
        const isTurnable = this.cube.dimension === 2 || this.cube.dimension === 4 || (Math.abs(Math.round(cubiePos.x)) + Math.abs(Math.round(cubiePos.y)) + Math.abs(Math.round(cubiePos.z))) >= 2;
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

    // Responsive 20px threshold for turning
    if (distance > 20) {
      this.resolveFaceDrag(dx, dy);
      this.isDraggingFace = false;
    }
  }

  onPointerUp(e) {
    this.isPointerDown = false;
    this.isDraggingFace = false;
    this.canvas.style.cursor = 'default';
    if (this.orbitControls) {
      this.orbitControls.enabled = true;
    }
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
      this.triggerHaptic(25);
      if (this.onUserMove) this.onUserMove(moveNotation);
      if (this.orbitControls) this.orbitControls.enabled = true;
      return true;
    }
    if (this.orbitControls) this.orbitControls.enabled = true;
    return false;
  }

  getNotationFromAxisAndPos(rotAxis, pos) {
    const faces = ['U', 'D', 'F', 'B', 'R', 'L'];
    for (const f of faces) {
      const normal = this.cube.getCenterNormal(f);
      if (!normal) continue;

      if (this.cube.dimension === 4) {
        const dotPos = pos.dot(normal);
        // Outer layer piece: dotPos > 1.0 (coordinate 1.5)
        if (dotPos > 1.0) {
          const dot = rotAxis.dot(normal);
          if (dot < -0.6) return f;
          if (dot > 0.6) return f + "'";
        }
        // Inner layer piece: dotPos > 0.0 && dotPos < 1.0 (coordinate 0.5)
        else if (dotPos > 0.0 && dotPos < 1.0) {
          // Dragging inner slice turns ONLY the 2nd layer while keeping the other 3 stationary
          const dot = rotAxis.dot(normal);
          if (dot < -0.6) return '2' + f;
          if (dot > 0.6) return '2' + f + "'";
        }
      } else {
        // Check if pos belongs to this face slice
        const belongsToFace = this.cube.dimension === 2
          ? pos.dot(normal) > 0.1
          : Math.round(pos.dot(normal)) === 1;

        if (belongsToFace) {
          // Check rotation direction relative to this face's outward normal
          const dot = rotAxis.dot(normal);
          if (dot < -0.6) {
            return f;
          } else if (dot > 0.6) {
            return f + "'";
          }
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
