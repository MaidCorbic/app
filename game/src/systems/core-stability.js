import { RunnerScene } from '../scenes/RunnerScene.js';
import { applyHorizontalMovementFeel } from '../movement/MovementFeel.js';

// G1 stability layer: keep recovery deterministic without rewriting the existing scene.
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

RunnerScene.prototype.takeSciFiHit = function takeSciFiHitStable(message) {
  if (this.briefingProtected || this.respawning || this.finished || this.respawnGrace > 0 || this.healthInvulnerable > 0) return;
  freezePlayer(this);
  originalTakeSciFiHit.call(this, message);
};

RunnerScene.prototype.fail = function failStable(message) {
  if (this.briefingProtected || this.finished || this.respawning || this.respawnGrace > 0) return;
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

  if (this.player?.body) {
    this.player.body.enable = true;
    this.player.body.checkCollision.none = false;
  }
  this.respawnGrace = Math.max(this.respawnGrace || 0, 1100);
  this.healthInvulnerable = Math.max(this.healthInvulnerable || 0, 1100);
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

  const body = this.player.body;
  const shouldDeployParachute = !body.blocked.down && this.player.y < 280 && body.velocity.y > 520;
  if (shouldDeployParachute) {
    body.setVelocityY(Math.min(body.velocity.y, 300));
    if (!this.parachute) this.parachute = this.add.triangle(this.player.x, this.player.y - 54, 0, 20, 34, 0, 68, 20, 0x8df4ff, .8).setStrokeStyle(2, 0xdffcff).setDepth(12);
    this.parachute.setPosition(this.player.x, this.player.y - 54);
  } else if (this.parachute) {
    this.parachute.destroy(); this.parachute = null;
  }
};
