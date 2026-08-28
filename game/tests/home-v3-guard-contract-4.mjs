import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const index = fs.readFileSync(new URL('index.html', root), 'utf8');
assert.match(index, /home-v3-guard\.js/);
console.log('HOME VISIBILITY GUARD: PASS');
