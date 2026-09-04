import Phaser from 'phaser';

// ============================================================
// RELAY GAMEPLAY EXPANSION V2 — FINAL SAFE
// ============================================================
// Adds optional gameplay mechanics to RunnerScene.
//
// IMPORTANT:
// - Existing RunnerScene movement remains authoritative.
// - Existing combat remains authoritative.
// - Existing mission/state remains authoritative.
// - This module owns ONLY objects created by this module.
// - Safe to install once.
// - Safe to shut down/restart.
// - Desktop keyboard + mobile pointer interaction supported.
// ============================================================

const NS = '__relayGameplayExpansionV2Safe';

const LAYOUT = {
  'first-delivery': [
    'magnetic',
    'conveyor',
    'rewind'
  ],

  'dead-drop': [
    'conveyor',
    'pressure',
    'weight'
  ],

  blackout: [
    'phase',
    'signalIntercept',
    'magnetic'
  ],

  pursuit: [
    'rotation',
    'weight',
    'signalIntercept'
  ],

  'signal-storm': [
    'magnetic',
    'phase',
    'rewind',
    'signalIntercept'
  ],

  'corporate-lockdown': [
    'pressure',
    'conveyor',
    'weight',
    'phase'
  ],

  'final-relay': [
    'rotation',
    'magnetic',
    'pressure',
    'rewind'
  ]
};

const FEATURES = [
  'magnetic',
  'conveyor',
  'rotation',
  'rewind',
  'phase',
  'pressure',
  'signalIntercept',
  'weight'
];

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const lerp = (a, b, t) =>
  a + (b - a) * t;

// ============================================================
// STATE
// ============================================================

function getState(scene) {
  if (scene[NS]) {
    return scene[NS];
  }

  const enabled = Object.fromEntries(
    FEATURES.map(key => [
      key,
      false
    ])
  );

  const missionId =
    scene.mission?.id;

  for (
    const key of LAYOUT[missionId] || []
  ) {
    enabled[key] = true;
  }

  scene[NS] = {
    enabled,

    entities: {},

    timers: new Set(),

    tweens: new Set(),

    objects: new Set(),

    destroyed: false,

    initialized: false,

    polarity: 1
  };

  return scene[NS];
}

// ============================================================
// SAFE HELPERS
// ============================================================

function rememberObject(scene, object) {
  if (!object) {
    return object;
  }

  getState(scene)
    .objects
    .add(object);

  return object;
}

function rememberTween(scene, tween) {
  if (!tween) {
    return tween;
  }

  getState(scene)
    .tweens
    .add(tween);

  return tween;
}

function safeDestroy(object) {
  try {
    object?.destroy?.();
  } catch {}
}

function safeDisableBody(object) {
  try {
    if (object?.disableBody) {
      object.disableBody(
        true,
        true
      );
      return;
    }

    if (object?.body) {
      object.body.enable = false;
    }
  } catch {}
}

function cue(
  scene,
  value,
  color = '#8df4ff'
) {
  try {
    scene.playerCue?.(
      value,
      color
    );
  } catch {}
}

function onKey(
  scene,
  key,
  handler,
  name
) {
  const keyboard =
    scene.input?.keyboard;

  if (
    !keyboard ||
    typeof handler !== 'function'
  ) {
    return;
  }

  const event =
    `keydown-${key}`;

  try {
    keyboard.off(
      event,
      handler
    );

    keyboard.on(
      event,
      handler
    );

    getState(scene)
      .entities[name] =
      handler;
  } catch {}
}

function timer(
  scene,
  fn,
  delay
) {
  const st =
    getState(scene);

  if (
    st.destroyed ||
    !scene.time
  ) {
    return null;
  }

  let handle = null;

  handle =
    scene.time.delayedCall(
      delay,
      () => {
        st.timers.delete(
          handle
        );

        if (
          st.destroyed
        ) {
          return;
        }

        try {
          fn();
        } catch (error) {
          console.warn(
            '[Relay] Gameplay timer error:',
            error
          );
        }
      }
    );

  st.timers.add(
    handle
  );

  return handle;
}

function isAlive(object) {
  return !!(
    object &&
    object.active &&
    !object.destroyed
  );
}

// ============================================================
// WORLD HELPERS
// ============================================================

function routeX(
  scene,
  fraction
) {
  const start =
    Number(
      scene.mission?.spawn?.x ??
      160
    );

  const goal =
    Number(
      scene.mission?.goal?.x ??
      start + 3600
    );

  const safeFraction =
    clamp(
      Number(fraction) || 0,
      0,
      1
    );

  return clamp(
    lerp(
      start + 220,
      goal - 280,
      safeFraction
    ),
    start + 120,
    goal - 100
  );
}

function platformY(
  scene,
  x,
  fallback = 540
) {
  const platforms =
    Array.isArray(
      scene.mission?.platforms
    )
      ? scene.mission.platforms
      : [];

  let best = null;

  for (
    const platform of platforms
  ) {
    if (
      !Array.isArray(platform)
    ) {
      continue;
    }

    const [
      px,
      py,
      width
    ] = platform;

    if (
      !Number.isFinite(px) ||
      !Number.isFinite(py) ||
      !Number.isFinite(width)
    ) {
      continue;
    }

    const score =
      Math.abs(
        px +
        width / 2 -
        x
      );

    if (
      !best ||
      score < best.score
    ) {
      best = {
        y: py,
        score
      };
    }
  }

  return (
    best?.y ??
    fallback
  );
}

// ============================================================
// VISUAL HELPERS
// ============================================================

