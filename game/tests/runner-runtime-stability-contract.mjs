import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');

const runner = read('src/scenes/RunnerScene.js');
const featureDock = read('gameplay-feature-dock-v1.js');
const vite = read('vite.config.mjs');

// RunnerScene owns its runtime source directly. No Vite source mutation is allowed
// to manufacture/fix hardLanding declarations after the fact.
assert.doesNotMatch(
  runner,
  /const hardLanding\s*=\s*this\.landingTimer\s*>\s*0\s*&&\s*this\.fallSpeed\s*>\s*260\s*;/,
  'RunnerScene must not contain the obsolete hardLanding TDZ fixture',
);
assert.doesNotMatch(
  vite,
  /relayRunnerRuntimeStability/,
  'Vite must not rewrite RunnerScene hardLanding state',
);
assert.match(vite, /relayExplicitRunnerSceneBinding\(\)/);

// The canonical scene keeps landing state explicit for lifecycle reset.
assert.match(runner, /\(this\.landingTimer = 0\)/);
assert.match(runner, /\(this\.lastHardLanding = !1\)/);

assert.match(featureDock, /import \{ RunnerScene as RelayFeatureDockScene \}/);
assert.match(featureDock, /const RunnerScene = RelayFeatureDockScene;/);

console.log('RunnerScene runtime stability contract passed');
