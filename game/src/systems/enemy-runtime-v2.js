const PROFILE = Object.freeze({
  security: { speed: 58, chase: 86, range: 220, cooldown: 2200, ability: 'SCAN BOLT', color: 0xff826e },
  guard: { speed: 44, chase: 72, range: 170, cooldown: 2700, ability: 'CHARGE', color: 0xffd06e },
  'enemy-runner': { speed: 92, chase: 154, range: 285, cooldown: 1650, ability: 'PLASMA BURST', color: 0xff826e },
  chicken: { speed: 34, chase: 0, range: 260, cooldown: 2100, ability: 'EGG SHOT', color: 0xffd06e },
  invader: { speed: 30, chase: 48, range: 330, cooldown: 1900, ability: 'COMET BURST', color: 0xe0a7ff, hover: true },
  dino: { speed: 62, chase: 108, range: 250, cooldown: 1800, ability: 'CHARGE', color: 0xaee37f },
  'alien-ground': { speed: 48, chase: 76, range: 360, cooldown: 1650, ability: 'ARC BOLT', color: 0xe0a7ff },
});
const BOSS_ABILITY = Object.freeze({
  'sentinel-boss': { cooldown: 1900, ability: 'WARDEN VOLLEY', color: 0x8df4ff, count: 3 },
  'dino-boss': { cooldown: 1700, ability: 'ALPHA CHARGE', color: 0xffcf82, count: 2 },
  'storm-boss': { cooldown: 1450, ability: 'STORM RING', color: 0xb993ff, count: 5 },
  'apex-boss': { cooldown: 950, ability: 'APEX BURST', color: 0xffd06e, count: 4 },
});
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const typeOf = enemy => enemy?.getData?.('route')?.type || enemy?.texture?.key || 'unknown';
const makeProjectile = (scene, x, y, texture, color, vx, vy = 0, gravityY = 0) => {
  const group = scene.enemyProjectiles;
  if (!group) return null;
  const projectile = group.create(x, y, texture).setDepth(12).setTint(color);
  projectile.body.setAllowGravity(gravityY !== 0); projectile.body.setGravityY(gravityY); projectile.body.setVelocity(vx, vy);
  projectile.setData('enemyProjectile', true); projectile.setData('projectileType', texture); return projectile;
};
function cueAbility(scene, enemy, text, color) {
  const label = enemy.getData('abilityLabel');
  if (label?.active) { label.setText(text).setPosition(enemy.x, enemy.y - 52).setAlpha(1); scene.tweens.add({ targets: label, y: enemy.y - 70, alpha: 0, duration: 520 }); }
  const pulse = scene.add.circle(enemy.x, enemy.y, 12, color, .18).setStrokeStyle(2, color, .7).setDepth(11);
  scene.tweens.add({ targets: pulse, scale: 2.8, alpha: 0, duration: 360, onComplete: () => pulse.destroy() });
  scene.game.events.emit('feedback', 'warning');
}
function installProjectileProtection(scene) {
  if (scene.__enemyProjectileProtection) return;
  scene.__enemyProjectileProtection = true;
  scene.physics.add.overlap(scene.player, scene.enemyProjectiles, (player, projectile) => { if (!projectile.active) return; projectile.destroy(); scene.takeSciFiHit('Enemy ability hit the courier.'); });
}
function spawnBoss(scene) {
  if (!scene.mission.boss) return;
  const profile = scene.mission.boss;
  const boss = scene.enemies.create(scene.mission.goal.x - 250, scene.mission.spawn.y - 12, profile.type).setDepth(8).setImmovable(false);
  boss.body.setAllowGravity(false); boss.body.setSize(Math.min(boss.width * .72, 72), Math.min(boss.height * .72, 72), true);
  boss.setData('route', { type: profile.type, min: scene.mission.goal.x - 390, max: scene.mission.goal.x - 120 }); boss.setData('direction', -1); boss.setData('health', profile.health); boss.setData('boss', true); boss.setData('bossName', profile.name); boss.setData('bossColor', profile.color); boss.setData('attackCooldown', profile.attackCooldown); boss.setData('nextShot', scene.elapsedMs + 900); boss.setTint(profile.color);
  const indicator = scene.add.circle(boss.x, boss.y - 54, 7, profile.color, .25).setStrokeStyle(1, profile.color, .9).setDepth(10);
  const label = scene.add.text(boss.x, boss.y - 82, `${profile.name} · ${profile.health} HP`, { fontFamily: 'DM Mono', fontSize: '9px', color: '#ffcf82', stroke: '#08101c', strokeThickness: 4 }).setOrigin(.5).setDepth(13);
  const abilityLabel = scene.add.text(boss.x, boss.y - 62, BOSS_ABILITY[profile.type]?.ability || 'BOSS ABILITY', { fontFamily: 'DM Mono', fontSize: '8px', color: '#ffcf82', stroke: '#08101c', strokeThickness: 3 }).setOrigin(.5).setDepth(13).setAlpha(.45);
  boss.setData('indicator', indicator); boss.setData('label', label); boss.setData('abilityLabel', abilityLabel); scene.boss = boss;
}
function spawnTutorialEnemies(scene) {
  if (scene.mission.id !== 'first-delivery') return;
  const add = (type, x, y, text) => {
    const enemy = scene.enemies.create(x, y, type).setDepth(8).setImmovable(false); enemy.body.setAllowGravity(false); enemy.body.setSize(Math.min(enemy.width * .72, 34), Math.min(enemy.height * .8, 52), true);
    enemy.setData('route', { type, min: x - 120, max: x + 120 }); enemy.setData('direction', 1); enemy.setData('nextShot', scene.elapsedMs + 1300); enemy.setData('tutorial', true);
    enemy.setData('indicator', scene.add.circle(x, y - 30, 5, 0xff826e, .28).setStrokeStyle(1, 0xffd5c5, .7).setDepth(7));
    enemy.setData('abilityLabel', scene.add.text(x, y - 54, PROFILE[type]?.ability || 'THREAT', { fontFamily: 'DM Mono', fontSize: '8px', color: '#b9f5ff', stroke: '#08101c', strokeThickness: 3 }).setOrigin(.5).setDepth(13).setAlpha(.45));
    enemy.setData('tutorialLabel', scene.add.text(x, y - 76, text, { fontFamily: 'DM Mono', fontSize: '9px', color: '#b9f5ff', stroke: '#08101c', strokeThickness: 4, align: 'center' }).setOrigin(.5).setDepth(13)); return enemy;
  };
  add('enemy-runner', scene.mission.spawn.x + 430, scene.mission.spawn.y, 'SCOUT RUNNER · STOMP OR FIRE'); add('chicken', scene.mission.spawn.x + 700, scene.mission.spawn.y + 10, 'EGG HAZARD · JUMP OR SHOOT');
}
function platformAt(scene, actor) {
  const platforms = scene.mission?.platforms || []; if (!actor?.active) return null;
  const foot = actor.y + (actor.body?.height || actor.height || 40) * .5, halfWidth = Math.max(10, (actor.body?.width || actor.width || 40) * .5); let best = null, score = Infinity;
  platforms.forEach((p, index) => { const [x, y, width] = p; if (![x, y, width].every(Number.isFinite)) return; if (actor.x + halfWidth <= x || actor.x - halfWidth >= x + width) return; const delta = Math.abs(foot - y); if (delta <= 36 && delta < score) { score = delta; best = { index, x, y, width }; } }); return best;
}
function canAttackFromCurrentLevel(scene, enemy, type) {
  const enemyPlatform = platformAt(scene, enemy), playerPlatform = platformAt(scene, scene.player);
  if (enemyPlatform && playerPlatform) return enemyPlatform.index === playerPlatform.index;
  if (enemyPlatform && !playerPlatform) return Math.abs(scene.player.y - enemy.y) < 54;
  if (!enemyPlatform && playerPlatform) return Math.abs(scene.player.y - enemy.y) < 54;
  return Math.abs(scene.player.y - enemy.y) < (type === 'chicken' ? 180 : 70);
}
function fireEnemyAbility(scene, enemy) {
  const type = typeOf(enemy), profile = PROFILE[type]; if (!profile || !enemy.active || scene.empTimer > 0 || scene.decoyTimer > 0) return;
  const now = scene.elapsedMs, nextShot = enemy.getData('nextShot') || 0, distance = Math.abs(scene.player.x - enemy.x);
  if (distance > profile.range || now < nextShot || !canAttackFromCurrentLevel(scene, enemy, type)) return;
  const direction = scene.player.x < enemy.x ? -1 : 1, predictedX = scene.player.x + (scene.player.body?.velocity?.x || 0) * .28, dx = predictedX - enemy.x, dy = scene.player.y - enemy.y;
  if (type === 'guard' || type === 'dino') { enemy.setData('chargeUntil', now + 360); enemy.setData('chargeTarget', predictedX); cueAbility(scene, enemy, profile.ability, profile.color); }
  else if (type === 'invader') { [-150, 0, 150].forEach(offset => makeProjectile(scene, enemy.x, enemy.y + 8, 'comet', profile.color, dx * .58, dy * .25 + offset)); cueAbility(scene, enemy, profile.ability, profile.color); }
  else if (type === 'chicken') { const horizontal = clamp(dx * .72, -360, 360); const lift = -300 - clamp(Math.abs(dy) * .22, 0, 70); makeProjectile(scene, enemy.x + direction * 18, enemy.y - 8, 'egg', profile.color, horizontal, lift, 520); cueAbility(scene, enemy, profile.ability, profile.color); }
  else { const velocity = type === 'security' ? .72 : type === 'alien-ground' ? .78 : .64; const projectile = makeProjectile(scene, enemy.x + direction * 14, enemy.y, 'comet', profile.color, clamp(dx * velocity, -520, 520), clamp(dy * .32 - 35, -260, 260)); projectile?.setData('aimX', predictedX); cueAbility(scene, enemy, profile.ability, profile.color); }
  enemy.setData('nextShot', now + profile.cooldown);
}
function processChargeImpact(scene, enemy) {
  const until = enemy.getData('chargeUntil') || 0; if (!until || scene.elapsedMs > until || !enemy.active) return;
  if (!canAttackFromCurrentLevel(scene, enemy, typeOf(enemy))) { enemy.setData('chargeUntil', 0); return; }
  if (Math.abs(scene.player.x - enemy.x) < 62 && Math.abs(scene.player.y - enemy.y) < 90) { enemy.setData('chargeUntil', 0); scene.takeSciFiHit(`${typeOf(enemy).toUpperCase()} charge hit the courier.`); }
}
function fireBossAbility(scene) {
  const boss = scene.boss; if (!boss?.active) return; const type = typeOf(boss), profile = BOSS_ABILITY[type] || BOSS_ABILITY['sentinel-boss'], distance = Math.abs(scene.player.x - boss.x), now = scene.elapsedMs;
  if (distance > 520 || now < (boss.getData('nextShot') || 0) || scene.empTimer > 0 || scene.decoyTimer > 0) return;
  const dx = scene.player.x - boss.x, dy = scene.player.y - boss.y; cueAbility(scene, boss, profile.ability, profile.color);
  if (type === 'storm-boss') { for (let i = 0; i < profile.count; i++) { const angle = -0.9 + i * .45; makeProjectile(scene, boss.x, boss.y, 'comet', profile.color, Math.cos(angle) * 360, Math.sin(angle) * 360); } }
  else if (type === 'apex-boss') { [-.24, -.08, .08, .24].forEach(angle => makeProjectile(scene, boss.x, boss.y, 'comet', profile.color, Math.cos(angle) * 520 * (dx < 0 ? -1 : 1), Math.sin(angle) * 260)); }
  else { const speed = type === 'dino-boss' ? 430 : 360; [-.22, 0, .22].forEach(angle => makeProjectile(scene, boss.x, boss.y, 'comet', profile.color, dx * .45 + Math.cos(angle) * speed, dy * .22 + Math.sin(angle) * speed * .45)); }
  boss.setData('nextShot', now + Math.max(profile.cooldown, boss.getData('attackCooldown') || profile.cooldown));
}
function decorateHazards(scene) {
  if (scene.__enemyHazardsDecorated || !scene.barriers) return; scene.__enemyHazardsDecorated = true; const accent = scene.mission.blackout ? 0x8df4ff : 0xff826e; scene.hazardDecor = [];
  scene.barriers.getChildren().forEach((barrier, index) => { const color = index % 3 === 0 ? accent : index % 3 === 1 ? 0xffd06e : 0xb993ff; const frame = scene.add.rectangle(barrier.x, barrier.y, 54, 70, 0x07101f, .12).setStrokeStyle(2, color, .75).setDepth(9); const core = scene.add.circle(barrier.x, barrier.y, 5, color, .7).setDepth(10); const label = scene.add.text(barrier.x, barrier.y - 45, index % 3 === 0 ? 'KINETIC' : index % 3 === 1 ? 'LASER' : 'RELAY', { fontFamily: 'DM Mono', fontSize: '7px', color: '#dffcff', stroke: '#08101c', strokeThickness: 3 }).setOrigin(.5).setDepth(10); scene.hazardDecor.push({ barrier, frame, core, label }); if (!scene.motionReduced) scene.tweens.add({ targets: core, scale: { from: .8, to: 1.45 }, alpha: { from: .45, to: .95 }, yoyo: true, repeat: -1, duration: 540 + index * 70 }); });
}
export function installEnemyRuntime(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__enemyRuntimeV2) return;
  const prototype = RunnerScene.prototype, originalCreateHazards = prototype.createHazards;
  prototype.createSciFiThreats = function enemyRuntimeCreateSciFiThreats() {
    this.eggs = this.physics.add.group(); this.comets = this.physics.add.group(); this.enemyProjectiles = this.physics.add.group();
    this.enemies.getChildren().forEach(enemy => { const type = typeOf(enemy), profile = PROFILE[type]; if (!profile) return; enemy.setImmovable(false); enemy.body.setAllowGravity(false); enemy.setData('baseY', enemy.y); enemy.setData('nextShot', this.elapsedMs + 900 + Math.random() * 700); enemy.setData('ability', profile.ability); enemy.setData('abilityLabel', this.add.text(enemy.x, enemy.y - 54, profile.ability, { fontFamily: 'DM Mono', fontSize: '8px', color: '#ffcf82', stroke: '#08101c', strokeThickness: 3 }).setOrigin(.5).setDepth(13).setAlpha(.4)); });
    spawnTutorialEnemies(this); spawnBoss(this); installProjectileProtection(this);
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => { if (!enemy.active || enemy.getData('contactLockUntil') > this.elapsedMs) return; const stomp = player.body.velocity.y > 130 && player.y < enemy.y - 12 && !enemy.getData('boss'); if (stomp) { this.defeatEnemy(enemy, 'STOMP'); return; } enemy.setData('contactLockUntil', this.elapsedMs + 720); const direction = player.x < enemy.x ? -1 : 1; player.body.setVelocity(direction * -260, -330); this.takeSciFiHit('Enemy contact knocked the courier back.'); });
  };
  prototype.updateEnemies = function enemyRuntimeUpdateEnemies(delta) {
    if (!this.enemies) return;
    this.enemies.getChildren().forEach(enemy => { if (!enemy.active) return; processChargeImpact(this, enemy); fireEnemyAbility(this, enemy); const type = typeOf(enemy), profile = PROFILE[type], indicator = enemy.getData('indicator'), distance = Math.abs(this.player.x - enemy.x), alerted = distance < (profile?.range || 180) && Math.abs(this.player.y - enemy.y) < 125; indicator?.setFillStyle(alerted ? 0xffd06e : 0xff826e, alerted ? .78 : .28); indicator?.setRadius(alerted ? 8 : 5); });
    if (this.alarmTimer > 0) this.alarmTimer = Math.max(0, this.alarmTimer - delta);
    const detected = this.enemies?.getChildren().some(enemy => enemy.active && ['security', 'guard'].includes(typeOf(enemy)) && Math.abs(enemy.x - this.player.x) < 180 && Math.abs(enemy.y - this.player.y) < 100);
    if (detected) this.alarmTimer = Math.max(this.alarmTimer, this.alarmDuration(1200)); this.game.events.emit('detection', Math.ceil(this.alarmTimer / 100));
  };
  prototype.updateSciFiThreats = function enemyRuntimeUpdateSciFiThreats(delta) {
    fireBossAbility(this);
    this.enemyProjectiles?.getChildren().forEach(projectile => { if (!projectile.active || projectile.x < -80 || projectile.x > this.worldWidth + 80 || projectile.y < -100 || projectile.y > 840) projectile.destroy(); else if (projectile.getData('projectileType') === 'egg') { const vx = projectile.body.velocity.x || 0, vy = projectile.body.velocity.y || 0; projectile.setAngle(Math.atan2(vy, vx) * 180 / Math.PI + 90); } });
    this.eggs?.getChildren().forEach(projectile => { if (!projectile.active || projectile.x < -80 || projectile.x > this.worldWidth + 80 || projectile.y > 840) projectile.destroy(); });
    this.comets?.getChildren().forEach(projectile => { if (!projectile.active || projectile.x < -80 || projectile.x > this.worldWidth + 80 || projectile.y < -100 || projectile.y > 840) projectile.destroy(); else projectile.setAngle(projectile.body.velocity.y * .035); });
  };
  prototype.createHazards = function enemyRuntimeCreateHazards() { originalCreateHazards.call(this); decorateHazards(this); };
  prototype.__enemyRuntimeV2 = true;
}
