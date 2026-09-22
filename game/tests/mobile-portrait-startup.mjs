import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const [viewportCss, splashLoader] = await Promise.all([
  read('splash-progress-visibility.css'),
  read('splash-loader-v2.js'),
]);

assert.doesNotMatch(
  viewportCss,
  /#game\s*\{\s*visibility:\s*hidden\s*!important;/,
  'Portrait CSS must not hide the whole game.',
);
assert.doesNotMatch(
  viewportCss,
  /relaySplashEmergencyDismiss/,
  'A CSS timer must not dismiss the splash before the app is ready.',
);
assert.match(
  splashLoader,
  /const openHomeOnly = \(\) =>/,
  'The splash must have one explicit recovery path to the Home screen.',
);
assert.match(
  splashLoader,
  /html\.classList\.remove\(\s*'relay-booting'\s*\)/,
  'The splash must release the first-paint boot lock.',
);
assert.match(
  splashLoader,
  /game\.style\.setProperty\(\s*'visibility',\s*'visible'/,
  'The splash recovery path must reveal the game container.',
);

console.log('Mobile portrait startup contract: PASS');