function label(
  scene,
  value,
  x,
  y,
  color = '#dffcff',
  size = '8px'
) {
  if (!scene.add) {
    return null;
  }

  const node =
    rememberObject(
      scene,
      scene.add
        .text(
          x,
          y,
          value,
          {
            fontFamily:
              'DM Mono, monospace',

            fontSize:
              size,

            color,

            stroke:
              '#08101c',

            strokeThickness:
              4,

            letterSpacing:
              1,

            shadow: {
              offsetX: 0,
              offsetY: 0,
              color,
              blur: 8,
              fill: true
            }
          }
        )
        .setOrigin(
          0.5
        )
        .setDepth(
          22
        )
        .setAlpha(
          0.92
        )
    );

  return node;
}

function pulse(
  scene,
  object,
  scale = 1.12
) {
  if (
    !object ||
    !scene.tweens
  ) {
    return;
  }

  try {
    const tween =
      scene.tweens.add({
        targets: object,

        scaleX: scale,

        scaleY: scale,

        duration: 160,

        yoyo: true,

        ease:
          'Sine.easeOut',

        onComplete: () => {
          getState(scene)
            .tweens
            .delete(tween);
        }
      });

    rememberTween(
      scene,
      tween
    );
  } catch {}
}

function glow(
  scene,
  x,
  y,
  radius,
  color
) {
  if (!scene.add) {
    return {
      outer: null,
      inner: null
    };
  }

  const outer =
    rememberObject(
      scene,
      scene.add
        .circle(
          x,
          y,
          radius,
          color,
          0.045
        )
        .setStrokeStyle(
          2,
          color,
          0.42
        )
        .setDepth(
          11
        )
    );

  const inner =
    rememberObject(
      scene,
      scene.add
        .circle(
          x,
          y,
          Math.max(
            8,
            radius * 0.32
          ),
          color,
          0.08
        )
        .setStrokeStyle(
          1,
          color,
          0.65
        )
        .setDepth(
          12
        )
    );

  if (scene.tweens) {
    try {
      const tween =
        scene.tweens.add({
          targets: [
            outer,
            inner
          ],

          alpha: {
            from: 0.18,
            to: 0.045
          },

          scaleX: {
            from: 0.85,
            to: 1.15
          },

          scaleY: {
            from: 0.85,
            to: 1.15
          },

          duration: 1100,

          repeat: -1,

          yoyo: true,

          ease:
            'Sine.easeInOut'
        });

      rememberTween(
        scene,
        tween
      );
    } catch {}
  }

  return {
    outer,
    inner
  };
}

// ============================================================
// TEXTURES
// ============================================================

function makeTexture(
  scene,
  key,
  width,
  height,
  fill,
  line = 0xdffcff
) {
  if (
    !scene.textures ||
    scene.textures.exists(key)
  ) {
    return;
  }

  let graphics = null;

  try {
    graphics =
      scene.make.graphics({
        add: false
      });

    graphics
      .fillStyle(
        fill,
        1
      )
      .fillRoundedRect(
        0,
        0,
        width,
        height,
        Math.min(
          12,
          width * 0.14
        )
      );

    graphics
      .lineStyle(
        2,
        line,
        0.8
      )
      .strokeRoundedRect(
        1,
        1,
        width - 2,
        height - 2,
        Math.min(
          11,
          width * 0.12
        )
      );

    graphics.generateTexture(
      key,
      width,
      height
    );
  } catch (error) {
    console.warn(
      '[Relay] Texture creation failed:',
      key,
      error
    );
  } finally {
    try {
      graphics?.destroy();
    } catch {}
  }
}

function makeTextures(scene) {
  makeTexture(
    scene,
    'gxv2-magnet',
    34,
    34,
    0x263a52,
    0x8df4ff
  );

  makeTexture(
    scene,
    'gxv2-belt',
    180,
    24,
    0x202d43,
    0xaee37f
  );

  makeTexture(
    scene,
    'gxv2-metal-cargo',
    34,
    34,
    0x443b34,
    0xffcf82
  );

  makeTexture(
    scene,
    'gxv2-phase-wall',
    30,
    64,
    0x302c50,
    0xe0a7ff
  );

  makeTexture(
    scene,
    'gxv2-intercept',
    44,
    28,
    0x25344b,
    0xffcf82
  );

  makeTexture(
    scene,
    'gxv2-valve',
    32,
    32,
    0x253b4a,
    0xaee37f
  );

  makeTexture(
    scene,
    'gxv2-door',
    28,
    88,
    0x202d43,
    0x8df4ff
  );

  makeTexture(
    scene,
    'gxv2-weight',
    36,
    36,
    0x4a3732,
    0xffd06e
  );

  makeTexture(
    scene,
    'gxv2-bridge',
    160,
    20,
    0x27374e,
    0xaee37f
  );
}

// ============================================================
// MAGNETIC
// ============================================================

