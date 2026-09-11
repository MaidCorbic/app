import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = relative => readFile(path.join(root, relative), 'utf8');

const index = await read('index.html');
const pause = await read('pause-interactions.js');
const bootstrap = await read('relay-ui-init.js');
const canonical = await read('canonical-ui-v1.css');

const mobilePauseDefinitions = (pause.match(/id="mobilePauseButton"/g) || []).length;
const mobileSettingsDefinitions = (pause.match(/id="mobileSettingsButton"/g) || []).length;

assert.equal(mobilePauseDefinitions, 1, 'Mobile Pause must have exactly one DOM owner');
assert.equal(mobileSettingsDefinitions, 1, 'Mobile Settings must have exactly one DOM owner');
assert.equal((index.match(/id="mobilePauseButton"/g) || []).length, 0, 'index.html must not define a second mobile Pause owner');
assert.equal((index.match(/id="mobileSettingsButton"/g) || []).length, 0, 'index.html must not define a second mobile Settings owner');

const pauseBootstrapImports = (index.match(/(?:src|href)="(?:\.\/)?pause-interactions\.js"/g) || []).length;
assert.equal(pauseBootstrapImports, 1, 'pause-interactions.js must be bootstrapped exactly once from index.html');

const canonicalImportIndex = bootstrap.indexOf("import './canonical-ui-v1.css';");
const releaseFinalImportIndex = bootstrap.indexOf("import './release-final-ui-v1.css';");
assert(canonicalImportIndex > releaseFinalImportIndex, 'canonical-ui-v1.css must be loaded after release-final-ui-v1.css');
assert.match(canonical, /#mobileBottomHud/);
assert.match(canonical, /mobile-menu-pause/);
assert.match(canonical, /mobile-menu-settings/);

console.log('Mobile UI ownership contract: PASS');
