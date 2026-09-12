import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const homeRouter = await readFile(new URL('../home-v3-interaction-fix.js', import.meta.url), 'utf8');
const unified = await readFile(new URL('../unified-cinematic-ui-v1.js', import.meta.url), 'utf8');

const startHandlers = [...source.matchAll(/\$\('start'\)\.onclick\s*=\s*\(\)\s*=>\s*\{([^}]+)\};/g)];
const continueHandlers = [...source.matchAll(/\$\('continue'\)\.onclick\s*=\s*\(\)\s*=>\s*\{([^}]+)\};/g)];

assert.ok(startHandlers.length, 'Start Run needs a click handler');
assert.match(startHandlers.at(-1)[1], /game\.scene\.resume\('runner'\)/, 'Start Run must resume RunnerScene directly');
assert.doesNotMatch(startHandlers.at(-1)[1], /WorldMap|openPreflight/, 'Start Run must not route through map or pre-flight UI');
assert.ok(continueHandlers.length, 'Continue needs a click handler');
assert.match(continueHandlers.at(-1)[1], /launch\(nextMissionIndex\(\)\)/, 'Continue must launch the next mission directly');

assert.match(homeRouter, /querySelector\('#intro #start'\)/, 'Home router must own the visible Start Run button');
assert.match(homeRouter, /window\.relayStartRun\s*=\s*startRunnerDirect/, 'Home router must expose one canonical start API');
assert.doesNotMatch(homeRouter, /HTMLElement\.prototype\.click\.call\(sourceStart\)/, 'Home router must not proxy to a stale detached Start button');
assert.doesNotMatch(unified, /launchMissionViaLegacy\(/, 'Unified cinematic UI must not use the legacy mission click bridge');

console.log('Direct start flow regression checks passed.');
