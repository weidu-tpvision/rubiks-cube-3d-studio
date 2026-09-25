import * as THREE from 'three';
import { AXIS_VECTORS } from './PyraminxGeometry.js';

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
    this.isOrbiting = false;
    this.startScreenPos = new THREE.Vector2();
    this.hitSticker = null;
    this.hitNormal = new THREE.Vector3();
    this.hitCubiePos = new THREE.Vector3();
    this.hitPoint = new THREE.Vector3();

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

  isTurnableSticker(stickerMesh) {
    if (!stickerMesh || !stickerMesh.parent) return false;
    if (this.cube.puzzleType === 'pyraminx' || this.cube.dimension === 2 || this.cube.dimension === 4) {
      return true;
    }
    const cubiePos = new THREE.Vector3();
    stickerMesh.parent.getWorldPosition(cubiePos);
    return (Math.abs(Math.round(cubiePos.x)) + Math.abs(Math.round(cubiePos.y)) + Math.abs(Math.round(cubiePos.z))) >= 2;
  }

  updateCursor(isHoveringTurnableLayer = false) {
    if (this.isOrbiting || this.isDraggingFace) {
      this.canvas.style.cursor = 'grabbing';
      return;
    }
    this.canvas.style.cursor = isHoveringTurnableLayer ? 'pointer' : 'default';
  }

  checkHoverCursor(e) {
    if (!e || e.pointerType === 'touch') return;
    if (this.isOrbiting || this.isDraggingFace || (e.buttons && ((e.buttons & 2) !== 0 || (e.buttons & 4) !== 0))) {
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const isInsideCanvas = e.clientX >= rect.left && e.clientX <= rect.right &&
                           e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!isInsideCanvas) {
      this.canvas.style.cursor = 'default';
      return;
    }

    const p = this.getPointerPos(e);
    this.pointer.set(p.x, p.y);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cube.allStickers, false);
    if (intersects.length > 0) {
      const isTurnable = this.isTurnableSticker(intersects[0].object);
      this.updateCursor(isTurnable);
    } else {
      this.updateCursor(false);
    }
  }

  initPointerEvents() {
    if (this.canvas?.addEventListener) {
      this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
      this.canvas.addEventListener('pointerleave', () => {
        if (!this.isOrbiting && !this.isPointerDown) {
          this.canvas.style.cursor = 'default';
        }
      });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', (e) => this.onPointerMove(e));
      window.addEventListener('pointerup', (e) => this.onPointerUp(e));
      window.addEventListener('pointercancel', (e) => this.onPointerUp(e));
      window.addEventListener('blur', () => this.onPointerUp());
    }
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
    // Ignore secondary touch pointers to allow smooth two-finger pinch-zoom/pan
    if (isTouch && !e.isPrimary) return;

    // Mouse Right-click (2) or Middle-click (1): Handled strictly by OrbitControls to rotate / pan the 3D scene
    if (!isTouch && (e.button === 2 || e.button === 1)) {
      this.isOrbiting = true;
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
      if (this.cube.puzzleType === 'pyraminx') {
        hit.object.parent.getWorldPosition(cubiePos);
      } else if (this.cube.dimension === 2) {
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

      // Check if clicked piece is part of a turnable layer
      const isTurnableLayer = this.isTurnableSticker(hit.object);

      if (isTurnableLayer) {
        this.hitSticker = hit.object;
        this.hitNormal.copy(this.hitSticker.userData.localNormal)
          .applyQuaternion(this.hitSticker.parent.quaternion)
          .normalize();
        this.hitCubiePos.copy(cubiePos);
        this.hitPoint.copy(hit.point);

        this.isPointerDown = true;
        this.isDraggingFace = true;
        if (!isTouch) {
          this.canvas.style.cursor = 'grabbing';
        }

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
    const isTouch = e.pointerType === 'touch';

    // 1. Maintain 'grabbing' cursor during right/middle-click OrbitControls rotation or panning
    if (!isTouch && (this.isOrbiting || (e.buttons && ((e.buttons & 2) !== 0 || (e.buttons & 4) !== 0)))) {
      this.isOrbiting = true;
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    // 2. Hover cursor feedback on desktop (only when not interacting and no buttons pressed)
    if (!this.isPointerDown && !this.isOrbiting && !isTouch && (e.buttons === 0 || e.buttons === undefined)) {
      this.checkHoverCursor(e);
    }

    // 3. Layer drag gesture resolution
    if (!this.isPointerDown || !this.isDraggingFace || this.cube.isAnimating) return;

    if (!isTouch) {
      this.canvas.style.cursor = 'grabbing';
    }

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
    this.isOrbiting = false;
    this.isPointerDown = false;
    this.isDraggingFace = false;

    if (this.orbitControls) {
      this.orbitControls.enabled = true;
    }

    // If mouse button released, restore cursor immediately based on what's under the pointer
    if (e && e.pointerType !== 'touch' && (e.buttons === 0 || e.buttons === undefined)) {
      this.checkHoverCursor(e);
    } else if (!e || e.pointerType !== 'touch') {
      this.canvas.style.cursor = 'default';
    }
  }

  projectVectorToScreen(vec3, originPos = null) {
    const origin = (originPos || this.hitCubiePos).clone();
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
    if (this.cube.puzzleType === 'pyraminx') {
      const dragDir = new THREE.Vector2(screenDx, screenDy).normalize();
      const cubie = this.hitSticker?.parent;
      const pieceType = cubie?.userData?.pieceType;

      // Use the actual clicked surface point so rotation tangent is never zero (collinear)
      const hitPt = this.hitPoint.lengthSq() > 0 ? this.hitPoint : this.hitCubiePos;

      // 1. Determine candidate rotation axes dynamically by 3D physical position
      // (Never rely on static pieceId, which becomes outdated when edges cycle after moves)
      const sortedAxes = Object.keys(AXIS_VECTORS).map(k => ({
        key: k,
        dot: hitPt.dot(AXIS_VECTORS[k])
      })).sort((a, b) => b.dot - a.dot);

      let candidateVertices = [];
      if (pieceType === 'tip' || pieceType === 'center') {
        // Tips and Centers unambiguously belong to their single closest vertex
        candidateVertices = [sortedAxes[0].key];
      } else {
        // Edges physically connect the two nearest vertices
        candidateVertices = [sortedAxes[0].key, sortedAxes[1].key];
      }

      let bestVertex = null;
      let bestScore = -Infinity;
      let bestDot = 0;

      for (const vKey of candidateVertices) {
        const axisVec = AXIS_VECTORS[vKey];
        if (!axisVec) continue;

        // Clockwise rotational velocity tangent = (-axis) x (hitPoint)
        const vCW = new THREE.Vector3().crossVectors(axisVec.clone().negate(), hitPt).normalize();
        if (vCW.lengthSq() < 1e-4) continue;

        const screenVec = this.projectVectorToScreen(vCW, hitPt);
        const dirDot = dragDir.dot(screenVec);
        const absDot = Math.abs(dirDot);

        // Score combines directional alignment with proximity along this axis
        // This ensures clicking on the right side of an edge turns R, and the left side turns L
        const prox = Math.max(0.1, hitPt.dot(axisVec));
        const score = absDot * (1.0 + 2.0 * prox);

        if (score > bestScore) {
          bestScore = score;
          bestDot = dirDot;
          bestVertex = vKey;
        }
      }

      if (bestVertex && Math.abs(bestDot) > 0.25) {
        const isCW = bestDot > 0;
        let moveNotation = pieceType === 'tip' ? bestVertex.toLowerCase() : bestVertex;
        if (!isCW) moveNotation += "'";

        this.cube.twist(moveNotation);
        this.triggerHaptic(25);
        if (this.onUserMove) this.onUserMove(moveNotation);
        if (this.orbitControls) this.orbitControls.enabled = true;
        return true;
      }

      if (this.orbitControls) this.orbitControls.enabled = true;
      return false;
    }

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

  isWideMode() {
    if (this.cube.dimension < 4) return false;
    const wideBtn = document.getElementById('mod-wide');
    return wideBtn?.classList.contains('active') || false;
  }

  isSliceMode() {
    if (this.cube.dimension < 4) return false;
    const sliceBtn = document.getElementById('mod-slice');
    return sliceBtn?.classList.contains('active') || false;
  }

  getNotationFromAxisAndPos(rotAxis, pos) {
    const faces = ['U', 'D', 'F', 'B', 'R', 'L'];
    for (const f of faces) {
      const normal = this.cube.getCenterNormal(f);
      if (!normal) continue;

      if (this.cube.dimension === 4) {
        // Check if dragged piece belongs to face f's side (outer layer 1.5 or inner layer 0.5)
        const dotPos = pos.dot(normal);
        if (dotPos > 0.1) {
          const dot = rotAxis.dot(normal);
          if (dot < -0.6 || dot > 0.6) {
            const isPrime = dot > 0.6;
            const isWide = this.isWideMode();
            if (isWide) {
              return isPrime ? f + "w'" : f + 'w';
            } else {
              // Clicked outer layer piece (coordinate 1.5) -> turn outer layer 1 (f)
              // Clicked inner piece (coordinate 0.5) -> turn 2nd layer slice (2f)
              if (dotPos > 1.0) {
                return isPrime ? f + "'" : f;
              } else {
                return isPrime ? '2' + f + "'" : '2' + f;
              }
            }
          }
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
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts if focus is in an input field
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (!this.enabled || this.cube.isAnimating) return;

      const key = e.key;
      const isShift = e.shiftKey;
      const upper = key.toUpperCase();

      if (upper === 'W' && this.cube.dimension >= 4) {
        const wideBtn = document.getElementById('mod-wide');
        wideBtn?.click();
        e.preventDefault();
        return;
      }

      if (key === '2' && this.cube.dimension >= 4) {
        const sliceBtn = document.getElementById('mod-slice');
        sliceBtn?.click();
        e.preventDefault();
        return;
      }

      if (this.cube.puzzleType === 'pyraminx') {
        const pyraMoves = ['U', 'L', 'R', 'B'];
        if (pyraMoves.includes(upper)) {
          const isTip = e.altKey || (!isShift && key === key.toLowerCase());
          let move = isTip ? key.toLowerCase() : upper;
          if (isShift) move += "'";
          this.cube.twist(move);
          if (this.onUserMove) this.onUserMove(move);
          e.preventDefault();
          return;
        }
      }

      const validMoves = ['U', 'D', 'L', 'R', 'F', 'B'];
      if (validMoves.includes(upper)) {
        const isSlice = this.isSliceMode();
        const isWide = this.isWideMode();
        let move = upper;
        if (isSlice && this.cube.dimension >= 4) {
          move = '2' + upper;
        } else if (isWide && this.cube.dimension >= 4) {
          move += 'w';
        }
        if (isShift) move += "'";
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
