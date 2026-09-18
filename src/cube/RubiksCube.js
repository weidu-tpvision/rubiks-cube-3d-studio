import * as THREE from 'three';
import {
  FACE_COLORS,
  createBodyMaterial,
  createStickerMaterial,
  createCenterStickerMaterial,
} from './CubeColors.js';

export class RubiksCube {
  constructor(scene) {
    this.scene = scene;
    this.cubeGroup = new THREE.Group();
    this.cubeGroup.name = 'RubiksCube';
    this.scene.add(this.cubeGroup);

    this.cubies = [];
    this.allStickers = [];

    this.isAnimating = false;
    this.moveQueue = [];
    this.animationSpeed = 220; // ms per 90-degree turn
    this.onMoveComplete = null;
    this.onQueueEmpty = null;
    this.moveCompleteListeners = new Set();
    this.queueEmptyListeners = new Set();

    this.activePivot = null;

    this.buildCube();
  }

  addMoveCompleteListener(fn) {
    if (typeof fn === 'function') this.moveCompleteListeners.add(fn);
  }

  removeMoveCompleteListener(fn) {
    this.moveCompleteListeners.delete(fn);
  }

  addQueueEmptyListener(fn) {
    if (typeof fn === 'function') this.queueEmptyListeners.add(fn);
  }

  removeQueueEmptyListener(fn) {
    this.queueEmptyListeners.delete(fn);
  }

  buildCube() {
    // Clear existing
    while (this.cubeGroup.children.length > 0) {
      this.cubeGroup.remove(this.cubeGroup.children[0]);
    }
    this.cubies = [];
    this.allStickers = [];

    const cubieSize = 0.94;
    const stickerSize = 0.82;
    const bodyGeometry = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);
    const bodyMaterial = createBodyMaterial();

    // Sticker geometry (plane)
    const stickerGeometry = new THREE.PlaneGeometry(stickerSize, stickerSize);

    // Face definitions with local position offset and rotation
    const faceDefs = [
      { face: 'R', pos: [0.472, 0, 0], rot: [0, Math.PI / 2, 0], normal: new THREE.Vector3(1, 0, 0) },
      { face: 'L', pos: [-0.472, 0, 0], rot: [0, -Math.PI / 2, 0], normal: new THREE.Vector3(-1, 0, 0) },
      { face: 'U', pos: [0, 0.472, 0], rot: [-Math.PI / 2, 0, 0], normal: new THREE.Vector3(0, 1, 0) },
      { face: 'D', pos: [0, -0.472, 0], rot: [Math.PI / 2, 0, 0], normal: new THREE.Vector3(0, -1, 0) },
      { face: 'F', pos: [0, 0, 0.472], rot: [0, 0, 0], normal: new THREE.Vector3(0, 0, 1) },
      { face: 'B', pos: [0, 0, -0.472], rot: [0, Math.PI, 0], normal: new THREE.Vector3(0, 0, -1) },
    ];

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;

          const cubie = new THREE.Group();
          cubie.position.set(x, y, z);
          cubie.userData = { initialCoord: { x, y, z } };

          const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
          body.castShadow = true;
          body.receiveShadow = true;
          cubie.add(body);

