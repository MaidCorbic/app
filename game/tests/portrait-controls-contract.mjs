import fs from 'node:fs';
import assert from 'node:assert/strict';

const css=fs.readFileSync(new URL('../mobile-final-polish.css',import.meta.url),'utf8');
const cleanupCss=fs.readFileSync(new URL('../mobile-hud-options-cleanup-v1.css',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../pause-interactions.js',import.meta.url),'utf8');
const featureDock=fs.readFileSync(new URL('../gameplay-feature-dock-v1.js',import.meta.url),'utf8');

assert.match(css,/orientation:portrait.*pointer:coarse/);
assert.match(css,/body\.is-touch \.mobile-controls\{display:none!important\}/);
assert.match(css,/orientation:landscape.*pointer:coarse/);
assert.match(css,/body\.is-touch \.mobile-controls\{display:flex!important\}/);

assert.match(js,/id = 'mobileRotatePrompt'/);
assert.match(js,/ROTATE YOUR DEVICE/);
assert.match(js,/#cargoIntegrityV2/);
assert.match(js,/#play \.hud-xp/);
assert.match(js,/#play #pause/);
assert.match(js,/#mobileBottomHud \.mobile-menu-pause/);
assert.match(js,/orientation: portrait/);

assert.doesNotMatch(featureDock,/data-feature=\\?['\"]flight/);
assert.doesNotMatch(featureDock,/data-feature-action=\\?['\"]flight/);
assert.match(featureDock,/data-feature=\\?['\"]grapple/);
assert.match(cleanupCss,/@media \(pointer: coarse\)/);
assert.match(cleanupCss,/#play #cargoIntegrityV2/);

console.log('portrait/landscape controls contract passed');
