import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const loader = read('play-deployment-loader-v1.js');
const runtime = read('relay-ui-init.js');
const splashCss = read('cinematic-splash.css');
const viteConfig = read('vite.config.mjs');

assert.match(loader, /loadplay\.jpg/);
assert.match(loader, /loadplaymobile\.jpg/);
assert.match(loader, /media="\(max-width:700px\)"/);
assert.match(loader, /srcset="\/game\/assets\/loadplaymobile\.jpg"/);
assert.match(loader, /relayPlayDeployment/);
assert.match(loader, /DEPLOYMENT SEQUENCE/);
assert.match(splashCss, /SYSTEM LINK  \/\/  SECURE CHANNEL/);
assert.match(loader, /NODE/);
assert.match(loader, /SIGNAL/);
assert.match(loader, /RELAY/);
assert.match(loader, /DEPLOYMENT READY/);
assert.match(loader, /relayGameplayIntroV5/);
assert.match(loader, /requestAnimationFrame/);
assert.match(runtime, /\.\/play-deployment-loader-v1\.js/);
assert.match(viteConfig, /'assets\/loadplay\.jpg'/);
assert.match(viteConfig, /'assets\/loadplaymobile\.jpg'/);

console.log('Play deployment loader contract: PASS');
