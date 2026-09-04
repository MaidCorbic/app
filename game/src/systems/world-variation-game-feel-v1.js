// ============================================================
// UPDATE 12 — CYBERPUNK CITY / ADVANCED BARRIER VISUALS
// ============================================================
// VISUAL-ONLY LAYER
//
// NEVER:
// - creates physics bodies
// - changes collision rules
// - changes player movement
// - changes platforms/barriers gameplay
// - changes missions/progression
// - changes viewport/mobile controls
//
// UPDATE 12:
// - deeper cyberpunk skyline
// - varied buildings
// - rooftop machinery
// - antennas / dishes / towers
// - neon facade strips
// - deterministic windows
// - billboards
// - pipes / cables
// - landmarks
// - atmospheric haze
// - ADVANCED BARRIER VISUALS
// - barrier warning lights
// - hazard stripes
// - industrial frames
// - bolts / panels
// - energy cores
// - vents
// - cables
// - animated neon pulse
// - safe cleanup
//
// IMPORTANT:
// Existing physics objects are NEVER replaced.
// Existing barrier dimensions/position are preserved.
// All new objects are graphics-only.
// ============================================================


// ============================================================
// MISSION STYLE
// ============================================================

const STYLE = {
  'first-delivery': {
    edge: 0xffd06e,
    bright: 0xffe7a6,
    dark: 0x162338,
    accent: 0xffa85d
  },

  'dead-drop': {
    edge: 0xffbd5b,
    bright: 0xffd58a,
    dark: 0x182331,
    accent: 0x73c7d5
  },

  blackout: {
    edge: 0x8df4ff,
    bright: 0xdffcff,
    dark: 0x101d30,
    accent: 0x35c9ff
  },

  pursuit: {
    edge: 0xff826e,
    bright: 0xffb1a4,
    dark: 0x172238,
    accent: 0xffcf82
  },

  'signal-storm': {
    edge: 0xb993ff,
    bright: 0xe0cfff,
    dark: 0x1b1934,
    accent: 0x8df4ff
  },

  'corporate-lockdown': {
    edge: 0xff826e,
    bright: 0xffcf82,
    dark: 0x1b2130,
    accent: 0x8df4ff
  },

  'final-relay': {
    edge: 0xffd06e,
    bright: 0xfff0bd,
    dark: 0x1c1b31,
    accent: 0x8df4ff
  }
};


const FALLBACK_STYLE = {
  edge: 0x8df4ff,
  bright: 0xdffcff,
  dark: 0x142235,
  accent: 0xaee37f
};


const stateByScene = new WeakMap();


const getStyle = scene =>
  STYLE[scene?.mission?.id] || FALLBACK_STYLE;


// ============================================================
// SAFE HELPERS
// ============================================================

function safeDestroy(object) {
  try {
    object?.destroy?.();
  } catch (_) {}
}


function safeSetDepth(object, depth) {
  try {
    object?.setDepth?.(depth);
  } catch (_) {}
}


function safeScroll(object, factor) {
  try {
    object?.setScrollFactor?.(factor);
  } catch (_) {}
}


// ============================================================
// PLATFORM VISUAL
// ============================================================

function addPlatformVisual(
  scene,
  platform,
  index,
  style
) {
  if (
    !platform?.active ||
    !scene?.add
  ) {
    return null;
  }

  const width = Math.max(
    24,
    platform.displayWidth ||
      platform.width ||
      24
  );

  const height = Math.max(
    8,
    platform.displayHeight ||
      platform.height ||
      8
  );

  const left =
    platform.x -
    width / 2;

  const top =
    platform.y -
    height / 2;

  const type =
    platform.getData?.(
      'relayPlatformType'
    ) ||
    (
      index % 3 === 0
        ? 'roof'
        : 'street'
    );

  const g =
    scene.add
      .graphics()
      .setDepth(4);

  g.fillStyle(
    style.dark,
    .82
  ).fillRect(
    left,
    top + 5,
    width,
    Math.max(
      4,
      height - 5
    )
  );

  g.fillStyle(
    style.edge,
    .92
  ).fillRect(
    left,
    top,
    width,
    4
  );

  g.fillStyle(
    style.bright,
    .42
  ).fillRect(
    left + 5,
    top + 4,
    Math.max(
      8,
      width - 10
    ),
    2
  );

  g.fillStyle(
    style.edge,
    .62
  ).fillRect(
    left,
    top + height - 4,
    width,
    4
  );

  const step =
    Math.max(
      30,
      Math.min(
        54,
        width / 6
      )
    );

  for (
    let x = left + 10;
    x < left + width - 8;
    x += step
  ) {
    g.fillStyle(
      style.accent,
      type === 'roof'
        ? .24
        : .13
    ).fillRect(
      x,
      top + 9,
      Math.min(
        18,
        step - 8
      ),
      3
    );
  }

  g.fillStyle(
    style.bright,
    .72
  )
    .fillRect(
      left + 7,
      top - 2,
      8,
      2
    )
    .fillRect(
      left + width - 15,
      top - 2,
      8,
      2
    );

  return g;
}


// ============================================================
// ADVANCED BARRIER VISUAL
// ============================================================
// IMPORTANT:
//
// This function does NOT alter:
// - barrier.x
// - barrier.y
// - barrier.width
// - barrier.height
// - physics
// - collision
//
// It only draws graphics around the existing barrier.
// ============================================================

