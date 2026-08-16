const GROUND_TYPES = new Set(['security', 'guard', 'enemy-runner', 'chicken', 'dino', 'alien-ground']);
const CHASE_TYPES = new Set(['security', 'guard', 'enemy-runner', 'dino', 'alien-ground']);
const DIFFICULTY = Object.freeze({
  'first-delivery': { speed: .78, range: .72, reaction: 1.18 },
  'dead-drop': { speed: .88, range: .82, reaction: 1.08 },
  blackout: { speed: .96, range: .90, reaction: 1.02 },
  pursuit: { speed: 1.02, range: .96, reaction: .96 },
  'signal-storm': { speed: 1.08, range: 1, reaction: .90 },
  'corporate-lockdown': { speed: 1.14, range: 1.05, reaction: .86 },
  'final-relay': { speed: 1.20, range: 1.10, reaction: .82 },
});
const PROFILE = Object.freeze({
  security: { patrol: 54, chase: 78, range: 220, stop: 58, accel: 620 },
  guard: { patrol: 42, chase: 64, range: 175, stop: 64, accel: 560 },
  'enemy-runner': { patrol: 82, chase: 126, range: 285, stop: 68, accel: 760 },
  chicken: { patrol: 30, chase: 0, range: 260, stop: 54, accel: 460 },
  dino: { patrol: 58, chase: 88, range: 250, stop: 72, accel: 620 },
  'alien-ground': { patrol: 46, chase: 70, range: 320, stop: 62, accel: 580 },
});
const halfW = actor => Math.max(10, (actor?.body?.width || actor?.width || 40) * .5);
const halfH = actor => Math.max(10, (actor?.body?.height || actor?.height || 40) * .5);
const typeOf = enemy => enemy?.getData?.('route')?.type || enemy?.texture?.key || 'unknown';
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const difficulty = scene => DIFFICULTY[scene.mission?.id] || { speed: 1, range: 1, reaction: 1 };

function platformAt(scene, actor) {
  const platforms = scene.mission?.platforms || [];
  if (!actor?.active) return null;
  const foot = actor.y + halfH(actor), hw = halfW(actor);
  let best = null, score = Infinity;
  for (let index = 0; index < platforms.length; index++) {
    const [x, y, width] = platforms[index] || [];
    if (![x, y, width].every(Number.isFinite)) continue;
    if (actor.x + hw <= x || actor.x - hw >= x + width) continue;
    const dy = Math.abs(foot - y);
    if (dy <= 38 && dy < score) { score = dy; best = { index, x, y, width }; }
  }
  return best;
}

function samePlatform(scene, enemy) {
  const p = platformAt(scene, scene.player), i = enemy.getData('platformIndex');
  return Number.isInteger(i) && p ? p.index === i : Math.abs(scene.player.y - enemy.y) <= 42;
}

function obstacleBlocksSight(scene, enemy, player) {
  if (Math.abs(enemy.y - player.y) > 58) return false;
  const lo = Math.min(enemy.x, player.x), hi = Math.max(enemy.x, player.x);
  return (scene.mission?.obstacles || []).some(([x, y, width = 28]) => {
    if (![x, y, width].every(Number.isFinite)) return false;
    const half = Math.max(14, width * .5);
    return x > lo + halfW(enemy) && x < hi - halfW(player) && Math.abs(y - enemy.y) < 58 && x + half >= lo && x - half <= hi;
  });
}

function canSee(scene, enemy, player, profile, diff) {
  const dx = player.x - enemy.x, dy = player.y - enemy.y;
  if (Math.hypot(dx, dy) > profile.range * diff.range || Math.abs(dy) > 72) return false;
  return !obstacleBlocksSight(scene, enemy, player);
}

function setSmoothVelocity(enemy, target, delta, acceleration) {
  const body = enemy.body;
  if (!body) return;
  const dt = clamp((delta || 16.667) / 1000, 0, .05);
  const current = body.velocity.x || 0;
  const step = acceleration * dt;
  const next = Math.abs(target - current) <= step ? target : current + Math.sign(target - current) * step;
  body.setVelocityX(next);
}

function initialize(scene, enemy) {
  if (enemy.getData('awarenessAI')) return;
  const route = enemy.getData('route') || {}, platform = platformAt(scene, enemy), hw = halfW(enemy);
  let min = Number.isFinite(route.min) ? route.min : enemy.x - 100;
  let max = Number.isFinite(route.max) ? route.max : enemy.x + 100;
  if (platform) {
    min = Math.max(min, platform.x + hw + 8);
    max = Math.min(max, platform.x + platform.width - hw - 8);
    enemy.setData('platformIndex', platform.index);
  }
  if (min > max) { min = enemy.x - 60; max = enemy.x + 60; }
  enemy.setData('aiMin', min); enemy.setData('aiMax', max); enemy.setData('aiDir', enemy.getData('direction') || 1);
  enemy.setData('aiLastX', enemy.x); enemy.setData('aiLastAt', scene.elapsedMs || 0); enemy.setData('awarenessState', 'patrol'); enemy.setData('awarenessAI', true);
}

