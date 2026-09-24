// MegaminxGeometry.js - Foundational geometry math and topology for 12-sided Dodecahedron puzzle
import * as THREE from 'three';

// Golden ratio phi = (1 + sqrt(5)) / 2
export const PHI = (1 + Math.sqrt(5)) / 2;
export const INV_PHI = 1 / PHI;

// Scale factor so circumradius Rc is comfortable in 3D viewport
export const MEGAMINX_RADIUS = 2.4;

// 20 Vertices of a regular dodecahedron centered at the origin
function computeDodecahedronVertices() {
  const norm = Math.sqrt(3);
  const scale = MEGAMINX_RADIUS / norm;

  const raw = [];
  // 8 vertices of a cube: (±1, ±1, ±1)
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        raw.push(new THREE.Vector3(x, y, z));
      }
    }
  }
  // 12 vertices: cyclic permutations of (0, ±1/phi, ±phi)
  for (const b of [-INV_PHI, INV_PHI]) {
    for (const c of [-PHI, PHI]) {
      raw.push(new THREE.Vector3(0, b, c));
      raw.push(new THREE.Vector3(c, 0, b));
      raw.push(new THREE.Vector3(b, c, 0));
    }
  }

  return raw.map(v => v.multiplyScalar(scale));
}

export const DODECA_VERTICES = computeDodecahedronVertices();

// 12 Faces of Megaminx with 12 distinct tournament standard colors
export const MEGAMINX_COLORS = {
  U:  { name: 'White',       hex: 0xffffff, css: '#ffffff' },
  F:  { name: 'Red',         hex: 0xd91e2a, css: '#d91e2a' },
  BL: { name: 'Dark Blue',   hex: 0x0d47a1, css: '#0d47a1' },
  BR: { name: 'Dark Green',  hex: 0x1b5e20, css: '#1b5e20' },
  L:  { name: 'Purple',      hex: 0x7b1fa2, css: '#7b1fa2' },
  R:  { name: 'Yellow',      hex: 0xffd600, css: '#ffd600' },
  D:  { name: 'Grey',        hex: 0x78909c, css: '#78909c' },
  DF: { name: 'Pink',        hex: 0xf06292, css: '#f06292' },
  DBL:{ name: 'Light Blue',  hex: 0x29b6f6, css: '#29b6f6' },
  DBR:{ name: 'Light Green', hex: 0x66bb6a, css: '#66bb6a' },
  DL: { name: 'Orange',      hex: 0xf57c00, css: '#f57c00' },
  DR: { name: 'Cream',       hex: 0xfff59d, css: '#fff59d' },
};

// 12 Face center unit normals computed from regular dodecahedron face planes
export function computeFaceNormals() {
  const normals = {};
  const c1 = 1 / Math.sqrt(1 + PHI * PHI);
  const c2 = PHI * c1;

  // Face normal vectors: (±c1, 0, ±c2), (±c2, ±c1, 0), (0, ±c2, ±c1)
  const faceKeys = Object.keys(MEGAMINX_COLORS);
  const vectors = [
    new THREE.Vector3(0, 1, 0),                                 // U
    new THREE.Vector3(0, -1, 0),                                // D
    new THREE.Vector3(0, c1, c2).normalize(),                   // F
    new THREE.Vector3(0, -c1, -c2).normalize(),                 // DF
    new THREE.Vector3(c2, 0, c1).normalize(),                   // R
    new THREE.Vector3(-c2, 0, -c1).normalize(),                 // L
    new THREE.Vector3(-c1, c2, 0).normalize(),                  // BL
    new THREE.Vector3(c1, -c2, 0).normalize(),                  // DBR
    new THREE.Vector3(c1, c2, 0).normalize(),                   // BR
    new THREE.Vector3(-c1, -c2, 0).normalize(),                 // DL
    new THREE.Vector3(-c2, 0, c1).normalize(),                  // DBL
    new THREE.Vector3(c2, 0, -c1).normalize(),                  // DR
  ];

  faceKeys.forEach((key, idx) => {
    normals[key] = vectors[idx];
  });

  return normals;
}

export const MEGAMINX_FACE_NORMALS = computeFaceNormals();
