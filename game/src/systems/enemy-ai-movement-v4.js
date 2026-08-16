const GROUND_TYPES = new Set(['security', 'guard', 'enemy-runner', 'chicken', 'dino', 'alien-ground']);
const CHASE_TYPES = new Set(['security', 'guard', 'enemy-runner', 'dino', 'alien-ground']);

const PROFILE = Object.freeze({
  security: { patrol: 54, chase: 78, range: 220, stop: 58, acceleration: 420 },
  guard: { patrol: 42, chase: 64, range: 175, stop: 62, acceleration: 360 },
  'enemy-runner': { patrol: 82, chase: 126, range: 285, stop: 66, acceleration: 560 },
  chicken: { patrol: 30, chase: 0, range: 260, stop: 54, acceleration: 300 },
  dino: { patrol: 58, chase: 88, range: 250, stop: 72, acceleration: 420 },
  'alien-ground': { patrol: 46, chase: 70, range: 320, stop: 62, acceleration: 380 },
});

const halfWidth = actor => Math.max(10, (actor?.body?.width || actor?.width || 40) * 0.5);
const halfHeight = actor => Math.max(10, (actor?.body?.height || actor?.height || 40) * 0.5);
const typeOf = enemy => enemy?.getData?.('route')?.type || enemy?.texture?.key || 'unknown';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function platformAt(scene, actor) {
  const platforms = scene.mission?.platforms || [];
  if (!actor?.active || !platforms.length) return null;
  const foot = actor.y + halfHeight(actor);
  const hw = halfWidth(actor);
  let best = null;
  let score = Infinity;
  platforms.forEach((platform, index) => {
    const [x, y, width] = platform;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width)) return;
    if (actor.x + hw <= x + 2 || actor.x - hw >= x + width - 2) return;
    const vertical = Math.abs(foot - y);
    if (vertical <= 34 && vertical < score) {
      score = vertical;
      best = { index, x, y, width };
    }
  });
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
    min = Math.max(routeMin, platform.x + hw + 8);
    max = Math.min(routeMax, platform.x + platform.width - hw - 8);
    enemy.setData('platformIndex', platform.index);
  }
  if (min > max) { min = routeMin; max = routeMax; }
  enemy.setData('aiMin', min);
  enemy.setData('aiMax', max);
  enemy.setData('aiDirection', enemy.getData('direction') || 1);
  enemy.setData('aiLastX', enemy.x);
  enemy.setData('aiLastTime', scene.elapsedMs || 0);
  enemy.setData('aiBlockedUntil', 0);
  enemy.setData('aiStuckTime', 0);
  enemy.setData('movementV4', true);
}

function samePlatform(scene, enemy) {
  const playerPlatform = platformAt(scene, scene.player);
  const enemyIndex = enemy.getData('platformIndex');
  if (Number.isInteger(enemyIndex) && playerPlatform) return enemyIndex === playerPlatform.index;
  return Math.abs(scene.player.y - enemy.y) <= 42;
}

function setVelocitySmooth(enemy, target, delta, acceleration) {
  const current = enemy.body.velocity.x || 0;
  const maxChange = acceleration * Math.max(0, delta) / 1000;
  const next = current + clamp(target - current, -maxChange, maxChange);
  enemy.body.setVelocityX(next);
}

function stopSmooth(enemy, delta, acceleration) {
  setVelocitySmooth(enemy, 0, delta, acceleration * 1.35);
}

function patrol(scene, enemy, profile, delta) {
  let direction = enemy.getData('aiDirection') || 1;
  const min = enemy.getData('aiMin');
  const max = enemy.getData('aiMax');
  const leftBlocked = enemy.body.blocked?.left || enemy.body.touching?.left;
  const rightBlocked = enemy.body.blocked?.right || enemy.body.touching?.right;
  if (leftBlocked && direction < 0) direction = 1;
  if (rightBlocked && direction > 0) direction = -1;

  const edgeMargin = 10;
  if (direction < 0 && enemy.x <= min + edgeMargin) direction = 1;
  if (direction > 0 && enemy.x >= max - edgeMargin) direction = -1;

  setVelocitySmooth(enemy, direction * profile.patrol, delta, profile.acceleration);
  enemy.setData('aiDirection', direction);
}

function canMoveToward(enemy, direction) {
  if (direction < 0 && (enemy.body.blocked?.left || enemy.body.touching?.left)) return false;
  if (direction > 0 && (enemy.body.blocked?.right || enemy.body.touching?.right)) return false;
  const min = enemy.getData('aiMin');
  const max = enemy.getData('aiMax');
  return !(direction < 0 && enemy.x <= min + 8) && !(direction > 0 && enemy.x >= max - 8);
}

