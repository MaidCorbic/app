import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');

const runner = read('src/scenes/RunnerScene.js');
const featureDock = read('gameplay-feature-dock-v1.js');
const vite = read('vite.config.mjs');

const landingDecls = [...runner.matchAll(/\b(?:const|let|var)\s+hardLanding\b/g)];
assert.ok(landingDecls.length >= 2, 'RunnerScene hardLanding contract fixture is missing');

const outerLandingTdz = /const hardLanding\s*=\s*this\.landingTimer\s*>\s*0\s*&&\s*this\.fallSpeed\s*>\s*260\s*;/.test(runner);
assert.equal(outerLandingTdz, true, 'RunnerScene source should expose the regression signature so the build guard can normalize it');

assert.match(vite, /relayRunnerRuntimeStability\(\)/);
assert.match(vite, /relayExplicitRunnerSceneBinding\(\)/);
assert.match(vite, /let hardLanding = false;/);
assert.match(vite, /hardLanding = this\.fallSpeed > 260;/);
assert.match(vite, /duplicate hardLanding declaration remains/);

assert.match(featureDock, /import \{ RunnerScene as RelayFeatureDockScene \}/);
assert.match(featureDock, /const RunnerScene = RelayFeatureDockScene;/);

console.log('RunnerScene runtime stability contract passed');
