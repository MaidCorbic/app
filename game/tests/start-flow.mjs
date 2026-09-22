import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [source, home, briefing, deployment] = await Promise.all([
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../home-v3.js', import.meta.url), 'utf8'),
  readFile(new URL('../gameplay-intro-final-v1.js', import.meta.url), 'utf8'),
  readFile(new URL('../play-deployment-loader-v1.js', import.meta.url), 'utf8')
]);

assert.match(source, /const startRun = \(\) =>/, 'Start Run needs a canonical route');
const startRoute = source.match(/const startRun = \(\) => \{([\s\S]*?)\n\};\n\nconst continueRun/);
const continueRoute = source.match(/const continueRun = \(\) => \{([\s\S]*?)\n\};\n\n\/\*/);

assert.ok(startRoute, 'Start Run route must have a complete implementation');
assert.ok(continueRoute, 'Continue route must have a complete implementation');
assert.match(startRoute[1], /launch\(0\)/, 'Start Run must launch the first mission after Home handoff');
assert.match(source, /window\.relayStartRun = startRun;/, 'Start must publish its stable route for the rebuilt Home');
assert.match(continueRoute[1], /launch\(\s*nextMissionIndex\(\)\s*\)/, 'Continue must launch the next mission directly');
assert.match(source, /window\.relayContinueRun = continueRun;/, 'Continue must publish its stable route for the rebuilt Home');
assert.match(source, /const clearHomeBootstrapStyles = intro =>/, 'The Home-to-game handoff must clear boot-time inline styles');

assert.match(home, /relayPlayDeploymentV1/, 'Home Start must use the deployment loader');
assert.match(home, /beforeRoute: async/, 'Deployment loader must hand off to the existing gameplay Start route');
assert.match(home, /sourceStart/, 'The deployment handoff must trigger the gameplay-owned Start button');
assert.match(home, /window\.relayContinueRun\(\);/, 'Continue must call the canonical Continue route');

assert.match(deployment, /window\.relayPlayDeploymentV1/, 'Deployment loader must expose its public API');
assert.match(deployment, /beforeRoute/, 'Deployment loader must support the gameplay handoff callback');
assert.match(deployment, /loadplay\.jpg/, 'Desktop deployment artwork must be preserved');
assert.match(deployment, /loadplaymobile\.jpg/, 'Mobile deployment artwork must be preserved');

assert.match(briefing, /const PLAY_BUTTONS/, 'Mission briefing must own the pre-game route briefing');
assert.doesNotMatch(briefing, /button\.matches\(\s*'#intro #start'\s*\)/, 'Home Start must not bypass the mission briefing');
assert.match(briefing, /setTimeout\(\s*show,\s*180\)/, 'Mission briefing must appear after the gameplay runner is prepared');

console.log('Start flow contract: Home -> deployment loader -> mission map briefing -> gameplay.');
