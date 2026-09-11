import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../src/systems/gameplay-route-choice-v2.js', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../src/systems/gameplay-route-choice-bridge-v1.js', import.meta.url), 'utf8');
const bootstrap = fs.readFileSync(new URL('../relay-ui-init.js', import.meta.url), 'utf8');

const mustInclude = (source, text, label) => {
  if (!source.includes(text)) throw new Error(`Missing ${label}: ${text}`);
};

mustInclude(runtime, "['safe', 'hot']", 'route validation');
mustInclude(runtime, 'threat-disengaged', 'SAFE gameplay effect');
mustInclude(runtime, 'pressure-targeted', 'HOT gameplay effect');
mustInclude(runtime, 'dynamicEncounter', 'existing encounter integration');
mustInclude(runtime, 'dynamicEncounterUntil', 'bounded encounter window');
mustInclude(runtime, 'restoreAll(state)', 'reversible effect cleanup');
mustInclude(runtime, 'scene.events?.once?.(\'shutdown\'', 'scene lifecycle cleanup');
mustInclude(runtime, 'RunnerScene.prototype.create', 'create hook');
mustInclude(runtime, 'MISSION_ROUTE_CONSEQUENCES', 'mission-specific consequence table');
mustInclude(runtime, "'first-delivery'", 'first mission consequence');
mustInclude(runtime, "'dead-drop'", 'dead-drop mission consequence');
mustInclude(runtime, 'blackout:', 'blackout mission consequence');
mustInclude(runtime, 'pursuit:', 'pursuit mission consequence');
mustInclude(runtime, "'signal-storm'", 'signal-storm mission consequence');
mustInclude(runtime, "'corporate-lockdown'", 'lockdown mission consequence');
mustInclude(runtime, "'final-relay'", 'final mission consequence');
mustInclude(runtime, 'missionConsequence', 'mission consequence event metadata');
mustInclude(runtime, 'targetCount', 'mission-specific pressure scaling');
mustInclude(runtime, 'encounter: \'pursuit\'', 'pursuit-specific encounter state');

if (/RunnerScene\.prototype\.update\s*=/.test(runtime)) {
  throw new Error('Route choice layer must not patch RunnerScene.update');
}
if (/setGravityY|setMaxVelocity|state\.js/.test(runtime)) {
  throw new Error('Route choice layer must not own physics or progression state');
}

mustInclude(bridge, 'relay:gameplay-variety-route-choice', 'DOM-to-gameplay bridge');
mustInclude(bootstrap, "./src/systems/gameplay-route-choice-v2.js", 'runtime bootstrap import');
mustInclude(bootstrap, "./src/systems/gameplay-route-choice-bridge-v1.js", 'bridge bootstrap import');

const runtimeImports = bootstrap.match(/import ['\"]\.\/src\/systems\/gameplay-route-choice-(?:v2|bridge-v1)\.js['\"]/g) || [];
if (runtimeImports.length !== 2) throw new Error(`Expected exactly 2 route-choice bootstrap imports, found ${runtimeImports.length}`);

console.log('Gameplay Route Choice V2 mission consequence contract: PASS');