function installMagnetic(scene) {
  const st =
    getState(scene);

  if (
    !st.enabled.magnetic ||
    st.entities.magnetic
  ) {
    return;
  }

  if (
    !scene.physics?.add
  ) {
    return;
  }

  const sources = [];
  const cargo = [];

  for (
    let i = 0;
    i < 3;
    i++
  ) {
    const x =
      routeX(
        scene,
        0.18 +
        i * 0.24
      );

    const y =
      platformY(
        scene,
        x
      ) - 118;

    const source =
      rememberObject(
        scene,
        scene.physics.add
          .sprite(
            x,
            y,
            'gxv2-magnet'
          )
          .setDepth(
            13
          )
          .setImmovable(
            true
          )
      );

    if (source.body) {
      source.body.allowGravity =
        false;

      source.body.immovable =
        true;
    }

    const polarity =
      i % 2
        ? -1
        : 1;

    source.setData(
      'polarity',
      polarity
    );

    const color =
      polarity > 0
        ? 0x8df4ff
        : 0xff826e;

    const ring =
      glow(
        scene,
        x,
        y,
        58,
        color
      );

    const textNode =
      label(
        scene,
        polarity > 0
          ? 'MAGNET +'
          : 'MAGNET −',
        x,
        y - 30,
        polarity > 0
          ? '#b9f5ff'
          : '#ff9c91'
      );

    source.setInteractive({
      useHandCursor: true
    });

    source.on(
      'pointerdown',
      () => {
        flipPolarity(
          scene
        );
      }
    );

    sources.push({
      source,
      ring,
      text: textNode
    });
  }

  for (
    let i = 0;
    i < 2;
    i++
  ) {
    const x =
      routeX(
        scene,
        0.34 +
        i * 0.28
      );

    const y =
      platformY(
        scene,
        x
      ) - 26;

    const item =
      rememberObject(
        scene,
        scene.physics.add
          .sprite(
            x,
            y,
            'gxv2-metal-cargo'
          )
          .setDepth(
            10
          )
      );

    if (item.body) {
      item.body.setAllowGravity(
        true
      );

      item.body.setMass(
        2 + i
      );
    }

    item.setData(
      'magneticPolarity',
      i ? -1 : 1
    );

    cargo.push(
      item
    );
  }

  const status =
    label(
      scene,
      'POLARITY + · TAP / M',
      110,
      74,
      '#8df4ff',
      '9px'
    );

  status?.setScrollFactor(
    0
  );

  status?.setInteractive({
    useHandCursor: true
  });

  status?.on(
    'pointerdown',
    () => {
      flipPolarity(
        scene
      );
    }
  );

  st.entities.magnetic = {
    sources,
    cargo,
    status
  };

  onKey(
    scene,
    'M',
    () => {
      flipPolarity(
        scene
      );
    },
    'magneticKey'
  );
}

function flipPolarity(scene) {
  const st =
    getState(scene);

  if (
    !st.enabled.magnetic
  ) {
    return;
  }

  st.polarity *= -1;

  const positive =
    st.polarity > 0;

  st.entities
    .magnetic
    ?.status
    ?.setText(
      positive
        ? 'POLARITY + · TAP / M'
        : 'POLARITY − · TAP / M'
    );

  pulse(
    scene,
    st.entities
      .magnetic
      ?.status
  );

  cue(
    scene,
    positive
      ? 'POLARITY +'
      : 'POLARITY −',
    positive
      ? '#8df4ff'
      : '#ff826e'
  );
}

function applyMagnet(
  scene,
  body,
  x,
  y,
  targetPolarity
) {
  if (
    !body?.velocity ||
    !body.position
  ) {
    return;
  }

  const dx =
    x -
    body.position.x;

  const dy =
    y -
    body.position.y;

  const distance =
    Math.hypot(
      dx,
      dy
    );

  if (
    distance < 18 ||
    distance > 250
  ) {
    return;
  }

  const same =
    targetPolarity ===
    getState(scene)
      .polarity;

  const sign =
    same
      ? 1
      : -1;

  const force =
    ((250 - distance) /
      250) *
    110 *
    sign;

  body.velocity.x +=
    (dx / distance) *
    force;

  body.velocity.y +=
    (dy / distance) *
    force *
    0.72;
}

function updateMagnetic(scene) {
  const entry =
    scene[NS]
      ?.entities
      ?.magnetic;

  if (
    !entry ||
    !scene.player?.active ||
    !scene.player.body
  ) {
    return;
  }

  for (
    const item of entry.sources
  ) {
    const source =
      item.source;

    if (
      !isAlive(source)
    ) {
      continue;
    }

    applyMagnet(
      scene,
      scene.player.body,
      source.x,
      source.y,
      Number(
        source.getData(
          'polarity'
        ) || 1
      )
    );

    for (
      const cargo of entry.cargo
    ) {
      if (
        isAlive(cargo) &&
        cargo.body
      ) {
        applyMagnet(
          scene,
          cargo.body,
          source.x,
          source.y,
          Number(
            cargo.getData(
              'magneticPolarity'
            ) || 1
          )
        );
      }
    }

    item.ring
      ?.outer
      ?.setPosition(
        source.x,
        source.y
      );

    item.ring
      ?.inner
      ?.setPosition(
        source.x,
        source.y
      );

    item.text
      ?.setPosition(
        source.x,
        source.y - 30
      );
  }
}

// ============================================================
// CONVEYOR
// ============================================================

function installConveyor(scene) {
  const st =
    getState(scene);

  if (
    !st.enabled.conveyor ||
    st.entities.conveyor
  ) {
    return;
  }

  if (
    !scene.physics?.add
  ) {
    return;
  }

  const belts = [];

  for (
    let i = 0;
    i < 2;
    i++
  ) {
    const x =
      routeX(
        scene,
        0.28 +
        i * 0.31
      );

    const y =
      platformY(
        scene,
        x
      ) - 18;

    const belt =
      rememberObject(
        scene,
        scene.physics.add
          .sprite(
            x,
            y,
            'gxv2-belt'
          )
          .setDepth(
            9
          )
          .setImmovable(
            true
          )
      );

    if (belt.body) {
      belt.body.allowGravity =
        false;

      belt.body.immovable =
        true;
    }

    const speed =
      i % 2
        ? -105
        : 105;

    belt.setData(
      'speed',
      speed
    );

    belt.setData(
      'min',
      x - 260
    );

    belt.setData(
      'max',
      x + 420
    );

    const textNode =
      label(
        scene,
        speed > 0
          ? 'CONVEYOR →'
          : 'CONVEYOR ←',
        x,
        y - 24,
        '#aee37f'
      );

    const glowNode =
      glow(
        scene,
        x,
        y,
        90,
        0xaee37f
      );

    belts.push({
      belt,
      text: textNode,
      glow: glowNode
    });
  }

  st.entities.conveyor = {
    belts
  };
}

