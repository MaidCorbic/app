const GROUND_TYPES = new Set(['security', 'guard', 'enemy-runner', 'chicken', 'dino', 'alien-ground']);
const typeOf = enemy => enemy?.getData?.('route')?.type || enemy?.texture?.key || 'unknown';
const halfWidth = actor => Math.max(10, (actor?.body?.width || actor?.width || 40) * 0.5);

function findPlatform(scene, actor) {
  const platforms = scene.mission?.platforms || [];
  if (!actor?.active || !platforms.length) return null;
  const hw = halfWidth(actor);
  const foot = actor.y + (actor.body?.height || actor.height || 40) * 0.5;
  return platforms.map((platform, index) => ({ platform, index }))
    .filter(({ platform: [x, y, width] }) => actor.x + hw >= x && actor.x - hw <= x + width && Math.abs(y - foot) <= 32)
    .sort((a, b) => Math.abs(a.platform[1] - foot) - Math.abs(b.platform[1] - foot))[0] || null;
}

function initRoute(scene, enemy) {
  if (enemy.getData('aiV3Initialized')) return;
  enemy.setData('aiV3Initialized', true);
  const route = enemy.getData('route') || {};
  const platform = findPlatform(scene, enemy)?.platform;
  const hw = halfWidth(enemy);
  const min = Math.max(platform ? platform[0] + hw + 8 : -Infinity, Number.isFinite(route.min) ? route.min : enemy.x - 100);
  const max = Math.min(platform ? platform[0] + platform[2] - hw - 8 : Infinity, Number.isFinite(route.max) ? route.max : enemy.x + 100);
  enemy.setData('aiMin', Number.isFinite(min) ? min : enemy.x - 100);
  enemy.setData('aiMax', Number.isFinite(max) ? max : enemy.x + 100);
  enemy.setData('aiPlatformIndex', findPlatform(scene, enemy)?.index ?? -1);
  enemy.setData('aiLastX', enemy.x);
  enemy.setData('aiLastMoveAt', scene.elapsedMs || 0);
  enemy.setData('aiBlockedUntil', 0);
}

function samePlatform(scene, enemy) {
  const enemyIndex = enemy.getData('aiPlatformIndex');
  const playerPlatform = findPlatform(scene, scene.player);
  return enemyIndex >= 0 && playerPlatform ? enemyIndex === playerPlatform.index : Math.abs(enemy.y - scene.player.y) <= 34;
}

function obstacleAhead(scene, enemy, direction) {
  if ((direction < 0 && enemy.body?.blocked?.left) || (direction > 0 && enemy.body?.blocked?.right)) return true;
  const obstacles = scene.mission?.obstacles || [];
  const probeX = enemy.x + direction * (halfWidth(enemy) + 18);
  const bodyH = enemy.body?.height || enemy.height || 40;
  const top = enemy.y - bodyH * 0.5;
  const bottom = enemy.y + bodyH * 0.5;
  return obstacles.some(obstacle => {
    const [x, y, width = 48, height = 60] = obstacle;
    return probeX >= x - 12 && probeX <= x + width + 12 && bottom >= y - height * 0.5 && top <= y + height * 0.5;
  });
}

function speedFor(type, chase) {
  if (chase) return { security: 66, guard: 58, 'enemy-runner': 108, chicken: 40, dino: 82, 'alien-ground': 64 }[type] || 50;
  return { security: 42, guard: 36, 'enemy-runner': 70, chicken: 28, dino: 52, 'alien-ground': 42 }[type] || 32;
}

