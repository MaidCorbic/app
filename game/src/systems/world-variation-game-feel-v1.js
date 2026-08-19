// UPDATE 10 — WORLD VARIATION + GAME FEEL + PLATFORM CLARITY
// UPDATE 10.1 — LIVING CITY BACKDROP
// Visual/feedback-only layer. It never creates or changes physics bodies, collision rules,
// player movement, mobile controls, viewport policy, mission state, or progression.
// IMPORTANT: platform and barrier visuals below are intentionally preserved.
// This update changes ONLY the background city presentation and its cleanup.

const STYLE = {
  'first-delivery': { edge: 0xffd06e, bright: 0xffe7a6, dark: 0x162338, accent: 0xffa85d },
  'dead-drop': { edge: 0xffbd5b, bright: 0xffd58a, dark: 0x182331, accent: 0x73c7d5 },
  blackout: { edge: 0x8df4ff, bright: 0xdffcff, dark: 0x101d30, accent: 0x35c9ff },
  pursuit: { edge: 0xff826e, bright: 0xffb1a4, dark: 0x172238, accent: 0xffcf82 },
  'signal-storm': { edge: 0xb993ff, bright: 0xe0cfff, dark: 0x1b1934, accent: 0x8df4ff },
  'corporate-lockdown': { edge: 0xff826e, bright: 0xffcf82, dark: 0x1b2130, accent: 0x8df4ff },
  'final-relay': { edge: 0xffd06e, bright: 0xfff0bd, dark: 0x1c1b31, accent: 0x8df4ff },
};

const FALLBACK_STYLE = { edge: 0x8df4ff, bright: 0xdffcff, dark: 0x142235, accent: 0xaee37f };
const stateByScene = new WeakMap();

