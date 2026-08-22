import assert from 'node:assert/strict';
import {
  CITY_PULSE_CONFIG,
  CITY_PULSE_MISSION_TARGET_X,
  phaseAt,
  openStartAt,
  isPerfectWindow,
} from '../city-pulse-core-v1.js';

assert.equal(CITY_PULSE_CONFIG.periodMs, 3600);
assert.equal(CITY_PULSE_CONFIG.warningMs, 650);
assert.equal(CITY_PULSE_CONFIG.openMs, 1050);
assert.equal(CITY_PULSE_CONFIG.gatesPerMission, 3);
assert.equal(Object.keys(CITY_PULSE_MISSION_TARGET_X).length, 7);

assert.equal(phaseAt(0), 'WARNING');
assert.equal(phaseAt(649), 'WARNING');
assert.equal(phaseAt(650), 'OPEN');
assert.equal(phaseAt(1699), 'OPEN');
assert.equal(phaseAt(1700), 'CLOSED');
assert.equal(phaseAt(3600), 'WARNING');

assert.equal(openStartAt(650), 650);
assert.equal(openStartAt(900), 650);
assert.equal(openStartAt(3600), 4250);

assert.equal(isPerfectWindow(650), true);
assert.equal(isPerfectWindow(900), true);
assert.equal(isPerfectWindow(1069), true);
assert.equal(isPerfectWindow(1070), false);
assert.equal(isPerfectWindow(1700), false);

console.log('City Pulse tests passed.');
