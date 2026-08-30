import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const audio = read('src/systems/audio-autoplay-guard-v1.js');
const pause = read('pause-interactions.js');
const splash = read('splash-loader-v2.js');
const bootstrap = read('home-v3-interaction-fix.js');

assert.match(audio, /window\.AudioContext\s*=\s*undefined/);
assert.match(audio, /window\.webkitAudioContext\s*=\s*undefined/);
assert.match(audio, /restoreConstructors/);
assert.match(audio, /window\.relayAudioAutoplayGuard/);
assert.doesNotMatch(pause, /requestAnimationFrame/);
assert.doesNotMatch(splash, /requestAnimationFrame/);
assert.match(bootstrap, /unified-gameplay-ui-v1\.css/);
assert.ok(fs.existsSync(new URL('../public/unified-gameplay-ui-v1.css', import.meta.url)));

console.log('Console regression contract: PASS');
