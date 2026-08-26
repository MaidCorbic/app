// Deterministic gameplay feature installer.
// RunnerScene imports ../packages.js for mission data, so packages.js must not
// dynamically import RunnerScene again. This module owns all prototype installers
// and is imported by main.js after the authoritative RunnerScene module exists.
import { RunnerScene } from './scenes/RunnerScene.js';
import { installMissionFeatureGating } from './systems/mission-feature-gating-v1.js';
import { installEnemyRuntime } from './systems/enemy-runtime-v2.js';
import { installEnemyLayout } from './systems/enemy-layout-v2.js';
import { installEnemyAIAwareness } from './systems/enemy-ai-awareness-v1.js';
import { installGhostRun } from './systems/ghost-run-v1.js';
import { installReactiveCourierEncounter } from './systems/reactive-courier-encounter-v1.js';
import { installWorldMemory } from './systems/world-memory-v1.js';
import { installGrappleTraversal } from './systems/grapple-traversal-v1.js';
import { installTeleportNetwork } from './systems/teleport-network-v1.js';
import { installBiohazardContamination } from './systems/biohazard-contamination-v1.js';
import { installAutonomousCharacter } from './systems/autonomous-character-v1.js';
import { installPlayerVisualV2 } from './systems/player-visual-v2.js';
import { installEarthquakeEvents } from './systems/earthquake-events-v1.js';
import { installEarthquakeCinematic } from './systems/earthquake-events-cinematic-v1.js';

if (!RunnerScene.prototype.__relayFeatureRuntimeInstalled) {
  RunnerScene.prototype.__relayFeatureRuntimeInstalled = true;

  // Feature gating must be installed before feature-specific create wrappers.
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
}
