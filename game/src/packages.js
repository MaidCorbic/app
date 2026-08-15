export const packages = {
  'first-delivery': { type: 'STANDARD', objective: 'Deliver the starter relay intact.', duration: '01:10', condition: false },
  'dead-drop': { type: 'URGENT', objective: 'Beat the dock dispatch window.', duration: '01:18', condition: false },
  blackout: { type: 'FRAGILE', objective: 'Protect the blackout relay capsule.', duration: '01:25', condition: true },
  pursuit: { type: 'HIGH VALUE', objective: 'Carry a corporate-grade signal through security.', duration: '01:22', condition: true },
  'signal-storm': { type: 'SECRET', objective: 'Route the Crown Array storm signal.', duration: '01:30', condition: true },
  'corporate-lockdown': { type: 'OVERSIZED', objective: 'Carry the Helix relay core through the corporate lockdown.', duration: '01:38', condition: true, speedMultiplier: .88 },
  'final-relay': { type: 'PRIME RELAY', objective: 'Deliver the city core to Apex Spine before the network closes.', duration: '01:45', condition: true, speedMultiplier: .92 },
};

// Enemy layout safety bridge. The route() builder historically injected the same
// three enemies into every mission. Remove only those exact legacy entries at
// runtime; authored mission enemies remain the source of truth.
import { missions } from './missions.js';

const LEGACY_ROUTE_ENEMIES = new Set([
  'security:4550:430:4420:4680',
  'guard:5250:470:5120:5420',
  'security:5790:430:5630:5950',
]);

const enemyKey = enemy => `${enemy.type}:${enemy.x}:${enemy.y}:${enemy.min}:${enemy.max}`;

for (const mission of missions) {
  mission.enemies = (mission.enemies || []).filter(enemy => !LEGACY_ROUTE_ENEMIES.has(enemyKey(enemy)));
}

// RunnerScene owns the procedural threat generator. Apply the compatibility
// filter after the scene module finishes evaluating so packages.js does not
// create a circular static import at module initialization time.
void import('./scenes/RunnerScene.js').then(({ RunnerScene }) => {
  if (RunnerScene.prototype.__missionEnemyLayoutPatch) return;

  const originalCreateSciFiThreats = RunnerScene.prototype.createSciFiThreats;
  RunnerScene.prototype.createSciFiThreats = function createMissionEnemyLayout() {
    const authoredBefore = new Set(this.enemies?.getChildren?.() || []);
    originalCreateSciFiThreats.call(this);

    const keepTutorial = this.mission?.id === 'first-delivery';
    const children = this.enemies?.getChildren?.() || [];

    children.forEach(enemy => {
      const isAuthored = authoredBefore.has(enemy);
      const isBoss = enemy.getData('boss') === true;
      const isTutorialThreat = keepTutorial && (
        enemy.texture?.key === 'enemy-runner' || enemy.texture?.key === 'chicken'
      );

      if (isAuthored || isBoss || isTutorialThreat) return;

      enemy.getData('indicator')?.destroy();
      enemy.getData('tutorialLabel')?.destroy();
      enemy.destroy();
    });
  };

  RunnerScene.prototype.__missionEnemyLayoutPatch = true;
}).catch(error => {
  console.error('[enemy-layout] compatibility patch failed to load', error);
});
