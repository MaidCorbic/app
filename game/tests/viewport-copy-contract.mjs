import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../mobile-final-polish.css',import.meta.url),'utf8');
assert.match(html,/user-scalable=no/); assert.match(html,/maximum-scale=1\.0/); assert.match(html,/gameplay-touch-lock\.js/);
assert.match(css,/orientation:portrait/); assert.match(css,/orientation:landscape/); assert.match(css,/user-select:none/);
console.log('viewport/copy contract passed');
