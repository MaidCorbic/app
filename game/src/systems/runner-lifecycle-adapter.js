import { RunnerScene } from '../scenes/RunnerScene.js';
import { applyHorizontalMovementFeel } from '../movement/MovementFeel.js';
import { setupWorldInteraction, updateWorldInteraction } from '../../world-interaction-v1.js';

// Authoritative RunnerScene lifecycle adapter.
// Exactly one runtime module owns the create/update/fail/respawn wrappers.
const prototype = RunnerScene.prototype;

if (!prototype.__relayRunnerLifecycleAdapterV1) {
  prototype.__relayRunnerLifecycleAdapterV1 = true;

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
    const resume = () => { try { window.__relayAudioContext?.resume?.(); } catch {} };
    window.addEventListener('pointerdown', resume, { passive: true });
    window.addEventListener('keydown', resume, { passive: true });
  }
  installAudioResume();

  const originalCreate = prototype.create;
  const originalUpdate = prototype.update;
  const originalFail = prototype.fail;
  const originalRespawn = prototype.respawnCheckpoint;
  const originalHit = prototype.takeSciFiHit;
  const stop = scene => scene.player?.body?.setVelocity(0, 0);

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

  prototype.create = function relayRunnerLifecycleCreate(...args) {
    const mission = this.mission;
    if (!mission?.id || !mission.spawn || !mission.goal) {
      console.error('[Relay Runner] Invalid mission data; scene will not start.', mission);
      return;
    }
    installSafeRunnerStart(this.game);
    try {
      const result = originalCreate.apply(this, args);
      setupWorldInteraction(this);
      window.__relayRunnerScene = this;
      window.dispatchEvent(new CustomEvent('relay:runner-scene-ready', { detail: { scene: this } }));
      return result;
    } catch (error) {
      console.error('[Relay Runner] Mission scene creation failed:', error);
      throw error;
    }
  };

  prototype.update = function relayRunnerLifecycleUpdate(time, delta) {
    const result = originalUpdate.call(this, time, delta);
    updateWorldInteraction(this);
    if (this.finished || this.respawning || this.cinematicActive || this.dashTimer > 0 || !this.player?.body || !this.cursors || !this.keys) return result;
    const left = this.cursors.left.isDown || this.keys.A.isDown || this.mobileDirection === 'left';
    const right = this.cursors.right.isDown || this.keys.D.isDown || this.mobileDirection === 'right';
    applyHorizontalMovementFeel({ player: this.player, axis: (right ? 1 : 0) - (left ? 1 : 0), delta });
    return result;
  };

  prototype.fail = function relayRunnerLifecycleFail(message) {
    if (this.briefingProtected || this.finished || this.respawning || this.respawnGrace > 0) return;
    stop(this);
    return originalFail.call(this, message);
  };

  prototype.takeSciFiHit = function relayRunnerLifecycleHit(message) {
    if (this.briefingProtected || this.respawning || this.finished || this.respawnGrace > 0 || this.healthInvulnerable > 0) return;
    stop(this);
    return originalHit.call(this, message);
  };

  prototype.respawnCheckpoint = function relayRunnerLifecycleRespawn() {
    const spawn = this.mission?.spawn;
    if ((!this.checkpoint || !Number.isFinite(this.checkpoint.x) || !Number.isFinite(this.checkpoint.y) || this.checkpoint.y > 760) && spawn) {
      this.checkpoint = {
        x: Number.isFinite(spawn.x) ? spawn.x : 120,
        y: Number.isFinite(spawn.y) ? spawn.y : 520,
        signals: new Set(),
        secrets: new Set(),
      };
    }
    originalRespawn.call(this);
    if (this.player?.body) {
      this.player.body.enable = true;
      this.player.body.checkCollision.none = false;
    }
    this.respawnGrace = Math.max(this.respawnGrace || 0, 1100);
    this.healthInvulnerable = Math.max(this.healthInvulnerable || 0, 1100);
  };
}
