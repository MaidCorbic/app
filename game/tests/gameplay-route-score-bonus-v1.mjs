import fs from 'node:fs';
import assert from 'node:assert/strict';

const runtime = fs.readFileSync(new URL('../mission-flow-performance-v1.js', import.meta.url), 'utf8');
const routeRuntime = fs.readFileSync(new URL('../src/systems/gameplay-route-choice-v2.js', import.meta.url), 'utf8');

assert.match(runtime, /hotRouteBonus:\s*8/);
assert.match(runtime, /applyRouteReward\s*\(/);
assert.match(runtime, /__relayGameplayRouteChoiceV2\?\.route/);
assert.match(runtime, /result\.routeBonus\s*=\s*routeBonus/);
assert.match(runtime, /result\.routeChoice\s*=\s*routeChoice/);
assert.match(runtime, /metrics\.routeBonus\s*=\s*routeBonus/);
assert.match(runtime, /boostedScore/);
assert.match(runtime, /publish\(result\)/);

assert.match(routeRuntime, /state\.route\s*=\s*route/);
assert.match(routeRuntime, /MISSION_ROUTE_CONSEQUENCES/);
assert.match(routeRuntime, /multiplier:\s*1\.35/);
assert.match(routeRuntime, /multiplier:\s*1\.5/);
assert.match(routeRuntime, /multiplier:\s*1\.55/);
assert.match(routeRuntime, /multiplier:\s*1\.65/);
assert.match(routeRuntime, /multiplier:\s*1\.7/);
assert.match(routeRuntime, /multiplier:\s*1\.75/);
assert.match(routeRuntime, /varietyRoute.*hot/);
assert.match(routeRuntime, /dynamicEncounter.*ambush/);

console.log('gameplay route score bonus mission multiplier contract: ok');
