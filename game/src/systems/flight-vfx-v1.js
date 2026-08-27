import Phaser from 'phaser';

const ACTIVE_STATES = new Set(['flying', 'hover']);
const VFX_STEP_MS = 55;
const MAX_TRAIL_POINTS = 10;

function installFlightVfx(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__flightVfxV1) return;
  RunnerScene.prototype.__flightVfxV1 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate?.apply(this, args);
    this.__flightVfx = {
      lastEmitAt: 0,
      points: [],
      objects: [],
      enabled: true,
      state: 'grounded',
    };
    this.__flightVfxStateHandler = state => {
      const vfx = this.__flightVfx;
      if (!vfx) return;
      vfx.state = state;
      if (!ACTIVE_STATES.has(state)) this.clearFlightVfx?.();
    };
    this.game?.events?.on?.('flight-state', this.__flightVfxStateHandler);
    return result;
  };

  RunnerScene.prototype.spawnFlightTrail = function () {
    const vfx = this.__flightVfx;
    const player = this.player;
    if (!vfx?.enabled || !player?.active || !this.add) return;
    const now = performance.now();
    if (now - vfx.lastEmitAt < VFX_STEP_MS) return;
    vfx.lastEmitAt = now;

    const direction = player.flipX ? 1 : -1;
    const x = player.x + direction * 12;
    const y = player.y + 18;
    const speed = Math.min(1, Math.abs(Number(player.body?.velocity?.y) || 0) / 260);
    const size = 4 + speed * 4;
    const alpha = vfx.state === 'hover' ? 0.42 : 0.28;

    const glow = this.add.circle(x, y, size, 0x8df4ff, alpha).setDepth(7);
    vfx.objects.push(glow);
    this.tweens.add({
      targets: glow,
      x: x - direction * (14 + speed * 12),
      y: y + 5,
      scale: 0.15,
      alpha: 0,
      duration: 260,
      ease: 'Quad.out',
      onComplete: () => glow.destroy(),
    });

    const point = { x, y, t: now };
    vfx.points.push(point);
    if (vfx.points.length > MAX_TRAIL_POINTS) vfx.points.shift();
  };

  RunnerScene.prototype.clearFlightVfx = function () {
    const vfx = this.__flightVfx;
    if (!vfx) return;
    vfx.points.length = 0;
    vfx.objects = vfx.objects.filter(item => item?.active);
    vfx.objects.forEach(item => item.destroy());
    vfx.objects.length = 0;
  };

  RunnerScene.prototype.updateFlightVfx = function () {
    const vfx = this.__flightVfx;
    const state = this.getFlightState?.()?.state;
    if (!vfx || !this.player?.active) return;
    if (state && vfx.state !== state) vfx.state = state;
    if (ACTIVE_STATES.has(vfx.state)) this.spawnFlightTrail?.();
  };

  RunnerScene.prototype.shutdownFlightVfx = function () {
    this.clearFlightVfx?.();
    if (this.__flightVfxStateHandler) this.game?.events?.off?.('flight-state', this.__flightVfxStateHandler);
    this.__flightVfxStateHandler = null;
    this.__flightVfx = null;
  };

  RunnerScene.prototype.update = function (time, delta) {
    const result = originalUpdate?.call(this, time, delta);
    this.updateFlightVfx?.();
    return result;
  };
}

export { installFlightVfx };
