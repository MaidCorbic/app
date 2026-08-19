// UPDATE 10.4 — CITY BACKDROP REPLACEMENT
// Removes the legacy RunnerScene skyline and previous UPDATE 10 city layers.
// Does not touch platforms, barriers, physics, player, mobile controls, or gameplay state.

const STYLE = {
  'first-delivery': { dark: 0x17253a, mid: 0x243650, glow: 0xffd06e, window: 0xffc875 },
  'dead-drop': { dark: 0x172431, mid: 0x293947, glow: 0xffbd5b, window: 0xffb36a },
  blackout: { dark: 0x0b1728, mid: 0x14283d, glow: 0x5fe8ff, window: 0x8df4ff },
  pursuit: { dark: 0x18243b, mid: 0x2a3854, glow: 0xff826e, window: 0xb9d9ff },
  'signal-storm': { dark: 0x171e38, mid: 0x29355a, glow: 0xb993ff, window: 0xc6b5ff },
  'corporate-lockdown': { dark: 0x182131, mid: 0x303d55, glow: 0xff826e, window: 0xffd06e },
  'final-relay': { dark: 0x181a30, mid: 0x2d3753, glow: 0xffd06e, window: 0xffe0a8 },
};
const FALLBACK = { dark: 0x142235, mid: 0x27364f, glow: 0x8df4ff, window: 0xb9e9ff };
const states = new WeakMap();

function cleanOldCity(scene) {
  // RunnerScene's original distant/middle/foreground city.
  scene.parallaxLayers?.forEach(entry => entry?.layer?.destroy?.());
  scene.parallaxLayers = [];

  // UPDATE 10.x city graphics used dedicated parallax factors.
  // World landmarks normally use scrollFactor 1 and are intentionally preserved.
  const legacyFactors = [0.12, 0.38, 0.72, 0.16, 0.30, 0.44, 0.36];
  scene.children?.list?.slice?.().forEach(child => {
    if (!child?.destroy || child.type !== 'Graphics' || child.getData?.('relayCityLayer')) return;
    const sf = child.scrollFactorX;
    if (legacyFactors.some(value => Math.abs(sf - value) < 0.001)) child.destroy();
  });
}

function drawBuilding(g, x, base, w, h, type, s, seed) {
  const roof = base - h;
  g.fillStyle(s.mid, .98).fillRect(x, roof, w, h);

  if (type === 0) {
    g.fillRect(x + w * .18, roof - 32, w * .64, 32);
    g.fillRect(x + w * .36, roof - 54, w * .28, 22);
    g.lineStyle(2, s.glow, .24).lineBetween(x + w * .5, roof - 54, x + w * .5, roof - 86);
  } else if (type === 1) {
    g.fillRect(x + w * .56, roof + 22, w * .44, h - 22);
    g.fillRect(x - 18, roof + 58, 18, h - 58);
    g.fillStyle(s.glow, .16).fillRect(x + w * .56, roof + 22, 4, h - 22);
  } else if (type === 2) {
    g.fillRect(x - 12, roof + 34, 12, h - 34);
    g.fillRect(x + w, roof + 14, 18, h - 14);
    g.fillStyle(s.glow, .14).fillRect(x + 12, roof + 24, w - 24, 5);
  } else if (type === 3) {
    g.fillRect(x + w * .12, roof - 24, w * .76, 24);
    g.fillRect(x + w * .34, roof - 46, w * .32, 22);
    g.lineStyle(2, s.glow, .18).lineBetween(x + w * .34, roof - 46, x + w * .66, roof - 46);
  } else if (type === 4) {
    g.fillRect(x + w * .08, roof + 28, w * .25, h - 28);
    g.fillRect(x + w * .67, roof + 46, w * .25, h - 46);
    g.fillRect(x + w * .34, roof - 14, w * .32, 14);
  } else {
    g.fillRect(x + w * .22, roof - 18, w * .56, 18);
    g.fillRect(x + w * .40, roof - 40, w * .20, 22);
  }

  g.fillStyle(s.glow, .08).fillRect(x + 10, roof + 12, w - 20, 5);
  g.lineStyle(1, s.glow, .08).lineBetween(x + w * .30, roof + 18, x + w * .30, base);
  g.lineStyle(1, s.glow, .06).lineBetween(x + w * .70, roof + 18, x + w * .70, base);

  const rows = Math.max(2, Math.floor(h / 58));
  const cols = Math.max(2, Math.floor(w / 40));
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const n = (seed * 31 + r * 17 + c * 13) % 9;
      if (n > 3) continue;
      const wx = x + 18 + c * ((w - 36) / Math.max(1, cols - 1));
      const wy = roof + 38 + r * 52;
      g.fillStyle(s.window, n === 0 ? .30 : .15).fillRect(wx, wy, 8, 5);
    }
  }

  g.fillStyle(s.glow, .18).fillRect(x + 14, roof - 5, w - 28, 5);
  if (type === 0 || type === 5) {
    g.lineStyle(2, s.glow, .28).lineBetween(x + w * .5, roof - 5, x + w * .5, roof - 48);
    g.fillStyle(s.glow, .45).fillCircle(x + w * .5, roof - 51, 2);
  } else if (type === 2) {
    g.fillStyle(s.glow, .18).fillCircle(x + 34, roof - 20, 8);
    g.lineStyle(1, s.window, .22).lineBetween(x + 34, roof - 20, x + 34, roof - 48);
  }
}

