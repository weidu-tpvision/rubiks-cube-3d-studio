import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CubeInteraction } from '../src/cube/CubeInteraction.js';

describe('CubeInteraction Cursor & Orbit State Management', () => {
  let dummyCube;
  let dummyCamera;
  let dummyCanvas;
  let dummyOrbitControls;
  let interaction;

  beforeEach(() => {
    dummyCube = {
      dimension: 3,
      puzzleType: '3x3',
      isAnimating: false,
      allStickers: [],
    };
    dummyCamera = new THREE.PerspectiveCamera();
    dummyCanvas = {
      style: { cursor: 'default' },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      addEventListener: () => {},
    };
    dummyOrbitControls = { enabled: true };

    interaction = new CubeInteraction(dummyCube, dummyCamera, dummyCanvas, dummyOrbitControls);
  });

  it('determines turnable stickers accurately on 3x3', () => {
    // 3x3 Corner piece (pos: 1, 1, 1) -> sum of abs = 3 >= 2
    const cornerParent = new THREE.Object3D();
    cornerParent.position.set(1, 1, 1);
    const cornerSticker = { parent: cornerParent };
    expect(interaction.isTurnableSticker(cornerSticker)).toBe(true);

    // 3x3 Edge piece (pos: 1, 0, 1) -> sum of abs = 2 >= 2
    const edgeParent = new THREE.Object3D();
    edgeParent.position.set(1, 0, 1);
    const edgeSticker = { parent: edgeParent };
    expect(interaction.isTurnableSticker(edgeSticker)).toBe(true);

    // 3x3 Center piece (pos: 1, 0, 0) -> sum of abs = 1 < 2
    const centerParent = new THREE.Object3D();
    centerParent.position.set(1, 0, 0);
    const centerSticker = { parent: centerParent };
    expect(interaction.isTurnableSticker(centerSticker)).toBe(false);
  });

  it('treats all stickers as turnable on 2x2, 4x4, and Pyraminx', () => {
    dummyCube.dimension = 2;
    const sticker = { parent: new THREE.Object3D() };
    expect(interaction.isTurnableSticker(sticker)).toBe(true);

    dummyCube.dimension = 4;
    expect(interaction.isTurnableSticker(sticker)).toBe(true);

    dummyCube.dimension = 3;
    dummyCube.puzzleType = 'pyraminx';
    expect(interaction.isTurnableSticker(sticker)).toBe(true);
  });

  it('sets pointer on turnable layer hover and default on background', () => {
    interaction.updateCursor(true);
    expect(dummyCanvas.style.cursor).toBe('pointer');

    interaction.updateCursor(false);
    expect(dummyCanvas.style.cursor).toBe('default');
  });

  it('activates grabbing on right click and middle click', () => {
    // Right click
    interaction.onPointerDown({ pointerType: 'mouse', button: 2 });
    expect(interaction.isOrbiting).toBe(true);
    expect(dummyCanvas.style.cursor).toBe('grabbing');

    // Middle click
    interaction.isOrbiting = false;
    interaction.onPointerDown({ pointerType: 'mouse', button: 1 });
    expect(interaction.isOrbiting).toBe(true);
    expect(dummyCanvas.style.cursor).toBe('grabbing');
  });

  it('strictly maintains grabbing cursor during right-click drag even over cube pieces', () => {
    interaction.onPointerDown({ pointerType: 'mouse', button: 2 });
    expect(interaction.isOrbiting).toBe(true);
    expect(dummyCanvas.style.cursor).toBe('grabbing');

    // Simulate pointer move while right button is held (buttons = 2)
    interaction.onPointerMove({ pointerType: 'mouse', buttons: 2, clientX: 400, clientY: 300 });
    expect(dummyCanvas.style.cursor).toBe('grabbing');
    expect(interaction.isOrbiting).toBe(true);
  });

  it('resets orbiting state and restores cursor on pointerup', () => {
    interaction.onPointerDown({ pointerType: 'mouse', button: 2 });
    expect(interaction.isOrbiting).toBe(true);

    // Release mouse outside stickers
    interaction.onPointerUp({ pointerType: 'mouse', buttons: 0, clientX: 10, clientY: 10 });
    expect(interaction.isOrbiting).toBe(false);
    expect(dummyOrbitControls.enabled).toBe(true);
    expect(dummyCanvas.style.cursor).toBe('default');
  });

  it('sets grabbing cursor when left clicking to drag a turnable face', () => {
    const cornerParent = new THREE.Object3D();
    cornerParent.position.set(1, 1, 1);
    const cornerSticker = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());
    cornerSticker.userData.localNormal = new THREE.Vector3(0, 1, 0);
    cornerParent.add(cornerSticker);
    dummyCube.allStickers = [cornerSticker];

    // Mock raycaster intersection with this sticker
    interaction.raycaster.intersectObjects = () => [{
      object: cornerSticker,
      point: new THREE.Vector3(1, 1, 1),
    }];

    interaction.onPointerDown({ pointerType: 'mouse', button: 0, clientX: 400, clientY: 300 });
    expect(interaction.isPointerDown).toBe(true);
    expect(interaction.isDraggingFace).toBe(true);
    expect(dummyOrbitControls.enabled).toBe(false);
    expect(dummyCanvas.style.cursor).toBe('grabbing');

    // On pointer up, controls are re-enabled
    interaction.onPointerUp({ pointerType: 'mouse', buttons: 0, clientX: 10, clientY: 10 });
    expect(interaction.isPointerDown).toBe(false);
    expect(interaction.isDraggingFace).toBe(false);
    expect(dummyOrbitControls.enabled).toBe(true);
  });
});
