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
  const g = scene.add.graphics().setScrollFactor(.5).setDepth(1);
  const id = scene.mission?.id || '';
  const spacing = 210;

  for (let x = -120, i = 0; x < scene.worldWidth + 260; x += spacing, i += 1) {
    const h = 100 + (i % 4) * 38;
    const w = 118 + (i % 3) * 28;
    const base = 610;
    g.fillStyle(style.dark, .58).fillRect(x, base - h, w, h);
    g.fillStyle(style.accent, .12).fillRect(x + 10, base - h + 12, w - 20, 5);

    if (id === 'dead-drop') {
      g.fillStyle(style.accent, .12).fillRect(x + w * .2, base - h - 18, w * .6, 18);
      g.lineStyle(2, style.edge, .16).lineBetween(x + w * .5, base - h - 18, x + w * .5, base - h - 62);
    } else if (id === 'blackout' || id === 'signal-storm') {
      g.lineStyle(2, style.edge, .14).lineBetween(x + 18, base - h, x + w - 18, base - h - 24);
      g.lineStyle(1, style.bright, .13).lineBetween(x + 26, base - h + 28, x + w - 26, base - h + 28);
    } else if (id === 'corporate-lockdown' || id === 'final-relay') {
      g.fillStyle(style.edge, .08).fillRect(x + 14, base - h + 26, w - 28, 34);
      g.fillStyle(style.bright, .13).fillRect(x + 22, base - h + 34, Math.max(18, w - 44), 4);
    } else {
      g.fillStyle(style.edge, .1).fillRect(x + 18, base - h + 24, 10, 8).fillRect(x + w - 30, base - h + 24, 10, 8);
    }
  }
  return g;
}

function platformLandFeedback(scene) {
  if (reduced(scene) || !scene.player?.body) return;
  const ring = scene.add.circle(scene.player.x, scene.player.y + 27, 9, getStyle(scene).edge, .22).setDepth(11);
  scene.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 180, onComplete: () => ring.destroy() });
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
  const state = { style, platforms: [], barriers: [], background: null, lastGrounded: Boolean(scene.wasGrounded) };
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
      if (!scene.active) return;
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
    state.background?.destroy?.();
    stateByScene.delete(scene);
  });
}

function update(scene) {
  const state = stateByScene.get(scene);
  if (!state || !scene.player?.active) return;
  const grounded = Boolean(scene.wasGrounded);
  if (grounded && !state.lastGrounded) platformLandFeedback(scene);
  state.lastGrounded = grounded;
}

function install() {
  if (window.__relayUpdate10WorldVariation) return;
  window.__relayUpdate10WorldVariation = true;

  const ready = event => {
    const scene = event?.detail?.scene || window.__relayRunnerScene;
    if (scene) setup(scene);
  };
  window.addEventListener('relay:runner-scene-ready', ready);

  if (window.__relayRunnerScene) setup(window.__relayRunnerScene);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
