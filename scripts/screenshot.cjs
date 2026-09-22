const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: true,
    x: -3000,
    y: -3000,
    backgroundColor: '#0d1117',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    }
  });

  await win.loadFile(path.join(__dirname, '../dist/index.html'));

  // Disable CSS transitions so drawers snap immediately
  await win.webContents.insertCSS(`
    *, *::before, *::after {
      transition-duration: 0.001s !important;
      transition-delay: 0s !important;
    }
  `);

  // Wait for Three.js, solver engine, and table init
  await new Promise(r => setTimeout(r, 2200));

  const docsDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const captureToFile = async (filename) => {
    await win.webContents.executeJavaScript(`
      if (window.app) {
        window.app.renderer.render(window.app.scene, window.app.camera);
      }
    `);
    await new Promise(r => setTimeout(r, 300));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(docsDir, filename), img.toPNG());
    console.log('SUCCESS: Captured docs/' + filename);
  };

  // 1. Capture Cube Variation / Shape Dropdown Menu Open
  await win.webContents.executeJavaScript(`
    (() => {
      document.getElementById('btn-cube-dropdown')?.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 400));
  await captureToFile('screenshot-cube-menu.png');

  // Close dropdown and reset
  await win.webContents.executeJavaScript(`
    (() => {
      document.getElementById('cube-variation-menu')?.classList.add('hidden');
    })()
  `);
  await new Promise(r => setTimeout(r, 200));

  // 2. Capture 3x3 Scrambled Solver View (with step player open)
  await win.webContents.executeJavaScript(`
    (() => {
      const scramble = window.app.controlsUI.generateScramble(20);
      window.app.rubiksCube.twistInstant(scramble);
      window.app.controlsUI.setStatusMessage('Cube scrambled! Ready to solve.');
      window.app.controlsUI.startStepByStepSolve();
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await captureToFile('screenshot.png');

  // 2. Capture 3x3 Learn Methods Drawer
  await win.webContents.executeJavaScript(`
    (() => {
      window.app.stepPlayer.stopAndClose();
      window.app.tutorialUI.open();
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await captureToFile('screenshot-learn.png');

  // 3. Switch to 2x2 Mode, Scramble, and Solve (with step player open)
  await win.webContents.executeJavaScript(`
    (() => {
      window.app.tutorialUI.close();
      window.app.controlsUI.setCubeDimension(2);
      const scramble2x2 = window.app.controlsUI.generateScramble(11);
      window.app.rubiksCube.twistInstant(scramble2x2);
      window.app.controlsUI.startStepByStepSolve();
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await captureToFile('screenshot-2x2-solve.png');

  // 4. Capture 2x2 Learn Methods Drawer (showing 2x2 methods: Beginner, Ortega)
  await win.webContents.executeJavaScript(`
    (() => {
      window.app.stepPlayer.stopAndClose();
      window.app.tutorialUI.open();
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await captureToFile('screenshot-2x2-learn.png');

  // 5. Switch to 4x4 Mode, Scramble, and Solve (with step player open)
  await win.webContents.executeJavaScript(`
    (() => {
      window.app.tutorialUI.close();
      window.app.controlsUI.setCubeDimension(4);
      const scramble4x4 = window.app.controlsUI.generateScramble(20);
      window.app.rubiksCube.twistInstant(scramble4x4);
      window.app.controlsUI.startStepByStepSolve();
    })()
  `);
  await new Promise(r => setTimeout(r, 800));
  await captureToFile('screenshot-4x4-solve.png');

  // 6. Capture 4x4 Learn Methods Drawer (showing 4x4 Reduction & Parities)
  await win.webContents.executeJavaScript(`
    (() => {
      window.app.stepPlayer.stopAndClose();
      window.app.tutorialUI.open();
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await captureToFile('screenshot-4x4-learn.png');

  app.quit();
});
