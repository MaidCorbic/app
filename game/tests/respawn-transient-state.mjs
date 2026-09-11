import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const runtime = await readFile(fileURLToPath(new URL('src/systems/core-stability.js', root)), 'utf8');
const vite = await readFile(fileURLToPath(new URL('vite.config.mjs', root)), 'utf8');

for (const marker of [
  'scene.alarmTimer = 0;',
  'scene.empTimer = 0;',
  'scene.decoyTimer = 0;',
  'scene.boosterTimer = 0;',
  'scene.comboTimer = 0;',
  'scene.combatCombo = 0;',
  'scene.blasterCooldown = 0;',
  'scene.swordCooldown = 0;',
  'scene.gadgetCooldowns = [0, 0];',
  'scene.buildCooldowns = [0, 0];',
  'scene.chaseSection = -1;',
  'scene.turrets, scene.shields, scene.springPads',
  'scene.decoyBeacon?.destroy();',
  'scene.boosterAura?.destroy();',
]) assert.match(runtime, new RegExp(marker.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')));

assert.match(runtime, /function resetTransientRespawnState\(scene\)/);
assert.match(runtime, /resetTransientRespawnState\(this\);/);
assert.doesNotMatch(vite, /patchRespawnTransientState|relay-respawn-transient-state-fix/);

console.log('Respawn transient state: PASS');
