import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 07 — player death presentation + hard void recovery.
// Existing fail()/respawn/game-over lifecycle remains authoritative.
(() => {
  if (window.__relayPlayerDeathAnimationV1) return;
  window.__relayPlayerDeathAnimationV1 = true;

  const originalFail = RunnerScene.prototype.fail;
  const originalUpdate = RunnerScene.prototype.update;
  const originalRespawnCheckpoint = RunnerScene.prototype.respawnCheckpoint;

  const SPAWN_PROTECTION_MS = 10000;
  const VOID_DROP_DISTANCE = 150;
  const VOID_BOTTOM_MARGIN = 16;
  const SPIKE_WIDTH = 34;
  const CHECKPOINT_NEAR_DISTANCE = 72;

  const resetDeathInput = scene => {
    scene.player?.body?.setVelocity(0, 0);
    scene.mobileDirection = null;
    Object.keys(scene.mobileActions || {}).forEach(key => { scene.mobileActions[key] = false; });
  };

  const isVoidMessage = message => /fell out|fall|void|bottom|spike|hole/i.test(String(message));
  const distance = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  const createVoidHazardVisuals = scene => {
    if (scene.__voidHazardVisuals || !scene.player?.active) return;
    const bounds = scene.physics?.world?.bounds;
    if (!bounds) return;

    const width = Math.max(Number(bounds.width) || 0, Number(scene.worldWidth) || 2400, 2400);
    const baseY = Number(bounds.bottom) - 5;
    const graphics = scene.add.graphics().setDepth(2);

    graphics.fillStyle(0x080d18, .92);
    graphics.fillRect(bounds.x, baseY - 6, width, 42);

    for (let i = 0; i < Math.ceil(width / SPIKE_WIDTH); i++) {
      const x = i * SPIKE_WIDTH;
      graphics.fillStyle(0x172238, 1);
      graphics.fillTriangle(x, baseY + 22, x + SPIKE_WIDTH / 2, baseY - 2, x + SPIKE_WIDTH, baseY + 22);
      graphics.lineStyle(2, 0xff826e, .95);
      graphics.strokeTriangle(x, baseY + 22, x + SPIKE_WIDTH / 2, baseY - 2, x + SPIKE_WIDTH, baseY + 22);
    }

    graphics.setScrollFactor(1);
    scene.__voidHazardVisuals = graphics;
  };

  const pulseVoidImpact = scene => {
    if (!scene.player?.active) return;
    const ring = scene.add.circle(scene.player.x, scene.player.y + 16, 14, 0xff826e, .22)
      .setStrokeStyle(2, 0xff826e, .9)
      .setDepth(18);
    scene.tweens.add({
      targets: ring,
      scale: 3.6,
      alpha: 0,
      duration: 260,
      ease: 'Quad.out',
      onComplete: () => ring.destroy(),
    });
  };

  // Void hazards are environmental kills and intentionally ignore the
  // 10-second combat damage shield so every fall always respawns.
  const triggerVoidDeath = scene => {
    if (scene.__deathAnimationActive || scene.respawning || scene.finished) return;
    createVoidHazardVisuals(scene);
    pulseVoidImpact(scene);
    scene.__forceVoidDeath = true;
    scene.fail('The courier fell into the relay void.');
  };

  const activateNearbyCheckpoint = scene => {
    if (!scene.checkpoints || typeof scene.activateCheckpoint !== 'function' || !scene.player?.active) return;
    if (!scene.__nearCheckpointTriggered) scene.__nearCheckpointTriggered = new Set();
    scene.checkpoints.getChildren().forEach(checkpoint => {
      if (!checkpoint.active) return;
      const index = Number(checkpoint.getData('index'));
      if (!Number.isFinite(index) || scene.__nearCheckpointTriggered.has(index)) return;
      if (distance(scene.player.x, scene.player.y, checkpoint.x, checkpoint.y) > CHECKPOINT_NEAR_DISTANCE) return;
      scene.__nearCheckpointTriggered.add(index);
      scene.activateCheckpoint(checkpoint);
    });
  };

  RunnerScene.prototype.update = function playerDeathAnimationV1Update(...args) {
    if (this.__deathAnimationActive) {
      resetDeathInput(this);
      return;
    }

    if (!this.finished && !this.respawning && this.player?.active) {
      createVoidHazardVisuals(this);
      activateNearbyCheckpoint(this);

      const body = this.player.body;
      const currentY = Number(this.player.y);
      const worldBottom = Number(this.physics?.world?.bounds?.bottom);

      if (!Number.isFinite(this.__lastSafeY)) {
        this.__lastSafeY = currentY;
      }

      const safeY = Number(this.__lastSafeY);
      const grounded = Boolean(body?.blocked?.down || body?.touching?.down);
      const bodyBottom = Number.isFinite(Number(body?.bottom))
        ? Number(body.bottom)
        : currentY + Number(body?.height || 0) / 2;

      if (grounded && currentY <= safeY + 100) {
        this.__lastSafeY = currentY;
      }

      const routeDrop = Number.isFinite(Number(this.__lastSafeY)) && currentY > Number(this.__lastSafeY) + VOID_DROP_DISTANCE;
      const bottomReached = Number.isFinite(worldBottom) && bodyBottom >= worldBottom - VOID_BOTTOM_MARGIN;

      if (routeDrop || bottomReached) {
        triggerVoidDeath(this);
        return;
      }
    }

    return originalUpdate.apply(this, args);
  };

  RunnerScene.prototype.respawnCheckpoint = function playerDeathAnimationV1Respawn(...args) {
    const result = originalRespawnCheckpoint.apply(this, args);

    this.__forceVoidDeath = false;
    this.__lastSafeY = this.player?.y ?? this.__lastSafeY;
    this.__nearCheckpointTriggered = new Set();
    this.player?.setAngle(0).setScale(1).setAlpha(1).clearTint();
    this.player?.play('runner-idle', true);
    this.player?.body?.setVelocity(0, 0);
    this.respawnGrace = SPAWN_PROTECTION_MS;
    this.healthInvulnerable = SPAWN_PROTECTION_MS;

    createVoidHazardVisuals(this);

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
    const forcedVoidDeath = Boolean(this.__forceVoidDeath);
    if (this.briefingProtected || this.finished || this.respawning || (!forcedVoidDeath && this.respawnGrace > 0) || this.__deathAnimationActive) {
      if (forcedVoidDeath && !this.respawning && !this.finished && !this.__deathAnimationActive) this.__forceVoidDeath = false;
      return;
    }

    this.__forceVoidDeath = false;
    this.__deathAnimationActive = true;
    this.physics.pause();
    resetDeathInput(this);

    const startX = this.player.x;
    const startY = this.player.y;
    const direction = this.player.flipX ? -1 : 1;
    const voidDeath = isVoidMessage(message);
    const reduced = Boolean(this.motionReduced);

    this.player.body?.setVelocity(0, 0);
    this.player.play('runner-hit', true);
    this.player.setTint(0xff826e);

    const deathLabel = this.add.text(startX, startY - 62, voidDeath ? 'SIGNAL LOST · VOID' : 'SIGNAL LOST', {
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

    if (voidDeath || reduced) {
      this.player.setAngle(0).setScale(1);
      this.tweens.add({ targets: this.player, alpha: 0, scaleX: .86, scaleY: .86, duration: 240, ease: 'Quad.in' });
      this.tweens.add({ targets: deathLabel, y: deathLabel.y - 26, alpha: 0, duration: 300 });
      this.tweens.add({ targets: pulse, scale: 3.2, alpha: 0, duration: 280 });
      if (!this.motionReduced) this.shake(130, .006);
      this.time.delayedCall(300, () => { cleanup(); originalFail.call(this, message); });
      return;
    }

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
    this.tweens.add({ targets: deathLabel, y: deathLabel.y - 30, alpha: 0, scale: 1.08, duration: 500, ease: 'Quad.out' });
    this.tweens.add({ targets: pulse, scale: 3.8, alpha: 0, duration: 480, ease: 'Quad.out' });
    if (!this.motionReduced) this.shake(180, .008);
    this.game.events.emit('feedback', 'death');
    this.time.delayedCall(540, () => { cleanup(); originalFail.call(this, message); });
  };
})();