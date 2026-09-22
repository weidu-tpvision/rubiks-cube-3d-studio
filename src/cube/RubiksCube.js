import * as THREE from 'three';
import {
  FACE_COLORS,
  createBodyMaterial,
  createStickerMaterial,
  createCenterStickerMaterial,
} from './CubeColors.js';

export class RubiksCube {
  constructor(scene, dimension = 3) {
    this.scene = scene;
    this.dimension = dimension;
    this.cubeGroup = new THREE.Group();
    this.cubeGroup.name = 'RubiksCube';
    this.scene.add(this.cubeGroup);

    this.cubies = [];
    this.allStickers = [];
    this.orientationAnchors = null;
    this.anchorMap = {};

    this.isAnimating = false;
    this.moveQueue = [];
    this.moveHistory = [];
    this.animationSpeed = 220; // ms per 90-degree turn
    this.onMoveComplete = null;
    this.onQueueEmpty = null;
    this.moveCompleteListeners = new Set();
    this.queueEmptyListeners = new Set();

    this.activePivot = null;

    this.buildCube();
  }

  setDimension(dimension) {
    if (this.dimension === dimension) return;
    this.dimension = dimension;
    this.reset();
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

    // Orientation reference frame to track 6 face directions across whole-cube rotations
    this.orientationAnchors = new THREE.Group();
    this.orientationAnchors.name = 'OrientationAnchors';
    this.cubeGroup.add(this.orientationAnchors);
    this.anchorMap = {};

    const directions = {
      U: new THREE.Vector3(0, 1, 0),
      D: new THREE.Vector3(0, -1, 0),
      F: new THREE.Vector3(0, 0, 1),
      B: new THREE.Vector3(0, 0, -1),
      R: new THREE.Vector3(1, 0, 0),
      L: new THREE.Vector3(-1, 0, 0),
    };
    for (const [faceChar, dir] of Object.entries(directions)) {
      const anchorObj = new THREE.Object3D();
      anchorObj.position.copy(dir);
      this.orientationAnchors.add(anchorObj);
      this.anchorMap[faceChar] = anchorObj;
    }

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

    if (this.dimension === 2) {
      // 2x2 Pocket Cube: 8 corner pieces
      const coords = [-0.5, 0.5];
      for (const x of coords) {
        for (const y of coords) {
          for (const z of coords) {
            const cubie = new THREE.Group();
            cubie.position.set(x, y, z);
            cubie.userData = { initialCoord: { x, y, z } };

            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.castShadow = true;
            body.receiveShadow = true;
            cubie.add(body);

            faceDefs.forEach(def => {
              let isOuter = false;
              if (def.face === 'R' && x > 0) isOuter = true;
              if (def.face === 'L' && x < 0) isOuter = true;
              if (def.face === 'U' && y > 0) isOuter = true;
              if (def.face === 'D' && y < 0) isOuter = true;
              if (def.face === 'F' && z > 0) isOuter = true;
              if (def.face === 'B' && z < 0) isOuter = true;

              if (isOuter) {
                const colorInfo = FACE_COLORS[def.face];
                const stickerMat = createStickerMaterial(colorInfo.hex);

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
    } else if (this.dimension === 4) {
      // 4x4 Rubik's Revenge: 56 visible pieces (8 corners, 24 edges, 24 centers)
      const coords4 = [-1.5, -0.5, 0.5, 1.5];
      for (const x of coords4) {
        for (const y of coords4) {
          for (const z of coords4) {
            // Skip 8 internal core pieces
            if (Math.abs(x) < 1.0 && Math.abs(y) < 1.0 && Math.abs(z) < 1.0) continue;

            const cubie = new THREE.Group();
            cubie.position.set(x, y, z);
            cubie.userData = { initialCoord: { x, y, z } };

            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.castShadow = true;
            body.receiveShadow = true;
            cubie.add(body);

            faceDefs.forEach(def => {
              let isOuter = false;
              if (def.face === 'R' && x === 1.5) isOuter = true;
              if (def.face === 'L' && x === -1.5) isOuter = true;
              if (def.face === 'U' && y === 1.5) isOuter = true;
              if (def.face === 'D' && y === -1.5) isOuter = true;
              if (def.face === 'F' && z === 1.5) isOuter = true;
              if (def.face === 'B' && z === -1.5) isOuter = true;

              if (isOuter) {
                const colorInfo = FACE_COLORS[def.face];
                const stickerMat = createStickerMaterial(colorInfo.hex);

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
    } else {
      // 3x3 Rubik's Cube: 26 pieces
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

  // Snap orientation anchors to integer axes after whole-cube rotations
  snapOrientationAnchors() {
    if (!this.anchorMap || !this.orientationAnchors) return;
    for (const key of Object.keys(this.anchorMap)) {
      const a = this.anchorMap[key];
      a.position.x = Math.round(a.position.x);
      a.position.y = Math.round(a.position.y);
      a.position.z = Math.round(a.position.z);
    }
    this.orientationAnchors.updateMatrixWorld(true);
  }

  // Get the current world normal of a face's center piece
  getCenterNormal(faceChar) {
    if (this.anchorMap && this.anchorMap[faceChar]) {
      const pos = new THREE.Vector3();
      this.anchorMap[faceChar].getWorldPosition(pos);
      return new THREE.Vector3(
        Math.round(pos.x),
        Math.round(pos.y),
        Math.round(pos.z)
      ).normalize();
    }
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

      if (this.dimension === 2) {
        if (moveTypeOrParams.isSlice) return [];
        return this.cubies.filter(cubie => {
          cubie.getWorldPosition(cubiePos);
          return cubiePos.dot(normal) > 0.1;
        });
      }

      if (this.dimension === 4) {
        if (moveTypeOrParams.isWide) {
          // Wide turn: rotates both outer layer (1.5) and inner layer (0.5)
          return this.cubies.filter(cubie => {
            cubie.getWorldPosition(cubiePos);
            return cubiePos.dot(normal) > 0.1;
          });
        }
        if (moveTypeOrParams.isInnerSlice) {
          // Inner slice turn: rotates only the 2nd layer (0.5)
          return this.cubies.filter(cubie => {
            cubie.getWorldPosition(cubiePos);
            const dot = cubiePos.dot(normal);
            return dot > 0.1 && dot < 1.1;
          });
        }
        // Outer face turn on 4x4: only layer 4 (1.5)
        return this.cubies.filter(cubie => {
          cubie.getWorldPosition(cubiePos);
          return cubiePos.dot(normal) > 1.1;
        });
      }

      // 3x3 standard
      const targetDot = moveTypeOrParams.isSlice ? 0 : 1;
      return this.cubies.filter(cubie => {
        cubie.getWorldPosition(cubiePos);
        return Math.round(cubiePos.dot(normal)) === targetDot;
      });
    }

    const params = this.getMoveParams(moveTypeOrParams);
    return params ? this.getCubiesForMove(params) : [];
  }

  // Get rotation parameters: axis vector and angle
  getMoveParams(moveStr) {
    if (!moveStr) return null;
    const isPrime = moveStr.includes("'");
    const isDouble = moveStr.endsWith('2');

    // Whole-cube rotations
    const firstChar = moveStr[0];
    if (['x', 'y', 'z'].includes(firstChar)) {
      const axis = new THREE.Vector3(
        firstChar === 'x' ? 1 : 0,
        firstChar === 'y' ? 1 : 0,
        firstChar === 'z' ? 1 : 0
      );
      let baseAngle = -Math.PI / 2;
      let angle = isPrime ? -baseAngle : (isDouble ? baseAngle * 2 : baseAngle);
      return { axis, angle, face: firstChar, isPrime, isDouble, isWholeCube: true };
    }

    // 4x4 inner slice turn: e.g. '2R', '2R2', '2R''
    if (moveStr.startsWith('2') && moveStr.length >= 2 && ['U', 'D', 'L', 'R', 'F', 'B'].includes(moveStr[1].toUpperCase())) {
      const face = moveStr[1].toUpperCase();
      const normal = this.getCenterNormal(face);
      if (!normal) return null;
      let baseAngle = -Math.PI / 2;
      let angle = isPrime ? -baseAngle : (isDouble ? baseAngle * 2 : baseAngle);
      return {
        axis: normal,
        angle,
        face,
        normal,
        isPrime,
        isDouble,
        isInnerSlice: true,
        isWide: false,
        isSlice: false,
        isWholeCube: false,
      };
    }

    // Wide turns: e.g. 'Rw', 'Uw', or lowercase 'r', 'u', 'f', 'b', 'l', 'd'
    const isWide = moveStr.includes('w') || ['u', 'd', 'l', 'r', 'f', 'b'].includes(firstChar);
    const face = firstChar.toUpperCase();

    // Slice turns on 3x3: M, E, S
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
        normal,
        isPrime,
        isDouble,
        isSlice: true,
        isInnerSlice: false,
        isWide: false,
        isWholeCube: false,
      };
    }

    // Normal face turns or Wide turns bound to face normal
    const normal = this.getCenterNormal(face);
    if (!normal) return null;

    let baseAngle = -Math.PI / 2;
    let angle = isPrime ? -baseAngle : (isDouble ? baseAngle * 2 : baseAngle);

    return {
      axis: normal,
      angle,
      face,
      normal,
      isPrime,
      isDouble,
      isWide: isWide && this.dimension >= 4,
      isInnerSlice: false,
      isSlice: false,
      isWholeCube: false,
    };
  }

  // Queue a single move or space-separated moves
  twist(moveStr, options = {}) {
    const moves = moveStr.trim().split(/\s+/).filter(m => m.length > 0);
    if (moves.length === 0) return;

    moves.forEach(m => {
      if (options.record !== false) {
        this.moveHistory.push(m);
      }
      this.moveQueue.push({ move: m, options });
    });

    if (!this.isAnimating) {
      this.processNextMove();
    }
  }

  // Execute immediately without animation
  twistInstant(moveStr, options = {}) {
    if (!moveStr) return;
    const moves = moveStr.trim().split(/\s+/).filter(m => m.length > 0);
    moves.forEach(m => {
      if (options.record !== false) {
        this.moveHistory.push(m);
      }
      const params = this.getMoveParams(m);
      if (!params) return;

      const sliceCubies = this.getCubiesForMove(params);
      const pivot = new THREE.Group();
      this.cubeGroup.add(pivot);

      if (params.isWholeCube && this.orientationAnchors) {
        pivot.attach(this.orientationAnchors);
      }
      sliceCubies.forEach(c => pivot.attach(c));
      pivot.rotateOnAxis(params.axis, params.angle);
      pivot.updateMatrixWorld(true);

      sliceCubies.forEach(c => {
        this.cubeGroup.attach(c);
        this.snapCubie(c);
      });
      if (params.isWholeCube && this.orientationAnchors) {
        this.cubeGroup.attach(this.orientationAnchors);
        this.snapOrientationAnchors();
      }

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

    if (params.isWholeCube && this.orientationAnchors) {
      pivot.attach(this.orientationAnchors);
    }
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
        if (params.isWholeCube && this.orientationAnchors) {
          this.cubeGroup.attach(this.orientationAnchors);
          this.snapOrientationAnchors();
        }

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
    if (this.dimension === 2) {
      cubie.position.x = Math.round(cubie.position.x * 2) / 2;
      cubie.position.y = Math.round(cubie.position.y * 2) / 2;
      cubie.position.z = Math.round(cubie.position.z * 2) / 2;
    } else if (this.dimension === 4) {
      const snapHalf = (v) => Math.round(v - 0.5) + 0.5;
      cubie.position.x = snapHalf(cubie.position.x);
      cubie.position.y = snapHalf(cubie.position.y);
      cubie.position.z = snapHalf(cubie.position.z);
    } else {
      cubie.position.x = Math.round(cubie.position.x);
      cubie.position.y = Math.round(cubie.position.y);
      cubie.position.z = Math.round(cubie.position.z);
    }

    const euler = new THREE.Euler().setFromQuaternion(cubie.quaternion, 'XYZ');
    const snapAngle = (a) => Math.round(a / (Math.PI / 2)) * (Math.PI / 2);
    euler.x = snapAngle(euler.x);
    euler.y = snapAngle(euler.y);
    euler.z = snapAngle(euler.z);

    cubie.quaternion.setFromEuler(euler);
    cubie.updateMatrixWorld(true);
  }

  // Extract the facelet state in standard URFDLB order for solver (24 facelets for 2x2, 54 for 3x3)
  getFaceletString() {
    this.cubeGroup.updateMatrixWorld(true);

    const U = this.getCenterNormal('U');
    const D = this.getCenterNormal('D');
    const F = this.getCenterNormal('F');
    const B = this.getCenterNormal('B');
    const R = this.getCenterNormal('R');
    const L = this.getCenterNormal('L');

    const faceNormals = { U, R, F, D, L, B };
    const tempNormal = new THREE.Vector3();
    const cubiePos = new THREE.Vector3();

    if (this.dimension === 4) {
      const faceAxes = {
        U: { N: U, up: B, right: R },
        R: { N: R, up: U, right: B },
        F: { N: F, up: U, right: R },
        D: { N: D, up: F, right: R },
        L: { N: L, up: U, right: F },
        B: { N: B, up: U, right: L },
      };

      const rowMults = [1.5, 0.5, -0.5, -1.5];
      const colMults = [-1.5, -0.5, 0.5, 1.5];
      const order = ['U', 'R', 'F', 'D', 'L', 'B'];
      let result = '';

      for (const faceKey of order) {
        const { N, up, right } = faceAxes[faceKey];
        const targetNormal = faceNormals[faceKey];

        for (const r of rowMults) {
          for (const c of colMults) {
            const targetSlot = new THREE.Vector3()
              .addScaledVector(N, 1.5)
              .addScaledVector(up, r)
              .addScaledVector(right, c);

            let matchedSticker = null;
            for (const cubie of this.cubies) {
              cubie.getWorldPosition(cubiePos);
              if (cubiePos.distanceTo(targetSlot) < 0.4) {
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
              result += faceKey;
            }
          }
        }
      }

      return result;
    }

    if (this.dimension === 2) {
      const faceSlots2x2 = {
        U: [
          new THREE.Vector3().add(U).add(B).add(L).multiplyScalar(0.5),
          new THREE.Vector3().add(U).add(B).add(R).multiplyScalar(0.5),
          new THREE.Vector3().add(U).add(F).add(L).multiplyScalar(0.5),
          new THREE.Vector3().add(U).add(F).add(R).multiplyScalar(0.5),
        ],
        R: [
          new THREE.Vector3().add(R).add(U).add(F).multiplyScalar(0.5),
          new THREE.Vector3().add(R).add(U).add(B).multiplyScalar(0.5),
          new THREE.Vector3().add(R).add(D).add(F).multiplyScalar(0.5),
          new THREE.Vector3().add(R).add(D).add(B).multiplyScalar(0.5),
        ],
        F: [
          new THREE.Vector3().add(F).add(U).add(L).multiplyScalar(0.5),
          new THREE.Vector3().add(F).add(U).add(R).multiplyScalar(0.5),
          new THREE.Vector3().add(F).add(D).add(L).multiplyScalar(0.5),
          new THREE.Vector3().add(F).add(D).add(R).multiplyScalar(0.5),
        ],
        D: [
          new THREE.Vector3().add(D).add(F).add(L).multiplyScalar(0.5),
          new THREE.Vector3().add(D).add(F).add(R).multiplyScalar(0.5),
          new THREE.Vector3().add(D).add(B).add(L).multiplyScalar(0.5),
          new THREE.Vector3().add(D).add(B).add(R).multiplyScalar(0.5),
        ],
        L: [
          new THREE.Vector3().add(L).add(U).add(B).multiplyScalar(0.5),
          new THREE.Vector3().add(L).add(U).add(F).multiplyScalar(0.5),
          new THREE.Vector3().add(L).add(D).add(B).multiplyScalar(0.5),
          new THREE.Vector3().add(L).add(D).add(F).multiplyScalar(0.5),
        ],
        B: [
          new THREE.Vector3().add(B).add(U).add(R).multiplyScalar(0.5),
          new THREE.Vector3().add(B).add(U).add(L).multiplyScalar(0.5),
          new THREE.Vector3().add(B).add(D).add(R).multiplyScalar(0.5),
          new THREE.Vector3().add(B).add(D).add(L).multiplyScalar(0.5),
        ],
      };

      const order = ['U', 'R', 'F', 'D', 'L', 'B'];
      let result = '';

      for (const faceKey of order) {
        const slots = faceSlots2x2[faceKey];
        const targetNormal = faceNormals[faceKey];

        for (const targetSlot of slots) {
          let matchedSticker = null;

          for (const cubie of this.cubies) {
            cubie.getWorldPosition(cubiePos);
            if (cubiePos.distanceTo(targetSlot) < 0.3) {
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
            console.warn(`Could not find 2x2 sticker at ${faceKey} slot`, targetSlot);
            result += faceKey;
          }
        }
      }

      return result;
    }

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
    this.moveHistory = [];
    this.isAnimating = false;
    this.buildCube();
    this.queueEmptyListeners.forEach(fn => {
      try { fn(); } catch (err) { console.error('[RubiksCube] queueEmptyListener error:', err); }
    });
  }
}
