import fs from 'node:fs';
import assert from 'node:assert/strict';
const css=fs.readFileSync(new URL('../mobile-final-polish.css',import.meta.url),'utf8');
assert.match(css,/orientation:portrait.*pointer:coarse/);
assert.match(css,/body\.is-touch \.mobile-controls\{display:none!important\}/);
assert.match(css,/orientation:landscape.*pointer:coarse/);
assert.match(css,/body\.is-touch \.mobile-controls\{display:flex!important\}/);
console.log('portrait/landscape controls contract passed');
