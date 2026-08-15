import { RunnerScene } from './scenes/RunnerScene.js';

export const packages = {
  'first-delivery': { type: 'STANDARD', objective: 'Deliver the starter relay intact.', duration: '01:10', condition: false },
  'dead-drop': { type: 'URGENT', objective: 'Beat the dock dispatch window.', duration: '01:18', condition: false },
  blackout: { type: 'FRAGILE', objective: 'Protect the blackout relay capsule.', duration: '01:25', condition: true },
  pursuit: { type: 'HIGH VALUE', objective: 'Carry a corporate-grade signal through security.', duration: '01:22', condition: true },
  'signal-storm': { type: 'SECRET', objective: 'Route the Crown Array storm signal.', duration: '01:30', condition: true },
  'corporate-lockdown': { type: 'OVERSIZED', objective: 'Carry the Helix relay core through the corporate lockdown.', duration: '01:38', condition: true, speedMultiplier: .88 },
  'final-relay': { type: 'PRIME RELAY', objective: 'Deliver the city core to Apex Spine before the network closes.', duration: '01:45', condition: true, speedMultiplier: .92 },
};

// Enemy level-fix patch: authored mission enemies are authoritative.
const GENERIC_ROUTE_ENEMIES = new Set([
  'security:4550:430:4420:4680',
  'guard:5250:470:5120:5420',
  'security:5790:430:5630:5950',
]);
const enemyKey = enemy => `${enemy.type}:${enemy.x}:${enemy.y}:${enemy.min}:${enemy.max}`;

const originalCreateEnemies = RunnerScene.prototype.createEnemies;
RunnerScene.prototype.createEnemies = function createEnemiesWithLevelLayout() {
  const mission = this.mission;
  if (!mission?.enemies?.length) return originalCreateEnemies.call(this);
  const authoredEnemies = mission.enemies;
  mission.enemies = authoredEnemies.filter(enemy => !GENERIC_ROUTE_ENEMIES.has(enemyKey(enemy)));
  try {
    return originalCreateEnemies.call(this);
  } finally {
    mission.enemies = authoredEnemies;
  }
};

const originalCreateSciFiThreats = RunnerScene.prototype.createSciFiThreats;
RunnerScene.prototype.createSciFiThreats = function createLevelEnemiesOnly() {
  const authoredBefore = new Set(this.enemies?.getChildren?.() || []);
  originalCreateSciFiThreats.call(this);
  // Keep projectiles, combat overlaps and authored bosses, but remove the
  // procedural normal enemies that were being injected into every level.
  this.enemies?.getChildren?.().forEach(enemy => {
    if (!enemy.active || authoredBefore.has(enemy) || enemy.getData('boss')) return;
    enemy.getData('indicator')?.destroy();
    enemy.getData('tutorialLabel')?.destroy();
    enemy.destroy();
  });
};