function updateMovement(scene, enemy, delta) {
  if (!enemy?.active || !enemy.body || !GROUND_TYPES.has(typeOf(enemy))) return;
  const type = typeOf(enemy);
  const profile = PROFILE[type] || PROFILE.security;
  initialize(scene, enemy);
  const now = scene.elapsedMs || 0;
  const player = scene.player;
  if (!player?.active) { patrol(scene, enemy, profile, delta); return; }

  const same = samePlatform(scene, enemy);
  const dx = player.x - enemy.x;
  const distance = Math.abs(dx);
  const vertical = Math.abs(player.y - enemy.y);
  const disabled = scene.empTimer > 0 || scene.decoyTimer > 0;
  const stopDistance = profile.stop + halfWidth(player) * 0.35;
  const chargeUntil = enemy.getData('chargeUntil') || 0;
  const chargeActive = chargeUntil > now && same && !disabled;
  let targetVelocity = 0;
  let desiredDirection = enemy.getData('aiDirection') || 1;

  if (chargeActive) {
    const target = enemy.getData('chargeTarget') ?? player.x;
    desiredDirection = target < enemy.x ? -1 : 1;
    targetVelocity = desiredDirection * (type === 'dino' ? 150 : 130);
  } else {
    const canChase = CHASE_TYPES.has(type) && same && !disabled && vertical <= 42 && distance <= profile.range;
    if (canChase && distance > stopDistance && canMoveToward(enemy, dx < 0 ? -1 : 1)) {
      desiredDirection = dx < 0 ? -1 : 1;
      targetVelocity = desiredDirection * profile.chase;
    } else if (same && distance <= stopDistance && !disabled) {
      stopSmooth(enemy, delta, profile.acceleration);
      desiredDirection = enemy.getData('aiDirection') || desiredDirection;
    } else {
      patrol(scene, enemy, profile, delta);
      desiredDirection = enemy.getData('aiDirection') || desiredDirection;
      targetVelocity = null;
    }
  }

  if (targetVelocity !== null) setVelocitySmooth(enemy, targetVelocity, delta, profile.acceleration);
  enemy.setData('aiDirection', desiredDirection);

  // Never teleport the body at route edges. Reverse before the edge and let
  // Arcade Physics move it naturally, eliminating one-frame position jitter.
  const min = enemy.getData('aiMin');
  const max = enemy.getData('aiMax');
  if (enemy.x < min) { enemy.body.setVelocityX(Math.max(0, enemy.body.velocity.x)); enemy.setData('aiDirection', 1); }
  if (enemy.x > max) { enemy.body.setVelocityX(Math.min(0, enemy.body.velocity.x)); enemy.setData('aiDirection', -1); }

  const lastX = enemy.getData('aiLastX') ?? enemy.x;
  const lastTime = enemy.getData('aiLastTime') ?? now;
  if (now - lastTime >= 700) {
    const moved = Math.abs(enemy.x - lastX);
    const velocity = Math.abs(enemy.body.velocity.x || 0);
    if (velocity > 30 && moved < 5) {
      const escape = (enemy.getData('aiDirection') || 1) * -1;
      enemy.setData('aiDirection', escape);
      enemy.setData('aiBlockedUntil', now + 380);
      enemy.body.setVelocityX(escape * profile.patrol);
    }
    enemy.setData('aiLastX', enemy.x);
    enemy.setData('aiLastTime', now);
  }

  enemy.setFlipX(desiredDirection < 0);
  const indicator = enemy.getData('indicator');
  indicator?.setPosition(enemy.x, enemy.y - 30);
  enemy.getData('tutorialLabel')?.setPosition(enemy.x, enemy.y - 76);
  enemy.getData('abilityLabel')?.setPosition(enemy.x, enemy.y - 54);
}

function updateBossMovement(scene, boss, delta) {
  if (!boss?.active || !boss.body) return;
  const route = boss.getData('route') || {};
  const min = Number.isFinite(route.min) ? route.min : boss.x - 180;
  const max = Number.isFinite(route.max) ? route.max : boss.x + 180;
  let direction = boss.getData('aiDirection') || boss.getData('direction') || 1;
  const same = samePlatform(scene, boss);
  const distance = Math.abs(scene.player.x - boss.x);
  if (boss.body.blocked?.left && direction < 0) direction = 1;
  if (boss.body.blocked?.right && direction > 0) direction = -1;
  if (same && distance > 190 && !scene.empTimer && !scene.decoyTimer) direction = scene.player.x < boss.x ? -1 : 1;
  if (boss.x <= min + 10) direction = 1;
  if (boss.x >= max - 10) direction = -1;
  setVelocitySmooth(boss, direction * (same && distance > 190 ? 44 : 30), delta, 260);
  boss.setData('aiDirection', direction);
  boss.setFlipX(direction < 0);
}

export function installEnemyAIMovementV4(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__enemyAIMovementV4) return;
  const prototype = RunnerScene.prototype;
  const originalUpdateEnemies = prototype.updateEnemies;
  const originalUpdateThreats = prototype.updateSciFiThreats;

  prototype.updateEnemies = function stableEnemyMovementV4(delta) {
    // Runtime V2 owns abilities, telegraphs and detection. This controller is
    // the only writer of ordinary enemy horizontal movement.
    originalUpdateEnemies?.call(this, delta);
    this.enemies?.getChildren().forEach(enemy => updateMovement(this, enemy, delta));
  };

  prototype.updateSciFiThreats = function stableThreatMovementV4(delta) {
    originalUpdateThreats?.call(this, delta);
    updateBossMovement(this, this.boss, delta);
  };

  prototype.__enemyAIMovementV4 = true;
}
