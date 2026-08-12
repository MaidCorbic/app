import { RunnerScene } from '../scenes/RunnerScene.js';

// G1 stability layer: keep recovery deterministic without rewriting the existing scene.
const originalFail = RunnerScene.prototype.fail;
const originalRespawnCheckpoint = RunnerScene.prototype.respawnCheckpoint;
const originalTakeSciFiHit = RunnerScene.prototype.takeSciFiHit;

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
