import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const relayInit = read('relay-ui-init.js');
const indexHtml = read('index.html');
const mobile = read('src/systems/mobile-controls-controller.js');
const lifecycleAdapter = read('src/systems/runner-lifecycle-adapter.js');
const worldInteraction = read('world-interaction-v1.js');
const homeOptions = read('home-options.js');
const homeAiTutorialOptions = read('home-ai-tutorial-options.js');
const runtimeAiTutorialSettings = read('runtime-ai-tutorial-settings.js');
const settingsStore = read('src/settings/settings-store.js');
const lifecycle = read('src/systems/mission-runtime-hardening-v1.js');
const gameFlow = read('src/runtime/game-flow.js');
const packageJson = JSON.parse(read('package.json'));

const failures = [];
const count = (text, needle) => text.split(needle).length - 1;
const lifecycleScriptPresent =
  indexHtml.includes('./src/systems/runner-lifecycle-adapter.js')
  || indexHtml.includes('/src/systems/runner-lifecycle-adapter.js');

if (!lifecycleScriptPresent || count(indexHtml, 'runner-lifecycle-adapter.js') !== 1) {
  failures.push('index.html must load exactly one authoritative RunnerScene lifecycle adapter');
}
if (indexHtml.includes('./src/systems/core-stability.js') || indexHtml.includes('/src/systems/core-stability.js')) {
  failures.push('index.html must not load the removed core-stability wrapper');
}
if (indexHtml.includes('./world-interaction-v1.js') || indexHtml.includes('/world-interaction-v1.js')) {
  failures.push('index.html must not load world-interaction-v1 directly; lifecycle adapter owns its runtime integration');
}
if (!lifecycleAdapter.includes('prototype.create =')) {
  failures.push('lifecycle adapter must own the RunnerScene create hook');
}
if (!lifecycleAdapter.includes('prototype.update =')) {
  failures.push('lifecycle adapter must own the RunnerScene update hook');
}
if (!lifecycleAdapter.includes('prototype.fail =')) {
  failures.push('lifecycle adapter must own the RunnerScene fail hook');
}
if (!lifecycleAdapter.includes('prototype.respawnCheckpoint =')) {
  failures.push('lifecycle adapter must own the RunnerScene respawn hook');
}
if (!worldInteraction.includes('export function setupWorldInteraction')) {
  failures.push('world interaction must expose setupWorldInteraction as a pure integration API');
}
if (worldInteraction.includes('RunnerScene.prototype.create') || worldInteraction.includes('RunnerScene.prototype.update')) {
  failures.push('world-interaction-v1.js must not patch RunnerScene lifecycle methods');
}

if (count(relayInit, './src/systems/mobile-controls-controller.js') !== 1) {
  failures.push('relay-ui-init.js must load exactly one authoritative mobile controls controller');
}
if (relayInit.includes('./src/systems/mobile-controls-runtime-v2.js')) {
  failures.push('mobile-controls-runtime-v2.js must not be loaded alongside the authoritative controller');
}
if (relayInit.includes('./src/systems/mobile-controls-direct-input-v1.js')) {
  failures.push('mobile-controls-direct-input-v1.js must not be loaded as a second input path');
}
if (!mobile.includes("OWNER = 'controller-v3'")) {
  failures.push('mobile controller must expose the controller-v3 ownership marker');
}
if (!mobile.includes('stopImmediatePropagation')) {
  failures.push('mobile controller must stop legacy pointer handlers from double-processing controls');
}
if (!mobile.includes('MutationObserver')) {
  failures.push('mobile controller must recover when gameplay DOM is mounted after DOMContentLoaded');
}
if (!mobile.includes('window.__relayMobileControlsObserverV3')) {
  failures.push('mobile controller observer must be singleton');
}

if (!homeOptions.includes('./src/settings/settings-store.js')) {
  failures.push('home-options.js must use the central settings store');
}
if (homeOptions.includes("import { loadState, saveState } from './src/state.js'")) {
  failures.push('home-options.js must not own settings persistence directly');
}
for (const [name, source] of [
  ['home-ai-tutorial-options.js', homeAiTutorialOptions],
  ['runtime-ai-tutorial-settings.js', runtimeAiTutorialSettings],
]) {
  if (!source.includes('./src/settings/settings-store.js')) failures.push(`${name} must use the central settings store`);
  if (source.includes('loadState') || source.includes('saveState')) failures.push(`${name} must not own settings persistence directly`);
}
if (!settingsStore.includes('export function updateSettings')) {
  failures.push('settings store must expose updateSettings');
}
if (!settingsStore.includes('relay-settings-change')) {
  failures.push('settings store must emit relay-settings-change');
}
if (!lifecycle.includes('import { GAME_FLOW, gameFlow }')) {
  failures.push('mission runtime hardening must use the central game flow');
}
for (const marker of ['GAME_FLOW.PAUSED', 'GAME_FLOW.COMPLETE', 'GAME_FLOW.RESULTS', 'GAME_FLOW.LOADING']) {
  if (!lifecycle.includes(marker)) failures.push(`mission runtime hardening must transition through ${marker}`);
}
if (!gameFlow.includes('export const GAME_FLOW')) {
  failures.push('game flow module must expose GAME_FLOW');
}
if (!gameFlow.includes('export const gameFlow')) {
  failures.push('game flow module must expose the authoritative singleton');
}

for (const script of [
  'test:gameplay-architecture',
  'test:progression-integrity',
  'test:runtime-core',
  'test:gameplay-mobile',
]) {
  if (!packageJson.scripts?.[script]) failures.push(`package.json must expose ${script}`);
}

if (failures.length) {
  console.error('Gameplay architecture audit FAILED');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Gameplay architecture audit PASS');
console.log('- one authoritative RunnerScene lifecycle adapter');
console.log('- world interaction exposes APIs without prototype patching');
console.log('- one authoritative mobile controller');
console.log('- no legacy mobile runtime imports');
console.log('- controller ownership marker');
console.log('- legacy pointer duplication blocked');
console.log('- late DOM rebind protection');
console.log('- central settings store ownership');
console.log('- tutorial settings routed through central store');
console.log('- mission lifecycle routed through game flow');