function patrol(scene, enemy, profile, diff, delta) {
  let dir = enemy.getData('aiDir') || 1;
  const min = enemy.getData('aiMin'), max = enemy.getData('aiMax');
  if ((dir < 0 && enemy.body.blocked?.left) || (dir > 0 && enemy.body.blocked?.right)) dir *= -1;
  if (enemy.x <= min + 5) dir = 1;
  if (enemy.x >= max - 5) dir = -1;
  setSmoothVelocity(enemy, dir * profile.patrol * diff.speed, delta, profile.accel);
  enemy.setData('aiDir', dir);
}

function updateGroundEnemy(scene, enemy, delta) {
  if (!enemy?.active || !enemy.body || !GROUND_TYPES.has(typeOf(enemy))) return;
  initialize(scene, enemy);
  const type = typeOf(enemy), profile = PROFILE[type] || PROFILE.security, diff = difficulty(scene), player = scene.player;
  if (!player?.active) { patrol(scene, enemy, profile, diff, delta); return; }
  const same = samePlatform(scene, enemy), visible = same && canSee(scene, enemy, player, profile, diff);
  const dx = player.x - enemy.x, distance = Math.abs(dx), stop = profile.stop + halfW(player) * .35;
  const disabled = scene.empTimer > 0 || scene.decoyTimer > 0;
  const charging = (enemy.getData('chargeUntil') || 0) > (scene.elapsedMs || 0);
  if (charging && same && !disabled) {
    const target = enemy.getData('chargeTarget') ?? player.x, dir = target < enemy.x ? -1 : 1;
    setSmoothVelocity(enemy, dir * (type === 'dino' ? 180 : 155) * diff.speed, delta, profile.accel * 1.25);
    enemy.setData('aiDir', dir); enemy.setData('awarenessState', 'attack');
  } else if (CHASE_TYPES.has(type) && visible && !disabled && distance > stop) {
    const dir = dx < 0 ? -1 : 1;
    setSmoothVelocity(enemy, dir * profile.chase * diff.speed, delta, profile.accel);
    enemy.setData('aiDir', dir); enemy.setData('awarenessState', 'chase');
  } else if (same && visible && !disabled && distance <= stop) {
    setSmoothVelocity(enemy, 0, delta, profile.accel * 1.35);
    enemy.setData('awarenessState', 'attack');
  } else {
    patrol(scene, enemy, profile, diff, delta); enemy.setData('awarenessState', visible ? 'alert' : 'patrol');
  }
  const min = enemy.getData('aiMin'), max = enemy.getData('aiMax');
  if (enemy.x <= min && enemy.body.velocity.x < 0) { enemy.body.setVelocityX(0); enemy.setData('aiDir', 1); }
  if (enemy.x >= max && enemy.body.velocity.x > 0) { enemy.body.setVelocityX(0); enemy.setData('aiDir', -1); }
  const now = scene.elapsedMs || 0, lastAt = enemy.getData('aiLastAt') || now;
  if (now - lastAt >= 500) {
    const lastX = enemy.getData('aiLastX') ?? enemy.x;
    if (Math.abs(enemy.body.velocity.x) > 24 && Math.abs(enemy.x - lastX) < 3) {
      const escape = -(enemy.getData('aiDir') || 1);
      enemy.setData('aiDir', escape); enemy.setData('chargeUntil', 0); enemy.body.setVelocityX(escape * profile.patrol * diff.speed);
    }
    enemy.setData('aiLastX', enemy.x); enemy.setData('aiLastAt', now);
  }
  const facing = Math.abs(enemy.body.velocity.x) > 4 ? enemy.body.velocity.x < 0 : (enemy.getData('aiDir') || 1) < 0;
  enemy.setFlipX(facing);
}

function updateBoss(scene, boss, delta) {
  if (!boss?.active || !boss.body) return;
  const route = boss.getData('route') || {}, player = scene.player;
  let dir = boss.getData('aiDir') || 1;
  const min = Number.isFinite(route.min) ? route.min : boss.x - 180, max = Number.isFinite(route.max) ? route.max : boss.x + 180;
  const same = samePlatform(scene, boss), distance = Math.abs(player.x - boss.x);
  if (boss.body.blocked?.left && dir < 0) dir = 1;
  if (boss.body.blocked?.right && dir > 0) dir = -1;
  if (same && distance > 190 && !scene.empTimer && !scene.decoyTimer) dir = player.x < boss.x ? -1 : 1;
  if (boss.x <= min + 8) dir = 1;
  if (boss.x >= max - 8) dir = -1;
  setSmoothVelocity(boss, dir * (same && distance > 190 ? 46 : 30), delta, 500);
  boss.setData('aiDir', dir); boss.setFlipX(dir < 0);
}

export function installEnemyAIAwareness(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__enemyAIAwarenessV1) return;
  const prototype = RunnerScene.prototype;
  const runtimeUpdateEnemies = prototype.updateEnemies;
  const runtimeUpdateThreats = prototype.updateSciFiThreats;
  prototype.updateEnemies = function awarenessEnemyUpdate(delta) {
    runtimeUpdateEnemies.call(this, delta);
    this.enemies?.getChildren().forEach(enemy => updateGroundEnemy(this, enemy, delta));
  };
  prototype.updateSciFiThreats = function awarenessThreatUpdate(delta) {
    runtimeUpdateThreats.call(this, delta);
    updateBoss(this, this.boss, delta);
  };
  prototype.__enemyAIAwarenessV1 = true;
}