function updateConveyor(scene) {
  const belts =
    scene[NS]
      ?.entities
      ?.conveyor
      ?.belts || [];

  const delta =
    scene.game
      ?.loop
      ?.delta || 16;

  for (
    const entry of belts
  ) {
    const belt =
      entry.belt;

    if (
      !isAlive(belt)
    ) {
      continue;
    }

    const data =
      belt.data?.values ||
      {};

    let speed =
      Number(
        data.speed || 0
      );

    const min =
      Number(
        data.min ??
        belt.x - 260
      );

    const max =
      Number(
        data.max ??
        belt.x + 420
      );

    if (
      belt.x >= max
    ) {
      speed = -105;

      belt.setData(
        'speed',
        speed
      );
    }

    if (
      belt.x <= min
    ) {
      speed = 105;

      belt.setData(
        'speed',
        speed
      );
    }

    const movement =
      speed *
      delta /
      1000;

    if (
      scene.player?.active &&
      scene.player.getBounds &&
      Phaser.Geom.Intersects
        .RectangleToRectangle(
          scene.player.getBounds(),
          belt.getBounds()
        )
    ) {
      const worldWidth =
        Number(
          scene.worldWidth ||
          5000
        );

      scene.player.x =
        clamp(
          scene.player.x +
            movement,
          30,
          worldWidth - 30
        );
    }

    const cargo =
      scene[NS]
        ?.entities
        ?.magnetic
        ?.cargo || [];

    for (
      const item of cargo
    ) {
      if (
        !isAlive(item)
      ) {
        continue;
      }

      if (
        Phaser.Geom.Intersects
          .RectangleToRectangle(
            item.getBounds(),
            belt.getBounds()
          )
      ) {
        item.x +=
          movement;
      }
    }

    entry.text
      ?.setPosition(
        belt.x,
        belt.y - 24
      );

    entry.glow
      ?.outer
      ?.setPosition(
        belt.x,
        belt.y
      );

    entry.glow
      ?.inner
      ?.setPosition(
        belt.x,
        belt.y
      );
  }
}

// ============================================================
// ROTATION
// ============================================================

function installRotation(scene) {
  const st =
    getState(scene);

  if (
    !st.enabled.rotation ||
    st.entities.rotation
  ) {
    return;
  }

  if (
    !scene.physics?.add
  ) {
    return;
  }

  const cx =
    routeX(
      scene,
      0.5
    );

  const cy =
    platformY(
      scene,
      cx
    ) - 150;

  const radius = 112;

  const pivot =
    rememberObject(
      scene,
      scene.add
        .circle(
          cx,
          cy,
          10,
          0xffd06e,
          0.95
        )
        .setDepth(
          18
        )
        .setInteractive({
          useHandCursor: true
        })
    );

  const arms =
    [0, Math.PI].map(
      angle => {
        const platform =
          rememberObject(
            scene,
            scene.add
              .rectangle(
                cx +
                  Math.cos(angle) *
                    radius,
                cy +
                  Math.sin(angle) *
                    radius,
                138,
                20,
                0x263852
              )
              .setDepth(
                9
              )
              .setImmovable(
                true
              )
          );

        scene.physics.add.existing(
          platform
        );

        if (platform.body) {
          platform.body.allowGravity =
            false;

          platform.body.immovable =
            true;
        }

        return platform;
      }
    );

  const textNode =
    label(
      scene,
      'ROTATING STRUCTURE · TAP / T',
      cx,
      cy - 154,
      '#ffd06e',
      '9px'
    );

  const entry = {
    pivot,
    arms,
    cx,
    cy,
    radius,
    angle: 0,
    locked: false,
    text: textNode
  };

  st.entities.rotation =
    entry;

  const toggle =
    () => {
      entry.locked =
        !entry.locked;

      pulse(
        scene,
        entry.pivot
      );

      cue(
        scene,
        entry.locked
          ? 'STRUCTURE LOCKED'
          : 'STRUCTURE ROTATING',
        '#ffd06e'
      );
    };

  pivot.on(
    'pointerdown',
    toggle
  );

  textNode?.setInteractive({
    useHandCursor: true
  });

  textNode?.on(
    'pointerdown',
    toggle
  );

  onKey(
    scene,
    'T',
    toggle,
    'rotationKey'
  );
}

function updateRotation(scene) {
  const e =
    scene[NS]
      ?.entities
      ?.rotation;

  if (!e) {
    return;
  }

  if (
    !e.locked
  ) {
    e.angle +=
      (
        scene.game
          ?.loop
          ?.delta ||
        16
      ) *
      0.00095;
  }

  for (
    let i = 0;
    i < e.arms.length;
    i++
  ) {
    const angle =
      e.angle +
      i * Math.PI;

    const arm =
      e.arms[i];

    if (
      !arm ||
      !arm.active
    ) {
      continue;
    }

    arm.x =
      e.cx +
      Math.cos(angle) *
        e.radius;

    arm.y =
      e.cy +
      Math.sin(angle) *
        e.radius;

    arm.rotation =
      angle;
  }

  e.pivot
    ?.setPosition(
      e.cx,
      e.cy
    );

  e.text
    ?.setPosition(
      e.cx,
      e.cy - 154
    );
}

// ============================================================
// REWIND
// ============================================================

function installRewind(scene) {
  const st =
    getState(scene);

  if (
    !st.enabled.rewind ||
    st.entities.rewind
  ) {
    return;
  }

  const entry = {
    buffer: [],

    accumulator: 0,

    active: false,

    index: 0,

    label: label(
      scene,
      'TEMPORAL REWIND · R',
      100,
      106,
      '#e0a7ff',
      '9px'
    )
  };

  entry.label
    ?.setScrollFactor(0);

  st.entities.rewind =
    entry;

  entry.label
    ?.setInteractive({
      useHandCursor: true
    });

  entry.label
    ?.on(
      'pointerdown',
      () => {
        triggerRewind(
          scene
        );
      }
    );

  onKey(
    scene,
    'R',
    () => {
      triggerRewind(
        scene
      );
    },
    'rewindKey'
  );
}

