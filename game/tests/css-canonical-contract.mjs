import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = path => readFile(fileURLToPath(new URL(path, root)), 'utf8');

const css = await read('../canonical-ui-v1.css');
const releaseCss = await read('../release-final-ui-v1.css');
const mobileCss = await read('../unified-gameplay-ui-v1-mobile.css');
const arrival = await read('../cinematic-arrival-v2.js');
const uiInit = await read('../relay-ui-init.js');
const index = await read('../index.html');
const base = await read('../styles.css');

assert.match(css, /STACKING CONTRACT/);
assert.match(css, /TOUCH GAMEPLAY CONTROLS/);
assert.match(css, /MOBILE PAUSE \/ SETTINGS — CANONICAL OWNER/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /safe-area-inset-bottom/);
assert.match(css, /#play \.hud-actions>button/);
assert.match(css, /#pauseMenu \.menu-grid/);
assert.match(css, /#worldMap/);
assert.match(css, /#preflight/);
assert.match(css, /#mobileBottomHud/);
assert.match(css, /#mobilePauseButton|\.mobile-menu-pause/);
assert.match(css, /#mobileSettingsButton|\.mobile-menu-settings/);
assert.match(css, /body\.is-touch #play #pause[\s\S]*display:none/);
assert.doesNotMatch(arrival, /^import ['"]\.\/canonical-ui-v1\.css['"];?$/m);
assert.match(arrival, /^import ['"]\.\/cinematic-arrival-v2\.css['"];?$/m);
assert.match(uiInit, /^import ['"]\.\/canonical-ui-v1\.css['"];?$/m);
assert.match(uiInit, /CSS bootstrap ownership/);
assert.equal((index.match(/data-mobile-action=/g) || []).length, 6);
assert.match(base, /body\.is-touch \.mobile-controls small/);
assert.match(css, /body\.is-touch #play \.mobile-actions small\{display:none !important\}/);

// Mobile PAUSE / SETTINGS have one visual CSS owner. The canonical file may also
// contain helper/contract rules for the surface; gameplay CSS may keep visibility
// coordination, but neither may style the actual menu buttons.
assert.match(css, /#mobileBottomHud[^{]*\{[\s\S]*\.mobile-menu-button/);
assert.match(css, /\.mobile-menu-pause\s*\{[\s\S]*?bottom\s*:/);
assert.match(css, /\.mobile-menu-settings\s*\{[\s\S]*?bottom\s*:/);
assert.equal((css.match(/#mobileBottomHud\.is-active\s*\{/g) || []).length, 1, 'canonical mobile HUD active-state rule must be unique');
assert.doesNotMatch(releaseCss, /\.mobile-menu-button\s*\{/,'release-final-ui-v1.css must not style mobile menu buttons');
assert.doesNotMatch(releaseCss, /\.mobile-menu-(pause|settings)\s*\{/,'release-final-ui-v1.css must not style mobile PAUSE / SETTINGS');
assert.doesNotMatch(mobileCss, /\.mobile-menu-button\s*\{/,'unified-gameplay-ui-v1-mobile.css must not style mobile menu buttons');
assert.doesNotMatch(mobileCss, /\.mobile-menu-(pause|settings)\s*\{/,'unified-gameplay-ui-v1-mobile.css must not style mobile PAUSE / SETTINGS');

console.log('Canonical CSS contract: PASS');
