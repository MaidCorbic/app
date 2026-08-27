import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const flight = await readFile(fileURLToPath(new URL('src/systems/flight-hover-glide-v1.js', root)), 'utf8');
const health = await readFile(fileURLToPath(new URL('src/systems/health-restore-zones-v1.js', root)), 'utf8');
const zoom = await readFile(fileURLToPath(new URL('src/systems/web-zoom-lock-v1.js', root)), 'utf8');
const splash = await readFile(fileURLToPath(new URL('cinematic-splash.css', root)), 'utf8');
const runtime = await readFile(fileURLToPath(new URL('src/feature-runtime.js', root)), 'utf8');

assert.match(flight, /DEFAULT_FLIGHT_DURATION_MS = 8000/);
assert.match(flight, /DEFAULT_GLIDE_WINDOW_MS = 1200/);
assert.match(flight, /data\.state === FLIGHT_STATE\.GLIDING/);
assert.match(flight, /LANDING · FLIGHT LOCKED/);
assert.match(health, /healthRestoreZonesV1/);
assert.match(health, /mission\?\.healthRestoreZones/);
assert.match(health, /mission\?\.checkpoints/);
assert.match(health, /SAFE RESTORE ACTIVE/);
assert.match(runtime, /installHealthRestoreZones/);
assert.match(runtime, /web-zoom-lock-v1\.js/);
assert.match(zoom, /event\.ctrlKey \|\| event\.metaKey/);
assert.match(zoom, /event\.preventDefault\(\)/);
assert.match(zoom, /wheel/);
assert.match(zoom, /gesturestart/);
assert.match(splash, /width:100dvw/);
assert.match(splash, /height:100dvh/);
assert.match(splash, /transform:none;animation:none/);
console.log('Final hardening contract: PASS');
