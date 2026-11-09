/* berlin-switch — the Spree at the Oberbaum stretch: a brick bridge, the TV tower, and a club that does not stop. */
(() => {
  let M, N, NOON, GOLD, DUSK, NIGHT, DAWN, clamp, mix, smooth, rng;

  const PAD = 40;
  const BW = 400;
  const BH = 190;
  const LINE = 118; // water starts
  const GROUND = 108; // foot of the facades
  const FEET = 110; // where people stand on the promenade
  const BEAT = 130 / 60;

  // Bridge: main arches over the water, a small arcade carrying the U-Bahn above the road
  const BRIDGE_X = 110;
  const PITCH = 18;
  const SPANS = 6;
  const BRIDGE_END = BRIDGE_X + PITCH * SPANS + 3;
  const ROAD = 96;
  const DECK = 81;
  const TOWERS = [150, 173];
  const CLUB_DOOR = 293;
  const LEFT_END = 108;
  const RIGHT_START = 218;

  const hole = (x, y) => {
    const u = x - BRIDGE_X;
    const k = Math.floor(u / PITCH);
    if (k < 0 || k >= SPANS) return false;
    const d = u - k * PITCH;
    if (d < 3) return false;
    const t = Math.abs(d - 10) / 7.6;
    return y >= 103 + 6 * Math.pow(t, 1.3) && y < LINE;
  };
  const arcadeHole = (x, y) => {
    const d = (x - BRIDGE_X) % 9;
    if (d < 2) return false;
    const t = Math.abs(d - 5) / 3.6;
    return y >= 86 + 3.5 * Math.pow(t, 1.25) && y < ROAD;
  };

  const text = (w, str, x, y, m, font, gap = 1) => {
    let cx = x;
    for (const c of str) cx += w.glyph(c, cx, y, (px, py) => w.px(px, py, m), font) + gap;
  };

  const BIKE = ['..KK.....KK', '...F.....F.', '.TTFFFFFTT.', 'T...TFT...T', 'T...T.T...T', '.TTT...TTT.'];
  const bike = (w, x, y, frame, flip) => w.sprite(BIKE, { K: M.INK, F: frame, T: M.TIRE }, x, y - 5, flip);

  // Double casement with a stucco surround
  const win = (w, r, x, y, ww, wh, frame, style) => {
    w.rect(x - 1, y - 1, ww + 2, wh + 2, frame);
    w.rect(x, y, ww, wh, M.GLASS);
    w.rect(x, y, ww, 2, M.GLASS_HI);
    if (r() < 0.6) {
      const p = r();
      w.lightRect(x, y, ww, wh, p < 0.68 ? N.WARM : p < 0.86 ? N.WARM_DIM : N.FLUO, w.winGroups[Math.floor(r() * 28)]);
    }
    w.rect(x + (ww >> 1), y, 1, wh, M.WINF);
    w.rect(x, y + (wh >> 1) - 1, ww, 1, M.WINF);
    if (style === 'tri') {
      for (let i = 0; i < 3; i++) w.rect(x - 2 + i * 2, y - 2 - i, ww + 4 - i * 4, 1, frame);
    } else if (style === 'cap') {
      w.rect(x - 2, y - 2, ww + 4, 1, frame);
    }
    w.rect(x - 2, y + wh + 1, ww + 4, 1, frame);
  };

  const buildSkyline = (w, r) => {
    w.depth = 0;
    // Haze of the far city
    for (let x = -PAD; x < 360; ) {
      const wd = 8 + Math.floor(r() * 16);
      const top = 76 + Math.floor(r() * 12);
      w.rect(x, top, wd, 110 - top, M.FAR1);
      x += wd;
    }
    // A pair of domed towers on the avenue far off
    for (const x of [112, 121]) {
      w.rect(x, 62, 5, 40, M.FAR2);
      w.rect(x + 1, 58, 3, 4, M.FAR2);
      w.px(x + 2, 55, M.FAR2);
      w.rect(x + 2, 56, 1, 2, M.FAR2);
      for (let wy = 64; wy < 84; wy += 3) w.light(x + 2, wy, N.WARM_DIM, w.farWin[1]);
    }
    // Water tower
    w.rect(189, 54, 2, 10, M.FAR2);
    w.rect(186, 47, 8, 7, M.FAR2);
    w.rect(187, 45, 6, 2, M.FAR2);
    w.rect(186, 52, 8, 1, M.FAR3);

    // Gas holder: a drum in a tall lattice crown, the old gasworks
    const gx = 126;
    const gw = 22;
    for (let y = 58; y < 96; y++) {
      const inset = y < 61 ? 61 - y : 0;
      for (let i = inset; i < gw - inset; i++) w.px(gx + i, y, i < 4 ? M.GAS_L : i > gw - 6 ? M.GAS_D : M.GAS);
    }
    for (let y = 62; y < 96; y += 5) w.rect(gx, y, gw, 1, M.GAS_D);
    for (let i = 2; i < gw; i += 4) for (let y = 62; y < 96; y += 1) if ((y + i) % 2) w.px(gx + i, y, M.GAS_D);

    // Plattenbau: long identical slabs, flat roofs
    const slab = (x, top, wd, bottom) => {
      w.rect(x, top, wd, bottom - top, M.PLATTE);
      w.rect(x, top, wd, 1, M.PLATTE_D);
      for (let wy = top + 2; wy < bottom; wy += 3) {
        for (let wx = x + 1; wx < x + wd - 1; wx += 3) {
          if ((wx - x) % 15 === 13) continue;
          w.rect(wx, wy, 2, 1, M.PLATTE_W);
          if (r() < 0.42) {
            const g = w.farWin[Math.floor(r() * 5)];
            const n = r() < 0.72 ? N.WARM_DIM : N.FLUO;
            w.light(wx, wy, n, g);
            w.light(wx + 1, wy, n, g);
          }
        }
        w.rect(x + wd - 1, wy, 1, 1, M.PLATTE_D);
      }
      for (let wx = x + 14; wx < x + wd; wx += 15) w.rect(wx, top + 1, 1, bottom - top - 1, M.PLATTE_D);
    };
    slab(182, 60, 36, 100);
    slab(100, 68, 24, 100);
    slab(158, 74, 24, 100);
    // Brewery stack
    w.rect(199, 36, 4, 26, M.BRICK_F);
    w.rect(198, 34, 6, 2, M.BRICK_FD);
    w.rect(199, 40, 4, 1, M.BRICK_FD);
    w.chimney = [201, 33];

    // Far bank seen through the arches
    for (let x = BRIDGE_X - 4; x < RIGHT_START + 6; x++) {
      const h = 3 + Math.round(Math.sin(x * 0.37) * 2 + Math.sin(x * 0.11) * 2);
      w.rect(x, 110 - h, 1, h, M.FAR3);
    }
    w.rect(BRIDGE_X - 4, 110, RIGHT_START - BRIDGE_X + 10, 3, M.FAR3);
    w.rect(BRIDGE_X - 4, 113, RIGHT_START - BRIDGE_X + 10, 5, M.WATER_F);
    for (let x = BRIDGE_X - 4; x < RIGHT_START + 6; x += 3) w.px(x + (x % 2), 115 + (x % 3), M.WATER_FL);
    // Three flat metal figures standing in the river, leaning together
    w.sprite(
      ['.#...#...#.', '###.###.###', '.#...#...#.', '.##..#..##.', '..##.#.##..', '..#######..', '..##.#.##..', '.##..#..##.', '.#...#...#.', '.#...#...#.'],
      { '#': M.FIGURE },
      187,
      105,
    );
    for (let i = 0; i < 9; i += 2) w.px(188 + i, 115, M.FIGURE);
  };

  // The TV tower: needle, mirror ball, red-and-white tip
  const buildTower = (w) => {
    const cx = 165;
    w.depth = 0;
    for (let y = 44; y < 100; y++) {
      const hw = y < 62 ? 1 : y < 84 ? 2 : 3;
      w.rect(cx - hw, y, hw * 2 + 1, 1, M.TV);
      w.px(cx + hw, y, M.TV_D);
      w.px(cx - hw, y, M.TV_L);
    }
    // Pinched collar under the ball
    w.rect(cx - 2, 44, 5, 2, M.TV_D);
    const R = 6;
    const cy = 37;
    for (let j = -R; j <= R; j++) {
      for (let i = -R; i <= R; i++) {
        const d = i * i + j * j;
        if (d > R * R + 3) continue;
        let m = M.BALL;
        const lit = i * -0.5 + j * -0.7;
        if (lit > 2.4) m = M.BALL_L;
        else if (lit < -2.2) m = M.BALL_D;
        // Facets
        if ((i + j * 3) % 5 === 0 && d < 24) m = lit > 0 ? M.BALL : M.BALL_D;
        w.px(cx + i, cy + j, m);
      }
    }
    // Window ring of the restaurant, a bit under the equator
    for (let i = -6; i <= 6; i++) {
      w.px(cx + i, cy + 1, M.BALL_K);
      w.px(cx + i, cy + 2, M.BALL_K);
      if (i % 2 === 0) {
        w.light(cx + i, cy + 1, N.TVRING, w.tvRing);
        w.light(cx + i, cy + 2, N.WARM, w.tvRing);
      }
    }
    // Antenna, thinning
    w.rect(cx - 1, 26, 3, 5, M.TV);
    w.px(cx + 1, 27, M.TV_D);
    for (let y = 4; y < 26; y++) {
      const band = Math.floor((y - 4) / 3) % 2 === 0;
      const m = y < 19 ? (band ? M.ANT_R : M.ANT_W) : M.TV;
      w.px(cx, y, m);
      if (y >= 14) w.px(cx + 1, y, y < 19 ? (band ? M.ANT_R : M.ANT_W) : M.TV_D);
    }
    w.beacons.push([cx, 4], [cx, 13], [cx - 7, 37], [cx + 7, 37]);
  };

  const brickAt = (x, y) => {
    if (y % 3 === 0 && (x + y) % 11 !== 0) return M.BR_D;
    if ((x * 3 + y * 7) % 13 === 0) return M.BR_L;
    if ((x + y * 5) % 17 === 0) return M.BR_DD;
    return M.BR;
  };

  const buildBridge = (w) => {
    w.depth = 1;
    const x0 = BRIDGE_X;
    const x1 = BRIDGE_END;
    // Main body: arches over the water
    for (let y = ROAD; y < LINE; y++) {
      for (let x = x0; x < x1; x++) {
        if (hole(x, y)) continue;
        let m = brickAt(x, y);
        if (hole(x, y + 1) || hole(x, y + 2) || hole(x - 1, y) || hole(x + 1, y) || hole(x - 1, y + 1) || hole(x + 1, y + 1)) m = M.BR_DD;
        else if (hole(x, y + 3) || hole(x - 2, y + 1) || hole(x + 2, y + 1)) m = M.BR_L;
        w.px(x, y, m);
      }
    }
    // Shadow inside each vault
    for (let x = x0; x < x1; x++) {
      for (let y = 100; y < 110; y++) {
        if (!hole(x, y)) continue;
        if (!hole(x, y - 2) && !hole(x, y - 1) === false) w.px(x, y, M.VAULT);
        else if (!hole(x, y - 1)) w.px(x, y, M.VAULT);
        break;
      }
    }
    // Cutwaters on the piers
    for (let k = 0; k <= SPANS; k++) {
      const px = x0 + k * PITCH;
      w.rect(px, 111, 3, 7, M.BR_D);
      w.rect(px + 1, 109, 1, 9, M.BR_L);
      w.rect(px - 1, 116, 5, 2, M.STONE_D);
    }
    // Road parapet with a run of glazed diamonds
    w.rect(x0, ROAD, x1 - x0, 1, M.STONE);
    w.rect(x0, ROAD + 1, x1 - x0, 3, M.BR);
    w.rect(x0, ROAD + 4, x1 - x0, 1, M.STONE_D);
    for (let x = x0 + 2; x < x1; x += 4) {
      w.px(x, ROAD + 2, M.BR_G);
      w.px(x + 1, ROAD + 1, M.BR_DD);
      w.px(x + 1, ROAD + 3, M.BR_DD);
    }
    // Pointed arcade behind the road
    for (let y = DECK + 3; y < ROAD; y++) {
      for (let x = x0; x < x1; x++) {
        if (arcadeHole(x, y)) continue;
        w.px(x, y, arcadeHole(x, y + 1) || arcadeHole(x + 1, y) || arcadeHole(x - 1, y) ? M.BR_DD : brickAt(x, y));
      }
    }
    // Road surface shadow seen through the arcade
    w.rect(x0, ROAD - 1, x1 - x0, 1, M.STONE_K);
    // Upper deck
    w.rect(x0, DECK, x1 - x0, 1, M.STEEL_DK);
    w.rect(x0, DECK + 1, x1 - x0, 2, M.BR_D);
    for (let x = x0; x < x1; x += 3) w.px(x, DECK + 1, M.BR_L);

    // Two slim crenellated towers, joined at the top
    for (const tx of TOWERS) {
      for (let y = 52; y < ROAD; y++) {
        w.depth = y < 84 ? 2 : 1;
        for (let i = 0; i < 8; i++) {
          let m = brickAt(tx + i, y);
          if (i === 0) m = M.BR_L;
          if (i === 7) m = M.BR_DD;
          if (i === 6) m = M.BR_D;
          w.px(tx + i, y, m);
        }
      }
      w.depth = 2;
      // Battlements
      for (let i = -1; i < 9; i++) {
        w.px(tx + i, 53, M.BR_L);
        w.px(tx + i, 54, M.BR_DD);
        w.px(tx + i, 52, M.BR_D);
        if ((i + 1) % 3 !== 2) {
          w.px(tx + i, 51, M.BR);
          w.px(tx + i, 50, M.BR_L);
        }
      }
      // Corner pinnacles
      w.rect(tx - 1, 48, 2, 3, M.BR_L);
      w.rect(tx + 7, 48, 2, 3, M.BR_D);
      w.px(tx - 1, 47, M.BR_G);
      w.px(tx + 8, 47, M.BR_G);
      // Pointed slits, one per stage
      for (const sy of [58, 68]) {
        w.rect(tx + 3, sy + 1, 2, 5, M.ROOM);
        w.px(tx + 3, sy, M.ROOM);
        w.lightRect(tx + 3, sy + 1, 2, 5, N.WARM, w.bridgeLamp);
        w.light(tx + 3, sy, N.WARM, w.bridgeLamp);
        w.rect(tx + 2, sy + 6, 4, 1, M.STONE);
      }
      w.rect(tx - 1, 76, 10, 1, M.STONE);
      w.rect(tx - 1, 66, 10, 1, M.BR_G);
    }
    // Joining gallery
    w.depth = 2;
    for (let y = 56; y < 62; y++) for (let x = TOWERS[0] + 8; x < TOWERS[1]; x++) w.px(x, y, brickAt(x, y));
    w.rect(TOWERS[0] + 8, 62, TOWERS[1] - TOWERS[0] - 8, 1, M.STONE_D);
    w.rect(TOWERS[0] + 8, 55, TOWERS[1] - TOWERS[0] - 8, 1, M.BR_L);
    for (let x = TOWERS[0] + 9; x < TOWERS[1] - 1; x += 3) {
      w.rect(x, 58, 1, 3, M.ROOM);
      w.light(x, 58, N.WARM, w.bridgeLamp);
      w.light(x, 59, N.WARM, w.bridgeLamp);
      w.light(x, 60, N.WARM, w.bridgeLamp);
      w.px(x + 1, 54, M.BR);
    }
    // The hanging frame for the hands
    w.rect(161, 63, 1, 1, M.WIRE);
    w.rect(169, 63, 1, 1, M.WIRE);
    // Floodlights in the vaults
    for (let k = 0; k < SPANS; k++) {
      const cx = x0 + k * PITCH + 10;
      w.light(cx, 103, N.SODIUM, w.bridgeLamp);
      w.light(cx - 1, 104, N.SODIUM, w.bridgeLamp);
      w.light(cx + 1, 104, N.SODIUM, w.bridgeLamp);
    }
    // A blue square with a white U, nothing more
    w.depth = 2;
    const ug = w.addGroup(17.9, 33.9);
    w.rect(211, 65, 1, 16, M.STEEL_DK);
    w.rect(205, 52, 13, 13, M.BOARD_B);
    w.lightRect(205, 52, 13, 13, N.B_BLUE, ug);
    w.glyph('U', 209, 55, (x, y) => w.tube(x, y, M.BOARD_W, N.HOTELW, ug), 5);
    w.depth = 1;
    // Someone's bike, chained to the parapet
    bike(w, 126, ROAD, M.BOARD_R);
  };

  const buildLeft = (w, r) => {
    w.depth = 2;
    // ---- Firewall, windowless, with a coal merchant's ghost on it
    w.rect(84, 30, 24, 80, M.FIRE);
    for (let y = 30; y < 110; y++) for (let x = 84; x < 108; x++) if ((x * 7 + y * 13 + Math.floor(y / 6) * 5) % 19 === 0) w.px(x, y, M.FIRE_D);
    w.rect(84, 30, 24, 1, M.FIRE_D);
    for (let i = 0; i < 4; i++) w.rect(84 + i * 6, 27 + (i % 2), 6, 3, M.FIRE);
    w.rect(107, 30, 1, 80, M.FIRE_D);
    w.rect(86, 42, 20, 11, M.FIRE_D);
    text(w, 'KOHLE', 87, 45, M.GHOST);
    w.rect(86, 54, 20, 1, M.GHOST);

    // ---- Altbau 2: unrenovated, grey render, bullet scars from 1945 still in it
    w.rect(52, 40, 32, 70, M.RAW);
    for (let y = 40; y < 110; y++) {
      for (let x = 52; x < 84; x++) {
        const v = (x * 11 + y * 17 + (x >> 2) * 3) % 23;
        if (v === 0) w.px(x, y, M.RAW_D);
        else if (v === 7 && y > 60) w.px(x, y, M.RAW_K);
      }
    }
    // Scorched patch of bare brick
    for (let i = 0; i < 40; i++) w.px(70 + Math.floor(r() * 12), 62 + Math.floor(r() * 10), r() < 0.5 ? M.BRICK : M.BRICK_DK);
    w.rect(52, 38, 32, 2, M.RAW_L);
    w.rect(52, 40, 32, 1, M.RAW_D);
    for (let x = 54; x < 84; x += 3) w.px(x, 37, M.RAW_L);
    for (const fy of [43, 57, 71]) {
      w.rect(52, fy + 12, 32, 1, M.RAW_D);
      for (const fx of [55, 65, 75]) win(w, r, fx, fy, 6, 9, M.RAW_L, fy === 57 ? 'cap' : '');
    }
    // Roof with the antenna everyone forgot
    for (let i = 0; i < 6; i++) w.rect(52 + i, 37 - i, 32 - i * 2, 1, M.ROOF);
    w.rect(62, 25, 1, 7, M.STEEL_DK);
    w.rect(59, 26, 7, 1, M.STEEL_DK);
    w.rect(60, 28, 5, 1, M.STEEL_DK);

    // ---- Altbau 1: the ornate cream corner house
    w.rect(-PAD, 30, 92, 80, M.ALT);
    // Mansard
    w.rect(-PAD, 22, 80, 8, M.ROOF);
    w.rect(-PAD, 21, 80, 1, M.ROOF_L);
    for (const dx of [-30, -14, 2, 24]) {
      w.rect(dx, 23, 6, 6, M.ALT_L);
      w.rect(dx + 1, 24, 4, 4, M.GLASS);
      if (dx % 4 === 0) w.lightRect(dx + 1, 24, 4, 4, N.WARM, w.winGroups[Math.floor(r() * 28)]);
      w.rect(dx - 1, 22, 8, 1, M.ROOF_L);
    }
    for (const cx of [-18, 12, 32]) {
      w.rect(cx, 15, 5, 7, M.BRICK);
      w.rect(cx - 1, 14, 7, 1, M.BRICK_DK);
    }
    // Cornice with dentils
    w.rect(-PAD, 29, 92, 1, M.ALT_L);
    w.rect(-PAD, 30, 92, 2, M.ALT_D);
    for (let x = -PAD; x < 52; x += 2) w.px(x, 32, M.ALT_L);
    // Stucco bands between floors, a garland under the top
    for (const y of [47, 61, 75]) {
      w.rect(-PAD, y, 92, 1, M.ALT_L);
      w.rect(-PAD, y + 1, 92, 1, M.ALT_D);
    }
    for (let x = -36; x < 52; x += 4) {
      w.px(x, 34, M.ALT_D);
      w.px(x + 1, 35, M.ALT_D);
      w.px(x + 2, 34, M.ALT_D);
    }
    const FLOORS = [36, 50, 64, 78];
    const STYLE = ['', 'cap', 'tri', 'tri'];
    FLOORS.forEach((fy, f) => {
      for (const fx of [-38, -27, -16, -5, 28]) win(w, r, fx, fy, 6, f === 3 ? 8 : 9, M.ALT_L, STYLE[f]);
    });
    // Ground floor rustication
    w.rect(-PAD, 88, 92, 20, M.ALT_D);
    for (let y = 90; y < 108; y += 3) w.rect(-PAD, y, 92, 1, M.ALT_DD);
    w.rect(-PAD, 87, 92, 1, M.ALT_L);

    // Bay window rising from the first floor, its own little roof
    w.rect(8, 47, 18, 41, M.ALT_L);
    w.rect(24, 47, 2, 41, M.ALT_D);
    w.rect(8, 47, 1, 41, M.ALT);
    for (let i = 0; i < 4; i++) w.rect(10 + i * 2, 88 + i, 14 - i * 4, 1, i % 2 ? M.ALT_D : M.ALT_L);
    w.rect(7, 45, 20, 2, M.ALT_D);
    for (let i = 0; i < 4; i++) w.rect(9 + i * 2, 41 + (3 - i), 16 - i * 4, 1, M.ZINC);
    for (const fy of [49, 63, 77]) {
      for (const fx of [10, 15, 20]) win(w, r, fx, fy, 3, 8, M.ALT_L, '');
      w.rect(8, fy + 11, 18, 1, M.ALT_D);
    }
    // A balcony with a washed-out flower box and a bicycle on it, because the cellar got raided
    w.rect(27, 74, 9, 1, M.STEEL_DK);
    for (let x = 27; x < 36; x += 2) w.rect(x, 71, 1, 3, M.STEEL_DK);
    w.rect(27, 70, 9, 1, M.STEEL_DK);
    w.rect(27, 69, 9, 1, M.LEAF);
    w.px(28, 68, M.BOARD_R);
    w.px(31, 68, M.BOARD_P);
    w.px(34, 68, M.BOARD_R);
    // Corner turret with a verdigris dome
    w.rect(39, 18, 13, 70, M.ALT);
    w.rect(39, 18, 2, 70, M.ALT_L);
    w.rect(50, 18, 2, 70, M.ALT_D);
    w.rect(38, 28, 15, 2, M.ALT_D);
    for (const fy of [20, 36, 50, 64, 78]) win(w, r, 43, fy, 5, 8, M.ALT_L, fy > 40 ? 'cap' : '');
    for (let j = 0; j < 10; j++) {
      const hw = Math.round(Math.sqrt(1 - (j / 10) * (j / 10)) * 7);
      w.rect(45 - hw, 17 - j, hw * 2 + 1, 1, j < 3 ? M.COPPER : M.COPPER_L);
      w.px(45 + hw, 17 - j, M.COPPER_D);
    }
    w.rect(45, 3, 1, 5, M.STEEL_DK);
    w.px(44, 5, M.STEEL_DK);
    w.px(46, 5, M.STEEL_DK);

    // Stairwell door, bell panel, and everything stuck on it
    w.rect(2, 94, 8, 14, M.WOOD_DK);
    w.rect(3, 95, 2, 5, M.GLASS);
    w.rect(7, 95, 2, 5, M.GLASS);
    w.rect(2, 93, 8, 1, M.ALT_L);
    w.rect(11, 97, 2, 5, M.STEEL_LT);

    // Paste-ups to head height, torn and stacked
    const pasteCols = [M.POSTER_A, M.POSTER_B, M.POSTER_C, M.BOARD_P, M.BOARD_W, M.BOARD_G];
    for (let i = 0; i < 18; i++) {
      const px = -PAD + Math.floor(r() * 38);
      const py = 95 + Math.floor(r() * 7);
      const pw = 3 + Math.floor(r() * 4);
      w.rect(px, py, pw, 5, pasteCols[Math.floor(r() * pasteCols.length)]);
      w.rect(px + 1, py + 1, pw - 2, 1, M.BOARD_W);
      if (r() < 0.5) w.px(px + pw - 1, py + 4, M.ALT_D);
    }
    // Tags
    const tag = (x, y, m, seed) => {
      const t = rng(seed);
      let py = y;
      for (let i = 0; i < 12; i++) {
        py = clamp(py + Math.floor(t() * 5) - 2, y - 3, y + 3);
        w.px(x + i, py, m);
        if (t() < 0.4) w.px(x + i, py + 1, m);
      }
    };
    tag(-30, 98, M.PAINT_K, 3);
    tag(-16, 101, M.BOARD_B, 4);
    tag(-6, 96, M.PAINT_K, 5);
    tag(12, 104, M.BOARD_R, 6);

    // ---- Späti
    w.rect(22, 88, 30, 20, M.SPATI);
    w.rect(23, 99, 7, 9, M.WOOD_DK);
    w.rect(24, 100, 5, 5, M.SPATI_G);
    w.lightRect(24, 100, 5, 5, N.STORE, w.spatiLight);
    w.px(28, 104, M.BOARD_R);
    // Window: fridge after fridge of bottles
    w.rect(31, 99, 19, 9, M.SPATI_G);
    w.lightRect(31, 99, 19, 9, N.STORE, w.spatiLight);
    const bottle = [M.BOARD_G, M.BOARD_O, M.GLASS_DK, M.BOARD_R, M.BOARD_G, M.BOARD_Y];
    for (const sy of [100, 103, 106]) {
      for (let x = 32; x < 49; x += 2) w.rect(x, sy, 1, 2, bottle[(x + sy) % bottle.length]);
      w.rect(31, sy + 2, 19, 1, M.STEEL_LT);
    }
    w.rect(30, 99, 1, 9, M.WOOD);
    w.rect(50, 99, 2, 9, M.WOOD);
    // Yellow board, a bit too small for how bright it is
    w.hsign(22, 87, 30, 11, 'SPÄTI', { n: N.B_YELLOW, g: w.spatiSign, board: M.BOARD_Y, mode: 'lit', font: 5 });
    w.rect(22, 98, 30, 1, M.PAINT_K);
    // Chalkboard on the pavement
    w.rect(31, 103, 17, 7, M.CHALK);
    w.rect(31, 103, 17, 1, M.WOOD);
    w.rect(31, 109, 17, 1, M.WOOD);
    w.rect(31, 103, 1, 7, M.WOOD);
    w.rect(47, 103, 1, 7, M.WOOD);
    text(w, 'BIER', 32, 104, M.CHALK_W);
    // Beer crates
    const crate = (x, y, m) => {
      w.rect(x, y, 6, 4, m);
      w.rect(x, y, 6, 1, M.GLASS_DK);
      for (let i = 0; i < 6; i += 2) w.px(x + i, y - 1, M.BOARD_G);
      w.rect(x + 1, y + 2, 4, 1, M.PAINT_K);
    };
    crate(23, 106, M.BOARD_R);
    crate(23, 102, M.BOARD_B);

    // ---- The Wall: 3.6 m is twice a person. Original murals on the remaining stretch.
    const WX = 54;
    const WW = 34;
    const WT = 88;
    w.rect(WX, WT, WW, GROUND - WT, M.WALLP);
    const k = { K: M.PAINT_K, W: M.BOARD_W, R: M.MUR_RED, Y: M.MUR_YEL, B: M.MUR_BLU, G: M.MUR_GRN, P: M.MUR_PINK, C: M.MUR_CYAN };
    [M.MUR_PINK, M.MUR_CYAN, M.MUR_YEL, M.MUR_RED, M.MUR_BLU].forEach((m, i) => w.rect(WX + i * 7, WT + 1, i === 4 ? 6 : 7, GROUND - WT - 1, m));
    // Big eye over drips
    w.sprite(['..KKK..', '.KWWWK.', 'KWWBKWK', 'KWWKKWK', '.KWWWK.', '..KKK..'], k, WX, WT + 2);
    w.sprite(['K.K.K.K', 'K.K.K.K', '..K.K.K', '..K...K', '..K....'], k, WX, WT + 10);
    // Grin full of teeth, a heart for a tongue
    w.sprite(['KKKKKKK', 'KWKWKWK', 'KWKWKWK', 'KKKKKKK', 'K.RRR.K', '.KKKKK.'], k, WX + 7, WT + 3);
    w.sprite(['.RR.RR.', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'], k, WX + 7, WT + 12);
    // Lightning, it just keeps going
    w.sprite(['....RRK', '...RRK.', '..RRK..', '.RRRRRK', '...RRK.', '..RRK..', '.RRK...', 'RRK....'], k, WX + 14, WT + 3);
    w.rect(WX + 14, WT + 14, 7, 2, M.PAINT_K);
    w.rect(WX + 15, WT + 17, 5, 1, M.PAINT_K);
    // Spiral, the bike got here first
    w.sprite(['YYYYYYY', 'Y.....Y', 'Y.YYY.Y', 'Y.Y.Y.Y', 'Y.Y...Y', 'Y.YYYYY', 'Y......', 'YYYYYYY'], k, WX + 21, WT + 3);
    w.rect(WX + 22, WT + 14, 5, 1, M.MUR_YEL);
    // A sun on blue, green checks underneath
    w.sprite(['..Y...', 'Y.Y.Y.', '.YYY..', 'YYYYYY', '.YYY..', 'Y.Y.Y.', '..Y...'], k, WX + 28, WT + 2);
    for (let j = 0; j < 8; j += 2) for (let i = j % 4 ? 0 : 2; i < 6; i += 4) w.rect(WX + 28 + i, WT + 11 + j, 2, 2, M.MUR_GRN);
    // Slab joints, every 1.2 m
    for (let i = 4; i < WW; i += 5) for (let y = WT + 1; y < GROUND; y += 2) w.px(WX + i, y, M.WALL_J);
    w.rect(WX, WT, WW, 1, M.WALLP);
    w.rect(WX, WT - 1, WW, 1, M.WALL_J);
    // Scrawled over the art, as is tradition
    tag(WX + 1, 105, M.PAINT_K, 11);
    tag(WX + 17, 106, M.PAINT_K, 12);

    // Bench, and a bike against the wall
    w.rect(76, 104, 11, 1, M.WOOD_LT);
    w.rect(76, 105, 11, 1, M.WOOD);
    w.rect(77, 106, 1, 4, M.STEEL_DK);
    w.rect(85, 106, 1, 4, M.STEEL_DK);
    bike(w, 56, FEET - 1, M.BOARD_B);

    // Abutment where the road climbs to the bridge
    for (let y = 92; y < LINE; y++) w.rect(108, y, 3, 1, y % 3 ? M.BR_D : M.BR_DD);

    // Döner stand against the firewall: kept shut at night, opened in draw
    w.rect(88, 97, 20, 13, M.STAND);
    w.rect(88, 107, 20, 3, M.STAND_D);
    w.rect(90, 99, 16, 7, M.ROOM);
    w.rect(88, 106, 20, 1, M.STEEL_LT);
    // Sign over a striped awning
    w.hsign(87, 89, 22, 7, 'DöNER', { n: N.B_RED, g: w.standSign, board: M.BOARD_W, mode: 'lit', ink: M.BOARD_R });
    w.rect(87, 96, 22, 1, M.PAINT_K);
    for (let i = 0; i < 22; i++) {
      w.px(87 + i, 97, i % 4 < 2 ? M.BOARD_G : M.BOARD_W);
      w.px(87 + i, 98, i % 4 < 2 ? M.BOARD_G : M.BOARD_W);
    }

    // ---- Ampelmann on his pole, big enough to read from over the river
    w.rect(51, 86, 1, 24, M.AMPEL_P);
    w.rect(46, 59, 11, 27, M.AMPEL_B);
    w.rect(46, 59, 11, 1, M.AMPEL_P);
    w.rect(47, 72, 9, 1, M.AMPEL_P);
    w.rect(46, 85, 11, 1, M.AMPEL_P);
    w.rect(47, 60, 9, 12, M.AMPEL_L);
    w.rect(47, 73, 9, 12, M.AMPEL_L);
    // Sticker-covered button box
    w.rect(50, 97, 3, 5, M.BOARD_Y);
    w.px(51, 99, M.BOARD_R);
    w.px(52, 101, M.BOARD_B);
  };

  // Litfaß column, promenade, quay and trees: all in front of the houses
  const buildBanks = (w, r) => {
    w.depth = 2;
    const paved = (x0, x1) => {
      for (let y = GROUND; y < 113; y++) {
        for (let x = x0; x < x1; x++) {
          // Berlin pavement: granite slabs down the middle, small mosaic stones at the edges
          let m = y === GROUND ? M.WALK_D : M.WALK;
          if (y === GROUND + 2 || y === GROUND + 3) m = (x + y * 3) % 8 === 0 ? M.WALK_D : M.SLAB;
          else if ((x * 3 + y * 5) % 7 === 0) m = M.WALK_D;
          w.px(x, y, m);
        }
      }
      // Quay wall in big dressed blocks
      for (let y = 113; y < LINE; y++) {
        for (let x = x0; x < x1; x++) {
          let m = y === 113 ? M.STONE : y > 116 ? M.STONE_W : M.STONE_D;
          if (y === 115 || (y === 114 && x % 9 === 0) || (y === 116 && (x + 4) % 9 === 0)) m = M.STONE_K;
          w.px(x, y, m);
        }
      }
    };
    paved(-PAD, LEFT_END);
    paved(BRIDGE_END - PITCH - 3, 360);
    // Painted double-row line of the old border across the pavement
    for (let x = 46; x < 54; x += 2) {
      w.px(x, 110, M.STONE_K);
      w.px(x + 1, 111, M.STONE_K);
    }
    // Steps down to the water, both banks
    const steps = (x0, wd) => {
      for (let i = 0; i < 5; i++) {
        w.rect(x0 + i * 2, 113 + i, wd - i * 2, 1, i % 2 ? M.STONE_D : M.STONE);
        w.rect(x0 + i * 2, 113 + i, 2, LINE - 113 - i, M.STONE);
      }
    };
    steps(14, 16);
    steps(262, 16);
    // Mooring rings
    for (const x of [62, 88, 236, 308]) {
      w.px(x, 115, M.STEEL_LT);
      w.px(x, 116, M.TIRE);
    }
    // Lifebuoy on a post
    w.rect(82, 106, 1, 7, M.STEEL_DK);
    w.sprite(['.OWO.', 'O...W', 'W...O', '.OWO.'], { O: M.BOARD_O, W: M.BOARD_W }, 80, 103);

    bike(w, 2, FEET - 1, M.TEAL);
    // Rental scooters: one on its side on the pavement, one in the river, as ever
    w.rect(34, 111, 8, 1, M.SCOOTER);
    w.px(41, 110, M.SCOOTER);
    w.px(34, 112, M.TIRE);
    w.px(41, 112, M.TIRE);

    // Litfaß column: Berlin invented them in 1855
    w.rect(13, 90, 8, 20, M.LITFASS);
    const stripes = [M.POSTER_A, M.BOARD_W, M.POSTER_C, M.POSTER_B, M.BOARD_P, M.POSTER_A];
    for (let i = 0; i < 6; i++) w.rect(14 + i, 92 + (i % 2), 1, 13 - (i % 3), stripes[i]);
    for (let y = 95; y < 104; y += 3) w.rect(14, y, 6, 1, M.BOARD_W);
    w.rect(13, 90, 1, 20, M.LITFASS_L);
    w.rect(20, 90, 1, 20, M.PAINT_K);
    w.rect(12, 89, 10, 1, M.LITFASS);
    w.rect(13, 88, 8, 1, M.LITFASS_L);
    w.rect(15, 86, 4, 2, M.LITFASS);
    w.rect(16, 85, 2, 1, M.LITFASS_L);
    w.rect(12, 108, 10, 2, M.LITFASS);

    // Gas lanterns: Berlin still burns gas on its streets
    w.lamps = [];
    for (const lx of [6, 78, 226, 306]) {
      w.rect(lx, 94, 1, 17, M.LAMP_P);
      w.rect(lx - 1, 110, 3, 1, M.LAMP_P);
      w.rect(lx - 1, 90, 3, 4, M.LAMP_G);
      w.rect(lx - 2, 89, 5, 1, M.LAMP_P);
      w.px(lx, 88, M.LAMP_P);
      w.lightRect(lx - 1, 90, 3, 4, N.GAS, w.addGroup(17.4 + (lx % 7) * 0.05, 29.2, 'neon', { soft: true }));
    }
  };

  const tree = (w, cx, cy, rx, ry, seed, base = 110) => {
    const r = rng(seed);
    w.depth = 3;
    w.rect(cx, cy + ry - 2, 2, base - cy - ry + 2, M.BARK);
    w.rect(cx - 1, base - 2, 1, 2, M.BARK);
    w.px(cx - 2, cy + ry - 1, M.BARK);
    w.px(cx + 3, cy + ry - 2, M.BARK);
    w.rect(cx + 1, cy + ry - 2, 1, base - cy - ry + 2, M.BARK_LT);
    const edge = [];
    for (let j = -ry; j <= ry; j++) {
      for (let i = -rx; i <= rx; i++) {
        const q = (i * i) / (rx * rx) + (j * j) / (ry * ry) + (Math.sin(i * 1.3 + seed) + Math.sin(j * 1.7 + seed)) * 0.09;
        if (q > 1) continue;
        const v = r();
        const lit = -i * 0.4 - j * 0.7;
        let m = M.LEAF;
        if (lit > ry * 0.32 && v < 0.7) m = M.LEAF_L;
        else if (lit < -ry * 0.25 && v < 0.75) m = M.LEAF_D;
        else if (v < 0.16) m = M.LEAF_D;
        else if (v > 0.9) m = M.LEAF_L;
        w.px(cx + i, cy + j, m);
        if (q > 0.75 && v > 0.7) edge.push([cx + i, cy + j]);
      }
    }
    return edge;
  };

  // The right bank: a house that is all signs, the power station, a low shed
  const buildRight = (w, r) => {
    w.depth = 2;
    const ax = RIGHT_START;
    // ---- House A
    w.rect(ax, 30, 41, 80, M.DARKB);
    for (let y = 30; y < 108; y++) for (let x = ax; x < ax + 41; x++) if ((x * 5 + y * 3) % 17 === 0) w.px(x, y, M.DARKB_D);
    w.rect(ax - 1, 29, 43, 1, M.DARKB_L);
    w.rect(ax - 1, 30, 43, 1, M.DARKB_D);
    w.rect(ax, 40, 41, 1, M.DARKB_D);
    // Hotel windows between the signs
    win(w, r, 234, 56, 6, 8, M.DARKB_L, 'cap');
    win(w, r, 243, 56, 6, 8, M.DARKB_L, 'cap');
    // A curtain half pulled, it's that kind of hotel
    w.rect(234, 56, 2, 8, M.BOARD_R);

    // Rooftop hoarding on legs
    for (const lx of [221, 238, 254]) {
      w.rect(lx, 27, 1, 3, M.STEEL_DK);
      w.px(lx - 1, 28, M.STEEL_DK);
      w.px(lx + 1, 28, M.STEEL_DK);
    }
    w.hsign(215, 18, 45, 9, 'CURRYWURST', { n: N.YELLOW, g: w.addGroup(18.3, 28.3), off: M.TUBE });
    w.rect(215, 27, 45, 1, M.STEEL_DK);

    w.hsign(219, 32, 39, 7, 'SPäTI 24H', { n: N.CYAN, g: w.addGroup(18.5, 34.5) });

    // Walking man, frame for the neon that animates in draw
    w.rect(219, 41, 12, 28, M.BOARD_K);
    w.rect(230, 41, 1, 28, M.PAINT_K);
    w.rect(219, 41, 12, 1, M.STEEL_DK);

    w.hsign(231, 42, 19, 11, 'BAR', { n: N.PINK, g: w.addGroup(18.7, 28.4), font: 5 });
    w.vsign(251, 41, 'HOTEL', { n: N.HOTELW, g: w.addGroup(18.25, 28.6), font: 5, w: 8, pad: 2 });
    // Never turns off. It's the joke.
    w.hsign(219, 70, 31, 11, 'OFFEN', { n: N.OFFEN, g: w.offenG, font: 5, off: M.TUBE });
    w.hsign(219, 81, 31, 11, 'DÖNER', { n: N.ORANGE, g: w.addGroup(18.1, 29.2), font: 5 });
    // Neon spit next to the sign
    w.rect(250, 84, 9, 9, M.BOARD_K);
    // Ground floor: döner shop, spit in the window
    w.rect(219, 92, 18, 16, M.WOOD_DK);
    w.rect(220, 93, 16, 11, M.SHOPG);
    w.lightRect(220, 93, 16, 11, N.WARM, w.addGroup(12, 40, 'room'));
    w.rect(220, 104, 16, 1, M.STEEL_LT);
    // Cinema, the marquee above the heads of the queue
    w.rect(237, 92, 22, 16, M.KINO);
    w.hsign(237, 93, 22, 9, 'KINO', { n: N.HOTELW, g: w.kinoG, board: M.KINO_D, font: 5 });
    for (const px of [240, 248]) {
      w.rect(px, 103, 5, 5, M.BOARD_K);
      w.rect(px + 1, 104, 3, 3, M.POSTER_B);
      w.lightRect(px + 1, 104, 3, 3, N.STORE, w.kinoG);
    }
    w.rect(254, 103, 4, 5, M.GLASS_DK);
    bike(w, 228, FEET - 1, M.BOARD_O, true);

    // ---- Power station. Almost nothing written on it.
    const cx = 259;
    const cw = 43;
    w.depth = 2;
    // Stack behind
    w.rect(285, 6, 9, 20, M.CLUB_D);
    w.rect(285, 6, 2, 20, M.CLUB);
    w.rect(284, 4, 11, 2, M.CLUB_DD);
    w.rect(285, 12, 9, 1, M.CLUB_DD);
    w.rect(285, 19, 9, 1, M.CLUB_DD);
    w.rect(cx, 26, cw, 84, M.CLUB);
    // Shuttering marks and rain stains
    for (let y = 26; y < 108; y++) {
      for (let x = cx; x < cx + cw; x++) {
        const u = x - cx;
        let m = 0;
        if (y % 5 === 0 && (x + y) % 3) m = M.CLUB_D;
        if (u % 7 === 0) m = M.CLUB_L;
        else if (u % 7 === 6) m = M.CLUB_DD;
        else if (u % 7 === 5) m = M.CLUB_D;
        if (!m && ((x * 13) ^ (y >> 3)) % 29 === 0) m = M.CLUB_DD;
        if (m) w.px(x, y, m);
      }
    }
    w.rect(cx - 1, 26, cw + 2, 2, M.CLUB_L);
    w.rect(cx, 28, cw, 1, M.CLUB_DD);
    w.rect(cx, 56, cw, 2, M.CLUB_DD);
    w.rect(cx, 55, cw, 1, M.CLUB_L);
    // High slits, nothing else
    for (let i = 0; i < 6; i++) {
      const sx = cx + 2 + i * 7;
      w.rect(sx, 33, 3, 20, i % 2 ? M.SLIT_G : M.SLIT_V);
      const lit = i % 2 ? N.ACID : N.UV;
      const g = i % 2 ? w.clubG : w.clubV;
      w.lightRect(sx, 33, 3, 20, lit, g);
      for (let wy = 37; wy < 53; wy += 5) w.rect(sx, wy, 3, 1, M.SLIT);
      // Light licks the concrete round each one
      const wash = i % 2 ? N.WASH_G : N.WASH_V;
      const wg = i % 2 ? w.washG : w.washV;
      for (let y = 31; y < 55; y++) {
        w.light(sx - 1, y, wash, wg);
        w.light(sx + 3, y, wash, wg);
      }
      for (let dx = 0; dx < 3; dx++) {
        w.light(sx + dx, 32, wash, wg);
        w.light(sx + dx, 53, wash, wg);
      }
    }
    // The roofline catches it
    for (let x = cx; x < cx + cw; x++) w.light(x, 27, x % 2 ? N.WASH_V : N.WASH_G, x % 2 ? w.washV : w.washG);
    // Low band near the street, brighter so black coats read against it
    for (let y = 94; y < 108; y++) for (let x = cx; x < cx + cw; x++) if ((x + y) % 2 === 0 || y > 100) w.px(x, y, M.CLUB_LOW);
    // A tiny steel door, one red bulb
    w.rect(CLUB_DOOR, 100, 5, 8, M.DOOR);
    w.rect(CLUB_DOOR, 100, 1, 8, M.CLUB_L);
    w.px(CLUB_DOOR + 3, 104, M.STEEL_LT);
    w.rect(CLUB_DOOR - 1, 99, 7, 1, M.CLUB_DD);
    w.px(CLUB_DOOR + 2, 97, M.STEEL_DK);
    w.px(CLUB_DOOR + 2, 98, M.BULB);
    w.light(CLUB_DOOR + 2, 98, N.REDBULB, w.bulbG);
    // Paste-ups only to head height
    w.rect(272, 101, 4, 5, M.POSTER_C);
    w.rect(273, 102, 2, 1, M.PAINT_K);
    w.rect(280, 100, 3, 5, M.BOARD_W);
    bike(w, 262, FEET - 1, M.BOARD_G);
    bike(w, 275, FEET - 1, M.TEAL, true);

    // ---- Shed beyond, for the far edge of the frame
    w.rect(302, 58, 58, 52, M.SHED);
    w.rect(302, 58, 58, 1, M.SHED_D);
    for (let i = 0; i < 58; i += 4) w.rect(302 + i, 59, 1, 49, M.SHED_D);
    w.hsign(302, 62, 17, 7, 'BIER', { n: N.GREEN, g: w.addGroup(18.8, 28.1) });
    for (const wx of [305, 316, 330, 344]) {
      win(w, r, wx, 73, 7, 10, M.SHED_D, '');
      win(w, r, wx, 90, 7, 8, M.SHED_D, '');
    }
    bike(w, 312, FEET - 1, M.BOARD_V);
  };

  // ---- The river
  const buildWater = (w, r) => {
    w.depth = 0;
    for (let y = LINE; y < 150; y++) {
      for (let x = -PAD; x < 360; x++) w.px(x, y, M.WATER);
    }
    for (let i = 0; i < 180; i++) {
      const y = LINE + 1 + Math.floor(r() * 31);
      const x = -PAD + Math.floor(r() * 400);
      const l = 3 + Math.floor(r() * 12);
      w.rect(x, y, l, 1, r() < 0.55 ? M.WATER_D : M.WATER_L);
    }
    // The stone meets the water with a dark wet line
    w.rect(-PAD, LINE, 400, 1, M.WATER_D);
    for (const [x, y] of [[306, 121], [70, 120]]) {
      for (let i = 0; i < 5; i++) w.px(x + i, y - i, M.SCOOTER);
      w.rect(x + 3, y - 5, 4, 1, M.TIRE);
      w.rect(x - 1, y + 1, 3, 1, M.BOAT_SH);
    }
  };

  // ---- Moving things
  // Flat-bottomed, the way northern cloud sits
  const paintCloud = (w, c, dt, top, mid, under) => {
    c.x += c.v * dt;
    if (c.x > 370) c.x = -c.w - 20;
    const cx = Math.round(c.x);
    for (let i = 0; i < c.w; i++) {
      const u = (i / c.w) * 2 - 1;
      const bump = Math.round(Math.sqrt(1 - u * u) * c.h + Math.sin(i * 0.43 + c.w) * 1.1 + Math.sin(i * 0.17 + c.w * 2) * 1.2);
      for (let j = -bump; j <= 0; j++) {
        const m = j === 0 ? under : j === -1 ? ((cx + i) & 1 ? under : mid) : j === -2 ? mid : j === -3 ? ((cx + i + j) & 1 ? mid : top) : top;
        w.pxSky(cx + i, c.y + j, m);
      }
    }
  };

  const paintSky = (w, dt, hour) => {
    const h = hour;
    // Pale northern sun, low arcs: never overhead here
    if (h <= 18.5) {
      const t = clamp((h - 12) / 6);
      w.sun(mix(126, 192, t), mix(14, 58, t * t), t > 0.75 ? 6 : 5, smooth(15.8, 17.4, h));
    } else if (h >= 29.2) {
      const t = clamp((h - 29.2) / 6.8);
      w.sun(mix(112, 126, t), mix(74, 14, Math.sqrt(t)), t < 0.25 ? 6 : 5, 1 - smooth(30.2, 31.8, h));
    }
    if (h > 19.2 && h < 29.4) w.moon(mix(112, 138, (h - 19.2) / 10), 16);
    w.drawStars();
    for (const c of w.clouds) paintCloud(w, c, dt, M.CLOUD, M.CLOUD_SH, M.CLOUD_SH);
    // Low cloud pulls in by evening and sits till morning: orange-grey underneath from the street lamps
    const deck = smooth(15.5, 18.5, h) * (1 - smooth(29.5, 32.5, h));
    w.deck.forEach((c, n) => {
      if (n / w.deck.length < deck) paintCloud(w, c, dt, M.DECK_T, M.DECK_S, M.DECK_U);
      else c.x += c.v * dt;
    });
    // Brewery smoke
    w.chimneyT = (w.chimneyT || 0) + dt;
    for (let i = 0; i < 5; i++) {
      const s = (w.chimneyT * 0.5 + i * 2) % 10;
      const px = Math.round(w.chimney[0] + s * 1.8);
      const py = Math.round(w.chimney[1] - s * 1.1);
      const size = 1 + Math.floor(s / 4);
      for (let a = 0; a < size; a++) for (let b = 0; b < size; b++) w.pxSky(px + a, py + b, M.SMOKE);
    }
  };

  const paintLasers = (w, hour) => {
    if (w.dark < 0.3 || hour < 20 || hour > 30.2) return;
    const beats = w.t * BEAT;
    for (let b = 0; b < 4; b++) {
      if ((beats + b * 1.3) % 8 > 6.8) continue;
      // Shallow fans out over the river, so they rake along the underside of the cloud
      const sweep = b === 3 ? 0.9 + Math.sin(w.t * 0.5) * 0.25 : -1.02 + Math.sin(w.t * (0.42 + b * 0.13) + b * 2.1) * 0.34;
      const a = -1.5708 + sweep;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const n = b % 2 ? N.LASER_G : N.LASER_V;
      const ox = 266 + b * 11;
      for (let d = 2; d < 130; d++) {
        const x = Math.round(ox + c * d);
        const y = Math.round(25 + s * d);
        if (y < -PAD + 1 || x < -PAD || x >= 360) break;
        const i = (y + PAD) * BW + x + PAD;
        if (w.smat[i] !== 0) continue;
        if (w.fmat[i] === M.DECK_U) {
          for (let q = -3; q <= 3; q++) if (w.fmat[i + q] === M.DECK_U) w.pxLight(x + q, y, n);
        }
        if (d < 60 || d % 2) w.pxLight(x, y, n);
      }
    }
  };

  const paintTower = (w, hour) => {
    // The low sun lays a cross on the ball: the Pope's Revenge
    const am = smooth(30.2, 31, hour) * (1 - smooth(34.2, 35, hour));
    const pm = smooth(13, 13.8, hour) * (1 - smooth(16.8, 17.5, hour));
    const v = Math.max(am, pm);
    w.levels[w.crossG] = v;
    if (v <= 0) return;
    const off = hour > 24 ? -2 : 2;
    const cx = 165 + off;
    for (let j = -4; j <= 4; j++) w.pxLight(cx, 36 + j, N.PAPAL, w.crossG);
    for (let i = -2; i <= 2; i++) w.pxLight(cx + i, 35, N.PAPAL, w.crossG);
  };

  const YELLOW_ROWS = 9;
  const paintTrain = (w, dt) => {
    const tr = w.train;
    const carW = 22;
    const cars = 3;
    const total = cars * (carW + 1);
    if (tr.wait > 0) {
      tr.wait -= dt;
      return;
    }
    tr.x += tr.dir * 44 * dt;
    if ((tr.dir > 0 && tr.x > RIGHT_START + 4) || (tr.dir < 0 && tr.x + total < LEFT_END - 4)) {
      tr.dir = -tr.dir;
      tr.x = tr.dir > 0 ? LEFT_END - total - 4 : RIGHT_START + 4;
      tr.wait = 3 + w.rand() * 4;
      return;
    }
    const lit = w.dark > 0.25;
    const base = Math.round(tr.x);
    const top = DECK - YELLOW_ROWS;
    const bob = Math.sin(w.t * 19) > 0.85 ? 1 : 0;
    for (let c = 0; c < cars; c++) {
      const cx = base + c * (carW + 1);
      for (let i = 0; i < carW; i++) {
        const x = cx + i;
        const leadEnd = tr.dir > 0 ? c === cars - 1 && i > carW - 3 : c === 0 && i < 2;
        for (let y = 0; y < YELLOW_ROWS; y++) {
          let m = M.U_Y;
          let n = 0;
          let g = 0;
          if (y === 0) m = M.U_ROOF;
          else if (y >= 6) m = y === 8 ? M.U_UNDER : M.U_G;
          else if (y === 5) m = M.U_YD;
          if (leadEnd && y === 0) continue;
          const seat = ((i + c * 7) * 2654435761) >>> 28;
          if (y >= 2 && y <= 4 && i > 1 && i < carW - 2) {
            const door = i % 7 === 3 || i % 7 === 4;
            if (door) {
              m = M.U_DOOR;
              if (y === 2 || y === 3) m = M.U_W;
            } else m = M.U_W;
            if (lit && m === M.U_W) {
              n = N.FLUO;
              g = 2;
              if (y >= 3 && seat < 6) {
                m = M.HAIR;
                n = 0;
                g = 0;
              }
            }
          }
          if (y >= 2 && y <= 4 && i <= 1 && c === (tr.dir > 0 ? -1 : 0)) m = M.U_W;
          w.pxBehind(x, top + y + bob, m, n, g);
        }
        // Sits close over the deck on third rail, no wires: it's small-profile stock
      }
      for (const b of [3, carW - 6]) {
        w.pxBehind(cx + b, DECK - 1, M.TIRE);
        w.pxBehind(cx + b + 2, DECK - 1, M.TIRE);
      }
      if (lit && w.rand() < 0.008) w.pxBehind(cx + 6, DECK, M.WIRE, N.SPARK, 1);
    }
    // Head and tail
    const nose = tr.dir > 0 ? base + total - 2 : base;
    const tail = tr.dir > 0 ? base : base + total - 2;
    if (lit) {
      w.pxBehind(nose, top + 6, M.U_G, N.HEAD, 1);
      w.pxBehind(tail, top + 6, M.U_G, N.TAIL, 1);
    }
  };

  const spriteB = (w, rows, map, x, y, flip, lights) => {
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      for (let i = 0; i < row.length; i++) {
        const m = map[row[i]];
        if (m) w.pxBehind(flip ? x + row.length - 1 - i : x + i, y + j, m);
      }
    }
  };

  const TRABI = ['.....RRRRRR.....', '....RGGRGGGR....', '...BGGGBGGGGB...', '.BBBBBBBBBBBBBBB', 'BBBBBBBBBBBBBBBB', '.DDTTDDDDDDTTDD.', '...TT......TT...'];
  const VAN = ['..RRRRRRRRRRRRRR..', '.BBGGBGGBGGBGGBBB.', '.BBGGBGGBGGBGGGGBB', 'BBBBBBBBBBBBBBBBBB', 'BSSSSSSSSSSSSSSSSB', '.DDTTDDDDDDDDTTDD.', '...TT........TT...'];
  const paintRoad = (w, dt) => {
    for (const v of w.vehicles) {
      v.x += v.dir * v.speed * dt;
      if (v.dir > 0 && v.x > RIGHT_START + 16) v.x = LEFT_END - 60 - w.rand() * 30;
      if (v.dir < 0 && v.x + 20 < LEFT_END - 16) v.x = RIGHT_START + 40 + w.rand() * 30;
      const x = Math.round(v.x);
      const y = ROAD - 7;
      const flip = v.dir < 0;
      if (v.kind === 'cycle') {
        const rows = ['..H...', '..SS..', '..SSS.', '.SSS.K', '.LLK..', '.T.LKT', 'T.T.TT'];
        spriteB(w, rows, { H: M.SKIN, S: v.color, L: M.SUIT, K: M.INK, T: M.TIRE }, x, y, flip);
        if (w.dark > 0.3) w.pxBehind(flip ? x : x + 5, y + 3, M.SKIN, N.HEAD, 1);
      } else {
        const rows = v.kind === 'trabi' ? TRABI : VAN;
        spriteB(w, rows, { R: v.roof, G: M.CAR_GLASS, B: v.color, D: M.CAR_DK, T: M.TIRE, S: M.BOARD_Y }, x, y, flip);
        const len = rows[0].length;
        if (w.dark > 0.3) {
          const nose = flip ? x : x + len - 1;
          const tail = flip ? x + len - 1 : x;
          w.pxBehind(nose, y + 3, v.color, N.HEAD, 1);
          w.pxBehind(tail, y + 3, v.color, N.TAIL, 1);
        }
        if (v.kind === 'trabi') {
          // Two-stroke: little blue puffs, forever
          v.puff = (v.puff || 0) - dt;
          if (v.puff <= 0 && x > LEFT_END && x < RIGHT_START) {
            v.puff = 0.55;
            w.puffs.push({ x: flip ? x + len + 1 : x - 1, y: y + 5, t: 0 });
          }
        }
      }
    }
    for (let i = w.puffs.length - 1; i >= 0; i--) {
      const p = w.puffs[i];
      p.t += dt;
      if (p.t > 3) {
        w.puffs.splice(i, 1);
        continue;
      }
      const x = Math.round(p.x);
      const y = Math.round(p.y - p.t * 2);
      w.pxBehind(x, y, M.BLUESMOKE);
      if (p.t > 1) w.pxBehind(x + 1, y - 1, M.BLUESMOKE);
      if (p.t > 2 && ((x + y) & 1)) w.pxBehind(x - 1, y, M.BLUESMOKE);
    }
  };

  // Stone, paper, scissors in neon on the bridge. Real, and it plays forever.
  const HANDS = [
    ['.#######.', '#.#.#.#.#', '#.#.#.#.#', '#########', '#.......#', '.#######.', '..#####..'],
    ['#..#.#..#', '.#.#.#.#.', '.#.#.#.#.', '.#######.', '#.......#', '.#.....#.', '..#####..'],
    ['#......#.', '.#....#..', '..#..#...', '...##....', '.######..', '.#....#..', '.######..'],
  ];
  const paintHands = (w, dt, hour) => {
    w.handT = (w.handT || 0) + dt;
    const which = Math.floor((Math.sin(Math.floor(w.handT / 2.8) * 12.9) + 1) * 1.5) % 3;
    const rows = HANDS[which];
    for (let j = 0; j < rows.length; j++) {
      for (let i = 0; i < rows[j].length; i++) {
        if (rows[j][i] !== '#') continue;
        w.px(161 + i, 64 + j, M.TUBE);
        w.pxLight(161 + i, 64 + j, N.CYAN, w.handG);
      }
    }
  };

  const AMPEL_R = ['...###...', '.#######.', '...###...', '#########', '...###...', '...###...', '...###...', '...###...', '...#.#...', '...#.#...', '..##.##..'];
  const AMPEL_G = [
    ['....###..', '..#######', '....###..', '...####..', '..######.', '.##.##.#.', '#...##..#', '...####..', '..##..##.', '.##....##', '##......#'],
    ['....###..', '..#######', '....###..', '...###...', '...####..', '...###...', '...###...', '...###...', '...####..', '...#.##..', '..##..#..'],
  ];
  const BIG_MAN = [
    ['...####....', '...####....', '.#########.', '...####....', '...####....', '....##.....', '..#####....', '.#######...', '###.###.#..', '##..###.##.', '#...###..##', '....###....', '...####....', '...#####...', '..###.###..', '..##...##..', '.##.....##.', '.##.....##.', '##......##.', '###......##'],
    ['...####....', '...####....', '.#########.', '...####....', '...####....', '....##.....', '...####....', '..#####....', '..#.###....', '..#.###....', '..#.####...', '....###....', '...####....', '...####....', '...#####...', '...##.##...', '...##.##...', '...##.##...', '...##..##..', '..###..###.'],
    ['....####...', '....####...', '..#########', '....####...', '....####...', '.....##....', '...#####...', '##########.', '#..#####..#', '...#####...', '...#####...', '...#####...', '...#####...', '...#####...', '...##.##...', '...##.##...', '...##.##...', '...##.##...', '...##.##...', '..###.###..'],
  ];
  const paintAmpel = (w, dt) => {
    w.ampelT = (w.ampelT || 0) + dt;
    const t = w.ampelT % 10;
    const walking = t < 6;
    const step = Math.floor(w.t * 3) % 2;
    // Street signal: green man walking, red man with his arms out
    const off = (rows, y, m) => {
      for (let j = 0; j < rows.length; j++) for (let i = 0; i < 9; i++) if (rows[j][i] === '#') w.px(47 + i, y + j, m);
    };
    if (walking) {
      off(AMPEL_R, 60, M.AMPEL_RO);
      const rows = AMPEL_G[step];
      for (let j = 0; j < rows.length; j++) for (let i = 0; i < 9; i++) if (rows[j][i] === '#') {
        w.px(47 + i, 74 + j, M.AMPEL_GO);
        w.pxLight(47 + i, 74 + j, N.AMPEL_G);
      }
    } else {
      off(AMPEL_G[0], 74, M.AMPEL_GO);
      for (let j = 0; j < 11; j++) for (let i = 0; i < 9; i++) if (AMPEL_R[j][i] === '#') {
        w.px(47 + i, 60 + j, M.AMPEL_RO);
        w.pxLight(47 + i, 60 + j, N.AMPEL_R);
      }
    }
    // The neon one, on the house: same cycle, three frames
    const frame = t < 7 ? step : 2;
    const rows = BIG_MAN[frame];
    const n = frame === 2 ? N.AMPEL_R : N.AMPEL_G;
    const mat = frame === 2 ? M.AMPEL_RO : M.AMPEL_GO;
    for (let j = 0; j < rows.length; j++) {
      for (let i = 0; i < rows[j].length; i++) {
        if (rows[j][i] !== '#') continue;
        w.px(219 + i, 45 + j, mat);
        w.pxLight(219 + i, 45 + j, n, w.bigManG);
      }
    }
  };

  const spit = (w, cx, y, h, topW, n, g, dark) => {
    const roll = Math.floor(w.t * 5);
    for (let j = 0; j < h; j++) {
      const hw = Math.max(1, Math.round(topW - (j / h) * (topW - 1)));
      for (let i = -hw; i <= hw; i++) {
        const stripe = (i + j + roll) & 3;
        const m = stripe === 0 ? M.DONER_D : stripe === 3 ? M.DONER_L : M.DONER;
        w.px(cx + i, y + j, m);
        if (n && stripe !== 0) w.pxLight(cx + i, y + j, stripe === 3 ? n[0] : n[1], g);
      }
    }
    w.rect(cx, y - 1, 1, h + 2, M.STEEL_DK);
  };

  const paintShops = (w, dt, hour) => {
    // Spit on the house across the river
    spit(w, 254, 85, 7, 3, [N.YELLOW, N.ORANGE], w.spitG);
    // And the real one in the window
    spit(w, 225, 95, 8, 3);
    w.rect(232, 97, 2, 7, M.SHIRT);
    w.rect(232, 95, 2, 2, M.SKIN);
    // Daytime stand, against the firewall
    const open = hour >= 11 && hour < 20.5;
    const sx = 88;
    if (open) {
      spit(w, sx + 6, 100, 6, 3);
      w.rect(sx + 12, 101, 2, 5, M.SHIRT);
      w.rect(sx + 12, 99, 2, 2, M.SKIN);
      w.rect(sx + 12, 99, 2, 1, M.BOARD_W);
      if (Math.sin(w.t * 2.4) > 0.4) w.px(sx + 11, 102, M.STEEL_LT);
      w.rect(sx + 2, 106, 16, 1, M.STEEL_LT);
    } else {
      for (let y = 99; y < 106; y++) w.rect(sx + 2, y, 16, 1, y % 2 ? M.SHUTTER : M.SHUTTER_DK);
      // Tagged in the night
      w.px(sx + 5, 102, M.PAINT_K);
      w.px(sx + 6, 103, M.PAINT_K);
      w.px(sx + 7, 102, M.PAINT_K);
      w.px(sx + 8, 103, M.PAINT_K);
    }
    // Kino bulbs chase
    if (hour > 18 && hour < 28.6) {
      const c = Math.floor(w.t * 6);
      for (let i = 0; i < 22; i += 2) {
        const on = (i / 2 + c) % 3 === 0;
        w.px(237 + i, 92, on ? M.BOARD_Y : M.KINO_D);
        w.px(258 - i, 102, on ? M.BOARD_Y : M.KINO_D);
        if (on) {
          w.pxLight(237 + i, 92, N.YELLOW, w.kinoG);
          w.pxLight(258 - i, 102, N.YELLOW, w.kinoG);
        }
      }
    }
    // On a cushion at the window, watching the street, as they do
    if (hour < 18 || hour > 31.5) {
      const lean = Math.sin(w.t * 0.25) > 0.6 ? 1 : 0;
      w.rect(64, 51, 8, 1, M.BOARD_R);
      w.rect(65 + lean, 47, 5, 4, M.COAT);
      w.rect(66 + lean, 44, 3, 3, M.SKIN);
      w.rect(66 + lean, 44, 3, 1, M.HAIR_G);
    }
    // Banner across the unrenovated house, in the breeze
    const flap = Math.floor(w.t * 1.2);
    const bx = 58;
    for (let j = 0; j < 9; j++) {
      const o = Math.round(Math.sin(j * 0.6 + flap) * 0.6);
      w.rect(bx + o, 54 + j, 19, 1, M.BOARD_W);
    }
    text(w, 'KIEZ', bx + 2, 56, M.BOARD_R);
    w.rect(bx - 1, 53, 21, 1, M.STEEL_DK);
    // Warm trees
    const wind = Math.sin(w.t * 0.9) * 0.5 + 0.5;
    for (const [i, e] of w.leafEdge.entries()) {
      if (Math.sin(w.t * 1.4 + i * 0.7) > 0.72 - wind * 0.25) w.px(e[0], e[1], M.LEAF_L);
    }
    // Chalk sign rattles on the kick when the hour is right
    const kick = w.kick || 0;
    if (w.levels[w.clubV] > 0 && kick > 0.7) w.px(CLUB_DOOR + 2, 96, M.STEEL_DK);
  };

  const person = (w, x, y, top, leg, hair, step, o = {}) => {
    const flip = o.flip;
    const skin = o.skin || M.SKIN;
    if (step) {
      w.px(x, y, leg);
      w.px(x + 2, y, leg);
      w.px(x, y - 1, leg);
      w.px(x + 2, y - 1, leg);
    } else {
      w.px(x + 1, y, leg);
      w.px(x + 1, y - 1, leg);
    }
    w.rect(x, y - 2, 3, 1, leg);
    w.rect(x, y - 6, 3, 4, top);
    w.rect(x, y - 9, 3, 3, skin);
    w.rect(x, y - 9, 3, 1, hair);
    w.px(flip ? x + 2 : x, y - 8, hair);
    if (o.shades) w.rect(flip ? x : x + 1, y - 8, 2, 1, M.SHADES);
    if (o.bag) w.rect(flip ? x + 3 : x - 1, y - 4, 1, 3, o.bag);
    if (o.camera) w.px(flip ? x - 1 : x + 3, y - 5, M.STEEL_DK);
    if (o.bottle) w.px(flip ? x - 1 : x + 3, y - 5, M.BOTTLE);
  };

  const sitter = (w, x, y, top, leg, hair, phase, flip) => {
    // Sitting on an edge, legs out
    w.rect(x, y - 6, 3, 5, top);
    w.rect(x, y - 9, 3, 3, M.SKIN);
    w.rect(x, y - 9, 3, 1, hair);
    w.rect(flip ? x - 2 : x + 1, y - 1, 4, 1, leg);
    w.px(flip ? x - 2 : x + 4, y, leg);
    const up = Math.sin(w.t * 0.8 + phase) > 0.75;
    const bx = flip ? x - 1 : x + 3;
    w.px(bx, up ? y - 8 : y - 4, M.BOTTLE);
    w.px(bx, up ? y - 7 : y - 3, M.BOTTLE);
  };

  const queueCount = (h) => {
    if (h < 13) return Math.round(mix(3, 0, h - 12));
    if (h < 20) return 0;
    if (h < 23) return Math.round(mix(0, 17, (h - 20) / 3));
    if (h < 32) return 17;
    return Math.round(mix(17, 3, (h - 32) / 4));
  };

  const paintQueue = (w, dt, hour) => {
    const q = w.queue;
    const count = queueCount(hour);
    const shades = hour > 28.8 || hour < 14;
    const kick = w.kick || 0;
    q.shift = Math.max(0, q.shift - dt * 3);
    q.door = Math.max(0, q.door - dt);
    if (count > 0) {
      q.t += dt;
      if (q.t > q.next) {
        q.t = 0;
        q.next = 7 + w.rand() * 7;
        q.id++;
        q.shift = 5;
        if (w.rand() < 0.42) q.out.push({ x: CLUB_DOOR - 12, id: q.id - 1 });
        else q.door = 0.8;
      }
    }
    // Door opens a sliver and the red comes out
    if (q.door > 0) {
      w.rect(CLUB_DOOR + 1, 101, 3, 7, M.BULB);
      w.lightRect(CLUB_DOOR + 1, 101, 3, 7, N.REDBULB, 1);
    }
    if (count === 0) return;
    // Bouncer: never moves except to shake his head
    const deciding = q.t > q.next - 1.6;
    const bx = CLUB_DOOR - 4;
    w.rect(bx - 1, 101, 5, 6, M.BLACKWEAR);
    w.rect(bx, 107, 1, 3, M.BLACKWEAR);
    w.rect(bx + 2, 107, 1, 3, M.BLACKWEAR);
    const nod = deciding ? (Math.floor(w.t * 4) % 2 ? -1 : 1) : 0;
    w.rect(bx + nod, 98, 3, 3, M.SKIN);
    w.rect(bx + nod, 98, 3, 1, M.SKIN);
    if (shades) w.rect(bx + nod, 99, 3, 1, M.SHADES);
    if (deciding) w.px(bx - 2, 103, M.SKIN);
    for (let i = 0; i < count; i++) {
      const id = q.id + i;
      const seed = (id * 2654435761) >>> 24;
      const x = Math.round(CLUB_DOOR - 12 - i * 5 - q.shift + (seed % 3) - 1);
      const y = FEET + (seed & 16 ? 1 : 0) - (kick > 0.75 && seed % 3 === 0 ? 1 : 0);
      const hair = [M.BLACKWEAR, M.HAIR, M.BLEACH, M.SKIN, M.MOHAWK][seed % 5];
      person(w, x, y, M.BLACKWEAR, M.BLACKWEAR, hair, seed & 1, { flip: false, shades });
      if (seed % 7 === 0) w.px(x + 3, y - 5, M.BOTTLE);
    }
    // Turned away: back along the line, not looking at anyone
    for (let i = q.out.length - 1; i >= 0; i--) {
      const o = q.out[i];
      o.x -= 7 * dt;
      if (o.x < RIGHT_START - 18) {
        q.out.splice(i, 1);
        continue;
      }
      const x = Math.round(o.x);
      person(w, x, FEET + 2, M.BOARD_R, M.SUIT, M.HAIR, Math.floor(o.x / 3) % 2, { flip: true });
    }
  };

  const paintWalkers = (w, dt, hour) => {
    for (const p of w.walkers) {
      p.x += p.dir * p.speed * dt;
      const [a, b] = p.zone;
      if (p.dir > 0 && p.x > b) p.x = a;
      if (p.dir < 0 && p.x < a) p.x = b;
      const out = (h) => h < p.from || h >= p.to;
      if (out(hour) && out(hour - 24)) continue;
      const x = Math.round(p.x);
      if (x < a + 1 || x > b - 3) continue;
      const step = Math.floor(p.x / 2) % 2;
      if (p.bike) {
        const flip = p.dir < 0;
        w.sprite(['..H...', '..SS..', '..SSS.', '.SSS.K', '.LLK..', '.T.LKT', 'T.T.TT'], { H: M.SKIN, S: p.top, L: p.leg, K: M.INK, T: M.TIRE }, x, p.y - 6, flip);
        continue;
      }
      person(w, x, p.y, p.top, p.leg, p.hair, step, { flip: p.dir < 0, bag: p.bag, camera: p.camera, bottle: p.bottle, shades: hour > 29 && p.night });
    }
    // Tourist taking the same picture of the Wall as everyone else
    if (hour > 12 && hour < 18.5) {
      const flash = Math.sin(w.t * 0.8) > 0.97;
      person(w, 68, FEET + 3, M.BOARD_O, M.COAT, M.HAIR_G, 0, { flip: true, camera: true });
      if (flash) w.pxLight(67, FEET - 2, N.WHITE);
    }
    // Late-afternoon-to-morning drinkers
    sitter(w, 77, 104, M.SHIRT_B, M.SUIT, M.HAIR, 0);
    if (hour >= 15 && hour < 32) sitter(w, 84, 104, M.BLACKWEAR, M.COAT, M.BLEACH, 2, true);
    if (hour >= 16.5 && hour < 33) {
      sitter(w, 47, 113, M.BOARD_G, M.SUIT, M.HAIR, 1);
      sitter(w, 53, 113, M.BOARD_P, M.SUIT, M.COAT, 3.2);
      sitter(w, 21, 115, M.SHIRT, M.SUIT, M.HAIR, 5, true);
      sitter(w, 270, 115, M.BLACKWEAR, M.SUIT, M.BLEACH, 4);
    }
    // Bottle collector doing the rounds at first light
    if (hour > 28.5 && hour < 33) {
      const px = Math.round(mix(-10, 104, ((hour - 28.5) / 4.5 + w.t * 0.002) % 1));
      person(w, px, FEET + 1, M.COAT, M.SUIT, M.HAIR_G, Math.floor(w.t * 2) % 2, { bag: M.BOARD_B });
    }
  };

  const paintBirds = (w, dt) => {
    for (const b of w.birds) {
      if (b.fly > 0) {
        b.fly -= dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vy += 2 * dt;
        const flap = Math.floor(w.t * 14 + b.p) % 2;
        const x = Math.round(b.x);
        const y = Math.round(b.y);
        w.px(x, y, b.m);
        w.px(x - 1, y - flap, b.m);
        w.px(x + 1, y - flap, b.m);
        if (b.fly <= 0) {
          b.x = b.hx;
          b.y = b.hy;
        }
        continue;
      }
      if (b.wait > 0) {
        b.wait -= dt;
        if (b.wait <= 0) {
          b.fly = 5 + w.rand() * 4;
          b.vx = (w.rand() - 0.3) * 40;
          b.vy = -18 - w.rand() * 20;
        }
      }
      const peck = Math.sin(w.t * 2.2 + b.p) > 0.8 ? 1 : 0;
      // The ones on the club's roof get bounced off it on every kick
      const hop = b.hy === 25 && w.levels[w.clubV] > 0 && w.kick > 0.72 ? 1 : 0;
      w.px(b.hx, b.hy - hop, b.m);
      w.px(b.hx + 1, b.hy - hop, b.m);
      w.px(b.hx + 2, b.hy - 1 + peck - hop, b.m);
      if (!hop) w.px(b.hx, b.hy + 1, b.leg);
    }
  };

  const HERON = ['......DD..', 'YYYGGGGD..', '.....GG...', '.....WG...', '....WG....', '....WG....', '.....WG...', '....GGGG..', '...GGGGGG.', '..DDGGGGGG', '....DGGGD.', '.....G....', '.....G.G..', '.....G.G..'];
  const HERON_STRIKE = ['..........', '..........', '......D...', '...GGGGD..', 'YYYGG.....', '...GWG....', '....WG....', '....GGGG..', '...GGGGGG.', '..DDGGGGGG', '....DGGGD.', '.....G....', '.....G.G..', '.....G.G..'];
  const paintHeron = (w, dt) => {
    const h = w.heron;
    if (h.fly > 0) {
      h.fly -= dt;
      h.x += 34 * dt;
      h.y -= 9 * dt;
      const up = Math.floor(w.t * 5) % 2;
      const x = Math.round(h.x);
      const y = Math.round(h.y);
      w.rect(x - 2, y, 9, 1, M.HERON);
      w.rect(x + 7, y - 1, 4, 1, M.HERON_W);
      w.rect(x - 6, y, 4, 1, M.HERON_D);
      for (let i = 0; i < 8; i++) {
        const d = Math.round(i * (up ? -0.7 : 0.45));
        w.px(x + 1 + (i >> 1), y + d, M.HERON_D);
        w.px(x + 2 + (i >> 1), y + d, M.HERON);
      }
      if (h.fly <= 0) {
        h.x = h.hx;
        h.y = h.hy;
      }
      return;
    }
    const strike = Math.sin(w.t * 0.5 + 1) > 0.92;
    w.sprite(strike ? HERON_STRIKE : HERON, { G: M.HERON, D: M.HERON_D, W: M.HERON_W, Y: M.BOARD_O }, h.hx, h.hy - 13, true);
  };

  // The tour boat, flat as a tray so it clears the old bridges
  const paintBoats = (w, dt) => {
    const b = w.boat;
    b.x += b.dir * b.speed * dt;
    if (b.dir < 0 && b.x < -120) b.x = 380 + w.rand() * 30;
    const x = Math.round(b.x);
    const y = b.y;
    const len = 66;
    const lit = w.dark > 0.25;
    // Reflected darkness, then the hull
    for (let i = 2; i < len - 2; i++) {
      if ((i + y) & 1) w.px(x + i, y + 13, M.BOAT_SH);
      w.px(x + i, y + 12, M.BOAT_SH);
      if (lit && i % 3 === 0 && i > 8 && i < len - 10) w.pxLight(x + i, y + 13 + (i % 2), N.WARM_DIM);
    }
    for (let i = 0; i < len; i++) {
      const bow = i < 6 ? (6 - i) >> 1 : 0;
      const stern = i > len - 3 ? 1 : 0;
      for (let j = bow + stern; j < 5; j++) {
        const m = j === 4 ? M.HULL_D : j === 2 ? M.HULL_S : M.HULL;
        w.px(x + i, y + 7 + j, m);
      }
    }
    // Long glass saloon
    w.rect(x + 8, y + 2, 46, 5, M.BOAT_W);
    w.rect(x + 7, y + 1, 48, 1, M.HULL);
    w.rect(x + 8, y, 44, 1, M.HULL_S);
    for (let i = 8; i < 54; i += 6) w.rect(x + i, y + 2, 1, 5, M.HULL);
    if (lit) {
      for (let i = 9; i < 54; i++) {
        if ((i - 8) % 6 === 0) continue;
        for (let j = 2; j < 7; j++) w.pxLight(x + i, y + j, N.BOATGLOW);
      }
      for (let i = 0; i < 5; i++) w.pxLight(x + 12 + i * 9, y, N.LED);
    }
    // Passengers against the glass
    for (let i = 10; i < 52; i += 5) {
      if ((i * 7) % 3 === 0) continue;
      const hx = x + i;
      w.px(hx, y + 4, M.SUIT);
      w.px(hx, y + 5, M.SUIT);
      w.px(hx, y + 3, M.SKIN);
      w.pxLight(hx, y + 3, 0, 0);
      w.pxLight(hx, y + 4, 0, 0);
      w.pxLight(hx, y + 5, 0, 0);
    }
    // Open stern, flag, a person with a bottle
    w.rect(x + 54, y + 4, 10, 1, M.STEEL_LT);
    w.rect(x + 54, y + 4, 1, 3, M.STEEL_LT);
    w.rect(x + 63, y + 4, 1, 3, M.STEEL_LT);
    w.rect(x + 58, y + 3, 2, 4, M.BOARD_O);
    w.rect(x + 58, y + 1, 2, 2, M.SKIN);
    w.rect(x + 64, y - 1, 1, 8, M.STEEL_DK);
    const flag = Math.floor(w.t * 3) % 2;
    w.rect(x + 65, y - 1, 3, 1, M.BOARD_R);
    w.rect(x + 65, y + flag, 3, 1, M.BOARD_W);
    // Wake
    const c = Math.floor(w.t * 4);
    for (let i = 0; i < 16; i++) {
      if ((i + c) % 3 === 0) continue;
      w.px(x + len + i, y + 11 + (i >> 2), M.WAKE);
    }
    for (let i = 0; i < 7; i++) w.px(x - 1 - (i >> 1), y + 11 + (i & 1), M.WAKE);
    // Swans keep their distance
    for (const s of w.swans) {
      s.x += s.v * dt;
      if (s.x > 360 || s.x < -60) s.v = -s.v;
      const sx = Math.round(s.x);
      w.sprite(['....W.', '....W.', '.WWWW.', 'WWWWW.'], { W: M.SWAN }, sx, s.y, s.v < 0);
      w.px(s.v < 0 ? sx : sx + 5, s.y, M.BOARD_O);
      w.rect(sx - 1, s.y + 4, 7, 1, M.WAKE);
    }
  };

  const kickOf = (phase) => {
    const b = (phase % 1 + 1) % 1;
    return Math.pow(1 - b, 2.4);
  };

  const scare = (w) => {
    for (const b of w.birds) if (b.fly <= 0 && b.wait <= 0) b.wait = w.rand() * 0.5 + 0.02;
    if (w.heron.fly <= 0) {
      w.heron.fly = 8;
      w.heron.x = w.heron.hx;
      w.heron.y = w.heron.hy - 8;
    }
  };

  // Long shaking streaks, one per column of light. mirrorWater does the shapes, this does the length.
  const riverStreaks = (w) => {
    const emit = w.emit;
    const pix = w.rgba;
    const sh = w.shimmer;
    const { colR, colG, colB } = w;
    colR.fill(0);
    colG.fill(0);
    colB.fill(0);
    const rows = LINE + PAD;
    for (let y = rows - 4; y >= rows - 92; y--) {
      const weight = Math.pow(1 - (rows - y) / 110, 2);
      for (let x = 0, j = y * BW * 4; x < BW; x++, j += 4) {
        if (emit[j + 3] === 0) continue;
        colR[x] += emit[j] * weight;
        colG[x] += emit[j + 1] * weight;
        colB[x] += emit[j + 2] * weight;
      }
    }
    const tick = Math.floor(w.t * 8);
    const water = w.waterMat;
    for (let y = rows; y < BH; y++) {
      const dy = y - rows;
      const fade = Math.pow(1 - dy / 40, 0.6) * 0.05;
      const amp = 0.8 + dy * 0.16;
      for (let x = 2; x < BW - 2; x++) {
        const i = y * BW + x;
        if (!water[w.fmat[i]]) continue;
        const wob = sh[(x + y * 37 + tick * 3) & 1023];
        if (wob < -2) continue;
        const sx = clamp(x + Math.round(sh[(y * 13 + tick * 5) & 1023] * amp * 0.2), 1, BW - 2);
        const r = colR[sx - 1] + 2 * colR[sx] + colR[sx + 1];
        const g = colG[sx - 1] + 2 * colG[sx] + colG[sx + 1];
        const b = colB[sx - 1] + 2 * colB[sx] + colB[sx + 1];
        const top = Math.max(r, g, b);
        if (top < 40) continue;
        // Keep the colour of the sign rather than letting it add up to white
        const a = Math.min(top * fade, 118) / top;
        const k = i * 4;
        pix[k] = Math.min(255, pix[k] + r * a);
        pix[k + 1] = Math.min(255, pix[k + 1] + g * a);
        pix[k + 2] = Math.min(255, pix[k + 2] + b * a);
      }
    }
  };

  const paintWaterLife = (w, dt, hour) => {
    // Lazy glints sliding downstream
    const c = w.t * 2.2;
    for (let i = 0; i < 26; i++) {
      const seed = i * 37;
      const y = LINE + 2 + (seed % 29);
      const x = Math.round(((seed * 13) % 400) - PAD + c * (0.6 + (i % 5) * 0.2)) % 400;
      const xx = x > 360 ? x - 400 : x;
      w.rect(xx, y, 3 + (i % 4), 1, i % 2 ? M.WATER_L : M.WATER_D);
    }
  };

  // Bass rings on the river in front of the club
  const paintBassRings = (w) => {
    if (w.levels[w.clubV] <= 0 && w.levels[w.clubG] <= 0) return;
    const age = (w.t * BEAT) % 1;
    const rx = 6 + age * 26;
    const ry = 1 + age * 5;
    for (let i = 0; i < 48; i++) {
      if ((i * 5) % 4 === 0) continue;
      const a = (i / 48) * 6.283;
      const x = Math.round(284 + Math.cos(a) * rx);
      const y = Math.round(LINE + 6 + Math.sin(a) * ry);
      if (y >= LINE && w.waterMat[w.fmat[(y + PAD) * BW + x + PAD]]) w.px(x, y, M.WATER_L);
    }
  };

  CitySwitch.define('berlin-switch', {
    city: 'Berlin',
    label: 'Berlin day and night',
    checks: { signs: { 'SPÄTI': 'the Ampelmann pole stands at the shop corner over the blank last column of the board, clear of the letters' } },
    tube: ['#b6ff1a', '#8a3dff'],
    body: ['#e4e4dc', '#0c0f0d'],
    glass: 'mist',
    sky: [
      ['#7fa4c2', '#99b8cf', '#b3cbd9', '#cbdae0', '#e2e8e4'],
      ['#7f97ad', '#94a3ad', '#b4ab9c', '#d9b48c', '#f4c68c'],
      ['#232c48', '#343a5c', '#4f4e70', '#785c70', '#a87060'],
      ['#050908', '#080e0c', '#0e1612', '#1e1f15', '#4c2f18'],
      ['#44566a', '#5e6e7e', '#7f858e', '#a89a94', '#d6b49c'],
    ],
    grade: [
      ([r, g, b]) => [r * 0.98, g * 0.99, b],
      ([r, g, b]) => [r * 1.02 + 0.02, g * 0.84, b * 0.68],
      ([r, g, b]) => [r * 0.46 + 0.03, g * 0.42 + 0.03, b * 0.56 + 0.07],
      ([r, g, b]) => [r * 0.17 + 0.016, g * 0.2 + 0.024, b * 0.17 + 0.022],
      ([r, g, b]) => [r * 0.62 + 0.04, g * 0.56 + 0.03, b * 0.62 + 0.05],
    ],
    weather: (h) => {
      const m = smooth(20.8, 22.6, h) * (1 - smooth(29.4, 31, h));
      return { rain: 0, snow: 0, wet: 0, glass: m * 0.62 };
    },
    glyphs: {
      Ä: ['#...#', '.....', '.###.', '#...#', '#####', '#...#', '#...#', '#...#'],
      Ö: ['#...#', '.....', '.###.', '#...#', '#...#', '#...#', '#...#', '.###.'],
      ä: ['#.#', '...', '###', '#.#', '###', '#.#'],
      ö: ['#.#', '...', '###', '#.#', '#.#', '###'],
      // Reads as an H otherwise
      W: ['#...#', '#...#', '#.#.#', '#.#.#', '.#.#.'],
    },

    palette(ctx) {
      ({ M, N, NOON, GOLD, DUSK, NIGHT, DAWN, clamp, mix, smooth, rng } = ctx);
      const { mat, neon } = ctx;
      // Distance, in a green-grey dark rather than the engine's indigo
      mat('FAR1', '#b0c0cc', { [GOLD]: '#c9a795', [DUSK]: '#3f4058', [NIGHT]: '#141a18', [DAWN]: '#8c8a98' });
      mat('FAR2', '#98acba', { [GOLD]: '#b08f84', [DUSK]: '#35364e', [NIGHT]: '#101614', [DAWN]: '#74748a' });
      mat('FAR3', '#7d9098', { [GOLD]: '#8c7468', [DUSK]: '#2a2c40', [NIGHT]: '#0c1110', [DAWN]: '#5e5e70' });
      mat('CLOUD', '#f2f4f2', { [GOLD]: '#ffd9b0', [DUSK]: '#7c6a80', [NIGHT]: '#1a201c', [DAWN]: '#e0c0b0' });
      mat('CLOUD_SH', '#d4dde2', { [GOLD]: '#efb090', [DUSK]: '#5e5570', [NIGHT]: '#141a16', [DAWN]: '#c89e98' });
      mat('DECK_T', '#dfe4e4', { [GOLD]: '#efc8a0', [DUSK]: '#565670', [NIGHT]: '#141a17', [DAWN]: '#a49a9e' });
      mat('DECK_S', '#c4ccd0', { [GOLD]: '#dca47e', [DUSK]: '#74596a', [NIGHT]: '#3c2d1c', [DAWN]: '#c49a8a' });
      mat('DECK_U', '#a8b2b8', { [GOLD]: '#ffae68', [DUSK]: '#bd6e4c', [NIGHT]: '#84501f', [DAWN]: '#e29a74' });
      mat('WIRE', '#3d444a', { [NIGHT]: '#080c0a' });
      mat('GLASS', '#5f83a0', { [GOLD]: '#ffb765', [DUSK]: '#4e4a6e', [NIGHT]: '#0e1718', [DAWN]: '#c98f8c' });
      mat('GLASS_HI', '#a6cbdc', { [GOLD]: '#ffe0a6', [DUSK]: '#7d6f8e', [NIGHT]: '#141e20', [DAWN]: '#f2c0a6' });
      mat('GLASS_DK', '#44607a', { [GOLD]: '#cf8450', [DUSK]: '#3a3858', [NIGHT]: '#0a1012', [DAWN]: '#9c7a80' });
      mat('BOARD_K', '#23242a', { [NIGHT]: '#090c0b', [DUSK]: '#15161e' });
      mat('TUBE', '#b8b8ae', { [NIGHT]: '#262a26' });
      mat('SMOKE', '#e8e8e4', { [NIGHT]: '#2e2a20', [DUSK]: '#8a7a84', [GOLD]: '#e8c4a8' });
      mat('WINF', '#efe8d8', { [NIGHT]: '#2a2e2a' });
      // Facades
      mat('ALT', '#dcc9a4');
      mat('ALT_L', '#f0e4ca');
      mat('ALT_D', '#bca986');
      mat('ALT_DD', '#a19070');
      mat('RAW', '#8d8676');
      mat('RAW_D', '#736c5e');
      mat('RAW_L', '#a39c8a');
      mat('RAW_K', '#59534a');
      mat('FIRE', '#a78e78');
      mat('FIRE_D', '#907863');
      mat('GHOST', '#cfc2a4');
      mat('ROOF', '#5c6268', { [NIGHT]: '#10161a' });
      mat('ROOF_L', '#71777c', { [NIGHT]: '#161c1e' });
      mat('ZINC', '#7f8a90');
      mat('COPPER', '#6fa58f', { [NIGHT]: '#1c2c26' });
      mat('COPPER_L', '#8ab9a4', { [NIGHT]: '#223830' });
      mat('COPPER_D', '#4e8070', { [NIGHT]: '#14221e' });
      mat('DARKB', '#6e665c', { [NIGHT]: '#141614' });
      mat('DARKB_D', '#5a5349', { [NIGHT]: '#0f110f' });
      mat('DARKB_L', '#8a8274', { [NIGHT]: '#1c1e1a' });
      mat('SHED', '#7a5d4a', { [NIGHT]: '#141211' });
      mat('SHED_D', '#604838', { [NIGHT]: '#0e0d0c' });
      // Bridge: floodlit at night, it holds a warm dark red
      mat('BR', '#c0603a', { [NIGHT]: '#4a2518', [DUSK]: '#6a3a38' });
      mat('BR_D', '#a04a2c', { [NIGHT]: '#3a1c13', [DUSK]: '#543030' });
      mat('BR_DD', '#7a3522', { [NIGHT]: '#26130d', [DUSK]: '#3e2428' });
      mat('BR_L', '#d67c4a', { [NIGHT]: '#5e3320', [DUSK]: '#7c4a40' });
      mat('BR_G', '#3f6e5e', { [NIGHT]: '#16261f' });
      mat('VAULT', '#3a2a24', { [NIGHT]: '#120c0a' });
      mat('STONE', '#b4ad9c', { [NIGHT]: '#2a2c26' });
      mat('STONE_D', '#958e7e', { [NIGHT]: '#1e201c' });
      mat('STONE_K', '#6e685c', { [NIGHT]: '#121412' });
      mat('STONE_W', '#54544a', { [NIGHT]: '#0c0f0d' });
      // Far things
      mat('PLATTE', '#bcbdb4', { [GOLD]: '#d8b090', [DUSK]: '#4a4a60', [NIGHT]: '#1a201c', [DAWN]: '#9e9aa0' });
      mat('PLATTE_D', '#a2a49c', { [GOLD]: '#bc9478', [DUSK]: '#3c3c52', [NIGHT]: '#141a16', [DAWN]: '#868490' });
      mat('PLATTE_W', '#7f8c94', { [GOLD]: '#a87c64', [DUSK]: '#2c2c42', [NIGHT]: '#0c1110', [DAWN]: '#6c6a78' });
      mat('GAS', '#8e9a98', { [GOLD]: '#b89478', [DUSK]: '#3e3e54', [NIGHT]: '#131815', [DAWN]: '#7c7a86' });
      mat('GAS_L', '#a8b2ae', { [GOLD]: '#d0a884', [DUSK]: '#4a4a60', [NIGHT]: '#171d19', [DAWN]: '#8c8a94' });
      mat('GAS_D', '#737f7e', { [GOLD]: '#987a64', [DUSK]: '#303046', [NIGHT]: '#0e1310', [DAWN]: '#64626e' });
      mat('BRICK_F', '#9a6a52', { [NIGHT]: '#14110e', [DUSK]: '#3c3040' });
      mat('BRICK_FD', '#7c5440', { [NIGHT]: '#0e0c0a', [DUSK]: '#2e2638' });
      mat('FIGURE', '#d4dcdc', { [NIGHT]: '#6c7a76', [GOLD]: '#ecc8a4', [DUSK]: '#8a8aa0' });
      mat('WATER_F', '#6f888a', { [NIGHT]: '#141a18', [GOLD]: '#c09a7e', [DUSK]: '#4c4c64' });
      mat('WATER_FL', '#92a8a6', { [NIGHT]: '#2a2c22', [GOLD]: '#dcb890', [DUSK]: '#6a6078' });
      // TV tower
      mat('TV', '#c4c6c0', { [NIGHT]: '#2a302c', [DUSK]: '#6a6a80' });
      mat('TV_L', '#dadbd5', { [NIGHT]: '#343a36', [DUSK]: '#80788c' });
      mat('TV_D', '#9fa19c', { [NIGHT]: '#1e2420', [DUSK]: '#54546c' });
      mat('BALL', '#c8d4dc', { [GOLD]: '#f0c49a', [DUSK]: '#83788e', [NIGHT]: '#3a4644', [DAWN]: '#d8b0a4' });
      mat('BALL_L', '#eef4f8', { [GOLD]: '#ffe4bc', [DUSK]: '#b09aa4', [NIGHT]: '#52605c', [DAWN]: '#f4d0bc' });
      mat('BALL_D', '#8fa0ac', { [GOLD]: '#b8876c', [DUSK]: '#545170', [NIGHT]: '#242c2a', [DAWN]: '#9a8088' });
      mat('BALL_K', '#3c4650', { [NIGHT]: '#101412' });
      mat('ANT_R', '#d6423a', { [NIGHT]: '#4a1a18' });
      mat('ANT_W', '#eeeee8', { [NIGHT]: '#3e4240' });
      // Wall and murals
      mat('WALLP', '#e2e0d8');
      mat('WALL_J', '#a2a096');
      mat('MUR_PINK', '#f06ea8');
      mat('MUR_CYAN', '#3cc4d8');
      mat('MUR_YEL', '#ffd23a');
      mat('MUR_RED', '#e8402e');
      mat('MUR_BLU', '#2f62d0');
      mat('MUR_GRN', '#46c060');
      // Späti, stand, street furniture
      mat('SPATI', '#30343a', { [NIGHT]: '#101210' });
      mat('SPATI_G', '#a8c8d4');
      mat('CHALK', '#2e3a34', { [NIGHT]: '#141c18' });
      mat('CHALK_W', '#f0f0e4', { [NIGHT]: '#7f8880' });
      mat('STAND', '#dfd9c8', { [NIGHT]: '#2a2c26' });
      mat('STAND_D', '#b0a892', { [NIGHT]: '#1c1e1a' });
      mat('DONER', '#a8622c', { [NIGHT]: '#5e3618' });
      mat('DONER_D', '#6e3a18', { [NIGHT]: '#3a2010' });
      mat('DONER_L', '#d89850', { [NIGHT]: '#7c5024' });
      mat('LITFASS', '#3f5a4c', { [NIGHT]: '#141e18' });
      mat('LITFASS_L', '#567562', { [NIGHT]: '#1c2a22' });
      mat('LAMP_P', '#32443c', { [NIGHT]: '#0e1612' });
      mat('LAMP_G', '#c8d0c0', { [NIGHT]: '#2a2e28' });
      mat('AMPEL_P', '#5a5c5a', { [NIGHT]: '#141614' });
      mat('AMPEL_B', '#1e2022', { [NIGHT]: '#060807' });
      mat('AMPEL_L', '#0e0f10', { [NIGHT]: '#030403' });
      mat('AMPEL_RO', '#4a1e18', { [NIGHT]: '#1e0c0a' });
      mat('AMPEL_GO', '#1e4a24', { [NIGHT]: '#0c1e0e' });
      mat('LEAF', '#5e9148', { [GOLD]: '#8b8a3a', [DUSK]: '#2f3f42', [NIGHT]: '#101c13', [DAWN]: '#526a50' });
      mat('LEAF_D', '#47763a', { [GOLD]: '#6c6c2e', [DUSK]: '#243238', [NIGHT]: '#0a140c', [DAWN]: '#40544a' });
      mat('LEAF_L', '#7cb05a', { [GOLD]: '#b0a84a', [DUSK]: '#3c4e4c', [NIGHT]: '#172618', [DAWN]: '#6e8460' });
      // Promenade
      mat('WALK', '#a8a498', { [NIGHT]: '#26261e', [DUSK]: '#60586c' });
      mat('WALK_D', '#928e82', { [NIGHT]: '#1e1e18', [DUSK]: '#4e4a60' });
      mat('SLAB', '#bcb8ac', { [NIGHT]: '#30302a', [DUSK]: '#6c6478' });
      // The river
      mat('WATER', '#54747a', { [GOLD]: '#8a7c70', [DUSK]: '#2c3048', [NIGHT]: '#070e0c', [DAWN]: '#6a7080' });
      mat('WATER_D', '#44646a', { [GOLD]: '#6c6660', [DUSK]: '#22263c', [NIGHT]: '#040a08', [DAWN]: '#565c70' });
      mat('WATER_L', '#7296a0', { [GOLD]: '#c0a07e', [DUSK]: '#464864', [NIGHT]: '#101c18', [DAWN]: '#8e8e98' });
      mat('WAKE', '#a8c0c0', { [GOLD]: '#d4b89c', [DUSK]: '#6c6a84', [NIGHT]: '#2e3e38', [DAWN]: '#b0a8ac' });
      mat('BOAT_SH', '#3a5258', { [GOLD]: '#584e48', [DUSK]: '#1a1c30', [NIGHT]: '#030706', [DAWN]: '#484c5c' });
      mat('HULL', '#eeeee6', { [NIGHT]: '#68706c', [DUSK]: '#9a94a4' });
      mat('HULL_S', '#2c62a8', { [NIGHT]: '#223a56', [DUSK]: '#2c3e68' });
      mat('HULL_D', '#a8aca8', { [NIGHT]: '#2a302e', [DUSK]: '#5c5a70' });
      mat('BOAT_W', '#7fa8bc', { [NIGHT]: '#1a2826' });
      mat('SWAN', '#f6f6f0', { [NIGHT]: '#7a8680', [DUSK]: '#b0a8b4' });
      // Club
      mat('CLUB', '#7c7e78', { [GOLD]: '#8e7a68', [DUSK]: '#3f3f50', [NIGHT]: '#1a1e1d', [DAWN]: '#64626c' });
      mat('CLUB_D', '#696b65', { [GOLD]: '#786656', [DUSK]: '#343446', [NIGHT]: '#141817', [DAWN]: '#565460' });
      mat('CLUB_DD', '#555753', { [GOLD]: '#60524a', [DUSK]: '#2a2a3a', [NIGHT]: '#0e1110', [DAWN]: '#464450' });
      mat('CLUB_L', '#8f918b', { [GOLD]: '#a68e78', [DUSK]: '#4a4a5c', [NIGHT]: '#222624', [DAWN]: '#72707a' });
      mat('CLUB_LOW', '#747670', { [GOLD]: '#857260', [DUSK]: '#4a4a58', [NIGHT]: '#34332c', [DAWN]: '#605e68' });
      mat('SLIT', '#2e3236', { [NIGHT]: '#0a0c0c' });
      mat('SLIT_V', '#2e3236', { [NIGHT]: '#2c1b5c' });
      mat('SLIT_G', '#2e3236', { [NIGHT]: '#28380f' });
      mat('DOOR', '#3a3c3c', { [NIGHT]: '#121413' });
      mat('BULB', '#7a2820', { [NIGHT]: '#3a1210' });
      mat('KINO', '#7a2c2c', { [NIGHT]: '#180c0c' });
      mat('KINO_D', '#4a1c1c', { [NIGHT]: '#0e0808' });
      mat('SHOPG', '#d8b884', { [NIGHT]: '#2a2218' });
      // U-Bahn: small bright-yellow cars with grey lower sides
      mat('U_Y', '#f8cf1e', { [NIGHT]: '#9c8220', [DUSK]: '#c09a30' });
      mat('U_YD', '#d8ae10', { [NIGHT]: '#7c661a', [DUSK]: '#a08028' });
      mat('U_G', '#8e9294', { [NIGHT]: '#3a4040', [DUSK]: '#5c5c70' });
      mat('U_UNDER', '#3c3e40', { [NIGHT]: '#141716' });
      mat('U_ROOF', '#b8bab8', { [NIGHT]: '#484e4c', [DUSK]: '#6c6c80' });
      mat('U_W', '#51707e', { [NIGHT]: '#0e1616', [GOLD]: '#d8a060', [DUSK]: '#404060' });
      mat('U_DOOR', '#f0c618', { [NIGHT]: '#8c741c', [DUSK]: '#b09030' });
      mat('TRABI', '#a8c4b4', { [NIGHT]: '#5a6e64', [DUSK]: '#7c8a8c' });
      mat('TAXI', '#efe6c8', { [NIGHT]: '#7c7a68', [DUSK]: '#a49c98' });
      // People
      mat('SKIN', '#ecc49c', { [NIGHT]: '#9a8068', [DUSK]: '#a88c84' });
      mat('HAIR_G', '#c8c8c0', { [NIGHT]: '#70746e' });
      mat('BLEACH', '#f2e6a8', { [NIGHT]: '#a09a70' });
      mat('MOHAWK', '#40d0a0', { [NIGHT]: '#2a7a60' });
      mat('BLACKWEAR', '#141518', { [NIGHT]: '#040505', [DUSK]: '#0c0c14' });
      mat('SHADES', '#08080c', { [NIGHT]: '#000000' });
      mat('BOTTLE', '#3e7a3c', { [NIGHT]: '#2e5a30' });
      mat('SCOOTER', '#58d07c', { [NIGHT]: '#2a6a40' });
      mat('BLUESMOKE', '#9cc0ee', { [NIGHT]: '#3e5a7c', [DUSK]: '#7a84ae' });
      mat('HERON', '#8f9aa2', { [NIGHT]: '#4a5450', [DUSK]: '#6a6a80' });
      mat('HERON_D', '#55606a', { [NIGHT]: '#2c3431', [DUSK]: '#42445a' });
      mat('HERON_W', '#e4e8e6', { [NIGHT]: '#7a8480', [DUSK]: '#a4a0b0' });
      mat('PIGEON', '#7c848e', { [NIGHT]: '#3a403e', [DUSK]: '#585870' });

      neon('UV', '#c58cff', '#8a3dff', 0.95);
      neon('ACID', '#dcff74', '#b6ff1a', 0.8);
      neon('WASH_V', '#3a2670', '#5a20c0', 0.12);
      neon('WASH_G', '#3c5a14', '#70b010', 0.1);
      neon('LASER_V', '#b88cff', '#8a3dff', 0.4);
      neon('LASER_G', '#cfff5a', '#b6ff1a', 0.32);
      neon('AMPEL_G', '#7dff88', '#18e04a', 0.6);
      neon('AMPEL_R', '#ff7a66', '#ff2414', 0.6);
      neon('OFFEN', '#ffd9d0', '#ff2c1c', 0.85);
      neon('GAS', '#fff0c0', '#e8c070', 0.5);
      neon('SODIUM', '#ffb060', '#ff7a14', 0.4);
      neon('PAPAL', '#ffffff', '#ffefc0', 0.95);
      neon('REDBULB', '#ff3a2a', '#ff1408', 1);
      neon('TVRING', '#ffe0a0', '#ffb040', 0.5);
      neon('HOTELW', '#f0f4ff', '#b0c8ff', 0.7);
      neon('BOATGLOW', '#ffe6b0', '#ffc470', 0.28);
    },

    build(w, ctx) {
      const r = rng(1961);
      w.walkTop = GROUND;
      w.roadTop = LINE;
      w.noSignal = true;
      w.stars.length = 10;

      // Everyone's own hours
      w.tvRing = w.addGroup(17.8, 28.9, 'room');
      w.bridgeLamp = w.addGroup(17.9, 29.2, 'neon', { soft: true });
      w.crossG = w.addGroup(0, 99);
      w.offenG = w.addGroup(0, 99);
      w.spatiLight = w.addGroup(0, 99, 'room');
      w.spatiSign = w.addGroup(17.6, 33.6, 'neon', { soft: true });
      w.standSign = w.addGroup(17.8, 20.6);
      w.kinoG = w.addGroup(18, 28.6);
      w.handG = w.addGroup(18.6, 28.8);
      w.spitG = w.addGroup(18.4, 29.2);
      w.bigManG = w.addGroup(18.6, 28.5);
      // The club does not observe the rest of the city's hours
      w.clubV = w.addGroup(19.4, 33.1, 'room');
      w.clubG = w.addGroup(19.5, 33.1, 'room');
      w.washV = w.addGroup(19.4, 33.1, 'room');
      w.washG = w.addGroup(19.5, 33.1, 'room');
      w.bulbG = w.addGroup(19, 33.2);

      buildWater(w, r);
      buildSkyline(w, r);
      buildTower(w);
      buildBridge(w);
      buildLeft(w, r);
      buildBanks(w, r);
      buildRight(w, r);
      w.leafEdge = [...tree(w, 79, 74, 12, 11, 3, 109), ...tree(w, -12, 76, 14, 13, 9)];
      w.depth = 0;

      w.waterMat = new Uint8Array(256);
      w.waterMat[M.WATER] = w.waterMat[M.WATER_D] = w.waterMat[M.WATER_L] = 1;
      w.waterSet = new Set([M.WATER, M.WATER_D, M.WATER_L]);

      w.clouds = [
        { x: 66, y: 12, w: 40, h: 5, v: 0.8 },
        { x: 196, y: 16, w: 30, h: 4, v: 0.6 },
      ];
      w.deck = [];
      for (let i = 0; i < 9; i++) w.deck.push({ x: -80 + i * 48 + r() * 18, y: 9 + Math.floor(r() * 14), w: 40 + Math.floor(r() * 50), h: 4 + Math.floor(r() * 6), v: 0.5 + r() * 0.8 });

      w.train = { x: 100, dir: 1, wait: 0 };
      w.vehicles = [
        { kind: 'trabi', x: 140, dir: 1, speed: 13, color: M.TRABI, roof: M.BOARD_W },
        { kind: 'cycle', x: 196, dir: -1, speed: 11, color: M.BOARD_R },
        { kind: 'van', x: 60, dir: 1, speed: 15, color: M.TAXI, roof: M.TAXI },
      ];
      w.puffs = [];

      const lz = [-PAD, LEFT_END];
      const rz = [RIGHT_START - 14, 360];
      w.walkers = [
        { x: 10, y: FEET + 1, dir: 1, speed: 7, top: M.COAT, leg: M.SUIT, hair: M.HAIR, zone: lz, from: 8, to: 20 },
        { x: 70, y: FEET + 2, dir: -1, speed: 6, top: M.BOARD_B, leg: M.SUIT, hair: M.HAIR_G, camera: true, zone: lz, from: 9, to: 19 },
        { x: 40, y: FEET, dir: 1, speed: 8, top: M.SHIRT, leg: M.COAT, hair: M.BLEACH, zone: lz, from: 10, to: 22 },
        { x: -30, y: FEET + 2, dir: 1, speed: 22, top: M.BOARD_G, leg: M.SUIT, hair: M.HAIR, bike: true, zone: lz, from: 8, to: 23 },
        { x: 90, y: FEET + 1, dir: -1, speed: 26, top: M.BOARD_O, leg: M.SUIT, hair: M.HAIR, bike: true, zone: lz, from: 7, to: 26 },
        { x: 60, y: FEET + 2, dir: -1, speed: 7, top: M.BLACKWEAR, leg: M.BLACKWEAR, hair: M.BLEACH, bottle: true, zone: lz, from: 19, to: 30, night: true },
        { x: 0, y: FEET + 1, dir: 1, speed: 6, top: M.BOARD_R, leg: M.SUIT, hair: M.HAIR, bottle: true, zone: lz, from: 18, to: 31 },
        { x: 240, y: FEET + 2, dir: 1, speed: 7, top: M.COAT, leg: M.SUIT, hair: M.HAIR, zone: rz, from: 8, to: 19 },
        { x: 300, y: FEET + 3, dir: -1, speed: 24, top: M.BOARD_Y, leg: M.SUIT, hair: M.HAIR, bike: true, zone: rz, from: 8, to: 24 },
        { x: 330, y: FEET + 3, dir: -1, speed: 7, top: M.BLACKWEAR, leg: M.BLACKWEAR, hair: M.HAIR, zone: rz, from: 22, to: 33, night: true, bottle: true },
        // The city's orange sweepers, working round the queue at first light
        { x: 300, y: FEET + 3, dir: -1, speed: 3.4, top: M.BOARD_O, leg: M.BOARD_O, hair: M.HAIR, bag: M.STEEL_DK, zone: rz, from: 28.8, to: 33 },
        { x: 20, y: FEET + 3, dir: 1, speed: 3.2, top: M.BOARD_O, leg: M.BOARD_O, hair: M.HAIR_G, bag: M.STEEL_DK, zone: lz, from: 29, to: 33 },
      ];

      w.queue = { id: 3, t: 0, next: 8, shift: 0, door: 0, out: [] };
      w.birds = [];
      const perch = [
        [12, 21, M.PIGEON],
        [18, 21, M.PIGEON],
        [24, 21, M.PIGEON],
        [56, 37, M.CROW],
        [62, 37, M.CROW],
        [120, 95, M.PIGEON],
        [132, 95, M.PIGEON],
        [186, 95, M.PIGEON],
        [40, 2, M.CROW],
        [62, 111, M.PIGEON],
        [66, 112, M.PIGEON],
        [90, 111, M.PIGEON],
        [72, 110, M.PIGEON],
        [222, 110, M.PIGEON],
        [268, 25, M.CROW],
        [278, 25, M.CROW],
      ];
      for (const [x, y, m] of perch) w.birds.push({ x, y, hx: x, hy: y, m, leg: m, fly: 0, wait: 0, vx: 0, vy: 0, p: r() * 6 });
      w.heron = { hx: 97, hy: 113, x: 97, y: 113, fly: 0 };
      w.boat = { x: 140, y: 127, dir: -1, speed: 7 };
      w.swans = [
        { x: 30, y: 132, v: 1.3 },
        { x: 48, y: 136, v: 1.2 },
      ];
    },

    draw(w, dt, hour, hurry) {
      w.kick = kickOf(w.t * BEAT);
      const off = kickOf(w.t * BEAT + 0.5);
      // Hits hard, so the slits flash whole rather than stipple
      const hit = (k) => (k > 0.4 ? 1 : k > 0.26 ? 0.5 : 0);
      w.levels[w.clubV] *= hit(w.kick);
      w.levels[w.clubG] *= hit(off);
      w.levels[w.washV] *= w.kick * w.kick * (0.15 + 0.6 * w.dark);
      w.levels[w.washG] *= off * off * (0.1 + 0.5 * w.dark);

      paintSky(w, dt, hour);
      paintLasers(w, hour);
      paintTower(w, hour);
      w.drawBeacons();
      paintWaterLife(w, dt, hour);
      paintBassRings(w);
      paintTrain(w, dt);
      paintRoad(w, dt);
      paintHands(w, dt, hour);
      paintAmpel(w, dt);
      paintShops(w, dt, hour);
      paintBirds(w, dt);
      paintHeron(w, dt);
      paintWalkers(w, dt, hour);
      paintQueue(w, dt, hour);
      paintBoats(w, dt);
      if (hurry > 0.7) scare(w);
    },

    post(w, dt, hour) {
      const shaking = w.levels[w.clubV] > 0 ? w.kick * 0.12 : 0;
      w.mirrorWater(LINE, 150, w.waterSet, { strength: 0.66, squash: 1.7, ripple: 0.26 + shaking });
      riverStreaks(w);
    },

    startle(w) {
      scare(w);
    },
  });
})();