function triggerRewind(scene) {
  const e =
    getState(scene)
      .entities
      .rewind;

  if (
    !e ||
    e.active ||
    e.buffer.length < 10 ||
    scene.respawning ||
    scene.finished ||
    !scene.player?.active ||
    !scene.player.body
  ) {
    return;
  }

  e.active = true;

  e.index =
    Math.max(
      0,
      e.buffer.length - 1
    );

  scene.player.body.moves =
    false;

  scene.player.body.velocity.set(
    0,
    0
  );

  cue(
    scene,
    'TEMPORAL REWIND',
    '#e0a7ff'
  );

  pulse(
    scene,
    e.label,
    1.16
  );
}

function updateRewind(
  scene,
  delta
) {
  const e =
    scene[NS]
      ?.entities
      ?.rewind;

  if (
    !e ||
    !scene.player?.active ||
    !scene.player.body
  ) {
    return;
  }

  // ----------------------------------------------------------
  // Recording
  // ----------------------------------------------------------

  if (!e.active) {
    e.accumulator +=
      Math.max(
        0,
        Number(delta) || 0
      );

    if (
      e.accumulator >= 80
    ) {
      e.accumulator = 0;

      e.buffer.push({
        x:
          scene.player.x,

        y:
          scene.player.y,

        vx:
          scene.player.body
            .velocity.x,

        vy:
          scene.player.body
            .velocity.y
      });

      if (
        e.buffer.length > 60
      ) {
        e.buffer.shift();
      }
    }

    return;
  }

  // ----------------------------------------------------------
  // Rewind playback
  // ----------------------------------------------------------

  if (
    scene.respawning ||
    scene.finished
  ) {
    e.active = false;

    e.buffer.length = 0;

    scene.player.body.moves =
      true;

    return;
  }

  const sample =
    e.buffer[e.index];

  if (sample) {
    scene.player.setPosition(
      sample.x,
      sample.y
    );

    scene.player.body.velocity.set(
      sample.vx,
      sample.vy
    );
  }

  e.index--;

  if (
    e.index < 0
  ) {
    e.active = false;

    scene.player.body.moves =
      true;

    scene.player.body.velocity.set(
      0,
      0
    );

    e.buffer.length = 0;

    cue(
      scene,
      'TIME RESTORED',
      '#e0a7ff'
    );
  }
}

// ============================================================
// PHASE
// ============================================================

function installPhase(scene) {
  const st =
    getState(scene);

  if (
    !st.enabled.phase ||
    st.entities.phase
  ) {
    return;
  }

  if (
    !scene.physics?.add
  ) {
    return;
  }

  const walls = [];

  for (
    let i = 0;
    i < 2;
    i++
  ) {
    const x =
      routeX(
        scene,
        0.36 +
        i * 0.24
      );

    const y =
      platformY(
        scene,
        x
      ) - 50;

    const wall =
      rememberObject(
        scene,
        scene.physics.add
          .sprite(
            x,
            y,
            'gxv2-phase-wall'
          )
          .setDepth(
            12
          )
          .setImmovable(
            true
          )
      );

    if (wall.body) {
      wall.body.allowGravity =
        false;

      wall.body.immovable =
        true;
    }

    const glowNode =
      glow(
        scene,
        x,
        y,
        52,
        0xe0a7ff
      );

    const textNode =
      label(
        scene,
        'PHASE GATE',
        x,
        y - 40,
        '#e0a7ff'
      );

    walls.push({
      wall,
      text: textNode,
      glow: glowNode
    });
  }

  const status =
    label(
      scene,
      'PHASE SHIFT · P',
      205,
      106,
      '#e0a7ff',
      '9px'
    );

  status?.setScrollFactor(
    0
  );

  st.entities.phase = {
    walls,
    active: false,
    status
  };

  const toggle =
    () => {
      togglePhase(
        scene
      );
    };

  status?.setInteractive({
    useHandCursor: true
  });

  status?.on(
    'pointerdown',
    toggle
  );

  onKey(
    scene,
    'P',
    toggle,
    'phaseKey'
  );
}

function togglePhase(scene) {
  const e =
    getState(scene)
      .entities
      .phase;

  if (!e) {
    return;
  }

  e.active =
    !e.active;

  for (
    const item of e.walls
  ) {
    if (
      item.wall?.body
    ) {
      item.wall.body.enable =
        !e.active;
    }

    item.wall?.setAlpha(
      e.active
        ? 0.22
        : 1
    );

    item.text?.setAlpha(
      e.active
        ? 0.45
        : 0.92
    );
  }

  e.status?.setText(
    e.active
      ? 'PHASE SHIFT ACTIVE · P'
      : 'PHASE SHIFT · P'
  );

  pulse(
    scene,
    e.status
  );

  cue(
    scene,
    e.active
      ? 'PHASE SHIFT ACTIVE'
      : 'PHASE SHIFT OFF',
    '#e0a7ff'
  );
}

function updatePhase(scene) {
  const walls =
    scene[NS]
      ?.entities
      ?.phase
      ?.walls || [];

  for (
    const item of walls
  ) {
    if (
      !item.wall
    ) {
      continue;
    }

    item.text?.setPosition(
      item.wall.x,
      item.wall.y - 40
    );

    item.glow
      ?.outer
      ?.setPosition(
        item.wall.x,
        item.wall.y
      );

    item.glow
      ?.inner
      ?.setPosition(
        item.wall.x,
        item.wall.y
      );
  }
}

// ============================================================
// PRESSURE
// ============================================================

