import assert from 'node:assert/strict';
import { buildDistrictRecord, classifyResponse, loadDistrictRecord, RESPONSE_PROFILES } from '../city-response-v1.js';

assert.equal(classifyResponse({ packageCondition: 100, collisions: 0, alarms: 0 }), 'CLEAN');
assert.equal(classifyResponse({ packageCondition: 69, collisions: 0, alarms: 0 }), 'DAMAGED');
assert.equal(classifyResponse({ packageCondition: 100, collisions: 4, alarms: 0 }), 'DAMAGED');
assert.equal(classifyResponse({ packageCondition: 100, collisions: 0, alarms: 3 }), 'DAMAGED');

const record = buildDistrictRecord({
  missionId: 'corporate-lockdown',
  district: 'Cityspine',
  response: 'CLEAN',
  signals: 8,
  packageCondition: 96,
  score: 1250,
});

assert.equal(record.missionId, 'corporate-lockdown');
assert.equal(record.district, 'Cityspine');
assert.equal(record.response, 'CLEAN');
assert.equal(record.signals, 8);
assert.equal(record.packageCondition, 96);
assert.equal(record.score, 1250);
assert.ok(record.updatedAt > 0);
assert.ok(RESPONSE_PROFILES.CLEAN);
assert.ok(RESPONSE_PROFILES.DAMAGED);
assert.equal(RESPONSE_PROFILES.NETWORKED, undefined);
assert.equal(loadDistrictRecord(''), null);

console.log('City Response tests passed.');