function applyGroundAI(scene, enemy) {
  if (!enemy?.active || !enemy.body || !GROUND_TYPES.has(typeOf(enemy))) return;
  initRoute(scene, enemy);
  const type = typeOf(enemy);
  const min = enemy.getData('aiMin');
  const max = enemy.getData('aiMax');
  let direction = enemy.getData('direction') || 1;
  const same = samePlatform(scene, enemy);
  const dx = scene.player.x - enemy.x;
  const distance = Math.abs(dx);
  const vertical = Math.abs(scene.player.y - enemy.y);
  const now = scene.elapsedMs || 0;
  const recoveryUntil = enemy.getData('aiBlockedUntil') || 0;
  const personalSpace = halfWidth(enemy) + halfWidth(scene.player) + 24;
  if (!same || recoveryUntil > now || scene.empTimer > 0 || scene.decoyTimer > 0) enemy.setData('chargeUntil', 0);
  const canChase = same && vertical <= 38 && distance <= 210 && recoveryUntil <= now && scene.empTimer <= 0 && scene.decoyTimer <= 0;
  let speed = speedFor(type, canChase);

  if (distance <= personalSpace && canChase) {
    const away = dx < 0 ? 1 : -1;
    if (!obstacleAhead(scene, enemy, away)) { direction = away; speed = Math.min(speed, 42); }
    else { direction = -away; speed = 30; enemy.setData('aiBlockedUntil', now + 500); }
  } else if (canChase) {
    const targetDirection = dx < 0 ? -1 : 1;
    if (obstacleAhead(scene, enemy, targetDirection)) {
      direction = -targetDirection;
      enemy.setData('aiBlockedUntil', now + 650);
      speed = speedFor(type, false);
    } else direction = targetDirection;
  } else {
    if (enemy.x <= min + 3) direction = 1;
    if (enemy.x >= max - 3) direction = -1;
    if (obstacleAhead(scene, enemy, direction)) { direction *= -1; enemy.setData('aiBlockedUntil', now + 450); }
  }

  if (enemy.x <= min + 2) direction = 1;
  if (enemy.x >= max - 2) direction = -1;
  enemy.setData('direction', direction);
  enemy.body.setVelocityX(direction * speed);
  enemy.setFlipX(direction < 0);

  const lastX = enemy.getData('aiLastX');
  const lastAt = enemy.getData('aiLastMoveAt') || now;
  if (Math.abs(enemy.x - lastX) < 1.5 && Math.abs(enemy.body.velocity.x) > 20 && now - lastAt > 260) {
    direction *= -1;
    enemy.setData('direction', direction);
    enemy.setData('aiBlockedUntil', now + 550);
    enemy.body.setVelocityX(direction * speedFor(type, false));
  } else if (Math.abs(enemy.x - lastX) >= 1.5) {
    enemy.setData('aiLastX', enemy.x);
    enemy.setData('aiLastMoveAt', now);
  }
}

function applyBossAI(scene, boss) {
  if (!boss?.active || !boss.body) return;
  const route = boss.getData('route') || {};
  const min = Number.isFinite(route.min) ? route.min : boss.x - 180;
  const max = Number.isFinite(route.max) ? route.max : boss.x + 180;
  const same = samePlatform(scene, boss);
  const distance = Math.abs(scene.player.x - boss.x);
  let direction = boss.getData('direction') || 1;
  if (same && distance > 170 && !scene.empTimer && !scene.decoyTimer) direction = scene.player.x < boss.x ? -1 : 1;
  if (boss.x <= min + 4) direction = 1;
  if (boss.x >= max - 4) direction = -1;
  if (obstacleAhead(scene, boss, direction)) direction *= -1;
  boss.setData('direction', direction);
  boss.body.setVelocityX(direction * (same && distance > 170 ? 48 : 34));
  boss.setFlipX(direction < 0);
}

export function installEnemyAIStabilityV3(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__enemyAIStabilityV3) return;
  const prototype = RunnerScene.prototype;
  const previousUpdateEnemies = prototype.updateEnemies;
  const previousUpdateThreats = prototype.updateSciFiThreats;
  prototype.updateEnemies = function enemyAIStabilityV3(delta) {
    if (!this.enemies || !this.player) return previousUpdateEnemies?.call(this, delta);
    const snapshots = this.enemies.getChildren().filter(enemy => enemy.active).map(enemy => ({ enemy, x: enemy.x, y: enemy.y }));
    previousUpdateEnemies?.call(this, delta);
    snapshots.forEach(({ enemy, x, y }) => {
      if (!enemy.active) return;
      enemy.x = x;
      enemy.y = y;
      enemy.body?.updateFromGameObject?.();
    });
    this.enemies.getChildren().forEach(enemy => applyGroundAI(this, enemy));
  };
  prototype.updateSciFiThreats = function enemyAIStabilityV3Threats(delta) {
    previousUpdateThreats?.call(this, delta);
    if (this.boss?.active) applyBossAI(this, this.boss);
  };
  prototype.__enemyAIStabilityV3 = true;
}
