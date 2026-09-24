import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const roadmapPath = new URL(
  '../src/systems/full-gameplay-roadmap-v1.js',
  import.meta.url
);

const runtimePath = new URL(
  '../relay-ui-init.js',
  import.meta.url
);

const source = await readFile(roadmapPath, 'utf8');
const runtime = await readFile(runtimePath, 'utf8');

const requiredTokens = [
  'adaptive pursuit',
  'tracker',
  'interceptor',
  'blocker',
  'disruptor',
  'sniper',
  'drone',
  '__fullGameplayRoadmapV1',
  'relay:pursuit-lockdown'
];

for (const token of requiredTokens) {
  assert.ok(
    source.toLowerCase().includes(token.toLowerCase()),
    `Missing roadmap integration token: ${token}`
  );
}

assert.match(
  runtime,
  /full-gameplay-roadmap-v1\.js/,
  'Roadmap coordinator must be loaded by the gameplay runtime'
);

assert.doesNotMatch(
  source,
  /new\s+Phaser\.Game\s*\(/,
  'Roadmap coordinator must not create a second Phaser game'
);

assert.doesNotMatch(
  source,
  /new\s+RunnerScene\s*\(/,
  'Roadmap coordinator must not create a second RunnerScene'
);

assert.match(
  source,
  /installFullGameplayRoadmapV1\s*\(/,
  'Roadmap coordinator must expose its installer'
);

console.log('Full gameplay roadmap integration contract: OK');
