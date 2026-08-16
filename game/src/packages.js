export const packages = {
  'first-delivery': { type: 'STANDARD', objective: 'Deliver the starter relay intact.', duration: '01:10', condition: false },
  'dead-drop': { type: 'URGENT', objective: 'Beat the dock dispatch window.', duration: '01:18', condition: false },
  blackout: { type: 'FRAGILE', objective: 'Protect the blackout relay capsule.', duration: '01:25', condition: true },
  pursuit: { type: 'HIGH VALUE', objective: 'Carry a corporate-grade signal through security.', duration: '01:22', condition: true },
  'signal-storm': { type: 'SECRET', objective: 'Route the Crown Array storm signal.', duration: '01:30', condition: true },
  'corporate-lockdown': { type: 'OVERSIZED', objective: 'Carry the Helix relay core through the corporate lockdown.', duration: '01:38', condition: true, speedMultiplier: .88 },
  'final-relay': { type: 'PRIME RELAY', objective: 'Deliver the city core to Apex Spine before the network closes.', duration: '01:45', condition: true, speedMultiplier: .92 },
};

// Enemy-layout compatibility bridge.
// Keep mission-authored enemies as the source of truth and remove only the
// legacy route entries plus leftover procedural normal threats. This is kept
// here temporarily because the route builder and RunnerScene are legacy code.
import { missions } from './missions.js';

const LEGACY_ROUTE_ENEMIES = new Set([
  'security:4550:430:4420:4680',
  'guard:5250:470:5120:5420',
  'security:5790:430:5630:5950',
]);

const missionEnemyKey = enemy => (
  `${enemy.type}:${enemy.x}:${enemy.y}:${enemy.min}:${enemy.max}`
);

for (const mission of missions) {
  mission.enemies = (mission.enemies || []).filter(
    enemy => !LEGACY_ROUTE_ENEMIES.has(missionEnemyKey(enemy)),
  );
}

// RunnerScene imports packages.js, so this must remain deferred. The filter is
// based on authored mission data rather than the current Phaser display list,
// which makes it safe regardless of whether authored enemies are created before
// or after the procedural threat generator runs.
void import('./scenes/RunnerScene.js').then(({ RunnerScene }) => {
  if (RunnerScene.prototype.__missionEnemyLayoutPatch) return;

  const originalCreateSciFiThreats = RunnerScene.prototype.createSciFiThreats;
  if (typeof originalCreateSciFiThreats !== 'function') {
    console.warn('[enemy-layout] createSciFiThreats is unavailable; no patch applied');
    return;
  }

  RunnerScene.prototype.createSciFiThreats = function createMissionEnemyLayout() {
    const missionEnemyKeys = new Set(
      (this.mission?.enemies || []).map(missionEnemyKey),
    );
    const keepTutorial = this.mission?.id === 'first-delivery';

    originalCreateSciFiThreats.call(this);

    const children = this.enemies?.getChildren?.() || [];
    children.forEach(enemy => {
      const data = enemy.getData?.() || {};
      const type = data.type ?? enemy.texture?.key;
      const x = Number.isFinite(enemy.x) ? Math.round(enemy.x) : enemy.x;
      const y = Number.isFinite(enemy.y) ? Math.round(enemy.y) : enemy.y;
      const min = Number.isFinite(data.min) ? data.min : undefined;
      const max = Number.isFinite(data.max) ? data.max : undefined;
      const authoredKey = `${type}:${x}:${y}:${min}:${max}`;
      const isAuthored = missionEnemyKeys.has(authoredKey);
      const isBoss = data.boss === true || enemy.getData?.('boss') === true;
      const isTutorialThreat = keepTutorial && (
        enemy.texture?.key === 'enemy-runner' || enemy.texture?.key === 'chicken'
      );

      if (isAuthored || isBoss || isTutorialThreat) return;

      data.indicator?.destroy?.();
      data.tutorialLabel?.destroy?.();
      enemy.destroy();
    });
  };

  RunnerScene.prototype.__missionEnemyLayoutPatch = true;
}).catch(error => {
  console.error('[enemy-layout] compatibility patch failed to load', error);
});
