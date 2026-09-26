import { RunnerScene } from '../scenes/RunnerScene.js';

/* ============================================================
   FUTURISTIC NEON WORLD V4.0
   ------------------------------------------------------------
   WORLD DIRECTOR

   - futuristic route generation
   - dynamic neon sky
   - moon + animated moon halo
   - layered horizon
   - stars
   - moving sky bands
   - atmospheric streaks
   - procedural neon rain
   - fog / haze
   - storm lightning
   - dynamic neon time
   - animated city
   - mega towers
   - sky rails
   - sky bridges
   - holographic signage
   - orbital structure
   - ground infrastructure
   - animated platform architecture
   - checkpoint energy
   - start gate
   - goal relay
   - world badge
   - automatic weather cycle
   ============================================================ */

/* ============================================================
   WORLD SKINS
   ============================================================ */

const WORLD_SKINS = Object.freeze({
  'first-delivery': {
    accent: 0x55e9ff,
    secondary: 0x8b65ff,
    tertiary: 0x69efb0,
    warning: 0xffca70,
    sky: 0x030813,
    horizon: 0x071426,
    building: 0x081322,
    building2: 0x0b1a2b,
    zone: 'NEON DISTRICT',
    architecture: 'CITY',
  },

  'dead-drop': {
    accent: 0xff7f66,
    secondary: 0xffca70,
    tertiary: 0x55e9ff,
    warning: 0xff5364,
    sky: 0x060b14,
    horizon: 0x10151e,
    building: 0x101722,
    building2: 0x1a2028,
    zone: 'DOCK SECTOR',
    architecture: 'INDUSTRIAL',
  },

  blackout: {
    accent: 0x55e9ff,
    secondary: 0x69efb0,
    tertiary: 0x8b65ff,
    warning: 0xff5364,
    sky: 0x02060d,
    horizon: 0x061014,
    building: 0x061014,
    building2: 0x0a171a,
    zone: 'BLACK GRID',
    architecture: 'BLACKOUT',
  },

  pursuit: {
    accent: 0xff5364,
    secondary: 0x55e9ff,
    tertiary: 0xffca70,
    warning: 0xff7f66,
    sky: 0x050813,
    horizon: 0x11101b,
    building: 0x0c111d,
    building2: 0x111927,
    zone: 'RAIL SPINE',
    architecture: 'TRANSIT',
  },

  'signal-storm': {
    accent: 0x9f7bff,
    secondary: 0x55e9ff,
    tertiary: 0xffca70,
    warning: 0xff5364,
    sky: 0x070511,
    horizon: 0x10091b,
    building: 0x100c1d,
    building2: 0x17112a,
    zone: 'CROWN ARRAY',
    architecture: 'SIGNAL',
  },

  'corporate-lockdown': {
    accent: 0xff5364,
    secondary: 0xffca70,
    tertiary: 0x55e9ff,
    warning: 0xff7f66,
    sky: 0x07090f,
    horizon: 0x11141b,
    building: 0x0d1119,
    building2: 0x151a23,
    zone: 'HELIX VERTICAL',
    architecture: 'CORPORATE',
  },

  'final-relay': {
    accent: 0xffca70,
    secondary: 0x55e9ff,
    tertiary: 0x9f7bff,
    warning: 0xff5364,
    sky: 0x06050b,
    horizon: 0x14100b,
    building: 0x100d0a,
    building2: 0x19140e,
    zone: 'APEX SPINE',
    architecture: 'APEX',
  },

  'mission-08': {
    accent: 0x76e7ff,
    secondary: 0x9f7bff,
    tertiary: 0x69efb0,
    warning: 0xff5364,
    sky: 0x03050c,
    horizon: 0x07101d,
    building: 0x08101c,
    building2: 0x10172a,
    zone: 'GHOSTLINE',
    architecture: 'GHOST',
  },
});

/* ============================================================
   NEON TIME PRESETS
   ============================================================ */

const NEON_TIME_PRESETS = Object.freeze({
  NIGHT: {
    intensity: 0.95,
    rain: 0,
    fog: 0.08,
    stars: 0.9,
    city: 1,
    lightning: 0,
    pulse: 1,
  },

  NEON_RAIN: {
    intensity: 1.18,
    rain: 0.82,
    fog: 0.16,
    stars: 0.55,
    city: 1.16,
    lightning: 0.08,
    pulse: 1.08,
  },

  STORM: {
    intensity: 1.38,
    rain: 1,
    fog: 0.25,
    stars: 0.18,
    city: 1.3,
    lightning: 0.75,
    pulse: 1.2,
  },

  DEEP_NIGHT: {
    intensity: 0.72,
    rain: 0,
    fog: 0.12,
    stars: 1,
    city: 0.78,
    lightning: 0,
    pulse: 0.78,
  },
});

/* ============================================================
   HELPERS
   ============================================================ */

function getSkin(mission) {
  return WORLD_SKINS[mission?.id] || WORLD_SKINS['first-delivery'];
}

