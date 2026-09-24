import * as THREE from 'three';

export const THEMES = {
  classic: {
    name: 'Standard Classic',
    faces: {
      U: { name: 'White',  hex: 0xfafafa, css: '#fafafa', char: 'U' },
      D: { name: 'Yellow', hex: 0xffd500, css: '#ffd500', char: 'D' },
      F: { name: 'Green',  hex: 0x009b48, css: '#009b48', char: 'F' },
      B: { name: 'Blue',   hex: 0x0046ad, css: '#0046ad', char: 'B' },
      R: { name: 'Red',    hex: 0xb71234, css: '#b71234', char: 'R' },
      L: { name: 'Orange', hex: 0xff5800, css: '#ff5800', char: 'L' },
    },
  },
  stickerless_bright: {
    name: 'Stickerless Fluoro',
    faces: {
      U: { name: 'White',  hex: 0xffffff, css: '#ffffff', char: 'U' },
      D: { name: 'Yellow', hex: 0xffee00, css: '#ffee00', char: 'D' },
      F: { name: 'Green',  hex: 0x00d053, css: '#00d053', char: 'F' },
      B: { name: 'Blue',   hex: 0x0084ff, css: '#0084ff', char: 'B' },
      R: { name: 'Red',    hex: 0xff253b, css: '#ff253b', char: 'R' },
      L: { name: 'Orange', hex: 0xff7b00, css: '#ff7b00', char: 'L' },
    },
  },
  pastel: {
    name: 'Pastel / Soft',
    faces: {
      U: { name: 'White',  hex: 0xf2f4f8, css: '#f2f4f8', char: 'U' },
      D: { name: 'Yellow', hex: 0xffe680, css: '#ffe680', char: 'D' },
      F: { name: 'Green',  hex: 0x76d7a4, css: '#76d7a4', char: 'F' },
      B: { name: 'Blue',   hex: 0x70a5e6, css: '#70a5e6', char: 'B' },
      R: { name: 'Red',    hex: 0xf27986, css: '#f27986', char: 'R' },
      L: { name: 'Orange', hex: 0xffb366, css: '#ffb366', char: 'L' },
    },
  },
  carbon_dark: {
    name: 'Carbon Dark',
    faces: {
      U: { name: 'White',  hex: 0xdcdcdc, css: '#dcdcdc', char: 'U' },
      D: { name: 'Yellow', hex: 0xd4af37, css: '#d4af37', char: 'D' },
      F: { name: 'Green',  hex: 0x008f5a, css: '#008f5a', char: 'F' },
      B: { name: 'Blue',   hex: 0x1a5bb8, css: '#1a5bb8', char: 'B' },
      R: { name: 'Red',    hex: 0x99112a, css: '#99112a', char: 'R' },
      L: { name: 'Orange', hex: 0xcc4400, css: '#cc4400', char: 'L' },
    },
  },
};

export const PLASTICS = {
  black:   { name: 'Black Plastic',   hex: 0x121214, roughness: 0.80, metalness: 0.10 },
  white:   { name: 'White Plastic',   hex: 0xdedede, roughness: 0.70, metalness: 0.05 },
  primary: { name: 'Primary Plastic', hex: 0xded0b8, roughness: 0.75, metalness: 0.08 },
};

let currentTheme = 'classic';
let currentPlastic = 'black';

export function getActiveTheme() {
  return currentTheme;
}

export function setActiveTheme(themeKey) {
  if (THEMES[themeKey]) {
    currentTheme = themeKey;
  }
}

export function getActivePlastic() {
  return currentPlastic;
}

export function setActivePlastic(plasticKey) {
  if (PLASTICS[plasticKey]) {
    currentPlastic = plasticKey;
  }
}

export function getActiveFaceColors() {
  return THEMES[currentTheme].faces;
}

export const FACE_COLORS = THEMES.classic.faces;

export const CORE_COLOR = PLASTICS.black.hex;
export const CORE_ROUGHNESS = 0.8;
export const STICKER_ROUGHNESS = 0.35;
export const STICKER_METALNESS = 0.05;

// Create material for plastic cubie body
export function createBodyMaterial() {
  const plastic = PLASTICS[currentPlastic] || PLASTICS.black;
  return new THREE.MeshStandardMaterial({
    color: plastic.hex,
    roughness: plastic.roughness,
    metalness: plastic.metalness,
  });
}

// Create material for a colored face sticker
export function createStickerMaterial(colorHex, transparent = false, opacity = 1.0) {
  return new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: STICKER_ROUGHNESS,
    metalness: STICKER_METALNESS,
    transparent,
    opacity,
  });
}

const FACE_LABELS = {
  U: { letter: 'U', name: 'TOP' },
  D: { letter: 'D', name: 'BOTTOM' },
  F: { letter: 'F', name: 'FRONT' },
  B: { letter: 'B', name: 'BACK' },
  R: { letter: 'R', name: 'RIGHT' },
  L: { letter: 'L', name: 'LEFT' },
};

// Create material for the center sticker with the face letter badge
export function createCenterStickerMaterial(faceChar, colorHex) {
  if (typeof document === 'undefined') {
    return createStickerMaterial(colorHex);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const hexStr = `#${colorHex.toString(16).padStart(6, '0')}`;
  const isLightBg = faceChar === 'U' || faceChar === 'D';
  const textColor = isLightBg ? '#111827' : '#ffffff';
  const badgeBg = isLightBg ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)';
  const badgeBorder = isLightBg ? 'rgba(0, 0, 0, 0.28)' : 'rgba(255, 255, 255, 0.45)';

  // Fill background sticker color
  ctx.fillStyle = hexStr;
  ctx.fillRect(0, 0, 256, 256);

  // Circular badge
  ctx.beginPath();
  ctx.arc(128, 128, 86, 0, Math.PI * 2);
  ctx.fillStyle = badgeBg;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = badgeBorder;
  ctx.stroke();

  // Face letter
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 96px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(faceChar, 128, 112);

  // Subtitle (face name)
  const labelInfo = FACE_LABELS[faceChar] || { name: '' };
  ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(labelInfo.name, 128, 172);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: STICKER_ROUGHNESS,
    metalness: STICKER_METALNESS,
  });
}
