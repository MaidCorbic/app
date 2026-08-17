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
  const VOID_SENSOR_OFFSET = 170;
  const VOID_SENSOR_HEIGHT = 44;
  const VOID_SENSOR_WIDTH = 200000;
  const MAX_SAFE_GROUND_STEP_DOWN = 100;
  const SPIKE_COUNT = 9;
  const SPIKE_WIDTH = 28;

  const isFallDeath = message => /fell out|fall|void|bottom|spike|hole/i.test(String(message));

  const resetDeathInput = scene => {
    scene.player?.body?.setVelocity(0, 0);
    scene.mobileDirection = null;
    Object.keys(scene.mobileActions || {}).forEach(key => { scene.mobileActions[key] = false; });
  };

  const destroyVoidSensor = scene => {
    if (!scene.__voidKillFloor) return;
    scene.__voidKillFloor.destroy();
    scene.__voidKillFloor = null;
    scene.__voidKillFloorY = null;
  };

  const installVoidSensor = scene => {
    if (!scene.player?.active || scene.__deathAnimationActive) return;

    const safeY = Number(scene.__lastSafeY);
    if (!Number.isFinite(safeY)) return;

    const sensorY = safeY + VOID_SENSOR_OFFSET;
    if (scene.__voidKillFloor && Math.abs(Number(scene.__voidKillFloorY) - sensorY) < 2) return;

    if (scene.__voidKillFloor) scene.__voidKillFloor.destroy();

    // Real Arcade Physics static sensor. It has no visual geometry and cannot
    // become a platform: its only job is to kill a runner that has fallen deep
    // below the last legitimate route surface, even if the runner stops moving.
    const sensor = scene.add.rectangle(0, sensorY, VOID_SENSOR_WIDTH, VOID_SENSOR_HEIGHT, 0x000000, 0)
      .setOrigin(.5)
      .setVisible(false)
      .setActive(true);
    scene.physics.add.existing(sensor, true);
    sensor.body.setSize(VOID_SENSOR_WIDTH, VOID_SENSOR_HEIGHT, true);
    sensor.body.setOffset(0, 0);

    scene.__voidKillFloor = sensor;
    scene.__voidKillFloorY = sensorY;

    scene.physics.add.overlap(scene.player, sensor, () => {
      if (scene.__deathAnimationActive || scene.finished || scene.respawning || scene.respawnGrace > 0) return;
      drawVoidSpikes(scene);
      scene.fail('The courier fell into the relay void.');
    });
  };

  const drawVoidSpikes = scene => {
    if (scene.__voidSpikeGroup) return;

    const group = scene.add.container(0, 0).setDepth(16).setScrollFactor(1);
    const baseY = scene.player.y + 24;
    const startX = scene.player.x - (SPIKE_COUNT * SPIKE_WIDTH) / 2;

    for (let i = 0; i < SPIKE_COUNT; i++) {
      const g = scene.add.graphics();
      const x = i * SPIKE_WIDTH;
      g.fillStyle(0x172238, 1);
      g.fillTriangle(x, 28, x + SPIKE_WIDTH / 2, 0, x + SPIKE_WIDTH, 28);
      g.lineStyle(2, 0xff826e, .9);
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

  RunnerScene.prototype.update = function playerDeathAnimationV1Update(...args) {
    if (this.__deathAnimationActive) {
      resetDeathInput(this);
      return;
    }

    if (!this.finished && !this.respawning && this.player?.active) {
      const body = this.player.body;
      const grounded = Boolean(body?.blocked?.down || body?.touching?.down);
      const currentY = Number(this.player.y);
      const previousSafeY = Number(this.__lastSafeY);

      if (!Number.isFinite(previousSafeY)) {
        this.__lastSafeY = currentY;
      }

      const safeY = Number(this.__lastSafeY);
      const falling = Number(body?.velocity?.y) > 0;
      const isDeepBelowSafeRoute = Number.isFinite(safeY) && currentY > safeY + VOID_DROP_DISTANCE;

      if (grounded && !isDeepBelowSafeRoute && currentY <= safeY + MAX_SAFE_GROUND_STEP_DOWN) {
        this.__lastSafeY = currentY;
      }

      // Keep a real physics kill floor directly below the last legitimate route.
      // This catches both falling and standing on the bottom; velocity is irrelevant.
      installVoidSensor(this);

      const routeSafeY = Number(this.__lastSafeY);
      const deepVoid = Number.isFinite(routeSafeY) && currentY > routeSafeY + VOID_DROP_DISTANCE;
      if (deepVoid) {
        drawVoidSpikes(this);
        this.fail('The courier fell into the relay void.');
        return;
      }

      const worldBottom = Number(this.physics?.world?.bounds?.bottom);
      if (Number.isFinite(worldBottom) && worldBottom > 200 && currentY > worldBottom - 40) {
        drawVoidSpikes(this);
        this.fail('The courier reached the relay void floor.');
        return;
      }
    }

    return originalUpdate.apply(this, args);
  };

  RunnerScene.prototype.respawnCheckpoint = function playerDeathAnimationV1Respawn(...args) {
    destroyVoidSensor(this);
    const result = originalRespawnCheckpoint.apply(this, args);

    this.__lastSafeY = this.player?.y ?? this.__lastSafeY;
    this.player?.setAngle(0).setScale(1).setAlpha(1).clearTint();
    this.player?.play('runner-idle', true);
    this.player?.body?.setVelocity(0, 0);
    this.respawnGrace = SPAWN_PROTECTION_MS;
    this.healthInvulnerable = SPAWN_PROTECTION_MS;

    installVoidSensor(this);

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
    destroyVoidSensor(this);
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
      this.tweens.add({ targets: deathLabel, y: deathLabel.y - 22, alpha: 0, duration: reduced ? 260 : 360 });
      this.tweens.add({ targets: pulse, scale: reduced ? 1.8 : 2.8, alpha: 0, duration: reduced ? 260 : 360 });
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
    this.tweens.add({ targets: deathLabel, y: deathLabel.y - 30, alpha: 0, scale: 1.08, duration: 500, ease: 'Quad.out' });
    this.tweens.add({ targets: pulse, scale: 3.8, alpha: 0, duration: 480, ease: 'Quad.out' });

    if (!this.motionReduced) this.shake(180, .008);
    this.game.events.emit('feedback', 'death');

    this.time.delayedCall(540, () => {
      cleanup();
      originalFail.call(this, message);
    });
  };
})();