          // Add stickers only on external faces
          faceDefs.forEach(def => {
            let isOuter = false;
            if (def.face === 'R' && x === 1) isOuter = true;
            if (def.face === 'L' && x === -1) isOuter = true;
            if (def.face === 'U' && y === 1) isOuter = true;
            if (def.face === 'D' && y === -1) isOuter = true;
            if (def.face === 'F' && z === 1) isOuter = true;
            if (def.face === 'B' && z === -1) isOuter = true;

            if (isOuter) {
              const colorInfo = FACE_COLORS[def.face];
              const isCenter =
                (def.face === 'R' && x === 1 && y === 0 && z === 0) ||
                (def.face === 'L' && x === -1 && y === 0 && z === 0) ||
                (def.face === 'U' && x === 0 && y === 1 && z === 0) ||
                (def.face === 'D' && x === 0 && y === -1 && z === 0) ||
                (def.face === 'F' && x === 0 && y === 0 && z === 1) ||
                (def.face === 'B' && x === 0 && y === 0 && z === -1);

              const stickerMat = isCenter
                ? createCenterStickerMaterial(def.face, colorInfo.hex)
                : createStickerMaterial(colorInfo.hex);

              const sticker = new THREE.Mesh(stickerGeometry, stickerMat);
              sticker.position.set(...def.pos);
              sticker.rotation.set(...def.rot);
              sticker.castShadow = false;
              sticker.receiveShadow = true;

              sticker.userData = {
                faceChar: def.face,
                originalFace: def.face,
                cubie: cubie,
                localNormal: def.normal.clone(),
                defaultColor: colorInfo.hex,
              };

              cubie.add(sticker);
              this.allStickers.push(sticker);
            }
          });

