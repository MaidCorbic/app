import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const index = await readFile(fileURLToPath(new URL('index.html', root)), 'utf8');
const options = await readFile(fileURLToPath(new URL('home-options.js', root)), 'utf8');
const tutorial = await readFile(fileURLToPath(new URL('home-tutorial-v1.js', root)), 'utf8');
const normalizer = await readFile(fileURLToPath(new URL('settings-normalizer-v1.js', root)), 'utf8');

assert.match(index, /\.\/settings-normalizer-v1\.js/);
assert.match(index, /\.\/home-options\.js/);
assert.match(index, /\.\/home-tutorial-v1\.js/);
assert.match(index, /data-title-panel="controls"/);
assert.match(options, /data-home-toggle="tutorialEnabled"/);
assert.match(options, /data-home-toggle="aiVoice"/);
assert.match(options, /data-home-volume="musicVolume"/);
assert.match(options, /data-home-volume="sfxVolume"/);
assert.match(tutorial, /data-title-panel="tutorial"/);
assert.match(tutorial, /function openTutorial\(\)/);
assert.match(tutorial, /titlePanelContent/);
assert.match(normalizer, /relay-runner-state/);
assert.match(normalizer, /tutorialEnabled: true/);
assert.match(normalizer, /aiVoice: true/);
assert.match(normalizer, /musicVolume: 0\.55/);
assert.match(normalizer, /sfxVolume: 0\.7/);

console.log('Home Options/Tutorial contract: PASS');
