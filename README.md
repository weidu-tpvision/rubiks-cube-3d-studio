# ?? 3D Rubik's Cube Studio & Step-by-Step Solver

An interactive 3D Rubik's Cube application with full manual controls, touch/mouse face-dragging, automated step-by-step solving for any scramble, and an interactive 7-stage Beginner's Method tutorial.

Available as **both** a **Native Windows Desktop Application (.exe)** and a **Web Browser Application**.

---

## ?? Native Windows Desktop Application (.exe)

You can launch the native Windows desktop app in two ways:

1. **Double-click the root launcher**:
   - Double-click [`Launch-RubiksCubeStudio.bat`](./Launch-RubiksCubeStudio.bat) in this project folder.
2. **Or directly run the `.exe`**:
   - `release/RubiksCubeStudio-win32-x64/RubiksCubeStudio.exe`

### Re-building the `.exe`:
To re-package the `.exe` after making any code changes:
```bash
npm run electron:build
```

---

## ?? Web Browser Version

### 1. Development Server
Run the local Vite development server:
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

*(To expose it to your phone/tablet on the same Wi-Fi, run: `npm run dev -- --host`)*

---

## ?? Controls & Features

### 3D Camera Controls
- **Orbit (Rotate View)**: Click and drag anywhere in the background.
- **Zoom**: Mouse wheel or pinch-to-zoom.
- **Reset Camera**: Click the ?? camera icon in the top header.

### Rotating Cube Faces
1. **Direct 3D Face Drag**: Click directly on any colored sticker and drag in the direction you wish to twist that slice!
2. **On-Screen Control Pad** (bottom right):
   - Face turn buttons: **U** (White), **D** (Yellow), **F** (Green), **B** (Blue), **L** (Orange), **R** (Red).
   - Turn modifier toggles: `'` (Prime / counter-clockwise) and `2` (180° double turn).
   - Whole-cube rotations: **Rot X**, **Rot Y**, **Rot Z**.
3. **Keyboard Shortcuts**:
   - `U`, `D`, `L`, `R`, `F`, `B` for clockwise 90° face turns.
   - Hold `Shift` + key for prime (counter-clockwise) turns (e.g. `Shift + R` for `R'`).

### ?? Step-by-Step Solver
1. Scramble or rotate the cube however you like.
2. Click **?? Solve Step-by-Step** in the top bar.
3. Use the **Step Player HUD**:
   - **? Play / ? Pause**: Auto-play through the solving moves.
   - **Next ? / ? Prev**: Advance or rewind one step at a time.
   - **? Start**: Return to the initial scramble position.
   - **Speed Slider**: Adjust playback speed.

### ?? Interactive Beginner's Method Tutorial
Click **?? Learn Method** in the header to open the interactive curriculum covering the 7 Layer-by-Layer stages. Click **"Load & Demonstrate on 3D Cube"** on any stage to see the setup and step through the algorithm with piece highlighting!
