import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const gameRoot = new URL('../', import.meta.url);
const read = path => readFile(fileURLToPath(new URL(path, gameRoot)), 'utf8');

const index = await read('index.html');
const arrival = await read('cinematic-arrival-v2.js');
const arrivalCss = await read('cinematic-arrival-v2.css');
const canonicalCss = await read('canonical-ui-v1.css');
const releaseCss = await read('release-final-ui-v1.css');
const mobileGameplayCss = await read('unified-gameplay-ui-v1-mobile.css');
const config = await read('vite.config.mjs');
const packageJson = JSON.parse(await read('package.json'));
const main = await read('src/main.js');
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
assert.match(index, /<script type="module" src="\.\/cinematic-arrival-v2\.js"><\/script>/);
assert.doesNotMatch(index, /<script src=["']\.\/cinematic-arrival-v2\.js["']/);
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

// V9 is the only mobile input owner. Legacy RunnerScene listeners are detached
// at runtime instead of being allowed to compete with Phaser key/cursor state.
assert.match(mobileOwner, /window\.addEventListener\('relay:runner-scene-ready'/);
assert.match(mobileOwner, /detachLegacyRunnerInput/);
assert.match(mobileOwner, /events\.off\('mobile-action'/);
assert.match(mobileOwner, /events\.off\('mobile-move'/);
assert.match(mobileOwner, /window\.\__relayMobileInputSingleOwnerV9/);

// Mobile PAUSE / SETTINGS have exactly one visual button-styling owner.
assert.match(canonicalCss, /MOBILE PAUSE \/ SETTINGS — CANONICAL OWNER/);
assert.match(canonicalCss, /\.mobile-menu-pause\s*\{[\s\S]*?bottom\s*:/);
assert.match(canonicalCss, /\.mobile-menu-settings\s*\{[\s\S]*?bottom\s*:/);
assert.match(canonicalCss, /#mobileBottomHud\.is-active\s*\{/);
assert.doesNotMatch(releaseCss, /\.mobile-menu-button\s*\{/);
assert.doesNotMatch(releaseCss, /\.mobile-menu-(pause|settings)\s*\{/);
assert.doesNotMatch(mobileGameplayCss, /\.mobile-menu-button\s*\{/);
assert.doesNotMatch(mobileGameplayCss, /\.mobile-menu-(pause|settings)\s*\{/);

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

console.log('Release hardening contract: PASS');
