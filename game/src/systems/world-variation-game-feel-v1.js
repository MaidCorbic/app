// UPDATE 10 — WORLD VARIATION + GAME FEEL + PLATFORM CLARITY
// UPDATE 10.3 — BUILDING SILHOUETTE + HERO ARCHITECTURE
// Visual/feedback-only layer. It never creates or changes physics bodies, collision rules,
// player movement, mobile controls, viewport policy, mission state, or progression.
// IMPORTANT: platform and barrier visuals below are intentionally preserved exactly.
// UPDATE 10.3 changes ONLY the background city presentation.

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

  // UPDATE 10.3: clean architectural pass.
  // The old city is not rendered underneath this layer. We use one main skyline,
  // a quiet distant horizon, and a small number of foreground architectural accents.
  // No per-frame generation, no particles, no physics, no gameplay objects.
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
  const mid = scene.add.graphics().setScrollFactor(.30).setDepth(.55);
  const near = scene.add.graphics().setScrollFactor(.44).setDepth(1);
  const haze = scene.add.graphics().setScrollFactor(.36).setDepth(2);

  // ---------- FAR CITY: skyline mass only ----------
  // Quiet silhouettes establish distance without creating ghost duplicates.
  for (let x = -260, i = 0; x < worldWidth + 420; x += 175, i += 1) {
    const w = 90 + pick(i * 19 + 3, 70);
    const h = 76 + pick(i * 31 + 11, 96);
    const roof = base - h;
    const cx = x + w * .5;

    far.fillStyle(style.dark, .42).fillRect(x, roof, w, h);
    if (pick(i + 41, 5) === 0) {
      far.fillStyle(style.dark, .58).fillRect(x + w * .38, roof - 24, w * .24, 24);
      far.lineStyle(1, style.edge, .10).lineBetween(cx, roof - 24, cx, roof - 54);
    }

    // Only a handful of windows; far architecture should read as atmosphere.
    if (pick(i + 77, 3) !== 0) {
      for (let col = 0; col < Math.max(2, Math.floor(w / 42)); col += 1) {
        if (pick(i * 17 + col * 13, 5) > 1) continue;
        far.fillStyle(style.bright, .045).fillRect(x + 18 + col * 36, roof + 32, 7, 3);
        if (pick(i * 23 + col * 19, 4) === 0) {
          far.fillStyle(style.bright, .04).fillRect(x + 18 + col * 36, roof + 68, 7, 3);
        }
      }
    }
  }

  // ---------- MID CITY: primary readable architecture ----------
  // Seven deterministic building families prevent the repetitive rectangle look.
  for (let x = -190, i = 0; x < worldWidth + 360; x += 215, i += 1) {
    const archetype = pick(i * 37 + 5, 7);
    const w = 130 + pick(i * 13 + 8, 78);
    const h = 138 + pick(i * 23 + 2, 164);
    const roof = base - h;
    const left = x;
    const right = x + w;
    const cx = left + w * .5;

    // Solid main mass. This is the only primary facade; no transparent copy behind it.
    mid.fillStyle(style.dark, .94).fillRect(left, roof, w, h);

    // Building silhouette pass: crowns, shoulders, setbacks and service wings.
    if (archetype === 0) {
      mid.fillStyle(style.dark, .98).fillRect(left + w * .20, roof - 34, w * .60, 34);
      mid.fillStyle(style.dark, .98).fillRect(left + w * .35, roof - 52, w * .30, 18);
      mid.lineStyle(2, style.edge, .14).lineBetween(cx, roof - 52, cx, roof - 78);
    } else if (archetype === 1) {
      mid.fillStyle(style.dark, .98).fillRect(left + w * .58, roof + 18, w * .42, h - 18);
      mid.fillStyle(style.dark, .98).fillRect(left - 14, roof + 54, 14, h - 54);
      mid.fillStyle(style.edge, .11).fillRect(left + w * .58, roof + 18, 3, h - 18);
    } else if (archetype === 2) {
      mid.fillStyle(style.dark, .98).fillRect(left - 18, roof + 40, 18, h - 40);
      mid.fillStyle(style.dark, .98).fillRect(right, roof + 22, 17, h - 22);
      mid.fillStyle(style.edge, .12).fillRect(left + 12, roof + 22, w - 24, 5);
    } else if (archetype === 3) {
      mid.fillStyle(style.dark, .98).fillRect(left + w * .12, roof - 22, w * .76, 22);
      mid.fillStyle(style.dark, .98).fillRect(left + w * .34, roof - 44, w * .32, 22);
      mid.lineStyle(2, style.bright, .12).lineBetween(left + w * .34, roof - 44, left + w * .66, roof - 44);
    } else if (archetype === 4) {
      mid.fillStyle(style.dark, .98).fillRect(left + w * .10, roof + 26, w * .25, h - 26);
      mid.fillStyle(style.dark, .98).fillRect(right - w * .25, roof + 48, w * .25, h - 48);
      mid.fillStyle(style.dark, .98).fillRect(left + w * .34, roof - 12, w * .32, 12);
    } else if (archetype === 5) {
      mid.fillStyle(style.dark, .98).fillRect(left + w * .22, roof - 16, w * .56, 16);
      mid.fillStyle(style.dark, .98).fillRect(left + w * .39, roof - 38, w * .22, 22);
      mid.fillStyle(style.edge, .13).fillRect(left + w * .31, roof - 10, w * .38, 4);
    } else {
      mid.fillStyle(style.dark, .98).fillRect(left + w * .66, roof + 34, w * .34, h - 34);
      mid.fillStyle(style.dark, .98).fillRect(left + w * .16, roof + 18, w * .20, h - 18);
    }

    // Facade framing: a few large architectural planes, not a grid.
    mid.fillStyle(style.edge, .09).fillRect(left + 10, roof + 12, w - 20, 4);
    mid.lineStyle(1, style.edge, .10).lineBetween(left + w * .27, roof + 14, left + w * .27, base);
    mid.lineStyle(1, style.edge, .07).lineBetween(left + w * .73, roof + 14, left + w * .73, base);

    // Sparse window clusters with deterministic gaps.
    const rows = Math.max(2, Math.floor((h - 58) / 48));
    const cols = Math.max(2, Math.floor((w - 38) / 36));
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const chance = pick(i * 1000 + row * 41 + col * 17, 10);
        if (chance > (id === 'blackout' ? 1 : 3)) continue;
        const wx = left + 19 + col * ((w - 38) / Math.max(1, cols - 1));
        const wy = roof + 40 + row * 48;
        const ww = archetype === 4 ? 6 : 8;
        mid.fillStyle(id === 'signal-storm' ? style.bright : style.accent, id === 'blackout' ? .09 : .15).fillRect(wx, wy, ww, 5);
      }
    }

    // Rooftop identity: one strong piece per building.
    mid.fillStyle(style.edge, .18).fillRect(left + 12, roof - 5, w - 24, 5);
    if (archetype === 0 || archetype === 5) {
      mid.fillStyle(style.bright, .11).fillRect(cx - 22, roof - 13, 44, 8);
      mid.lineStyle(2, style.edge, .22).lineBetween(cx, roof - 5, cx, roof - 48);
      mid.fillStyle(style.edge, .30).fillCircle(cx, roof - 51, 2);
    } else if (archetype === 1 || archetype === 4) {
      mid.fillStyle(style.edge, .13).fillRect(left + 20, roof - 12, 36, 8);
      mid.lineStyle(1, style.bright, .17).lineBetween(left + 38, roof - 12, left + 38, roof - 40);
    } else if (archetype === 2) {
      mid.fillStyle(style.accent, .11).fillRect(left + 18, roof - 17, 40, 12);
      mid.fillStyle(style.edge, .22).fillCircle(left + 38, roof - 23, 6);
    }

    // Mission-specific accents stay subtle and do not touch gameplay.
    if (id === 'corporate-lockdown' || id === 'final-relay') {
      mid.fillStyle(style.edge, .08).fillRect(left + 16, roof + 24, w - 32, 46);
      mid.fillStyle(style.bright, .14).fillRect(left + 25, roof + 35, Math.max(26, w - 50), 4);
      mid.lineStyle(1, style.edge, .12).strokeRect(left + 12, roof + 16, w - 24, 64);
    } else if (id === 'dead-drop') {
      mid.fillStyle(style.accent, .11).fillRect(left + w * .20, roof - 16, w * .60, 11);
      mid.lineStyle(1, style.edge, .16).lineBetween(cx, roof - 16, cx, roof - 58);
    } else if (id === 'signal-storm') {
      mid.lineStyle(2, style.edge, .13).lineBetween(left + 14, roof + 10, right - 14, roof - 22);
      mid.fillStyle(style.bright, .10).fillCircle(cx, roof + 10, Math.min(15, w * .08));
    } else if (id === 'blackout') {
      mid.fillStyle(style.edge, .06).fillRect(left + 18, roof + 20, w - 36, 3);
    } else {
      mid.fillStyle(style.accent, .08).fillRect(left + 18, roof + 30, Math.max(24, w * .24), 8);
    }
  }

  // ---------- HERO ARCHITECTURE: three dominant landmarks ----------
  // These are large, opaque silhouettes with deliberate identity. They are part of
  // the backdrop only and never become collision or gameplay objects.
  const heroSpacing = Math.max(520, Math.floor(worldWidth / 3));
  const heroPositions = [heroSpacing * .65, heroSpacing * 1.55, heroSpacing * 2.45];
  heroPositions.forEach((center, heroIndex) => {
    if (center > worldWidth + 260) return;
    const hero = pick(heroIndex * 73 + id.length * 11, 4);
    const w = 210 + pick(heroIndex * 29 + 17, 70);
    const h = 250 + pick(heroIndex * 43 + 23, 105);
    const left = center - w / 2;
    const right = center + w / 2;
    const roof = base - h;

    // Main silhouette.
    mid.fillStyle(style.dark, .98).fillRect(left, roof + 34, w, h - 34);

    if (hero === 0) {
      // Relay tower / communications crown.
      mid.fillStyle(style.dark, .99).fillRect(left + w * .20, roof, w * .60, 34);
      mid.fillStyle(style.dark, .99).fillRect(left + w * .37, roof - 28, w * .26, 28);
      mid.lineStyle(3, style.edge, .18).lineBetween(center, roof - 28, center, roof - 92);
      mid.lineStyle(1, style.bright, .16).lineBetween(center - 18, roof - 56, center + 18, roof - 56);
      mid.fillStyle(style.edge, .28).fillCircle(center, roof - 96, 3);
    } else if (hero === 1) {
      // Corporate monolith with a large inset face.
      mid.fillStyle(style.dark, .99).fillRect(left + w * .16, roof, w * .68, 34);
      mid.fillStyle(style.edge, .12).fillRect(left + w * .24, roof + 62, w * .52, 92);
      mid.lineStyle(2, style.bright, .12).strokeRect(left + w * .24, roof + 62, w * .52, 92);
      mid.fillStyle(style.accent, .14).fillRect(left + w * .31, roof + 82, w * .38, 8);
      mid.fillStyle(style.bright, .10).fillRect(left + w * .31, roof + 104, w * .24, 5);
    } else if (hero === 2) {
      // Industrial tower with stepped shoulders and a service mast.
      mid.fillStyle(style.dark, .99).fillRect(left - 18, roof + 62, 18, h - 62);
      mid.fillStyle(style.dark, .99).fillRect(right, roof + 28, 20, h - 28);
      mid.fillStyle(style.dark, .99).fillRect(left + w * .24, roof, w * .52, 32);
      mid.fillStyle(style.edge, .13).fillRect(left + 20, roof + 74, w - 40, 6);
      mid.lineStyle(2, style.edge, .18).lineBetween(left + 32, roof + 74, left + 32, base);
      mid.lineStyle(2, style.edge, .12).lineBetween(right - 32, roof + 74, right - 32, base);
    } else {
      // Narrow neon spire with a stepped crown.
      mid.fillStyle(style.dark, .99).fillRect(left + w * .16, roof + 42, w * .68, h - 42);
      mid.fillStyle(style.dark, .99).fillRect(left + w * .28, roof + 12, w * .44, 30);
      mid.fillStyle(style.dark, .99).fillRect(left + w * .40, roof - 12, w * .20, 24);
      mid.fillStyle(style.accent, .18).fillRect(left + w * .25, roof + 92, 6, Math.min(150, h - 120));
      mid.lineStyle(2, style.bright, .15).lineBetween(center, roof - 12, center, roof - 62);
    }

    // Hero facade windows: grouped bands instead of repetitive grids.
    for (let band = roof + 70; band < base - 40; band += 54) {
      if (pick(heroIndex * 200 + band, 5) > 2) continue;
      mid.fillStyle(style.bright, .10).fillRect(left + 24, band, w - 48, 5);
      mid.fillStyle(style.accent, .08).fillRect(left + 24, band + 10, Math.max(30, (w - 48) * .42), 4);
    }

    // Hero rooftop rail and equipment line.
    mid.fillStyle(style.edge, .22).fillRect(left + 16, roof - 4, w - 32, 4);
  });

  // ---------- NEAR CITY: accents only, never full building duplicates ----------
  // Foreground depth is created by a few large ducts, signs and rooftop machines.
  for (let x = 150, i = 0; x < worldWidth + 300; x += 620, i += 1) {
    const accent = pick(i * 51 + id.length, 4);
    const y = 300 + pick(i * 17 + 9, 100);
    const w = 90 + pick(i * 31 + 3, 70);

    if (accent === 0) {
      near.lineStyle(4, style.edge, .16).lineBetween(x, y, x + w, y);
      near.lineStyle(1, style.bright, .12).lineBetween(x + 10, y + 8, x + w - 10, y + 8);
      near.fillStyle(style.edge, .22).fillCircle(x, y, 3);
      near.fillStyle(style.edge, .22).fillCircle(x + w, y, 3);
    } else if (accent === 1) {
      near.fillStyle(style.dark, .92).fillRoundedRect(x, y, w, 34, 4);
      near.lineStyle(2, style.edge, .20).strokeRoundedRect(x, y, w, 34, 4);
      near.fillStyle(style.accent, .16).fillRect(x + 12, y + 11, w - 24, 5);
    } else if (accent === 2) {
      near.fillStyle(style.dark, .94).fillRect(x, y, 46, 38);
      near.fillStyle(style.edge, .22).fillCircle(x + 23, y + 19, 13);
      near.lineStyle(1, style.bright, .16).lineBetween(x + 23, y, x + 23, y - 32);
    } else {
      near.lineStyle(2, style.edge, .16).lineBetween(x, y + 40, x + w, y - 8);
      near.lineStyle(1, style.bright, .10).lineBetween(x + 24, y + 30, x + 24, y - 6);
      near.lineStyle(1, style.bright, .10).lineBetween(x + w - 24, y + 6, x + w - 24, y - 20);
    }
  }

  // ---------- CITY INFRASTRUCTURE ----------
  // Very sparse links add scale without drawing a wireframe over the scene.
  for (let i = 0; i < Math.ceil(worldWidth / 560); i += 1) {
    const x1 = 120 + i * 560;
    const x2 = Math.min(worldWidth + 160, x1 + 260 + pick(i * 17 + 77, 80));
    const y = 258 + pick(i * 29 + 9, 78);
    near.lineStyle(2, style.edge, .10).lineBetween(x1, y, (x1 + x2) / 2, y + 22);
    near.lineStyle(1, style.bright, .07).lineBetween((x1 + x2) / 2, y + 22, x2, y + 4);
  }

  // ---------- ATMOSPHERE ----------
  // Minimal haze only. It must not create a second skyline silhouette.
  haze.fillStyle(style.dark, .014).fillRect(-240, 438, worldWidth + 520, 72);
  haze.fillStyle(style.bright, .008).fillRect(-240, 510, worldWidth + 520, 44);

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
