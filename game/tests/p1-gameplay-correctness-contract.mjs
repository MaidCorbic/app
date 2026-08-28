import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const relay = read('relay-ui-init.js');
const p1 = read('p1-gameplay-correctness-v1.js');

const checks = [
  ['P1 runtime is imported', relay.includes("import './p1-gameplay-correctness-v1.js';")],
  ['Pause/Intel freeze owner exists', p1.includes("freeze(this, 'enemy-intel')") && p1.includes("freeze(scene, 'pause-menu')")],
  ['Dash breakable integration exists', p1.includes("'breakable-destroyed'") && p1.includes("dash-start")],
  ['Momentum uses authoritative game events', p1.includes("events.on?.('feedback'") && p1.includes("events.on?.('dash-start'")],
  ['Mobile settings shortcut can be hidden', p1.includes('mobile-menu-settings{display:none!important}')],
  ['Pause panel scroll is bounded on mobile', p1.includes('max-height:62dvh') && p1.includes('overflow-y:auto')],
];

for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) process.exitCode = 1;
}
if (process.exitCode) process.exit(1);
console.log('P1 gameplay correctness contract passed.');
