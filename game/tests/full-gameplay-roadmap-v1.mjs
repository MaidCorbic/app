import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/systems/full-gameplay-roadmap-v1.js', import.meta.url), 'utf8');
const runtime = await readFile(new URL('../relay-ui-init.js', import.meta.url), 'utf8');

for (const token of ['adaptive pursuit','tracker','interceptor','blocker','disruptor','sniper','drone','__fullGameplayRoadmapV1','relay:pursuit-lockdown']) {
  assert.ok(source.toLowerCase().includes(token.toLowerCase()), 'Missing roadmap integration token: ' + token);
}

assert.match(runtime, /full-gameplay-roadmap-v1\.js/, 'Roadmap coordinator must be loaded by the gameplay runtime');
assert.doesNotMatch(source, /new Phaser\.Game/, 'Roadmap coordinator must not create a second Phaser game');
assert.doesNotMatch(source, /new RunnerScene/, 'Roadmap coordinator must not create a second RunnerScene');

console.log('Full gameplay roadmap integration contract: OK');