function installPressure(scene) {
  const st =
    getState(scene);

  if (
    !st.enabled.pressure ||
    st.entities.pressure
  ) {
    return;
  }

  if (
    !scene.physics?.add
  ) {
    return;
  }

  const x =
    routeX(
      scene,
      0.59
    );

  const y =
    platformY(
      scene,
      x
    ) - 115;

  const left =
    rememberObject(
      scene,
      scene.physics.add
        .sprite(
          x - 96,
          y,
          'gxv2-valve'
        )
        .setDepth(
          13
        )
        .setImmovable(
          true
        )
    );

  const right =
    rememberObject(
      scene,
      scene.physics.add
        .sprite(
          x + 96,
          y,
          'gxv2-valve'
        )
        .setDepth(
          13
        )
        .setImmovable(
          true
        )
    );

  if (left.body) {
    left.body.allowGravity =
      false;

    left.body.immovable =
      true;
  }

  if (right.body) {
    right.body.allowGravity =
      false;

    right.body.immovable =
      true;
  }

  const door =
    rememberObject(
      scene,
      scene.physics.add
        .sprite(
          x,
          y + 52,
          'gxv2-door'
        )
        .setDepth(
          11
        )
        .setImmovable(
          true
        )
    );

  if (door.body) {
    door.body.allowGravity =
      false;

    door.body.immovable =
      true;
  }

  const status =
    label(
      scene,
      'PRESSURE 00 / 00',
      x,
      y + 98,
      '#dffcff'
    );

  const heading =
    label(
      scene,
      'PRESSURE CHAMBER · TAP VALVES',
      x,
      y - 44,
      '#aee37f'
    );

  const entry = {
    left,
    right,
    door,

    leftP: 0,

    rightP: 0,

    status,

    heading,

    balanced: false
  };

  st.entities.pressure =
    entry;

  const add =
    side => {
      if (
        st.destroyed
      ) {
        return;
      }

      entry[side] =
        clamp(
          entry[side] + 12,
          0,
          100
        );

      pulse(
        scene,
        side === 'leftP'
          ? left
          : right
      );

      cue(
        scene,
        side === 'leftP'
          ? 'LEFT PRESSURE +'
          : 'RIGHT PRESSURE +',
        '#aee37f'
      );
    };

  const leftTap =
    () => {
      add('leftP');
    };

  const rightTap =
    () => {
      add('rightP');
    };

  left.setInteractive({
    useHandCursor: true
  });

  right.setInteractive({
    useHandCursor: true
  });

  left.on(
    'pointerdown',
    leftTap
  );

  right.on(
    'pointerdown',
    rightTap
  );

  onKey(
    scene,
    'C',
    leftTap,
    'pressureLeftKey'
  );

  onKey(
    scene,
    'V',
    rightTap,
    'pressureRightKey'
  );
}

function updatePressure(
  scene,
  delta
) {
  const e =
    scene[NS]
      ?.entities
      ?.pressure;

  if (!e) {
    return;
  }

  const safeDelta =
    Math.max(
      0,
      Number(delta) || 0
    );

  e.leftP =
    Math.max(
      0,
      e.leftP -
        safeDelta *
        0.0045
    );

  e.rightP =
    Math.max(
      0,
      e.rightP -
        safeDelta *
        0.0045
    );

  const balanced =
    Math.abs(
      e.leftP -
      e.rightP
    ) <= 8 &&
    e.leftP >= 60 &&
    e.rightP >= 60;

  if (
    balanced &&
    !e.balanced
  ) {
    cue(
      scene,
      'PRESSURE BALANCED',
      '#aee37f'
    );

    pulse(
      scene,
      e.door,
      1.08
    );
  }

  e.balanced =
    balanced;

  if (e.door?.body) {
    e.door.body.enable =
      !balanced;
  }

  e.door?.setAlpha(
    balanced
      ? 0.18
      : 1
  );

  e.status?.setText(
    `PRESSURE ${String(
      Math.round(e.leftP)
    ).padStart(2, '0')} / ${String(
      Math.round(e.rightP)
    ).padStart(2, '0')}${
      balanced
        ? ' · BALANCED'
        : ''
    }`
  );

  e.heading?.setPosition(
    e.door?.x ?? 0,
    (e.door?.y ?? 0) - 96
  );
}

// ============================================================
// SIGNAL INTERCEPT
// ============================================================

function installSignalIntercept(scene) {
  const st =
    getState(scene);

  if (
    !st.enabled.signalIntercept ||
    st.entities.signalIntercept
  ) {
    return;
  }

  if (
    !scene.physics?.add
  ) {
    return;
  }

  const x =
    routeX(
      scene,
      0.61
    );

  const y =
    platformY(
      scene,
      x
    ) - 160;

  const drone =
    rememberObject(
      scene,
      scene.physics.add
        .sprite(
          x,
          y,
          'gxv2-intercept'
        )
        .setDepth(
          14
        )
        .setImmovable(
          true
        )
    );

  if (drone.body) {
    drone.body.allowGravity =
      false;

    drone.body.immovable =
      true;
  }

  const glowNode =
    glow(
      scene,
      x,
      y,
      58,
      0xffcf82
    );

  const textNode =
    label(
      scene,
      'SIGNAL TARGET · INTERCEPT',
      x,
      y - 28,
      '#ffcf82'
    );

  const entry = {
    drone,

    text: textNode,

    glow: glowNode,

    phase:
      Math.random() *
      Math.PI *
      2,

    secured: false
  };

  st.entities.signalIntercept =
    entry;

  if (
    scene.player
  ) {
    scene.physics.add.overlap(
      scene.player,
      drone,
      () => {
        const e =
          getState(scene)
            .entities
            .signalIntercept;

        if (
          !e ||
          e.secured ||
          !isAlive(e.drone)
        ) {
          return;
        }

        e.secured =
          true;

        safeDisableBody(
          e.drone
        );

        e.text?.setText(
          'SIGNAL INTERCEPTED'
        );

        e.text?.setColor(
          '#aee37f'
        );

        e.glow
          ?.outer
          ?.setAlpha(0.12);

        e.glow
          ?.inner
          ?.setAlpha(0.18);

        cue(
          scene,
          'SIGNAL INTERCEPTED',
          '#ffcf82'
        );

        try {
          scene.game
            ?.events
            ?.emit(
              'signal-intercepted',
              {
                missionId:
                  scene.mission?.id
              }
            );
        } catch {}
      }
    );
  }
}

