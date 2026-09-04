import Phaser from 'phaser';
import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 07 — FINAL REAL IN-GAME TIME + WEATHER
// Presentation-only patch. Gameplay, physics, missions, combat, respawn and input stay authoritative in RunnerScene.
(() => {
  if (window.__relayDynamicTimeCycleV6) return;
  window.__relayDynamicTimeCycleV6 = true;

  const CYCLE_MS = 300_000;
  const START_HOUR = 6;
  const MINUTES_PER_DAY = 24 * 60;
  const LEGACY_DOM_IDS = ['relayTimeShade', 'relayTimeIndicator', 'relaySkyAtmosphere', 'relaySkyCelestial', 'relaySkyStars', 'relaySkyClouds'];
  LEGACY_DOM_IDS.forEach(id => document.getElementById(id)?.remove());
  document.getElementById('relayTimeIndicator')?.remove();

  const originalCreateEnvironment = RunnerScene.prototype.createEnvironment;
  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  // Realistic 24h palette. The full in-game clock runs from 06:00 through 05:59 over one 90s cycle.
  const PALETTES = [
    { h: 0,  top: 0x020713, mid: 0x061426, horizon: 0x0d2942, ground: 0x07101a, glow: 0x4b8fc7 },
    { h: 5,  top: 0x11182b, mid: 0x43546d, horizon: 0xcf826d, ground: 0x1b1720, glow: 0xff9067 },
    { h: 6,  top: 0x2f5270, mid: 0x7f7883, horizon: 0xe8a279, ground: 0x24212a, glow: 0xffad6b },
    { h: 7,  top: 0x486f8c, mid: 0xa49599, horizon: 0xefc19b, ground: 0x2e353c, glow: 0xffc584 },
    { h: 10, top: 0x67a3c2, mid: 0xb5d1d7, horizon: 0xe7e2d6, ground: 0x3a474c, glow: 0xffe7b7 },
    { h: 12, top: 0x79b4d3, mid: 0xc3dde3, horizon: 0xf0ecd9, ground: 0x42565c, glow: 0xfff3ca },
    { h: 15, top: 0x6fa8c9, mid: 0xbdd0d3, horizon: 0xead9c1, ground: 0x45535a, glow: 0xffdcad },
    { h: 18, top: 0x60445c, mid: 0xae6e72, horizon: 0xef9a6a, ground: 0x24171f, glow: 0xff945b },
    { h: 19, top: 0x2b2640, mid: 0x684866, horizon: 0xa95b6a, ground: 0x14101a, glow: 0xc57577 },
    { h: 20, top: 0x050b18, mid: 0x0a1a2f, horizon: 0x163b56, ground: 0x06101a, glow: 0x5e9fd0 },
    { h: 24, top: 0x020713, mid: 0x061426, horizon: 0x0d2942, ground: 0x07101a, glow: 0x4b8fc7 },
  ];

  const PHASES = [
    [5, 'DAWN'], [8, 'MORNING'], [11, 'MIDDAY'], [15, 'AFTERNOON'], [18, 'SUNSET'], [20, 'NIGHT']
  ];

  const weatherAt = hour => {
    if (hour >= 5 && hour < 8) return { name: 'DAWN MIST', tint: 0xffa477, alpha: 0.045, rain: false };
    if (hour >= 8 && hour < 12) return { name: 'DAY CLEAR', tint: 0x9edcff, alpha: 0.018, rain: false };
    if (hour >= 12 && hour < 17) return { name: 'MIDDAY CLEAR', tint: 0xfff0be, alpha: 0.012, rain: false };
    if (hour >= 17 && hour < 20) return { name: 'SUNSET BREEZE', tint: 0xff9d6d, alpha: 0.038, rain: false };
    return { name: 'NIGHT RAIN', tint: 0x6d8faa, alpha: 0.06, rain: true };
  };

  const phaseAt = hour => {
    for (let i = PHASES.length - 1; i >= 0; i -= 1) if (hour >= PHASES[i][0]) return PHASES[i][1];
    return 'NIGHT';
  };

  const mixChannel = (a, b, t) => Math.round(a + (b - a) * t);
  const mixColor = (a, b, t) => {
    const r = mixChannel((a >> 16) & 255, (b >> 16) & 255, t);
    const g = mixChannel((a >> 8) & 255, (b >> 8) & 255, t);
    const bl = mixChannel(a & 255, b & 255, t);
    return (r << 16) | (g << 8) | bl;
  };

  const paletteAt = hour => {
    const h = ((hour % 24) + 24) % 24;
    for (let i = 0; i < PALETTES.length - 1; i += 1) {
      const a = PALETTES[i];
      const b = PALETTES[i + 1];
      if (h >= a.h && h <= b.h) {
        const t = (h - a.h) / Math.max(0.001, b.h - a.h);
        return {
          top: mixColor(a.top, b.top, t),
          mid: mixColor(a.mid, b.mid, t),
          horizon: mixColor(a.horizon, b.horizon, t),
          ground: mixColor(a.ground, b.ground, t),
          glow: mixColor(a.glow, b.glow, t),
        };
      }
    }
    return PALETTES[0];
  };

  const hideLegacyCreateEnvironmentGraphics = scene => {
    const before = new Set(scene.__relayChildrenBeforeEnvironment || []);
    scene.children.list.forEach(child => {
      if (before.has(child)) return;
      if (child?.type !== 'Graphics') return;
      // createEnvironment's first Graphics is the fixed 1500x720 sky, while authored parallax
      // layers use non-zero scroll factors. Capture only fixed-scroll graphics created by that method.
      if (child.scrollFactorX === 0 && child.scrollFactorY === 0) child.setVisible(false);
    });
    scene.__relayChildrenBeforeEnvironment = null;
  };

  RunnerScene.prototype.createEnvironment = function relayCreateEnvironment(...args) {
    this.__relayChildrenBeforeEnvironment = this.children.list.slice();
    const result = originalCreateEnvironment.apply(this, args);
    hideLegacyCreateEnvironmentGraphics(this);
    return result;
  };

  const makeHud = () => {
    const play = document.getElementById('play');
    if (!play) return null;
    const style = document.createElement('style');
    style.dataset.relayTimeV6 = '1';
    style.textContent = `
      #relayTimeIndicator{position:absolute;top:88px;right:18px;z-index:120;min-width:170px;padding:8px 11px;border:1px solid rgba(141,244,255,.38);border-radius:9px;background:rgba(5,12,24,.88);box-shadow:0 0 18px rgba(25,200,245,.08),inset 0 0 14px rgba(141,244,255,.04);color:#f4fbff;font:700 10px/1.15 "DM Mono",ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.11em;text-align:right;pointer-events:none;text-transform:uppercase;backdrop-filter:blur(7px)}
      #relayTimeIndicator .name{display:block;font-size:11px;letter-spacing:.16em}
      #relayTimeIndicator .clock{display:block;margin-top:4px;opacity:.8;font-size:9px}
      #relayTimeIndicator .weather{display:block;margin-top:4px;color:#8df4ff;font-size:9px;letter-spacing:.08em}
      @media(max-width:900px){#relayTimeIndicator{top:82px;right:12px;min-width:150px}}
      @media(max-width:700px){#relayTimeIndicator{top:74px;right:9px;min-width:136px;padding:7px 9px}}
      @media(max-width:420px){#relayTimeIndicator{top:70px;right:7px;min-width:126px;font-size:9px}}
    `;
    document.head.appendChild(style);
    document.querySelectorAll('#relayTimeIndicator').forEach(node => node.remove());
    const el = document.createElement('div');
    el.id = 'relayTimeIndicator';
    el.innerHTML = '<span class="name"><span data-time-icon>◐</span> <span data-time-name>DAWN</span></span><span class="clock" data-time-clock>06:00 · CYCLE 01</span><span class="weather" data-time-weather>DAWN MIST</span>';
    play.appendChild(el);
    return el;
  };

  const hideLegacyLabels = scene => {
    scene.weatherLabel?.setVisible(false);
    scene.children.list.forEach(child => {
      if (typeof child?.text === 'string' && child.text.includes('NIGHT RELAY')) child.setVisible(false);
    });
  };

  RunnerScene.prototype.create = function relayCreate(...args) {
    const result = originalCreate.apply(this, args);
    hideLegacyLabels(this);
    this.__relayTimeMs = 0;
    this.__relayTimeCycle = 1;
    this.__relayTimeReady = true;
    this.__relayTimeHud = makeHud();

    const width = Math.max(320, this.scale.width || this.cameras.main.width || 1280);
    const height = Math.max(240, this.scale.height || this.cameras.main.height || 720);

    this.__relaySky = this.add.graphics().setScrollFactor(0).setDepth(-50);
    this.__relayStars = this.add.graphics().setScrollFactor(0).setDepth(-49);
    this.__relayClouds = this.add.graphics().setScrollFactor(0).setDepth(-48);
    this.__relaySun = this.add.circle(width * 0.5, height * 0.2, 42, 0xffe7a6, 1).setScrollFactor(0).setDepth(-47);
    this.__relayMoon = this.add.circle(width * 0.82, height * 0.2, 36, 0xe8ddc2, 1).setScrollFactor(0).setDepth(-47);
    this.__relayMoonGlow = this.add.circle(width * 0.82, height * 0.2, 62, 0xb8d2e8, 0.08).setScrollFactor(0).setDepth(-48);

    this.__relayTimeCleanup = () => {
      [this.__relaySky, this.__relayStars, this.__relayClouds, this.__relaySun, this.__relayMoon, this.__relayMoonGlow].forEach(item => item?.destroy());
      this.__relaySky = this.__relayStars = this.__relayClouds = this.__relaySun = this.__relayMoon = this.__relayMoonGlow = null;
      this.__relayTimeHud?.remove();
      this.__relayTimeHud = null;
      this.__relayTimeReady = false;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.__relayTimeCleanup);

    this.__renderRelayTime(0);
    return result;
  };

  RunnerScene.prototype.__renderRelayTime = function renderRelayTime(progress) {
    if (!this.__relayTimeReady || !this.__relaySky?.active) return;

    const localMinutes = ((START_HOUR * 60 + progress * MINUTES_PER_DAY) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    const hour = localMinutes / 60;
    const palette = paletteAt(hour);
    const phase = phaseAt(hour);
    const weather = weatherAt(hour);
    const width = Math.max(320, this.scale.width || this.cameras.main.width || 1280);
    const height = Math.max(240, this.scale.height || this.cameras.main.height || 720);

    // Full-screen dynamic sky inside the Phaser canvas.
    this.__relaySky.clear();
    this.__relaySky.fillGradientStyle(palette.top, palette.top, palette.horizon, palette.horizon, 1).fillRect(0, 0, width, height);
    this.__relaySky.fillStyle(palette.mid, 0.82).fillRect(0, height * 0.32, width, height * 0.42);
    this.__relaySky.fillStyle(palette.ground, 0.98).fillRect(0, height * 0.70, width, height * 0.30);
    this.__relaySky.fillStyle(palette.glow, 0.15).fillCircle(width * 0.5, height * 0.60, Math.min(width, height) * 0.34);

    // Stars only at night.
    const isNight = hour >= 20 || hour < 5;
    this.__relayStars.clear();
    if (isNight) {
      for (let i = 0; i < 56; i += 1) {
        const x = (i * 137) % width;
        const y = 24 + ((i * 67) % Math.max(100, Math.floor(height * 0.44)));
        this.__relayStars.fillStyle(0xdff4ff, 0.24 + ((i * 17) % 45) / 100).fillCircle(x, y, i % 9 === 0 ? 1.6 : 1);
      }
    }

    // Moving clouds make the sky feel alive without adding DOM animation.
    this.__relayClouds.clear();
    const cloudAlpha = isNight ? 0.10 : phase === 'MIDDAY' ? 0.24 : 0.32;
    [0, 1, 2].forEach(i => {
      const x = ((this.__relayTimeMs / (68 + i * 11)) + i * width * 0.44) % (width * 1.35) - width * 0.17;
      const y = height * (0.16 + i * 0.075);
      this.__relayClouds.fillStyle(0xf3f7f5, cloudAlpha).fillEllipse(x, y, width * (0.24 - i * 0.02), 22 + i * 6);
    });

    // One sun: 06:00 low-left, 12:00 high-center, 18:00 low-right.
    const sunVisible = hour >= 5.5 && hour < 19.7;
    const sunProgress = Phaser.Math.Clamp((hour - 6) / 12, 0, 1);
    const sunX = width * (0.08 + sunProgress * 0.84);
    const sunY = height * (0.70 - Math.sin(sunProgress * Math.PI) * 0.60);
    this.__relaySun.setPosition(sunX, sunY).setVisible(sunVisible);
    this.__relaySun.setRadius(Math.max(22, Math.min(width, height) * (hour >= 11 && hour < 15 ? 0.062 : 0.050)));
    const warmSun = hour < 8 || hour >= 17;
    this.__relaySun.setFillStyle(warmSun ? 0xffad62 : 0xffedab, 1).setAlpha(warmSun ? 0.94 : 1);

    // One moon: only visible after sunset and before dawn. No crescent layers or duplicate moon.
    const moonVisible = hour >= 19.7 || hour < 5.5;
    const moonProgress = Phaser.Math.Clamp(hour >= 19.7 ? (hour - 19.7) / 9.8 : (hour + 4.3) / 9.8, 0, 1);
    const moonX = width * (0.86 - moonProgress * 0.72);
    const moonY = height * (0.68 - Math.sin(moonProgress * Math.PI) * 0.48);
    this.__relayMoon.setPosition(moonX, moonY).setVisible(moonVisible);
    this.__relayMoonGlow.setPosition(moonX, moonY).setVisible(moonVisible);

    this.cameras.main.setBackgroundColor(palette.top);

    // Keep the existing weather system, but let this time-of-day layer be its authority.
    this.weatherOverlay?.setFillStyle(weather.tint, weather.alpha).setAlpha(weather.alpha);
    this.weatherLabel?.setVisible(false);
    this.rain?.setVisible(Boolean(this.rainEnabled && weather.rain));

    if (this.__relayTimeHud) {
      const hh = String(Math.floor(localMinutes / 60)).padStart(2, '0');
      const mm = String(Math.floor(localMinutes % 60)).padStart(2, '0');
      const icon = phase === 'NIGHT' ? '☾' : phase === 'MIDDAY' ? '☀' : phase === 'SUNSET' ? '◒' : '◐';
      this.__relayTimeHud.querySelector('[data-time-icon]')?.replaceChildren(document.createTextNode(icon));
      this.__relayTimeHud.querySelector('[data-time-name]')?.replaceChildren(document.createTextNode(phase));
      this.__relayTimeHud.querySelector('[data-time-clock]')?.replaceChildren(document.createTextNode(`${hh}:${mm} · CYCLE ${String(this.__relayTimeCycle).padStart(2, '0')}`));
      this.__relayTimeHud.querySelector('[data-time-weather]')?.replaceChildren(document.createTextNode(weather.name));
    }
  };

  RunnerScene.prototype.update = function relayUpdate(time, delta) {
    const result = originalUpdate.apply(this, [time, delta]);
    if (!this.__relayTimeReady) return result;

    const dt = Math.max(0, Number(delta) || 0);
    const previous = this.__relayTimeMs;
    this.__relayTimeMs += dt;
    const previousCycle = Math.floor(previous / CYCLE_MS);
    const currentCycle = Math.floor(this.__relayTimeMs / CYCLE_MS);
    if (currentCycle !== previousCycle) this.__relayTimeCycle = currentCycle + 1;

    this.__renderRelayTime((this.__relayTimeMs % CYCLE_MS) / CYCLE_MS);
    return result;
  };
})();
