import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 07 FINAL — deterministic player death/respawn.
(() => {
  if (window.__relayPlayerDeathAnimationV1Final) return;
  window.__relayPlayerDeathAnimationV1Final = true;

  const originalUpdate = RunnerScene.prototype.update;
  const originalFail = RunnerScene.prototype.fail;
  const originalRespawnCheckpoint = RunnerScene.prototype.respawnCheckpoint;
  const SPAWN_SHIELD_MS = 10000;
  const WORLD_BOTTOM_MARGIN = 24;
  const SPIKE_WIDTH = 34;

  const resetInput = scene => {
    scene.mobileDirection = null;
    Object.keys(scene.mobileActions || {}).forEach(key => { scene.mobileActions[key] = false; });
    scene.player?.body?.setAcceleration(0, 0).setVelocity(0, 0);
  };

  const makeVoidVisual = scene => {
    if (scene.__finalVoidVisual || !scene.player?.active) return;
    const bounds = scene.physics?.world?.bounds;
    if (!bounds) return;
    const width = Math.max(Number(bounds.width) || 0, Number(scene.worldWidth) || 2400);
    const y = Number(bounds.bottom) - 2;
    const g = scene.add.graphics().setDepth(4);
    g.fillStyle(0x070c17, .96).fillRect(bounds.left, y - 8, width, 42);
    for (let x = bounds.left; x < bounds.right + SPIKE_WIDTH; x += SPIKE_WIDTH) {
      g.fillStyle(0x172238, 1);
      g.fillTriangle(x, y + 24, x + SPIKE_WIDTH / 2, y - 2, x + SPIKE_WIDTH, y + 24);
      g.lineStyle(2, 0xff826e, .95);
      g.strokeTriangle(x, y + 24, x + SPIKE_WIDTH / 2, y - 2, x + SPIKE_WIDTH, y + 24);
    }
    scene.__finalVoidVisual = g;
  };

  const startVoidDeath = scene => {
    if (scene.__finalDeathLock || scene.finished || scene.respawning || !scene.player?.active) return;
    scene.__finalDeathLock = true;
    scene.__forceVoidDeath = true;
    makeVoidVisual(scene);
    resetInput(scene);
    scene.player.setAngle(0).setAlpha(1).setScale(1).clearTint().play('runner-hit', true);
    const ring = scene.add.circle(scene.player.x, scene.player.y + 22, 12, 0xff826e, .22).setStrokeStyle(2, 0xff826e, .9).setDepth(18);
    scene.tweens.add({ targets: ring, scale: 3.4, alpha: 0, duration: 220, onComplete: () => ring.destroy() });
    if (!scene.motionReduced) scene.shake(120, .006);
    scene.time.delayedCall(220, () => {
      scene.__finalDeathLock = false;
      originalFail.call(scene, 'The courier fell into the relay void.');
    });
  };

  RunnerScene.prototype.update = function finalDeathUpdate(time, delta) {
    if (this.__finalDeathLock) { resetInput(this); return; }
    if (!this.finished && !this.respawning && this.player?.active) {
      makeVoidVisual(this);
      const bounds = this.physics?.world?.bounds;
      const bodyBottom = Number(this.player.body?.bottom ?? (this.player.y + 28));
      const bottomLimit = Number(bounds?.bottom);
      const fellBeyondRoute = Number(this.player.y) >= 760;
      const reachedWorldBottom = Number.isFinite(bottomLimit) && bodyBottom >= bottomLimit - WORLD_BOTTOM_MARGIN;
      if (fellBeyondRoute || reachedWorldBottom) { startVoidDeath(this); return; }
    }
    return originalUpdate.call(this, time, delta);
  };

  RunnerScene.prototype.fail = function finalDeathFail(message) {
    const forcedVoid = Boolean(this.__forceVoidDeath);
    if (this.briefingProtected || this.finished || this.respawning || this.__finalDeathLock) return;
    if (!forcedVoid && this.respawnGrace > 0) return;
    this.__forceVoidDeath = false;

    const isVoid = /void|fell|fall|bottom|rain/i.test(String(message));
    if (isVoid) {
      this.__finalDeathLock = true;
      resetInput(this);
      this.player?.setAngle(0).setScale(1).setAlpha(1).clearTint().play('runner-hit', true);
      if (!this.motionReduced) this.shake(140, .007);
      this.game.events.emit('feedback', 'death');
      this.time.delayedCall(160, () => { this.__finalDeathLock = false; originalFail.call(this, message); });
      return;
    }

    this.__finalDeathLock = true;
    resetInput(this);
    const startX = this.player.x;
    const startY = this.player.y;
    const direction = this.player.flipX ? -1 : 1;
    this.player.play('runner-hit', true).setTint(0xff826e);
    const label = this.add.text(startX, startY - 62, 'SIGNAL LOST', { fontFamily: 'DM Mono', fontSize: '13px', color: '#ff9b8b', stroke: '#08101c', strokeThickness: 5, letterSpacing: 1 }).setOrigin(.5).setDepth(20).setScrollFactor(0);
    const pulse = this.add.circle(startX, startY + 8, 16, 0xff826e, .18).setStrokeStyle(2, 0xff826e, .55).setDepth(19);
    this.tweens.add({ targets: this.player, x: startX - direction * 26, y: startY + 30, angle: direction * 105, scaleX: .82, scaleY: .82, alpha: 0, duration: 420, ease: 'Cubic.in' });
    this.tweens.add({ targets: label, y: label.y - 28, alpha: 0, duration: 420 });
    this.tweens.add({ targets: pulse, scale: 3.4, alpha: 0, duration: 400, onComplete: () => pulse.destroy() });
    if (!this.motionReduced) this.shake(150, .008);
    this.game.events.emit('feedback', 'death');
    this.time.delayedCall(440, () => { label.destroy(); this.__finalDeathLock = false; originalFail.call(this, message); });
  };

  RunnerScene.prototype.respawnCheckpoint = function finalRespawn(...args) {
    const result = originalRespawnCheckpoint.apply(this, args);
    this.__finalDeathLock = false;
    this.__forceVoidDeath = false;
    resetInput(this);
    this.player?.setPosition(this.checkpoint?.x ?? this.player.x, this.checkpoint?.y ?? this.player.y);
    this.player?.body?.reset(this.player.x, this.player.y);
    this.player?.body?.setVelocity(0, 0).setAcceleration(0, 0);
    this.player?.setAngle(0).setRotation(0).setScale(1).setAlpha(1).clearTint().setFlipY(false).play('runner-idle', true);
    this.healthInvulnerable = SPAWN_SHIELD_MS;
    this.respawnGrace = SPAWN_SHIELD_MS;
    this.playerCue('SAFE SPAWN · 10 SEC SHIELD', '#b9f5ff');
    return result;
  };
})();