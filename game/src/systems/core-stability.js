import { RunnerScene } from '../scenes/RunnerScene.js';
import { missions } from '../missions.js';
import { applyHorizontalMovementFeel } from '../movement/MovementFeel.js';

// G1 startup safety: Phaser auto-starts RunnerScene before the first PLAY click.
// Give that boot instance a valid mission instead of letting destructuring/create fail.
const originalInit = RunnerScene.prototype.init;
const originalFail = RunnerScene.prototype.fail;
const originalRespawnCheckpoint = RunnerScene.prototype.respawnCheckpoint;
const originalTakeSciFiHit = RunnerScene.prototype.takeSciFiHit;
const originalUpdate = RunnerScene.prototype.update;

RunnerScene.prototype.init = function initWithSafeBoot(data = {}) {
  const mission = data?.mission || missions[0];
  return originalInit.call(this, {
    ...data,
    mission,
    runId: Number.isFinite(data?.runId) ? data.runId : 0,
    abilities: data?.abilities || [],
    rain: data?.rain ?? true,
    screenShake: data?.screenShake ?? true,
    reducedMotion: data?.reducedMotion ?? false,
    firstTimeTutorial: data?.firstTimeTutorial ?? false,
  });
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
