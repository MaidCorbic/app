import fs from 'node:fs';
import assert from 'node:assert/strict';

const css=fs.readFileSync(new URL('../mobile-final-polish.css',import.meta.url),'utf8');
const cleanupCss=fs.readFileSync(new URL('../mobile-hud-options-cleanup-v1.css',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../pause-interactions.js',import.meta.url),'utf8');
const featureDock=fs.readFileSync(new URL('../gameplay-feature-dock-v1.js',import.meta.url),'utf8');
const canonical=fs.readFileSync(new URL('../canonical-ui-v1.css',import.meta.url),'utf8');
const mobileUi=fs.readFileSync(new URL('../unified-gameplay-ui-v1-mobile.css',import.meta.url),'utf8');

assert.match(css,/orientation:portrait.*pointer:coarse/);
assert.match(css,/body\.is-touch \.mobile-controls\{display:none!important\}/);
assert.match(css,/orientation:landscape.*pointer:coarse/);
assert.match(css,/body\.is-touch \.mobile-controls\{display:flex!important\}/);

// Mobile PAUSE / SETTINGS now work in both orientations through one shared HUD.
assert.match(js,/id = 'mobileBottomHud'/);
assert.match(js,/id = 'mobilePauseButton'/);
assert.match(js,/id = 'mobileSettingsButton'/);
assert.match(js,/openPause\('settings'\)/);
assert.doesNotMatch(js,/mobileRotatePrompt/);
assert.doesNotMatch(js,/ROTATE YOUR DEVICE/);
assert.doesNotMatch(js,/orientation: portrait/);

// The legacy in-HUD Pause control is explicitly suppressed on touch.
assert.match(mobileUi,/#game #play #pause[\s\S]*display:none/);
assert.match(canonical,/#mobileBottomHud/);
assert.match(canonical,/mobile-menu-pause/);
assert.match(canonical,/mobile-menu-settings/);
assert.match(canonical,/body\.is-touch #play #pause[\s\S]*display:none/);

assert.doesNotMatch(featureDock,/data-feature=\\?['\"]flight/);
assert.doesNotMatch(featureDock,/data-feature-action=\\?['\"]flight/);
assert.match(featureDock,/data-feature=\\?['\"]grapple/);
assert.match(cleanupCss,/@media \(pointer: coarse\)/);
assert.match(cleanupCss,/#play #cargoIntegrityV2/);

console.log('portrait/landscape controls contract passed');
