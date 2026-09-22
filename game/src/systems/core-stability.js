import '../feature-runtime.js';
import './mobile-black-screen-fix.js';
import { RunnerScene } from '../scenes/RunnerScene.js';
import { SPAWN_SHIELD_MS } from '../config/gameplay-timing.js';

// P0 safety layer: install exactly once and only reject invalid/re-entrant
// transitions. Existing gameplay mechanics remain unchanged.
if (!RunnerScene.prototype.__relayCoreStabilityV1Installed) {
  RunnerScene.prototype.__relayCoreStabilityV1Installed = true;

  function keepPhaserSurfaceMounted() {
    if (window.__relaySurfaceGuardInstalled) return;
    window.__relaySurfaceGuardInstalled = true;
    const style = document.createElement('style');
    style.id = 'relay-phaser-surface-guard';
    style.textContent = '#play.hidden{display:block!important} #phaser-game{min-width:1px;min-height:1px}';
    document.head.appendChild(style);
  }
  keepPhaserSurfaceMounted();

  function installAudioResume() {
    if (window.__relayAudioResumeInstalled) return;
    window.__relayAudioResumeInstalled = true;
    const resume = () => { try { window.__relayAudioContext?.resume?.(); } catch { /* optional */ } };
    window.addEventListener('pointerdown', resume, { passive: true });
    window.addEventListener('keydown', resume, { passive: true });
  }
  installAudioResume();

  const originalCreate = RunnerScene.prototype.create;
  const fail = RunnerScene.prototype.fail;
  const respawn = RunnerScene.prototype.respawnCheckpoint;
  const hit = RunnerScene.prototype.takeSciFiHit;
  const update = RunnerScene.prototype.update;
  const stop = scene => scene.player?.body?.setVelocity(0, 0);

  function isPrimaryTouchDevice() {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const fine = window.matchMedia?.('(pointer: fine)').matches ?? false;
    const touchPoints = Number(navigator.maxTouchPoints || 0);
    return coarse && !fine && touchPoints > 0;
  }

  function ensureWebKeyboardRefs(scene) {
    if (!scene || isPrimaryTouchDevice() || !scene.input?.keyboard) return;
    const keyboard = scene.input.keyboard;
    keyboard.enabled = true;
    const cursorsReady = Boolean(scene.cursors?.left && scene.cursors?.right && scene.cursors?.up && scene.cursors?.down);
    if (!cursorsReady) scene.cursors = keyboard.createCursorKeys();
    const keysReady = Boolean(scene.keys?.A && scene.keys?.D && scene.keys?.W && scene.keys?.S && scene.keys?.SPACE && scene.keys?.SHIFT && scene.keys?.E && scene.keys?.Q && scene.keys?.ESC);
    if (!keysReady) scene.keys = keyboard.addKeys('A,D,W,S,E,Q,SPACE,SHIFT,ONE,TWO,THREE,FOUR,ESC');
  }

  function recoverWebPresentationState(scene) {
    if (!scene || isPrimaryTouchDevice() || !scene.player?.body || scene.finished || scene.respawning) return;
    const intro = document.getElementById('relayGameplayIntroFinalV1');
    const title = document.getElementById('titlePanel');
    const introVisible = Boolean(intro && !intro.hidden && !intro.classList.contains('hidden'));
    const titleVisible = Boolean(title && !title.classList.contains('hidden'));
    if (introVisible || titleVisible) return;
    const age = performance.now() - Number(scene.__webSceneStartedAt || performance.now());
    if (age < 450) return;
    if (scene.cinematicActive || scene.inputEnabled === false) {
      if (scene.__relayIntentionalBlock === true) return;
      scene.cinematicActive = false;
      scene.inputEnabled = true;
      try { scene.physics?.world?.resume?.(); } catch { /* already running */ }
      scene.player.body.enable = true;
      scene.player.body.moves = true;
      scene.player.body.allowGravity = true;
      scene.cameras?.main?.startFollow?.(scene.player, true, .08, .08);
    }
  }

  function recoverWebFallState(scene) {
    if (!scene || isPrimaryTouchDevice() || !scene.player?.active || !scene.player.body || scene.finished || scene.respawning) return;
    if (scene.cinematicActive) return;
    const boundsBottom = Number(scene.physics?.world?.bounds?.bottom);
    const fellThroughWorld = Number.isFinite(boundsBottom)
      ? Number(scene.player.body.bottom) >= boundsBottom + 16
      : false;
    if (!fellThroughWorld || scene.__webFallRecoveryPending) return;
    scene.__webFallRecoveryPending = true;
    try {
      if (typeof scene.fail === 'function') scene.fail('The courier fell into the relay void.');
    } finally {
      scene.time?.delayedCall?.(600, () => { scene.__webFallRecoveryPending = false; });
    }
  }

  function sanitizePlayerPhysics(scene) {
    const body = scene?.player?.body;
    if (!body) return;
    const vx = Number(body.velocity?.x);
    const vy = Number(body.velocity?.y);
    const gx = Number(body.gravity?.x);
    const gy = Number(body.gravity?.y);
    let repaired = false;
    if (!Number.isFinite(vx)) { body.setVelocityX?.(0); repaired = true; }
    if (!Number.isFinite(vy)) { body.setVelocityY?.(0); repaired = true; }
    if (!Number.isFinite(gx)) { body.setGravityX?.(0); repaired = true; }
    if (!Number.isFinite(gy)) {
      const fallbackGravity = Number.isFinite(scene.physics?.world?.gravity?.y) ? scene.physics.world.gravity.y : 1;
      body.setGravityY?.(fallbackGravity);
      repaired = true;
    }
    if (!Number.isFinite(scene.player.x) || !Number.isFinite(scene.player.y)) {
      repaired = true;
      if (!scene.__relayPhysicsRecoveryPending && typeof scene.respawnCheckpoint === 'function') {
        scene.__relayPhysicsRecoveryPending = true;
        try { scene.respawnCheckpoint(); }
        finally { scene.time?.delayedCall?.(250, () => { scene.__relayPhysicsRecoveryPending = false; }); }
      }
    }
    if (repaired) scene.game?.events?.emit('physics-recovered', { source: 'runner-player-safety' });
  }

  function installSafeRunnerStart(game) {
    if (!game || game.__relaySafeRunnerStart) return;
    const manager = game.scene;
    const originalStart = manager.start.bind(manager);
    let restarting = false;
    manager.start = function safeRunnerStart(key, data, clear) {
      if (key !== 'runner') return originalStart(key, data, clear);
      const runner = manager.getScene('runner');
      const active = runner?.scene?.isActive?.() || runner?.scene?.isPaused?.();
      if (!active) return originalStart(key, data, clear);
      if (restarting) return;
      restarting = true;
      try { runner.scene.restart(data); }
      finally { window.queueMicrotask(() => { restarting = false; }); }
    };
    game.__relaySafeRunnerStart = true;
  }

  function resetTransientRespawnState(scene) {
    if (!scene) return;
    scene.alarmTimer = 0;
    scene.empTimer = 0;
    scene.decoyTimer = 0;
    scene.boosterTimer = 0;
    scene.comboTimer = 0;
    scene.combatCombo = 0;
    scene.blasterCooldown = 0;
    scene.swordCooldown = 0;
    scene.vaultCooldown = 0;
    scene.boostCooldown = 0;
    scene.lowEnergyCueTimer = 0;
    scene.slideTimer = 0;
    scene.airDashUsed = false;
    scene.gadgetCooldowns = [0, 0];
    scene.buildCooldowns = [0, 0];
    scene.chaseSection = -1;
    if (scene.chaser) {
      scene.chaser.setVisible(false);
      scene.chaser.body?.setEnable(false);
    }
    [scene.eggs, scene.comets, scene.kineticBalls, scene.plasma, scene.turrets, scene.shields, scene.springPads]
      .forEach(group => group?.getChildren?.().forEach(entity => entity.active && entity.destroy()));
    scene.decoyBeacon?.destroy();
    scene.decoyBeacon = null;
    scene.boosterAura?.destroy();
    scene.boosterAura = null;
  }

  function rememberCheckpointCollectibles(scene) {
    for (const [groupName] of [['signals'], ['secrets']]) {
      scene?.[groupName]?.getChildren?.().forEach(item => {
        if (!Number.isFinite(item.getData('spawnX'))) item.setData('spawnX', item.x);
        if (!Number.isFinite(item.getData('spawnY'))) item.setData('spawnY', item.y);
      });
    }
  }

  function restoreCheckpointCollectibles(scene) {
    for (const groupName of ['signals', 'secrets']) {
      scene?.[groupName]?.getChildren?.().forEach(item => {
        const spawnX = Number(item.getData('spawnX'));
        const spawnY = Number(item.getData('spawnY'));
        if (!Number.isFinite(spawnX) || !Number.isFinite(spawnY) || !item.active) return;
        item.enableBody?.(true, spawnX, spawnY, true, true);
      });
    }
  }

  function inferDeathReason(message) {
    const value = String(message || '').toLowerCase();
    if (value.includes('barrier') || value.includes('security gate') || value.includes('interceptor')) return 'collision';
    if (value.includes('enemy') || value.includes('dinosaur')) return 'enemy';
    return 'fall';
  }

  function applyDeathReasonCorrection(scene, reason, before) {
    if (reason !== 'enemy') return;
    const fell = (Number(scene.falls) || 0) - before.falls;
    if (fell > 0) scene.falls = Math.max(0, (Number(scene.falls) || 0) - fell);
    scene.enemyHits = (Number(scene.enemyHits) || 0) + Math.max(1, fell);
    const packageWasReduced = Number(scene.packageCondition) < before.packageCondition;
    if (packageWasReduced && fell > 0) {
      scene.packageCondition = Math.min(100, Number(scene.packageCondition) + 10 * fell);
    }
  }

  RunnerScene.prototype.create = function stableCreate(...args) {
    const mission = this.mission;
    if (!mission?.id || !mission.spawn || !mission.goal) {
      console.error('[Relay Runner] Invalid mission data; scene will not start.', mission);
      return;
    }
    installSafeRunnerStart(this.game);
    this.__webSceneStartedAt = performance.now();
    this.__webFallRecoveryPending = false;
    this.__relayIntentionalBlock = false;
    this.__relayLastHitFrame = -1;
    this.__relayRespawnInProgress = false;
    this.__relayPhysicsRecoveryPending = false;
    this.enemyHits = Number.isFinite(this.enemyHits) ? this.enemyHits : 0;
    try {
      const result = originalCreate.apply(this, args);
      if (this.player) {
        this.healthInvulnerable = Math.max(Number(this.healthInvulnerable) || 0, SPAWN_SHIELD_MS);
        this.respawnGrace = Math.max(Number(this.respawnGrace) || 0, SPAWN_SHIELD_MS);
        if (!this.__relaySpawnShieldVisual && this.add?.circle && this.tweens?.add) {
          const spawnShield = this.add.circle(this.player.x, this.player.y, 24, 0x8df4ff, .22).setDepth(11);
          this.__relaySpawnShieldVisual = spawnShield;
          this.tweens.add({ targets: spawnShield, scale: 2.6, alpha: 0, duration: SPAWN_SHIELD_MS, onComplete: () => { spawnShield.destroy(); this.__relaySpawnShieldVisual = null; } });
        }
      }
      rememberCheckpointCollectibles(this);
      ensureWebKeyboardRefs(this);
      recoverWebPresentationState(this);
      window.__relayRunnerScene = this;
      return result;
    } catch (error) {
      console.error('[Relay Runner] Mission scene creation failed:', error);
      throw error;
    }
  };

  RunnerScene.prototype.fail = function stableFail(message) {
    if (this.briefingProtected || this.finished || this.respawning || this.respawnGrace > 0 || this.__relayRespawnInProgress) return;
    const reason = this.__relayPendingDeathReason || inferDeathReason(message);
    const before = {
      falls: Number(this.falls) || 0,
      collisions: Number(this.collisions) || 0,
      packageCondition: Number(this.packageCondition),
    };
    stop(this);
    try {
      return fail.call(this, message);
    } finally {
      applyDeathReasonCorrection(this, reason, before);
      this.__relayPendingDeathReason = null;
    }
  };

  RunnerScene.prototype.takeSciFiHit = function stableHit(message, reason) {
    if (this.briefingProtected || this.respawning || this.finished || this.respawnGrace > 0 || this.healthInvulnerable > 0 || this.__relayRespawnInProgress) return;
    const frame = Number.isFinite(this.game?.loop?.frame) ? this.game.loop.frame : Math.floor(Number(this.elapsedMs || 0));
    if (this.__relayLastHitFrame === frame) return;
    this.__relayLastHitFrame = frame;
    this.__relayPendingDeathReason = reason || inferDeathReason(message);
    stop(this);
    try {
      return hit.call(this, message);
    } finally {
      if (this.health > 0) this.__relayPendingDeathReason = null;
    }
  };

  RunnerScene.prototype.respawnCheckpoint = function stableRespawn() {
    if (this.__relayRespawnInProgress || this.finished) return;
    this.__relayRespawnInProgress = true;
    try {
      const spawn = this.mission?.spawn;
      if ((!this.checkpoint || !Number.isFinite(this.checkpoint.x) || !Number.isFinite(this.checkpoint.y) || this.checkpoint.y > 760) && spawn) {
        this.checkpoint = { x: Number.isFinite(spawn.x) ? spawn.x : 120, y: Number.isFinite(spawn.y) ? spawn.y : 520, signals: new Set(), secrets: new Set() };
      }
      resetTransientRespawnState(this);
      rememberCheckpointCollectibles(this);
      respawn.call(this);
      restoreCheckpointCollectibles(this);
      if (this.player?.body) {
        this.player.body.enable = true;
        this.player.body.checkCollision.none = false;
        this.player.body.setVelocity(0, 0);
      }
      this.healthInvulnerable = Math.max(Number(this.healthInvulnerable) || 0, SPAWN_SHIELD_MS);
      this.respawnGrace = Math.max(Number(this.respawnGrace) || 0, SPAWN_SHIELD_MS);
      this.respawning = false;
      this.__relayRespawnCompletedAt = performance.now();
    } finally {
      this.__relayRespawnInProgress = false;
    }
  };

  RunnerScene.prototype.update = function stableUpdate(time, delta) {
    recoverWebPresentationState(this);
    update.call(this, time, delta);
    sanitizePlayerPhysics(this);
    recoverWebFallState(this);
  };
}
