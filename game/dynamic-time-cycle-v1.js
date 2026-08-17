import Phaser from 'phaser';
import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 07 FINAL — visible dynamic day cycle.
(() => {
  if (window.__relayDynamicTimeCycleV2) return;
  window.__relayDynamicTimeCycleV2 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const CYCLE_MS = 90000;
  const PHASES = [
    { at: 0.00, name: 'NIGHT', color: 0x061126, alpha: .46 },
    { at: 0.14, name: 'DAWN', color: 0x7a506f, alpha: .36 },
    { at: 0.28, name: 'MORNING', color: 0xb9825d, alpha: .22 },
    { at: 0.46, name: 'MIDDAY', color: 0xf6dfb0, alpha: .07 },
    { at: 0.64, name: 'DUSK', color: 0xa65d67, alpha: .30 },
    { at: 0.82, name: 'NIGHT', color: 0x061126, alpha: .46 },
  ];

  const mixColor = (a, b, t) => (
    (Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t) << 16)
    | (Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t) << 8)
    | Math.round((a & 255) * (1 - t) + (b & 255) * t)
  );

  const sample = progress => {
    const p = ((progress % 1) + 1) % 1;
    for (let i = 0; i < PHASES.length - 1; i += 1) {
      const a = PHASES[i];
      const b = PHASES[i + 1];
      if (p >= a.at && p <= b.at) {
        const t = (p - a.at) / Math.max(.0001, b.at - a.at);
        return { color: mixColor(a.color, b.color, t), alpha: a.alpha * (1 - t) + b.alpha * t, name: t < .5 ? a.name : b.name };
      }
    }
    return PHASES[0];
  };

  RunnerScene.prototype.create = function dynamicTimeCreate(...args) {
    const result = originalCreate.apply(this, args);
    const width = this.scale?.width || 1280;
    const height = this.scale?.height || 720;
    this.__dayClockMs = 0;
    this.__timeCycleOverlay = this.add.rectangle(width / 2, height / 2, width * 1.35, height * 1.35, 0x061126, .46)
      .setScrollFactor(0).setDepth(7).setOrigin(.5);
    this.__timeCycleLabel = this.add.text(width - 14, 18, 'NIGHT · 00:00', {
      fontFamily: 'DM Mono', fontSize: '11px', color: '#f4fbff', stroke: '#08101c', strokeThickness: 4,
      letterSpacing: 1, backgroundColor: '#08101ccc', padding: { left: 8, right: 8, top: 5, bottom: 5 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(30);
    this.__timeCycleSun = this.add.circle(width - 28, 62, 9, 0xffd06e, .9).setScrollFactor(0).setDepth(30);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.__timeCycleOverlay?.destroy(); this.__timeCycleLabel?.destroy(); this.__timeCycleSun?.destroy();
      this.__timeCycleOverlay = null; this.__timeCycleLabel = null; this.__timeCycleSun = null;
    });
    return result;
  };

  RunnerScene.prototype.update = function dynamicTimeUpdate(time, delta) {
    const result = originalUpdate.apply(this, [time, delta]);
    if (!this.__timeCycleOverlay) return result;
    this.__dayClockMs = (Number(this.__dayClockMs) || 0) + Math.max(0, Number(delta) || 0);
    const progress = (this.__dayClockMs % CYCLE_MS) / CYCLE_MS;
    const phase = sample(progress);
    this.__timeCycleOverlay.setFillStyle(phase.color, phase.alpha).setAlpha(phase.alpha);
    this.cameras.main?.setBackgroundColor(phase.color);
    const totalMinutes = Math.floor(progress * 1440);
    const hours = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    this.__timeCycleLabel?.setText(`${phase.name} · ${hours}:${minutes}`);
    const daylight = Math.max(0, Math.sin(progress * Math.PI * 2 - Math.PI / 2));
    this.__timeCycleSun?.setFillStyle(0xffd06e, .3 + daylight * .6).setY(62 - daylight * 28).setScale(.7 + daylight * .7);
    return result;
  };
})();