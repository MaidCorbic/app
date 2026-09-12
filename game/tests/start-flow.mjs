import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const homeRouter = await readFile(new URL('../home-v3-interaction-fix.js', import.meta.url), 'utf8');
const unified = await readFile(new URL('../unified-cinematic-ui-v1.js', import.meta.url), 'utf8');

assert.match(source, /\$\('start'\)\.onclick\s*=\s*\(\)\s*=>\s*\{\s*window\.relayStartRun\?\.\(\);\s*\};/, 'Home Start Run must call the canonical run API');
assert.match(source, /window\.relayStartRun\s*=\s*\(\)\s*=>/, 'Canonical Start Run API must exist');
assert.match(source, /game\.scene\.resume\('runner'\)/, 'Canonical Start Run API must resume an already-prepared RunnerScene');
assert.match(source, /else launch\(0\)/, 'Canonical Start Run API must create a fresh first mission when needed');
assert.doesNotMatch(source, /WorldMap|openPreflight/, 'Home Start Run must not route through map or pre-flight UI');
assert.match(source, /\$\('continue'\)\.onclick\s*=\s*\(\)\s*=>\s*\{\s*window\.relayContinueRun\?\.\(\);\s*\};/, 'Continue must call the canonical continue API');
assert.match(source, /window\.relayContinueRun\s*=\s*\(\)\s*=>\s*\{[\s\S]*?launch\(nextMissionIndex\(\), false\)/, 'Continue must launch the next available mission through the real launcher');
assert.match(homeRouter, /target\.closest\('#intro #start'\)/, 'Home router must own the visible Start Run button');
assert.match(homeRouter, /startRunnerDirect\(\)/, 'Home router must use direct RunnerScene control');
assert.doesNotMatch(homeRouter, /HTMLElement\.prototype\.click\.call\(sourceStart\)/, 'Home router must not proxy to stale detached Start button');
assert.doesNotMatch(homeRouter, /HTMLElement\.prototype\.click\.call\(sourceContinue\)/, 'Home router must not proxy to stale detached Continue button');
assert.doesNotMatch(unified, /launchMissionViaLegacy\(/, 'Unified cinematic UI must not use the legacy mission launcher');

console.log('Direct start flow regression checks passed.');
