import Phaser from 'phaser';
import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 07 — REAL IN-GAME DAY/NIGHT + WEATHER
// Presentation-only patch. It does not own movement, combat, respawn, missions, save state or input.
(() => {
  if (window.__relayDynamicTimeCycleV5) return;
  window.__relayDynamicTimeCycleV5 = true;

  const CYCLE_MS = 90_000;
  const START_HOUR = 6;
  const DAY_MINUTES = 1440;
  const OLD_DOM = ['relayTimeShade', 'relayTimeIndicator', 'relaySkyAtmosphere', 'relaySkyCelestial', 'relaySkyStars', 'relaySkyClouds'];
  OLD_DOM.forEach(id => document.getElementById(id)?.remove());

  const originalCreateEnvironment = RunnerScene.prototype.createEnvironment;
  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  const palettes = [
    { h: 0, top: 0x020713, mid: 0x061426, horizon: 0x0d2942, ground: 0x07101a, glow: 0x4b8fc7 },
    { h: 5, top: 0x11182b, mid: 0x43546d, horizon: 0xcf826d, ground: 0x1b1720, glow: 0xff9067 },
    { h: 6, top: 0x2f5270, mid: 0x7f7883, horizon: 0xe8a279, ground: 0x24212a, glow: 0xffad6b },
    { h: 7, top: 0x486f8c, mid: 0xa49599, horizon: 0xefc19b, ground: 0x2e353c, glow: 0xffc584 },
    { h: 10, top: 0x67a3c2, mid: 0xb5d1d7, horizon: 0xe7e2d6, ground: 0x3a474c, glow: 0xffe7b7 },
    { h: 12, top: 0x79b4d3, mid: 0xc3dde3, horizon: 0xf0ecd9, ground: 0x42565c, glow: 0xfff3ca },
    { h: 15, top: 0x6fa8c9, mid: 0xbdd0d3, horizon: 0xead9c1, ground: 0x45535a, glow: 0xffdcad },
    { h: 18, top: 0x60445c, mid: 0xae6e72, horizon: 0xef9a6a, ground: 0x24171f, glow: 0xff945b },
    { h: 19, top: 0x2b2640, mid: 0x684866, horizon: 0xa95b6a, ground: 0x14101a, glow: 0xc57577 },
    { h: 20, top: 0x050b18, mid: 0x0a1a2f, horizon: 0x163b56, ground: 0x06101a, glow: 0x5e9fd0 },
    { h: 24, top: 0x020713, mid: 0x061426, horizon: 0x0d2942, ground: 0x07101a, glow: 0x4b8fc7 },
  ];

  const weatherAt = hour => {
    if (hour >= 5 && hour < 8) return { name: 'DAWN MIST', color: 0xffa477, rain: false, alpha: .06 };
    if (hour >= 8 && hour < 12) return { name: 'DAY CLEAR', color: 0x9edcff, rain: false, alpha: .025 };
    if (hour >= 12 && hour < 17) return { name: 'MIDDAY CLEAR', color: 0xfff0be, rain: false, alpha: .018 };
    if (hour >= 17 && hour < 20) return { name: 'SUNSET BREEZE', color: 0xff9d6d, rain: false, alpha: .055 };
    return { name: 'NIGHT RAIN', color: 0x6d8faa, rain: true, alpha: .07 };
  };

  const phaseAt = hour => {
    if (hour >= 5 && hour < 8) return 'DAWN';
    if (hour >= 8 && hour < 11) return 'MORNING';
    if (hour >= 11 && hour < 15) return 'MIDDAY';
    if (hour >= 15 && hour < 18) return 'AFTERNOON';
    if (hour >= 18 && hour < 20) return 'SUNSET';
    return 'NIGHT';
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const mixColor = (a, b, t) => {
    const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t));
    const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
    const bl = Math.round(lerp(a & 255, b & 255, t));
    return (r << 16) | (g << 8) | bl;
  };

  const paletteAt = hour => {
    const h = ((hour % 24) + 24) % 24;
    for (let i = 0; i < palettes.length - 1; i += 1) {
      const a = palettes[i];
      const b = palettes[i + 1];
      if (h >= a.h && h <= b.h) {
        const t = (h - a.h) / Math.max(.001, b.h - a.h);
        return {
          top: mixColor(a.top, b.top, t), mid: mixColor(a.mid, b.mid, t),
          horizon: mixColor(a.horizon, b.horizon, t), ground: mixColor(a.ground, b.ground, t), glow: mixColor(a.glow, b.glow, t),
        };
      }
    }
    return palettes[0];
  };

  RunnerScene.prototype.createEnvironment = function dynamicEnvironment(...args) {
    originalCreateEnvironment.apply(this, args);
    // The original scene creates one large fixed sky Graphics object first. Hide only that object;
    // all authored skyline/buildings/landmarks remain untouched.
    const fixedSky = this.children.list.find(child => {
      if (!child?.getBounds || child.type !== 'Graphics') return false;
      if (child.scrollFactorX !== 0 || child.scrollFactorY !== 0) return false;
      const b = child.getBounds();
      return b.width >= 1450 && b.height >= 690;
    });
    fixedSky?.setVisible(false);
  };

  const makeHud = () => {
    const play = document.getElementById('play');
    if (!play) return null;
    const style = document.createElement('style');
    style.dataset.relayTimeV5 = '1';
    style.textContent = `#relayTimeIndicator{position:absolute;top:88px;right:18px;z-index:120;min-width:170px;padding:8px 11px;border:1px solid rgba(141,244,255,.38);border-radius:9px;background:rgba(5,12,24,.88);box-shadow:0 0 18px rgba(25,200,245,.08),inset 0 0 14px rgba(141,244,255,.04);color:#f4fbff;font:700 10px/1.15 "DM Mono",ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.11em;text-align:right;pointer-events:none;text-transform:uppercase;backdrop-filter:blur(7px)}#relayTimeIndicator .name{display:block;font-size:11px;letter-spacing:.16em}#relayTimeIndicator .clock{display:block;margin-top:4px;opacity:.8;font-size:9px}#relayTimeIndicator .weather{display:block;margin-top:4px;color:#8df4ff;font-size:9px;letter-spacing:.08em}@media(max-width:700px){#relayTimeIndicator{top:76px;right:9px;min-width:142px;padding:7px 9px}}@media(max-width:420px){#relayTimeIndicator{top:72px;right:7px;min-width:128px}}`;
    document.head.appendChild(style);
    const el = document.createElement('div');
    el.id = 'relayTimeIndicator';
    el.innerHTML = '<span class="name">☀ <span data-time-name>DAWN</span></span><span class="clock" data-time-clock>06:00 · CYCLE 01</span><span class="weather" data-time-weather>DAWN MIST</span>';
    play.appendChild(el);
    return el;
  };

  RunnerScene.prototype.create = function dynamicCreate(...args) {
    const result = originalCreate.apply(this, args);
    this.__relayTimeMs = 0;
    this.__relayTimeCycle = 1;
    this.__relayTimeHud = makeHud();
    const width = this.cameras.main.width || 1280;
    const height = this.cameras.main.height || 720;

    // These are real Phaser objects inside the game canvas, not DOM overlays.
    this.__relaySky = this.add.graphics().setScrollFactor(0).setDepth(-20);
    this.__relayStars = this.add.graphics().setScrollFactor(0).setDepth(-19);
    this.__relayClouds = this.add.graphics().setScrollFactor(0).setDepth(-18);
    this.__relaySun = this.add.circle(width * .5, height * .2, Math.max(24, Math.min(width, height) * .05), 0xffe7a6, 1).setScrollFactor(0).setDepth(-17);
    this.__relayMoon = this.add.circle(width * .82, height * .2, Math.max(20, Math.min(width, height) * .043), 0xe8ddc2, 1).setScrollFactor(0).setDepth(-17);
    this.__relayMoonGlow = this.add.circle(width * .82, height * .2, Math.max(34, Math.min(width, height) * .07), 0xb8d2e8, .08).setScrollFactor(0).setDepth(-18);
    this.__relayTimeReady = true;
    this.__relayTimeCleanup = () => {
      [this.__relaySky, this.__relayStars, this.__relayClouds, this.__relaySun, this.__relayMoon, this.__relayMoonGlow].forEach(item => item?.destroy());
      this.__relaySky = this.__relayStars = this.__relayClouds = this.__relaySun = this.__relayMoon = this.__relayMoonGlow = null;
      this.__relayTimeHud?.remove();
      this.__relayTimeHud = null;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.__relayTimeCleanup);
    this.__renderRelayTime(0);
    return result;
  };

  RunnerScene.prototype.__renderRelayTime = function renderRelayTime(progress) {
    if (!this.__relayTimeReady) return;
    const totalMinutes = (START_HOUR * 60 + progress * DAY_MINUTES) % DAY_MINUTES;
    const hour = totalMinutes / 60;
    const palette = paletteAt(hour);
    const phase = phaseAt(hour);
    const weather = weatherAt(hour);
    const width = this.cameras.main.width || 1280;
    const height = this.cameras.main.height || 720;

    this.__relaySky.clear();
    this.__relaySky.fillGradientStyle(palette.top, palette.top, palette.horizon, palette.horizon, 1).fillRect(0, 0, width, height);
    this.__relaySky.fillStyle(palette.mid, .75).fillRect(0, height * .34, width, height * .40);
    this.__relaySky.fillStyle(palette.ground, .98).fillRect(0, height * .71, width, height * .29);
    this.__relaySky.fillStyle(palette.glow, .17).fillCircle(width * .5, height * .62, Math.min(width, height) * .34);

    this.__relayStars.clear();
    const night = hour >= 20 || hour < 5;
    if (night) {
      for (let i = 0; i < 48; i += 1) {
        const x = (i * 137) % width;
        const y = 30 + ((i * 67) % Math.max(90, height * .42));
        this.__relayStars.fillStyle(0xdff4ff, .25 + ((i * 17) % 40) / 100).fillCircle(x, y, i % 9 === 0 ? 1.6 : 1);
      }
    }

    this.__relayClouds.clear();
    const cloudAlpha = night ? .10 : phase === 'MIDDAY' ? .26 : .35;
    [0, 1, 2].forEach(i => {
      const x = ((this.__relayTimeMs / 70) + i * width * .43) % (width * 1.35) - width * .15;
      const y = height * (.17 + i * .075);
      this.__relayClouds.fillStyle(0xf2f7f5, cloudAlpha).fillEllipse(x, y, width * (.24 - i * .025), 24 + i * 6);
    });

    const sunVisible = hour >= 5.5 && hour < 19.7;
    const sunP = Phaser.Math.Clamp((hour - 6) / 12, 0, 1);
    const sunX = width * (.08 + sunP * .84);
    const sunY = height * (.70 - Math.sin(sunP * Math.PI) * .60);
    this.__relaySun.setPosition(sunX, sunY).setVisible(sunVisible);
    this.__relaySun.setRadius(Math.max(22, Math.min(width, height) * (hour >= 11 && hour < 15 ? .062 : .05)));
    const warm = hour < 8 || hour >= 17;
    this.__relaySun.setFillStyle(warm ? 0xffad62 : 0xffedab, 1).setAlpha(warm ? .94 : 1);

    const moonVisible = hour >= 19.7 || hour < 5.8;
    const moonP = Phaser.Math.Clamp(hour >= 19.7 ? (hour - 19.7) / 10 : (hour + 4.3) / 10, 0, 1);
    const moonX = width * (.86 - moonP * .72);
    const moonY = height * (.68 - Math.sin(moonP * Math.PI) * .48);
    this.__relayMoon.setPosition(moonX, moonY).setVisible(moonVisible);
    this.__relayMoonGlow.setPosition(moonX, moonY).setVisible(moonVisible);

    this.cameras.main.setBackgroundColor(palette.top);
    this.weatherOverlay?.setFillStyle(weather.color, weather.alpha);
    this.weatherLabel?.setText(`${weather.name} · ${phase}`);
    this.rain?.setVisible(Boolean(this.rainEnabled && weather.rain));

    if (this.__relayTimeHud) {
      const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
      const mm = String(Math.floor(totalMinutes % 60)).padStart(2, '0');
      this.__relayTimeHud.querySelector('[data-time-name]')?.replaceChildren(document.createTextNode(phase));
      this.__relayTimeHud.querySelector('[data-time-clock]')?.replaceChildren(document.createTextNode(`${hh}:${mm} · CYCLE ${String(this.__relayTimeCycle).padStart(2, '0')}`));
      this.__relayTimeHud.querySelector('[data-time-weather]')?.replaceChildren(document.createTextNode(weather.name));
    }
  };

  RunnerScene.prototype.update = function dynamicUpdate(time, delta) {
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
