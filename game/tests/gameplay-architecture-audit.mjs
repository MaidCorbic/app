import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const relayInit = read('relay-ui-init.js');
const mobile = read('src/systems/mobile-controls-controller.js');
const packageJson = JSON.parse(read('package.json'));

const failures = [];
const count = (text, needle) => text.split(needle).length - 1;

if (count(relayInit, "./src/systems/mobile-controls-controller.js") !== 1) {
  failures.push('relay-ui-init.js must load exactly one authoritative mobile controls controller');
}
if (relayInit.includes("./src/systems/touch-controls.js")) {
  failures.push('legacy touch-controls.js must not be loaded alongside the authoritative controller');
}
if (!mobile.includes("mobileControlsOwner = 'controller'")) {
  failures.push('mobile controller must mark the DOM it owns to prevent duplicate binding');
}
if (!mobile.includes('MutationObserver')) {
  failures.push('mobile controller must recover when gameplay DOM is mounted after DOMContentLoaded');
}
if (!mobile.includes("window.__relayMobileControlsObserver")) {
  failures.push('mobile controller observer must be singleton');
}
if (!packageJson.scripts?.['test:gameplay-architecture']) {
  failures.push('package.json must expose test:gameplay-architecture');
}

if (failures.length) {
  console.error('Gameplay architecture audit FAILED');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Gameplay architecture audit PASS');
console.log('- one authoritative mobile controller');
console.log('- no legacy touch controller import');
console.log('- controller ownership marker');
console.log('- late DOM rebind protection');
