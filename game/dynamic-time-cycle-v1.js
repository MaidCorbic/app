import Phaser from 'phaser';
import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 07 — dynamic time-of-day presentation.
// Visual only: does not alter gameplay physics, checkpoints, combat or settings.
(() => {
  if (window.__relayDynamicTimeCycleV1) return;
  window.__relayDynamicTimeCycleV1 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  // Short enough to visibly move through a full day during normal play/tests.
  const CYCLE_MS = 90000;
  const PHASES = [
    { at: 0.00, name: 'NIGHT',   color: 0x061126, alpha: 0.34 },
    { at: 0.14, name: 'DAWN',    color: 0x6d4a66, alpha: 0.28 },
    { at: 0.28, name: 'MORNING', color: 0xa97a55, alpha: 0.16 },
    { at: 0.46, name: 'MIDDAY',  color: 0xf4dca6, alpha: 0.03 },
    { at: 0.64, name: 'DUSK',    color: 0x9d5862, alpha: 0.22 },
    { at: 0.82, name: 'NIGHT',   color: 0x061126, alpha: 0.34 },
  ];

  const mix = (a, b, t) => ({
    color: ((Math.round(((a.color >> 16) & 255) * (1 - t) + ((b.color >> 16) & 255) * t) << 16)
      | (Math.round(((a.color >> 8) & 255) * (1 - t) + ((b.color >> 8) & 255) * t) << 8)
      | Math.round((a.color & 255) * (1 - t) + (b.color & 255) * t)),
    alpha: a.alpha * (1 - t) + b.alpha * t,
  });

  const samplePhase = progress => {
    const p = ((progress % 1) + 1) % 1;
    for (let i = 0; i < PHASES.length - 1; i++) {
      const left = PHASES[i];
      const right = PHASES[i + 1];
      if (p >= left.at && p <= right.at) {
        const t = (p - left.at) / (right.at - left.at || 1);
        const value = mix(left, right, t);
        return { ...value, name: t < .5 ? left.name : right.name };
      }
    }
    return PHASES[0];
  };

  RunnerScene.prototype.create = function dynamicTimeCreate(...args) {
    const result = originalCreate.apply(this, args);

    const width = this.scale?.width || 1280;
    const height = this.scale?.height || 720;
    this.__timeCycleOverlay = this.add.rectangle(width / 2, height / 2, width, height, PHASES[0].color, 0)
      .setScrollFactor(0)
      .setDepth(1)
      .setOrigin(.5);

    this.__timeCycleLabel = this.add.text(92, 104, 'NIGHT // 00:00', {
      fontFamily: 'DM Mono',
      fontSize: '10px',
      color: '#dce8f1',
      stroke: '#08101c',
      strokeThickness: 4,
      letterSpacing: 1.1,
      backgroundColor: '#08101c88',
      padding: { left: 7, right: 7, top: 4, bottom: 4 },
    }).setScrollFactor(0).setDepth(19).setAlpha(.82);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.__timeCycleOverlay?.destroy();
      this.__timeCycleOverlay = null;
      this.__timeCycleLabel?.destroy();
      this.__timeCycleLabel = null;
    });

    return result;
  };

  RunnerScene.prototype.update = function dynamicTimeUpdate(time, delta) {
    const result = originalUpdate.apply(this, [time, delta]);

    if (this.__timeCycleOverlay) {
      const elapsed = Number(this.elapsedMs) || 0;
      const progress = (elapsed % CYCLE_MS) / CYCLE_MS;
      const phase = samplePhase(progress);
      this.__timeCycleOverlay.setFillStyle(phase.color, phase.alpha);
      this.__timeCycleOverlay.setAlpha(phase.alpha);
      this.cameras.main?.setBackgroundColor(phase.color);

      const totalMinutes = Math.floor(progress * 24 * 60);
      const hours = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
      const minutes = String(totalMinutes % 60).padStart(2, '0');
      this.__timeCycleLabel?.setText(`${phase.name} // ${hours}:${minutes}`);
    }

    return result;
  };
})();