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
if (relayInit.includes("./src/systems/mobile-controls-runtime-v2.js")) {
  failures.push('mobile-controls-runtime-v2.js must not be loaded alongside the authoritative controller');
}
if (relayInit.includes("./src/systems/mobile-controls-direct-input-v1.js")) {
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
if (!packageJson.scripts?.['test:gameplay-architecture']) {
  failures.push('package.json must expose test:gameplay-architecture');
}
if (!packageJson.scripts?.['test:progression-integrity']) {
  failures.push('package.json must expose test:progression-integrity');
}

if (failures.length) {
  console.error('Gameplay architecture audit FAILED');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Gameplay architecture audit PASS');
console.log('- one authoritative mobile controller');
console.log('- no legacy mobile runtime imports');
console.log('- controller ownership marker');
console.log('- legacy pointer duplication blocked');
console.log('- late DOM rebind protection');
