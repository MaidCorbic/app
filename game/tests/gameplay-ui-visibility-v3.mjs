import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'game');
const source = fs.readFileSync(path.join(root, 'gameplay-ui-visibility-v3.js'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'relay-ui-init.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const homeOptions = fs.readFileSync(path.join(root, 'home-options.js'), 'utf8');

assert.match(source, /#relayDashHud/);
assert.match(source, /#relayP1DashStatus/);
assert.match(source, /#play \.input-guide/);
assert.match(source, /#play \.hud-vital/);
assert.match(source, /@media \(max-width:880px\)/);
assert.match(source, /@media \(max-width:430px\)/);
assert.match(loader, /gameplay-ui-visibility-v3\.js/);

assert.doesNotMatch(index, /class="input-guide"/);
assert.doesNotMatch(index, /home-v3-interaction-fix\.js/);
assert.doesNotMatch(index, /home-v3-guard\.js/);
assert.doesNotMatch(index, /<script[^>]+home-v3\.js/);
assert.equal((index.match(/unified-options-ui-v1\.js/g) || []).length, 0);
assert.match(homeOptions, /unified-options-ui-v1\.js/);
assert.doesNotMatch(homeOptions, /home-navigation-final-v2\.js/);
assert.equal((index.match(/data-mobile-action=/g) || []).length, 6);

console.log('Gameplay UI visibility V3 canonical-surface contract passed');
