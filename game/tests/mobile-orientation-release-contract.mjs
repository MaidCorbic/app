import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = path => readFile(fileURLToPath(new URL(path, root)), 'utf8');

const index = await read('index.html');
const viewport = await read('src/systems/mobile-viewport-hardening.js');
const relayUi = await read('relay-ui-init.js');
const vite = await read('vite.config.mjs');

assert.match(vite, /base:\s*['"]\.\/['"]/);
assert.match(index, /href="\.\/assets\/favicon\.ico"/);
assert.match(index, /srcset="\.\/assets\/loading-landscape\.jpg"/);
assert.match(index, /src="\.\/assets\/loading\.jpg"/);

// Source entry points remain Vite-relative and therefore become portable
// relative URLs in the production bundle.
assert.doesNotMatch(index, /src="\/src\//);
assert.doesNotMatch(index, /(?:src|srcset|href)="\/game\//);

// Only the canonical mobile viewport controller may publish viewport state.
assert.doesNotMatch(relayUi, /viewport-sync\.js/);
assert.match(viewport, /Phaser.Scale.RESIZE/);
assert.doesNotMatch(viewport, /p\.style\.width/);
assert.doesNotMatch(viewport, /p\.style\.height/);
assert.match(viewport, /relay:viewport-settled/);

// The retired controller remains in the tree for rollback/reference, but is
// not imported by the live game entrypoint.
assert.match(relayUi, /mobile-viewport-hardening\.js/);

console.log('Mobile orientation + static-host release contract: PASS');
