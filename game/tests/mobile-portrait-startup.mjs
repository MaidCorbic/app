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
  /homeV4Built/,
  'The splash must wait for the rendered home screen.',
);
assert.match(
  splashLoader,
  /await waitForHomeReady\(\);/,
  'The splash exit must be gated by home readiness.',
);

console.log('Mobile portrait startup contract: PASS');
