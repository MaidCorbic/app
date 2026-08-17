import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 07 — dynamic time-of-day presentation.
// Purely visual: does not alter gameplay physics, checkpoints, combat or settings.
(() => {
  if (window.__relayDynamicTimeCycleV1) return;
  window.__relayDynamicTimeCycleV1 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  const CYCLE_MS = 240000;
  const PHASES = [
    { at: 0.00, name: 'NIGHT', color: 0x061126, alpha: 0.24 },
    { at: 0.18, name: 'DAWN', color: 0x5a3f66, alpha: 0.18 },
    { at: 0.32, name: 'MORNING', color: 0x8a6f4f, alpha: 0.08 },
    { at: 0.48, name: 'MIDDAY', color: 0xffd48a, alpha: 0.01 },
    { at: 0.65, name: 'DUSK', color: 0x8d4e5d, alpha: 0.13 },
    { at: 0.80, name: 'NIGHT', color: 0x061126, alpha: 0.24 },
  ];

  const mix = (a, b, t) => ({
    color: ((Math.round(((a.color >> 16) & 255) * (1 - t) + ((b.color >> 16) & 255) * t) << 16)
      | (Math.round(((a.color >> 8) & 255) * (1 - t) + ((b.color >> 8) & 255) * t) << 8)
      | Math.round((a.color & 255) * (1 - t) + (b.color & 255) * t)),
    alpha: a.alpha * (1 - t) + b.alpha * t,
  });

  const samplePhase = progress => {
    const p = progress % 1;
    for (let i = 0; i < PHASES.length - 1; i++) {
      const left = PHASES[i];
      const right = PHASES[i + 1];
      if (p >= left.at && p <= right.at) {
        const t = (p - left.at) / (right.at - left.at || 1);
        return { ...mix(left, right, t), name: t < .5 ? left.name : right.name };
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
      .setDepth(18)
      .setOrigin(.5);
    this.__timeCycleOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.__timeCycleLabel = this.add.text(92, 82, 'NIGHT // 00:00', {
      fontFamily: 'DM Mono',
      fontSize: '9px',
      color: '#dce8f1',
      stroke: '#08101c',
      strokeThickness: 3,
      letterSpacing: 1,
    }).setScrollFactor(0).setDepth(19).setAlpha(.52);

    return result;
  };

  RunnerScene.prototype.update = function dynamicTimeUpdate(time, delta) {
    const result = originalUpdate.apply(this, [time, delta]);

    if (this.__timeCycleOverlay && !this.finished) {
      const elapsed = Number(this.elapsedMs) || 0;
      const progress = (elapsed % CYCLE_MS) / CYCLE_MS;
      const phase = samplePhase(progress);
      this.__timeCycleOverlay.fillColor = phase.color;
      this.__timeCycleOverlay.alpha = phase.alpha;

      const totalMinutes = Math.floor(progress * 24 * 60);
      const hours = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
      const minutes = String(totalMinutes % 60).padStart(2, '0');
      this.__timeCycleLabel?.setText(`${phase.name} // ${hours}:${minutes}`);
    }

    return result;
  };
})();
