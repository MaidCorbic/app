import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');

const main = read('src/main.js');

assert.match(main, /HOME ACTION OWNER/);
assert.match(main, /document\.addEventListener\(\s*['"]click['"]/);
assert.match(main, /startGameplayFromHome/);
assert.match(main, /continueButton/);
assert.doesNotMatch(main, /introStartObserver/);
assert.doesNotMatch(main, /relayMainStartBound/);
assert.doesNotMatch(main, /window\\.setInterval\\(hideLegacyToast,\\s*250\\)/);
const index = read('index.html');
const hud = read('canonical-ui-v1.css');
assert.match(index, /id="signalCount"/);
assert.match(index, /id="objective"/);
assert.match(hud, /FINAL MOBILE GAMEPLAY HUD CONTRACT/);
assert.match(hud, /orientation: landscape/);
assert.match(hud, /\.hud-route/);
assert.match(hud, /\.hud-progress/);

console.log('Main Home action owner contract: PASS');
