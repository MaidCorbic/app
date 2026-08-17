import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 07 — player death presentation + reliable void/hole handling.
// Existing fail()/respawn/game-over lifecycle remains authoritative.
(() => {
  if (window.__relayPlayerDeathAnimationV1) return;
  window.__relayPlayerDeathAnimationV1 = true;

  const originalFail = RunnerScene.prototype.fail;
  const originalUpdate = RunnerScene.prototype.update;
  const originalRespawnCheckpoint = RunnerScene.prototype.respawnCheckpoint;

  const SPAWN_PROTECTION_MS = 10000;
  const VOID_DROP_DISTANCE = 150;
  const BOTTOM_KILL_HEIGHT = 48;
  const SPIKE_COUNT = 9;
  const SPIKE_WIDTH = 28;

  const isFallDeath = message => /fell out|fall|void|bottom|spike|hole/i.test(String(message));

  const resetDeathInput = scene => {
    scene.player?.body?.setVelocity(0, 0);
    scene.mobileDirection = null;
    Object.keys(scene.mobileActions || {}).forEach(key => { scene.mobileActions[key] = false; });
  };

  const destroyVoidKillFloor = scene => {
    const floor = scene.__voidKillFloor;
    if (!floor) return;
    floor.destroy();
    scene.__voidKillFloor = null;
  };

  // Real Arcade Physics sensor at the physical bottom of the world.
  // Static bodies already ignore gravity/immovability; do not call dynamic-body
  // methods here because that can throw in Phaser and blank the game canvas.
  const installVoidKillFloor = scene => {
    destroyVoidKillFloor(scene);

    const bounds = scene.physics?.world?.bounds;
    if (!bounds || !scene.player?.active) return;

    const width = Math.max(bounds.width, scene.scale?.width || 1280, 2400);
    const x = bounds.x + width / 2;
    const y = bounds.bottom - BOTTOM_KILL_HEIGHT / 2;

    const floor = scene.add.rectangle(x, y, width + 400, BOTTOM_KILL_HEIGHT, 0xff0000, 0);
    floor.setVisible(false);
    scene.physics.add.existing(floor, true);
    floor.body.setSize(width + 400, BOTTOM_KILL_HEIGHT, true);

    scene.physics.add.overlap(scene.player, floor, () => {
      if (scene.__deathAnimationActive || scene.respawning || scene.finished || scene.respawnGrace > 0) return;
      drawVoidSpikes(scene);
      scene.fail('The courier reached the relay void floor.');
    });

    scene.__voidKillFloor = floor;
  };

  const drawVoidSpikes = scene => {
    if (scene.__voidSpikeGroup) return;

    const group = scene.add.container(0, 0).setDepth(16).setScrollFactor(1);
    const baseY = scene.player.y + 28;
    const startX = scene.player.x - (SPIKE_COUNT * SPIKE_WIDTH) / 2;

    for (let i = 0; i < SPIKE_COUNT; i++) {
      const g = scene.add.graphics();
      const x = i * SPIKE_WIDTH;
      g.fillStyle(0x172238, 1);
      g.fillTriangle(x, 28, x + SPIKE_WIDTH / 2, 0, x + SPIKE_WIDTH, 28);
      g.lineStyle(2, 0xff826e, .95);
      g.strokeTriangle(x, 28, x + SPIKE_WIDTH / 2, 0, x + SPIKE_WIDTH, 28);
      group.add(g);
    }

    group.setPosition(startX, baseY);
    scene.__voidSpikeGroup = group;

    scene.tweens.add({
      targets: group,
      alpha: 0,
      y: baseY + 12,
      duration: 650,
      ease: 'Quad.out',
      onComplete: () => {
        group.destroy(true);
        scene.__voidSpikeGroup = null;
      },
    });
  };

  const triggerVoidDeath = scene => {
    if (scene.__deathAnimationActive || scene.respawning || scene.finished || scene.respawnGrace > 0) return;
    drawVoidSpikes(scene);
    scene.fail('The courier fell into the relay void.');
  };

  RunnerScene.prototype.update = function playerDeathAnimationV1Update(...args) {
    if (this.__deathAnimationActive) {
      resetDeathInput(this);
      return;
    }

    if (!this.finished && !this.respawning && this.player?.active) {
      if (!this.__voidKillFloor) installVoidKillFloor(this);

      const currentY = Number(this.player.y);
      const safeY = Number(this.__lastSafeY);
      const deepVoid = Number.isFinite(safeY) && currentY > safeY + VOID_DROP_DISTANCE;

      if (deepVoid) {
        triggerVoidDeath(this);
        return;
      }
    }

    return originalUpdate.apply(this, args);
  };

  RunnerScene.prototype.respawnCheckpoint = function playerDeathAnimationV1Respawn(...args) {
    destroyVoidKillFloor(this);

    const result = originalRespawnCheckpoint.apply(this, args);

    this.__lastSafeY = this.player?.y ?? this.__lastSafeY;
    this.player?.setAngle(0).setScale(1).setAlpha(1).clearTint();
    this.player?.play('runner-idle', true);
    this.player?.body?.setVelocity(0, 0);
    this.respawnGrace = SPAWN_PROTECTION_MS;
    this.healthInvulnerable = SPAWN_PROTECTION_MS;

    installVoidKillFloor(this);

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
    destroyVoidKillFloor(this);
    this.physics.pause();
    resetDeathInput(this);

    const startX = this.player.x;
    const startY = this.player.y;
    const direction = this.player.flipX ? -1 : 1;
    const falling = isFallDeath(message);
    const reduced = Boolean(this.motionReduced);

    this.player.play('runner-hit', true);
    this.player.setTint(0xff826e);

    const deathLabel = this.add.text(startX, startY - 62, falling ? 'SIGNAL LOST · VOID' : 'SIGNAL LOST', {
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
      this.player.setAngle(0).setScale(1).setAlpha(1);
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
