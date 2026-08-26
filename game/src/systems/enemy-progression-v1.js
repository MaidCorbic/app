import { enemyIntel } from '../enemy-intel.js';

const BOSS_LEVEL = 5;
const MAX_NORMAL_LEVEL = 4;
const LEVEL_CAP_BY_MISSION = 4;
const BOSS_TEXTURES = new Set(['dino-boss', 'sentinel-boss', 'storm-boss', 'apex-boss']);

function installEnemyProgression(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__enemyProgressionV1) return;
  RunnerScene.prototype.__enemyProgressionV1 = true;

  RunnerScene.prototype.getEnemyProgression = function (enemyOrKey) {
    const key = typeof enemyOrKey === 'string' ? enemyOrKey : enemyOrKey?.texture?.key;
    if (!key || !enemyIntel[key]) return null;

    if (BOSS_TEXTURES.has(key)) {
      return {
        key,
        level: BOSS_LEVEL,
        multiplier: 1.75,
        rank: 'BOSS',
        unlocked: true,
      };
    }

    const mission = Number(this.mission?.level ?? this.mission?.index ?? 0);
    const level = Math.min(MAX_NORMAL_LEVEL, Math.max(1, 1 + Math.floor(Math.max(0, mission) / 2)));

    return {
      key,
      level,
      multiplier: 1 + ((level - 1) * 0.15),
      rank: `LEVEL ${level}`,
      unlocked: level <= LEVEL_CAP_BY_MISSION,
    };
  };

  // Apply only combat tuning. Never changes player movement or controls.
  RunnerScene.prototype.applyEnemyProgression = function (enemy) {
    const progression = this.getEnemyProgression(enemy);
    if (!progression || !enemy) return progression;

    enemy.__relayEnemyProgression = progression;
    enemy.__relayEnemyBaseDamage ??= Number(enemy.damage ?? enemy.body?.damage ?? 0);
    enemy.__relayEnemyBaseHealth ??= Number(enemy.health ?? enemy.maxHealth ?? 0);

    if (enemy.__relayEnemyBaseDamage > 0) {
      enemy.damage = Math.round(enemy.__relayEnemyBaseDamage * progression.multiplier);
    }

    if (enemy.maxHealth > 0) {
      enemy.maxHealth = Math.round(enemy.__relayEnemyBaseHealth * progression.multiplier);
      if (typeof enemy.health === 'number') enemy.health = Math.min(enemy.health, enemy.maxHealth);
    }

    return progression;
  };

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function (...args) {
    originalCreate.apply(this, args);
    this.__enemyProgressionApplied = new WeakSet();
  };

  const originalUpdate = RunnerScene.prototype.update;
  RunnerScene.prototype.update = function (...args) {
    originalUpdate.apply(this, args);
    if (!this.__enemyProgressionApplied) return;

    const children = this.children?.list || [];
    for (const enemy of children) {
      const key = enemy?.texture?.key;
      if (!key || !enemyIntel[key] || !enemy.active || this.__enemyProgressionApplied.has(enemy)) continue;
      this.applyEnemyProgression(enemy);
      this.__enemyProgressionApplied.add(enemy);
    }
  };
}

export { installEnemyProgression };
