import assert from 'node:assert/strict';
import { COLLAPSE_CONFIG, withinRange, pickNearestBarrier, pickChainBarrier } from '../collapse-protocol-v1.js';

assert.equal(COLLAPSE_CONFIG.maxDashRangeX, 300);
assert.equal(COLLAPSE_CONFIG.maxDashRangeY, 140);
assert.equal(withinRange({ x: 100, y: 200 }, { x: 210, y: 250 }, 120, 60), true);
assert.equal(withinRange({ x: 100, y: 200 }, { x: 250, y: 200 }, 120, 60), false);

const makeBarrier = (x, y, active = true) => ({ x, y, active, body: { enable: active } });
const barriers = {
  getChildren: () => [
    makeBarrier(230, 500),
    makeBarrier(280, 505),
    makeBarrier(520, 500, false),
  ],
};

const nearest = pickNearestBarrier({ x: 210, y: 500 }, barriers);
assert.equal(nearest?.x, 230);
assert.equal(nearest?.y, 500);

const chain = pickChainBarrier(nearest, barriers);
assert.equal(chain?.x, 280);

assert.equal(pickNearestBarrier({ x: 900, y: 900 }, barriers), null);

console.log('Collapse Protocol tests passed.');
