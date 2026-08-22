import assert from 'node:assert/strict';
import { packages } from '../src/packages.js';
import { calculateCargoDamage, classifyCargoCondition, getCargoProfile } from '../cargo-integrity-v2.js';

assert.equal(Object.keys(packages).length, 7, 'All seven authored package profiles remain present');
assert.equal(getCargoProfile('STANDARD').effect, 'STABLE CARGO');
assert.equal(getCargoProfile('URGENT').effect, 'TIME PRESSURE');
assert.equal(getCargoProfile('FRAGILE').effect, 'IMPACT SENSITIVE');
assert.equal(getCargoProfile('HIGH VALUE').effect, 'EXPOSURE');
assert.equal(getCargoProfile('SECRET').effect, 'SIGNAL INSTABILITY');
assert.equal(getCargoProfile('OVERSIZED').effect, 'HEAVY LOAD');
assert.equal(getCargoProfile('PRIME RELAY').effect, 'RELAY STABILITY');

assert.equal(classifyCargoCondition(100), 'PERFECT');
assert.equal(classifyCargoCondition(90), 'PERFECT');
assert.equal(classifyCargoCondition(89), 'STABLE');
assert.equal(classifyCargoCondition(70), 'STABLE');
assert.equal(classifyCargoCondition(69), 'DAMAGED');
assert.equal(classifyCargoCondition(40), 'DAMAGED');
assert.equal(classifyCargoCondition(39), 'CRITICAL');
assert.equal(classifyCargoCondition(1), 'CRITICAL');
assert.equal(classifyCargoCondition(0), 'LOST');

const standardHit = calculateCargoDamage({ packageType: 'STANDARD', amount: 1, cause: 'impact' });
const fragileHit = calculateCargoDamage({ packageType: 'FRAGILE', amount: 1, cause: 'impact' });
const primeDeath = calculateCargoDamage({ packageType: 'PRIME RELAY', amount: 1, cause: 'death' });
assert.ok(fragileHit > standardHit, 'Fragile cargo is more sensitive to impact');
assert.ok(primeDeath > standardHit, 'Prime Relay remains meaningful under recovery pressure');
assert.ok(calculateCargoDamage({ packageType: 'STANDARD', amount: 0 }) === 0, 'Zero damage stays zero');

console.log('Hybrid cargo integrity tests passed.');