const getStyle = scene => STYLE[scene?.mission?.id] || FALLBACK_STYLE;
const reduced = scene => Boolean(scene?.motionReduced || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

function addPlatformVisual(scene, platform, index, style) {
  if (!platform?.active || !scene?.add) return null;
  const width = Math.max(24, platform.displayWidth || platform.width || 24);
  const height = Math.max(8, platform.displayHeight || platform.height || 8);
  const left = platform.x - width / 2;
  const top = platform.y - height / 2;
  const type = platform.getData?.('relayPlatformType') || (index % 3 === 0 ? 'roof' : 'street');
  const g = scene.add.graphics().setDepth(4);

  // PRESERVED — existing platform readability layer.
  g.fillStyle(style.dark, .82).fillRect(left, top + 5, width, Math.max(4, height - 5));
  g.fillStyle(style.edge, .92).fillRect(left, top, width, 4);
  g.fillStyle(style.bright, .42).fillRect(left + 5, top + 4, Math.max(8, width - 10), 2);
  g.fillStyle(style.edge, .62).fillRect(left, top + height - 4, width, 4);

  const step = Math.max(30, Math.min(54, width / 6));
  for (let x = left + 10; x < left + width - 8; x += step) {
    g.fillStyle(style.accent, type === 'roof' ? .24 : .13).fillRect(x, top + 9, Math.min(18, step - 8), 3);
  }

  g.fillStyle(style.bright, .72).fillRect(left + 7, top - 2, 8, 2).fillRect(left + width - 15, top - 2, 8, 2);
  return g;
}

function addBarrierVisual(scene, barrier, index, style) {
  if (!barrier?.active || !scene?.add) return null;
  const w = Math.max(40, barrier.displayWidth || 48);
  const h = Math.max(52, barrier.displayHeight || 64);
  const x = barrier.x;
  const y = barrier.y;
  const g = scene.add.graphics().setDepth(7);

  // PRESERVED — existing obstacle/vault readability layer.
  g.fillStyle(0x030914, .38).fillEllipse(x, y + h * .48, w * 1.15, 8);
  g.fillStyle(style.dark, .94).fillRoundedRect(x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6, 7);
  g.lineStyle(2, style.edge, .95).strokeRoundedRect(x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6, 7);
  g.fillStyle(style.edge, .95).fillRect(x - w / 2, y - h / 2 - 5, w, 5);
  g.fillStyle(style.bright, .34).fillRect(x - w / 2 + 5, y - h / 2 + 5, w - 10, 3);

  g.lineStyle(2, style.bright, .8);
  g.lineBetween(x - 11, y + 8, x, y - 5);
  g.lineBetween(x, y - 5, x + 11, y + 8);
  g.lineBetween(x - 11, y + 8, x + 11, y + 8);

  barrier.setData?.('relayVisualIndex', index);
  return g;
}

function addDistrictVariation(scene, style) {
  if (!scene?.add || !scene.worldWidth) return null;

  // UPDATE 10.1: replace the flat rectangle skyline with a layered, deterministic
  // cyberpunk city. Each depth is batched into one Graphics object. Nothing here
  // is animated per frame, so the backdrop remains cheap even on mobile.
  const id = scene.mission?.id || '';
  const worldWidth = Math.max(800, scene.worldWidth || 0);
  const base = 610;
  const seedBase = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) + worldWidth;
  const hash = value => {
    let n = (value ^ seedBase) | 0;
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    return (n ^ (n >>> 16)) >>> 0;
  };
  const pick = (value, max) => hash(value) % max;

  const far = scene.add.graphics().setScrollFactor(.16).setDepth(0);
  const mid = scene.add.graphics().setScrollFactor(.30).setDepth(.5);
  const near = scene.add.graphics().setScrollFactor(.46).setDepth(1);
  const haze = scene.add.graphics().setScrollFactor(.34).setDepth(2);

  // ---------- FAR CITY: huge silhouettes, antennas, towers ----------
  for (let x = -360, i = 0; x < worldWidth + 520; x += 132, i += 1) {
    const w = 76 + pick(i * 17 + 3, 92);
    const h = 96 + pick(i * 29 + 11, 150);
    const roof = base - h;
    const tower = pick(i + 7, 7) === 0;

    far.fillStyle(style.dark, .28 + (pick(i + 21, 4) * .025)).fillRect(x, roof, w, h);
    far.fillStyle(style.edge, .035).fillRect(x + 9, roof + 14, Math.max(18, w - 18), 3);

    if (pick(i + 41, 3) !== 0) {
      const cols = Math.max(2, Math.floor(w / 25));
      const rows = Math.max(2, Math.floor(h / 46));
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (pick(i * 100 + row * 13 + col * 7, 5) > 1) continue;
          far.fillStyle(style.bright, .055).fillRect(x + 10 + col * 24, roof + 30 + row * 43, 5, 3);
        }
      }
    }

    if (tower) {
      const cx = x + w * .5;
      far.fillStyle(style.dark, .34).fillRect(cx - 9, roof - 44, 18, 44);
      far.lineStyle(1, style.edge, .16).lineBetween(cx, roof - 44, cx, roof - 88);
      far.fillStyle(style.edge, .22).fillCircle(cx, roof - 92, 2);
    }
  }

  // ---------- MID CITY: recognizable building archetypes ----------
  for (let x = -260, i = 0; x < worldWidth + 420; x += 188, i += 1) {
    const archetype = pick(i * 31 + 5, 6);
    const w = 112 + pick(i * 13 + 8, 88);
    const h = 128 + pick(i * 19 + 2, 172);
    const roof = base - h;
    const left = x;
    const right = x + w;
    const cx = left + w * .5;

    // Main mass with stepped silhouettes instead of plain rectangles.
    mid.fillStyle(style.dark, .48).fillRect(left, roof, w, h);
    if (archetype === 0 || archetype === 4) {
      mid.fillStyle(style.dark, .52).fillRect(left + w * .18, roof - 30, w * .64, 30);
    }
    if (archetype === 1) {
      mid.fillStyle(style.dark, .5).fillRect(left + w * .62, roof + 22, w * .38, h - 22);
      mid.fillStyle(style.edge, .08).fillRect(left + w * .58, roof + 14, 3, h - 28);
    }
    if (archetype === 2) {
      mid.fillStyle(style.dark, .52).fillRect(left - 16, roof + 42, 16, h - 42);
      mid.fillStyle(style.dark, .52).fillRect(right, roof + 20, 14, h - 20);
    }

    // Facade spine and horizontal service bands.
    mid.fillStyle(style.accent, .065).fillRect(left + 9, roof + 12, w - 18, 5);
    mid.lineStyle(1, style.edge, .10).lineBetween(cx, roof + 8, cx, base);
    if (archetype !== 3) {
      for (let band = roof + 48; band < base - 20; band += 58) {
        mid.lineStyle(1, style.bright, .045).lineBetween(left + 12, band, right - 12, band);
      }
    }

    // Window matrix: intentionally sparse and deterministic, never animated.
    const cols = Math.max(2, Math.floor((w - 30) / 28));
    const rows = Math.max(2, Math.floor((h - 50) / 43));
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const active = pick(i * 1000 + row * 41 + col * 17, 10);
        if (active > (id === 'blackout' ? 1 : 4)) continue;
        const wx = left + 16 + col * ((w - 32) / Math.max(1, cols - 1));
        const wy = roof + 34 + row * 43;
        const windowColor = (id === 'signal-storm' || id === 'blackout') ? style.bright : style.accent;
        mid.fillStyle(windowColor, id === 'blackout' ? .10 : .15).fillRect(wx, wy, 8, 5);
      }
    }

    // Rooftop language: vents, tanks, dishes, rails and relay masts.
    mid.fillStyle(style.edge, .10).fillRect(left + 12, roof - 5, w - 24, 5);
    if (archetype === 0 || archetype === 5) {
      mid.fillStyle(style.bright, .10).fillRect(left + w * .28, roof - 13, w * .44, 8);
      mid.lineStyle(2, style.edge, .16).lineBetween(cx, roof - 5, cx, roof - 48);
      mid.fillStyle(style.edge, .24).fillCircle(cx, roof - 51, 2);
    } else if (archetype === 1) {
      mid.lineStyle(2, style.edge, .15).lineBetween(left + w * .25, roof - 6, left + w * .25, roof - 35);
      mid.lineStyle(1, style.bright, .14).lineBetween(left + w * .18, roof - 35, left + w * .38, roof - 35);
    } else if (archetype === 2) {
      mid.fillStyle(style.accent, .12).fillRect(left + 18, roof - 18, 34, 13);
      mid.fillStyle(style.edge, .16).fillCircle(left + 36, roof - 24, 7);
    } else if (archetype === 4) {
      mid.fillStyle(style.edge, .12).fillRect(left + w * .16, roof - 14, w * .68, 9);
      mid.lineStyle(1, style.bright, .18).lineBetween(left + w * .22, roof - 14, left + w * .22, roof - 42);
      mid.lineStyle(1, style.bright, .18).lineBetween(right - w * .22, roof - 14, right - w * .22, roof - 42);
    }

    // District-specific architecture and signage.
    if (id === 'corporate-lockdown' || id === 'final-relay') {
      mid.fillStyle(style.edge, .075).fillRect(left + 14, roof + 22, w - 28, 52);
      mid.fillStyle(style.bright, .13).fillRect(left + 22, roof + 34, Math.max(26, w - 44), 4);
      mid.lineStyle(1, style.edge, .12).strokeRect(left + 10, roof + 14, w - 20, 70);
    } else if (id === 'dead-drop') {
      mid.fillStyle(style.accent, .10).fillRect(left + w * .18, roof - 17, w * .64, 17);
      mid.lineStyle(1, style.edge, .15).lineBetween(cx, roof - 17, cx, roof - 58);
    } else if (id === 'signal-storm') {
      mid.lineStyle(2, style.edge, .12).lineBetween(left + 12, roof + 8, right - 12, roof - 24);
      mid.fillStyle(style.bright, .09).fillCircle(cx, roof + 9, Math.min(18, w * .10));
    } else if (id === 'blackout') {
      mid.fillStyle(style.edge, .07).fillRect(left + 16, roof + 18, w - 32, 3);
      mid.fillStyle(style.edge, .05).fillRect(left + 24, roof + 58, w - 48, 3);
    } else {
      mid.fillStyle(style.accent, .085).fillRect(left + 15, roof + 30, Math.max(24, w * .28), 9);
      mid.lineStyle(1, style.edge, .11).lineBetween(left + 10, roof + 18, right - 10, roof + 18);
    }
  }

  // ---------- NEAR CITY: hero structures with richer silhouettes ----------
  for (let x = -180, i = 0; x < worldWidth + 360; x += 330, i += 1) {
    const w = 190 + pick(i * 47 + 19, 100);
    const h = 178 + pick(i * 23 + 29, 145);
    const roof = base - h;
    const left = x;
    const right = x + w;
    const cx = left + w * .5;
    const styleIndex = pick(i + id.length * 3, 5);

    near.fillStyle(style.dark, .34).fillRect(left, roof, w, h);
    near.fillStyle(style.edge, .065).fillRect(left + 10, roof + 10, w - 20, 6);

    // Strong vertical architecture: towers, service shafts, external frames.
    near.fillStyle(style.dark, .38).fillRect(left + w * .08, roof + 28, w * .12, h - 28);
    near.fillStyle(style.dark, .38).fillRect(right - w * .20, roof + 48, w * .12, h - 48);
    near.lineStyle(2, style.edge, .10).lineBetween(left + w * .28, roof + 8, left + w * .28, base);
    near.lineStyle(2, style.edge, .08).lineBetween(left + w * .72, roof + 8, left + w * .72, base);

    // Vertical neon / signage strips — few and deliberate, not noisy.
    if (styleIndex !== 2) {
      near.fillStyle(style.accent, .16).fillRect(left + w * .18, roof + 30, 5, Math.min(120, h - 54));
      near.fillStyle(style.bright, .11).fillRect(right - w * .18, roof + 52, 4, Math.min(92, h - 76));
    }

    // Larger facade panels.
    near.lineStyle(1, style.bright, .075).strokeRect(left + 22, roof + 26, w - 44, Math.min(92, h - 52));
    near.lineStyle(1, style.edge, .06).lineBetween(left + 22, roof + 70, right - 22, roof + 70);

    // Hero rooftop equipment.
    near.fillStyle(style.edge, .12).fillRect(left + 22, roof - 7, w - 44, 7);
    near.fillStyle(style.bright, .12).fillRect(cx - 24, roof - 16, 48, 9);
    near.lineStyle(2, style.edge, .17).lineBetween(cx, roof - 7, cx, roof - 58);
    near.fillStyle(style.edge, .26).fillCircle(cx, roof - 61, 2);

    if (styleIndex === 0) {
      near.fillStyle(style.accent, .11).fillRect(left + w * .34, roof - 23, w * .32, 16);
      near.lineStyle(2, style.edge, .12).lineBetween(left + w * .5, roof - 7, left + w * .5, roof - 84);
    } else if (styleIndex === 1) {
      near.fillStyle(style.edge, .10).fillRect(left + 28, roof - 16, 38, 11);
      near.lineStyle(1, style.bright, .14).lineBetween(left + 48, roof - 16, left + 48, roof - 56);
    } else if (styleIndex === 3) {
      near.fillStyle(style.accent, .09).fillRect(left + w * .18, roof - 20, w * .64, 12);
      near.lineStyle(1, style.edge, .16).lineBetween(left + w * .22, roof - 8, left + w * .22, roof - 46);
      near.lineStyle(1, style.edge, .16).lineBetween(right - w * .22, roof - 8, right - w * .22, roof - 46);
    } else {
      near.lineStyle(2, style.bright, .10).lineBetween(left + 24, roof - 6, right - 24, roof - 6);
      near.fillStyle(style.edge, .14).fillCircle(left + w * .22, roof - 12, 5);
    }
  }

  // ---------- CITY INFRASTRUCTURE: cables / relays / elevated links ----------
  // These are sparse lines, not interactive objects. They sell the scale of the city.
  for (let i = 0; i < Math.ceil(worldWidth / 420); i += 1) {
    const x1 = 90 + i * 420;
    const x2 = Math.min(worldWidth + 220, x1 + 300 + pick(i * 17 + 77, 90));
    const y = 332 + pick(i * 29 + 9, 92);
    near.lineStyle(2, style.edge, .10).lineBetween(x1, y, (x1 + x2) / 2, y + 34);
    near.lineStyle(1, style.bright, .08).lineBetween((x1 + x2) / 2, y + 34, x2, y + 6);
    near.fillStyle(style.edge, .14).fillCircle(x1, y, 2);
    near.fillStyle(style.edge, .14).fillCircle(x2, y + 6, 2);
  }

  // ---------- ATMOSPHERE: separate cheap haze layer ----------
  haze.fillStyle(style.dark, .035).fillRect(-240, 398, worldWidth + 520, 110);
  haze.fillStyle(style.edge, .025).fillRect(-240, 456, worldWidth + 520, 88);
  haze.fillStyle(style.bright, .014).fillRect(-240, 512, worldWidth + 520, 58);

  return { far, mid, near, haze };
}