function addBarrierVisual(
  scene,
  barrier,
  index,
  style
) {
  if (
    !barrier?.active ||
    !scene?.add
  ) {
    return null;
  }

  const w =
    Math.max(
      40,
      barrier.displayWidth ||
        barrier.width ||
        48
    );

  const h =
    Math.max(
      52,
      barrier.displayHeight ||
        barrier.height ||
        64
    );

  const x =
    barrier.x;

  const y =
    barrier.y;

  const root =
    scene.add
      .graphics()
      .setDepth(7);

  // Deterministic visual type.
  const variant =
    index % 6;

  // ----------------------------------------------------------
  // SHADOW
  // ----------------------------------------------------------

  root.fillStyle(
    0x030914,
    .48
  ).fillEllipse(
    x,
    y + h * .50,
    w * 1.30,
    10
  );

  // ----------------------------------------------------------
  // OUTER ENERGY GLOW
  // ----------------------------------------------------------

  root.lineStyle(
    6,
    style.edge,
    .035
  ).strokeRoundedRect(
    x - w / 2 - 8,
    y - h / 2 - 8,
    w + 16,
    h + 16,
    10
  );

  root.lineStyle(
    3,
    style.edge,
    .09
  ).strokeRoundedRect(
    x - w / 2 - 5,
    y - h / 2 - 5,
    w + 10,
    h + 10,
    8
  );

  // ----------------------------------------------------------
  // MAIN BODY
  // ----------------------------------------------------------

  root.fillStyle(
    0x020812,
    .98
  ).fillRoundedRect(
    x - w / 2 - 3,
    y - h / 2 - 3,
    w + 6,
    h + 6,
    7
  );

  root.fillStyle(
    style.dark,
    .98
  ).fillRoundedRect(
    x - w / 2,
    y - h / 2,
    w,
    h,
    6
  );

  // ----------------------------------------------------------
  // OUTER FRAME
  // ----------------------------------------------------------

  root.lineStyle(
    2,
    style.edge,
    .92
  ).strokeRoundedRect(
    x - w / 2,
    y - h / 2,
    w,
    h,
    6
  );

  root.lineStyle(
    1,
    style.bright,
    .24
  ).strokeRoundedRect(
    x - w / 2 + 4,
    y - h / 2 + 4,
    w - 8,
    h - 8,
    4
  );

  // ----------------------------------------------------------
  // TOP NEON STRIP
  // ----------------------------------------------------------

  root.fillStyle(
    style.edge,
    .95
  ).fillRect(
    x - w / 2,
    y - h / 2 - 5,
    w,
    5
  );

  root.fillStyle(
    style.bright,
    .38
  ).fillRect(
    x - w / 2 + 7,
    y - h / 2 - 1,
    Math.max(
      12,
      w - 14
    ),
    2
  );

  // ----------------------------------------------------------
  // BOTTOM WARNING STRIP
  // ----------------------------------------------------------

  root.fillStyle(
    style.accent,
    .32
  ).fillRect(
    x - w / 2 + 5,
    y + h / 2 - 8,
    w - 10,
    3
  );

  // ----------------------------------------------------------
  // CORNER BOLTS
  // ----------------------------------------------------------

  const boltOffsetX =
    Math.max(
      10,
      w / 2 - 10
    );

  const boltOffsetY =
    Math.max(
      12,
      h / 2 - 11
    );

  const bolts = [
    [-boltOffsetX, -boltOffsetY],
    [ boltOffsetX, -boltOffsetY],
    [-boltOffsetX,  boltOffsetY],
    [ boltOffsetX,  boltOffsetY]
  ];

  bolts.forEach(
    ([bx, by]) => {
      root.fillStyle(
        style.bright,
        .35
      ).fillCircle(
        x + bx,
        y + by,
        2
      );

      root.lineStyle(
        1,
        style.edge,
        .22
      ).strokeCircle(
        x + bx,
        y + by,
        3
      );
    }
  );

  // ----------------------------------------------------------
  // CENTRAL PANEL
  // ----------------------------------------------------------

  const panelW =
    Math.max(
      22,
      w - 20
    );

  const panelH =
    Math.max(
      24,
      h - 30
    );

  root.fillStyle(
    0x050d19,
    .92
  ).fillRoundedRect(
    x - panelW / 2,
    y - panelH / 2,
    panelW,
    panelH,
    4
  );

  root.lineStyle(
    1,
    style.edge,
    .22
  ).strokeRoundedRect(
    x - panelW / 2,
    y - panelH / 2,
    panelW,
    panelH,
    4
  );

  // ----------------------------------------------------------
  // VARIANT 0 — ENERGY CORE
  // ----------------------------------------------------------

  if (
    variant === 0
  ) {
    root.fillStyle(
      style.edge,
      .10
    ).fillCircle(
      x,
      y,
      Math.min(
        15,
        w * .20
      )
    );

    root.lineStyle(
      2,
      style.bright,
      .45
    ).strokeCircle(
      x,
      y,
      Math.min(
        11,
        w * .15
      )
    );

    root.lineStyle(
      1,
      style.edge,
      .35
    ).strokeCircle(
      x,
      y,
      Math.min(
        17,
        w * .22
      )
    );

    root.fillStyle(
      style.bright,
      .72
    ).fillCircle(
      x,
      y,
      3
    );

    // Energy rays.
    root.lineStyle(
      1,
      style.edge,
      .28
    );

    root.lineBetween(
      x - 22,
      y,
      x - 8,
      y
    );

    root.lineBetween(
      x + 8,
      y,
      x + 22,
      y
    );

    root.lineBetween(
      x,
      y - 22,
      x,
      y - 8
    );

    root.lineBetween(
      x,
      y + 8,
      x,
      y + 22
    );

  // ----------------------------------------------------------
  // VARIANT 1 — INDUSTRIAL VENTS
  // ----------------------------------------------------------

  } else if (
    variant === 1
  ) {
    const ventW =
      Math.max(
        24,
        panelW - 16
      );

    const ventY =
      y - 16;

    for (
      let i = 0;
      i < 4;
      i += 1
    ) {
      root.fillStyle(
        style.bright,
        .12
      ).fillRect(
        x - ventW / 2,
        ventY + i * 9,
        ventW,
        3
      );

      root.lineStyle(
        1,
        style.edge,
        .18
      ).lineBetween(
        x - ventW / 2,
        ventY + i * 9,
        x + ventW / 2,
        ventY + i * 9
      );
    }

  // ----------------------------------------------------------
  // VARIANT 2 — WARNING HAZARD
  // ----------------------------------------------------------

  } else if (
    variant === 2
  ) {
    const stripeW =
      Math.max(
        10,
        panelW
      );

    root.fillStyle(
      style.edge,
      .13
    ).fillRect(
      x - stripeW / 2,
      y - 15,
      stripeW,
      30
    );

    root.lineStyle(
      3,
      style.accent,
      .34
    );

    for (
      let sx =
        x - stripeW / 2 - 18;
      sx <
        x + stripeW / 2 + 18;
      sx += 15
    ) {
      root.lineBetween(
        sx,
        y + 15,
        sx + 16,
        y - 15
      );
    }

  // ----------------------------------------------------------
  // VARIANT 3 — REACTOR BOX
  // ----------------------------------------------------------

  } else if (
    variant === 3
  ) {
    root.fillStyle(
      style.accent,
      .08
    ).fillRect(
      x - 18,
      y - 18,
      36,
      36
    );

    root.lineStyle(
      2,
      style.edge,
      .26
    ).strokeRect(
      x - 16,
      y - 16,
      32,
      32
    );

    root.lineStyle(
      1,
      style.bright,
      .22
    );

    root.lineBetween(
      x - 12,
      y - 12,
      x + 12,
      y + 12
    );

    root.lineBetween(
      x + 12,
      y - 12,
      x - 12,
      y + 12
    );

    root.fillStyle(
      style.edge,
      .62
    ).fillCircle(
      x,
      y,
      4
    );

  // ----------------------------------------------------------
  // VARIANT 4 — NEON CONTROL PANEL
  // ----------------------------------------------------------

  } else if (
    variant === 4
  ) {
    root.fillStyle(
      style.bright,
      .12
    ).fillRect(
      x - 22,
      y - 17,
      44,
      5
    );

    root.fillStyle(
      style.accent,
      .20
    ).fillRect(
      x - 22,
      y - 7,
      29,
      4
    );

    root.fillStyle(
      style.edge,
      .17
    ).fillRect(
      x - 22,
      y + 2,
      38,
      4
    );

    root.fillStyle(
      style.bright,
      .42
    ).fillCircle(
      x + 18,
      y + 13,
      3
    );

  // ----------------------------------------------------------
  // VARIANT 5 — HEAVY ARMORED BARRIER
  // ----------------------------------------------------------

  } else {
    root.fillStyle(
      style.dark,
      .99
    ).fillRect(
      x - 5,
      y - h / 2 + 9,
      10,
      h - 18
    );

    root.fillStyle(
      style.edge,
      .18
    ).fillRect(
      x - 2,
      y - h / 2 + 12,
      4,
      h - 24
    );

    root.lineStyle(
      2,
      style.bright,
      .18
    );

    root.lineBetween(
      x - w / 2 + 10,
      y - h / 2 + 13,
      x + w / 2 - 10,
      y - h / 2 + 13
    );

    root.lineBetween(
      x - w / 2 + 10,
      y + h / 2 - 13,
      x + w / 2 - 10,
      y + h / 2 - 13
    );
  }

  // ----------------------------------------------------------
  // SIDE LIGHTS
  // ----------------------------------------------------------

  root.fillStyle(
    style.edge,
    .55
  ).fillRect(
    x - w / 2 - 2,
    y - h / 2 + 14,
    3,
    12
  );

  root.fillStyle(
    style.edge,
    .55
  ).fillRect(
    x + w / 2 - 1,
    y - h / 2 + 14,
    3,
    12
  );

  root.fillStyle(
    style.accent,
    .40
  ).fillRect(
    x - w / 2 - 2,
    y + h / 2 - 26,
    3,
    12
  );

  root.fillStyle(
    style.accent,
    .40
  ).fillRect(
    x + w / 2 - 1,
    y + h / 2 - 26,
    3,
    12
  );

  // ----------------------------------------------------------
  // TOP SIGNAL LIGHTS
  // ----------------------------------------------------------

  const signalY =
    y -
    h / 2 -
    13;

  const signalSpacing =
    Math.max(
      13,
      w / 4
    );

  for (
    let i = -1;
    i <= 1;
    i += 1
  ) {
    root.fillStyle(
      i === 0
        ? style.bright
        : style.edge,
      i === 0
        ? .72
        : .38
    ).fillCircle(
      x +
        i *
          signalSpacing,
      signalY,
      2
    );
  }

  // ----------------------------------------------------------
  // BOTTOM CIRCUIT LINE
  // ----------------------------------------------------------

  root.lineStyle(
    1,
    style.edge,
    .20
  );

  root.lineBetween(
    x - w / 2 + 12,
    y + h / 2 - 17,
    x - 8,
    y + h / 2 - 17
  );

  root.lineBetween(
    x + 8,
    y + h / 2 - 17,
    x + w / 2 - 12,
    y + h / 2 - 17
  );

  // ----------------------------------------------------------
  // WARNING TRIANGLE
  // ----------------------------------------------------------

  root.lineStyle(
    1,
    style.bright,
    .30
  );

  root.lineBetween(
    x,
    y + 8,
    x - 7,
    y + 20
  );

  root.lineBetween(
    x - 7,
    y + 20,
    x + 7,
    y + 20
  );

  root.lineBetween(
    x + 7,
    y + 20,
    x,
    y + 8
  );

  root.fillStyle(
    style.bright,
    .38
  ).fillRect(
    x - 1,
    y + 12,
    2,
    5
  );

  root.fillCircle(
    x,
    y + 19,
    1
  );

  // ----------------------------------------------------------
  // CABLES
  // ----------------------------------------------------------

  root.lineStyle(
    2,
    style.dark,
    .98
  ).lineBetween(
    x - w / 2 - 3,
    y - 6,
    x - w / 2 - 17,
    y + 9
  );

  root.lineStyle(
    1,
    style.edge,
    .25
  ).lineBetween(
    x - w / 2 - 17,
    y + 9,
    x - w / 2 - 30,
    y + 9
  );

  root.lineStyle(
    2,
    style.dark,
    .98
  ).lineBetween(
    x + w / 2 + 3,
    y - 6,
    x + w / 2 + 17,
    y + 9
  );

  root.lineStyle(
    1,
    style.edge,
    .25
  ).lineBetween(
    x + w / 2 + 17,
    y + 9,
    x + w / 2 + 30,
    y + 9
  );

  // ----------------------------------------------------------
  // ANIMATED NEON PULSE
  // ----------------------------------------------------------

  const pulse =
    scene.add
      .graphics()
      .setDepth(8);

  pulse.lineStyle(
    2,
    style.bright,
    .55
  ).strokeRoundedRect(
    x - w / 2 - 2,
    y - h / 2 - 2,
    w + 4,
    h + 4,
    7
  );

  scene.tweens?.add?.({
    targets: pulse,
    alpha: {
      from: .15,
      to: .85
    },
    duration:
      700 +
      (index % 4) * 100,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  // ----------------------------------------------------------
  // STORE VISUAL INDEX ONLY
  // ----------------------------------------------------------

  barrier.setData?.(
    'relayVisualIndex',
    index
  );

  return {
    root,
    pulse
  };
}


// ============================================================
// DETERMINISTIC RANDOMIZER
// ============================================================

function createWorldRandomizer(
  scene,
  id,
  worldWidth
) {
  const seedBase =
    id
      .split('')
      .reduce(
        (
          sum,
          char
        ) =>
          sum +
          char.charCodeAt(0),
        0
      ) +
    Math.floor(
      worldWidth
    );

  const hash =
    value => {
      let n =
        (value ^
          seedBase) |
        0;

      n = Math.imul(
        n ^
          (n >>> 16),
        0x45d9f3b
      );

      n = Math.imul(
        n ^
          (n >>> 16),
        0x45d9f3b
      );

      return (
        n ^
        (n >>> 16)
      ) >>> 0;
    };

  const pick =
    (
      value,
      max
    ) => {
      if (
        max <= 1
      ) {
        return 0;
      }

      return (
        hash(value) %
        max
      );
    };

  const range =
    (
      value,
      min,
      max
    ) => {
      if (
        max <= min
      ) {
        return min;
      }

      return (
        min +
        pick(
          value,
          max -
            min +
            1
        )
      );
    };

  return {
    hash,
    pick,
    range
  };
}


// ============================================================
// FAR BUILDING
// ============================================================

function drawFarBuilding(
  g,
  x,
  base,
  width,
  height,
  variant,
  style,
  random,
  index
) {
  const roof =
    base -
    height;

  g.fillStyle(
    style.dark,
    .30
  ).fillRect(
    x,
    roof,
    width,
    height
  );

  if (
    variant === 0
  ) {
    g.fillStyle(
      style.dark,
      .34
    ).fillRect(
      x +
        width * .22,
      roof - 18,
      width * .56,
      18
    );
  }

  if (
    variant === 1
  ) {
    g.fillStyle(
      style.dark,
      .36
    ).fillRect(
      x +
        width * .34,
      roof - 30,
      width * .32,
      30
    );
  }

  if (
    variant === 2
  ) {
    g.fillStyle(
      style.dark,
      .32
    ).fillRect(
      x - 10,
      roof + 26,
      10,
      height - 26
    );

    g.fillStyle(
      style.dark,
      .32
    ).fillRect(
      x + width,
      roof + 16,
      12,
      height - 16
    );
  }

  const windows =
    1 +
    random.pick(
      index * 31 + 19,
      3
    );

  for (
    let w = 0;
    w < windows;
    w += 1
  ) {
    if (
      random.pick(
        index * 97 +
          w * 13,
        5
      ) > 1
    ) {
      continue;
    }

    g.fillStyle(
      style.bright,
      .035
    ).fillRect(
      x +
        18 +
        w *
          Math.max(
            24,
            width / 3
          ),
      roof + 30,
      7,
      3
    );
  }

  if (
    random.pick(
      index * 41 + 8,
      7
    ) === 0
  ) {
    const cx =
      x +
      width * .5;

    g.lineStyle(
      1,
      style.edge,
      .08
    ).lineBetween(
      cx,
      roof,
      cx,
      roof - 34
    );
  }
}


// ============================================================
// BUILDING WINDOWS
// ============================================================

function drawBuildingWindows(
  g,
  left,
  roof,
  width,
  height,
  archetype,
  style,
  random,
  buildingIndex,
  missionId
) {
  const rows =
    Math.max(
      3,
      Math.floor(
        (height - 70) /
          46
      )
    );

  const cols =
    Math.max(
      2,
      Math.floor(
        (width - 42) /
          38
      )
    );

  for (
    let row = 0;
    row < rows;
    row += 1
  ) {
    for (
      let col = 0;
      col < cols;
      col += 1
    ) {
      const chance =
        random.pick(
          buildingIndex *
            10000 +
            row * 173 +
            col * 47,
          12
        );

      const threshold =
        missionId ===
        'blackout'
          ? 1
          : 4;

      if (
        chance >
        threshold
      ) {
        continue;
      }

      const usableWidth =
        Math.max(
          20,
          width - 42
        );

      const wx =
        left +
        21 +
        col *
          (
            usableWidth /
            Math.max(
              1,
              cols - 1
            )
          );

      const wy =
        roof +
        42 +
        row * 46;

      const ww =
        archetype === 4
          ? 5
          : archetype === 6
            ? 10
            : 8;

      const wh =
        archetype === 3
          ? 3
          : 5;

      const alpha =
        missionId ===
        'signal-storm'
          ? .18
          : missionId ===
              'blackout'
            ? .075
            : .14;

      g.fillStyle(
        random.pick(
          buildingIndex +
            row +
            col,
          3
        ) === 0
          ? style.bright
          : style.accent,
        alpha
      ).fillRect(
        wx,
        wy,
        ww,
        wh
      );

      if (
        random.pick(
          buildingIndex *
            71 +
            row * 19 +
            col * 7,
          9
        ) === 0
      ) {
        g.fillStyle(
          style.bright,
          alpha * .65
        ).fillRect(
          wx,
          wy + 8,
          ww,
          3
        );
      }
    }
  }
}


// ============================================================
// ROOFTOP MACHINE
// ============================================================

function drawRooftopMachine(
  g,
  left,
  roof,
  width,
  style,
  random,
  index
) {
  const type =
    random.pick(
      index * 113 + 17,
      5
    );

  const cx =
    left +
    width *
      (
        .25 +
        random.pick(
          index * 37 + 5,
          50
        ) /
          100
      );

  if (
    type === 0
  ) {
    const mw = 34;
    const mh = 18;

    g.fillStyle(
      style.dark,
      .98
    ).fillRoundedRect(
      cx - mw / 2,
      roof - mh,
      mw,
      mh,
      3
    );

    g.lineStyle(
      1,
      style.edge,
      .18
    ).strokeRoundedRect(
      cx - mw / 2,
      roof - mh,
      mw,
      mh,
      3
    );

    g.lineStyle(
      1,
      style.bright,
      .14
    );

    for (
      let i = -10;
      i <= 10;
      i += 7
    ) {
      g.lineBetween(
        cx + i,
        roof - 14,
        cx + i,
        roof - 5
      );
    }

  } else if (
    type === 1
  ) {
    g.lineStyle(
      2,
      style.edge,
      .22
    ).lineBetween(
      cx,
      roof,
      cx,
      roof - 44
    );

    g.lineStyle(
      1,
      style.bright,
      .14
    ).lineBetween(
      cx - 12,
      roof - 25,
      cx + 12,
      roof - 25
    );

    g.fillStyle(
      style.edge,
      .28
    ).fillCircle(
      cx,
      roof - 47,
      2
    );

  } else if (
    type === 2
  ) {
    g.fillStyle(
      style.dark,
      .98
    ).fillEllipse(
      cx,
      roof - 15,
      30,
      18
    );

    g.lineStyle(
      1,
      style.edge,
      .22
    ).strokeEllipse(
      cx,
      roof - 15,
      30,
      18
    );

    g.lineStyle(
      2,
      style.edge,
      .20
    ).lineBetween(
      cx,
      roof - 7,
      cx + 10,
      roof + 2
    );

    g.fillStyle(
      style.bright,
      .22
    ).fillCircle(
      cx + 12,
      roof + 4,
      2
    );

  } else if (
    type === 3
  ) {
    g.fillStyle(
      style.dark,
      .98
    ).fillRect(
      cx - 22,
      roof - 24,
      44,
      24
    );

    g.fillStyle(
      style.accent,
      .18
    ).fillRect(
      cx - 16,
      roof - 17,
      32,
      4
    );

    g.fillStyle(
      style.edge,
      .22
    ).fillRect(
      cx - 16,
      roof - 8,
      18,
      3
    );

  } else {
    g.fillStyle(
      style.dark,
      .98
    ).fillRoundedRect(
      cx - 11,
      roof - 30,
      22,
      30,
      7
    );

    g.lineStyle(
      1,
      style.edge,
      .20
    ).strokeRoundedRect(
      cx - 11,
      roof - 30,
      22,
      30,
      7
    );

    g.fillStyle(
      style.bright,
      .12
    ).fillRect(
      cx - 6,
      roof - 22,
      12,
      3
    );
  }
}


// ============================================================
// FACADE ACCENT
// ============================================================

function drawFacadeAccent(
  g,
  left,
  roof,
  width,
  height,
  archetype,
  style,
  random,
  index
) {
  const mode =
    random.pick(
      index * 67 + 3,
      5
    );

  if (
    mode === 0
  ) {
    g.fillStyle(
      style.edge,
      .13
    ).fillRect(
      left + 10,
      roof + 14,
      4,
      Math.min(
        170,
        height - 20
      )
    );

  } else if (
    mode === 1
  ) {
    g.fillStyle(
      style.accent,
      .14
    ).fillRect(
      left + width - 15,
      roof + 22,
      4,
      Math.min(
        150,
        height - 30
      )
    );

  } else if (
    mode === 2
  ) {
    const bandY =
      roof +
      55 +
      random.pick(
        index * 19,
        Math.max(
          1,
          Math.floor(
            Math.max(
              20,
              height - 100
            ) /
              60
          )
        )
      ) *
        60;

    g.fillStyle(
      style.edge,
      .15
    ).fillRect(
      left + 18,
      bandY,
      Math.max(
        30,
        width - 36
      ),
      3
    );

  } else if (
    mode === 3
  ) {
    g.lineStyle(
      1,
      style.bright,
      .10
    ).lineBetween(
      left + width * .34,
      roof + 18,
      left + width * .34,
      roof + height
    );

    g.lineStyle(
      1,
      style.edge,
      .08
    ).lineBetween(
      left + width * .67,
      roof + 18,
      left + width * .67,
      roof + height
    );

  } else {
    g.fillStyle(
      style.bright,
      .16
    ).fillRect(
      left + 15,
      roof + 12,
      Math.min(
        42,
        width - 30
      ),
      3
    );
  }
}


// ============================================================
// BILLBOARD
// ============================================================

function drawBillboard(
  g,
  x,
  y,
  width,
  height,
  style,
  random,
  index
) {
  const boardW =
    Math.max(
      58,
      width
    );

  const boardH =
    Math.max(
      24,
      height
    );

  g.lineStyle(
    2,
    style.dark,
    .95
  ).lineBetween(
    x + boardW * .28,
    y + boardH,
    x + boardW * .28,
    y + boardH + 32
  );

  g.lineStyle(
    2,
    style.dark,
    .95
  ).lineBetween(
    x + boardW * .72,
    y + boardH,
    x + boardW * .72,
    y + boardH + 32
  );

  g.fillStyle(
    style.dark,
    .98
  ).fillRoundedRect(
    x,
    y,
    boardW,
    boardH,
    4
  );

  g.lineStyle(
    2,
    style.edge,
    .22
  ).strokeRoundedRect(
    x,
    y,
    boardW,
    boardH,
    4
  );

  g.fillStyle(
    style.edge,
    .08
  ).fillRect(
    x + 7,
    y + 6,
    boardW - 14,
    boardH - 12
  );

  const flip =
    random.pick(
      index * 97 + 11,
      2
    ) === 0;

  g.fillStyle(
    flip
      ? style.accent
      : style.bright,
    .18
  ).fillRect(
    x + 12,
    y + 11,
    Math.max(
      22,
      boardW * .52
    ),
    4
  );

  g.fillStyle(
    style.edge,
    .13
  ).fillRect(
    x + 12,
    y + 20,
    Math.max(
      18,
      boardW * .30
    ),
    3
  );

  g.fillStyle(
    style.edge,
    .28
  ).fillCircle(
    x + boardW - 11,
    y + 11,
    2
  );
}


// ============================================================
// INFRASTRUCTURE
// ============================================================

function drawInfrastructure(
  g,
  worldWidth,
  style,
  random
) {
  const count =
    Math.ceil(
      worldWidth / 480
    );

  for (
    let i = 0;
    i < count;
    i += 1
  ) {
    const x =
      80 +
      i * 480;

    const length =
      190 +
      random.pick(
        i * 31 + 13,
        130
      );

    const y =
      245 +
      random.pick(
        i * 47 + 7,
        105
      );

    const variant =
      random.pick(
        i * 61 + 9,
        4
      );

    if (
      variant === 0
    ) {
      g.lineStyle(
        2,
        style.edge,
        .095
      ).lineBetween(
        x,
        y,
        x + length * .45,
        y + 25
      );

      g.lineStyle(
        1,
        style.bright,
        .055
      ).lineBetween(
        x + length * .45,
        y + 25,
        x + length,
        y + 5
      );

    } else if (
      variant === 1
    ) {
      g.lineStyle(
        4,
        style.dark,
        .90
      ).lineBetween(
        x,
        y,
        x + length,
        y
      );

      g.lineStyle(
        1,
        style.edge,
        .14
      ).lineBetween(
        x,
        y - 2,
        x + length,
        y - 2
      );

      for (
        let p = x + 25;
        p < x + length;
        p += 55
      ) {
        g.lineStyle(
          1,
          style.edge,
          .12
        ).lineBetween(
          p,
          y - 8,
          p,
          y + 8
        );
      }

    } else if (
      variant === 2
    ) {
      const vx =
        x +
        random.pick(
          i * 19,
          Math.max(
            30,
            Math.floor(
              length
            )
          )
        );

      g.lineStyle(
        1,
        style.bright,
        .08
      ).lineBetween(
        vx,
        y + 5,
        vx,
        y + 88
      );

      g.fillStyle(
        style.edge,
        .18
      ).fillCircle(
        vx,
        y + 92,
        2
      );

    } else {
      g.lineStyle(
        1,
        style.edge,
        .07
      ).lineBetween(
        x,
        y + 18,
        x + length * .35,
        y - 2
      );

      g.lineStyle(
        1,
        style.edge,
        .06
      ).lineBetween(
        x + length * .58,
        y + 8,
        x + length,
        y + 25
      );
    }
  }
}


// ============================================================
// MAIN CITY
// ============================================================

function addDistrictVariation(
  scene,
  style
) {
  if (
    !scene?.add ||
    !scene.worldWidth
  ) {
    return null;
  }

  const id =
    scene.mission?.id ||
    '';

  const worldWidth =
    Math.max(
      800,
      scene.worldWidth || 0
    );

  const random =
    createWorldRandomizer(
      scene,
      id,
      worldWidth
    );

  const base =
    610;

  const far =
    scene.add
      .graphics()
      .setScrollFactor(.13)
      .setDepth(-2);

  const farGlow =
    scene.add
      .graphics()
      .setScrollFactor(.18)
      .setDepth(-1.5);

  const mid =
    scene.add
      .graphics()
      .setScrollFactor(.30)
      .setDepth(.55);

  const near =
    scene.add
      .graphics()
      .setScrollFactor(.44)
      .setDepth(1);

  const haze =
    scene.add
      .graphics()
      .setScrollFactor(.36)
      .setDepth(2);

  // ----------------------------------------------------------
  // FAR HORIZON
  // ----------------------------------------------------------

  far.fillStyle(
    style.dark,
    .10
  ).fillRect(
    -500,
    280,
    worldWidth + 1000,
    330
  );

  for (
    let x = -320, i = 0;
    x < worldWidth + 500;
    x += 135, i += 1
  ) {
    const width =
      72 +
      random.pick(
        i * 17 + 2,
        78
      );

    const height =
      68 +
      random.pick(
        i * 23 + 9,
        110
      );

    drawFarBuilding(
      far,
      x,
      base,
      width,
      height,
      random.pick(
        i * 41 + 6,
        3
      ),
      style,
      random,
      i
    );
  }

  for (
    let x = -200, i = 0;
    x < worldWidth + 400;
    x += 280, i += 1
  ) {
    const y =
      430 +
      random.pick(
        i * 29 + 11,
        80
      );

    farGlow.fillStyle(
      style.accent,
      .035
    ).fillRect(
      x,
      y,
      90 +
        random.pick(
          i * 13,
          60
        ),
      3
    );
  }

  // ----------------------------------------------------------
  // MID CITY
  // ----------------------------------------------------------

  const buildingSpacing =
    188;

  for (
    let x = -220, i = 0;
    x < worldWidth + 440;
    x += buildingSpacing, i += 1
  ) {
    const archetype =
      random.pick(
        i * 37 + 5,
        10
      );

    const width =
      118 +
      random.pick(
        i * 13 + 8,
        98
      );

    const height =
      150 +
      random.pick(
        i * 23 + 2,
        190
      );

    const left =
      x;

    const right =
      x + width;

    const roof =
      base -
      height;

    const cx =
      left +
      width * .5;

    mid.fillStyle(
      style.dark,
      .96
    ).fillRect(
      left,
      roof,
      width,
      height
    );

    if (
      archetype === 0
    ) {
      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .18,
        roof - 32,
        width * .64,
        32
      );

      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .37,
        roof - 58,
        width * .26,
        26
      );

      mid.lineStyle(
        2,
        style.edge,
        .20
      ).lineBetween(
        cx,
        roof - 58,
        cx,
        roof - 92
      );

    } else if (
      archetype === 1
    ) {
      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .56,
        roof + 18,
        width * .44,
        height - 18
      );

      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left - 16,
        roof + 62,
        16,
        height - 62
      );

      mid.fillStyle(
        style.edge,
        .12
      ).fillRect(
        left + width * .56,
        roof + 18,
        3,
        height - 18
      );

    } else if (
      archetype === 2
    ) {
      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left - 20,
        roof + 44,
        20,
        height - 44
      );

      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        right,
        roof + 24,
        20,
        height - 24
      );

      mid.fillStyle(
        style.edge,
        .13
      ).fillRect(
        left + 12,
        roof + 22,
        width - 24,
        5
      );

    } else if (
      archetype === 3
    ) {
      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .10,
        roof - 24,
        width * .80,
        24
      );

      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .32,
        roof - 48,
        width * .36,
        24
      );

      mid.lineStyle(
        2,
        style.bright,
        .12
      ).lineBetween(
        left + width * .32,
        roof - 48,
        left + width * .68,
        roof - 48
      );

    } else if (
      archetype === 4
    ) {
      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .08,
        roof + 28,
        width * .24,
        height - 28
      );

      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        right - width * .25,
        roof + 52,
        width * .25,
        height - 52
      );

      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .32,
        roof - 14,
        width * .36,
        14
      );

    } else if (
      archetype === 5
    ) {
      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .18,
        roof - 18,
        width * .64,
        18
      );

      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .39,
        roof - 44,
        width * .22,
        26
      );

      mid.lineStyle(
        2,
        style.edge,
        .22
      ).lineBetween(
        cx,
        roof - 44,
        cx,
        roof - 86
      );

    } else if (
      archetype === 6
    ) {
      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left - 12,
        roof + 72,
        12,
        height - 72
      );

      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        right,
        roof + 46,
        14,
        height - 46
      );

      mid.fillStyle(
        style.edge,
        .12
      ).fillRect(
        left + 18,
        roof + 70,
        width - 36,
        6
      );

    } else if (
      archetype === 7
    ) {
      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .12,
        roof - 20,
        width * .76,
        20
      );

      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .22,
        roof - 38,
        width * .56,
        18
      );

      mid.fillStyle(
        style.edge,
        .14
      ).fillRect(
        left + width * .30,
        roof - 34,
        width * .40,
        3
      );

    } else if (
      archetype === 8
    ) {
      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .15,
        roof + 38,
        width * .70,
        height - 38
      );

      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .29,
        roof + 8,
        width * .42,
        30
      );

      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .40,
        roof - 18,
        width * .20,
        26
      );

      mid.fillStyle(
        style.accent,
        .19
      ).fillRect(
        left + width * .24,
        roof + 92,
        5,
        Math.min(
          160,
          height - 120
        )
      );

    } else {
      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left - 24,
        roof + 54,
        24,
        height - 54
      );

      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        right,
        roof + 34,
        24,
        height - 34
      );

      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left + width * .20,
        roof - 16,
        width * .60,
        16
      );

      mid.fillStyle(
        style.edge,
        .12
      ).fillRect(
        left + 16,
        roof + 24,
        width - 32,
        4
      );
    }

    // --------------------------------------------------------
    // ARCHITECTURAL FRAME
    // --------------------------------------------------------

    mid.fillStyle(
      style.edge,
      .09
    ).fillRect(
      left + 10,
      roof + 12,
      width - 20,
      4
    );

    mid.lineStyle(
      1,
      style.edge,
      .08
    ).lineBetween(
      left + width * .27,
      roof + 14,
      left + width * .27,
      base
    );

    mid.lineStyle(
      1,
      style.edge,
      .065
    ).lineBetween(
      left + width * .73,
      roof + 14,
      left + width * .73,
      base
    );

    drawBuildingWindows(
      mid,
      left,
      roof,
      width,
      height,
      archetype,
      style,
      random,
      i,
      id
    );

    drawFacadeAccent(
      mid,
      left,
      roof,
      width,
      height,
      archetype,
      style,
      random,
      i
    );

    mid.fillStyle(
      style.edge,
      .20
    ).fillRect(
      left + 12,
      roof - 5,
      width - 24,
      5
    );

    if (
      random.pick(
        i * 83 + 21,
        4
      ) !== 0
    ) {
      drawRooftopMachine(
        mid,
        left,
        roof,
        width,
        style,
        random,
        i
      );
    }

    // --------------------------------------------------------
    // MISSION ARCHITECTURE
    // --------------------------------------------------------

    if (
      id ===
        'corporate-lockdown' ||
      id ===
        'final-relay'
    ) {
      mid.fillStyle(
        style.edge,
        .075
      ).fillRect(
        left + 16,
        roof + 26,
        width - 32,
        56
      );

      mid.lineStyle(
        1,
        style.edge,
        .14
      ).strokeRect(
        left + 13,
        roof + 20,
        width - 26,
        68
      );

      mid.fillStyle(
        style.bright,
        .12
      ).fillRect(
        left + 25,
        roof + 38,
        Math.max(
          28,
          width - 50
        ),
        4
      );

    } else if (
      id ===
      'dead-drop'
    ) {
      mid.fillStyle(
        style.accent,
        .12
      ).fillRect(
        left + width * .20,
        roof - 14,
        width * .60,
        10
      );

      mid.lineStyle(
        1,
        style.edge,
        .16
      ).lineBetween(
        cx,
        roof - 14,
        cx,
        roof - 54
      );

    } else if (
      id ===
      'signal-storm'
    ) {
      mid.lineStyle(
        2,
        style.edge,
        .16
      ).lineBetween(
        left + 14,
        roof + 12,
        right - 14,
        roof - 22
      );

      mid.fillStyle(
        style.bright,
        .11
      ).fillCircle(
        cx,
        roof + 12,
        Math.min(
          16,
          width * .08
        )
      );

    } else if (
      id ===
      'blackout'
    ) {
      mid.fillStyle(
        style.edge,
        .055
      ).fillRect(
        left + 18,
        roof + 20,
        width - 36,
        3
      );

      mid.fillStyle(
        style.bright,
        .035
      ).fillRect(
        left + 22,
        roof + 58,
        width - 44,
        2
      );

    } else if (
      id ===
      'pursuit'
    ) {
      mid.fillStyle(
        style.edge,
        .10
      ).fillRect(
        left + 18,
        roof + 92,
        width - 36,
        5
      );

    } else {
      if (
        random.pick(
          i * 71 + 41,
          4
        ) === 0
      ) {
        mid.fillStyle(
          style.accent,
          .08
        ).fillRect(
          left + 18,
          roof + 30,
          Math.max(
            24,
            width * .24
          ),
          8
        );
      }
    }

    if (
      random.pick(
        i * 107 + 31,
        8
      ) === 0
    ) {
      drawBillboard(
        mid,
        left +
          width * .55,
        roof +
          70 +
          random.pick(
            i * 17,
            50
          ),
        Math.min(
          88,
          width * .55
        ),
        28,
        style,
        random,
        i
      );
    }
  }

  // ==========================================================
  // HERO LANDMARKS
  // ==========================================================

  const heroSpacing =
    Math.max(
      560,
      Math.floor(
        worldWidth / 3
      )
    );

  const heroPositions = [
    heroSpacing * .62,
    heroSpacing * 1.48,
    heroSpacing * 2.34
  ];

  heroPositions.forEach(
    (
      center,
      heroIndex
    ) => {
      if (
        center >
        worldWidth + 300
      ) {
        return;
      }

      const heroType =
        random.pick(
          heroIndex * 73 +
            id.length * 11,
          6
        );

      const width =
        220 +
        random.pick(
          heroIndex * 29 + 17,
          100
        );

      const height =
        270 +
        random.pick(
          heroIndex * 43 + 23,
          130
        );

      const left =
        center -
        width / 2;

      const right =
        center +
        width / 2;

      const roof =
        base -
        height;

      mid.fillStyle(
        style.dark,
        .99
      ).fillRect(
        left,
        roof + 34,
        width,
        height - 34
      );

      if (
        heroType === 0
      ) {
        mid.fillStyle(
          style.dark,
          .995
        ).fillRect(
          left + width * .18,
          roof,
          width * .64,
          34
        );

        mid.fillStyle(
          style.dark,
          .995
        ).fillRect(
          left + width * .37,
          roof - 34,
          width * .26,
          34
        );

        mid.lineStyle(
          3,
          style.edge,
          .22
        ).lineBetween(
          center,
          roof - 34,
          center,
          roof - 105
        );

        mid.lineStyle(
          1,
          style.bright,
          .16
        ).lineBetween(
          center - 22,
          roof - 62,
          center + 22,
          roof - 62
        );

        mid.fillStyle(
          style.edge,
          .30
        ).fillCircle(
          center,
          roof - 108,
          3
        );

      } else if (
        heroType === 1
      ) {
        mid.fillStyle(
          style.dark,
          .995
        ).fillRect(
          left + width * .14,
          roof,
          width * .72,
          34
        );

        mid.fillStyle(
          style.edge,
          .11
        ).fillRect(
          left + width * .22,
          roof + 62,
          width * .56,
          104
        );

        mid.lineStyle(
          2,
          style.bright,
          .14
        ).strokeRect(
          left + width * .22,
          roof + 62,
          width * .56,
          104
        );

        mid.fillStyle(
          style.accent,
          .15
        ).fillRect(
          left + width * .30,
          roof + 84,
          width * .40,
          8
        );

      } else if (
        heroType === 2
      ) {
        mid.fillStyle(
          style.dark,
          .995
        ).fillRect(
          left - 20,
          roof + 64,
          20,
          height - 64
        );

        mid.fillStyle(
          style.dark,
          .995
        ).fillRect(
          right,
          roof + 30,
          22,
          height - 30
        );

        mid.fillStyle(
          style.dark,
          .995
        ).fillRect(
          left + width * .22,
          roof,
          width * .56,
          34
        );

        mid.fillStyle(
          style.edge,
          .13
        ).fillRect(
          left + 20,
          roof + 78,
          width - 40,
          6
        );

        mid.lineStyle(
          2,
          style.edge,
          .18
        ).lineBetween(
          left + 34,
          roof + 78,
          left + 34,
          base
        );

        mid.lineStyle(
          2,
          style.edge,
          .12
        ).lineBetween(
          right - 34,
          roof + 78,
          right - 34,
          base
        );

        mid.lineStyle(
          2,
          style.bright,
          .12
        ).lineBetween(
          center,
          roof,
          center,
          roof - 65
        );

      } else if (
        heroType === 3
      ) {
        mid.fillStyle(
          style.dark,
          .995
        ).fillRect(
          left + width * .14,
          roof + 42,
          width * .72,
          height - 42
        );

        mid.fillStyle(
          style.dark,
          .995
        ).fillRect(
          left + width * .28,
          roof + 10,
          width * .44,
          32
        );

        mid.fillStyle(
          style.dark,
          .995
        ).fillRect(
          left + width * .40,
          roof - 18,
          width * .20,
          28
        );

        mid.fillStyle(
          style.accent,
          .20
        ).fillRect(
          left + width * .24,
          roof + 92,
          6,
          Math.min(
            180,
            height - 120
          )
        );

        mid.lineStyle(
          2,
          style.bright,
          .16
        ).lineBetween(
          center,
          roof - 18,
          center,
          roof - 76
        );

      } else if (
        heroType === 4
      ) {
        const towerW =
          width * .28;

        mid.fillStyle(
          style.dark,
          .995
        ).fillRect(
          left + width * .10,
          roof,
          towerW,
          height
        );

        mid.fillStyle(
          style.dark,
          .995
        ).fillRect(
          right -
            width * .10 -
            towerW,
          roof + 35,
          towerW,
          height - 35
        );

        mid.fillStyle(
          style.dark,
          .995
        ).fillRect(
          left + width * .28,
          roof + 72,
          width * .44,
          22
        );

        mid.lineStyle(
          2,
          style.edge,
          .15
        ).lineBetween(
          left + width * .20,
          roof + 70,
          left + width * .50,
          roof + 22
        );

        mid.lineStyle(
          2,
          style.edge,
          .15
        ).lineBetween(
          right - width * .20,
          roof + 70,
          left + width * .50,
          roof + 22
        );

      } else {
        mid.fillStyle(
          style.dark,
          .995
        ).fillRect(
          left + width * .12,
          roof + 38,
          width * .76,
          height - 38
        );

        mid.fillStyle(
          style.dark,
          .995
        ).fillRect(
          left + width * .25,
          roof,
          width * .50,
          38
        );

        mid.fillStyle(
          style.edge,
          .10
        ).fillRect(
          left + width * .20,
          roof + 72,
          width * .60,
          100
        );

        mid.lineStyle(
          2,
          style.edge,
          .17
        ).strokeRect(
          left + width * .20,
          roof + 72,
          width * .60,
          100
        );

        mid.lineStyle(
          2,
          style.edge,
          .17
        ).lineBetween(
          center,
          roof,
          center,
          roof - 78
        );

        mid.fillStyle(
          style.edge,
          .25
        ).fillCircle(
          center,
          roof - 82,
          3
        );
      }

      for (
        let band =
          roof + 70;
        band <
        base - 40;
        band += 54
      ) {
        if (
          random.pick(
            heroIndex * 200 +
              Math.floor(
                band
              ),
            5
          ) > 2
        ) {
          continue;
        }

        mid.fillStyle(
          style.bright,
          .10
        ).fillRect(
          left + 24,
          band,
          width - 48,
          5
        );

        mid.fillStyle(
          style.accent,
          .075
        ).fillRect(
          left + 24,
          band + 10,
          Math.max(
            30,
            (width - 48) *
              .42
          ),
          4
        );
      }

      mid.fillStyle(
        style.edge,
        .24
      ).fillRect(
        left + 16,
        roof - 4,
        width - 32,
        4
      );

      drawRooftopMachine(
        mid,
        left,
        roof,
        width,
        style,
        random,
        heroIndex + 500
      );
    }
  );

  // ==========================================================
  // BILLBOARD ZONE
  // ==========================================================

  for (
    let x = 250, i = 0;
    x < worldWidth + 400;
    x += 720, i += 1
  ) {
    if (
      random.pick(
        i * 113 + 4,
        3
      ) === 0
    ) {
      continue;
    }

    drawBillboard(
      near,
      x,
      285 +
        random.pick(
          i * 23 + 7,
          90
        ),
      90 +
        random.pick(
          i * 19 + 2,
          55
        ),
      32 +
        random.pick(
          i * 11 + 3,
          10
        ),
      style,
      random,
      i + 1000
    );
  }

  // ==========================================================
  // NEAR CITY ACCENTS
  // ==========================================================

  for (
    let x = 110, i = 0;
    x < worldWidth + 420;
    x += 540, i += 1
  ) {
    const accentType =
      random.pick(
        i * 51 + id.length,
        6
      );

    const y =
      285 +
      random.pick(
        i * 17 + 9,
        120
      );

    const width =
      100 +
      random.pick(
        i * 31 + 3,
        90
      );

    if (
      accentType === 0
    ) {
      near.lineStyle(
        5,
        style.dark,
        .92
      ).lineBetween(
        x,
        y,
        x + width,
        y
      );

      near.lineStyle(
        1,
        style.edge,
        .20
      ).lineBetween(
        x + 10,
        y - 1,
        x + width - 10,
        y - 1
      );

      near.fillStyle(
        style.edge,
        .25
      ).fillCircle(
        x,
        y,
        3
      );

      near.fillStyle(
        style.edge,
        .25
      ).fillCircle(
        x + width,
        y,
        3
      );

    } else if (
      accentType === 1
    ) {
      near.fillStyle(
        style.dark,
        .95
      ).fillRoundedRect(
        x,
        y,
        width,
        36,
        5
      );

      near.lineStyle(
        2,
        style.edge,
        .22
      ).strokeRoundedRect(
        x,
        y,
        width,
        36,
        5
      );

      near.fillStyle(
        style.accent,
        .18
      ).fillRect(
        x + 12,
        y + 11,
        width - 24,
        5
      );

    } else if (
      accentType === 2
    ) {
      near.fillStyle(
        style.dark,
        .96
      ).fillRect(
        x,
        y,
        48,
        42
      );

      near.lineStyle(
        1,
        style.edge,
        .20
      ).strokeRect(
        x,
        y,
        48,
        42
      );

      near.fillStyle(
        style.edge,
        .18
      ).fillCircle(
        x + 24,
        y + 21,
        14
      );

      near.lineStyle(
        1,
        style.bright,
        .13
      ).strokeCircle(
        x + 24,
        y + 21,
        14
      );

    } else if (
      accentType === 3
    ) {
      near.lineStyle(
        6,
        style.dark,
        .95
      ).lineBetween(
        x,
        y + 44,
        x + width,
        y - 10
      );

      near.lineStyle(
        1,
        style.edge,
        .16
      ).lineBetween(
        x,
        y + 40,
        x + width,
        y - 14
      );

    } else if (
      accentType === 4
    ) {
      near.lineStyle(
        2,
        style.edge,
        .19
      ).lineBetween(
        x + 24,
        y + 38,
        x + 24,
        y - 24
      );

      near.lineStyle(
        1,
        style.bright,
        .13
      ).lineBetween(
        x + 8,
        y + 5,
        x + 40,
        y + 5
      );

      near.fillStyle(
        style.edge,
        .24
      ).fillCircle(
        x + 24,
        y - 27,
        2
      );

    } else {
      near.lineStyle(
        2,
        style.edge,
        .13
      ).lineBetween(
        x,
        y + 42,
        x + width,
        y - 8
      );

      near.lineStyle(
        1,
        style.bright,
        .08
      ).lineBetween(
        x + 22,
        y + 32,
        x + 22,
        y - 5
      );

      near.lineStyle(
        1,
        style.bright,
        .08
      ).lineBetween(
        x + width - 22,
        y + 7,
        x + width - 22,
        y - 20
      );
    }
  }

  // ==========================================================
  // INFRASTRUCTURE
  // ==========================================================

  drawInfrastructure(
    near,
    worldWidth,
    style,
    random
  );

  // ==========================================================
  // FOREGROUND SILHOUETTE
  // ==========================================================

  for (
    let x = -120, i = 0;
    x < worldWidth + 300;
    x += 760, i += 1
  ) {
    const type =
      random.pick(
        i * 43 + 12,
        3
      );

    const w =
      120 +
      random.pick(
        i * 27 + 3,
        80
      );

    const h =
      80 +
      random.pick(
        i * 17 + 4,
        70
      );

    const y =
      base - h;

    if (
      type === 0
    ) {
      near.fillStyle(
        style.dark,
        .58
      ).fillRect(
        x,
        y,
        w,
        h
      );

      near.fillStyle(
        style.edge,
        .08
      ).fillRect(
        x + 12,
        y + 12,
        w - 24,
        4
      );

    } else if (
      type === 1
    ) {
      near.fillStyle(
        style.dark,
        .58
      ).fillRect(
        x,
        y + 24,
        w,
        h - 24
      );

      near.fillStyle(
        style.dark,
        .60
      ).fillRect(
        x + w * .18,
        y,
        w * .64,
        24
      );

    } else {
      near.fillStyle(
        style.dark,
        .55
      ).fillRoundedRect(
        x,
        y + 28,
        w,
        h - 28,
        5
      );

      near.lineStyle(
        1,
        style.edge,
        .10
      ).strokeRoundedRect(
        x,
        y + 28,
        w,
        h - 28,
        5
      );
    }
  }

  // ==========================================================
  // ATMOSPHERE
  // ==========================================================

  haze.fillStyle(
    style.dark,
    .018
  ).fillRect(
    -400,
    390,
    worldWidth + 800,
    90
  );

  haze.fillStyle(
    style.bright,
    .009
  ).fillRect(
    -400,
    470,
    worldWidth + 800,
    60
  );

  haze.fillStyle(
    style.edge,
    .005
  ).fillRect(
    -400,
    520,
    worldWidth + 800,
    55
  );

  haze.fillStyle(
    style.edge,
    .025
  ).fillRect(
    -400,
    base - 2,
    worldWidth + 800,
    2
  );

  return {
    far,
    farGlow,
    mid,
    near,
    haze
  };
}


