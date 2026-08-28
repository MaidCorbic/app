import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'game');
const home = fs.readFileSync(path.join(root, 'home-v3.js'), 'utf8');
const homeCss = fs.readFileSync(path.join(root, 'home-v3.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(home, /installSwipePlay/);
assert.match(home, /SWIPE TO DEPLOY/);
assert.match(home, /nativeClick\('#start'\)/);
assert.match(home, /bindLegacyAction\(shell\.querySelector\('\[data-v3-options\]'\)/);
assert.match(home, /bindLegacyAction\(shell\.querySelector\('\[data-v3-faq\]'\)/);
assert.match(home, /bindLegacyAction\(shell\.querySelector\('\[data-v3-exit\]'\)/);
assert.doesNotMatch(home, /data-v3-tutorial/);
assert.match(home, /#phaser-game/);
assert.match(home, /visibility:hidden/);
assert.doesNotMatch(homeCss, /body\.home-v3-active #play\{display:none/);
assert.match(index, /home-v3\.js/);

console.log('Home V3 runtime safety contract passed');
