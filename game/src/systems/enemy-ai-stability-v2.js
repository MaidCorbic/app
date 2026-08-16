const GROUND_TYPES = new Set(['security', 'guard', 'enemy-runner', 'chicken', 'dino', 'alien-ground']);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const typeOf = e => e?.getData?.('route')?.type || e?.texture?.key || 'unknown';
const halfW = e => Math.max(10, (e?.body?.width || e?.width || 40) * .5);
const halfH = e => Math.max(12, (e?.body?.height || e?.height || 40) * .5);

function findPlatform(scene, actor) {
  if (!actor?.active) return null;
  const platforms = scene.mission?.platforms || [];
  const foot = actor.y + halfH(actor);
  return platforms.map((p, index) => ({ p, index }))
    .filter(({ p: [x, y, width] }) => actor.x + halfW(actor) >= x && actor.x - halfW(actor) <= x + width && Math.abs(y - foot) <= 30)
    .sort((a, b) => Math.abs(a.p[1] - foot) - Math.abs(b.p[1] - foot))[0] || null;
}

function rememberRoute(scene, enemy) {
  if (enemy.getData('aiReady') || !GROUND_TYPES.has(typeOf(enemy))) return;
  enemy.setData('aiReady', true);
  const route = enemy.getData('route') || {};
  const platform = findPlatform(scene, enemy);
  const [px, py, pw] = platform?.p || [enemy.x - 120, enemy.y, 240];
  const min = Math.max(px + halfW(enemy) + 8, Number.isFinite(route.min) ? route.min : px);
  const max = Math.min(px + pw - halfW(enemy) - 8, Number.isFinite(route.max) ? route.max : px + pw);
  enemy.setData('homePlatformIndex', platform?.index ?? -1);
  enemy.setData('aiMin', min <= max ? min : enemy.x - 90);
  enemy.setData('aiMax', min <= max ? max : enemy.x + 90);
  enemy.setData('aiLastX', enemy.x);
  enemy.setData('aiStuckMs', 0);
}

function samePlatform(scene, enemy) {
  const ep = findPlatform(scene, enemy);
  const pp = findPlatform(scene, scene.player);
  if (ep && pp) return ep.index === pp.index;
  return Boolean(ep && Math.abs(enemy.y - scene.player.y) <= 30);
}

function obstacleAhead(scene, enemy, direction) {
  const obstacles = scene.mission?.obstacles || [];
  const probeX = enemy.x + direction * (halfW(enemy) + 18);
  const bottom = enemy.y + halfH(enemy);
  const top = enemy.y - halfH(enemy);
  return obstacles.some(([x, y]) => Math.abs(probeX - x) < 30 && bottom >= y - 42 && top <= y + 42);
}

function setMotion(enemy, direction, speed) {
  enemy.setData('direction', direction);
  enemy.body.setVelocityX(direction * speed);
  enemy.setFlipX(direction < 0);
}

