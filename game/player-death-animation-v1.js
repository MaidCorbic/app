import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 07 — visual-only death presentation.
// The existing fail()/respawn/game-over lifecycle remains authoritative.
(() => {
  if (window.__relayPlayerDeathAnimationV1) return;
  window.__relayPlayerDeathAnimationV1 = true;

  const originalFail = RunnerScene.prototype.fail;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.update = function playerDeathAnimationV1Update(...args) {
    // Once death starts, stop gameplay input/state from moving the player while
    // Phaser tweens finish the death presentation. The real fail() lifecycle runs after it.
    if (this.__deathAnimationActive) return;

    // Falling below the visible world is an immediate death condition. Do not let
    // the runner walk/slide along the bottom edge before the death sequence starts.
    if (!this.finished && !this.respawning && this.player?.active) {
      const bottom = this.cameras.main?.worldView?.bottom ?? this.scale.height;
      if (this.player.y > bottom + 90) {
        this.fail('The courier fell out of the relay route.');
        return;
      }
    }

    return originalUpdate.apply(this, args);
  };

  RunnerScene.prototype.fail = function playerDeathAnimationV1(message) {
    if (this.briefingProtected || this.finished || this.respawning || this.respawnGrace > 0 || this.__deathAnimationActive) return;

    this.__deathAnimationActive = true;

    // Freeze every player input source immediately. Physics pause alone does not
    // stop Scene.update from changing velocity, so explicitly zero the body too.
    this.physics.pause();
    this.player.body?.setVelocity(0, 0);
    this.mobileDirection = null;
    Object.keys(this.mobileActions || {}).forEach(key => { this.mobileActions[key] = false; });

    const startX = this.player.x;
    const startY = this.player.y;
    const direction = this.player.flipX ? -1 : 1;
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

    if (reduced) {
      this.tweens.add({ targets: deathLabel, alpha: 0, y: deathLabel.y - 10, duration: 260 });
      this.tweens.add({ targets: pulse, scale: 1.8, alpha: 0, duration: 260 });
      this.time.delayedCall(280, () => {
        cleanup();
        originalFail.call(this, message);
      });
      return;
    }

    // Stronger death presentation: a short recoil, controlled fall, rotation,
    // fade and expanding impact ring. No new sprite asset is required.
    this.player.setVelocity(0, 0);
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
