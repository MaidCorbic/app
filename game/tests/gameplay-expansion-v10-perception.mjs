import assert from 'node:assert/strict';
const source=await(await fetch(new URL('../src/systems/gameplay-expansion-v10-perception.js',import.meta.url))).text();
for(const token of ['installGameplayExpansionV10','RunnerScene.prototype.create','pointerdown','keydown','Mirror','SYMBOL SEQUENCE','MEMORY MARK','PHOTO VALID','localStorage','SHUTDOWN'])assert.match(source,new RegExp(token),`V10 missing ${token}`);
console.log('V10 perception gameplay contract: PASS');