function comboFeedback(scene, combo) {
  if (!scene.add || !combo || combo < 2) return;
  const style = getStyle(scene);
  const label = scene.add.text(scene.player.x, scene.player.y - 54, `COMBO x${combo}`, {
    fontFamily: 'DM Mono', fontSize: combo >= 4 ? '13px' : '11px', fontStyle: 'bold',
    color: `#${style.bright.toString(16).padStart(6, '0')}`, stroke: '#050a13', strokeThickness: 4,
  }).setOrigin(.5).setDepth(14);
  scene.tweens.add({ targets: label, y: label.y - 18, alpha: 0, duration: 520, onComplete: () => label.destroy() });
}

function setup(scene) {
  if (!scene || stateByScene.has(scene)) return;
  const style = getStyle(scene);
  const state = { style, platforms: [], barriers: [], background: null };
  stateByScene.set(scene, state);

  state.background = addDistrictVariation(scene, style);

  // IMPORTANT: these existing gameplay-adjacent visuals are untouched.
  scene.platforms?.getChildren?.().forEach((platform, index) => {
    state.platforms.push(addPlatformVisual(scene, platform, index, style));
  });
  scene.barriers?.getChildren?.().forEach((barrier, index) => {
    state.barriers.push(addBarrierVisual(scene, barrier, index, style));
  });

  const events = scene.game?.events;
  if (events) {
    const onFeedback = kind => {
      if (!scene.active || !scene.player?.active) return;
      if (kind === 'gadget') scene.gadgetPulse?.(style.edge, 13, 190);
      if (kind === 'hit') {
        const pulse = scene.add.circle(scene.player.x, scene.player.y, 18, style.edge, .12).setDepth(11);
        scene.tweens.add({ targets: pulse, scale: 1.9, alpha: 0, duration: 150, onComplete: () => pulse.destroy() });
      }
    };
    const onCombo = combo => comboFeedback(scene, combo);
    events.on('feedback', onFeedback);
    events.on('combo', onCombo);
    state.cleanup = () => {
      events.off('feedback', onFeedback);
      events.off('combo', onCombo);
    };
  }

  scene.events?.once?.('shutdown', () => {
    state.cleanup?.();
    state.platforms.forEach(item => item?.destroy?.());
    state.barriers.forEach(item => item?.destroy?.());
    state.background?.far?.destroy?.();
    state.background?.mid?.destroy?.();
    state.background?.near?.destroy?.();
    state.background?.haze?.destroy?.();
    stateByScene.delete(scene);
  });
}

function install() {
  if (window.__relayUpdate10WorldVariation) return;
  window.__relayUpdate10WorldVariation = true;

  const ready = event => {
    const scene = event?.detail?.scene || window.__relayRunnerScene;
    if (scene) setup(scene);
  };
  window.addEventListener('relay:runner-scene-ready', ready);

  // Defensive fallback for environments that expose the scene before the custom event.
  if (window.__relayRunnerScene) setup(window.__relayRunnerScene);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