function createCity(scene) {
  const id = scene.mission?.id || '';
  const s = STYLE[id] || FALLBACK;
  const width = Math.max(800, scene.worldWidth || 800);
  const base = 610;

  const far = scene.add.graphics().setScrollFactor(.14).setDepth(-20);
  const mid = scene.add.graphics().setScrollFactor(.30).setDepth(-18);
  const near = scene.add.graphics().setScrollFactor(.48).setDepth(-16);
  const haze = scene.add.graphics().setScrollFactor(.38).setDepth(-14);
  [far, mid, near, haze].forEach(g => g.setData('relayCityLayer', true));

  // FAR: broad skyline masses, intentionally quiet.
  for (let x = -240, i = 0; x < width + 400; x += 170, i += 1) {
    const w = 90 + ((i * 43) % 80);
    const h = 75 + ((i * 61) % 100);
    const roof = base - h;
    far.fillStyle(s.dark, .60).fillRect(x, roof, w, h);
    if (i % 4 === 0) far.fillRect(x + w * .38, roof - 25, w * .24, 25);
  }

  // MID: main city. Distinct silhouettes and hero architecture, never a second facade.
  for (let x = -180, i = 0; x < width + 360; x += 235, i += 1) {
    const type = (i * 7 + id.length * 3) % 6;
    const w = 135 + ((i * 29) % 75);
    const h = 145 + ((i * 47) % 165);
    drawBuilding(mid, x, base, w, h, type, s, i + id.length);

    if (i % 4 === 1) {
      const hx = x + w * .58;
      mid.fillStyle(s.dark, .99).fillRect(hx, base - h - 62, 58, 62);
      mid.lineStyle(2, s.glow, .30).strokeRect(hx, base - h - 62, 58, 62);
      mid.lineStyle(3, s.glow, .25).lineBetween(hx + 29, base - h - 62, hx + 29, base - h - 120);
      mid.fillStyle(s.window, .24).fillRect(hx + 9, base - h - 48, 40, 5);
    }
    if (i % 5 === 3) {
      const bx = x + w * .18;
      mid.fillStyle(s.dark, .99).fillRect(bx, base - h + 20, 82, 34);
      mid.lineStyle(2, s.glow, .22).strokeRect(bx, base - h + 20, 82, 34);
      mid.fillStyle(s.glow, .20).fillRect(bx + 10, base - h + 32, 62, 5);
    }
  }

  // NEAR: infrastructure only. No full foreground buildings that can hide gameplay.
  for (let x = 120, i = 0; x < width + 300; x += 520, i += 1) {
    const roof = 350 - (i % 2) * 35;
    near.fillStyle(s.dark, .98).fillRect(x, roof, 180, 8);
    near.lineStyle(3, s.glow, .20).lineBetween(x + 20, roof, x + 20, roof - 54);
    near.lineStyle(3, s.glow, .20).lineBetween(x + 160, roof, x + 160, roof - 38);
    near.lineStyle(2, s.glow, .14).lineBetween(x + 20, roof - 54, x + 160, roof - 38);
    if (i % 2 === 0) {
      near.fillStyle(s.dark, .98).fillRect(x + 62, roof - 34, 56, 28);
      near.fillStyle(s.glow, .16).fillRect(x + 70, roof - 24, 40, 4);
    }
  }

  for (let i = 0; i < Math.ceil(width / 600); i += 1) {
    const x = 80 + i * 600;
    near.lineStyle(1, s.glow, .14).lineBetween(x, 300 + (i % 3) * 28, x + 320, 332 + (i % 3) * 28);
  }

  haze.fillStyle(s.dark, .018).fillRect(-300, 500, width + 600, 110);
  return { far, mid, near, haze };
}

function setup(scene) {
  if (!scene || states.has(scene)) return;
  cleanOldCity(scene);
  const state = { city: createCity(scene) };
  states.set(scene, state);
  scene.events?.once?.('shutdown', () => {
    Object.values(state.city || {}).forEach(item => item?.destroy?.());
    states.delete(scene);
  });
}

function install() {
  if (window.__relayCityBackdropReplacement) return;
  window.__relayCityBackdropReplacement = true;
  const ready = event => setup(event?.detail?.scene || window.__relayRunnerScene);
  window.addEventListener('relay:runner-scene-ready', ready);
  if (window.__relayRunnerScene) setup(window.__relayRunnerScene);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
