import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const indexHtml = read('index.html');
const relayInit = read('relay-ui-init.js');

const failures = [];
const count = (text, needle) => text.split(needle).length - 1;

// These modules are intentionally direct application boot entrypoints in index.html.
// They must appear once and must not be re-imported by relay-ui-init.js.
const directBootEntries = [
  './home-options.js',
  './home-protection-v1.js',
  '/src/systems/runtime-guard.js',
  '/src/systems/core-stability.js',
  '/src/systems/mobile-viewport-hardening.js',
  '/src/systems/runner-texture-cache.js',
  '/src/main.js',
  '/src/systems/mission-finish-recovery.js',
  '/src/systems/mission-results.js',
  '/src/systems/mission-finish-neon-v2.js',
  '/src/systems/mission-mastery.js',
  '/src/systems/enemy-alert.js',
  './menu-music.js',
  './player-profile-v1.js',
  './pause-interactions.js',
  './pause-final-polish-v1.js',
  './relay-ui-init.js',
  './character-motion-v3.js',
  './city-pulse-title-screen-v1.js',
  './gameplay-v2-missions-xp.js',
  './mobile-hud-nav-v1.js',
  './cinematic-arrival-v2.js',
];

for (const entry of directBootEntries) {
  if (count(indexHtml, entry) !== 1) {
    failures.push(`index.html must include exactly one direct boot entry: ${entry}`);
  }
}

for (const entry of directBootEntries.filter(entry => entry !== './relay-ui-init.js')) {
  const normalized = entry.replace(/^\.\//, '');
  const relayNeedles = [entry, `./${normalized}`];
  if (relayNeedles.some(needle => relayInit.includes(needle))) {
    failures.push(`relay-ui-init.js must not duplicate direct boot entry: ${entry}`);
  }
}

const moduleScriptCount = (indexHtml.match(/<script\s+type="module"/g) || []).length;
if (moduleScriptCount !== directBootEntries.length - 1) {
  failures.push('index.html module script count changed; update the canonical boot manifest intentionally');
}

if (!indexHtml.includes('src="./relay-ui-init.js"') || !indexHtml.includes('src="/src/main.js"')) {
  failures.push('canonical bootstrap requires both relay-ui-init.js and /src/main.js');
}

if (failures.length) {
  console.error('Boot entrypoint audit FAILED');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Boot entrypoint audit PASS');
console.log(`- ${directBootEntries.length} canonical application entrypoints checked`);
console.log('- no duplicate boot ownership between index.html and relay-ui-init.js');
