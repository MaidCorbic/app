import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/systems/gameplay-expansion-v11-twenty.js', import.meta.url), 'utf8');
const loader = await readFile(new URL('../gameplay-expansion-loader-v1.js', import.meta.url), 'utf8');

assert.match(source, /const FEATURES = \[/);
assert.equal((source.match(/\['[^']+', '[^']+', 0x[0-9a-f]+\]/g) || []).length, 20);
for (const token of [
  'NOISE', 'TRACKING', 'HEAT', 'OBSTACLE', 'ROUTES', 'MUTATION', 'COVER', 'MOMENTUM',
  'RECOVERY', 'DECOY', 'CONTACT', 'METHOD', 'CARGO', 'EMERGENCY', 'OPPORTUNITY', 'CHAIN',
  'DECOY CARGO', 'LOADOUT', 'TIME DEBT', 'MARKER',
]) assert.match(source, new RegExp(token));
assert.match(source, /setInteractive\(\{ useHandCursor: true \}\)/);
assert.match(source, /pointerdown/);
assert.doesNotMatch(source, /input\.keyboard|keydown|keyup/);
assert.match(source, /localStorage/);
assert.match(source, /Phaser\.Scenes\.Events\.SHUTDOWN/);
assert.match(loader, /installGameplayExpansionV11Twenty/);
console.log('V11 twenty gameplay contract: PASS');
