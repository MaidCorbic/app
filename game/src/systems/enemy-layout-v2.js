import { installEnemyAIStability } from './enemy-ai-stability-v2.js';

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

  // Keep enemy AI initialization synchronous with the game runtime. A dynamic
  // import can fail after deployment/cache changes and surface as a global
  // "failed to fetch dynamically imported module" runtime error. Static import
  // makes the Vite build own the dependency and removes that failure mode.
  installEnemyAIStability(RunnerScene);
}
