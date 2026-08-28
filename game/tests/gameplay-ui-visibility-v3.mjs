import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'game');
const source = fs.readFileSync(path.join(root, 'gameplay-ui-visibility-v3.js'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'relay-ui-init.js'), 'utf8');

assert.match(source, /#relayDashHud/);
assert.match(source, /#relayP1DashStatus/);
assert.match(source, /#play \.input-guide/);
assert.match(source, /body\.home-v3-active #relay-gameplay-new-layer/);
assert.match(source, /#play \.hud-vital/);
assert.match(source, /@media \(max-width:880px\)/);
assert.match(source, /@media \(max-width:430px\)/);
assert.match(loader, /gameplay-ui-visibility-v3\.js/);

console.log('Gameplay UI visibility V3 contract passed');