// ============================================================
// COMBO PULSE
// ============================================================

function relayComboPulse(
  scene,
  combo
) {
  if (
    !scene?.add ||
    !scene?.player?.active
  ) {
    return;
  }

  const style =
    getStyle(scene);

  const value =
    Math.max(
      2,
      Math.floor(
        Number(combo) || 2
      )
    );

  const radius =
    value >= 10
      ? 34
      : value >= 7
        ? 29
        : value >= 5
          ? 24
          : 19;

  const scale =
    value >= 10
      ? 1.85
      : value >= 5
        ? 1.60
        : 1.45;

  const duration =
    value >= 10
      ? 280
      : value >= 5
        ? 240
        : 210;

  const ring =
    scene.add
      .circle(
        scene.player.x,
        scene.player.y,
        radius,
        style.edge,
        0
      )
      .setStrokeStyle(
        2,
        style.bright,
        .58
      )
      .setDepth(12);

  scene.tweens?.add?.({
    targets: ring,
    scale,
    alpha: 0,
    duration,
    ease: 'Cubic.Out',
    onComplete: () => {
      safeDestroy(
        ring
      );
    }
  });
}


// ============================================================
// COMBO FEEDBACK
// ============================================================

function comboFeedback(
  scene,
  combo
) {
  if (
    !scene?.active ||
    !scene?.player?.active
  ) {
    return;
  }

  const safeCombo =
    Number(combo);

  if (
    !Number.isFinite(
      safeCombo
    ) ||
    safeCombo < 2
  ) {
    return;
  }

  relayComboPulse(
    scene,
    Math.floor(
      safeCombo
    )
  );
}


