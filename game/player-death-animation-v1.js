import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 07 — visual-only death presentation.
// The existing fail()/respawn/game-over lifecycle remains authoritative.
(() => {
  if (window.__relayPlayerDeathAnimationV1) return;
  window.__relayPlayerDeathAnimationV1 = true;

  const originalFail = RunnerScene.prototype.fail;

  RunnerScene.prototype.fail = function playerDeathAnimationV1(message) {
    if (this.briefingProtected || this.finished || this.respawning || this.respawnGrace > 0) return;

    // Pause gameplay immediately so another hazard cannot interrupt the death presentation.
    this.physics.pause();
    this.__deathAnimationActive = true;
    this.player.play('runner-hit', true);
    this.player.setTint(0xff826e);

    const reduced = Boolean(this.motionReduced);
    const startX = this.player.x;
    const startY = this.player.y;
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
      this.tweens.add({
        targets: deathLabel,
        alpha: 0,
        y: deathLabel.y - 10,
        duration: 300,
      });
      this.tweens.add({
        targets: pulse,
        scale: 1.8,
        alpha: 0,
        duration: 300,
      });
      this.time.delayedCall(320, () => {
        cleanup();
        originalFail.call(this, message);
      });
      return;
    }

    // A short directional fall/rotation sells the death state without adding a new asset.
    this.tweens.add({
      targets: this.player,
      x: startX - (this.player.flipX ? -18 : 18),
      y: startY + 22,
      angle: this.player.flipX ? -82 : 82,
      scaleX: .9,
      scaleY: .9,
      alpha: .2,
      duration: 440,
      ease: 'Cubic.in',
    });
    this.tweens.add({
      targets: deathLabel,
      y: deathLabel.y - 24,
      alpha: 0,
      duration: 520,
      ease: 'Quad.out',
    });
    this.tweens.add({
      targets: pulse,
      scale: 3.2,
      alpha: 0,
      duration: 420,
      ease: 'Quad.out',
    });

    this.game.events.emit('feedback', 'death');
    this.time.delayedCall(460, () => {
      cleanup();
      originalFail.call(this, message);
    });
  };
})();
