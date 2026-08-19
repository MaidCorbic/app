// UPDATE 10 — WORLD VARIATION + GAME FEEL + PLATFORM CLARITY
// UPDATE 10.2 — CLEAN CITY BACKDROP
// Visual/feedback-only layer. It never creates or changes physics bodies, collision rules,
// player movement, mobile controls, viewport policy, mission state, or progression.
// IMPORTANT: platform and barrier visuals below are intentionally preserved exactly.
// UPDATE 10.2 changes ONLY the background city presentation.

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

  // UPDATE 10.2: clean replacement for the previous skyline.
  // There is intentionally NO old/second city painted underneath this one.
  // Each depth uses opaque-ish silhouettes with restrained detail, so buildings
  // read as architecture instead of transparent ghost rectangles.
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

  const far = scene.add.graphics().setScrollFactor(.18).setDepth(0);
  const mid = scene.add.graphics().setScrollFactor(.30).setDepth(.55);
  const near = scene.add.graphics().setScrollFactor(.44).setDepth(1);
  const haze = scene.add.graphics().setScrollFactor(.36).setDepth(2);

  // ---------- FAR CITY: quiet horizon, not a second foreground ----------
  // Low contrast and lower silhouette density prevent the old "shadow copy" effect.
  for (let x = -260, i = 0; x < worldWidth + 420; x += 155, i += 1) {
    const w = 92 + pick(i * 19 + 3, 76);
    const h = 82 + pick(i * 31 + 11, 105);
    const roof = base - h;
    const cx = x + w * .5;

    far.fillStyle(style.dark, .62).fillRect(x, roof, w, h);
    if (pick(i + 41, 4) === 0) {
      far.fillStyle(style.dark, .78).fillRect(x + w * .35, roof - 28, w * .3, 28);
      far.lineStyle(1, style.edge, .16).lineBetween(cx, roof - 28, cx, roof - 58);
      far.fillStyle(style.edge, .18).fillCircle(cx, roof - 61, 2);
    }

    // Very sparse windows; far buildings are intentionally quiet.
    if (pick(i + 77, 3) !== 0) {
      for (let row = 0; row < 2; row += 1) {
        const wy = roof + 30 + row * 34;
        const count = Math.max(2, Math.floor(w / 36));
        for (let col = 0; col < count; col += 1) {
          if (pick(i * 100 + row * 17 + col * 7, 6) > 1) continue;
          far.fillStyle(style.bright, .07).fillRect(x + 16 + col * 30, wy, 6, 3);
        }
      }
    }
  }

  // ---------- MID CITY: the main skyline ----------
  // This is the primary readable architecture layer. Buildings have distinct
  // silhouettes rather than a transparent stack of rectangles.
  for (let x = -180, i = 0; x < worldWidth + 340; x += 205, i += 1) {
    const archetype = pick(i * 37 + 5, 7);
    const w = 128 + pick(i * 13 + 8, 82);
    const h = 142 + pick(i * 23 + 2, 158);
    const roof = base - h;
    const left = x;
    const right = x + w;
    const cx = left + w * .5;

    // Solid main mass. No translucent duplicate facade behind it.
    mid.fillStyle(style.dark, .90).fillRect(left, roof, w, h);

    // Distinctive silhouettes: tower crown, stepped block, side wing, or notch.
    if (archetype === 0) {
      mid.fillStyle(style.dark, .96).fillRect(left + w * .20, roof - 34, w * .60, 34);
      mid.fillStyle(style.dark, .96).fillRect(left + w * .34, roof - 50, w * .32, 16);
    } else if (archetype === 1) {
      mid.fillStyle(style.dark, .96).fillRect(left + w * .58, roof + 20, w * .42, h - 20);
      mid.fillStyle(style.dark, .96).fillRect(left - 12, roof + 52, 12, h - 52);
    } else if (archetype === 2) {
      mid.fillStyle(style.dark, .96).fillRect(left - 18, roof + 38, 18, h - 38);
      mid.fillStyle(style.dark, .96).fillRect(right, roof + 18, 16, h - 18);
      mid.fillStyle(style.edge, .10).fillRect(left + 14, roof + 22, w - 28, 4);
    } else if (archetype === 3) {
      mid.fillStyle(style.dark, .96).fillRect(left + w * .15, roof - 22, w * .70, 22);
      mid.fillStyle(style.dark, .96).fillRect(left + w * .34, roof - 42, w * .32, 20);
    } else if (archetype === 4) {
      mid.fillStyle(style.dark, .96).fillRect(left + w * .12, roof + 24, w * .24, h - 24);
      mid.fillStyle(style.dark, .96).fillRect(right - w * .24, roof + 48, w * .24, h - 48);
    } else if (archetype === 5) {
      mid.fillStyle(style.dark, .96).fillRect(left + w * .24, roof - 16, w * .52, 16);
      mid.fillStyle(style.dark, .96).fillRect(left + w * .40, roof - 36, w * .20, 20);
    } else {
      mid.fillStyle(style.dark, .96).fillRect(left + w * .68, roof + 34, w * .32, h - 34);
    }

    // Facade structure: subtle, deliberate, and aligned with the building mass.
    mid.fillStyle(style.edge, .085).fillRect(left + 10, roof + 12, w - 20, 4);
    mid.lineStyle(1, style.edge, .12).lineBetween(left + w * .25, roof + 12, left + w * .25, base);
    mid.lineStyle(1, style.edge, .08).lineBetween(left + w * .75, roof + 12, left + w * .75, base);

    // Sparse window groups, not a repetitive grid.
    const rows = Math.max(2, Math.floor((h - 60) / 46));
    const cols = Math.max(2, Math.floor((w - 34) / 34));
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const chance = pick(i * 1000 + row * 41 + col * 17, 10);
        if (chance > (id === 'blackout' ? 1 : 3)) continue;
        const wx = left + 18 + col * ((w - 36) / Math.max(1, cols - 1));
        const wy = roof + 38 + row * 46;
        const windowColor = id === 'signal-storm' ? style.bright : style.accent;
        mid.fillStyle(windowColor, id === 'blackout' ? .10 : .17).fillRect(wx, wy, 8, 5);
      }
    }

    // Rooftop equipment changes the silhouette instead of adding a shadow layer.
    mid.fillStyle(style.edge, .18).fillRect(left + 12, roof - 5, w - 24, 5);
    if (archetype === 0 || archetype === 5) {
      mid.fillStyle(style.bright, .12).fillRect(cx - 22, roof - 13, 44, 8);
      mid.lineStyle(2, style.edge, .22).lineBetween(cx, roof - 5, cx, roof - 50);
      mid.fillStyle(style.edge, .32).fillCircle(cx, roof - 53, 2);
    } else if (archetype === 1 || archetype === 4) {
      mid.fillStyle(style.edge, .14).fillRect(left + 20, roof - 12, 34, 8);
      mid.lineStyle(1, style.bright, .18).lineBetween(left + 37, roof - 12, left + 37, roof - 42);
    } else if (archetype === 2) {
      mid.fillStyle(style.accent, .12).fillRect(left + 18, roof - 17, 38, 12);
      mid.fillStyle(style.edge, .22).fillCircle(left + 37, roof - 23, 6);
    }

    // Mission-specific visual language without changing gameplay objects.
    if (id === 'corporate-lockdown' || id === 'final-relay') {
      mid.fillStyle(style.edge, .10).fillRect(left + 16, roof + 24, w - 32, 46);
      mid.fillStyle(style.bright, .18).fillRect(left + 25, roof + 35, Math.max(26, w - 50), 4);
      mid.lineStyle(1, style.edge, .16).strokeRect(left + 12, roof + 16, w - 24, 64);
    } else if (id === 'dead-drop') {
      mid.fillStyle(style.accent, .13).fillRect(left + w * .18, roof - 16, w * .64, 12);
      mid.lineStyle(1, style.edge, .18).lineBetween(cx, roof - 16, cx, roof - 60);
    } else if (id === 'signal-storm') {
      mid.lineStyle(2, style.edge, .15).lineBetween(left + 14, roof + 10, right - 14, roof - 22);
      mid.fillStyle(style.bright, .12).fillCircle(cx, roof + 10, Math.min(16, w * .09));
    } else if (id === 'blackout') {
      mid.fillStyle(style.edge, .08).fillRect(left + 18, roof + 20, w - 36, 3);
    } else {
      mid.fillStyle(style.accent, .10).fillRect(left + 18, roof + 30, Math.max(24, w * .26), 8);
    }
  }

  // ---------- NEAR CITY: only a few foreground architectural accents ----------
  // IMPORTANT: near layer no longer paints full translucent building blocks.
  // It adds depth with rooftop machinery, billboards, rails and ducts only.
  for (let x = 70, i = 0; x < worldWidth + 260; x += 410, i += 1) {
    const w = 180 + pick(i * 47 + 19, 80);
    const h = 150 + pick(i * 23 + 29, 90);
    const roof = base - h;
    const left = x;
    const right = x + w;
    const cx = left + w * .5;
    const accentType = pick(i + id.length * 3, 5);

    // A dark, opaque rooftop silhouette only — never a ghost facade.
    near.fillStyle(style.dark, .96).fillRect(left, roof + 72, w, h - 72);
    near.fillStyle(style.edge, .20).fillRect(left, roof + 68, w, 6);

    // Hero rooftop structures.
    if (accentType === 0) {
      near.fillStyle(style.dark, .98).fillRect(cx - 36, roof + 34, 72, 34);
      near.lineStyle(2, style.edge, .25).strokeRect(cx - 36, roof + 34, 72, 34);
      near.lineStyle(2, style.edge, .25).lineBetween(cx, roof + 34, cx, roof - 10);
      near.fillStyle(style.edge, .34).fillCircle(cx, roof - 13, 3);
    } else if (accentType === 1) {
      near.fillStyle(style.dark, .98).fillRect(left + 24, roof + 42, 48, 26);
      near.fillStyle(style.accent, .18).fillRect(left + 30, roof + 48, 36, 5);
      near.lineStyle(1, style.bright, .22).lineBetween(left + 48, roof + 42, left + 48, roof + 8);
    } else if (accentType === 2) {
      near.fillStyle(style.dark, .98).fillRect(right - 76, roof + 36, 50, 32);
      near.fillStyle(style.edge, .18).fillCircle(right - 51, roof + 52, 13);
      near.lineStyle(1, style.bright, .20).lineBetween(right - 51, roof + 39, right - 51, roof + 8);
    } else if (accentType === 3) {
      near.lineStyle(2, style.edge, .22).lineBetween(left + 22, roof + 64, right - 22, roof + 64);
      near.lineStyle(1, style.bright, .16).lineBetween(left + 34, roof + 54, left + 34, roof + 22);
      near.lineStyle(1, style.bright, .16).lineBetween(right - 34, roof + 54, right - 34, roof + 22);
    } else {
      near.fillStyle(style.dark, .98).fillRect(cx - 28, roof + 24, 56, 44);
      near.fillStyle(style.bright, .12).fillRect(cx - 20, roof + 34, 40, 5);
      near.fillStyle(style.accent, .16).fillRect(cx - 14, roof + 48, 28, 4);
    }
  }

  // ---------- CITY INFRASTRUCTURE: sparse cables and relay links ----------
  // Lines are intentionally few so they add scale without creating visual noise.
  for (let i = 0; i < Math.ceil(worldWidth / 500); i += 1) {
    const x1 = 110 + i * 500;
    const x2 = Math.min(worldWidth + 180, x1 + 300 + pick(i * 17 + 77, 70));
    const y = 286 + pick(i * 29 + 9, 82);
    near.lineStyle(2, style.edge, .13).lineBetween(x1, y, (x1 + x2) / 2, y + 26);
    near.lineStyle(1, style.bright, .09).lineBetween((x1 + x2) / 2, y + 26, x2, y + 5);
    near.fillStyle(style.edge, .18).fillCircle(x1, y, 2);
    near.fillStyle(style.edge, .18).fillCircle(x2, y + 5, 2);
  }

  // ---------- ATMOSPHERE ----------
  // Very subtle bands only. No large transparent building overlays.
  haze.fillStyle(style.dark, .018).fillRect(-240, 430, worldWidth + 520, 80);
  haze.fillStyle(style.bright, .010).fillRect(-240, 505, worldWidth + 520, 48);

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

  // IMPORTANT: existing gameplay-adjacent visuals are untouched.
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
