import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = path => readFile(fileURLToPath(new URL(path, root)), 'utf8');
const index = await read('../index.html');
const ui = await read('../relay-ui-init.js');
const main = await read('../src/main.js');
const core = await read('../src/systems/core-stability.js');
const runtime = await read('../runtime-authority-v1.js');
const owner = await read('../src/systems/mobile-input-single-owner-v1.js');

const ordered = (source, first, second) => {
  const a = source.indexOf(first);
  const b = source.indexOf(second);
  assert.ok(a !== -1 && b !== -1 && a < b, `expected ${first} before ${second}`);
};

// One bootstrap source for the mobile single-owner controller.
assert.equal((index.match(/src\/systems\/mobile-input-single-owner-v1\.js/g) || []).length, 1);
assert.equal((ui.match(/src\/systems\/mobile-input-single-owner-v1\.js/g) || []).length, 1);
assert.match(owner, /MOBILE INPUT SINGLE OWNER V9/);

// Lifecycle safety is installed before the presentation/runtime layers are allowed to use the scene.
assert.match(core, /__relayCoreStabilityV1Installed/);
assert.match(runtime, /shutdown/);
assert.match(runtime, /activeRunId/);
assert.match(runtime, /emittedRunId/);

// Main boot must create an idle Phaser scene and explicitly opt out of automatic scene start.
assert.match(main, /scene: \[\]/);
assert.match(main, /game\.scene\.add\('runner', RunnerScene, false\)/);

// Wrapper bootstrap remains centralized rather than duplicated in index.html.
ordered(index, 'src/systems/runtime-guard.js', 'src/systems/core-stability.js');
ordered(index, 'src/systems/core-stability.js', 'src/main.js');
ordered(ui, "'./gameplay-core-v1.js'", "'./src/systems/mobile-input-single-owner-v1.js'");

// Every known wrapper discovered during the final audit must carry an idempotence marker or use
// an installer function. This prevents the same create/update hook from being registered twice.
const wrapperFiles = [
  'wall-slide-v1.js', 'route-mutation-v1.js', 'pressure-route-node-v1.js',
  'timed-energy-trap-v1.js', 'temporary-world-distortion-v1.js', 'slide-jump-momentum-v1.js',
  'dynamic-camera-language-v1.js', 'presentation-final-v1.js', 'world-interaction-runtime-v2.js',
  'src/systems/water-survival-v1.js', 'src/systems/player-visual-v2.js',
  'src/systems/flight-vfx-v1.js', 'src/systems/enemy-progressive-v1.js',
].filter(Boolean);

for (const file of wrapperFiles) {
  try {
    const source = await read(`../${file}`);
    const hasPrototypeHook = /RunnerScene\.prototype\.(create|update)/.test(source);
    if (!hasPrototypeHook) continue;
    assert.ok(/__[^\n]*Patched|__[^\n]*Installed|install[A-Z]\w*\(RunnerScene\)/.test(source), `${file} must guard its RunnerScene hook`);
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
}

console.log('Runtime wrapper order audit: PASS');
