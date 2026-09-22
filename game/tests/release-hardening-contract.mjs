import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const gameRoot = new URL('../', import.meta.url);
const read = path => readFile(fileURLToPath(new URL(path, gameRoot)), 'utf8');

const index = await read('index.html');
const arrival = await read('cinematic-arrival-v2.js');
const arrivalCss = await read('cinematic-arrival-v2.css');
const config = await read('vite.config.mjs');
const packageJson = JSON.parse(await read('package.json'));
const main = await read('src/main.js');
const itchBoot = await read('src/itch-boot.js');
const home = await read('home-v3.js');
const splash = await read('splash-loader-v2.js');
const deploymentLoader = await read('play-deployment-loader-v1.js');
const playIntro = await read('play-intro-cinematic-v2.js');
const unifiedOptions = await read('unified-options-ui-v1.js');
const unifiedCinematic = await read('unified-cinematic-ui-v1.js');
const mobileOwner = await read('src/systems/mobile-input-single-owner-v1.js');
const uiInit = await read('relay-ui-init.js');
const core = await read('src/systems/core-stability.js');
const cargo = await read('cargo-integrity-v2.js');
const runner = await read('src/scenes/RunnerScene.js');
const state = await read('src/state.js');

assert.equal(packageJson.scripts['test:final-stability']?.length > 0, true, 'final stability suite must remain wired');
assert.equal(packageJson.scripts['test:release-ux-gameplay-polish'], 'node tests/release-ux-gameplay-polish.mjs', 'release UX/gameplay polish suite must remain wired');
assert.equal(packageJson.scripts['test:runner-runtime-stability'], 'node tests/runner-runtime-stability-contract.mjs', 'RunnerScene runtime stability suite must remain wired');
const hardening = packageJson.scripts['test:release-hardening'];
assert.equal(typeof hardening, 'string', 'release hardening command must remain wired');
for (const gate of [
  'node tests/release-hardening-contract.mjs',
  'npm run test:release-ux-gameplay-polish',
  'npm run test:gameplay-variety-safe-layer',
  'npm run test:gameplay-route-choice-v2',
  'npm run test:gameplay-route-score-bonus',
  'npm run test:route-choice-branching-v1',
  'npm run test:route-choice-duplicate-event-guard',
  'npm run test:route-mutation-choice-coordination',
  'npm run test:final-stability',
  'npm run test:runner-runtime-stability',
  'npm run build'
]) {
  assert.equal(hardening.includes(gate), true, `release hardening gate must remain wired: ${gate}`);
}
assert.equal(hardening.endsWith('npm run build'), true, 'release hardening must finish with the production build');
assert.equal(packageJson.engines?.node, '24.x', 'release Node runtime must stay pinned to Vercel runtime');
assert.match(config, /export default defineConfig/);
assert.doesNotMatch(config, /patch(DeathReason|InitialSpawnShield|CheckpointCollectibles|RespawnTransientState|SeasonalProgression|SpecialEventCreditReward)/);
assert.doesNotMatch(config, /relay-(death-reason|initial-spawn-shield|checkpoint-collectibles|respawn-transient-state|cargo-state-import|runner-zoom-stability)-fix/);
assert.doesNotMatch(config, /relayTransform\(/, 'Vite config must not rewrite gameplay source');
assert.match(index, /<script type="module" src="\.\/src\/itch-boot\.js"><\/script>/);
assert.doesNotMatch(index, /<script[^>]+src=["']\/src\//, 'itch HTML must not contain root-absolute module URLs');
assert.match(index, /<script(?:\s+defer)? src=["']\.\/splash-loader-v2\.js["']><\/script>/, 'itch splash bootstrap must load as a plain static script');
assert.match(config, /splash-loader-v2\.js/, 'Vite build must copy the splash bootstrap into dist');
assert.doesNotMatch(index, /href=["']mobile-viewport\.css["']/);
assert.doesNotMatch(arrival, /^import ['"]\.\/canonical-ui-v1\.css['"];?$/m, 'cinematic arrival must not own canonical UI CSS');
assert.match(arrival, /^import ['"]\.\/cinematic-arrival-v2\.css['"];?$/m);
assert.match(uiInit, /^import ['"]\.\/canonical-ui-v1\.css['"];?$/m);
assert.match(uiInit, /CSS bootstrap ownership/);
assert.doesNotMatch(arrival, /createElement\(['"]link['"]\)/);
assert.match(arrival, /const MIN_MS = 3600/);
assert.match(arrival, /ready-after-presentation/);
assert.match(arrivalCss, /\.arrival-mission[^}]*animation:arrivalMission \.6s 2\.15s forwards/);
assert.match(config, /phaser-vendor/);
assert.match(config, /strictExecutionOrder:\s*true/);
assert.match(main, /mobile-input-single-owner-v1/);

// Final Home-first wiring: stable Home V3 owns the first visible surface.
// Deployment loader remains available for mission-to-mission transitions,
// but it no longer gates the initial Home.
assert.match(itchBoot, /await optional\(\s*['"]home-v3['"]/);
assert.match(itchBoot, /await optional\(\s*['"]play-intro['"]/);
assert.doesNotMatch(itchBoot, /await optional\(\s*['"]home-v4['"]/);
assert.doesNotMatch(itchBoot, /home-v4-guard.*await optional/s);
assert.match(home, /home-v3-play/);
assert.match(home, /homeV3Built/);
assert.doesNotMatch(home, /home-v4-shell/);
assert.match(splash, /homeV3Built/);
assert.match(splash, /relay:home-ready/);
assert.doesNotMatch(
  deploymentLoader,
  /document\.addEventListener\(\s*['"]click['"][\s\S]*?,\s*true\s*\)\s*;/,
  'deployment loader must not own document-level capture clicks'
);
assert.match(home, /const sourceStart = \$\('start'\);/);
assert.match(home, /HTMLElement\.prototype\.click\.call\(sourceStart\)/);
assert.doesNotMatch(
  playIntro,
  /window\.relayPlayDeploymentV1[\s\S]*?typeof window\.relayPlayDeploymentV1\.show === 'function'/
);
assert.match(
  unifiedOptions,
  /#pauseMenu \[data-pause-tab="settings"\], #pauseMenu \[data-tab="settings"\]/
);
assert.match(
  unifiedOptions,
  /#panelContent, \.relay-pause-content/
);
assert.match(
  unifiedOptions,
  /\[data-pause-tab="settings"\], \[data-tab="settings"\]/
);
assert.match(
  unifiedOptions,
  /classList\.contains\('is-active'\)/
);
assert.match(
  unifiedCinematic,
  /data-unified-setting="\$\{key\}"[\s\S]*data-unified-toggle="\$\{key\}"/
);


// V9 is the only mobile input owner. Legacy RunnerScene listeners are detached
// at runtime instead of being allowed to compete with Phaser key/cursor state.
assert.match(mobileOwner, /window\s*\.addEventListener\s*\(\s*['"]relay:runner-scene-ready['"]/);
assert.match(mobileOwner, /detachLegacyRunnerInput/);
assert.match(mobileOwner, /events\s*\.off\s*\(\s*['"]mobile-action['"]/);
assert.match(mobileOwner, /events\s*\.off\s*\(\s*['"]mobile-move['"]/);
assert.match(mobileOwner, /window\.\__relayMobileInputSingleOwnerV9/);

// RunnerScene stability behavior is source-owned by the runtime authority.
assert.match(core, /SPAWN_SHIELD_MS/);
assert.match(core, /function resetTransientRespawnState\(scene\)/);
assert.match(core, /function rememberCheckpointCollectibles\(scene\)/);
assert.match(core, /function inferDeathReason\(message\)/);
assert.match(core, /RunnerScene\.prototype\.takeSciFiHit = function stableHit/);
assert.match(core, /RunnerScene\.prototype\.respawnCheckpoint = function stableRespawn/);
assert.match(runner, /let cinematicTargetZoom\s*=\s*1\s*;/);
assert.match(runner, /cinematicTargetZoom\s*=\s*1\.035\s*;/);
assert.match(runner, /cinematicTargetZoom\s*=\s*1\.026\s*;/);
assert.match(runner, /cinematicTargetZoom\s*=\s*1\.014\s*;/);
assert.match(runner, /cinematicTargetZoom\s*=\s*1\.045\s*;/);
assert.match(runner, /const speedZoomTarget\s*=\s*\n?\s*1\s*\+\s*speedZoom\s*;/);
assert.match(runner, /const targetZoom\s*=\s*Math\.max\(\s*cinematicTargetZoom\s*,\s*speedZoomTarget\s*\);/);
assert.doesNotMatch(runner, /this\.cameras\.main\.zoom\s*=/, 'RunnerScene must not directly assign camera zoom');

// Persistent progression and cargo runtime remain source-owned.
assert.match(state, /const modifierXp\s*=\s*[\s\S]*?runStats\.modifier\?\.xpBonus/);
assert.match(state, /const modifierCredits\s*=\s*[\s\S]*?runStats\.modifier\?\.credits/);
assert.match(state, /rivalCredits\s*\+\s*modifierCredits/);
assert.match(cargo, /^import \{ packages \} from '\.\/src\/packages\.js';\nimport \{ loadState, saveState \} from '\.\/src\/state\.js';/);
assert.doesNotMatch(cargo, /import\('\.\/src\/state\.js'\)/, 'cargo runtime must not lazy-load state through a build patch');
assert.match(cargo, /const state = loadState\(\);/);
assert.match(cargo, /saveState\(state\);/);

await assert.rejects(access(fileURLToPath(new URL('../vite.config.js', gameRoot))), /ENOENT/, 'legacy Vite config must not return');

const actionCount = (index.match(/data-mobile-action=/g) || []).length;
assert.equal(actionCount, 6, 'touch action surface must stay at exactly six controls');
assert.doesNotMatch(home, /RUN THE SLEEPING CITY\. CARRY THE SIGNAL\. KEEP THE LINE ALIVE\. EVERY ROOFTOP IS PART OF THE NETWORK\./);
assert.match(unifiedOptions, /GRAPHICS_QUALITY_DEFAULT[\s\S]*LOW/);
assert.match(unifiedOptions, /GRAPHICS_QUALITY_KEY/);

console.log('Release hardening contract: PASS');
