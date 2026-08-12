import { RunnerScene } from '../scenes/RunnerScene.js';
import { applyHorizontalMovementFeel } from '../movement/MovementFeel.js';

// G1 startup guard: Phaser auto-constructs the configured scene before PLAY,
// so protect the existing scene from being initialized without a mission.
const originalInit = RunnerScene.prototype.init;
const originalCreate = RunnerScene.prototype.create;
const originalFail = RunnerScene.prototype.fail;
const originalRespawnCheckpoint = RunnerScene.prototype.respawnCheckpoint;
const originalTakeSciFiHit = RunnerScene.prototype.takeSciFiHit;
const originalUpdate = RunnerScene.prototype.update;

RunnerScene.prototype.init = function initWithSafeDefaults(data = {}) {
  return originalInit.call(this, data || {});
};

RunnerScene.prototype.create = function createWhenReady() {
  if (!this.mission) {
    this.scene.stop();
    return;
  }
  return originalCreate.call(this);
};

function freezePlayer(scene) {
  const body = scene.player?.body;
  if (!body) return;
  body.setVelocity(0, 0);
  body.setAcceleration(0, 0);
  body.setDrag(0, 0);
}

RunnerScene.prototype.takeSciFiHit = function takeSciFiHitStable(message) {
  if (this.respawning || this.finished || this.respawnGrace > 0 || this.healthInvulnerable > 0) return;
  freezePlayer(this);
  originalTakeSciFiHit.call(this, message);
};

RunnerScene.prototype.fail = function failStable(message) {
  if (this.finished || this.respawning || this.respawnGrace > 0) return;
  freezePlayer(this);
  originalFail.call(this, message);
};

RunnerScene.prototype.respawnCheckpoint = function respawnCheckpointStable() {
  const missionSpawn = this.mission?.spawn;
  const checkpoint = this.checkpoint;
  const invalidCheckpoint = !checkpoint || !Number.isFinite(checkpoint.x) || !Number.isFinite(checkpoint.y) || checkpoint.y > 760;

  if (invalidCheckpoint && missionSpawn) {
    this.checkpoint = {
      x: Number.isFinite(missionSpawn.x) ? missionSpawn.x : 120,
      y: Number.isFinite(missionSpawn.y) ? missionSpawn.y : 520,
      signals: new Set(),
      secrets: new Set(),
    };
  }

  originalRespawnCheckpoint.call(this);
  freezePlayer(this);

  if (this.player?.body) {
    this.player.body.enable = true;
    this.player.body.checkCollision.none = false;
  }
  this.respawnGrace = Math.max(this.respawnGrace || 0, 1100);
};

// G2 safe integration: keep RunnerScene's existing jump/dash/ability logic intact.
// Only the final horizontal velocity is tuned for a smoother acceleration/turn feel.
RunnerScene.prototype.update = function updateWithMovementFeel(time, delta) {
  originalUpdate.call(this, time, delta);

  if (this.finished || this.respawning || this.cinematicActive || this.dashTimer > 0) return;
  if (!this.player?.body || !this.cursors || !this.keys) return;

  const left = this.cursors.left.isDown || this.keys.A.isDown || this.mobileDirection === 'left';
  const right = this.cursors.right.isDown || this.keys.D.isDown || this.mobileDirection === 'right';
  const axis = (right ? 1 : 0) - (left ? 1 : 0);
  const configuredMax = this.player.body.maxVelocity?.x;

  applyHorizontalMovementFeel({
    player: this.player,
    axis,
    delta,
    maxSpeed: Number.isFinite(configuredMax) && configuredMax > 0 ? configuredMax : undefined,
  });
};
