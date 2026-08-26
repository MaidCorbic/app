export function installEarthquakeCinematic(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__earthquakeCinematicInstalled) return;
  RunnerScene.prototype.__earthquakeCinematicInstalled = true;

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate.apply(this, args);
    if (!this.isFeatureEnabled?.('earthquake')) return result;

    const camera = this.cameras?.main;
    if (!camera || !this.events) return result;

    const audio = kind => window.relayAudioV2?.play?.(kind);
    const flash = (duration, r, g, b, strength = 0.35) => {
      if (typeof camera.flash !== 'function') return;
      camera.flash(duration, r, g, b, false, null, strength);
    };

    const onWarning = () => {
      audio('warning');
      flash(180, 255, 208, 110, 0.28);
    };

    const onStart = () => {
      audio('boss');
      flash(260, 255, 130, 110, 0.48);
      this.tweens?.add({
        targets: camera,
        zoom: 1.018,
        duration: 260,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
    };

    const onAftershock = () => {
      audio('hit');
      flash(160, 255, 145, 110, 0.26);
    };

    const onComplete = () => {
      this.tweens?.add({
        targets: camera,
        zoom: 1,
        duration: 260,
        ease: 'Sine.easeOut',
      });
    };

    this.events.on('earthquake:warning', onWarning);
    this.events.on('earthquake:start', onStart);
    this.events.on('earthquake:aftershock', onAftershock);
    this.events.on('earthquake:complete', onComplete);

    this.events.once('shutdown', () => {
      this.events.off('earthquake:warning', onWarning);
      this.events.off('earthquake:start', onStart);
      this.events.off('earthquake:aftershock', onAftershock);
      this.events.off('earthquake:complete', onComplete);
      camera.zoom = 1;
    });

    return result;
  };
}
