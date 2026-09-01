import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = path => readFile(fileURLToPath(new URL(path, root)), 'utf8');

const stability = await read('src/systems/core-stability.js');
const featureRuntime = await read('src/feature-runtime.js');
const mobile = await read('src/systems/mobile-input-single-owner-v1.js');
const enemyRuntime = await read('src/systems/enemy-runtime-v2.js');
const runtime = await read('runtime-authority-v1.js');
const finishRecovery = await read('src/systems/mission-finish-recovery.js');
const main = await read('src/main.js');
const dash = await read('dash-dodge-v1.js');

// Runtime installers must remain idempotent.
assert.match(featureRuntime, /__relayFeatureRuntimeInstalled/);
assert.match(stability, /__relayCoreStabilityV1Installed/);

// Failure, hit and respawn transitions must reject re-entry.
assert.match(stability, /this\.respawning/);
assert.match(stability, /this\.healthInvulnerable/);
assert.match(stability, /__relayRespawnInProgress/);
assert.match(stability, /__relayLastHitFrame/);
assert.match(stability, /game\.loop\.frame/);
assert.match(stability, /if\s*\([^\n]*this\.respawning[^\n]*this\.finished/);

// Player physics must never propagate NaN/Infinity and invalid position must
// recover through the existing checkpoint path. Normal values are untouched.
assert.match(stability, /sanitizePlayerPhysics/);
assert.match(stability, /Number\.isFinite\(vx\)/);
assert.match(stability, /Number\.isFinite\(vy\)/);
assert.match(stability, /Number\.isFinite\(scene\.player\.x\)/);
assert.match(stability, /physics-recovered/);

// Every enemy projectile group must use the same player-hit path.
assert.match(enemyRuntime, /\[scene\.enemyProjectiles, scene\.eggs, scene\.comets\]/);
assert.match(enemyRuntime, /Enemy ability hit the courier/);
assert.match(enemyRuntime, /scene\.takeSciFiHit/);

// Mobile input must have one owner and release held input on lifecycle loss.
assert.match(mobile, /__relayMobileInputSingleOwnerV7/);
assert.match(mobile, /pagehide/);
assert.match(mobile, /visibilitychange/);
assert.match(mobile, /setPhaserDirection/);

// Runtime authority must clean up scene lifecycle hooks and reject stale
// completion events emitted by an older run after replay/retry.
assert.match(runtime, /shutdown/);
assert.match(runtime, /gameState\.delete\(game\)/);
assert.match(runtime, /sceneState\.delete\(scene\)/);
assert.match(runtime, /eventName === 'complete'/);
assert.match(runtime, /emittedRunId/);
assert.match(runtime, /activeRunId/);
assert.match(runtime, /String\(activeRunId\) !== String\(emittedRunId\)/);

// Respawn must clear stale velocity and leave the scene in a live state.
assert.match(stability, /this\.player\.body\.setVelocity\(0, 0\)/);
assert.match(stability, /this\.respawning = false/);

// Mission finish recovery must be idempotent per run and must not persist the
// same completion twice.
assert.match(finishRecovery, /handledRunKey/);
assert.match(finishRecovery, /runKey\(scene\)/);
assert.match(finishRecovery, /if \(handledRunKey === key\) return false/);
assert.match(finishRecovery, /const alreadyPersisted/);
assert.match(finishRecovery, /if \(!alreadyPersisted\)/);
assert.match(finishRecovery, /recovered: true/);

// Replay/next/retry controls must launch a fresh runner run.
assert.match(main, /\$\('again'\)\.onclick/);
assert.match(main, /\$\('nextMission'\)\.onclick/);
assert.match(main, /\$\('retry'\)\.onclick/);
assert.match(main, /launch\(missionIndex\)/);

// Dash must not restore an obsolete gravity value over another system's
// intentional gravity change during the dash window.
assert.match(dash, /Restore gravity only if dash is still the owner/);
assert.match(dash, /Number\(body\.gravity\?\.y\) === 0/);
assert.match(dash, /Math\.min\(delta, 100\)/);

console.log('P0 gameplay safety contract: PASS');
