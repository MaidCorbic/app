import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = path => readFile(fileURLToPath(new URL(path, root)), 'utf8');

const index = await read('index.html');
const init = await read('relay-ui-init.js');
const styles = await read('release-ux-gameplay-polish-v1.css');
const runtime = await read('release-ux-gameplay-polish-v1.js');
const flight = await read('src/systems/flight-hover-glide-v1.js');
const missionFinish = await read('src/systems/mission-finish-recovery.js');

assert.match(init, /release-ux-gameplay-polish-v1\.css/);
assert.match(init, /release-ux-gameplay-polish-v1\.js/);
assert.match(index, /id="titlePanel"/);
assert.match(index, /id="pauseMenu"/);
assert.doesNotMatch(index, /class="rotate-prompt"/);
assert.doesNotMatch(index, /data-rotate-dismiss/);
assert.match(styles, /scrollbar-width:thin/);
assert.match(styles, /scroll-behavior:smooth/);
assert.match(styles, /\.relay-pause-brief/);
assert.match(styles, /\.relay-faction-dialogue/);
assert.match(styles, /orientation:portrait/);
assert.match(styles, /orientation:landscape/);
assert.match(styles, /backdrop-sun/);
assert.match(styles, /#progress/);
assert.match(runtime, /setInterval\(\(\) =>/);
assert.match(runtime, /30000/);
assert.match(runtime, /event\.key !== 'Enter'/);
assert.match(runtime, /dismissIntelCard/);
assert.match(runtime, /release-hidden-yellow/);
assert.match(runtime, /Tactical mission route map/);
assert.match(flight, /DEFAULT_FLIGHT_DURATION_MS = 15000/);
assert.match(flight, /FLIGHT ONLINE · 15 SEC/);
assert.match(missionFinish, /handledRunKey/);
assert.match(missionFinish, /completeMission/);

console.log('Release UX/gameplay polish contract: PASS');