function safeNumber(value, fallback) {
  const n = Number(value);

  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/* ============================================================
   NEON WORLD STATE
   ============================================================ */

function getNeonPreset(mode) {
  const normalized = String(mode || 'NEON_RAIN').toUpperCase();

  return NEON_TIME_PRESETS[normalized] || NEON_TIME_PRESETS.NEON_RAIN;
}

/* ============================================================
   WORLD LAYER ALPHA
   ============================================================ */

function setWorldLayerAlpha(scene, multiplier) {
  const layers = scene.__neonWorldLayers;

  if (!layers) {
    return;
  }

  Object.values(layers).forEach((layer) => {
    if (!layer) {
      return;
    }

    if (Array.isArray(layer)) {
      layer.forEach((item) => {
        item?.setAlpha?.(clamp(safeNumber(item.__neonBaseAlpha, 1) * multiplier, 0, 1));
      });

      return;
    }

    layer.setAlpha?.(clamp(safeNumber(layer.__neonBaseAlpha, 1) * multiplier, 0, 1));
  });
}

/* ============================================================
   APPLY NEON TIME
   ============================================================ */

function applyNeonTime(scene, mode) {
  if (!scene) {
    return false;
  }

  const normalizedMode = String(mode || 'NEON_RAIN').toUpperCase();

  const preset = getNeonPreset(normalizedMode);

  scene.__neonTimeMode = normalizedMode;

  scene.__neonTimePreset = preset;

  scene.__neonTimeTargetIntensity = preset.intensity;

  /* ----------------------------------------------------------
     SKY
     ---------------------------------------------------------- */

  const sky = scene.__neonSky;

  if (sky) {
    sky.moon?.setAlpha?.(clamp(0.64 + preset.intensity * 0.16, 0, 1));

    sky.moonGlow?.setAlpha?.(0.035 + preset.intensity * 0.05);

    sky.stars?.setAlpha?.(clamp(preset.stars, 0, 1));

    sky.bands?.setAlpha?.(0.35 + preset.intensity * 0.3);

    sky.horizonGlow?.setAlpha?.(0.48 + preset.intensity * 0.22);
  }

  /* ----------------------------------------------------------
     ATMOSPHERE
     ---------------------------------------------------------- */

  scene.__neonAtmosphere?.setAlpha?.(clamp(0.35 + preset.fog, 0, 0.8));

  scene.__neonFog?.setAlpha?.(preset.fog);

  /* ----------------------------------------------------------
     RAIN
     ---------------------------------------------------------- */

  scene.__neonWeather?.setAlpha?.(preset.rain);

  /* ----------------------------------------------------------
     WORLD LIGHT
     ---------------------------------------------------------- */

  scene.__neonWorldLighting?.setAlpha?.(clamp(0.025 * preset.intensity, 0, 0.08));

  /* ----------------------------------------------------------
     WORLD LAYERS
     ---------------------------------------------------------- */

  setWorldLayerAlpha(scene, clamp(0.72 + preset.city * 0.22, 0.65, 1.25));

  return true;
}

/* ============================================================
   PUBLIC NEON TIME API
   ============================================================ */

function exposeNeonTimeAPI() {
  window.relayNeonTime = Object.freeze({
    set(mode) {
      const scene = window.__relayRunnerScene;

      if (!scene) {
        return false;
      }

      return applyNeonTime(scene, mode);
    },

    current() {
      const scene = window.__relayRunnerScene;

      return scene?.__neonTimeMode || 'NEON_RAIN';
    },

    presets: Object.freeze(Object.keys(NEON_TIME_PRESETS)),
  });
}

exposeNeonTimeAPI();

/* ============================================================
   FUTURISTIC ROUTE GENERATOR
   ============================================================ */

function futuristicRoute(scene) {
  const mission = scene.mission;

  if (!mission) {
    return;
  }

  const start = safeNumber(mission.spawn?.x, 120);

  const requestedGoal = safeNumber(mission.goal?.x, start + 6000);

  const end = Math.max(start + 2400, requestedGoal);

  const span = end - start;

  const skin = getSkin(mission);

  const basePlatforms = [];
  const obstacles = [];
  const boosts = [];
  const checkpoints = [];
  const signals = [];
  const guides = [];
  const movingGates = [];

  /* ----------------------------------------------------------
     LOW LINE
     ---------------------------------------------------------- */

  for (let i = 0; i < 9; i++) {
    const x = start + i * (span / 9);

    const gap = i === 0 ? 0 : 72 + (i % 3) * 24;

    const width = Math.max(300, span / 9 - gap);

    const y = 610 - (i % 4 === 1 ? 28 : i % 4 === 2 ? 58 : 0);

    basePlatforms.push([x, y, width, 110]);

    if (i > 0) {
      boosts.push([x + 42, y - 22]);
    }

    if (i > 1 && i < 8) {
      obstacles.push([x + width * 0.52, y - 32]);
    }
  }

  /* ----------------------------------------------------------
     ROOFTOPS
     ---------------------------------------------------------- */

  for (let i = 0; i < 10; i++) {
    const x = start + 230 + i * (span / 10);

    const y = 450 - (i % 3) * 42;

    basePlatforms.push([x, y, 170 + (i % 2) * 28, 20, 'roof']);

    signals.push([x + 72, y - 28]);
  }

  /* ----------------------------------------------------------
     CHECKPOINTS
     ---------------------------------------------------------- */

  [0.24, 0.52, 0.78].forEach((ratio, index) => {
    const x = start + span * ratio;

    checkpoints.push([x, 535 - (index % 2) * 40]);

    signals.push([x + 70, 520 - (index % 2) * 36]);

    if (index > 0) {
      movingGates.push([x + 125, 420, 370, 560]);
    }
  });

  /* ----------------------------------------------------------
     SIGNALS
     ---------------------------------------------------------- */

  for (let i = 0; i < 10; i++) {
    const x = start + 260 + i * ((span - 520) / 9);

    const y = 548 - (i % 4 === 1 ? 62 : i % 4 === 2 ? 20 : 0);

    signals.push([x, y]);
  }

  /* ----------------------------------------------------------
     GUIDES
     ---------------------------------------------------------- */

  guides.push(
    {
      x: start + 120,
      y: 525,
      text: 'NEON GATE // FOLLOW THE TRACE',
    },
    {
      x: start + span * 0.3,
      y: 410,
      text: 'VERTICAL ROUTE // TAKE THE HIGH LINE',
    },
    {
      x: start + span * 0.58,
      y: 490,
      text: 'CHECKPOINT // MOMENTUM IS YOUR SHIELD',
    },
    {
      x: start + span * 0.84,
      y: 410,
      text: `${skin.zone} // FINAL APPROACH`,
    },
  );

  /* ----------------------------------------------------------
     APPLY
     ---------------------------------------------------------- */

  mission.platforms = basePlatforms;
  mission.obstacles = obstacles;
  mission.boostPads = boosts;
  mission.checkpoints = checkpoints;
  mission.signals = signals.slice(0, 24);
  mission.guides = guides;
  mission.movingGates = movingGates;

  mission.safeZones = checkpoints.map(([x, y]) => [Math.max(start, x - 100), y + 30, 200]);

  /* ----------------------------------------------------------
     ENEMIES
     ---------------------------------------------------------- */

  const enemyTypes = ['enemy-runner', 'security', 'alien-ground', 'invader', 'dino'];

  mission.enemies = enemyTypes.slice(0, 4).map((type, index) => {
    const x = start + span * (0.18 + index * 0.18);

    return {
      type,
      x,
      y: 510 - (index % 2) * 85,
      min: x - 120,
      max: x + 120,
    };
  });

  mission.goal.x = end;
  mission.goal.y = 535;

  mission.__futuristicWorld = true;
}

/* ============================================================
   NEON SKY
   ============================================================ */

function createNeonSkySystem(scene, width, skin) {
  const skyObjects = {};

  /* ----------------------------------------------------------
     MOON HALO
     ---------------------------------------------------------- */

  const moonGlow = scene.add
    .circle(width * 0.78, 145, 96, skin.secondary, 0.055)
    .setScrollFactor(0)
    .setDepth(-18);

  const moonGlow2 = scene.add
    .circle(width * 0.78, 145, 58, skin.accent, 0.04)
    .setScrollFactor(0)
    .setDepth(-18);

  /* ----------------------------------------------------------
     MOON
     ---------------------------------------------------------- */

  const moon = scene.add
    .circle(width * 0.78, 145, 34, 0xdffcff, 0.9)
    .setScrollFactor(0)
    .setDepth(-17);

  moon.setStrokeStyle(2, skin.accent, 0.35);

  /* ----------------------------------------------------------
     HORIZON
     ---------------------------------------------------------- */

  const horizonGlow = scene.add.graphics().setScrollFactor(0).setDepth(-18);

  horizonGlow
    .fillGradientStyle(skin.secondary, skin.secondary, skin.accent, skin.accent, 0, 0.16, 0.2, 0)
    .fillRect(0, 300, width, 310);

  /* ----------------------------------------------------------
     STAR FIELD
     ---------------------------------------------------------- */

  const stars = scene.add.graphics().setScrollFactor(0.03).setDepth(-19);

  for (let i = 0; i < 240; i++) {
    const x = (i * 173) % width;

    const y = 28 + ((i * 97) % 340);

    const radius = i % 21 === 0 ? 2.4 : i % 7 === 0 ? 1.5 : 0.65;

    const color = i % 9 === 0 ? skin.secondary : i % 5 === 0 ? skin.tertiary : skin.accent;

    stars.fillStyle(color, 0.08 + (i % 7) * 0.022).fillCircle(x, y, radius);
  }

  /* ----------------------------------------------------------
     SKY BANDS
     ---------------------------------------------------------- */

  const bands = scene.add.graphics().setScrollFactor(0.02).setDepth(-16);

  for (let i = 0; i < 8; i++) {
    const y = 80 + i * 52;

    bands
      .lineStyle(
        i % 2 === 0 ? 2 : 1,
        i % 2 === 0 ? skin.secondary : skin.accent,
        i % 2 === 0 ? 0.055 : 0.035,
      )
      .lineBetween(-500, y, width + 700, y);
  }

  skyObjects.moon = moon;
  skyObjects.moonGlow = moonGlow;
  skyObjects.moonGlow2 = moonGlow2;
  skyObjects.horizonGlow = horizonGlow;
  skyObjects.stars = stars;
  skyObjects.bands = bands;

  scene.__neonSky = skyObjects;

  if (!scene.motionReduced) {
    scene.tweens?.add?.({
      targets: moonGlow,
      alpha: {
        from: 0.025,
        to: 0.1,
      },
      scale: {
        from: 0.94,
        to: 1.12,
      },
      duration: 2800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    scene.tweens?.add?.({
      targets: moonGlow2,
      alpha: {
        from: 0.025,
        to: 0.09,
      },
      scale: {
        from: 0.94,
        to: 1.08,
      },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    scene.tweens?.add?.({
      targets: bands,
      x: {
        from: -70,
        to: 70,
      },
      duration: 10000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    scene.tweens?.add?.({
      targets: stars,
      alpha: {
        from: 0.68,
        to: 1,
      },
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  return skyObjects;
}

/* ============================================================
   ATMOSPHERIC STREAKS
   ============================================================ */

function createAtmosphericStreaks(scene, width, skin) {
  const streaks = scene.add.graphics().setScrollFactor(0.06).setDepth(-18);

  for (let i = 0; i < 22; i++) {
    const x = (i * 287) % width;

    const y = 90 + ((i * 83) % 330);

    const length = 70 + ((i * 31) % 210);

    streaks
      .lineStyle(
        i % 4 === 0 ? 2 : 1,
        i % 3 === 0 ? skin.secondary : skin.accent,
        0.025 + (i % 3) * 0.012,
      )
      .lineBetween(x, y, x + length, y);
  }

  scene.__neonAtmosphere = streaks;

  return streaks;
}

/* ============================================================
   NEON WEATHER
   ============================================================ */

function createNeonWeather(scene, width, skin) {
  const rain = scene.add.graphics().setScrollFactor(0).setDepth(-4);

  scene.__neonRainConfig = {
    width,
    height: 720,
    skin,
    seed: 0,
  };

  scene.__neonWeather = rain;

  return rain;
}

/* ============================================================
   RAIN UPDATE
   ============================================================ */

function updateNeonRain(scene, time) {
  const rain = scene.__neonWeather;
  const config = scene.__neonRainConfig;
  const preset = scene.__neonTimePreset;

  if (!rain || !config || !preset) {
    return;
  }

  const amount = clamp(preset.rain, 0, 1);

  if (amount <= 0.01) {
    rain.clear();

    return;
  }

  const width = scene.scale?.width || config.width;

  const height = scene.scale?.height || 720;

  const wind = scene.__neonTimeMode === 'STORM' ? -12 : -5;

  rain.clear();

  const count = Math.floor(lerp(35, 180, amount));

  for (let i = 0; i < count; i++) {
    const seed = i * 137.13;

    const x = (seed + time * (0.08 + (i % 5) * 0.01)) % (width + 80);

    const y = (seed * 2.17 + time * (0.28 + (i % 4) * 0.025)) % (height + 120);

    const length = 9 + (i % 7) * 4;

    const alpha = 0.12 + (i % 5) * 0.025;

    rain
      .lineStyle(
        i % 11 === 0 ? 2 : 1,
        i % 6 === 0 ? config.skin.secondary : config.skin.accent,
        alpha * amount,
      )
      .lineBetween(x, y, x + wind, y + length);
  }
}

/* ============================================================
   FOG
   ============================================================ */

function createNeonFog(scene, width, skin) {
  const fog = scene.add.graphics().setScrollFactor(0.03).setDepth(-3);

  for (let i = 0; i < 7; i++) {
    const y = 320 + i * 48;

    fog
      .fillStyle(i % 2 === 0 ? skin.secondary : skin.accent, 0.018)
      .fillRect(-200, y, width + 400, 42);
  }

  scene.__neonFog = fog;

  return fog;
}

/* ============================================================
   STORM LIGHTNING
   ============================================================ */

function createStormLightning(scene) {
  const flash = scene.add
    .rectangle(640, 360, 1600, 900, 0xdffcff, 0)
    .setScrollFactor(0)
    .setDepth(-0.5);

  scene.__neonLightning = flash;

  scene.__neonNextLightning = 2500 + Math.random() * 4500;

  return flash;
}

function updateStormLightning(scene, time) {
  const flash = scene.__neonLightning;

  if (!flash) {
    return;
  }

  if (scene.__neonTimeMode !== 'STORM') {
    flash.setAlpha(0);

    return;
  }

  if (time < safeNumber(scene.__neonNextLightning, 0)) {
    return;
  }

  const intensity = 0.07 + Math.random() * 0.13;

  flash.setAlpha(intensity);

  scene.tweens?.add?.({
    targets: flash,
    alpha: 0,
    duration: 160,
    ease: 'Quad.easeOut',
  });

  scene.__neonNextLightning = time + 2800 + Math.random() * 6000;
}

/* ============================================================
   FAR CITY
   ============================================================ */

function createFarCity(scene, width, skin) {
  const far = scene.add.graphics().setScrollFactor(0.12).setDepth(-15);

  for (let x = -180, i = 0; x < width + 320; x += 135, i++) {
    const h = 120 + ((i * 53) % 220);

    const w = 82 + ((i * 29) % 62);

    const top = 585 - h;

    far.fillStyle(skin.building, 0.92).fillRect(x, top, w, h);

    far.lineStyle(1, skin.accent, 0.13).strokeRect(x, top, w, h);

    for (let y = top + 24; y < 560; y += 25) {
      const light = i % 4 === 0 ? skin.secondary : skin.accent;

      far.fillStyle(light, 0.1 + (i % 3) * 0.025).fillRect(x + 12, y, 8, 3);

      if (w > 110) {
        far.fillRect(x + 34, y, 8, 3);

        far.fillRect(x + 56, y, 8, 3);
      }
    }
  }

  scene.__neonWorldLayers ||= {};
  scene.__neonWorldLayers.farCity = far;
  far.__neonBaseAlpha = 1;

  return far;
}

/* ============================================================
   MEGA TOWERS
   ============================================================ */

function createMegaTowers(scene, width, skin) {
  const towers = scene.add.graphics().setScrollFactor(0.25).setDepth(-12);

  const towerPositions = [420, 1050, 1780, 2500, 3350, 4200, 5050, 5900];

  towerPositions.forEach((x, index) => {
    if (x > width + 500) {
      return;
    }

    const h = 300 + (index % 4) * 80;

    const w = 150 + (index % 3) * 35;

    const top = 610 - h;

    towers.fillStyle(skin.building2, 0.96).fillRoundedRect(x, top, w, h, 10);

    towers.lineStyle(2, skin.accent, 0.22).strokeRoundedRect(x, top, w, h, 10);

    towers.lineStyle(1, skin.secondary, 0.2).lineBetween(x + w * 0.5, top, x + w * 0.5, 610);

    towers.lineStyle(2, skin.accent, 0.16).lineBetween(x + 15, top + 15, x + 15, 595);

    towers.lineBetween(x + w - 15, top + 15, x + w - 15, 595);

    for (let y = top + 32; y < 575; y += 30) {
      const alpha = 0.08 + (index % 3) * 0.025;

      towers.fillStyle(skin.accent, alpha).fillRect(x + 28, y, 22, 5);

      towers.fillStyle(skin.secondary, alpha).fillRect(x + w - 50, y, 22, 5);
    }

    towers.lineStyle(2, skin.secondary, 0.22).lineBetween(x + 28, top, x + w - 28, top);

    if (index % 2 === 0) {
      towers.lineStyle(1, skin.accent, 0.3).lineBetween(x + w * 0.5, top, x + w * 0.5, top - 70);

      towers.fillStyle(skin.accent, 0.65).fillCircle(x + w * 0.5, top - 72, 2);
    }
  });

  scene.__neonWorldLayers ||= {};
  scene.__neonWorldLayers.towers = towers;
  towers.__neonBaseAlpha = 1;

  return towers;
}

/* ============================================================
   SKY RAILS
   ============================================================ */

function createSkyRails(scene, width, skin) {
  const rails = scene.add.graphics().setScrollFactor(0.2).setDepth(-11);

  [185, 275, 350].forEach((y, index) => {
    const color = index === 1 ? skin.secondary : skin.accent;

    rails
      .lineStyle(index === 1 ? 2 : 1, color, index === 1 ? 0.24 : 0.12)
      .lineBetween(-200, y, width + 300, y);

    rails.lineStyle(1, color, 0.07).lineBetween(-200, y + 8, width + 300, y + 8);

    for (let x = 120; x < width; x += 220) {
      rails.lineStyle(1, color, 0.1).lineBetween(x, y, x + 35, y + 35);
    }
  });

  scene.__neonWorldLayers ||= {};
  scene.__neonWorldLayers.rails = rails;
  rails.__neonBaseAlpha = 1;

  return rails;
}

/* ============================================================
   SKY BRIDGES
   ============================================================ */

function createSkyBridges(scene, width, skin) {
  const bridges = scene.add.graphics().setScrollFactor(0.32).setDepth(-9);

  const bridgeData = [
    [640, 330, 420],
    [1800, 295, 520],
    [3180, 345, 360],
    [4550, 285, 470],
  ];

  bridgeData.forEach(([x, y, w], index) => {
    if (x > width + 400) {
      return;
    }

    bridges.fillStyle(skin.building2, 0.9).fillRect(x, y, w, 22);

    bridges.lineStyle(2, skin.accent, 0.22).lineBetween(x, y, x + w, y);

    bridges.lineStyle(2, skin.secondary, 0.15).lineBetween(x, y + 22, x + w, y + 22);

    const supportA = x + 40;
    const supportB = x + w - 40;

    bridges.lineStyle(2, skin.accent, 0.15).lineBetween(supportA, y + 22, supportA, y + 130);

    bridges.lineBetween(supportB, y + 22, supportB, y + 130);

    for (let px = x + 24; px < x + w - 20; px += 46) {
      bridges
        .fillStyle(index % 2 === 0 ? skin.accent : skin.secondary, 0.14)
        .fillRect(px, y + 7, 22, 3);
    }
  });

  scene.__neonWorldLayers ||= {};
  scene.__neonWorldLayers.bridges = bridges;
  bridges.__neonBaseAlpha = 1;

  return bridges;
}

/* ============================================================
   HOLOGRAPHIC SIGNS
   ============================================================ */

function createHolographicSigns(scene, width, skin) {
  const signs = scene.add.graphics().setScrollFactor(0.38).setDepth(-7);

  const labels = [
    'RELAY NETWORK',
    'SECTOR 07',
    'NEON DISTRICT',
    'HELIX GRID',
    'SIGNAL NODE',
    'TRANSIT CORE',
    'GHOSTLINE',
    'APEX ARRAY',
  ];

  for (let i = 0; i < labels.length; i++) {
    const x = 500 + i * 920;

    if (x > width + 300) {
      break;
    }

    const y = 230 + (i % 3) * 72;

    const color = i % 2 === 0 ? skin.accent : skin.secondary;

    signs.lineStyle(1, color, 0.18).strokeRect(x, y, 170, 38);

    signs.lineStyle(1, color, 0.08).lineBetween(x + 10, y + 19, x + 160, y + 19);

    signs.fillStyle(color, 0.26).fillRect(x + 10, y + 10, 4, 18);

    signs.fillStyle(color, 0.13).fillRect(x + 22, y + 12, 72, 3);

    signs.fillRect(x + 22, y + 21, 112, 3);

    signs.fillStyle(skin.tertiary, 0.18).fillRect(x + 142, y + 10, 14, 4);
  }

  scene.__neonWorldLayers ||= {};
  scene.__neonWorldLayers.signs = signs;
  signs.__neonBaseAlpha = 1;

  return signs;
}

/* ============================================================
   ORBITAL STRUCTURE
   ============================================================ */

function createOrbitalStructure(scene, width, skin) {
  const rings = scene.add.graphics().setScrollFactor(0.035).setDepth(-13);

  const ringBase = Math.max(780, Math.min(width * 0.68, 1180));

  rings.lineStyle(3, skin.accent, 0.12).strokeCircle(ringBase, 250, 150);

  rings.lineStyle(2, skin.secondary, 0.1).strokeCircle(ringBase, 250, 205);

  rings.lineStyle(1, skin.tertiary, 0.12).strokeCircle(ringBase, 250, 270);

  rings.fillStyle(skin.accent, 0.035).fillCircle(ringBase, 250, 130);

  rings.lineStyle(1, skin.accent, 0.06).lineBetween(ringBase - 300, 250, ringBase + 300, 250);

  rings.lineBetween(ringBase, -30, ringBase, 530);

  if (!scene.motionReduced) {
    scene.tweens?.add?.({
      targets: rings,
      angle: {
        from: -2,
        to: 2,
      },
      duration: 14000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  scene.__neonWorldLayers ||= {};
  scene.__neonWorldLayers.orbit = rings;
  rings.__neonBaseAlpha = 1;

  return rings;
}

/* ============================================================
   GROUND GRID
   ============================================================ */

function createGroundGrid(scene, width, skin) {
  const grid = scene.add.graphics().setScrollFactor(0.82).setDepth(-2);

  grid.fillStyle(0x030912, 0.98).fillRect(0, 610, width, 250);

  grid.lineStyle(3, skin.accent, 0.2).lineBetween(0, 610, width, 610);

  grid.lineStyle(1, skin.secondary, 0.1).lineBetween(0, 618, width, 618);

  for (let x = -100; x < width + 200; x += 80) {
    grid.lineStyle(1, skin.accent, 0.075).lineBetween(x, 610, x + 180, 860);
  }

  for (let y = 650; y < 860; y += 42) {
    grid.lineStyle(1, skin.accent, 0.07).lineBetween(0, y, width, y);
  }

  [675, 770].forEach((y) => {
    grid.lineStyle(2, skin.secondary, 0.1).lineBetween(0, y, width, y);
  });

  for (let x = 240; x < width; x += 620) {
    grid.fillStyle(skin.warning, 0.1).fillRect(x, 624, 90, 4);
  }

  scene.__neonWorldLayers ||= {};
  scene.__neonWorldLayers.ground = grid;
  grid.__neonBaseAlpha = 1;

  return grid;
}

/* ============================================================
   PLATFORM ARCHITECTURE
   ============================================================ */

function createPlatformArchitecture(scene, mission, skin) {
  const platforms = Array.isArray(mission.platforms) ? mission.platforms : [];

  const architecture = scene.add.graphics().setScrollFactor(1).setDepth(-1);

  platforms.forEach((platform, index) => {
    const x = Number(platform?.[0]);
    const y = Number(platform?.[1]);
    const width = Number(platform?.[2]);
    const height = Number(platform?.[3]);

    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height)
    ) {
      return;
    }

    const isRoof = platform?.[4] === 'roof';

    const edgeColor = isRoof ? skin.secondary : skin.accent;

    architecture.fillStyle(isRoof ? 0x0a1420 : 0x07111c, 0.94).fillRect(x, y, width, height);

    architecture.lineStyle(2, edgeColor, isRoof ? 0.48 : 0.34).lineBetween(x, y, x + width, y);

    architecture
      .lineStyle(1, skin.secondary, 0.12)
      .lineBetween(x, y + height, x + width, y + height);

    const segmentWidth = Math.max(28, Math.min(80, width / 5));

    for (let sx = x + 18; sx < x + width - 18; sx += segmentWidth + 22) {
      architecture
        .fillStyle(index % 3 === 0 ? skin.accent : skin.secondary, 0.13)
        .fillRect(sx, y + height - 8, segmentWidth, 3);
    }

    if (!isRoof && index % 2 === 0) {
      architecture
        .lineStyle(1, skin.accent, 0.1)
        .lineBetween(x + 32, y + height, x + 52, y + height + 55);

      architecture.lineBetween(x + width - 32, y + height, x + width - 52, y + height + 55);
    }

    if (isRoof) {
      architecture
        .lineStyle(1, skin.secondary, 0.25)
        .lineBetween(x + width * 0.5, y, x + width * 0.5, y - 22);

      architecture.fillStyle(skin.secondary, 0.42).fillRect(x + width * 0.5 - 8, y - 25, 16, 3);
    }
  });

  scene.__neonWorldLayers ||= {};
  scene.__neonWorldLayers.platforms = architecture;

  architecture.__neonBaseAlpha = 1;

  return architecture;
}

/* ============================================================
   CHECKPOINT BEACONS
   ============================================================ */

function createCheckpointBeacons(scene, mission, skin) {
  const checkpoints = Array.isArray(mission.checkpoints) ? mission.checkpoints : [];

  const objects = [];

  checkpoints.forEach((point, index) => {
    const x = Number(point?.[0]);
    const y = Number(point?.[1]);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }

    const beam = scene.add.rectangle(x, 535, 4, 150, skin.accent, 0.07).setDepth(-1);

    const core = scene.add.circle(x, y - 8, 11, skin.accent, 0.2).setDepth(-1);

    core.setStrokeStyle(2, skin.accent, 0.7);

    const halo = scene.add.circle(x, y - 8, 22, skin.secondary, 0).setDepth(-1);

    halo.setStrokeStyle(1, skin.secondary, 0.2);

    const rail = scene.add.rectangle(x - 17, 450, 1, 165, skin.secondary, 0.08).setDepth(-1);

    const rail2 = scene.add.rectangle(x + 17, 450, 1, 165, skin.secondary, 0.08).setDepth(-1);

    objects.push({
      beam,
      core,
      halo,
      rail,
      rail2,
    });

    if (!scene.motionReduced) {
      scene.tweens?.add?.({
        targets: core,
        scale: {
          from: 0.9,
          to: 1.35,
        },
        alpha: {
          from: 0.1,
          to: 0.34,
        },
        duration: 900 + index * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      scene.tweens?.add?.({
        targets: halo,
        scale: {
          from: 0.85,
          to: 1.18,
        },
        alpha: {
          from: 0.06,
          to: 0.2,
        },
        duration: 1300 + index * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      scene.tweens?.add?.({
        targets: beam,
        alpha: {
          from: 0.025,
          to: 0.11,
        },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  });

  scene.__neonCheckpointObjects = objects;

  return objects;
}

/* ============================================================
   START GATE
   ============================================================ */

function createStartGate(scene, mission, skin) {
  const x = safeNumber(mission.spawn?.x, 120);

  const y = safeNumber(mission.spawn?.y, 535);

  const gate = scene.add.graphics().setDepth(-1);

  const leftX = x - 38;
  const rightX = x + 38;

  gate.fillStyle(0x07111c, 0.94).fillRect(leftX, y - 125, 9, 125);

  gate.fillRect(rightX - 9, y - 125, 9, 125);

  gate.lineStyle(2, skin.accent, 0.34).lineBetween(leftX, y - 125, leftX, y);

  gate.lineBetween(rightX, y - 125, rightX, y);

  gate.lineStyle(3, skin.secondary, 0.35).lineBetween(leftX, y - 125, rightX, y - 125);

  gate.lineStyle(2, skin.accent, 0.18).lineBetween(x, y - 118, x, y - 8);

  gate.lineStyle(1, skin.secondary, 0.16).lineBetween(x - 20, y - 108, x + 20, y - 108);

  gate.lineStyle(2, skin.accent, 0.26).strokeEllipse(x, y + 2, 110, 28);

  gate.lineStyle(1, skin.secondary, 0.15).strokeEllipse(x, y + 2, 76, 18);

  if (!scene.motionReduced) {
    scene.tweens?.add?.({
      targets: gate,
      alpha: {
        from: 0.72,
        to: 1,
      },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  return gate;
}

/* ============================================================
   GOAL RELAY
   ============================================================ */

function createGoalRelay(scene, mission, skin) {
  const x = safeNumber(mission.goal?.x, 6000);

  const y = safeNumber(mission.goal?.y, 535);

  const relay = scene.add.graphics().setDepth(-1);

  relay.lineStyle(3, skin.accent, 0.24).strokeEllipse(x + 30, y + 16, 190, 48);

  relay.lineStyle(1, skin.secondary, 0.22).strokeEllipse(x + 30, y + 16, 140, 34);

  relay.fillStyle(0x090e18, 0.97).fillRect(x - 12, y - 175, 14, 190);

  relay.fillRect(x + 92, y - 175, 14, 190);

  relay.lineStyle(2, skin.accent, 0.38).lineBetween(x - 12, y - 175, x - 12, y + 15);

  relay.lineBetween(x + 106, y - 175, x + 106, y + 15);

  relay.lineStyle(3, skin.secondary, 0.4).lineBetween(x - 12, y - 175, x + 106, y - 175);

  relay.fillStyle(skin.accent, 0.12).fillCircle(x + 47, y - 82, 42);

  relay.lineStyle(3, skin.accent, 0.72).strokeCircle(x + 47, y - 82, 34);

  relay.lineStyle(1, skin.secondary, 0.52).strokeCircle(x + 47, y - 82, 52);

  relay.fillStyle(0xdffcff, 0.92).fillCircle(x + 47, y - 82, 8);

  relay.lineStyle(2, skin.accent, 0.16).lineBetween(x + 47, y - 52, x + 47, y - 8);

  if (!scene.motionReduced) {
    scene.tweens?.add?.({
      targets: relay,
      alpha: {
        from: 0.72,
        to: 1,
      },
      duration: 950,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  return relay;
}

/* ============================================================
   WORLD BADGE
   ============================================================ */

function createWorldBadge(scene, skin) {
  return scene.add
    .text(34, 34, `${skin.zone} // FUTURE GRID`, {
      fontFamily: 'Orbitron, monospace',

      fontSize: '9px',

      fontStyle: 'bold',

      color: '#8df4ff',

      letterSpacing: 1.5,

      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#55e9ff',
        blur: 5,
        fill: true,
      },
    })
    .setScrollFactor(0)
    .setDepth(10)
    .setAlpha(0.78);
}

/* ============================================================
   WORLD PULSE
   ============================================================ */

function updateNeonPulse(scene, time) {
  const preset = scene.__neonTimePreset;

  if (!preset) {
    return;
  }

  const pulse = 1 + Math.sin(time * 0.0022) * 0.035 * preset.pulse;

  const layers = scene.__neonWorldLayers;

  if (!layers) {
    return;
  }

  [layers.towers, layers.rails, layers.bridges, layers.signs, layers.orbit].forEach((layer) => {
    if (!layer) {
      return;
    }

    const base = safeNumber(layer.__neonBaseAlpha, 1);

    layer.setAlpha(clamp(base * pulse, 0, 1));
  });
}

/* ============================================================
   FUTURISTIC ENVIRONMENT
   ============================================================ */

function createFuturisticEnvironment() {
  const mission = this.mission || {};

  const skin = getSkin(mission);

  const width = safeNumber(this.worldWidth, 6000) + 900;

  const height = 860;

  this.__neonWorldLayers = {};

  /* ----------------------------------------------------------
     BASE SKY
     ---------------------------------------------------------- */

  const sky = this.add.graphics().setScrollFactor(0).setDepth(-20);

  sky.fillStyle(skin.sky, 1).fillRect(0, 0, width, height);

  sky.__neonBaseAlpha = 1;

  this.__neonWorldLayers.sky = sky;

  /* ----------------------------------------------------------
     HORIZON
     ---------------------------------------------------------- */

  const horizon = this.add.graphics().setScrollFactor(0.08).setDepth(-19);

  horizon
    .fillGradientStyle(skin.sky, skin.horizon, skin.secondary, 0x02040a, 1, 0.72, 0.16, 1)
    .fillRect(0, 0, width, height);

  horizon.__neonBaseAlpha = 1;

  this.__neonWorldLayers.horizon = horizon;

  /* ----------------------------------------------------------
     SKY
     ---------------------------------------------------------- */

  createNeonSkySystem(this, width, skin);

  /* ----------------------------------------------------------
     ATMOSPHERE
     ---------------------------------------------------------- */

  createAtmosphericStreaks(this, width, skin);

  createNeonFog(this, width, skin);

  createNeonWeather(this, width, skin);

  createStormLightning(this);

  /* ----------------------------------------------------------
     WORLD LIGHTING
     ---------------------------------------------------------- */

  const worldLighting = this.add
    .rectangle(width * 0.5, 440, width, 420, skin.secondary, 0.035)
    .setScrollFactor(0.04)
    .setDepth(-6);

  this.__neonWorldLighting = worldLighting;

  /* ----------------------------------------------------------
     CITY
     ---------------------------------------------------------- */

  createFarCity(this, width, skin);

  createOrbitalStructure(this, width, skin);

  createMegaTowers(this, width, skin);

  createSkyRails(this, width, skin);

  createSkyBridges(this, width, skin);

  createHolographicSigns(this, width, skin);

  /* ----------------------------------------------------------
     GROUND
     ---------------------------------------------------------- */

  createGroundGrid(this, width, skin);

  /* ----------------------------------------------------------
     GAMEPLAY ARCHITECTURE
     ---------------------------------------------------------- */

  createPlatformArchitecture(this, mission, skin);

  createCheckpointBeacons(this, mission, skin);

  createStartGate(this, mission, skin);

  createGoalRelay(this, mission, skin);

  /* ----------------------------------------------------------
     BADGE
     ---------------------------------------------------------- */

  this.futuristicWorldBadge = createWorldBadge(this, skin);

  /* ----------------------------------------------------------
     DEFAULT
     ---------------------------------------------------------- */

  applyNeonTime(this, 'NEON_RAIN');
}

/* ============================================================
   FUTURISTIC WORLD PATCH
   ============================================================ */

export function installFuturisticWorldPatch() {
  if (RunnerScene.prototype.__futuristicNeonWorldPatched) {
    return;
  }

  const originalCreate = RunnerScene.prototype.create;

  const originalUpdate = RunnerScene.prototype.update;

  const originalShutdown = RunnerScene.prototype.shutdown;

  /* ==========================================================
     ENVIRONMENT
     ========================================================== */

  RunnerScene.prototype.createEnvironment = function futuristicCreateEnvironment() {
    createFuturisticEnvironment.call(this);
  };

  /* ==========================================================
     CREATE
     ========================================================== */

  RunnerScene.prototype.create = function futuristicWorldCreate(...args) {
    futuristicRoute(this);

    const result = originalCreate.apply(this, args);

    try {
      this.game.events.emit('world-style', 'FUTURISTIC_NEON_WORLD');
    } catch {}

    return result;
  };

  /* ==========================================================
     UPDATE
     ========================================================== */

  RunnerScene.prototype.update = function futuristicWorldUpdate(...args) {
    const result = originalUpdate.apply(this, args);

    const time = safeNumber(args?.[0], performance.now());

    /* ------------------------------------------------------
         BADGE
         ------------------------------------------------------ */

    if (this.futuristicWorldBadge) {
      const skin = getSkin(this.mission);

      this.futuristicWorldBadge.setText(`${skin.zone} // FUTURE GRID`);

      this.futuristicWorldBadge.setAlpha(0.7 + Math.sin(time * 0.002) * 0.08);
    }

    /* ------------------------------------------------------
         RAIN
         ------------------------------------------------------ */

    updateNeonRain(this, time);

    /* ------------------------------------------------------
         LIGHTNING
         ------------------------------------------------------ */

    updateStormLightning(this, time);

    /* ------------------------------------------------------
         NEON PULSE
         ------------------------------------------------------ */

    updateNeonPulse(this, time);

    /* ------------------------------------------------------
         SAFETY
         ------------------------------------------------------ */

    if (!this.__neonTimeMode) {
      applyNeonTime(this, 'NEON_RAIN');
    }

    return result;
  };

  /* ==========================================================
     SHUTDOWN
     ========================================================== */

  RunnerScene.prototype.shutdown = function futuristicWorldShutdown(...args) {
    this.futuristicWorldBadge?.destroy?.();

    this.__neonWeather?.destroy?.();

    this.__neonFog?.destroy?.();

    this.__neonLightning?.destroy?.();

    this.__neonWorldLighting?.destroy?.();

    this.futuristicWorldBadge = null;

    this.__neonSky = null;

    this.__neonWeather = null;

    this.__neonFog = null;

    this.__neonLightning = null;

    this.__neonRainConfig = null;

    this.__neonWorldLayers = null;

    this.__neonWorldLighting = null;

    this.__neonTimeMode = null;

    this.__neonTimePreset = null;

    return originalShutdown?.apply(this, args);
  };

  /* ==========================================================
     PATCH FLAG
     ========================================================== */

  RunnerScene.prototype.__futuristicNeonWorldPatched = true;
}
