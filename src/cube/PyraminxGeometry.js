import * as THREE from 'three';
import {
  FACE_COLORS,
  getActiveFaceColors,
  createBodyMaterial,
  createStickerMaterial,
} from './CubeColors.js';

// Regular tetrahedron constants
// Edge length a = 3.2
export const PYRA_EDGE = 3.2;
export const PYRA_RC = Math.sqrt(3 / 8) * PYRA_EDGE; // ~1.95959
export const PYRA_RBASE = PYRA_EDGE / Math.sqrt(3); // ~1.84752
export const PYRA_RIN = PYRA_RC / 3; // ~0.65320

// 4 Vertices of regular tetrahedron centered at origin
export const VERTICES = {
  U: new THREE.Vector3(0, PYRA_RC, 0),
  B: new THREE.Vector3(0, -PYRA_RIN, -PYRA_RBASE),
  R: new THREE.Vector3(PYRA_EDGE / 2, -PYRA_RIN, PYRA_RBASE / 2),
  L: new THREE.Vector3(-PYRA_EDGE / 2, -PYRA_RIN, PYRA_RBASE / 2),
};

// Unit axis vectors pointing from origin to each vertex
export const AXIS_VECTORS = {
  U: VERTICES.U.clone().normalize(),
  B: VERTICES.B.clone().normalize(),
  R: VERTICES.R.clone().normalize(),
  L: VERTICES.L.clone().normalize(),
};

// 4 Faces with their 3 corner vertices in counter-clockwise order when viewed from outside
// Outward face normal is directly opposite to the opposing vertex
export const FACES = {
  F: {
    key: 'F',
    name: 'Front',
    colorKey: 'F', // Green
    vertices: ['U', 'L', 'R'],
    normal: VERTICES.B.clone().negate().normalize(),
  },
  R: {
    key: 'R',
    name: 'Right',
    colorKey: 'R', // Red
    vertices: ['U', 'R', 'B'],
    normal: VERTICES.L.clone().negate().normalize(),
  },
  L: {
    key: 'L',
    name: 'Left',
    colorKey: 'B', // Blue (using standard cube Blue)
    vertices: ['U', 'B', 'L'],
    normal: VERTICES.R.clone().negate().normalize(),
  },
  D: {
    key: 'D',
    name: 'Down',
    colorKey: 'D', // Yellow
    vertices: ['L', 'B', 'R'],
    normal: VERTICES.U.clone().negate().normalize(),
  },
};

// Helper: interpolate barycentric coordinate on face triangle
function bary(v0, v1, v2, u, v, w) {
  return new THREE.Vector3(
    (u * v0.x + v * v1.x + w * v2.x) / 3,
    (u * v0.y + v * v1.y + w * v2.y) / 3,
    (u * v0.z + v * v1.z + w * v2.z) / 3
  );
}

// Inset a triangle towards its centroid to create clean sticker borders
function createInsetTriangleGeometry(p0, p1, p2, normal, scale = 0.86, offsetDist = 0.014) {
  const center = new THREE.Vector3()
    .add(p0)
    .add(p1)
    .add(p2)
    .divideScalar(3);

  let q0 = p0.clone().sub(center).multiplyScalar(scale).add(center).addScaledVector(normal, offsetDist);
  let q1 = p1.clone().sub(center).multiplyScalar(scale).add(center).addScaledVector(normal, offsetDist);
  let q2 = p2.clone().sub(center).multiplyScalar(scale).add(center).addScaledVector(normal, offsetDist);

  // Ensure CCW winding order with respect to outward normal
  const testNorm = new THREE.Vector3().crossVectors(
    q1.clone().sub(q0),
    q2.clone().sub(q0)
  );
  if (testNorm.dot(normal) < 0) {
    const tmp = q1;
    q1 = q2;
    q2 = tmp;
  }

  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array([
    q0.x, q0.y, q0.z,
    q1.x, q1.y, q1.z,
    q2.x, q2.y, q2.z,
  ]);
  const normals = new Float32Array([
    normal.x, normal.y, normal.z,
    normal.x, normal.y, normal.z,
    normal.x, normal.y, normal.z,
  ]);

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return geom;
}

