import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4173;
const baseURL = 'http://127.0.0.1:' + port;

const server = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vite', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { cwd: new URL('../', import.meta.url), stdio: 'pipe', shell: false }
);

let logs = [];
server.stderr?.on('data', d => logs.push(String(d)));

const waitForServer = async () => {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(baseURL + '/');
      if (res.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Vite server did not start. ' + logs.join(''));
};

try {
  await waitForServer();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => pageErrors.push(String(err)));

  await page.goto(baseURL + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const initial = await page.evaluate(() => ({
    orientation: document.documentElement.dataset.relayOrientation,
    play: document.querySelector('#play')?.getBoundingClientRect().toJSON(),
    phaser: document.querySelector('#phaser-game canvas')?.getBoundingClientRect().toJSON()
  }));

  assert.equal(initial.orientation, 'portrait');
  assert.ok(initial.play);
  assert.ok(initial.phaser);

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(700);

  const landscape = await page.evaluate(() => ({
    orientation: document.documentElement.dataset.relayOrientation,
    play: document.querySelector('#play')?.getBoundingClientRect().toJSON(),
    phaser: document.querySelector('#phaser-game canvas')?.getBoundingClientRect().toJSON()
  }));

  assert.equal(landscape.orientation, 'landscape');
  assert.ok(landscape.play.width > landscape.play.height);
  assert.ok(landscape.phaser.width > landscape.phaser.height);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(700);

  const portraitAgain = await page.evaluate(() => ({
    orientation: document.documentElement.dataset.relayOrientation,
    play: document.querySelector('#play')?.getBoundingClientRect().toJSON(),
    phaser: document.querySelector('#phaser-game canvas')?.getBoundingClientRect().toJSON()
  }));

  assert.equal(portraitAgain.orientation, 'portrait');
  assert.ok(portraitAgain.play.height > portraitAgain.play.width);
  assert.ok(portraitAgain.phaser.height > portraitAgain.phaser.width);

  assert.deepEqual(pageErrors, []);
  assert.deepEqual(consoleErrors, []);

  await browser.close();
  console.log('Mobile orientation browser smoke: PASS');
} finally {
  server.kill('SIGTERM');
}
