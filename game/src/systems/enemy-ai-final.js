const GROUND_TYPES = new Set(['security', 'guard', 'enemy-runner', 'chicken', 'dino', 'alien-ground']);
const CHASE_TYPES = new Set(['security', 'guard', 'enemy-runner', 'dino', 'alien-ground']);
const PROFILE = Object.freeze({
  security: { patrol: 54, chase: 78, accel: 900, stop: 58, range: 220 },
  guard: { patrol: 42, chase: 64, accel: 780, stop: 64, range: 175 },
  'enemy-runner': { patrol: 82, chase: 126, accel: 1200, stop: 68, range: 285 },
  chicken: { patrol: 30, chase: 0, accel: 650, stop: 54, range: 260 },
  dino: { patrol: 58, chase: 88, accel: 900, stop: 72, range: 250 },
  'alien-ground': { patrol: 46, chase: 70, accel: 820, stop: 62, range: 320 },
});

const typeOf = enemy => enemy?.getData?.('route')?.type || enemy?.texture?.key || 'unknown';
const halfW = actor => Math.max(10, (actor?.body?.width || actor?.width || 40) * .5);
const halfH = actor => Math.max(10, (actor?.body?.height || actor?.height || 40) * .5);

function platformAt(scene, actor) {
  const platforms = scene.mission?.platforms || [];
  if (!actor?.active) return null;
  const foot = actor.y + halfH(actor);
  const hw = halfW(actor);
  let best = null;
  let score = Infinity;
  for (let index = 0; index < platforms.length; index++) {
    const [x, y, width] = platforms[index] || [];
    if (![x, y, width].every(Number.isFinite)) continue;
    if (actor.x + hw <= x + 2 || actor.x - hw >= x + width - 2) continue;
    const dy = Math.abs(foot - y);
    if (dy <= 38 && dy < score) { score = dy; best = { index, x, y, width }; }
  }
  return best;
}

function initialize(scene, enemy) {
  if (enemy.getData('finalAI')) return;
  const route = enemy.getData('route') || {};
  const platform = platformAt(scene, enemy);
  const hw = halfW(enemy);
  let min = Number.isFinite(route.min) ? route.min : enemy.x - 100;
  let max = Number.isFinite(route.max) ? route.max : enemy.x + 100;
  if (platform) {
    min = Math.max(min, platform.x + hw + 8);
    max = Math.min(max, platform.x + platform.width - hw - 8);
    enemy.setData('platformIndex', platform.index);
  }
  if (min > max) { min = enemy.x - 60; max = enemy.x + 60; }
  enemy.setData('aiMin', min);
  enemy.setData('aiMax', max);
  enemy.setData('aiDir', enemy.getData('direction') || 1);
  enemy.setData('aiStuckAt', enemy.x);
  enemy.setData('aiStuckSince', scene.elapsedMs || 0);
  enemy.setData('finalAI', true);
}

function samePlatform(scene, enemy) {
  const index = enemy.getData('platformIndex');
  if (!Number.isInteger(index)) return Math.abs(scene.player.y - enemy.y) <= 44;
  const playerPlatform = platformAt(scene, scene.player);
  return !!playerPlatform && playerPlatform.index === index;
}

function setSmoothVelocity(enemy, target, acceleration) {
  const body = enemy.body;
  if (!body) return;
  const current = body.velocity.x || 0;
  const delta = target - current;
  const maxStep = acceleration * (1 / 60);
  const next = Math.abs(delta) <= maxStep ? target : current + Math.sign(delta) * maxStep;
  body.setVelocityX(next);
}

function patrol(scene, enemy, profile) {
  let dir = enemy.getData('aiDir') || 1;
  const min = enemy.getData('aiMin');
  const max = enemy.getData('aiMax');
  const blockedLeft = !!(enemy.body?.blocked?.left || enemy.body?.touching?.left);
  const blockedRight = !!(enemy.body?.blocked?.right || enemy.body?.touching?.right);
  if (dir < 0 && blockedLeft) dir = 1;
  if (dir > 0 && blockedRight) dir = -1;
  if (enemy.x <= min + 2) dir = 1;
  if (enemy.x >= max - 2) dir = -1;
  setSmoothVelocity(enemy, dir * profile.patrol, profile.accel);
  enemy.setData('aiDir', dir);
}

