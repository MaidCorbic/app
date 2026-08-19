// UPDATE 10 — WORLD VARIATION + GAME FEEL + PLATFORM CLARITY
// Visual/feedback-only layer. It never creates or changes physics bodies, collision rules,
// player movement, mobile controls, viewport policy, mission state, or progression.
// It attaches only after world-interaction-runtime-v2 announces the real RunnerScene.

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

  // Clear gameplay silhouette: bright upper lip, darker underside and end caps.
  g.fillStyle(style.dark, .82).fillRect(left, top + 5, width, Math.max(4, height - 5));
  g.fillStyle(style.edge, .92).fillRect(left, top, width, 4);
  g.fillStyle(style.bright, .42).fillRect(left + 5, top + 4, Math.max(8, width - 10), 2);
  g.fillStyle(style.edge, .62).fillRect(left, top + height - 4, width, 4);

  const step = Math.max(30, Math.min(54, width / 6));
  for (let x = left + 10; x < left + width - 8; x += step) {
    g.fillStyle(style.accent, type === 'roof' ? .24 : .13).fillRect(x, top + 9, Math.min(18, step - 8), 3);
  }

  // Small ledge markers improve jump/readability without adding UI clutter.
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

  // Strong obstacle silhouette so a vault target cannot visually merge with scenery.
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

  // One batched Graphics object keeps the skyline cheap: no building sprites,
  // no per-building tweens, and no update-loop work. The depth comes from
  // layered silhouettes, facade framing, windows, rooftop equipment and signs.
  const g = scene.add.graphics().setScrollFactor(.5).setDepth(1);
  const id = scene.mission?.id || '';
  const spacing = 238;
  const base = 610;
  const hash = n => Math.abs((n * 1103515245 + 12345) | 0);

  for (let x = -180, i = 0; x < scene.worldWidth + 320; x += spacing, i += 1) {
    const seed = hash(i + id.length * 17);
    const w = 128 + (seed % 92);
    const h = 118 + ((seed >>> 4) % 170);
    const roof = base - h;
    const left = x;
    const right = x + w;
    const isTower = i % 5 === 2;
    const isBlock = i % 5 !== 1;

    // Far silhouette: irregular skyline instead of a repeated rectangle wall.
    g.fillStyle(style.dark, .54).fillRect(left, roof, w, h);
    g.fillStyle(style.dark, .34).fillRect(left - 22, roof + 22, 18, h - 22);
    if (isTower) g.fillStyle(style.dark, .46).fillRect(left + w * .35, roof - 52, w * .3, 52);

    // Architectural framing gives each building a recognizable facade.
    g.fillStyle(style.accent, .08).fillRect(left + 8, roof + 12, Math.max(16, w - 16), 5);
    g.fillStyle(style.bright, .035).fillRect(left + 12, roof + 22, Math.max(12, w - 24), h - 34);
    g.lineStyle(1, style.edge, .12).lineBetween(left + w * .5, roof + 8, left + w * .5, base);
    if (isBlock) g.lineStyle(1, style.edge, .08).lineBetween(left + 18, roof + 8, left + 18, base);

    // Windows are grouped into a single draw call per row, keeping them cheap.
    const cols = Math.max(2, Math.floor(w / 34));
    const rows = Math.max(2, Math.floor(h / 48));
    for (let row = 0; row < rows; row += 1) {
      const y = roof + 34 + row * 42;
      if (y > base - 18) break;
      for (let col = 0; col < cols; col += 1) {
        const lit = ((seed + row * 7 + col * 11) % 9) < (id === 'blackout' ? 2 : 4);
        if (!lit) continue;
        const wx = left + 16 + col * ((w - 32) / Math.max(1, cols - 1));
        const glow = id === 'signal-storm' ? style.bright : style.accent;
        g.fillStyle(glow, id === 'blackout' ? .11 : .17).fillRect(wx, y, 9, 5);
      }
    }

    // Rooftop machinery: vents, antennae, relay dishes and neon strips.
    const center = left + w * .5;
    g.fillStyle(style.edge, .12).fillRect(left + 14, roof - 6, Math.max(20, w - 28), 5);
    g.fillStyle(style.bright, .14).fillRect(left + 24, roof - 12, 24, 4);
    g.lineStyle(2, style.edge, .22).lineBetween(center, roof - 6, center, roof - 38 - (seed % 20));
    g.fillStyle(style.edge, .25).fillCircle(center, roof - 42 - (seed % 20), 2);

    if (isTower) {
      g.lineStyle(2, style.accent, .16).lineBetween(center - 28, roof - 4, center + 28, roof - 4);
      g.lineStyle(1, style.bright, .18).lineBetween(center, roof - 34, center + 38, roof - 64);
      g.fillStyle(style.edge, .14).fillRect(left + w * .18, roof + 16, w * .64, 4);
    }

    // District-specific visual language.
    if (id === 'dead-drop') {
      g.fillStyle(style.accent, .13).fillRect(left + w * .18, roof - 18, w * .64, 18);
      g.lineStyle(2, style.edge, .16).lineBetween(center, roof - 18, center, roof - 68);
      g.lineStyle(1, style.bright, .12).lineBetween(left - 8, roof + 30, right + 18, roof + 30);
    } else if (id === 'blackout') {
      g.lineStyle(2, style.edge, .16).lineBetween(left + 14, roof, right - 14, roof - 28);
      g.fillStyle(style.edge, .1).fillRect(left + 20, roof + 18, Math.max(20, w - 40), 3);
    } else if (id === 'signal-storm') {
      g.lineStyle(2, style.edge, .13).lineBetween(left + 12, roof + 8, right - 12, roof - 34);
      g.lineStyle(1, style.bright, .14).lineBetween(left + 20, roof + 32, right - 20, roof + 32);
      g.fillStyle(style.bright, .12).fillCircle(center, roof + 8, Math.min(22, w * .12));
    } else if (id === 'corporate-lockdown' || id === 'final-relay') {
      g.fillStyle(style.edge, .09).fillRect(left + 16, roof + 24, w - 32, 38);
      g.fillStyle(style.bright, .16).fillRect(left + 24, roof + 34, Math.max(20, w - 48), 4);
      g.lineStyle(1, style.edge, .13).strokeRect(left + 12, roof + 14, w - 24, 64);
    } else {
      // Old-quarter / pursuit language: awnings, cables and roof rails.
      g.fillStyle(style.accent, .1).fillRect(left + 16, roof + 34, Math.max(18, w * .28), 10);
      g.lineStyle(1, style.edge, .13).lineBetween(left + 10, roof + 18, right - 10, roof + 18);
    }
  }

  // A second, very distant contour layer makes the skyline feel deeper without
  // adding another object per building. It sits behind the main facade layer.
  const far = scene.add.graphics().setScrollFactor(.24).setDepth(0);
  for (let x = -260, i = 0; x < scene.worldWidth + 420; x += 170, i += 1) {
    const h = 78 + ((i * 37) % 96);
    const w = 92 + ((i * 29) % 76);
    far.fillStyle(style.dark, .28).fillRect(x, base - h + 22, w, h);
    far.fillStyle(style.edge, .055).fillRect(x + 12, base - h + 36, w - 24, 3);
  }

  // Atmospheric horizon bands: static, subtle and cheap.
  const haze = scene.add.graphics().setScrollFactor(.35).setDepth(2);
  haze.fillStyle(style.edge, .025).fillRect(-200, 470, scene.worldWidth + 500, 105);
  haze.fillStyle(style.bright, .018).fillRect(-200, 525, scene.worldWidth + 500, 52);

  return { main: g, far, haze };
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
    if (state.background?.main) state.background.main.destroy();
    if (state.background?.far) state.background.far.destroy();
    if (state.background?.haze) state.background.haze.destroy();
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
