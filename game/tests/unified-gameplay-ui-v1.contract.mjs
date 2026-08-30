import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ui = await readFile(new URL('../unified-gameplay-ui-v1.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../unified-gameplay-ui-v1.css', import.meta.url), 'utf8');
const polish = await readFile(new URL('../unified-gameplay-ui-v1-polish.css', import.meta.url), 'utf8');

for (const token of ['MISSION INTELLIGENCE','ROTATE YOUR DEVICE','relayUpdateCenter','relay-home-update','REFRESH NOW','gameplay:v12:event']) assert.match(ui, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
for (const missionId of ['first-delivery','dead-drop','blackout','pursuit','signal-storm','corporate-lockdown','final-relay']) assert.match(ui, new RegExp(missionId));
for (const token of ['--relay-ui-bg:#020305','--relay-ui-gold:#ffd06e','.relay-gameplay-intel','.relay-rotate-card','#game .hud']) assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
for (const token of ['.relay-home-update','.relay-update-entry','.relay-update-actions']) assert.match(polish, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.doesNotMatch(ui, /addEventListener\(['"]click['"][^)]*document/);
console.log('Unified gameplay UI V1 contract: PASS');
