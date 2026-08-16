const GROUND_TYPES = new Set([
  'security',
  'guard',
  'enemy-runner',
  'chicken',
  'dino',
  'alien-ground',
]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const typeOf = enemy => enemy?.getData?.('route')?.type || enemy?.texture?.key || 'unknown';

function platformFor(scene, actor) {
  const platforms = scene.mission?.platforms || [];
  const body = actor?.body;
  const halfWidth = Math.max(10, (body?.width || actor?.width || 40) * .5);
  const footY = actor.y + (body?.height || actor?.height || 40) * .5;
  const candidates = platforms
    .map((platform, index) => ({ platform, index }))
    .filter(({ platform: [x, y, width] }) => {
      return actor.x >= x - halfWidth && actor.x <= x + width + halfWidth && Math.abs(y - footY) <= 78;
    })
    .sort((a, b) => Math.abs(a.platform[1] - footY) - Math.abs(b.platform[1] - footY));
  return candidates[0] || null;
}

function platformBounds(scene, enemy) {
  const home = enemy.getData('homePlatform');
  if (!home) return null;
  const [x, y, width] = home;
  const halfWidth = Math.max(14, (enemy.body?.width || enemy.width || 34) * .5);
  const route = enemy.getData('route') || {};
  const routeMin = Number.isFinite(route.min) ? route.min : x;
  const routeMax = Number.isFinite(route.max) ? route.max : x + width;
  const min = Math.max(x + halfWidth + 4, routeMin);
  const max = Math.min(x + width - halfWidth - 4, routeMax);
  return min <= max ? { min, max } : { min: x + halfWidth + 4, max: x + width - halfWidth - 4 };
}

function rememberHomePlatform(scene, enemy) {
  if (enemy.getData('aiPlatformInitialized')) return;
  enemy.setData('aiPlatformInitialized', true);
  if (!GROUND_TYPES.has(typeOf(enemy))) return;
  const found = platformFor(scene, enemy);
  if (found) enemy.setData('homePlatform', found.platform);
  const route = enemy.getData('route') || {};
  const bounds = platformBounds(scene, enemy);
  if (bounds) {
    enemy.setData('aiMin', bounds.min);
    enemy.setData('aiMax', bounds.max);
  } else if (Number.isFinite(route.min) && Number.isFinite(route.max)) {
    enemy.setData('aiMin', route.min);
    enemy.setData('aiMax', route.max);
  }
}

function samePlatform(scene, enemy) {
  const enemyPlatform = platformFor(scene, enemy);
  const playerPlatform = platformFor(scene, scene.player);
  if (enemyPlatform && playerPlatform) return enemyPlatform.index === playerPlatform.index;
  if (!enemyPlatform || !playerPlatform) return Math.abs(enemy.y - scene.player.y) < 72;
  return false;
}

function patrolDirection(enemy) {
  let direction = enemy.getData('direction') || 1;
  const min = enemy.getData('aiMin');
  const max = enemy.getData('aiMax');
  if (Number.isFinite(min) && enemy.x <= min + 1) direction = 1;
  if (Number.isFinite(max) && enemy.x >= max - 1) direction = -1;
  return direction;
}

function stabilizeGroundEnemy(scene, enemy, delta) {
  const type = typeOf(enemy);
  if (!GROUND_TYPES.has(type) || !enemy.active) return;
  rememberHomePlatform(scene, enemy);

  const min = enemy.getData('aiMin');
  const max = enemy.getData('aiMax');
  const direction = patrolDirection(enemy);
  const profileSpeed = type === 'enemy-runner' ? 92 : type === 'dino' ? 62 : type === 'guard' ? 44 : type === 'security' ? 58 : type === 'alien-ground' ? 48 : 34;
  const chaseSpeed = type === 'enemy-runner' ? 154 : type === 'dino' ? 108 : type === 'guard' ? 72 : type === 'security' ? 86 : type === 'alien-ground' ? 76 : 46;
  const onSamePlatform = samePlatform(scene, enemy);
  const distance = Math.abs(scene.player.x - enemy.x);
  const verticalDistance = Math.abs(scene.player.y - enemy.y);
  const canTrack = onSamePlatform && distance < 300 && verticalDistance < 82 && !scene.empTimer && !scene.decoyTimer;

  if (!onSamePlatform) {
    enemy.setData('chargeUntil', 0);
    const patrolSpeed = profileSpeed;
    enemy.body.setVelocityX(direction * patrolSpeed);
    enemy.setData('direction', direction);
  } else if (distance <= 72) {
    enemy.body.setVelocityX(0);
  } else if (!canTrack) {
    enemy.body.setVelocityX(direction * profileSpeed);
  } else {
    const targetDirection = scene.player.x < enemy.x ? -1 : 1;
    enemy.body.setVelocityX(targetDirection * chaseSpeed);
    enemy.setData('direction', targetDirection);
  }

  if (Number.isFinite(min) && Number.isFinite(max)) {
    const nextX = clamp(enemy.x, min, max);
    if (nextX !== enemy.x) {
      enemy.x = nextX;
      enemy.body.setVelocityX(0);
      enemy.setData('direction', enemy.x <= min + 1 ? 1 : -1);
    }
  }

  const currentDirection = enemy.getData('direction') || direction;
  enemy.setFlipX(currentDirection < 0);
  void delta;
}

function stabilizeBoss(scene, boss) {
  if (!boss?.active) return;
  const route = boss.getData('route') || {};
  const min = Number.isFinite(route.min) ? route.min : boss.x - 180;
  const max = Number.isFinite(route.max) ? route.max : boss.x + 180;
  const distance = Math.abs(scene.player.x - boss.x);
  const verticalDistance = Math.abs(scene.player.y - boss.y);
  const playerPlatform = platformFor(scene, scene.player);
  const bossPlatform = platformFor(scene, boss);
  const same = playerPlatform && bossPlatform ? playerPlatform.index === bossPlatform.index : verticalDistance < 82;
  if (!same) {
    const direction = boss.getData('direction') || 1;
    const next = boss.x + direction * 42 * (scene.game.loop.delta / 1000);
    if (next <= min || next >= max) boss.setData('direction', -direction);
    boss.body.setVelocityX((boss.getData('direction') || direction) * 42);
  } else if (distance < 110) {
    boss.body.setVelocityX(0);
  }
  if (boss.x <= min || boss.x >= max) {
    boss.x = clamp(boss.x, min, max);
    boss.body.setVelocityX(0);
    boss.setData('direction', boss.x <= min ? 1 : -1);
  }
}

export function installEnemyAIStability(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__enemyAIStabilityV2) return;
  const prototype = RunnerScene.prototype;
  const originalUpdateEnemies = prototype.updateEnemies;
  const originalUpdateSciFiThreats = prototype.updateSciFiThreats;

  prototype.updateEnemies = function stableEnemyUpdate(delta) {
    if (!this.enemies || !this.player) return originalUpdateEnemies.call(this, delta);
    this.enemies.getChildren().forEach(enemy => rememberHomePlatform(this, enemy));
    originalUpdateEnemies.call(this, delta);
    this.enemies.getChildren().forEach(enemy => stabilizeGroundEnemy(this, enemy, delta));
  };

  prototype.updateSciFiThreats = function stableThreatUpdate(delta) {
    originalUpdateSciFiThreats.call(this, delta);
    stabilizeBoss(this, this.boss);
  };

  prototype.__enemyAIStabilityV2 = true;
}
