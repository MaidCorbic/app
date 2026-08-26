const RUN_MIN_SPEED = 70;
const RUN_FRAME_MS = 110;
const LAND_REACTION_MS = 150;
const SWORD_REACTION_MS = 170;
const HIT_REACTION_MS = 180;

function safeSetTexture(player, key) {
  if (!player?.active || !player.scene?.textures?.exists(key)) return;
  if (player.texture?.key === key) return;
  player.setTexture(key);
}

function installCharacterStateReactions(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__characterStateReactionsV1) return;
  RunnerScene.prototype.__characterStateReactionsV1 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const originalUseSword = RunnerScene.prototype.useSword;

  RunnerScene.prototype.create = function (...args) {
    originalCreate.apply(this, args);

    if (!this.player) return;

    this.__characterVisualState = 'idle';
    this.__characterRunFrame = 0;
    this.__characterRunAt = 0;
    this.__characterWasGrounded = false;
    this.__characterReactionUntil = 0;
    this.__characterReactionState = null;
  };

  RunnerScene.prototype.useSword = function (...args) {
    const result = originalUseSword?.apply(this, args);
    if (this.player && !this.cinematicActive) {
      this.__characterReactionState = 'sword';
      this.__characterReactionUntil = this.time.now + SWORD_REACTION_MS;
      safeSetTexture(this.player, 'runner-hit');
    }
    return result;
  };

  RunnerScene.prototype.update = function (...args) {
    originalUpdate.apply(this, args);

    const player = this.player;
    if (!player?.body || !player.active) return;

    const now = this.time.now;
    const body = player.body;
    const grounded = body.blocked?.down || body.touching?.down || player.y >= (this.mission?.spawn?.y || 0) + 70;
    const vx = Math.abs(body.velocity?.x || 0);
    const vy = body.velocity?.y || 0;

    // Visual-only landing reaction. It never changes velocity, collision or movement state.
    if (grounded && !this.__characterWasGrounded && vy >= 0) {
      this.__characterReactionState = 'land';
      this.__characterReactionUntil = now + LAND_REACTION_MS;
    }
    this.__characterWasGrounded = grounded;

    if (this.__characterReactionState && now < this.__characterReactionUntil) {
      const state = this.__characterReactionState;
      if (state === 'sword') safeSetTexture(player, 'runner-hit');
      else if (state === 'land') safeSetTexture(player, 'runner-land');
      return;
    }

    this.__characterReactionState = null;

    if (this.cinematicActive || this.finished || this.respawning) {
      safeSetTexture(player, 'runner-idle');
      return;
    }

    if (!grounded) {
      safeSetTexture(player, vy < -80 ? 'runner-jump' : 'runner-fall');
      this.__characterVisualState = vy < -80 ? 'jump' : 'fall';
      return;
    }

    if (vx >= RUN_MIN_SPEED) {
      if (now >= this.__characterRunAt) {
        this.__characterRunFrame ^= 1;
        this.__characterRunAt = now + RUN_FRAME_MS;
      }
      safeSetTexture(player, this.__characterRunFrame ? 'runner-run-a' : 'runner-run-b');
      this.__characterVisualState = 'run';
      player.setFlipX(body.velocity.x < -4);
      return;
    }

    safeSetTexture(player, 'runner-idle');
    this.__characterVisualState = 'idle';
  };
}

export { installCharacterStateReactions };
