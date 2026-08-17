import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 07 — player death presentation + safe fall handling.
// The existing fail()/respawn/game-over lifecycle remains authoritative.
(() => {
  if (window.__relayPlayerDeathAnimationV1) return;
  window.__relayPlayerDeathAnimationV1 = true;

  const originalFail = RunnerScene.prototype.fail;
  const originalUpdate = RunnerScene.prototype.update;
  const originalRespawnCheckpoint = RunnerScene.prototype.respawnCheckpoint;

  const SPAWN_PROTECTION_MS = 10000;
  const FALL_KILL_MARGIN = 90;

  const isFallDeath = message => /fell out|fall|void|bottom/i.test(String(message));

  // Keep the player completely frozen while the death presentation is playing.
  RunnerScene.prototype.update = function playerDeathAnimationV1Update(...args) {
    if (this.__deathAnimationActive) {
      this.player?.body?.setVelocity(0, 0);
      this.mobileDirection = null;
      Object.keys(this.mobileActions || {}).forEach(key => { this.mobileActions[key] = false; });
      return;
    }

    if (!this.finished && !this.respawning && this.player?.active) {
      const boundsBottom = Number(this.physics?.world?.bounds?.bottom);
      const cameraBottom = (this.cameras.main?.scrollY || 0) + this.scale.height;
      const killY = Number.isFinite(boundsBottom) && boundsBottom > 200
        ? boundsBottom + FALL_KILL_MARGIN
        : cameraBottom + FALL_KILL_MARGIN;

      // A falling runner must die once below the playable floor. We deliberately
      // use the physics-world bottom first; cameraBottom alone moves with the
      // camera and was the reason the runner could continue underneath platforms.
      if (this.player.y > killY && this.player.body?.velocity?.y > 0) {
        this.fail('The courier fell out of the relay route.');
        return;
      }
    }

    return originalUpdate.apply(this, args);
  };

  // After any normal respawn, restore the player to a clean standing state and
  // give the existing health/damage system a real 10-second spawn shield.
  RunnerScene.prototype.respawnCheckpoint = function playerDeathAnimationV1Respawn(...args) {
    const result = originalRespawnCheckpoint.apply(this, args);

    this.player?.setAngle(0).setScale(1).setAlpha(1).clearTint();
    this.player?.play('runner-idle', true);
    this.player?.body?.setVelocity(0, 0);
    this.respawnGrace = SPAWN_PROTECTION_MS;
    this.healthInvulnerable = SPAWN_PROTECTION_MS;

    // Do not leave the player visually faded for ten seconds. The protection is
    // represented by a clean shield pulse instead.
    const shield = this.add.circle(this.player.x, this.player.y, 24, 0x8df4ff, .2)
      .setStrokeStyle(2, 0xb9f5ff, .65)
      .setDepth(11);
    this.tweens.add({
      targets: shield,
      scale: 2.8,
      alpha: 0,
      duration: 900,
      onComplete: () => shield.destroy(),
    });
    this.playerCue('SAFE SPAWN · 10 SEC SHIELD', '#b9f5ff');
    return result;
  };

  RunnerScene.prototype.fail = function playerDeathAnimationV1(message) {
    if (this.briefingProtected || this.finished || this.respawning || this.respawnGrace > 0 || this.__deathAnimationActive) return;

    this.__deathAnimationActive = true;
    this.physics.pause();
    this.player.body?.setVelocity(0, 0);
    this.mobileDirection = null;
    Object.keys(this.mobileActions || {}).forEach(key => { this.mobileActions[key] = false; });

    const startX = this.player.x;
    const startY = this.player.y;
    const direction = this.player.flipX ? -1 : 1;
    const falling = isFallDeath(message);
    const reduced = Boolean(this.motionReduced);

    this.player.play('runner-hit', true);
    this.player.setTint(0xff826e);

    const deathLabel = this.add.text(startX, startY - 62, 'SIGNAL LOST', {
      fontFamily: 'DM Mono',
      fontSize: '13px',
      color: '#ff9b8b',
      stroke: '#08101c',
      strokeThickness: 5,
      letterSpacing: 1,
    }).setOrigin(.5).setDepth(20).setScrollFactor(0);

    const pulse = this.add.circle(startX, startY + 8, 16, 0xff826e, .18)
      .setStrokeStyle(2, 0xff826e, .55)
      .setDepth(19);

    const cleanup = () => {
      deathLabel.destroy();
      pulse.destroy();
      this.__deathAnimationActive = false;
    };

    if (reduced || falling) {
      // Falling into the void is an immediate clean death: keep the runner
      // upright, stop all movement and do not rotate the sprite.
      this.player.setAngle(0).setScale(1);
      this.tweens.add({
        targets: deathLabel,
        y: deathLabel.y - 22,
        alpha: 0,
        duration: reduced ? 260 : 360,
      });
      this.tweens.add({
        targets: pulse,
        scale: reduced ? 1.8 : 2.8,
        alpha: 0,
        duration: reduced ? 260 : 360,
      });
      this.time.delayedCall(reduced ? 280 : 380, () => {
        cleanup();
        originalFail.call(this, message);
      });
      return;
    }

    // Enemy/hazard death: impact first, then a controlled fall. This is the
    // cinematic death presentation; falling through the route stays upright.
    this.tweens.add({
      targets: this.player,
      x: startX - direction * 28,
      y: startY + 34,
      angle: direction * 105,
      scaleX: .82,
      scaleY: .82,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.in',
    });
    this.tweens.add({
      targets: deathLabel,
      y: deathLabel.y - 30,
      alpha: 0,
      scale: 1.08,
      duration: 500,
      ease: 'Quad.out',
    });
    this.tweens.add({
      targets: pulse,
      scale: 3.8,
      alpha: 0,
      duration: 480,
      ease: 'Quad.out',
    });

    if (!this.motionReduced) this.shake(180, .008);
    this.game.events.emit('feedback', 'death');

    this.time.delayedCall(540, () => {
      cleanup();
      originalFail.call(this, message);
    });
  };
})();