          this.cubeGroup.add(cubie);
          this.cubies.push(cubie);
        }
      }
    }
  }

  // Get the center cubie for a specific face (U, D, F, B, R, L)
  getCenterCubie(faceChar) {
    const targetInitial = {
      U: { x: 0, y: 1, z: 0 },
      D: { x: 0, y: -1, z: 0 },
      F: { x: 0, y: 0, z: 1 },
      B: { x: 0, y: 0, z: -1 },
      R: { x: 1, y: 0, z: 0 },
      L: { x: -1, y: 0, z: 0 },
    }[faceChar];

    if (!targetInitial) return null;

    return this.cubies.find(c =>
      c.userData.initialCoord.x === targetInitial.x &&
      c.userData.initialCoord.y === targetInitial.y &&
      c.userData.initialCoord.z === targetInitial.z
    );
  }

  // Get the current world normal of a face's center piece
  getCenterNormal(faceChar) {
    const centerCubie = this.getCenterCubie(faceChar);
    if (!centerCubie) return null;
    const pos = new THREE.Vector3();
    centerCubie.getWorldPosition(pos);
    return new THREE.Vector3(
      Math.round(pos.x),
      Math.round(pos.y),
      Math.round(pos.z)
    ).normalize();
  }

  // Find cubies matching a slice
  getCubiesForMove(moveTypeOrParams) {
    if (typeof moveTypeOrParams === 'object' && moveTypeOrParams !== null) {
      if (moveTypeOrParams.isWholeCube) return this.cubies;
      const normal = moveTypeOrParams.normal;
      const cubiePos = new THREE.Vector3();
      const targetDot = moveTypeOrParams.isSlice ? 0 : 1;
      return this.cubies.filter(cubie => {
        cubie.getWorldPosition(cubiePos);
        return Math.round(cubiePos.dot(normal)) === targetDot;
      });
    }

    const base = moveTypeOrParams[0];
    if (['x', 'y', 'z'].includes(base)) return this.cubies;

    let targetDot = 1;
    let normalFace = base;
    if (base === 'M') { normalFace = 'L'; targetDot = 0; }
    if (base === 'E') { normalFace = 'D'; targetDot = 0; }
    if (base === 'S') { normalFace = 'F'; targetDot = 0; }

    const normal = this.getCenterNormal(normalFace);
    if (!normal) return [];
    const cubiePos = new THREE.Vector3();
    return this.cubies.filter(cubie => {
      cubie.getWorldPosition(cubiePos);
      return Math.round(cubiePos.dot(normal)) === targetDot;
    });
  }

  // Get rotation parameters: axis vector and angle
  getMoveParams(moveStr) {
    const face = moveStr[0];
    const isPrime = moveStr.includes("'");
    const isDouble = moveStr.includes('2');

    // Whole-cube rotations
    if (['x', 'y', 'z'].includes(face)) {
      const axis = new THREE.Vector3(
        face === 'x' ? 1 : 0,
        face === 'y' ? 1 : 0,
        face === 'z' ? 1 : 0
      );
      let baseAngle = -Math.PI / 2;
      let angle = isPrime ? -baseAngle : (isDouble ? baseAngle * 2 : baseAngle);
      return { axis, angle, face, isPrime, isDouble, isWholeCube: true };
    }

    // Slice turns: M (between L and R, turns like L), E (turns like D), S (turns like F)
    if (face === 'M' || face === 'E' || face === 'S') {
      const refFace = face === 'M' ? 'L' : (face === 'E' ? 'D' : 'F');
      const normal = this.getCenterNormal(refFace);
      if (!normal) return null;
      let baseAngle = -Math.PI / 2;
      let angle = isPrime ? -baseAngle : (isDouble ? baseAngle * 2 : baseAngle);
      return {
        axis: normal,
        angle,
        face,
        isPrime,
        isDouble,
        normal,
        isSlice: true,
        isWholeCube: false,
      };
    }

    // Normal face turns bound directly to the center piece with that letter
    const normal = this.getCenterNormal(face);
    if (!normal) return null;

    let baseAngle = -Math.PI / 2;
    let angle = isPrime ? -baseAngle : (isDouble ? baseAngle * 2 : baseAngle);

    return {
      axis: normal,
      angle,
      face,
      isPrime,
      isDouble,
      normal,
      isSlice: false,
      isWholeCube: false,
    };
  }

  // Queue a single move or space-separated moves
  twist(moveStr, options = {}) {
    const moves = moveStr.trim().split(/\s+/).filter(m => m.length > 0);
    if (moves.length === 0) return;

    moves.forEach(m => {
      this.moveQueue.push({ move: m, options });
    });

    if (!this.isAnimating) {
      this.processNextMove();
    }
  }

  // Execute immediately without animation
  twistInstant(moveStr) {
    if (!moveStr) return;
    const moves = moveStr.trim().split(/\s+/).filter(m => m.length > 0);
    moves.forEach(m => {
      const params = this.getMoveParams(m);
      if (!params) return;

      const sliceCubies = this.getCubiesForMove(params);
      const pivot = new THREE.Group();
      this.cubeGroup.add(pivot);

      sliceCubies.forEach(c => pivot.attach(c));
      pivot.rotateOnAxis(params.axis, params.angle);
      pivot.updateMatrixWorld(true);

      sliceCubies.forEach(c => {
        this.cubeGroup.attach(c);
        this.snapCubie(c);
      });

      this.cubeGroup.remove(pivot);
    });
  }

  processNextMove() {
    if (this.moveQueue.length === 0) {
      this.isAnimating = false;
      if (this.onQueueEmpty) this.onQueueEmpty();
      this.queueEmptyListeners.forEach(fn => {
        try { fn(); } catch (err) { console.error('[RubiksCube] queueEmptyListener error:', err); }
      });
      return;
    }

    this.isAnimating = true;
    const { move, options } = this.moveQueue.shift();
    const params = this.getMoveParams(move);

    if (!params) {
      this.processNextMove();
      return;
    }

    const duration = options.duration !== undefined ? options.duration : this.animationSpeed;

    if (duration <= 0) {
      this.twistInstant(move);
      if (this.onMoveComplete) this.onMoveComplete(move);
      this.moveCompleteListeners.forEach(fn => {
        try { fn(move); } catch (err) { console.error('[RubiksCube] moveCompleteListener error:', err); }
      });
      this.processNextMove();
      return;
    }

    const sliceCubies = this.getCubiesForMove(params);
    const pivot = new THREE.Group();
    this.cubeGroup.add(pivot);
    this.activePivot = pivot;

    sliceCubies.forEach(c => pivot.attach(c));

    const startTime = performance.now();
    const targetAngle = params.angle;
    let currentAngle = 0;

    const animateStep = (currentTime) => {
      // Cancel gracefully if cube was reset or pivot changed
      if (this.activePivot !== pivot) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - progress, 3);
      const newAngle = targetAngle * ease;
      const delta = newAngle - currentAngle;
      currentAngle = newAngle;

      pivot.rotateOnAxis(params.axis, delta);

      if (progress < 1.0) {
        requestAnimationFrame(animateStep);
      } else {
        // Complete rotation
        const finalDelta = targetAngle - currentAngle;
        pivot.rotateOnAxis(params.axis, finalDelta);
        pivot.updateMatrixWorld(true);

        sliceCubies.forEach(c => {
          this.cubeGroup.attach(c);
          this.snapCubie(c);
        });

        this.cubeGroup.remove(pivot);
        this.activePivot = null;

        if (this.onMoveComplete) this.onMoveComplete(move);
        this.moveCompleteListeners.forEach(fn => {
          try { fn(move); } catch (err) { console.error('[RubiksCube] moveCompleteListener error:', err); }
        });
        this.processNextMove();
      }
    };

    requestAnimationFrame(animateStep);
  }

  // Snap cubie to exact integer positions and 90-degree rotations
  snapCubie(cubie) {
    cubie.position.x = Math.round(cubie.position.x);
    cubie.position.y = Math.round(cubie.position.y);
    cubie.position.z = Math.round(cubie.position.z);

    const euler = new THREE.Euler().setFromQuaternion(cubie.quaternion, 'XYZ');
    const snapAngle = (a) => Math.round(a / (Math.PI / 2)) * (Math.PI / 2);
    euler.x = snapAngle(euler.x);
    euler.y = snapAngle(euler.y);
    euler.z = snapAngle(euler.z);

    cubie.quaternion.setFromEuler(euler);
    cubie.updateMatrixWorld(true);
  }

  // Extract the 54-facelet state in standard URFDLB order for solver
  getFaceletString() {
    this.cubeGroup.updateMatrixWorld(true);

    const U = this.getCenterNormal('U');
    const D = this.getCenterNormal('D');
    const F = this.getCenterNormal('F');
    const B = this.getCenterNormal('B');
    const R = this.getCenterNormal('R');
    const L = this.getCenterNormal('L');

    const faceNormals = { U, R, F, D, L, B };

    const faceSlots = {
      U: [
        new THREE.Vector3().add(U).add(B).add(L),
        new THREE.Vector3().add(U).add(B),
        new THREE.Vector3().add(U).add(B).add(R),
        new THREE.Vector3().add(U).add(L),
        new THREE.Vector3().add(U),
        new THREE.Vector3().add(U).add(R),
        new THREE.Vector3().add(U).add(F).add(L),
        new THREE.Vector3().add(U).add(F),
        new THREE.Vector3().add(U).add(F).add(R),
      ],
      R: [
        new THREE.Vector3().add(R).add(U).add(F),
        new THREE.Vector3().add(R).add(U),
        new THREE.Vector3().add(R).add(U).add(B),
        new THREE.Vector3().add(R).add(F),
        new THREE.Vector3().add(R),
        new THREE.Vector3().add(R).add(B),
        new THREE.Vector3().add(R).add(D).add(F),
        new THREE.Vector3().add(R).add(D),
        new THREE.Vector3().add(R).add(D).add(B),
      ],
      F: [
        new THREE.Vector3().add(F).add(U).add(L),
        new THREE.Vector3().add(F).add(U),
        new THREE.Vector3().add(F).add(U).add(R),
        new THREE.Vector3().add(F).add(L),
        new THREE.Vector3().add(F),
        new THREE.Vector3().add(F).add(R),
        new THREE.Vector3().add(F).add(D).add(L),
        new THREE.Vector3().add(F).add(D),
        new THREE.Vector3().add(F).add(D).add(R),
      ],
      D: [
        new THREE.Vector3().add(D).add(F).add(L),
        new THREE.Vector3().add(D).add(F),
        new THREE.Vector3().add(D).add(F).add(R),
        new THREE.Vector3().add(D).add(L),
        new THREE.Vector3().add(D),
        new THREE.Vector3().add(D).add(R),
        new THREE.Vector3().add(D).add(B).add(L),
        new THREE.Vector3().add(D).add(B),
        new THREE.Vector3().add(D).add(B).add(R),
      ],
      L: [
        new THREE.Vector3().add(L).add(U).add(B),
        new THREE.Vector3().add(L).add(U),
        new THREE.Vector3().add(L).add(U).add(F),
        new THREE.Vector3().add(L).add(B),
        new THREE.Vector3().add(L),
        new THREE.Vector3().add(L).add(F),
        new THREE.Vector3().add(L).add(D).add(B),
        new THREE.Vector3().add(L).add(D),
        new THREE.Vector3().add(L).add(D).add(F),
      ],
      B: [
        new THREE.Vector3().add(B).add(U).add(R),
        new THREE.Vector3().add(B).add(U),
        new THREE.Vector3().add(B).add(U).add(L),
        new THREE.Vector3().add(B).add(R),
        new THREE.Vector3().add(B),
        new THREE.Vector3().add(B).add(L),
        new THREE.Vector3().add(B).add(D).add(R),
        new THREE.Vector3().add(B).add(D),
        new THREE.Vector3().add(B).add(D).add(L),
      ],
    };

    const order = ['U', 'R', 'F', 'D', 'L', 'B'];
    let result = '';

    const tempNormal = new THREE.Vector3();
    const cubiePos = new THREE.Vector3();

    for (const faceKey of order) {
      const slots = faceSlots[faceKey];
      const targetNormal = faceNormals[faceKey];

      for (const targetSlot of slots) {
        const sx = Math.round(targetSlot.x);
        const sy = Math.round(targetSlot.y);
        const sz = Math.round(targetSlot.z);
        let matchedSticker = null;

        for (const cubie of this.cubies) {
          cubie.getWorldPosition(cubiePos);
          if (
            Math.round(cubiePos.x) === sx &&
            Math.round(cubiePos.y) === sy &&
            Math.round(cubiePos.z) === sz
          ) {
            for (const child of cubie.children) {
              if (child.userData && child.userData.localNormal) {
                tempNormal.copy(child.userData.localNormal).applyQuaternion(cubie.quaternion);
                if (tempNormal.dot(targetNormal) > 0.7) {
                  matchedSticker = child;
                  break;
                }
              }
            }
            break;
          }
        }

        if (matchedSticker) {
          result += matchedSticker.userData.faceChar;
        } else {
          console.warn(`Could not find sticker at ${faceKey} slot [${sx},${sy},${sz}]`);
          result += faceKey; // Fallback
        }
      }
    }

    return result;
  }

  // Highlight specific pieces (for tutorial/demo mode)
  highlightPieces(filterFn = null) {
    this.allStickers.forEach(sticker => {
      const shouldHighlight = filterFn ? filterFn(sticker) : true;
      if (shouldHighlight) {
        sticker.material.opacity = 1.0;
        sticker.material.emissive = new THREE.Color(0x222222);
      } else {
        sticker.material.opacity = 0.25;
        sticker.material.emissive = new THREE.Color(0x000000);
      }
      sticker.material.transparent = true;
      sticker.material.needsUpdate = true;
    });
  }

  resetHighlights() {
    this.allStickers.forEach(sticker => {
      sticker.material.opacity = 1.0;
      sticker.material.transparent = false;
      sticker.material.emissive = new THREE.Color(0x000000);
      sticker.material.needsUpdate = true;
    });
  }

  reset() {
    this.activePivot = null;
    this.moveQueue = [];
    this.isAnimating = false;
    this.buildCube();
    this.queueEmptyListeners.forEach(fn => {
      try { fn(); } catch (err) { console.error('[RubiksCube] queueEmptyListener error:', err); }
    });
  }
}
