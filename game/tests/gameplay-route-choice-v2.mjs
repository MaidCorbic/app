import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../src/systems/gameplay-route-choice-v2.js', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../src/systems/gameplay-route-choice-bridge-v1.js', import.meta.url), 'utf8');
const variety = fs.readFileSync(new URL('../src/systems/gameplay-variety-safe-layer-v1.js', import.meta.url), 'utf8');
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
mustInclude(runtime, 'varietyRoute', 'route marker snapshot');
mustInclude(runtime, 'removeData?.(\'varietyRoute\')', 'route marker cleanup');
mustInclude(runtime, 'state.routeChoices > 0', 'single route choice lock');
mustInclude(runtime, 'MISSION_ROUTE_CONSEQUENCES', 'mission-specific consequence table');
for (const mission of ['first-delivery', 'dead-drop', 'blackout', 'pursuit', 'signal-storm', 'corporate-lockdown', 'final-relay']) {
  mustInclude(runtime, mission, `mission consequence ${mission}`);
}
mustInclude(runtime, "encounter: 'pursuit'", 'pursuit-specific encounter state');

if (/RunnerScene\.prototype\.update\s*=/.test(runtime)) {
  throw new Error('Route choice layer must not patch RunnerScene.update');
}
if (/setGravityY|setMaxVelocity|state\.js/.test(runtime)) {
  throw new Error('Route choice layer must not own physics or progression state');
}

mustInclude(bridge, 'relay:gameplay-variety-route-choice', 'DOM-to-gameplay bridge');
mustInclude(bridge, "#relayGameplayVariety", 'canonical HUD click guard');
mustInclude(variety, 'state.routeChoices > 0', 'canonical HUD single-choice lock');
mustInclude(variety, 'button.disabled = true', 'canonical HUD button lock');
mustInclude(bootstrap, "./src/systems/gameplay-route-choice-v2.js", 'runtime bootstrap import');
mustInclude(bootstrap, "./src/systems/gameplay-route-choice-bridge-v1.js", 'bridge bootstrap import');

const runtimeImports = bootstrap.match(/import ['\"]\.\/src\/systems\/gameplay-route-choice-(?:v2|bridge-v1)\.js['\"]/g) || [];
if (runtimeImports.length !== 2) throw new Error(`Expected exactly 2 route-choice bootstrap imports, found ${runtimeImports.length}`);

console.log('Gameplay Route Choice V2 mission consequence + lifecycle contract: PASS');
