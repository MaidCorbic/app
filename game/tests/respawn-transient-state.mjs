import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const patch = await readFile(fileURLToPath(new URL('respawn-transient-state-patch.mjs', root)), 'utf8');
const vite = await readFile(fileURLToPath(new URL('vite.config.js', root)), 'utf8');

for (const marker of [
  "this.alarmTimer = 0;",
  "this.empTimer = 0;",
  "this.decoyTimer = 0;",
  "this.boosterTimer = 0;",
  "this.comboTimer = 0;",
  "this.combatCombo = 0;",
  "this.blasterCooldown = 0;",
  "this.swordCooldown = 0;",
  "this.gadgetCooldowns = [0, 0];",
  "this.buildCooldowns = [0, 0];",
  "this.chaseSection = -1;",
  "this.turrets, this.shields, this.springPads",
  "this.decoyBeacon?.destroy();",
  "this.boosterAura?.destroy();",
]) assert.match(patch, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

assert.match(patch, /this\.resetTransientRespawnState\(\);/);
assert.match(vite, /patchRespawnTransientState/);
assert.match(vite, /relay-respawn-transient-state-fix/);

console.log('Respawn transient state: PASS');