// Build a watertight, closed convex polyhedron geometry from its unique vertices
// (Tetrahedron for tips and edges, Octahedron for centers)
function createClosedPieceBodyGeometry(uniqueVertices, centroid, scale = 0.965) {
  const n = uniqueVertices.length;
  const positions = [];
  const normals = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const p0 = uniqueVertices[i];
        const p1 = uniqueVertices[j];
        const p2 = uniqueVertices[k];

        const normal = new THREE.Vector3().crossVectors(
          p1.clone().sub(p0),
          p2.clone().sub(p0)
        );
        if (normal.lengthSq() < 1e-6) continue;
        normal.normalize();

        // Check if all other vertices lie on one side of this plane
        let hasPos = false;
        let hasNeg = false;

        for (let m = 0; m < n; m++) {
          if (m === i || m === j || m === k) continue;
          const dist = uniqueVertices[m].clone().sub(p0).dot(normal);
          if (dist > 1e-4) hasPos = true;
          if (dist < -1e-4) hasNeg = true;
        }

        // If vertices lie on both sides, this plane is not on the convex hull
        if (hasPos && hasNeg) continue;

        const faceMid = new THREE.Vector3().add(p0).add(p1).add(p2).divideScalar(3);
        const outDir = faceMid.clone().sub(centroid);

        let vA = p0, vB = p1, vC = p2;
        if (hasPos) {
          normal.negate();
          vB = p2;
          vC = p1;
        } else {
          if (normal.dot(outDir) < 0) {
            normal.negate();
            vB = p2;
            vC = p1;
          }
        }

        // Scale vertices towards centroid for clean piece borders and gaps
        const q0 = vA.clone().sub(centroid).multiplyScalar(scale);
        const q1 = vB.clone().sub(centroid).multiplyScalar(scale);
        const q2 = vC.clone().sub(centroid).multiplyScalar(scale);

        positions.push(q0.x, q0.y, q0.z, q1.x, q1.y, q1.z, q2.x, q2.y, q2.z);
        for (let c = 0; c < 3; c++) {
          normals.push(normal.x, normal.y, normal.z);
        }
      }
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geom.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
  return geom;
}

