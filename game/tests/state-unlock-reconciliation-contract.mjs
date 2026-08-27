import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/state.js', import.meta.url), 'utf8');
const { patchSeasonalProgression } = await import(new URL('../seasonal-progression-patch.mjs', import.meta.url));
const transformed = patchSeasonalProgression(source);

assert.match(transformed, /import \{ missions \} from '\.\/missions\.js';/, 'State runtime must import mission definitions');
assert.match(transformed, /const reconciledUnlockedDistricts = districts/, 'State loader must derive district unlocks from completed missions');
assert.match(transformed, /const reconciledUnlockedMissions = missions/, 'State loader must derive mission unlocks from completed missions');
assert.match(transformed, /unlockedDistricts: reconciledUnlockedDistricts,/, 'Persisted district unlock list must not override derived progression');
assert.match(transformed, /unlockedMissions: reconciledUnlockedMissions/, 'Persisted mission unlock list must not override derived progression');

const store = new Map();
globalThis.localStorage = {
  getItem: key => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, value),
};

const stateModule = await import(`data:text/javascript,${encodeURIComponent(transformed)}`);
stateModule.saveState({ completed: ['first-delivery'], unlockedDistricts: ['old-city'], unlockedMissions: ['first-delivery'] });
const loaded = stateModule.loadState();

assert.ok(loaded.unlockedDistricts.includes('industrial'), 'Completed first mission must unlock Industrial after reload');
assert.ok(loaded.unlockedMissions.includes('dead-drop'), 'Completed first mission must unlock the next mission after reload');
assert.ok(loaded.unlockedDistricts.length >= 2, 'Derived districts must not regress to the stale saved list');

console.log('State unlock reconciliation contract: PASS');