function stabilize(scene, enemy, delta) {
  const type = typeOf(enemy);
  if (!GROUND_TYPES.has(type) || !enemy.active || !enemy.body) return;
  rememberRoute(scene, enemy);
  const now = scene.elapsedMs || 0;
  const min = enemy.getData('aiMin');
  const max = enemy.getData('aiMax');
  let direction = enemy.getData('direction') || 1;
  const patrol = type === 'enemy-runner' ? 78 : type === 'dino' ? 54 : type === 'guard' ? 40 : type === 'security' ? 50 : type === 'alien-ground' ? 42 : 30;
  const chase = type === 'enemy-runner' ? 118 : type === 'dino' ? 88 : type === 'guard' ? 60 : type === 'security' ? 72 : type === 'alien-ground' ? 64 : 38;
  const player = scene.player;
  const distance = Math.abs(player.x - enemy.x);
  const vertical = Math.abs(player.y - enemy.y);
  const same = samePlatform(scene, enemy);
  const disabled = scene.empTimer > 0 || scene.decoyTimer > 0;
  const blocked = (enemy.body.blocked?.left && direction < 0) || (enemy.body.blocked?.right && direction > 0);
  const blockedUntil = enemy.getData('aiBlockedUntil') || 0;

  if (blocked) {
    direction = -direction;
    enemy.setData('aiBlockedUntil', now + 700);
    enemy.setData('aiEscapeDirection', direction);
    setMotion(enemy, direction, patrol);
  } else if (blockedUntil > now) {
    direction = enemy.getData('aiEscapeDirection') || -direction;
    setMotion(enemy, direction, patrol);
  } else if (!same || disabled || vertical > 42 || distance > 230) {
    setMotion(enemy, direction, patrol);
    enemy.setData('chargeUntil', 0);
  } else {
    const personalSpace = halfW(enemy) + halfW(player) + 22;
    const targetDirection = player.x < enemy.x ? -1 : 1;
    if (distance <= personalSpace) {
      const retreat = player.x < enemy.x ? 1 : -1;
      if (obstacleAhead(scene, enemy, retreat)) {
        direction = -retreat;
        setMotion(enemy, direction, patrol);
      } else {
        setMotion(enemy, retreat, Math.min(patrol, 34));
      }
    } else if (obstacleAhead(scene, enemy, targetDirection)) {
      direction = -targetDirection;
      enemy.setData('aiBlockedUntil', now + 700);
      enemy.setData('aiEscapeDirection', direction);
      setMotion(enemy, direction, patrol);
    } else {
      setMotion(enemy, targetDirection, chase);
    }
  }

  if (Number.isFinite(min) && Number.isFinite(max)) {
    if (enemy.x <= min) { enemy.x = min; direction = 1; setMotion(enemy, direction, patrol); }
    if (enemy.x >= max) { enemy.x = max; direction = -1; setMotion(enemy, direction, patrol); }
  }

  const lastX = enemy.getData('aiLastX');
  const moved = Math.abs(enemy.x - (lastX ?? enemy.x));
  const stuckMs = (enemy.getData('aiStuckMs') || 0) + (moved < .35 ? delta : -Math.min(delta, 120));
  enemy.setData('aiLastX', enemy.x);
  enemy.setData('aiStuckMs', Math.max(0, stuckMs));
  if (stuckMs > 280) {
    direction = -direction;
    enemy.setData('aiEscapeDirection', direction);
    enemy.setData('aiBlockedUntil', now + 650);
    enemy.setData('aiStuckMs', 0);
    setMotion(enemy, direction, patrol);
  }
}

function stabilizeBoss(scene, boss) {
  if (!boss?.active || !boss.body) return;
  const route = boss.getData('route') || {};
  const min = Number.isFinite(route.min) ? route.min : boss.x - 180;
  const max = Number.isFinite(route.max) ? route.max : boss.x + 180;
  let direction = boss.getData('direction') || 1;
  const bp = findPlatform(scene, boss);
  const pp = findPlatform(scene, scene.player);
  const same = bp && pp ? bp.index === pp.index : Math.abs(boss.y - scene.player.y) <= 42;
  const blocked = (boss.body.blocked?.left && direction < 0) || (boss.body.blocked?.right && direction > 0);
  if (blocked || boss.x <= min + 2 || boss.x >= max - 2) direction = boss.x <= min + 2 ? 1 : boss.x >= max - 2 ? -1 : -direction;
  if (same && Math.abs(scene.player.x - boss.x) > 170 && !scene.empTimer && !scene.decoyTimer) direction = scene.player.x < boss.x ? -1 : 1;
  boss.setData('direction', direction);
  boss.body.setVelocityX(direction * (same ? 48 : 36));
  boss.setFlipX(direction < 0);
  if (boss.x <= min) boss.x = min;
  if (boss.x >= max) boss.x = max;
}

export function installEnemyAIStability(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__enemyAIStabilityV2) return;
  const p = RunnerScene.prototype;
  const originalUpdateEnemies = p.updateEnemies;
  const originalUpdateThreats = p.updateSciFiThreats;
  p.updateEnemies = function stableEnemyUpdate(delta) {
    if (!this.enemies || !this.player) return originalUpdateEnemies.call(this, delta);
    this.enemies.getChildren().forEach(enemy => rememberRoute(this, enemy));
    originalUpdateEnemies.call(this, delta);
    this.enemies.getChildren().forEach(enemy => stabilize(this, enemy, delta));
  };
  p.updateSciFiThreats = function stableThreatUpdate(delta) {
    originalUpdateThreats.call(this, delta);
    stabilizeBoss(this, this.boss);
  };
  p.__enemyAIStabilityV2 = true;
}
