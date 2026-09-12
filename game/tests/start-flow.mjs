import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const homeRouter = await readFile(new URL('../home-v3-interaction-fix.js', import.meta.url), 'utf8');
const campaignMap = await readFile(new URL('../campaign-route-cinematic-v1.js', import.meta.url), 'utf8');
const unified = await readFile(new URL('../unified-cinematic-ui-v1.js', import.meta.url), 'utf8');

assert.match(source, /\$\('start'\)\.onclick\s*=\s*\(\)\s*=>\s*\{\s*window\.relayStartRun\?\.\(\);\s*\};/, 'Home Start Run must remain bound to the canonical run API');
assert.match(source, /window\.relayStartRun\s*=\s*\(\)\s*=>/, 'Canonical Start Run API must exist');
assert.match(source, /game\.scene\.resume\('runner'\)/, 'Canonical Start Run API must resume an already-prepared RunnerScene');
assert.match(source, /else launch\(0\)/, 'Canonical Start Run API must create a fresh first mission when needed');
assert.match(source, /window\.relayContinueRun\s*=\s*\(\)\s*=>\s*\{[\s\S]*?launch\(nextMissionIndex\(\), false\)/, 'Continue must launch the next available mission through the real launcher');
assert.match(homeRouter, /target\.closest\('#intro #start'\)/, 'Home router must own the visible Start Run button');
assert.match(homeRouter, /relayOpenCampaignMap/, 'PLAY NOW must open the campaign route map before launching a mission');
assert.match(homeRouter, /import '\.\/campaign-route-cinematic-v1\.js';/, 'Home router must load the campaign route layer');
assert.doesNotMatch(homeRouter, /HTMLElement\.prototype\.click\.call\(sourceStart\)/, 'Home router must not proxy to stale detached Start button');
assert.doesNotMatch(homeRouter, /HTMLElement\.prototype\.click\.call\(sourceContinue\)/, 'Home router must not proxy to stale detached Continue button');
assert.match(campaignMap, /platforms/, 'Tactical map must render real mission platform geometry');
assert.match(campaignMap, /spawn/, 'Tactical map must derive the route from mission spawn data');
assert.match(campaignMap, /guides/, 'Tactical map must derive route breadcrumbs from mission guide data');
assert.match(campaignMap, /checkpoints/, 'Tactical map must derive checkpoint data');
assert.match(campaignMap, /signals/, 'Tactical map must render Signal markers');
assert.match(campaignMap, /obstacles/, 'Tactical map must render hazard markers');
assert.match(campaignMap, /secrets/, 'Tactical map must render secret markers');
assert.match(campaignMap, /goal/, 'Tactical map must derive the destination from mission goal data');
assert.match(campaignMap, /homescreen\.jpg/, 'Tactical presentation must use an actual background image');
assert.match(campaignMap, /loading-landscape\.jpg/, 'Tactical presentation must rotate to another existing image');
assert.match(campaignMap, /loading\.jpg/, 'Tactical presentation must have a third existing image fallback');
assert.match(campaignMap, /relayDeployCountdown/, 'Mission deployment must use a dedicated countdown overlay');
assert.match(campaignMap, /\['3','ROUTE LOCKED'\]/, 'Deployment countdown must begin at 3');
assert.match(campaignMap, /countdownInFlight/, 'Deployment must have a single-flight guard against double launch');
assert.match(campaignMap, /relayLaunchRun/, 'Tactical map must launch through the canonical runtime launcher');
assert.doesNotMatch(unified, /launchMissionViaLegacy\(/, 'Unified cinematic UI must not use the legacy mission launcher');

console.log('Tactical campaign map start-flow regression checks passed.');
