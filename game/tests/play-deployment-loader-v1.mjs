import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const loader = read('play-deployment-loader-v1.js');
const runtime = read('relay-ui-init.js');

assert.match(loader, /loadplay\.jpg/);
assert.match(loader, /relayPlayDeployment/);
assert.match(loader, /DEPLOYMENT SEQUENCE/);
assert.match(loader, /SYSTEM LINK  \/\/  SECURE CHANNEL/);
assert.match(loader, /NODE/);
assert.match(loader, /SIGNAL/);
assert.match(loader, /RELAY/);
assert.match(loader, /DEPLOYMENT READY/);
assert.match(loader, /relayGameplayIntroV5/);
assert.match(loader, /requestAnimationFrame/);
assert.match(runtime, /\.\/play-deployment-loader-v1\.js/);

console.log('Play deployment loader contract: PASS');
