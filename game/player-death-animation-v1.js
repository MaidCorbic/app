import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 07 — visual-only death presentation.
// The existing fail()/respawn/game-over lifecycle remains authoritative.
(() => {
  if (window.__relayPlayerDeathAnimationV1) return;
  window.__relayPlayerDeathAnimationV1 = true;

  const originalFail = RunnerScene.prototype.fail;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.update = function playerDeathAnimationV1Update(...args) {
    if (this.__deathAnimationActive) return;

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
    this.physics.pause();
    this.player.body?.setVelocity(0, 0);
    this.player.body?.setAcceleration(0, 0);
    this.player.body?.setAllowGravity(false);
    this.mobileDirection = null;
    Object.keys(this.mobileActions || {}).forEach(key => { this.mobileActions[key] = false; });

    const startX = this.player.x;
    const startY = this.player.y;
    const direction = this.player.flipX ? -1 : 1;
    const reduced = Boolean(this.motionReduced);
    const isPitFall = message.includes('fell out of the relay route');

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
        this.player.body?.setAllowGravity(true);
        originalFail.call(this, message);
      });
      return;
    }

    if (isPitFall) {
      // PIT/FALL: the runner remains upright. The route drop itself communicates the fall.
      // No rotation, no sideways tumble, and no walking/sliding at the bottom.
      this.tweens.add({
        targets: this.player,
        y: startY + 26,
        scaleX: .94,
        scaleY: .94,
        alpha: 0,
        duration: 360,
        ease: 'Quad.in',
      });
      this.tweens.add({
        targets: deathLabel,
        y: deathLabel.y - 24,
        alpha: 0,
        duration: 430,
        ease: 'Quad.out',
      });
      this.tweens.add({
        targets: pulse,
        scale: 3.2,
        alpha: 0,
        duration: 400,
        ease: 'Quad.out',
      });
    } else {
      // OBSTACLE/ENEMY HIT: use the stronger directional death reaction.
      this.tweens.add({
        targets: this.player,
        x: startX - direction * 28,
        y: startY - 8,
        angle: direction * 24,
        scaleX: .9,
        scaleY: .9,
        alpha: .18,
        duration: 360,
        ease: 'Cubic.out',
        yoyo: true,
        hold: 70,
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
      this.shake(180, .008);
    }

    this.game.events.emit('feedback', 'death');
    this.time.delayedCall(isPitFall ? 380 : 540, () => {
      cleanup();
      this.player.body?.setAllowGravity(true);
      originalFail.call(this, message);
    });
  };
})();