// ============================================================
// SETUP
// ============================================================

function setup(
  scene
) {
  if (
    !scene ||
    stateByScene.has(
      scene
    )
  ) {
    return;
  }

  const style =
    getStyle(scene);

  const state = {
    style,
    platforms: [],
    barriers: [],
    background: null,
    cleanup: null
  };

  stateByScene.set(
    scene,
    state
  );

  // ----------------------------------------------------------
  // BACKGROUND
  // ----------------------------------------------------------

  state.background =
    addDistrictVariation(
      scene,
      style
    );

  // ----------------------------------------------------------
  // PLATFORM VISUALS
  // ----------------------------------------------------------

  scene.platforms
    ?.getChildren?.()
    .forEach(
      (
        platform,
        index
      ) => {
        const visual =
          addPlatformVisual(
            scene,
            platform,
            index,
            style
          );

        if (
          visual
        ) {
          state.platforms.push(
            visual
          );
        }
      }
    );

  // ----------------------------------------------------------
  // ADVANCED BARRIER VISUALS
  // ----------------------------------------------------------

  scene.barriers
    ?.getChildren?.()
    .forEach(
      (
        barrier,
        index
      ) => {
        const visual =
          addBarrierVisual(
            scene,
            barrier,
            index,
            style
          );

        if (
          visual
        ) {
          state.barriers.push(
            visual
          );
        }
      }
    );

  // ----------------------------------------------------------
  // GAME FEEDBACK EVENTS
  // ----------------------------------------------------------

  const events =
    scene.game?.events;

  if (
    events
  ) {
    const onFeedback =
      kind => {
        if (
          !scene.active ||
          !scene.player?.active
        ) {
          return;
        }

        // Gadget feedback.
        if (
          kind ===
          'gadget'
        ) {
          scene.gadgetPulse?.(
            style.edge,
            13,
            190
          );
        }

        // Hit feedback.
        if (
          kind ===
          'hit'
        ) {
          const pulse =
            scene.add
              .circle(
                scene.player.x,
                scene.player.y,
                18,
                style.edge,
                .12
              )
              .setStrokeStyle(
                2,
                style.bright,
                .46
              )
              .setDepth(11);

          scene.tweens?.add?.({
            targets: pulse,
            scale: 2.25,
            alpha: 0,
            duration: 180,
            ease: 'Quad.Out',
            onComplete: () => {
              safeDestroy(
                pulse
              );
            }
          });

          scene.player.setTint?.(
            style.edge
          );

          scene.time?.delayedCall?.(
            90,
            () => {
              if (
                scene.player?.active
              ) {
                scene.player
                  .clearTint?.();
              }
            }
          );
        }
      };

    const onCombo =
      combo => {
        comboFeedback(
          scene,
          combo
        );
      };

    events.on(
      'feedback',
      onFeedback
    );

    events.on(
      'combo',
      onCombo
    );

    state.cleanup =
      () => {
        events.off(
          'feedback',
          onFeedback
        );

        events.off(
          'combo',
          onCombo
        );
      };
  }

  // ----------------------------------------------------------
  // PUBLIC COMBO API
  // ----------------------------------------------------------

  scene.relayComboPulse =
    combo => {
      relayComboPulse(
        scene,
        combo
      );
    };

  // ----------------------------------------------------------
  // SAFE SHUTDOWN
  // ----------------------------------------------------------

  scene.events?.once?.(
    'shutdown',
    () => {

      // Event listeners.
      state.cleanup?.();

      // Platform graphics.
      state.platforms.forEach(
        item => {
          safeDestroy(
            item
          );
        }
      );

      // Barrier graphics.
      state.barriers.forEach(
        item => {

          // New barrier visuals
          // can be either:
          // { root, pulse }
          // or a legacy Graphics object.
          if (
            item?.root
          ) {
            safeDestroy(
              item.root
            );
          }

          if (
            item?.pulse
          ) {
            safeDestroy(
              item.pulse
            );
          } else {
            safeDestroy(
              item
            );
          }
        }
      );

      // Background.
      safeDestroy(
        state.background?.far
      );

      safeDestroy(
        state.background?.farGlow
      );

      safeDestroy(
        state.background?.mid
      );

      safeDestroy(
        state.background?.near
      );

      safeDestroy(
        state.background?.haze
      );

      // Remove public helper.
      if (
        scene.relayComboPulse
      ) {
        try {
          delete scene.relayComboPulse;
        } catch (_) {
          scene.relayComboPulse =
            undefined;
        }
      }

      // Release state.
      stateByScene.delete(
        scene
      );
    }
  );
}


// ============================================================
// INSTALL
// ============================================================

function install() {
  if (
    window.__relayUpdate12WorldVariation
  ) {
    return;
  }

  window.__relayUpdate12WorldVariation =
    true;

  const ready =
    event => {
      const scene =
        event?.detail?.scene ||
        window.__relayRunnerScene;

      if (
        scene
      ) {
        setup(
          scene
        );
      }
    };

  window.addEventListener(
    'relay:runner-scene-ready',
    ready
  );

  // Defensive fallback.
  if (
    window.__relayRunnerScene
  ) {
    setup(
      window.__relayRunnerScene
    );
  }
}


// ============================================================
// DOM READY
// ============================================================

if (
  document.readyState ===
  'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    install,
    {
      once: true
    }
  );
} else {
  install();
      }
