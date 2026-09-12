import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const home = await readFile(new URL('../home-v3-interaction-fix.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');

assert.match(main, /const game = new Phaser\.Game\([\s\S]*?scene:\s*\[\]\s*\}\);/, 'Phaser must boot with no implicit scene');
assert.match(main, /game\.scene\.add\('runner', RunnerScene, false\)/, 'RunnerScene must be registered without auto-start');
assert.match(main, /function launch\(index = missionIndex, paused = false, runConfig = \{\}\)/, 'There must be one real mission launcher');
assert.match(main, /window\.relayLaunchRun\s*=\s*\(index = 0\)\s*=>\s*launch\(Number\.isInteger\(index\) \? index : 0, false\)/, 'Public RUN API must delegate to launch()');
assert.match(main, /window\.relayStartRun\s*=\s*\(\)\s*=>/, 'Home must expose canonical Start Run');
assert.match(main, /game\.scene\.resume\('runner'\)/, 'Prepared runner must resume instead of being recreated blindly');
assert.match(main, /game\.scene\.start\('runner', \{ mission: runMission, runId/, 'Fresh runs must pass mission and run id into RunnerScene');
assert.match(home, /target\.closest\('#intro #start'\)/, 'Visible Home start must be captured at the document level');
assert.doesNotMatch(home, /sourceStart\.click|HTMLElement\.prototype\.click\.call\(sourceStart\)/, 'Visible Home start must not proxy through detached legacy nodes');
assert.doesNotMatch(home, /sourceContinue\.click|HTMLElement\.prototype\.click\.call\(sourceContinue\)/, 'Visible Continue must not proxy through detached legacy nodes');
assert.match(index, /src\/main\.js/, 'Application must load canonical main entry');
assert.match(index, /home-v3-interaction-fix\.js/, 'Application must load the canonical Home interaction fix');

console.log('RUN flow contract passed.');
