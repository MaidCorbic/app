export const packages = {
  'first-delivery': { type: 'STANDARD', objective: 'Deliver the starter relay intact.', duration: '01:10', condition: false },
  'dead-drop': { type: 'URGENT', objective: 'Beat the dock dispatch window.', duration: '01:18', condition: false },
  blackout: { type: 'FRAGILE', objective: 'Protect the blackout relay capsule.', duration: '01:25', condition: true },
  pursuit: { type: 'HIGH VALUE', objective: 'Carry a corporate-grade signal through security.', duration: '01:22', condition: true },
  'signal-storm': { type: 'SECRET', objective: 'Route the Crown Array storm signal.', duration: '01:30', condition: true },
  'corporate-lockdown': { type: 'OVERSIZED', objective: 'Carry the Helix relay core through the corporate lockdown.', duration: '01:38', condition: true, speedMultiplier: .88 },
  'final-relay': { type: 'PRIME RELAY', objective: 'Deliver the city core to Apex Spine before the network closes.', duration: '01:45', condition: true, speedMultiplier: .92 },
};

void import('./scenes/RunnerScene.js')
  .then(async ({ RunnerScene }) => {
    const [{ installMissionFeatureGating }, { installEnemyRuntime }, { installEnemyLayout }, { installEnemyAIAwareness }, { installGhostRun }, { installReactiveCourierEncounter }, { installWorldMemory }, { installGrappleTraversal }, { installTeleportNetwork }, { installBiohazardContamination }, { installAutonomousCharacter }, { installPlayerVisualV2 }, { installEarthquakeEvents }, { installEarthquakeCinematic }] = await Promise.all([
      import('./systems/mission-feature-gating-v1.js'),
      import('./systems/enemy-runtime-v2.js'),
      import('./systems/enemy-layout-v2.js'),
      import('./systems/enemy-ai-awareness-v1.js'),
      import('./systems/ghost-run-v1.js'),
      import('./systems/reactive-courier-encounter-v1.js'),
      import('./systems/world-memory-v1.js'),
      import('./systems/grapple-traversal-v1.js'),
      import('./systems/teleport-network-v1.js'),
      import('./systems/biohazard-contamination-v1.js'),
      import('./systems/autonomous-character-v1.js'),
      import('./systems/player-visual-v2.js'),
      import('./systems/earthquake-events-v1.js'),
      import('./systems/earthquake-events-cinematic-v1.js'),
    ]);
    installMissionFeatureGating(RunnerScene);
    installEnemyLayout(RunnerScene);
    installEnemyRuntime(RunnerScene);
    installEnemyAIAwareness(RunnerScene);
    installGhostRun(RunnerScene);
    installWorldMemory(RunnerScene);
    installReactiveCourierEncounter(RunnerScene);
    installGrappleTraversal(RunnerScene);
    installTeleportNetwork(RunnerScene);
    installBiohazardContamination(RunnerScene);
    installAutonomousCharacter(RunnerScene);
    installPlayerVisualV2(RunnerScene);
    installEarthquakeEvents(RunnerScene);
    installEarthquakeCinematic(RunnerScene);
  })
  .catch(error => console.error('[gameplay-runtime] failed to initialize', error));
