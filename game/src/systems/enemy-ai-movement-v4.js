const GROUND_TYPES = new Set(['security', 'guard', 'enemy-runner', 'chicken', 'dino', 'alien-ground']);
const CHASE_TYPES = new Set(['security', 'guard', 'enemy-runner', 'dino', 'alien-ground']);

const PROFILE = Object.freeze({
  security: { patrol: 54, chase: 78, range: 220, stop: 58 },
  guard: { patrol: 42, chase: 64, range: 175, stop: 62 },
  'enemy-runner': { patrol: 82, chase: 126, range: 285, stop: 66 },
  chicken: { patrol: 30, chase: 0, range: 0, stop: 54 },
  dino: { patrol: 58, chase: 88, range: 245, stop: 72 },
  'alien-ground': { patrol: 46, chase: 70, range: 320, stop: 62 },
});

const halfWidth = actor => Math.max(10, (actor.body?.width || actor.width || 40) * 0.5);
const halfHeight = actor => Math.max(10, (actor.body?.height || actor.height || 40) * 0.5);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const typeOf = enemy => enemy?.getData?.('route')?.type || enemy?.texture?.key || 'unknown';

function platformAt(scene, actor) {
  const platforms = scene.mission?.platforms || [];
  if (!actor?.active || !platforms.length) return null;
  const foot = actor.y + halfHeight(actor);
  const hw = halfWidth(actor);
  let best = null;
  let bestScore = Infinity;

  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    const [x, y, width] = p;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width)) continue;
    const horizontal = actor.x + hw > x + 2 && actor.x - hw < x + width - 2;
    const vertical = Math.abs(foot - y) <= 30;
    if (!horizontal || !vertical) continue;
    const score = Math.abs(foot - y);
    if (score < bestScore) {
      bestScore = score;
      best = { index: i, x, y, width, platform: p };
    }
  }
  return best;
}

function initialize(scene, enemy) {
  if (enemy.getData('movementV4')) return;
  const route = enemy.getData('route') || {};
  const platform = platformAt(scene, enemy);
  const hw = halfWidth(enemy);
  const routeMin = Number.isFinite(route.min) ? route.min : enemy.x - 100;
  const routeMax = Number.isFinite(route.max) ? route.max : enemy.x + 100;
  let min = routeMin;
  let max = routeMax;

  if (platform) {
    min = Math.max(min, platform.x + hw + 8);
    max = Math.min(max, platform.x + platform.width - hw - 8);
    enemy.setData('platformIndex', platform.index);
    enemy.setData('platformX', platform.x);
    enemy.setData('platformRight', platform.x + platform.width);
  }

  if (min > max) {
    min = routeMin;
    max = routeMax;
  }

  enemy.setData('aiMin', min);
  enemy.setData('aiMax', max);
  enemy.setData('aiDirection', enemy.getData('direction') || 1);
  enemy.setData('aiLastX', enemy.x);
  enemy.setData('aiLastTime', scene.elapsedMs || 0);
  enemy.setData('aiBlockedUntil', 0);
  enemy.setData('movementV4', true);
}

function samePlatform(scene, enemy) {
  const enemyIndex = enemy.getData('platformIndex');
  if (!Number.isInteger(enemyIndex)) return Math.abs(scene.player.y - enemy.y) < 38;
  const playerPlatform = platformAt(scene, scene.player);
  return Boolean(playerPlatform && playerPlatform.index === enemyIndex);
}

function stop(enemy) {
  enemy.body?.setVelocityX(0);
}

function patrol(scene, enemy, profile, delta) {
  let direction = enemy.getData('aiDirection') || 1;
  const min = enemy.getData('aiMin');
  const max = enemy.getData('aiMax');
  const speed = profile.patrol;
  const blockedLeft = enemy.body?.blocked?.left || enemy.body?.touching?.left;
  const blockedRight = enemy.body?.blocked?.right || enemy.body?.touching?.right;

  if (blockedLeft && direction < 0) direction = 1;
  if (blockedRight && direction > 0) direction = -1;

  const next = enemy.x + direction * speed * delta / 1000;
  if (next <= min) {
    enemy.x = min;
    direction = 1;
    stop(enemy);
  } else if (next >= max) {
    enemy.x = max;
    direction = -1;
    stop(enemy);
  } else {
    enemy.body.setVelocityX(direction * speed);
  }

  enemy.setData('aiDirection', direction);
}

function canMoveToward(scene, enemy, direction) {
  if (direction === 0) return false;
  if (direction < 0 && (enemy.body?.blocked?.left || enemy.body?.touching?.left)) return false;
  if (direction > 0 && (enemy.body?.blocked?.right || enemy.body?.touching?.right)) return false;

  const min = enemy.getData('aiMin');
  const max = enemy.getData('aiMax');
  const margin = 12;
  if (direction < 0 && enemy.x <= min + margin) return false;
  if (direction > 0 && enemy.x >= max - margin) return false;
  return true;
}