export function buildPyraminxPieces() {
  const pieces = [];
  const allStickers = [];

  // Group triangles by piece
  // 14 pieces:
  // 4 Tips: tip_U, tip_L, tip_R, tip_B
  // 4 Centers: center_U, center_L, center_R, center_B
  // 6 Edges: edge_UL, edge_UR, edge_UB, edge_LR, edge_LB, edge_RB
  const pieceTriangles = {};

  const getOrCreatePiece = (id, type, vertexAxis = null) => {
    if (!pieceTriangles[id]) {
      pieceTriangles[id] = {
        id,
        type,
        vertexAxis,
        triangles: [],
      };
    }
    return pieceTriangles[id];
  };

  // Standard edge key helper (alphabetical for unordered pairs)
  const edgeKey = (v1, v2) => {
    const pair = [v1, v2].sort().join('');
    return `edge_${pair}`;
  };

  // Generate 9 triangles for each of the 4 faces
  Object.values(FACES).forEach(faceDef => {
    const vNames = faceDef.vertices;
    const V0 = VERTICES[vNames[0]];
    const V1 = VERTICES[vNames[1]];
    const V2 = VERTICES[vNames[2]];
    const normal = faceDef.normal;

    // 1. Tip at V0
    getOrCreatePiece(`tip_${vNames[0]}`, 'tip', vNames[0]).triangles.push({
      p0: bary(V0, V1, V2, 3, 0, 0),
      p1: bary(V0, V1, V2, 2, 1, 0),
      p2: bary(V0, V1, V2, 2, 0, 1),
      normal,
      faceKey: faceDef.key,
      colorKey: faceDef.colorKey,
      pieceId: `tip_${vNames[0]}`,
      pieceType: 'tip',
    });

    // 2. Center at V0 (inverted triangle)
    getOrCreatePiece(`center_${vNames[0]}`, 'center', vNames[0]).triangles.push({
      p0: bary(V0, V1, V2, 2, 1, 0),
      p1: bary(V0, V1, V2, 1, 1, 1),
      p2: bary(V0, V1, V2, 2, 0, 1),
      normal,
      faceKey: faceDef.key,
      colorKey: faceDef.colorKey,
      pieceId: `center_${vNames[0]}`,
      pieceType: 'center',
    });

    // 3. Edge between V0 and V1
    getOrCreatePiece(edgeKey(vNames[0], vNames[1]), 'edge').triangles.push({
      p0: bary(V0, V1, V2, 2, 1, 0),
      p1: bary(V0, V1, V2, 1, 2, 0),
      p2: bary(V0, V1, V2, 1, 1, 1),
      normal,
      faceKey: faceDef.key,
      colorKey: faceDef.colorKey,
      pieceId: edgeKey(vNames[0], vNames[1]),
      pieceType: 'edge',
    });

    // 4. Edge between V0 and V2
    getOrCreatePiece(edgeKey(vNames[0], vNames[2]), 'edge').triangles.push({
      p0: bary(V0, V1, V2, 2, 0, 1),
      p1: bary(V0, V1, V2, 1, 1, 1),
      p2: bary(V0, V1, V2, 1, 0, 2),
      normal,
      faceKey: faceDef.key,
      colorKey: faceDef.colorKey,
      pieceId: edgeKey(vNames[0], vNames[2]),
      pieceType: 'edge',
    });

    // 5. Tip at V1
    getOrCreatePiece(`tip_${vNames[1]}`, 'tip', vNames[1]).triangles.push({
      p0: bary(V0, V1, V2, 1, 2, 0),
      p1: bary(V0, V1, V2, 0, 3, 0),
      p2: bary(V0, V1, V2, 0, 2, 1),
      normal,
      faceKey: faceDef.key,
      colorKey: faceDef.colorKey,
      pieceId: `tip_${vNames[1]}`,
      pieceType: 'tip',
    });

    // 6. Center at V1 (inverted triangle)
    getOrCreatePiece(`center_${vNames[1]}`, 'center', vNames[1]).triangles.push({
      p0: bary(V0, V1, V2, 1, 2, 0),
      p1: bary(V0, V1, V2, 0, 2, 1),
      p2: bary(V0, V1, V2, 1, 1, 1),
      normal,
      faceKey: faceDef.key,
      colorKey: faceDef.colorKey,
      pieceId: `center_${vNames[1]}`,
      pieceType: 'center',
    });

    // 7. Edge between V1 and V2
    getOrCreatePiece(edgeKey(vNames[1], vNames[2]), 'edge').triangles.push({
      p0: bary(V0, V1, V2, 1, 1, 1),
      p1: bary(V0, V1, V2, 0, 2, 1),
      p2: bary(V0, V1, V2, 0, 1, 2),
      normal,
      faceKey: faceDef.key,
      colorKey: faceDef.colorKey,
      pieceId: edgeKey(vNames[1], vNames[2]),
      pieceType: 'edge',
    });

    // 8. Center at V2 (inverted triangle)
    getOrCreatePiece(`center_${vNames[2]}`, 'center', vNames[2]).triangles.push({
      p0: bary(V0, V1, V2, 1, 1, 1),
      p1: bary(V0, V1, V2, 0, 1, 2),
      p2: bary(V0, V1, V2, 1, 0, 2),
      normal,
      faceKey: faceDef.key,
      colorKey: faceDef.colorKey,
      pieceId: `center_${vNames[2]}`,
      pieceType: 'center',
    });

    // 9. Tip at V2
    getOrCreatePiece(`tip_${vNames[2]}`, 'tip', vNames[2]).triangles.push({
      p0: bary(V0, V1, V2, 1, 0, 2),
      p1: bary(V0, V1, V2, 0, 1, 2),
      p2: bary(V0, V1, V2, 0, 0, 3),
      normal,
      faceKey: faceDef.key,
      colorKey: faceDef.colorKey,
      pieceId: `tip_${vNames[2]}`,
      pieceType: 'tip',
    });
  });

  const bodyMaterial = createBodyMaterial();

  // Create 3D Groups for each of the 14 pieces
  Object.values(pieceTriangles).forEach(pDef => {
    const pieceGroup = new THREE.Group();
    pieceGroup.name = pDef.id;

    // Extract unique vertices for this piece
    const uniqueVerts = [];
    pDef.triangles.forEach(t => {
      [t.p0, t.p1, t.p2].forEach(pt => {
        if (!uniqueVerts.some(u => u.distanceTo(pt) < 1e-4)) {
          uniqueVerts.push(pt);
        }
      });
    });

    // Compute piece geometric centroid
    const pieceCentroid = new THREE.Vector3();
    uniqueVerts.forEach(pt => pieceCentroid.add(pt));
    pieceCentroid.divideScalar(uniqueVerts.length);

    pieceGroup.position.copy(pieceCentroid);
    pieceGroup.userData = {
      pieceId: pDef.id,
      pieceType: pDef.type,
      vertexAxis: pDef.vertexAxis,
      initialCoord: pieceCentroid.clone(),
    };

    // Build solid, closed convex polyhedron body geometry (no overhangs or spikes)
    const bodyGeom = createClosedPieceBodyGeometry(uniqueVerts, pieceCentroid, 0.965);
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    pieceGroup.add(bodyMesh);

    // Add stickers on exterior faces
    pDef.triangles.forEach(t => {
      const lp0 = t.p0.clone().sub(pieceCentroid);
      const lp1 = t.p1.clone().sub(pieceCentroid);
      const lp2 = t.p2.clone().sub(pieceCentroid);

      const stickerGeom = createInsetTriangleGeometry(lp0, lp1, lp2, t.normal, 0.86, 0.014);
      const activeColors = getActiveFaceColors();
      const colorInfo = activeColors[t.colorKey] || FACE_COLORS[t.colorKey];
      const stickerMat = createStickerMaterial(colorInfo.hex);
      const stickerMesh = new THREE.Mesh(stickerGeom, stickerMat);

      stickerMesh.userData = {
        faceChar: t.faceKey,
        originalFace: t.faceKey,
        cubie: pieceGroup,
        pieceId: pDef.id,
        pieceType: pDef.type,
        vertexAxis: pDef.vertexAxis,
        localNormal: t.normal.clone(),
        defaultColor: colorInfo.hex,
      };

      pieceGroup.add(stickerMesh);
      allStickers.push(stickerMesh);
    });

    pieces.push(pieceGroup);
  });

  return { pieces, allStickers };
}