function updateSignalIntercept(
  scene,
  time
) {
  const e =
    scene[NS]
      ?.entities
      ?.signalIntercept;

  if (
    !e ||
    e.secured ||
    !isAlive(e.drone)
  ) {
    return;
  }

  const a =
    routeX(
      scene,
      0.56
    );

  const b =
    routeX(
      scene,
      0.76
    );

  const t =
    (
      Math.sin(
        time / 1000 +
        e.phase
      ) + 1
    ) / 2;

  e.drone.x =
    lerp(
      a,
      b,
      t
    );

  e.drone.y =
    platformY(
      scene,
      e.drone.x
    ) -
    160 +
    Math.sin(
      time / 270
    ) * 9;

  e.text?.setPosition(
    e.drone.x,
    e.drone.y - 28
  );

  e.glow
    ?.outer
    ?.setPosition(
      e.drone.x,
      e.drone.y
    );

  e.glow
    ?.inner
    ?.setPosition(
      e.drone.x,
      e.drone.y
    );
}

// ============================================================
// WEIGHT
// ============================================================

function installWeight(scene) {
  const st =
    getState(scene);

  if (
    !st.enabled.weight ||
    st.entities.weight
  ) {
    return;
  }

  if (
    !scene.physics?.add
  ) {
    return;
  }

  const x =
    routeX(
      scene,
      0.52
    );

  const y =
    platformY(
      scene,
      x
    ) - 70;

  const plates =
    [
      x - 82,
      x + 82
    ].map(
      (px, i) => {
        const plate =
          rememberObject(
            scene,
            scene.physics.add
              .sprite(
                px,
                y + 30,
                'gxv2-belt'
              )
              .setDisplaySize(
                72,
                12
              )
              .setDepth(
                8
              )
              .setImmovable(
                true
              )
          );

        if (plate.body) {
          plate.body.allowGravity =
            false;

          plate.body.immovable =
            true;
        }

        plate.setData(
          'required',
          i
            ? 6
            : 10
        );

        return plate;
      }
    );

  const crates =
    [
      10,
      6,
      4
    ].map(
      (weight, i) => {
        const crate =
          rememberObject(
            scene,
            scene.physics.add
              .sprite(
                x - 95 +
                  i * 90,
                y - 4,
                'gxv2-weight'
              )
              .setDepth(
                10
              )
          );

        if (crate.body) {
          crate.body.setAllowGravity(
            true
          );

          crate.body.setMass(
            weight
          );

          crate.body.setBounce(
            0.05
          );

          crate.body.setDrag(
            20,
            20
          );
        }

        crate.setData(
          'weightValue',
          weight
        );

        return crate;
      }
    );

  const bridge =
    rememberObject(
      scene,
      scene.physics.add
        .sprite(
          x,
          y - 60,
          'gxv2-bridge'
        )
        .setDepth(
          7
        )
        .setImmovable(
          true
        )
    );

  if (bridge.body) {
    bridge.body.allowGravity =
      false;

    bridge.body.immovable =
      true;
  }

  const textNode =
    label(
      scene,
      'WEIGHT BALANCE · MOVE THE LOAD',
      x,
      y - 92,
      '#ffcf82'
    );

  st.entities.weight = {
    plates,

    crates,

    bridge,

    text: textNode,

    open: false
  };
}

function updateWeight(scene) {
  const e =
    scene[NS]
      ?.entities
      ?.weight;

  if (!e) {
    return;
  }

  const totals =
    e.plates.map(
      plate =>
        e.crates.reduce(
          (
            sum,
            crate
          ) => {
            if (
              !isAlive(crate)
            ) {
              return sum;
            }

            const touching =
              Phaser.Geom
                .Intersects
                .RectangleToRectangle(
                  plate.getBounds(),
                  crate.getBounds()
                );

            return (
              sum +
              (
                touching
                  ? Number(
                      crate.getData(
                        'weightValue'
                      ) || 0
                    )
                  : 0
              )
            );
          },
          0
        )
    );

  const requiredLeft =
    Number(
      e.plates[0]
        ?.getData(
          'required'
        ) || 10
    );

  const requiredRight =
    Number(
      e.plates[1]
        ?.getData(
          'required'
        ) || 6
    );

  const open =
    totals[0] >=
      requiredLeft &&
    totals[1] >=
      requiredRight;

  if (
    open &&
    !e.open
  ) {
    cue(
      scene,
      'WEIGHT BALANCED',
      '#aee37f'
    );

    pulse(
      scene,
      e.bridge,
      1.08
    );
  }

  if (
    e.bridge?.body
  ) {
    e.bridge.body.enable =
      !open;
  }

  e.bridge?.setAlpha(
    open
      ? 0.18
      : 1
  );

  e.open =
    open;

  e.text?.setText(
    open
      ? 'WEIGHT BALANCED · PATH OPEN'
      : `WEIGHT ${totals[0]} / ${requiredLeft} · ${totals[1]} / ${requiredRight}`
  );

  e.text?.setPosition(
    e.bridge?.x ?? 0,
    (e.bridge?.y ?? 0) - 50
  );
}

// ============================================================
// INSTALL ALL
// ============================================================

function install(scene) {
  const st =
    getState(scene);

  if (
    st.initialized ||
    st.destroyed
  ) {
    return;
  }

  st.initialized =
    true;

  try {
    makeTextures(scene);

    installMagnetic(scene);

    installConveyor(scene);

    installRotation(scene);

    installRewind(scene);

    installPhase(scene);

    installPressure(scene);

    installSignalIntercept(scene);

    installWeight(scene);
  } catch (error) {
    console.warn(
      '[Relay] Gameplay expansion install error:',
      error
    );
  }
}

