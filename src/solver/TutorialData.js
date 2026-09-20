export const TUTORIAL_METHODS = {
  beginner: {
    name: "Beginner's Method",
    shortName: "Beginner (LBL)",
    badge: "7 Stages • ~110–120 Moves",
    desc: "The classic Layer-by-Layer approach. Simple, highly visual, and requires memorizing only a few intuitive algorithms.",
    stages: [
      {
        id: 1,
        title: 'Stage 1: The White Cross',
        subtitle: 'Foundation of the First Layer',
        goal: 'Align the 4 white edge pieces around the white center on top, with their side colors matching the adjacent center pieces (Green, Red, Blue, Orange).',
        mnemonic: 'Solve each white edge into position so its side color matches the center, forming a white "+" cross!',
        algorithm: "U B' L2 R U2 L' (Intuitive Cross Construction)",
        setupScramble: "L' U2 D' R' B' L2 B2 U'",
        demoMoves: "U B' L2 R U2 L'",
        explanation:
          'Look for edge pieces that contain White. Match each edge with its side center (Green, Red, Blue, Orange), then rotate it into the top White layer until a complete White Cross is formed.',
        filter: (sticker) => {
          const isWhite = sticker.userData.faceChar === 'U';
          const p = sticker.userData.cubie.position;
          const isEdge = Math.abs(p.x) + Math.abs(p.y) + Math.abs(p.z) === 2;
          return isWhite || (p.y >= 0.8 && isEdge);
        },
      },
      {
        id: 2,
        title: 'Stage 2: First Layer Corners',
        subtitle: 'The Bottom-Corner "Sexy Move" (R\' D\' R D)',
        goal: 'Solve the 4 white corner pieces into the top layer (U) to complete the entire first layer.',
        mnemonic: "Right Corner Move: R' D' R D (or F D F')",
        algorithm: "R' D' R D",
        setupScramble: "D' R' D R",
        demoMoves: "R' D' R D",
        explanation:
          'Position an unsolved white corner in the bottom layer (D) directly beneath its target slot in the top layer (U). Execute R\' D\' R D until the white sticker faces upward into Layer 1.',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          return p.y >= 0.8 || (p.x >= 0.8 && p.z >= 0.8 && p.y <= -0.8);
        },
      },
      {
        id: 3,
        title: 'Stage 3: Second Layer Edges',
        subtitle: 'Left & Right Insert Algorithms',
        goal: 'Insert all 4 middle layer edge pieces into place without disturbing the completed first layer.',
        mnemonic: "Right Insert: D' R' D R D F D' F' | Left Insert: D L D' L' D' F' D F",
        algorithm: "D' R' D R D F D' F' (Right Insert)",
        setupScramble: "F D F' D' R' D' R D",
        demoMoves: "D' R' D R D F D' F'",
        explanation:
          'Find an edge in the bottom layer (D) that does not contain Yellow. Align its front color with the matching center. If it belongs in the Right slot, perform D\' R\' D R D F D\' F\'. If Left, perform D L D\' L\' D\' F\' D F.',
        filter: (sticker) => sticker.userData.cubie.position.y >= -0.3,
      },
      {
        id: 4,
        title: 'Stage 4: The Yellow Cross',
        subtitle: 'Orienting Bottom Edges (F D L D\' L\' F\')',
        goal: 'Create a yellow cross on the bottom (D) face without disturbing Layers 1 and 2.',
        mnemonic: "F D L D' L' F' - Turn Front, rotate D layer, restore Front!",
        algorithm: "F D L D' L' F'",
        setupScramble: "F L D L' D' F'",
        demoMoves: "F D L D' L' F'",
        explanation:
          'Look at the bottom (Yellow) face. You will see either a Dot, an "L"-shape, a Bar, or a Cross. Apply F D L D\' L\' F\' to advance through Dot -> L -> Bar -> Cross until all 4 yellow edges face down.',
        filter: (sticker) => sticker.userData.faceChar === 'D' || sticker.userData.cubie.position.y <= -0.8,
      },
      {
        id: 5,
        title: 'Stage 5: Align Yellow Edges',
        subtitle: 'The Sune Algorithm on D',
        goal: 'Rearrange the 4 yellow edges so their side colors match the 4 lateral centers.',
        mnemonic: "Sune on D: R D R' D R D2 R'",
        algorithm: "R D R' D R D2 R'",
        setupScramble: "R D2 R' D' R D' R'",
        demoMoves: "R D R' D R D2 R'",
        explanation:
          'Turn the bottom face until 2 edges match their centers. Hold one matching edge on Back and one on Right. Execute R D R\' D R D2 R\' to swap the front and left edges until all 4 match their centers.',
        filter: (sticker) => sticker.userData.cubie.position.y <= -0.8,
      },
      {
        id: 6,
        title: 'Stage 6: Position Yellow Corners',
        subtitle: 'The Niklas Algorithm on D',
        goal: 'Place all 4 yellow corner pieces into their correct positions (colors do not need to face down yet).',
        mnemonic: "Niklas on D: D R D' L' D R' D' L",
        algorithm: "D R D' L' D R' D' L",
        setupScramble: "L' D R D' L D R' D'",
        demoMoves: "D R D' L' D R' D' L",
        explanation:
          'Find a corner already in the correct physical spot between its 3 center colors. Keep it in Front-Right-Bottom. Perform D R D\' L\' D R\' D\' L to cycle the other 3 corners until each is in position.',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          return Math.abs(p.x) >= 0.8 && Math.abs(p.z) >= 0.8 && p.y <= -0.8;
        },
      },
      {
        id: 7,
        title: 'Stage 7: Orient Yellow Corners',
        subtitle: 'Finishing the Cube! (Corner Twist Commutator)',
        goal: 'Twist the yellow corners so the yellow face is complete and the entire Rubik\'s cube is 100% solved!',
        mnemonic: "Twist Commutator: Sune on Right + Sune on Left (R D R' D R D2 R' L' D' L D' L' D2 L)",
        algorithm: "R D R' D R D2 R' L' D' L D' L' D2 L",
        setupScramble: "L' D2 L D L' D L R D2 R' D' R D' R'",
        demoMoves: "R D R' D R D2 R' L' D' L D' L' D2 L",
        explanation:
          'Both Layers 1 and 2, the Yellow Cross, and all corner positions are solved! Execute the corner-twist commutator to twist the final yellow corners in place and complete the cube!',
        filter: () => true,
      },
    ],
  },

  cfop: {
    name: 'CFOP (Fridrich Method)',
    shortName: 'CFOP / Fridrich',
    badge: '4 Stages • ~70–75 Moves • Used by ~90% of Speedcubers',
    desc: 'The gold standard of world-class speedcubing. Developed by Jessica Fridrich, it optimizes for high Turns Per Second (TPS) and lightning-fast fingertricks.',
    stages: [
      {
        id: 1,
        title: 'C - The Cross (Direct Bottom)',
        subtitle: 'Solved on bottom in ≤ 8 moves',
        goal: 'Solve the 4 cross edges directly on the bottom (D layer) while aligning them with side centers.',
        mnemonic: 'Solve with cross facing DOWN so your eyes are free to lookahead for F2L pairs!',
        algorithm: "D' R2 F2 D B2 L2 (Direct bottom cross solve)",
        setupScramble: "L2 B2 D' F2 R2 D",
        demoMoves: "D' R2 F2 D B2 L2",
        explanation:
          'Unlike beginners who make a daisy on top, speedcubers solve the cross directly on the bottom in 8 moves or fewer. Keeping the cross on the bottom leaves the entire top and middle visible for spotting the next F2L pair.',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          return p.y <= -0.8 && (Math.abs(p.x) + Math.abs(p.z) === 1);
        },
      },
      {
        id: 2,
        title: 'F - F2L (First Two Layers)',
        subtitle: 'Simultaneous Corner + Edge Insertion',
        goal: 'Pair up a corner and its matching edge piece in the top layer, then insert both together into their slot in one fluid motion.',
        mnemonic: "Basic Insert: U R U' R' | Sexy Insert: R U R' U'",
        algorithm: "U R U' R' (Basic Pairing & Insertion)",
        setupScramble: "R U R' U'",
        demoMoves: "U R U' R'",
        explanation:
          'F2L is the core of CFOP. Instead of solving corners and edges separately, you pair up a corner and its matching edge in the U layer and slide both into their slot simultaneously in 4-7 moves. Speedcubers do this for all 4 slots in ~28 moves.',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          return (p.x >= 0.8 && p.z >= 0.8) || (p.y >= 0.8);
        },
      },
      {
        id: 3,
        title: 'O - OLL (Orientation of Last Layer)',
        subtitle: 'Make the whole Yellow Face in 1 Algorithm',
        goal: 'Orient all pieces on the top layer so the entire top face is solid yellow in a single algorithm.',
        mnemonic: "Full OLL has 57 cases; 2-Look OLL uses 10 (e.g. Sune: R U R' U R U2 R')",
        algorithm: "R U R' U R U2 R' (Sune OLL)",
        setupScramble: "R U2 R' U' R U' R'",
        demoMoves: "R U R' U R U2 R'",
        explanation:
          'Once the first two layers are complete, OLL turns all yellow stickers face-up in one rapid algorithm, regardless of where the side colors point. Champions memorize all 57 OLL algorithms so they can recognize and execute this step in 0.8 seconds.',
        filter: (sticker) => sticker.userData.cubie.position.y >= 0.8,
      },
      {
        id: 4,
        title: 'P - PLL (Permutation of Last Layer)',
        subtitle: 'The Final Speed Burst - Solve the Cube!',
        goal: 'Shuffle the top layer pieces into their final positions without altering their orientations to finish the cube.',
        mnemonic: "T-Perm: R U R' U' R' F R2 U' R' U' R U R' F'",
        algorithm: "R U R' U' R' F R2 U' R' U' R U R' F' (T-Perm)",
        setupScramble: "F R U' R' U R U R2 F' R U R U' R'",
        demoMoves: "R U R' U' R' F R2 U' R' U' R U R' F'",
        explanation:
          'PLL is the exhilarating finale of CFOP. By memorizing 21 algorithms (like T-Perm, Y-Perm, U-Perm), a speedcuber identifies which pieces need to swap rims and fires off a 12-to-15 move fingertrick sequence in under 1 second, finishing the cube!',
        filter: (sticker) => sticker.userData.cubie.position.y >= 0.8,
      },
    ],
  },

  roux: {
    name: 'Roux Method',
    shortName: 'Roux Method',
    badge: '4 Stages • ~70–75 Moves • Intuitive Blockbuilding & M-Slice',
    desc: 'Invented by Gilles Roux, this method uses 3D blockbuilding and finishes with satisfying, lightning-fast middle-slice (M) turns with zero cube rotations.',
    stages: [
      {
        id: 1,
        title: 'Step 1: First Block (FB)',
        subtitle: 'Left 1x2x3 Blockbuilding',
        goal: 'Build an intuitive 1x2x3 block on the left side of the cube (e.g. Blue center, White bottom) with zero algorithms.',
        mnemonic: 'Pure 3D intuition: connect an edge to its center, then add corner-edge pairs!',
        algorithm: "Intuitive Blockbuilding (e.g. L' U B2 L F)",
        setupScramble: "F' L' B2 U' L",
        demoMoves: "L' U B2 L F",
        explanation:
          'Roux abandons the traditional "cross". Instead, you freely construct a solid 1x2x3 block on the left side (incorporating the left center, bottom center, and matching edges/corners). This leaves the middle slice (M) and right layer (R) completely free to move.',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          return p.x <= -0.8 && p.y <= 0.3;
        },
      },
      {
        id: 2,
        title: 'Step 2: Second Block (SB)',
        subtitle: 'Right 1x2x3 Block using <R, r, U, M>',
        goal: 'Build a matching 1x2x3 block on the right side without disturbing the left block, using only R, r, U, and M turns.',
        mnemonic: 'Use the free M-slice like an elevator to pair up pieces without breaking Block 1!',
        algorithm: "R U' R' U M' U2 R' (Block insertion)",
        setupScramble: "R U2 M U' R U R'",
        demoMoves: "R U' R' U M' U2 R'",
        explanation:
          'Build the second 1x2x3 block on the right side. Because the first block is tucked safely on the left, you can rotate the R face, U face, and the middle M slice freely like an elevator to pair up pieces without disturbing your first block.',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          return (p.x <= -0.8 && p.y <= 0.3) || (p.x >= 0.8 && p.y <= 0.3);
        },
      },
      {
        id: 3,
        title: 'Step 3: CMLL (Corners of Last Layer)',
        subtitle: 'Solve All 4 Top Corners at Once',
        goal: 'Orient and permute all 4 top corners in a single algorithm while keeping the two side blocks intact.',
        mnemonic: '42 algorithms total (or 2-look CMLL with Sune & Niklas)',
        algorithm: "R U R' U R U2 R' (Sune CMLL)",
        setupScramble: "R U2 R' U' R U' R'",
        demoMoves: "R U R' U R U2 R'",
        explanation:
          'Both 1x2x3 side blocks are locked in place. In CMLL, you solve both the orientation and permutation of the 4 top corners in a single algorithm. Notice that the middle slice (M) can be scrambled here because it will be solved next!',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          return (Math.abs(p.x) >= 0.8 && Math.abs(p.z) >= 0.8 && p.y >= 0.8);
        },
      },
      {
        id: 4,
        title: 'Step 4: LSE (Last Six Edges)',
        subtitle: 'The M-Slice Finale (<M, U> Only!)',
        goal: 'Solve the remaining 6 edges (4 in the M-slice + UL and UR) using ONLY middle slice (M) and top (U) turns!',
        mnemonic: 'Flick the M-slice with your ring finger! 4a: Orient Edges -> 4b: UL/UR -> 4c: Finish M-slice.',
        algorithm: "M' U M U' M' U' M U2 M2 U2 M2 (LSE sequence)",
        setupScramble: "M2 U2 M2 U2 M' U M U M' U' M",
        demoMoves: "M' U M U' M' U' M U2 M2 U2 M2",
        explanation:
          'This is the most famous part of the Roux method. Both side blocks and all 4 corners are solved! You finish the remaining 6 edges using exclusively the M slice (flicked with your ring finger) and the U face. Zero cube rotations and astonishingly few moves (~14 moves for LSE)!',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          return Math.abs(p.x) < 0.3 || (p.y >= 0.8 && Math.abs(p.z) < 0.3);
        },
      },
    ],
  },
  beginner2x2: {
    cubeType: '2x2',
    name: "2×2 Beginner's Method",
    shortName: "2×2 Beginner",
    badge: "3 Stages • ~15–20 Moves",
    desc: "The classic Layer-by-Layer approach adapted for the 2×2 Pocket Cube. Complete the white first layer, orient yellow top corners, and swap them into place.",
    stages: [
      {
        id: 1,
        title: 'Stage 1: Solve First Layer',
        subtitle: 'White Face with Matching Sides',
        goal: 'Solve all 4 bottom white corners so the bottom face is solid white and all 4 side colors match each other.',
        mnemonic: 'Right corner insert: R U R\' (or R\' D\' R D). Match lateral colors before inserting!',
        algorithm: "R U R' U' (Sexy Move Corner Insert)",
        setupScramble: "R U R' U' R U R' U'",
        demoMoves: "R U R' U' R U R' U' R U R' U'",
        explanation:
          'Find a white corner piece. Look at its three colors (e.g. White-Red-Green). Place it directly above or beneath its target slot and apply R U R\' U\' until it drops into place with White facing down and its side colors matching.',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          return p.y <= 0.1;
        },
      },
      {
        id: 2,
        title: 'Stage 2: Orient Last Layer (OLL)',
        subtitle: 'Sune & Headlights Algorithm',
        goal: 'Turn all top (yellow) corner stickers upward so the top face is solid yellow without disturbing the bottom layer.',
        mnemonic: "Sune: R U R' U R U2 R' | Anti-Sune: R U2 R' U' R U' R'",
        algorithm: "R U R' U R U2 R' (Sune)",
        setupScramble: "R U2 R' U' R U' R'",
        demoMoves: "R U R' U R U2 R'",
        explanation:
          'Hold the cube with White on the bottom. Look at the top yellow pattern. If 1 corner is yellow, hold it in Front-Left and execute Sune. If 2 or 0 corners are yellow, apply Sune to transition into a 1-corner state.',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          return p.y >= 0.1;
        },
      },
      {
        id: 3,
        title: 'Stage 3: Permute Last Layer (PLL)',
        subtitle: 'Adjacent Corner Swap (T-Perm)',
        goal: 'Permute the top layer corners to complete the solved 2×2 cube.',
        mnemonic: "T-Perm: R U R' U' R' F R2 U' R' U' R U R' F' | Y-Perm for diagonal swap",
        algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'",
        setupScramble: "F R U' R' U R U R2 F' R U R U' R'",
        demoMoves: "R U R' U' R' F R2 U' R' U' R U R' F'",
        explanation:
          'Check the top layer for two matching adjacent corners (headlights). Place the matching bar on the Left side (or Back) and apply the T-Perm. If no two corners match, apply Y-Perm or T-Perm once from any angle.',
        filter: (sticker) => true,
      },
    ],
  },
  ortega2x2: {
    cubeType: '2x2',
    name: "2×2 Ortega Method",
    shortName: "2×2 Ortega",
    badge: "3 Stages • ~11–15 Moves (Speedcubing)",
    desc: "The world-standard speedcubing method for 2×2. Solve any solid first face, orient opposite face in 1 algorithm, then permute both layers simultaneously (PBL).",
    stages: [
      {
        id: 1,
        title: 'Step 1: First Face (Any Color)',
        subtitle: 'Build a Solid Face (Sides Do NOT Need to Match)',
        goal: 'Form a solid white (or easiest color) face. Unlike Beginner method, the side colors DO NOT need to match yet!',
        mnemonic: 'Usually takes only 2 to 4 intuitive turns. Look for bars and pairs during inspection!',
        algorithm: "R U' R' F2 R2",
        setupScramble: "R2 F2 R U R'",
        demoMoves: "R U' R' F2 R2",
        explanation:
          'Because Ortega permutes both layers at the very end in Step 3, you do not need to worry about aligning the side colors of the first face! Just bring all 4 white stickers onto one face as fast as possible.',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          return p.y <= 0.1;
        },
      },
      {
        id: 2,
        title: 'Step 2: OLL (Orient Opposite Face)',
        subtitle: 'One Algorithm for the 7 OLL Cases',
        goal: 'Orient the opposite (yellow) face in a single algorithm. There are exactly 7 cases (Sune, Anti-Sune, H, Pi, T, U, L).',
        mnemonic: "H Case: R2 U2 R U2 R2 | Pi Case: F R U R' U' R U R' U' F'",
        algorithm: "R2 U2 R U2 R2 (H-Case OLL)",
        setupScramble: "R2 U2 R' U2 R2",
        demoMoves: "R2 U2 R U2 R2",
        explanation:
          'Both the top and bottom faces will now be solid colors! Identify the top corner orientation pattern and execute the matching OLL algorithm.',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          return p.y >= 0.1;
        },
      },
      {
        id: 3,
        title: 'Step 3: PBL (Permute Both Layers)',
        subtitle: 'Simultaneous Two-Layer Finish',
        goal: 'Permute both layers simultaneously in 1 fast algorithm to complete the 2×2 solve!',
        mnemonic: "Both Adjacent: R2 U' B2 U2 R2 U' R2 | Both Diagonal: R2 F2 R2",
        algorithm: "R2 U' B2 U2 R2 U' R2 (Adjacent/Adjacent PBL)",
        setupScramble: "R2 U R2 U2 B2 U R2",
        demoMoves: "R2 U' B2 U2 R2 U' R2",
        explanation:
          'Inspect both layers for bars of matching colors. If both top and bottom have an adjacent bar, hold them on Front and execute R2 U\' B2 U2 R2 U\' R2. If both have diagonal swaps, apply R2 F2 R2. In one step, the entire cube is solved!',
        filter: (sticker) => true,
      },
    ],
  },
};
