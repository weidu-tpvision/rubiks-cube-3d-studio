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
  reduction4x4: {
    cubeType: '4x4',
    name: "4×4 Reduction Method",
    shortName: "4×4 Reduction",
    badge: "6 Stages • Standard Revenge Method",
    desc: "The universal 4×4 solving method. Reduce the 4×4 into an equivalent 3×3 by solving all 6 center blocks (2×2 each) and pairing all 12 edge pairs (dedges), then solve with 3×3 algorithms and fix any parity cases.",
    stages: [
      {
        id: 1,
        title: 'Stage 1: White & Yellow Centers',
        subtitle: 'Opposite Centers First',
        goal: 'Solve the 4 white center pieces on the bottom/top, then solve the 4 yellow center pieces on the opposite face using slice half-turns without disturbing White.',
        mnemonic: "Slice-and-Restore: Rw U Rw' (or Rw U2 Rw') to protect solved centers!",
        algorithm: "Rw U Rw' U Rw U2 Rw'",
        setupScramble: "Rw U2 Rw' U' Rw U' Rw'",
        demoMoves: "Rw U Rw' U Rw U2 Rw'",
        explanation:
          'Unlike 3×3, 4×4 center pieces move freely and there is no fixed central core! Start by forming a 1×2 bar of white centers, then pair the second 1×2 bar and join them. Flip to the opposite face and solve Yellow using Rw U2 Rw\' to protect the solved White face.',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          return Math.abs(p.x) <= 0.6 && Math.abs(p.z) <= 0.6 && Math.abs(p.y) >= 1.0;
        },
      },
      {
        id: 2,
        title: 'Stage 2: Lateral Centers',
        subtitle: 'Green, Red, Blue, Orange (Respect Color Scheme)',
        goal: 'Solve the remaining 4 lateral center blocks. Note standard color order: with White on bottom and Yellow on top: Green -> Red -> Blue -> Orange (clockwise).',
        mnemonic: "Commutator: Fw R Fw' preserves adjacent completed lateral faces!",
        algorithm: "Fw R Fw' U' Fw R' Fw'",
        setupScramble: "Fw R Fw' U Fw R' Fw'",
        demoMoves: "Fw R Fw' U' Fw R' Fw'",
        explanation:
          'Build 1×2 center bars on the front face and insert them into their corresponding lateral faces using half-turn commutators like Fw R Fw\' so earlier centers are restored automatically.',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          return (Math.abs(p.x) <= 0.6 && Math.abs(p.y) <= 0.6) ||
                 (Math.abs(p.y) <= 0.6 && Math.abs(p.z) <= 0.6) ||
                 (Math.abs(p.x) <= 0.6 && Math.abs(p.z) <= 0.6);
        },
      },
      {
        id: 3,
        title: 'Stage 3: Edge Pairing (12 Dedges)',
        subtitle: 'Slice - Flip - Slice-Back Technique',
        goal: 'Pair up each matching pair of edge pieces (dedges) until all 12 composite 3×3-equivalent edges are completed.',
        mnemonic: "Slice-Flip-Restore: Uw' (R U R' F R' F' R) Uw",
        algorithm: "Uw' R U R' F R' F' R Uw",
        setupScramble: "Uw' R' F R F' R U' R' Uw",
        demoMoves: "Uw' R U R' F R' F' R Uw",
        explanation:
          'Place two matching edge pieces on the Front-Left and Front-Right positions. Slice with Uw\' to match the edge pieces together, execute the Flipping Algorithm (R U R\' F R\' F\' R) to flip the right edge and replace with an unsolved dedge, then slice back with Uw to restore all 6 center blocks!',
        filter: (sticker) => {
          const p = sticker.userData.cubie.position;
          const absX = Math.abs(p.x);
          const absY = Math.abs(p.y);
          const absZ = Math.abs(p.z);
          const isCorner = absX > 1.0 && absY > 1.0 && absZ > 1.0;
          const isCenter = (absX < 1.0 && absY < 1.0) || (absY < 1.0 && absZ < 1.0) || (absX < 1.0 && absZ < 1.0);
          return !isCorner && !isCenter;
        },
      },
      {
        id: 4,
        title: 'Stage 4: 3×3 Reduction Phase',
        subtitle: 'Solve as a Normal 3×3',
        goal: 'With all 6 centers solved and all 12 dedges paired, the cube behaves identically to a 3×3! Solve using outer turns only (U, D, L, R, F, B).',
        mnemonic: 'Use only single outer layer turns so paired dedges and centers stay intact!',
        algorithm: "R U R' U' R' F R2 U' R' U' R U R' F' (T-Perm)",
        setupScramble: "F R U' R' U R U R2 F' R U R U' R'",
        demoMoves: "R U R' U' R' F R2 U' R' U' R U R' F'",
        explanation:
          'Now that composite edges and centers are assembled, treat each 2×2 center block as one center, and each 1×2 dedge as one edge piece. Solve using your favorite 3×3 method (Beginner, CFOP, or Roux).',
        filter: (sticker) => true,
      },
      {
        id: 5,
        title: 'Stage 5: OLL Parity Resolution',
        subtitle: 'Single Flipped Dedge (Impossible on 3×3)',
        goal: 'Resolve the 4×4 OLL parity where a single edge pair is flipped in the top layer, which can never happen on a standard 3×3.',
        mnemonic: "OLL Parity: Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
        algorithm: "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
        setupScramble: "Rw U2 Rw U2 Rw' U2 Rw U2 Lw' U2 Rw U2 Rw' U2 Rw' U2 x' U2 Rw'",
        demoMoves: "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
        explanation:
          'Because 4×4 has internal degrees of freedom, an odd number of slice edge swaps can leave a single dedge flipped. Hold the flipped dedge in Front-Top and execute the famous 15-move OLL Parity algorithm.',
        filter: (sticker) => sticker.userData.cubie.position.y >= 1.0,
      },
      {
        id: 6,
        title: 'Stage 6: PLL Parity Resolution',
        subtitle: 'Opposite Edge Swap (Impossible on 3×3)',
        goal: 'Resolve the 4×4 PLL parity where two opposite dedges need to be swapped to complete the solve.',
        mnemonic: "PLL Parity: 2R2 U2 2R2 Uw2 2R2 2U2",
        algorithm: "2R2 U2 2R2 Uw2 2R2 2U2",
        setupScramble: "2U2 2R2 Uw2 2R2 U2 2R2",
        demoMoves: "2R2 U2 2R2 Uw2 2R2 2U2",
        explanation:
          'When two opposite edges are swapped in the last layer, apply the lightning-fast slice algorithm 2R2 U2 2R2 Uw2 2R2 2U2. It swaps Front-Top and Back-Top dedges in under 2 seconds!',
        filter: (sticker) => sticker.userData.cubie.position.y >= 1.0,
      },
    ],
  },
  parity4x4: {
    cubeType: '4x4',
    name: "4×4 Parities Guide",
    shortName: "4×4 Parities",
    badge: "2 Parities • Speedcubing Algorithms",
    desc: "Essential algorithms to overcome the two impossible 3×3 states on 4×4: OLL Parity (single flipped edge) and PLL Parity (opposite or adjacent two-edge swap).",
    stages: [
      {
        id: 1,
        title: 'OLL Parity: Single Flipped Dedge',
        subtitle: 'The 15-move Wide-Turn Algorithm',
        goal: 'Flip the Front-Top dedge without disturbing the rest of the F2L.',
        mnemonic: "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
        algorithm: "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
        setupScramble: "Rw U2 Rw U2 Rw' U2 Rw U2 Lw' U2 Rw U2 Rw' U2 Rw' U2 x' U2 Rw'",
        demoMoves: "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
        explanation:
          'Hold the flipped dedge at Front-Top. Each Rw turn rotates the two rightmost layers. Remember the rhythm: Rw U2 x, three Rw U2s, Lw U2, and four Rw U2s.',
        filter: (sticker) => sticker.userData.cubie.position.y >= 1.0,
      },
      {
        id: 2,
        title: 'PLL Parity: Opposite Edge Swap',
        subtitle: 'Inner-Slice & Wide Turn Algorithm',
        goal: 'Swap Front-Top and Back-Top dedges to finish the cube.',
        mnemonic: "2R2 U2 2R2 Uw2 2R2 2U2",
        algorithm: "2R2 U2 2R2 Uw2 2R2 2U2",
        setupScramble: "2U2 2R2 Uw2 2R2 U2 2R2",
        demoMoves: "2R2 U2 2R2 Uw2 2R2 2U2",
        explanation:
          'Hold the cube with the two swapped dedges at Front-Top and Back-Top. Execute 2R2 (right inner slice 180°), U2, 2R2, Uw2 (top two layers 180°), 2R2, 2U2 (top inner slice 180°).',
        filter: (sticker) => sticker.userData.cubie.position.y >= 1.0,
      },
    ],
  },
  pyraminxBeginner: {
    cubeType: 'pyraminx',
    name: "Pyraminx Beginner's Method",
    shortName: "Pyraminx (LBL)",
    badge: "4 Stages • ~12–16 Moves",
    desc: "The standard intuitive Layer-by-Layer method for Pyraminx. Solve the 4 tips, align the 4 centers, complete the first layer edges with triggers, and finish the last 3 edges with simple algorithms.",
    stages: [
      {
        id: 1,
        title: 'Stage 1: Orient Trivial Tips',
        subtitle: 'The 4 Corner Tips (u, l, r, b)',
        goal: 'Rotate the 4 vertex tips so their face colors match the center pieces directly below them.',
        mnemonic: 'Each tip is independent and takes at most one turn clockwise or counter-clockwise!',
        algorithm: "u l' r b",
        setupScramble: "u' l r' b'",
        demoMoves: "u l' r b",
        explanation:
          'Inspect each of the 4 corner tips (u, l, r, b). Twist each tip until all 3 of its colored stickers match the center piece directly below it.',
        filter: (sticker) => sticker.userData.pieceType === 'tip',
      },
      {
        id: 2,
        title: 'Stage 2: Align Center Pieces',
        subtitle: 'The "Radioactive / V-Shape" Pattern',
        goal: 'Bring the 3 Yellow center pieces onto the bottom face. This automatically aligns all 4 centers across the whole Pyraminx!',
        mnemonic: 'Find the vertex without Yellow (Top vertex U). The remaining 3 vertices (L, R, B) contain Yellow centers!',
        algorithm: "L R' B",
        setupScramble: "B' R L'",
        demoMoves: "L R' B",
        explanation:
          'Look for the vertex that has NO Yellow on it (that will be your Top vertex U). The other three vertices (Left, Right, Back) each have a Yellow sticker. Rotate L, R, and B until their Yellow stickers all face Down.',
        filter: (sticker) => sticker.userData.pieceType === 'center',
      },
      {
        id: 3,
        title: 'Stage 3: First Layer Edges',
        subtitle: 'Inserting the 3 Bottom Edges',
        goal: 'Insert the 3 bottom edges (Yellow-Green, Yellow-Red, Yellow-Blue) into place to finish the entire bottom layer.',
        mnemonic: "Right Insert: R U R' | Left Insert: L' U' L | Sledgehammer: R' L R L'",
        algorithm: "R U R' U' L' U' L",
        setupScramble: "L' U L U R U' R'",
        demoMoves: "R U R' U' L' U' L",
        explanation:
          'Find an edge with Yellow in the top layer. Match its non-yellow sticker with its face center. If it belongs on the right, use R U R\'. If left, use L\' U\' L. If an edge is flipped in the bottom, pop it out with R U\' R\'.',
        filter: (sticker) => sticker.userData.pieceType === 'edge' || sticker.userData.faceChar === 'D',
      },
      {
        id: 4,
        title: 'Stage 4: Last Layer Edges',
        subtitle: '3-Cycle Permutation & 2-Edge Flip',
        goal: 'Solve the remaining 3 top edges to complete the entire Pyraminx.',
        mnemonic: "3-Cycle: R U' R' U' R U' R' | 2-Edge Flip: (R' L R L') U (L' U' L)",
        algorithm: "R U' R' U' R U' R'",
        setupScramble: "R U R' U R U R'",
        demoMoves: "R U' R' U' R U' R'",
        explanation:
          'If the 3 edges need to cycle clockwise, perform R U\' R\' U\' R U\' R\'. If two edges are in the correct place but flipped like headlights, execute the 2-edge flip algorithm (R\' L R L\') U (L\' U\' L).',
        filter: (sticker) => true,
      },
    ],
  },
};
