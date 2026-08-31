import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const dash = await readFile(fileURLToPath(new URL('dash-dodge-v1.js', root)), 'utf8');

assert.match(dash, /__relayAuthoritativeDashV1\s*=\s*true/);
assert.match(dash, /Phaser\.Input\.Keyboard\.JustDown\(this\.keys\.SHIFT\)/);
assert.match(dash, /this\.mobileActions\?\.dash\)this\.mobileActions\.dash=false/);
assert.match(dash, /event\.stopImmediatePropagation\(\)/);
assert.match(dash, /window\.addEventListener\('relay:dash',\(\)=>\{const s=scene\(\);if\(s\?\.mobileActions\)s\.mobileActions\.dash=false;dash\(s\)\}\)/);
assert.match(dash, /setVelocityX\?\.\(direction\*DASH_SPEED\)/);
assert.match(dash, /setGravityY\?\.\(0\)/);

console.log('Dash physics single-owner contract: PASS');
