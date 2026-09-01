import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const gameRoot = new URL('../', import.meta.url);
const read = path => readFile(fileURLToPath(new URL(path, gameRoot)), 'utf8');

const index = await read('index.html');
const arrival = await read('cinematic-arrival-v2.js');
const config = await read('vite.config.mjs');
const packageJson = JSON.parse(await read('package.json'));
const main = await read('src/main.js');

assert.equal(packageJson.scripts['test:final-stability']?.length > 0, true, 'final stability suite must remain wired');
assert.equal(packageJson.scripts['test:release-hardening'], 'node tests/release-hardening-contract.mjs && npm run test:final-stability && npm run build', 'release hardening command must be canonical');
assert.match(config, /export default defineConfig/);
assert.doesNotMatch(index, /href=["']mobile-viewport\.css["']/);
assert.match(index, /<script type="module" src="\.\/cinematic-arrival-v2\.js"><\/script>/);
assert.doesNotMatch(index, /<script src=["']\.\/cinematic-arrival-v2\.js["']/);
assert.match(arrival, /^import ['"]\.\/canonical-ui-v1\.css['"];?$/m);
assert.match(arrival, /^import ['"]\.\/cinematic-arrival-v2\.css['"];?$/m);
assert.doesNotMatch(arrival, /createElement\(['"]link['"]\)/);
assert.match(main, /mobile-input-single-owner-v1/);

await assert.rejects(access(fileURLToPath(new URL('../vite.config.js', gameRoot))), /ENOENT/, 'legacy Vite config must not return');

const actionCount = (index.match(/data-mobile-action=/g) || []).length;
assert.equal(actionCount, 6, 'touch action surface must stay at exactly six controls');

console.log('Release hardening contract: PASS');
