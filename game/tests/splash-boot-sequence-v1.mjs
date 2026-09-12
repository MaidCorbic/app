import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const splash = read('splash-loader-v2.js');

assert.match(splash, /SYSTEM LINK  \/\/  SECURE CHANNEL/);
assert.match(splash, /ROUTE DATA RECEIVED/);
assert.match(splash, /WORLD NODE ONLINE/);
assert.match(splash, /NODE.*04 \/\/ ONLINE/);
assert.match(splash, /SIGNAL.*STABLE/);
assert.match(splash, /RELAY.*SYNCED/);
assert.match(splash, /BOOT COMPLETE/);
assert.match(splash, /relay-premium-boot-style/);
assert.match(splash, /relay-splash-network-status/);
assert.match(splash, /relay-boot-status-grid/);

console.log('Splash boot sequence contract: PASS');
