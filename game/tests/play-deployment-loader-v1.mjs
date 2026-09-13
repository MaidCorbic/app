import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const loader = read('play-deployment-loader-v1.js');
const transition = read('mission-transition-loader-v1.js');
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

assert.match(transition, /relayMissionTransition/);
assert.match(transition, /#nextMission/);
assert.match(transition, /stopImmediatePropagation/);
assert.match(transition, /relayGameplayIntroV5/);
assert.match(transition, /loadplay2\.jpg/);
assert.match(transition, /loadplay2mobile\.jpg/);
assert.match(transition, /loadplay3\.jpg/);
assert.match(transition, /loadplay3mobile\.jpg/);
assert.match(transition, /loadplay4\.jpg/);
assert.match(transition, /loadplay4mobile\.jpg/);
assert.match(transition, /loadmobile5\.jpg/);
assert.match(transition, /loadplay5mobile\.jpg/);

const transitionImport = runtime.indexOf("import './mission-transition-loader-v1.js';");
const briefingImport = runtime.indexOf("import './gameplay-intro-final-v1.js';");
assert.ok(transitionImport >= 0, 'Mission transition loader must be imported');
assert.ok(briefingImport >= 0, 'Mission briefing must be imported');
assert.ok(transitionImport < briefingImport, 'Mission transition loader must register before the generic briefing listener');

assert.match(viteConfig, /'assets\/loadplay\.jpg'/);
assert.match(viteConfig, /'assets\/loadplaymobile\.jpg'/);
assert.match(viteConfig, /'assets\/loadplay2\.jpg'/);
assert.match(viteConfig, /'assets\/loadplay2mobile\.jpg'/);
assert.match(viteConfig, /'assets\/loadplay3\.jpg'/);
assert.match(viteConfig, /'assets\/loadplay3mobile\.jpg'/);
assert.match(viteConfig, /'assets\/loadplay4\.jpg'/);
assert.match(viteConfig, /'assets\/loadplay4mobile\.jpg'/);
assert.match(viteConfig, /'assets\/loadmobile5\.jpg'/);
assert.match(viteConfig, /'assets\/loadplay5mobile\.jpg'/);

console.log('Play + mission deployment loader contract: PASS');