// Get rotation parameters for Pyraminx moves: U, L, R, B, u, l, r, b, whole puzzle x, y, z
export function getPyraminxMoveParams(moveStr) {
  if (!moveStr) return null;
  const isPrime = moveStr.includes("'");
  const firstChar = moveStr[0];

  // Whole puzzle rotation (x, y, z)
  if (['x', 'y', 'z'].includes(firstChar.toLowerCase()) && !['u', 'r', 'l', 'b'].includes(firstChar.toLowerCase())) {
    const axis = new THREE.Vector3(
      firstChar.toLowerCase() === 'x' ? 1 : 0,
      firstChar.toLowerCase() === 'y' ? 1 : 0,
      firstChar.toLowerCase() === 'z' ? 1 : 0
    );
    const baseAngle = -Math.PI / 2;
    const angle = isPrime ? -baseAngle : baseAngle;
    return { axis, angle, face: firstChar, isPrime, isWholeCube: true };
  }

  const isTipMove = ['u', 'l', 'r', 'b'].includes(firstChar);
  const vertexKey = firstChar.toUpperCase();

  if (!AXIS_VECTORS[vertexKey]) return null;

  const axis = AXIS_VECTORS[vertexKey].clone();
  // Clockwise 120° = -2*PI/3 (right hand rule looking along outward axis towards center)
  const baseAngle = (-2 * Math.PI) / 3;
  const angle = isPrime ? -baseAngle : baseAngle;

  return {
    axis,
    angle,
    face: vertexKey,
    isPrime,
    isTipMove,
    vertexKey,
    isPyraminx: true,
  };
}

// Determine which pieces move during a Pyraminx move
export function getPyraminxPiecesForMove(pieces, params) {
  if (!params) return [];
  if (params.isWholeCube) return pieces;

  const vertexKey = params.vertexKey;
  const axis = params.axis;

  if (params.isTipMove) {
    // Only the single tip piece at this vertex moves
    const tipId = `tip_${vertexKey}`;
    return pieces.filter(p => p.userData.pieceId === tipId);
  }

  // Capital letter turn (U, L, R, B):
  // The vertex tip, vertex center, and the 3 edges meeting at this vertex all rotate!
  // In coordinates along vertex axis: their centroids have dot product > 0.05
  const piecePos = new THREE.Vector3();
  return pieces.filter(p => {
    p.getWorldPosition(piecePos);
    return piecePos.dot(axis) > 0.1;
  });
}

// Snap Pyraminx pieces after rotation to prevent coordinate or quaternion drift
export function snapPyraminxPiece(piece, initialPositions) {
  const currentPos = new THREE.Vector3();
  piece.getWorldPosition(currentPos);

  // Find nearest nominal slot among the same piece type
  let bestSlot = null;
  let minDist = Infinity;

  const targetSlots = initialPositions[piece.userData.pieceType] || [];
  targetSlots.forEach(slot => {
    const dist = currentPos.distanceTo(slot);
    if (dist < minDist) {
      minDist = dist;
      bestSlot = slot;
    }
  });

  if (bestSlot && minDist < 0.8) {
    piece.position.copy(bestSlot);
  }

  // Normalize rotation quaternion
  piece.quaternion.normalize();
  piece.updateMatrixWorld(true);
}
