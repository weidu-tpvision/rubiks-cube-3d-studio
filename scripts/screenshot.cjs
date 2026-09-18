const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    backgroundColor: '#0d1117',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  await win.loadFile(path.join(__dirname, '../dist/index.html'));

  // Wait for Three.js and solver engine initialization
  await new Promise(r => setTimeout(r, 2200));

  // Scramble and solve, properly awaiting completion
  await win.webContents.executeJavaScript(`
    (async () => {
      document.getElementById('btn-scramble')?.click();
      await new Promise(r => {
        const interval = setInterval(() => {
          const badge = document.getElementById('status-msg');
          if (badge && badge.textContent.includes('Cube scrambled')) {
            clearInterval(interval);
            r();
          }
        }, 150);
      });

      document.getElementById('btn-solve-step')?.click();
      await new Promise(r => setTimeout(r, 1200));
    })()
  `);

  const docsDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // 1. Capture Main Solver Screen (Left Inspector + 3D Cube + Move Pad)
  const solverImg = await win.webContents.capturePage();
  fs.writeFileSync(path.join(docsDir, 'screenshot.png'), solverImg.toPNG());
  console.log('SUCCESS: Captured docs/screenshot.png (Solver View)');

  // 2. Capture Learn Methods modal
  await win.webContents.executeJavaScript(`
    (async () => {
      document.getElementById('player-btn-close')?.click();
      await new Promise(r => setTimeout(r, 500));
      document.getElementById('btn-tutorial')?.click();
      await new Promise(r => setTimeout(r, 800));
    })()
  `);

  const tutorialImg = await win.webContents.capturePage();
  fs.writeFileSync(path.join(docsDir, 'screenshot-learn.png'), tutorialImg.toPNG());
  console.log('SUCCESS: Captured docs/screenshot-learn.png (Learn View)');

  app.quit();
});
