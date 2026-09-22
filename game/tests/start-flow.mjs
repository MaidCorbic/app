import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [source, home, briefing] = await Promise.all([
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../home-v3.js', import.meta.url), 'utf8'),
  readFile(new URL('../gameplay-intro-final-v1.js', import.meta.url), 'utf8')
]);

assert.match(source, /const startRun = \(\) =>/, 'Start Run needs a canonical route');
const startRoute = source.match(/const startRun = \(\) => \{([\s\S]*?)\n\};\n\nconst continueRun/);
const continueRoute = source.match(/const continueRun = \(\) => \{([\s\S]*?)\n\};\n\n\/\*/);

assert.ok(startRoute, 'Start Run route must have a complete implementation');
assert.ok(continueRoute, 'Continue route must have a complete implementation');
assert.match(startRoute[1], /game\.scene\.resume\(\s*'runner'\s*\)/, 'Start Run must resume RunnerScene directly');
assert.match(source, /window\.relayStartRun = startRun;/, 'Start must publish its stable route for the rebuilt Home');
assert.match(source, /const continueRun = \(\) =>/, 'Continue needs a canonical route');
assert.match(continueRoute[1], /launch\(\s*nextMissionIndex\(\)\s*\)/, 'Continue must launch the next mission directly');
assert.match(source, /window\.relayContinueRun = continueRun;/, 'Continue must publish its stable route for the rebuilt Home');
assert.doesNotMatch(startRoute[1], /openWorldMap|openPreflight/, 'Start Run must not route through map or pre-flight UI');
assert.doesNotMatch(continueRoute[1], /openWorldMap|openPreflight/, 'Continue must not route through map or pre-flight UI');
assert.match(source, /const clearHomeBootstrapStyles = intro =>/, 'The Home-to-game handoff must clear boot-time inline styles');
assert.match(source, /property => intro\.style\.removeProperty\(property\)/, 'The Home-to-game handoff must remove inline style overrides');
assert.match(source, /document\.body\.classList\.remove\('home-v3-active'\)/, 'The gameplay layer must no longer be hidden by the Home state class');

assert.match(home, /window\.relayStartRun\(\);/, 'The visible Start button must call the canonical Start route');
assert.match(home, /window\.relayContinueRun\(\);/, 'The visible Continue button must call the canonical Continue route');
assert.doesNotMatch(home, /sourceStart|sourceContinue/, 'The rebuilt Home must not forward clicks to detached legacy buttons');
assert.doesNotMatch(home, /relayPlayDeploymentV1/, 'Home Start must not route through a second full-screen deployment loader');
assert.match(briefing, /button\.matches\(\s*'#intro #start'\s*\)/, 'Home Start must bypass the blocking mission briefing');

console.log('Start and Continue flow regression checks passed.');