function updateGroundEnemy(scene, enemy) {
  if (!enemy?.active || !enemy.body || !GROUND_TYPES.has(typeOf(enemy))) return;
  initialize(scene, enemy);
  const type = typeOf(enemy);
  const profile = PROFILE[type] || PROFILE.security;
  const player = scene.player;
  if (!player?.active) { patrol(scene, enemy, profile); return; }

  const same = samePlatform(scene, enemy);
  const dx = player.x - enemy.x;
  const distance = Math.abs(dx);
  const vertical = Math.abs(player.y - enemy.y);
  const disabled = scene.empTimer > 0 || scene.decoyTimer > 0;
  const stopDistance = profile.stop + halfW(player) * .35;
  const charging = (enemy.getData('chargeUntil') || 0) > (scene.elapsedMs || 0);
  const canChase = CHASE_TYPES.has(type) && same && !disabled && vertical <= 48 && distance <= profile.range;
  let target = 0;

  if (charging && same) {
    const chargeTarget = enemy.getData('chargeTarget') ?? player.x;
    target = (chargeTarget < enemy.x ? -1 : 1) * (type === 'dino' ? 210 : 175);
  } else if (canChase && distance > stopDistance) {
    target = (dx < 0 ? -1 : 1) * profile.chase;
  } else if (canChase && distance <= stopDistance) {
    target = 0;
  } else {
    patrol(scene, enemy, profile);
    target = null;
  }

  if (target !== null) setSmoothVelocity(enemy, target, profile.accel);

  const min = enemy.getData('aiMin');
  const max = enemy.getData('aiMax');
  if (enemy.x <= min) { enemy.x = min; enemy.body.setVelocityX(Math.max(0, enemy.body.velocity.x)); enemy.setData('aiDir', 1); }
  if (enemy.x >= max) { enemy.x = max; enemy.body.setVelocityX(Math.min(0, enemy.body.velocity.x)); enemy.setData('aiDir', -1); }

  const now = scene.elapsedMs || 0;
  const moved = Math.abs(enemy.x - (enemy.getData('aiStuckAt') ?? enemy.x));
  if (Math.abs(enemy.body.velocity.x) > 24 && moved < 2) {
    if (now - (enemy.getData('aiStuckSince') || now) > 420) {
      enemy.setData('aiDir', -(enemy.getData('aiDir') || 1));
      enemy.setData('chargeUntil', 0);
      enemy.body.setVelocityX((enemy.getData('aiDir') || 1) * profile.patrol);
      enemy.setData('aiStuckSince', now);
    }
  } else {
    enemy.setData('aiStuckAt', enemy.x);
    enemy.setData('aiStuckSince', now);
  }
  const facing = Math.abs(enemy.body.velocity.x) > 4 ? enemy.body.velocity.x < 0 : (enemy.getData('aiDir') || 1) < 0;
  enemy.setFlipX(facing);
}

function updateBoss(scene, boss) {
  if (!boss?.active || !boss.body) return;
  const route = boss.getData('route') || {};
  const min = Number.isFinite(route.min) ? route.min : boss.x - 180;
  const max = Number.isFinite(route.max) ? route.max : boss.x + 180;
  const same = samePlatform(scene, boss);
  const dx = scene.player.x - boss.x;
  const distance = Math.abs(dx);
  let dir = boss.getData('finalAIDir') || 1;
  if (boss.body.blocked?.left && dir < 0) dir = 1;
  if (boss.body.blocked?.right && dir > 0) dir = -1;
  if (same && distance > 190 && !scene.empTimer && !scene.decoyTimer) dir = dx < 0 ? -1 : 1;
  if (boss.x <= min + 4) dir = 1;
  if (boss.x >= max - 4) dir = -1;
  const target = same && distance > 190 ? dir * 50 : dir * 28;
  setSmoothVelocity(boss, target, 700);
  boss.setData('finalAIDir', dir);
  boss.setFlipX(dir < 0);
}

function callWithoutHorizontalMovement(fn, scene) {
  const enemies = scene.enemies?.getChildren?.() || [];
  const snapshots = enemies.map(enemy => ({
    enemy,
    x: enemy.x,
    y: enemy.y,
    setVelocityX: enemy.body?.setVelocityX,
  }));
  snapshots.forEach(({ enemy }) => {
    if (enemy.body) enemy.body.setVelocityX = () => enemy.body;
  });
  try { fn.call(scene); } finally {
    snapshots.forEach(({ enemy, x, y, setVelocityX }) => {
      if (!enemy.active) return;
      enemy.x = x;
      if (typeOf(enemy) !== 'invader') enemy.y = y;
      if (enemy.body) enemy.body.setVelocityX = setVelocityX;
    });
  }
}

export function installEnemyAIFinal(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__enemyAIFinal) return;
  const prototype = RunnerScene.prototype;
  const runtimeUpdateEnemies = prototype.updateEnemies;
  const runtimeUpdateThreats = prototype.updateSciFiThreats;

  prototype.updateEnemies = function finalEnemyUpdate(delta) {
    callWithoutHorizontalMovement(runtimeUpdateEnemies, this);
    this.enemies?.getChildren().forEach(enemy => updateGroundEnemy(this, enemy));
  };

  prototype.updateSciFiThreats = function finalThreatUpdate(delta) {
    const boss = this.boss;
    const snapshot = boss ? { x: boss.x, y: boss.y, setVelocityX: boss.body?.setVelocityX } : null;
    if (boss?.body) boss.body.setVelocityX = () => boss.body;
    try { runtimeUpdateThreats.call(this, delta); }
    finally {
      if (boss?.active && snapshot) {
        boss.x = snapshot.x;
        boss.y = snapshot.y;
        boss.body.setVelocityX = snapshot.setVelocityX;
      }
    }
    updateBoss(this, boss);
  };

  prototype.__enemyAIFinal = true;
}
