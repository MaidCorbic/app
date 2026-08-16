const LEGACY_ROUTE_ENEMIES = new Set([
  'security:4550:430:4420:4680',
  'guard:5250:470:5120:5420',
  'security:5790:430:5630:5950',
]);

const keyOf = enemy => `${enemy.type}:${enemy.x}:${enemy.y}:${enemy.min}:${enemy.max}`;

export function installEnemyLayout(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__enemyLayoutV2) return;
  const prototype = RunnerScene.prototype;
  const originalCreateEnemies = prototype.createEnemies;

  prototype.createEnemies = function createMissionEnemiesOnly() {
    const originalEnemies = this.mission?.enemies || [];
    const authoredEnemies = originalEnemies.filter(enemy => !LEGACY_ROUTE_ENEMIES.has(keyOf(enemy)));
    const originalMissionEnemies = this.mission.enemies;
    this.mission.enemies = authoredEnemies;
    try {
      originalCreateEnemies.call(this);
    } finally {
      this.mission.enemies = originalMissionEnemies;
    }
  };

  prototype.__enemyLayoutV2 = true;
}

// Runtime is installed immediately after layout in packages.js. Queue the
// stability wrapper so it always wraps the final runtime methods.
void import('./enemy-ai-stability-v2.js')
  .then(({ installEnemyAIStability }) => queueMicrotask(() => installEnemyAIStability(RunnerScene)))
  .catch(error => console.error('[enemy-ai-stability] failed to initialize', error));