function updateEnemy(scene, enemy, delta) {
  if (!enemy?.active || !enemy.body || !GROUND_TYPES.has(typeOf(enemy))) return;
  const type = typeOf(enemy);
  const profile = PROFILE[type] || PROFILE.security;
  initialize(scene, enemy);

  const now = scene.elapsedMs || 0;
  const player = scene.player;
  if (!player?.active) {
    patrol(scene, enemy, profile, delta);
    return;
  }

  const same = samePlatform(scene, enemy);
  const dx = player.x - enemy.x;
  const distance = Math.abs(dx);
  const vertical = Math.abs(player.y - enemy.y);
  const disabled = scene.empTimer > 0 || scene.decoyTimer > 0;
  const stopDistance = profile.stop + halfWidth(player) * 0.35;
  const canChase = CHASE_TYPES.has(type) && same && !disabled && vertical <= 42 && distance <= profile.range;
  const blockedUntil = enemy.getData('aiBlockedUntil') || 0;

  if (blockedUntil > now) {
    patrol(scene, enemy, profile, delta);
    enemy.setData('aiDirection', -1 * (enemy.getData('aiDirection') || 1));
    return;
  }

  if (!canChase || distance <= stopDistance) {
    if (distance <= stopDistance && same && !disabled) {
      stop(enemy);
      enemy.setData('aiLastX', enemy.x);
      enemy.setData('aiLastTime', now);
    } else {
      patrol(scene, enemy, profile, delta);
    }
  } else {
    const direction = dx < 0 ? -1 : 1;
    if (!canMoveToward(scene, enemy, direction)) {
      enemy.setData('aiBlockedUntil', now + 420);
      patrol(scene, enemy, profile, delta);
    } else {
      enemy.setData('aiDirection', direction);
      enemy.body.setVelocityX(direction * profile.chase);
    }
  }

  const lastX = enemy.getData('aiLastX') ?? enemy.x;
  const lastTime = enemy.getData('aiLastTime') ?? now;
  if (now - lastTime >= 500) {
    const moved = Math.abs(enemy.x - lastX);
    const velocity = Math.abs(enemy.body.velocity.x || 0);
    if (velocity > 25 && moved < 4) {
      const escape = enemy.getData('aiDirection') === 1 ? -1 : 1;
      enemy.setData('aiDirection', escape);
      enemy.setData('aiBlockedUntil', now + 500);
      enemy.body.setVelocityX(escape * profile.patrol);
    }
    enemy.setData('aiLastX', enemy.x);
    enemy.setData('aiLastTime', now);
  }

  enemy.setFlipX((enemy.getData('aiDirection') || 1) < 0);
}

function updateBoss(scene, boss, delta) {
  if (!boss?.active || !boss.body) return;
  const route = boss.getData('route') || {};
  const min = Number.isFinite(route.min) ? route.min : boss.x - 180;
  const max = Number.isFinite(route.max) ? route.max : boss.x + 180;
  const same = samePlatform(scene, boss);
  const distance = Math.abs(scene.player.x - boss.x);
  let direction = boss.getData('aiDirection') || 1;

  if (boss.body.blocked?.left && direction < 0) direction = 1;
  if (boss.body.blocked?.right && direction > 0) direction = -1;

  if (same && distance > 180 && !scene.empTimer && !scene.decoyTimer) {
    direction = scene.player.x < boss.x ? -1 : 1;
  }

  if (boss.x <= min + 8) direction = 1;
  if (boss.x >= max - 8) direction = -1;

  const speed = same && distance > 180 ? 48 : 34;
  boss.setData('aiDirection', direction);
  boss.body.setVelocityX(direction * speed);
  boss.setFlipX(direction < 0);
}

export function installEnemyAIMovementV4(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__enemyAIMovementV4) return;
  const prototype = RunnerScene.prototype;

  prototype.updateEnemies = function stableEnemyMovementV4(delta) {
    this.enemies?.getChildren().forEach(enemy => updateEnemy(this, enemy, delta));
  };

  prototype.updateSciFiThreats = function stableThreatMovementV4(delta) {
    // Preserve the existing projectile/ability cleanup and movement by calling
    // the runtime's original method first, then correct only boss horizontal AI.
    const original = this.__enemyRuntimeOriginalThreatUpdate;
    if (original) original.call(this, delta);
    updateBoss(this, this.boss, delta);
  };

  prototype.__enemyAIMovementV4 = true;
}
