# 🧊 Rubik's 3D Studio & Multi-Method Solver

An interactive, high-performance 3D Rubik's Cube studio and speedcubing learning platform. Features realistic physics-based 3D graphics, FreeCAD-style viewport navigation, automated step-by-step solving across 4 proven methods, and an interactive visual tutorial curriculum with piece-highlighting demonstrations.

Available across all major platforms:
- 🐧 **Ubuntu / Linux Desktop Application** (`.tar.gz` / standalone binary)
- 🪟 **Native Windows Desktop Application** (`.exe`)
- 🌐 **Modern Web Application** (Responsive PWA-ready browser app)
- 📱 **Native Android Application** (`.apk` via Capacitor)

---

![Rubik's 3D Studio](./docs/screenshot.png)

---

## ✨ Key Features

### 🧊 Puzzle Variations (4×4 Revenge, 3×3 Standard, 2×2 Pocket Cube & Pyraminx)
Switch between puzzle variations directly from the top **Puzzle Shape** dropdown menu (`[ 🧊 3×3 Cube ▾ ]`):
- **4×4 Revenge (Master Cube)**: 56 pieces, 96 facelets, no fixed central core. Full support for single-layer turns (`R, U...`), wide two-layer turns (`Rw, Uw, Fw...`), and the 4×4 Reduction method with OLL and PLL Parity resolutions.
- **3×3 Standard Cube**: Classic 6 faces, 26 pieces, 54 facelets. Full support for Kociemba Optimal, CFOP, Roux, and Beginner Layer-by-Layer methods.
- **2×2 Pocket Cube**: 8 corners, 24 facelets. Solved with **Optimal BFS (God's Algorithm $\le 11$ moves)** in $<10\text{ms}$, **Ortega Method**, or **Beginner LBL**.
- **Pyraminx**: Regular tetrahedron puzzle with 4 faces, 14 physical pieces (4 tips, 4 centers, 6 edges), and 36 external stickers. Full support for vertex layer turns (`U, L, R, B`), tip twists (`u, l, r, b`), and bidirectional BFS optimal & beginner solving.
- **Extensible Design**: Dropdown architecture ready for higher-order variations and non-cubic shapes.

### 🧩 Solving Methods (Optimal & Human)
Select your preferred solving method directly from the top solver dropdown:

#### Pyraminx Methods:
| Method | Stages | Typical Moves | Description |
|---|:---:|:---:|---|
| **⚡ Optimal (God's Algorithm)** | 1 | $\le 11$ | High-speed bidirectional BFS finding the shortest core path combined with trivial tip alignment. |
| **🔰 Beginner (LBL)** | 4 | ~12–16 | 4 pedagogical stages: Orient Tips → Align Centers (V-Shape) → First Layer Edges → Last Layer Edges. |

#### 4×4 Methods:
| Method | Stages | Typical Moves | Description |
|---|:---:|:---:|---|
| **🔮 4×4 Reduction** | 4 | ~20–85 | Genuine state-based Reduction solver computing solutions purely from the 96 sticker colors with Herbert Kociemba group theory & Parity Resolutions (OLL & PLL). |

> *Note: The two 4×4 parity resolutions (OLL Parity and PLL Parity) are also taught and demonstrated in the **Learn (🎓)** curriculum with dedicated scrambles and piece-highlighting.*

#### 3×3 Methods:
| Method | Stages | Typical Moves | Description |
|---|:---:|:---:|---|
| **⚡ Optimal (Kociemba)** | 1 | ~20–22 | Two-phase mathematical group theory solver finding the shortest path to solve. |
| **🔰 Beginner (LBL)** | 7 | ~110–120 | The classic Layer-by-Layer method with intuitive stages and easy-to-learn algorithms. |
| **👑 CFOP (Fridrich)** | 4 | ~70–75 | The world speedcubing standard: Cross → 4 First Two Layer (F2L) slots → OLL → PLL. |
| **💡 Roux Method** | 4 | ~70–75 | Intuitive block-building & M-slice: First Block → Second Block → CMLL → LSE. |

#### 2×2 Methods:
| Method | Stages | Typical Moves | Description |
|---|:---:|:---:|---|
| **⚡ Optimal (God's Algorithm)** | 1 | $\le 11$ | High-speed bidirectional BFS finding the mathematically shortest solution. |
| **🔰 Beginner (LBL)** | 3 | ~15–20 | First Layer → Orient Last Layer → Permute Last Layer. |
| **🚀 Ortega Method** | 3 | ~12–16 | Solve any face → OLL opposite face → PBL (Permute Both Layers simultaneously). |

### 🎬 Interactive Step-by-Step Inspector Panel
- **Left-Docked CAD-Style Inspector**: Keeps 100% of the vertical viewport clearance for the 3D cube with zero bottom occlusion.
- **Visual Move Guidance**: Clear move badges (`R'`, `Rw`, `U2`, etc.) accompanied by natural-language instructions ("Turn Right 2 layers 90° clockwise").
- **Full Playback Navigation**: Play, pause, step forward, step backward, or jump to the starting state.
- **Fine Speed Controls**: Discrete speed multiplier slider (`0.25x`, `0.5x`, `0.75x`, `1.0x`, `1.5x`, `2.0x`, `3.0x`).

### 🎓 Learn Methods ("Load & Demonstrate on 3D Cube")
- Step-by-step curriculum for **4×4 Reduction & Parities**, **3×3 Beginner/CFOP/Roux**, **2×2 Beginner/Ortega**, and **Pyraminx Beginner (LBL)**.
- Each stage includes goal explanations, mnemonics, and algorithms.
- **"Load & Demonstrate on 3D Cube"**: Scrambles the cube to the exact textbook scenario, dims unrelated pieces to highlight target pieces, and loads the solution into the step player for turn-by-turn demonstration.
- Highlights automatically restore when you start solving or resetting the cube.

### 🔄 Precision FreeCAD / CAD-Style 3D Controls
Strict separation of mouse actions prevents accidental camera movement while turning faces:

| Action | Mouse / Keyboard | Description |
|---|---|---|
| **Turn Cube Face** | **Left-Click Drag** on piece | Click any piece and drag in the desired turn direction: clicking outer pieces twists the 1st outer layer (`R, U...`); clicking inner pieces twists the 2nd layer slice (`2R, 2U...`); with `w` active, twists 2 layers wide (`Rw, Uw...`). On Pyraminx, clicking pieces turns corresponding vertex layers (`U, L, R, B`) or tips (`u, l, r, b`). |
| **Orbit 3D Camera** | **Right-Click Drag** anywhere<br>*(or Left-Click Drag on empty space)* | Smoothly rotates the 3D cube viewpoint from any angle. |
| **Pan Camera** | **Shift + Right-Click** or **Ctrl + Right-Click** | Translates/pans the camera view across the screen. |
| **Zoom / Dolly** | **Scroll Wheel** | Zooms camera in and out smoothly. |
| **Camera Reset** | Click **🎥** in header | Restores default isometric perspective. |

> **💡 Note on the Header Toggle (✋ Twist / 🔄 Orbit):**
> - **Desktop**: Mouse controls already separate twisting (Left-Click) from camera rotation (Right-Click), so desktop users don't need this toggle.
> - **Touchscreens / Android App**: Because mobile devices lack a physical right-click button, this button provides a dedicated **Orbit** mode so touch users can swipe anywhere on screen (even directly over the puzzle) to freely inspect all sides without accidentally turning a layer.

### ⏱️ Speedcubing Timer
- **Stackmat-Style Hold-to-Start**: Press and hold the Spacebar or click-and-hold the timer pill (turns orange `Hold...`, then green `READY!` after 300ms) to emulate a competition Stackmat timer. Releasing starts the timer immediately.
- **Real-Time Millisecond Precision**: Tracks solve times down to the hundredth of a second with clean high-contrast display.
- **Automated Puzzle Synchronization**: Unconditionally resets on switching puzzle shapes or loading demonstration stages.

### 🎨 Color Themes & Core Plastics
Select your favorite visual style directly from the **Palette** dropdown menu in the header:
- **Color Palettes**: *Standard Classic*, *Stickerless Fluoro*, *Pastel / Soft*, and *Carbon Dark*.
- **Body Plastics**: *Black Plastic*, *White Plastic*, and *Primary Plastic* materials.
- Preserves the current scrambled state seamlessly when switching themes on the fly.

### 🔊 Procedural Audio & 🎥 Camera Presets
- **Procedural Web Audio Engine**: Zero-asset realistic plastic friction and snap clicks on face turns with header mute toggle (**🔊 / 🔇**).
- **Camera View Presets**: Click the camera menu to snap directly to orthogonal faces (*Front*, *Back*, *Top*, *Bottom*, *Left*, *Right*) or the default *Isometric* view.

### 🎛️ Manual Move Pad & Keyboard Shortcuts
- **On-Screen Control Pad** (bottom right):
  - Cube turn buttons: **U** (Top/White), **D** (Bottom/Yellow), **F** (Front/Green), **B** (Back/Blue), **L** (Left/Orange), **R** (Right/Red).
  - Pyraminx turn buttons: **U, L, R, B** (2 layers) and **u, l, r, b** (vertex tips).
  - Modifier toggles: **`'`** (Prime / CCW), **`180°`** (Double Turn), **`2nd`** (Turn only 2nd layer inner slice on 4×4), and **`w`** (Wide 2-layer turn for 4×4).
  - Whole-puzzle rotations: **Rot X**, **Rot Y**, **Rot Z**.
- **Keyboard Shortcuts**:
  - `U`, `D`, `L`, `R`, `F`, `B` for clockwise face turns (hold `Shift` for prime counter-clockwise turns).
  - On Pyraminx: `U`, `L`, `R`, `B` for vertex turns; hold `Alt` or lowercase for tip turns (`u`, `l`, `r`, `b`); hold `Shift` for prime turns.
  - `2` key toggles 2nd layer slice mode on 4×4 (`2R`, `2U`...).
  - `W` key toggles Wide 2-layer mode on 4×4 (`Rw`, `Uw`...).

---

## 🚀 Running the Application

### 1. Ubuntu / Linux Desktop Application

You can launch the native Linux desktop app in two ways:
- **Root Launcher**: Run [`./Launch-RubiksCubeStudio.sh`](./Launch-RubiksCubeStudio.sh).
- **Or direct executable**: Run `./release/RubiksCubeStudio-linux-x64/RubiksCubeStudio`.

#### Building for Ubuntu / Linux:
```bash
npm install
npm run electron:build:linux
```
This packages the standalone Linux x64 binary into `release/RubiksCubeStudio-linux-x64`.

---

### 2. Native Windows Desktop App (.exe)

You can launch the desktop application directly:
- **Root Launcher**: Double-click [`Launch-RubiksCubeStudio.bat`](./Launch-RubiksCubeStudio.bat).
- **Or direct executable**: Run `release/RubiksCubeStudio-win32-x64/RubiksCubeStudio.exe`.

#### Building for Windows:
```bash
npm install
npm run electron:build:win
```
*(Or `npm run electron:build:all` to build both Windows and Linux simultaneously).*

---

### 3. Automated Multi-Platform CI/CD (GitHub Actions)

Every push to `main` automatically triggers our GitHub Actions matrix pipeline (`.github/workflows/build.yml`), which compiles and packages:
- 🐧 **`RubiksCubeStudio-linux-x64.tar.gz`** (native Ubuntu / Debian binary)
- 🪟 **`RubiksCubeStudio-win32-x64.zip`** (native Windows x64 binary)

Artifacts are directly downloadable from the **Actions** tab on GitHub.

---

### 4. Web Browser Application

Run the local Vite development server:
```bash
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

To expose the dev server to other devices on the same Wi-Fi network (e.g. tablet or mobile):
```bash
npm run dev -- --host
```

---

### 5. Native Android App (Capacitor)

The project includes an Android Studio Gradle project in the `android/` directory:

1. **Build web assets & sync to Android project:**
   ```bash
   npm run android:sync
   ```
2. **Open in Android Studio:**
   ```bash
   npm run android:open
   ```
   *(Or open the `android/` directory directly inside Android Studio).*
3. **Build APK / Run on Device:**
   - Plug in your Android phone with USB Debugging enabled, or start an emulator.
   - Click the green **Run** (▶) button in Android Studio, or go to **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate a standalone `.apk`.

**Mobile Features Included:**
- **Auto-Rotation & Portrait Support**: Seamlessly transitions between portrait bottom-sheet UI and landscape widescreen.
- **Touch Gesture Recognition**: 1-finger drag on cube faces to twist slices; 1-finger drag on background or 2-finger pinch/drag to orbit and zoom the camera.
- **Touch Mode Switcher (✋ Twist vs 🔄 Orbit)**: Solves the lack of a physical right mouse button on touchscreens. Allows users to switch to Orbit mode and swipe anywhere on screen (including over the cube) to inspect angles without grabbing a layer.
- **Haptic Feedback**: Subtle vibration upon completing slice turns.
- **Android Hardware Back Button**: Closes the Tutorial drawer or Step Player before exiting the app.

---

### 6. Automated Testing (Vitest)

Execute the full suite of 44 automated unit tests covering all puzzle solvers, group theory, parity validation, notation inversion, and speed timer math:
```bash
npm test
```

---

## 🛠️ Tech Stack & Architecture

- **Rendering Engine**: [Three.js](https://threejs.org/) (Custom cubie groups, canvas textures for center badges, PBR materials, soft shadows).
- **Desktop Framework**: [Electron](https://www.electronjs.org/) (Standalone native window, offline-first).
- **Build Tool**: [Vite](https://vitejs.dev/) (Lightning-fast HMR and production Rollup bundling).
- **Solving Engines**:
  - **4×4 Solver**: Genuine state-based 4×4 Reduction solver (Centers → Edge pairing → 3×3 Phase via Herbert Kociemba Two-Phase Group Theory) with center-preserving slice OLL Parity and PLL Parity resolutions. Powered by headless simulation engine `VirtualCube4x4` with precomputed permutation cycles (`perms4x4.js`).
  - **3×3 Solver**: [cubejs](https://github.com/ldez/cubejs) (Herbert Kociemba Two-Phase optimal group theory solver) and custom rule engines for Beginner Layer-by-Layer, CFOP (Fridrich), and Roux.
  - **2×2 Solver**: Custom bidirectional Breadth-First Search (BFS) over corner permutation/orientation states (God's Algorithm $\le 11$ moves in $<10\text{ms}$), Ortega Method (OLL/PBL), and Beginner LBL.
  - **Pyraminx Solver**: Custom bidirectional Breadth-First Search (BFS) finding God's Algorithm ($\le 11$ moves) and 4-stage pedagogical beginner Layer-by-Layer method with tip-center synchronization. Regular tetrahedron geometry engine (`PyraminxGeometry.js`).

---

## 📄 License

MIT License. Free for personal, educational, and open-source use.
