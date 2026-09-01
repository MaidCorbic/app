import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = path => readFile(fileURLToPath(new URL(path, root)), 'utf8');
const index = await read('index.html');
const ui = await read('relay-ui-init.js');
const main = await read('src/main.js');
const core = await read('src/systems/core-stability.js');
const runtime = await read('runtime-authority-v1.js');
const owner = await read('src/systems/mobile-input-single-owner-v1.js');

const ordered = (source, first, second) => {
  const a = source.indexOf(first);
  const b = source.indexOf(second);
  assert.ok(a !== -1 && b !== -1 && a < b, `expected ${first} before ${second}`);
};

// Mobile input has exactly one bootstrap owner in both static HTML and the UI initializer.
assert.equal((index.match(/src\/systems\/mobile-input-single-owner-v1\.js/g) || []).length, 1);
assert.equal((ui.match(/src\/systems\/mobile-input-single-owner-v1\.js/g) || []).length, 1);
assert.match(owner, /MOBILE INPUT SINGLE OWNER V9/);

// Critical lifecycle guards remain installed before normal gameplay use.
assert.match(core, /__relayCoreStabilityV1Installed/);
assert.match(runtime, /__relayRuntimeAuthorityV2/);
assert.match(runtime, /gameState/);
assert.match(runtime, /sceneState/);
assert.match(runtime, /activeRunId/);
assert.match(runtime, /emittedRunId/);

// Phaser must boot with an idle runner scene; launch() owns the first real mission start.
assert.match(main, /scene: \[\]/);
assert.match(main, /game\.scene\.add\('runner', RunnerScene, false\)/);

// Wrapper bootstrap order is deliberate: core safety before main gameplay use; the single-owner
// mobile controller remains after the gameplay layer that may create legacy controls.
ordered(index, 'src/systems/runtime-guard.js', 'src/systems/core-stability.js');
ordered(index, 'src/systems/core-stability.js', 'src/main.js');
ordered(ui, "'./gameplay-core-v1.js'", "'./src/systems/mobile-input-single-owner-v1.js'");

// Every known RunnerScene wrapper must be idempotent either at module level, installer level,
// or prototype level. This prevents duplicate create/update hooks after reload/bootstrap.
const wrapperFiles = [
  'wall-slide-v1.js',
  'route-mutation-v1.js',
  'pressure-route-node-v1.js',
  'timed-energy-trap-v1.js',
  'temporary-world-distortion-v1.js',
  'slide-jump-momentum-v1.js',
  'dynamic-time-cycle-v1.js',
  'presentation-final-v1.js',
  'world-interaction-runtime-v2.js',
  'src/systems/water-survival-v1.js',
  'src/systems/player-visual-v2.js',
  'src/systems/flight-vfx-v1.js',
  'src/systems/enemy-progression-v1.js',
  'src/systems/ghost-run-v1.js',
  'src/systems/adaptive-mission-modifiers-v1.js',
  'p1-gameplay-correctness-v1.js',
  'p2-character-presentation-v4.js',
].filter(Boolean);

for (const file of wrapperFiles) {
  try {
    const source = await read(file);
    if (!/RunnerScene\.prototype\.(create|update)/.test(source)) continue;
    const guarded = /if\s*\(\s*!?RunnerScene\.prototype\.__/.test(source)
      || /if\s*\(\s*!?window\.__/.test(source)
      || /if\s*\(\s*window\.__/.test(source)
      || /if\s*\(\s*!?[A-Za-z_$][\w$]*\.__[^\n]*\)/.test(source)
      || /install[A-Z]\w*\(RunnerScene\)/.test(source)
      || /const install\s*=|function install[A-Z]/.test(source);
    assert.ok(guarded, `${file} must guard its RunnerScene hook`);
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
}

console.log('Runtime wrapper order audit: PASS');
