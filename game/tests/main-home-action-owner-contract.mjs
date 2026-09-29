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
assert.doesNotMatch(main, /window\.setInterval\(hideLegacyToast,\s*250\)/);

console.log('Main Home action owner contract: PASS');
