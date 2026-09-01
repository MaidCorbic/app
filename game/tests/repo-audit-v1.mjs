import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = path => readFile(fileURLToPath(new URL(path, root)), 'utf8');
const owner = await read('src/systems/mobile-input-single-owner-v1.js');
const index = await read('index.html');

assert.match(owner, /MOBILE INPUT SINGLE OWNER V9/);
assert.match(owner, /normalizeActionButtons/);
assert.match(owner, /single-owner-v9/);
assert.equal((index.match(/data-mobile-action=/g) || []).length, 6);

console.log('Repo audit contract: PASS');
