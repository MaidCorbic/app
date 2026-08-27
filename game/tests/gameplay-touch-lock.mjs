import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../mobile-final-polish.css', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../gameplay-touch-lock.js', import.meta.url), 'utf8');

assert.match(html, /maximum-scale=1\.0/);
assert.match(html, /user-scalable=no/);
assert.match(html, /gameplay-touch-lock\.js/);
assert.match(css, /orientation:portrait.*pointer:coarse/);
assert.match(css, /\.mobile-controls\{display:none!important\}/);
assert.match(css, /orientation:landscape.*pointer:coarse/);
assert.match(css, /\.mobile-controls\{display:flex!important\}/);
assert.match(js, /['\"]copy['\"]/);
assert.match(js, /['\"]gesturestart['\"]/);

console.log('gameplay touch-lock checks passed');