// ============================================================
// UPDATE ALL
// ============================================================

function update(
  scene,
  time,
  delta
) {
  const st =
    scene[NS];

  if (
    !st ||
    st.destroyed ||
    !scene.player?.active
  ) {
    return;
  }

  try {
    updateMagnetic(scene);
  } catch (error) {
    console.warn(
      '[Relay] Magnetic update:',
      error
    );
  }

  try {
    updateConveyor(scene);
  } catch (error) {
    console.warn(
      '[Relay] Conveyor update:',
      error
    );
  }

  try {
    updateRotation(scene);
  } catch (error) {
    console.warn(
      '[Relay] Rotation update:',
      error
    );
  }

  try {
    updateRewind(
      scene,
      delta
    );
  } catch (error) {
    console.warn(
      '[Relay] Rewind update:',
      error
    );
  }

  try {
    updatePhase(scene);
  } catch (error) {
    console.warn(
      '[Relay] Phase update:',
      error
    );
  }

  try {
    updatePressure(
      scene,
      delta
    );
  } catch (error) {
    console.warn(
      '[Relay] Pressure update:',
      error
    );
  }

  try {
    updateSignalIntercept(
      scene,
      time
    );
  } catch (error) {
    console.warn(
      '[Relay] Signal update:',
      error
    );
  }

  try {
    updateWeight(scene);
  } catch (error) {
    console.warn(
      '[Relay] Weight update:',
      error
    );
  }
}

// ============================================================
// CLEANUP
// ============================================================

function destroy(scene) {
  const st =
    scene[NS];

  if (
    !st ||
    st.destroyed
  ) {
    return;
  }

  st.destroyed =
    true;

  // ----------------------------------------------------------
  // Timers
  // ----------------------------------------------------------

  for (
    const handle of st.timers
  ) {
    try {
      handle?.remove?.();
    } catch {}
  }

  st.timers.clear();

  // ----------------------------------------------------------
  // Tweens
  // ----------------------------------------------------------

  for (
    const tween of st.tweens
  ) {
    try {
      tween?.stop?.();
      tween?.remove?.();
    } catch {}
  }

  st.tweens.clear();

  // ----------------------------------------------------------
  // Keyboard handlers
  // ----------------------------------------------------------

  const keyMap = [
    ['M', 'magneticKey'],
    ['T', 'rotationKey'],
    ['R', 'rewindKey'],
    ['P', 'phaseKey'],
    ['C', 'pressureLeftKey'],
    ['V', 'pressureRightKey']
  ];

  for (
    const [
      key,
      name
    ] of keyMap
  ) {
    const fn =
      st.entities[name];

    if (!fn) {
      continue;
    }

    try {
      scene.input
        ?.keyboard
        ?.off(
          `keydown-${key}`,
          fn
        );
    } catch {}
  }

  // ----------------------------------------------------------
  // Restore player physics
  // ----------------------------------------------------------

  try {
    if (
      scene.player?.body
    ) {
      scene.player.body.moves =
        true;

      scene.player.body.velocity.set(
        0,
        0
      );
    }
  } catch {}

  // ----------------------------------------------------------
  // Destroy ONLY objects created by expansion
  // ----------------------------------------------------------

  for (
    const object of st.objects
  ) {
    safeDestroy(object);
  }

  st.objects.clear();

  st.entities = {};

  st.initialized =
    false;

  // Keep namespace available so
  // shutdown remains idempotent.
}

// ============================================================
// PUBLIC INSTALLER
// ============================================================

export function installGameplayExpansionV2Safe(
  RunnerScene
) {
  if (
    !RunnerScene?.prototype
  ) {
    return;
  }

  // Never patch RunnerScene twice.
  if (
    RunnerScene.prototype
      .__relayGameplayExpansionV2SafeInstalled
  ) {
    return;
  }

  RunnerScene.prototype
    .__relayGameplayExpansionV2SafeInstalled =
    true;

  // ==========================================================
  // CREATE
  // ==========================================================

  const originalCreate =
    RunnerScene.prototype.create;

  RunnerScene.prototype.create =
    function gameplayExpansionV2SafeCreate(
      ...args
    ) {
      const result =
        typeof originalCreate ===
        'function'
          ? originalCreate.apply(
              this,
              args
            )
          : undefined;

      try {
        if (
          this.mission
        ) {
          install(this);
        }
      } catch (error) {
        console.warn(
          '[Relay] V2 create isolated:',
          error
        );
      }

      return result;
    };

  // ==========================================================
  // UPDATE
  // ==========================================================

  const originalUpdate =
    RunnerScene.prototype.update;

  RunnerScene.prototype.update =
    function gameplayExpansionV2SafeUpdate(
      time,
      delta,
      ...args
    ) {
      let result;

      if (
        typeof originalUpdate ===
        'function'
      ) {
        result =
          originalUpdate.apply(
            this,
            [
              time,
              delta,
              ...args
            ]
          );
      }

      try {
        update(
          this,
          time,
          delta
        );
      } catch (error) {
        console.warn(
          '[Relay] V2 update isolated:',
          error
        );
      }

      return result;
    };

  // ==========================================================
  // SHUTDOWN
  // ==========================================================

  const originalShutdown =
    RunnerScene.prototype.shutdown;

  RunnerScene.prototype.shutdown =
    function gameplayExpansionV2SafeShutdown(
      ...args
    ) {
      try {
        destroy(this);
      } catch (error) {
        console.warn(
          '[Relay] V2 cleanup isolated:',
          error
        );
      }

      if (
        typeof originalShutdown ===
        'function'
      ) {
        return originalShutdown.apply(
          this,
          args
        );
      }

      return undefined;
    };
      }
