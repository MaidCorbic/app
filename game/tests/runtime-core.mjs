import assert from 'node:assert/strict';
import { GAME_FLOW, createGameFlow } from '../src/runtime/game-flow.js';
import { normalizeSettings } from '../src/settings/settings-store.js';

const flow = createGameFlow();
assert.equal(flow.getState(), GAME_FLOW.HOME);
assert.equal(flow.transition(GAME_FLOW.RUNNING), false, 'Home must enter briefing before running');
assert.equal(flow.transition(GAME_FLOW.BRIEFING), true);
assert.equal(flow.transition(GAME_FLOW.LOADING), true);
assert.equal(flow.transition(GAME_FLOW.RUNNING), true);
assert.equal(flow.transition(GAME_FLOW.PAUSED), true);
assert.equal(flow.transition(GAME_FLOW.COMPLETE), false, 'Paused flow must resume before completion');
assert.equal(flow.transition(GAME_FLOW.RUNNING), true);
assert.equal(flow.transition(GAME_FLOW.COMPLETE), true);
assert.equal(flow.transition(GAME_FLOW.RESULTS), true);
assert.equal(flow.transition(GAME_FLOW.LOADING), true);

const settings = normalizeSettings({
  musicVolume: 9,
  sfxVolume: -2,
  muted: 1,
  screenShake: false,
  unknown: 'ignored',
});
assert.equal(settings.musicVolume, 1);
assert.equal(settings.sfxVolume, 0);
assert.equal(settings.muted, true);
assert.equal(settings.screenShake, false);
assert.equal(settings.unknown, undefined);

console.log('Runtime core tests passed.');
