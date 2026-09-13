import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = filePath => fs.readFileSync(new URL(`../${filePath}`, import.meta.url), 'utf8');
const exists = filePath => fs.existsSync(new URL(`../${filePath}`, import.meta.url));

const loader = read('play-deployment-loader-v1.js');
const transition = read('mission-transition-loader-v1.js');
const runtime = read('relay-ui-init.js');
const splashCss = read('cinematic-splash.css');
const viteConfig = read('vite.config.mjs');

assert.match(loader, /loadplay\.jpg/);
assert.match(loader, /loadplaymobile\.jpg/);
assert.match(loader, /media="\(max-width:700px\)"/);
assert.match(loader, /relayPlayDeployment/);
assert.match(loader, /DEPLOYMENT SEQUENCE/);
assert.match(loader, /relayPlayDeploymentV1/);
assert.match(loader, /beforeRoute/);
assert.match(loader, /requestAnimationFrame/);

assert.match(transition, /relayMissionTransitionV1/);
assert.match(transition, /#nextMission/);
assert.match(transition, /stopImmediatePropagation/);
assert.match(transition, /relayPlayDeploymentV1/);
assert.match(transition, /beforeRoute/);

const assets = [
  'assets/loadplay.jpg',
  'assets/loadplaymobile.jpg',
  'assets/loadplay2.jpg',
  'assets/loadplay2mobile.jpg',
  'assets/loadplay3.jpg',
  'assets/loadplay3mobile.jpg',
  'assets/loadplay4.jpg',
  'assets/loadplay4mobile.jpg',
  'assets/loadmobile5.jpg',
  'assets/loadplay5mobile.jpg',
];

for (const asset of assets) {
  assert.ok(exists(asset), `Required mission loading asset is missing: ${path.normalize(asset)}`);
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(viteConfig, new RegExp(`'${escaped}'`), `Vite legacy asset list is missing: ${asset}`);
}

for (const filename of [
  'loadplay2.jpg', 'loadplay2mobile.jpg',
  'loadplay3.jpg', 'loadplay3mobile.jpg',
  'loadplay4.jpg', 'loadplay4mobile.jpg',
  'loadmobile5.jpg', 'loadplay5mobile.jpg',
]) {
  assert.match(transition, new RegExp(filename.replace('.', '\\.'), 'i'));
}

const loaderImport = runtime.indexOf("import './play-deployment-loader-v1.js';");
const transitionImport = runtime.indexOf("import './mission-transition-loader-v1.js';");
const briefingImport = runtime.indexOf("import './gameplay-intro-final-v1.js';");
assert.ok(loaderImport >= 0, 'Reusable deployment loader must be imported');
assert.ok(transitionImport >= 0, 'Mission transition loader must be imported');
assert.ok(briefingImport >= 0, 'Mission briefing must be imported');
assert.ok(loaderImport < transitionImport, 'Reusable deployment loader must register before transition bridge');
assert.ok(transitionImport < briefingImport, 'Mission transition bridge must register before generic briefing listener');

assert.match(splashCss, /SYSTEM LINK  \/\/  SECURE CHANNEL/);

console.log('Mission deployment loader contract: PASS');
