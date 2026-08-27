import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const source = await readFile(fileURLToPath(new URL('src/systems/flight-hover-glide-v1.js', root)), 'utf8');
const bridge = await readFile(fileURLToPath(new URL('src/systems/flight-hud-bridge-v1.js', root)), 'utf8');

assert.match(source, /window\.addEventListener\('keydown'/);
assert.match(source, /window\.removeEventListener\('keydown'/);
assert.match(source, /shutdownFlightHoverGlide/);
assert.match(source, /destroyFlightHoverGlide/);
assert.match(bridge, /this\.shutdownFlightHoverGlide\?\(\);/);

console.log('Flight lifecycle cleanup contract: PASS');
