import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const index = fs.readFileSync(new URL('index.html', root), 'utf8');
assert.match(index, /home-v3\.js/);
assert.match(index, /home-v3\.css/);
console.log('HOME V3 ASSETS: PASS');
