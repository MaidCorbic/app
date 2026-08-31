import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const reset = await readFile(fileURLToPath(new URL('src/systems/death-retry-state-reset-v1.js', root)), 'utf8');
const dash = await readFile(fileURLToPath(new URL('dash-dodge-v1.js', root)), 'utf8');
const relay = await readFile(fileURLToPath(new URL('relay-ui-init.js', root)), 'utf8');

assert.match(relay, /death-retry-state-reset-v1\.js/);
assert.match(reset, /RunnerScene\.prototype\.respawnCheckpoint/);
assert.match(reset, /RunnerScene\.prototype\.fail/);
assert.match(reset, /mobileDirection = null/);
assert.match(reset, /isDashing/);
assert.match(reset, /isWallSliding/);
assert.match(reset, /wallJumping/);
assert.match(reset, /dashActive/);
assert.match(reset, /dashing/);
assert.match(reset, /clearKeyState/);
assert.match(reset, /setVelocity\?\.\(0, 0\)/);
assert.match(reset, /setAcceleration\?\.\(0, 0\)/);
assert.match(reset, /relay:runner-transient-reset/);
assert.match(reset, /__relayDeathRetryStateResetV2/);

// Dash owns independent WeakMap state, so RunnerScene field resets alone are
// insufficient. The authoritative dash state must consume the lifecycle reset.
assert.match(dash, /function resetDashState\(s\)/);
assert.match(dash, /st\.dashTimer=0/);
assert.match(dash, /st\.cooldown=0/);
assert.match(dash, /st\.invulnTimer=0/);
assert.match(dash, /releaseGravityOverride\(s,st,body\)/);
assert.match(dash, /relay:runner-transient-reset/);

console.log('Death/retry transient-state contract: PASS');
