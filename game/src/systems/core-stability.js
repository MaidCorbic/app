import { RunnerScene } from '../scenes/RunnerScene.js';
import { applyHorizontalMovementFeel } from '../movement/MovementFeel.js';

const originalCreate = RunnerScene.prototype.create;
const originalFail = RunnerScene.prototype.fail;
const originalRespawnCheckpoint = RunnerScene.prototype.respawnCheckpoint;
const originalTakeSciFiHit = RunnerScene.prototype.takeSciFiHit;
const originalUpdate = RunnerScene.prototype.update;

function freezePlayer(scene) {
  const body = scene.player?.body;
  if (!body) return;
  body.setVelocity(0, 0);
  body.setAcceleration(0, 0);
  body.setDrag(0, 0);
}

// A mission must own its Phaser lifecycle. COMPLETE/FAIL is a terminal state;
// stopping the scene prevents stale timers, physics objects and listeners from
// surviving into the next mission and producing a blank canvas.
RunnerScene.prototype.create = function stableCreate(...args) {
  const mission = this.mission;
  if (!mission?.id || !mission.spawn || !mission.goal) {
    console.error('[Relay Runner] Invalid mission data; scene will not start.', mission);
    this.scene.stop();
    return;
  }

  const runId = this.runId;
  const stopWhenFinished = resultRunId => {
    if (resultRunId !== runId || resultRunId !== this.runId) return;
    if (this.scene.isActive()) this.scene.stop();
  };
  const completeHandler = (_signals, _elapsed, _stats, resultRunId) => stopWhenFinished(resultRunId);
  const failHandler = (_message, resultRunId) => stopWhenFinished(resultRunId);

  this.game.events.on('complete', completeHandler);
  this.game.events.on('fail', failHandler);
  this.events.once('shutdown', () => {
    this.game.events.off('complete', completeHandler);
    this.game.events.off('fail', failHandler);
  });

  try {
    return originalCreate.apply(this, args);
  } catch (error) {
    this.game.events.off('complete', completeHandler);
    this.game.events.off('fail', failHandler);
    console.error('[Relay Runner] Mission scene creation failed:', error);
    this.scene.stop();
    throw error;
  }
};

RunnerScene.prototype.takeSciFiHit = function stableHit(message) {
  if (this.briefingProtected || this.respawning || this.finished || this.respawnGrace > 0 || this.healthInvulnerable > 0) return;
  freezePlayer(this);
  return originalTakeSciFiHit.call(this, message);
};

RunnerScene.prototype.fail = function stableFail(message) {
  if (this.briefingProtected || this.finished || this.respawning || this.respawnGrace > 0) return;
  freezePlayer(this);
  return originalFail.call(this, message);
};

RunnerScene.prototype.respawnCheckpoint = function stableRespawn() {
  const spawn = this.mission?.spawn;
  const checkpoint = this.checkpoint;
  if ((!checkpoint || !Number.isFinite(checkpoint.x) || !Number.isFinite(checkpoint.y) || checkpoint.y > 760) && spawn) {
    this.checkpoint = {
      x: Number.isFinite(spawn.x) ? spawn.x : 120,
      y: Number.isFinite(spawn.y) ? spawn.y : 520,
      signals: new Set(),
      secrets: new Set(),
    };
  }

  originalRespawnCheckpoint.call(this);
  if (this.player?.body) {
    this.player.body.enable = true;
    this.player.body.checkCollision.none = false;
  }
  this.respawnGrace = Math.max(this.respawnGrace || 0, 1100);
  this.healthInvulnerable = Math.max(this.healthInvulnerable || 0, 1100);
};

RunnerScene.prototype.update = function stableUpdate(time, delta) {
  originalUpdate.call(this, time, delta);
  if (this.finished || this.respawning || this.cinematicActive || this.dashTimer > 0) return;
  if (!this.player?.body || !this.cursors || !this.keys) return;

  const left = this.cursors.left.isDown || this.keys.A.isDown || this.mobileDirection === 'left';
  const right = this.cursors.right.isDown || this.keys.D.isDown || this.mobileDirection === 'right';
  const axis = (right ? 1 : 0) - (left ? 1 : 0);
  const maxSpeed = Number.isFinite(this.player.body.maxVelocity?.x) && this.player.body.maxVelocity.x > 0
    ? this.player.body.maxVelocity.x : undefined;

  applyHorizontalMovementFeel({ player: this.player, axis, delta, maxSpeed });
};
