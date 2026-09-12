import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const recovery = await readFile(new URL('../src/systems/run-launch-recovery-v1.js', import.meta.url), 'utf8');
const home = await readFile(new URL('../home-v3-interaction-fix.js', import.meta.url), 'utf8');

assert.match(recovery, /document\.addEventListener\('click'/, 'RUN recovery must own the click path');
assert.match(recovery, /target\.closest\('#intro #start'\)/, 'RUN recovery must bind the visible Home Start Run button');
assert.match(recovery, /game\.scene\.resume\('runner'\)/, 'RUN recovery must resume RunnerScene directly');
assert.match(recovery, /window\.relayStartRun\s*=\s*resume/, 'RUN recovery must expose one canonical public API');
assert.doesNotMatch(home, /sourceStart/, 'Home must not retain a stale Start button proxy');
assert.doesNotMatch(home, /sourceContinue/, 'Home must not retain a stale Continue button proxy');
assert.match(home, /window\.relayStartRun/, 'Home must use the canonical RUN API');

console.log('RUN launch recovery checks passed.');
