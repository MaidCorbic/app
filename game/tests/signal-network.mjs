import assert from 'node:assert/strict';
import { NODE_PROFILES, chooseNodeSignalIndices, createNetworkModel, networkKey } from '../signal-network-v1.js';

assert.equal(NODE_PROFILES.length, 3, 'Signal Network has three authored node profiles');
assert.deepEqual(chooseNodeSignalIndices(0), []);
assert.deepEqual(chooseNodeSignalIndices(2), [0, 1]);
assert.deepEqual(chooseNodeSignalIndices(10), [2, 5, 7]);

const model = createNetworkModel('blackout', [[100, 200], [200, 200], [300, 180], [400, 180], [500, 220], [600, 220], [700, 210], [800, 190], [900, 190], [1000, 200]]);
assert.equal(model.length, 3);
assert.equal(model[0].profile.kind, 'SCAN');
assert.equal(model[1].profile.kind, 'BOOST');
assert.equal(model[2].profile.kind, 'LINK');
assert.equal(model[0].missionId, 'blackout');
assert.equal(model[0].position[0], 300);
assert.equal(networkKey('blackout'), 'relay-signal-network-v1:blackout');
assert.notEqual(model[0].id, model[1].id);

console.log('Signal Network tests passed.');
