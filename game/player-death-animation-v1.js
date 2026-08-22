import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 27 FINAL — deterministic, readable player death/respawn.
(() => {
  if (window.__relayPlayerDeathAnimationV1Final) return;
  window.__relayPlayerDeathAnimationV1Final = true;

  const originalUpdate = RunnerScene.prototype.update;
  const originalFail = RunnerScene.prototype.fail;
  const originalRespawnCheckpoint = RunnerScene.prototype.respawnCheckpoint;
  const SPAWN_SHIELD_MS = 10000;
  const WORLD_BOTTOM_MARGIN = 14;
  const SPIKE_WIDTH = 34;
  const DEATH_REVEAL_MS = 720;
  const VOID_FAIL_DELAY_MS = 220;

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

    const startX = Number(scene.player.x) || 0;
    const startY = Number(scene.player.y) || 0;
    const direction = scene.player.flipX ? -1 : 1;
    scene.player.setAngle(0).setAlpha(1).setScale(1).clearTint().play('runner-hit', true);

    const label = scene.add.text(startX, startY - 62, 'SIGNAL LOST', {
      fontFamily: 'DM Mono', fontSize: '13px', color: '#ff9b8b', stroke: '#08101c', strokeThickness: 5, letterSpacing: 1
    }).setOrigin(.5).setDepth(20).setScrollFactor(0);
    const ring = scene.add.circle(startX, startY + 22, 12, 0xff826e, .22)
      .setStrokeStyle(2, 0xff826e, .9).setDepth(18);

    scene.tweens.add({
      targets: scene.player,
      x: startX - direction * 18,
      y: startY + 74,
      angle: direction * 82,
      scaleX: .86,
      scaleY: .86,
      alpha: .12,
      duration: DEATH_REVEAL_MS,
      ease: 'Cubic.in'
    });
    scene.tweens.add({ targets: label, y: label.y - 26, alpha: 0, duration: DEATH_REVEAL_MS - 40, ease: 'Quad.out' });
    scene.tweens.add({ targets: ring, scale: 3.8, alpha: 0, duration: 520, onComplete: () => ring.destroy() });
    if (!scene.motionReduced) scene.shake(170, .008);
    thisSafeFeedback(scene);

    scene.time.delayedCall(DEATH_REVEAL_MS, () => {
      label.destroy();
      scene.__finalDeathLock = false;
      scene.fail('The courier fell into the relay void.');
    });
  };

  function thisSafeFeedback(scene) {
    try { scene.game.events.emit('feedback', 'death'); } catch {}
    try { scene.playerCue?.('SIGNAL LOST', '#ff9b8b'); } catch {}
  }

  RunnerScene.prototype.update = function finalDeathUpdate(time, delta) {
    if (this.__finalDeathLock) { resetInput(this); return; }
    if (!this.finished && !this.respawning && this.player?.active) {
      makeVoidVisual(this);
      const bounds = this.physics?.world?.bounds;
      const bodyBottom = Number(this.player.body?.bottom ?? (this.player.y + 28));
      const bottomLimit = Number(bounds?.bottom);
      // Do not use a hard-coded Y=760 cutoff: that caused premature/random-looking deaths.
      const reachedWorldBottom = Number.isFinite(bottomLimit)
        ? bodyBottom >= bottomLimit - WORLD_BOTTOM_MARGIN
        : Number(this.player.y) >= 900;
      if (reachedWorldBottom) { startVoidDeath(this); return; }
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
      sceneDeathLock(this);
      resetInput(this);
      this.player?.setAngle(0).setScale(1).setAlpha(1).clearTint().play('runner-hit', true);
      if (!this.motionReduced) this.shake(150, .007);
      thisSafeFeedback(this);
      this.time.delayedCall(VOID_FAIL_DELAY_MS, () => {
        this.__finalDeathLock = false;
        const savedRespawnGrace = this.respawnGrace;
        const savedHealthInvulnerable = this.healthInvulnerable;
        this.respawnGrace = 0;
        this.healthInvulnerable = 0;
        try { originalFail.call(this, message); }
        finally {
          this.respawnGrace = savedRespawnGrace;
          this.healthInvulnerable = savedHealthInvulnerable;
        }
      });
      return;
    }

    sceneDeathLock(this);
    resetInput(this);
    const startX = this.player.x;
    const startY = this.player.y;
    const direction = this.player.flipX ? -1 : 1;
    this.player.play('runner-hit', true).setTint(0xff826e);
    const label = this.add.text(startX, startY - 62, 'SIGNAL LOST', { fontFamily: 'DM Mono', fontSize: '13px', color: '#ff9b8b', stroke: '#08101c', strokeThickness: 5, letterSpacing: 1 }).setOrigin(.5).setDepth(20).setScrollFactor(0);
    const pulse = this.add.circle(startX, startY + 8, 16, 0xff826e, .18).setStrokeStyle(2, 0xff826e, .55).setDepth(19);
    this.tweens.add({ targets: this.player, x: startX - direction * 26, y: startY + 30, angle: direction * 105, scaleX: .82, scaleY: .82, alpha: 0, duration: DEATH_REVEAL_MS, ease: 'Cubic.in' });
    this.tweens.add({ targets: label, y: label.y - 28, alpha: 0, duration: DEATH_REVEAL_MS });
    this.tweens.add({ targets: pulse, scale: 3.4, alpha: 0, duration: 600, onComplete: () => pulse.destroy() });
    if (!this.motionReduced) this.shake(170, .008);
    thisSafeFeedback(this);
    this.time.delayedCall(DEATH_REVEAL_MS, () => { label.destroy(); this.__finalDeathLock = false; originalFail.call(this, message); });
  };

  function sceneDeathLock(scene) { scene.__finalDeathLock = true; }

  RunnerScene.prototype.respawnCheckpoint = function finalRespawn(...args) {
    const result = originalRespawnCheckpoint.apply(this, args);
    this.__finalDeathLock = false;
    this.__forceVoidDeath = false;
    resetInput(this);
    const checkpointX = Number.isFinite(Number(this.checkpoint?.x)) ? Number(this.checkpoint.x) : this.player?.x;
    const checkpointY = Number.isFinite(Number(this.checkpoint?.y)) ? Number(this.checkpoint.y) : this.player?.y;
    this.player?.setPosition(checkpointX, checkpointY);
    this.player?.body?.reset(checkpointX, checkpointY);
    this.player?.body?.setVelocity(0, 0).setAcceleration(0, 0).setMaxVelocity(460, 1120);
    this.player?.setAngle(0).setRotation(0).setScale(1).setAlpha(1).clearTint().setFlipY(false).play('runner-idle', true);
    this.healthInvulnerable = SPAWN_SHIELD_MS;
    this.respawnGrace = SPAWN_SHIELD_MS;
    this.playerCue('SAFE SPAWN · 10 SEC SHIELD', '#b9f5ff');
    return result;
  };
})();
