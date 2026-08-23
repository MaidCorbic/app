import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4173;
function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => fetch(url).then(resolve).catch(() => {
      if (Date.now() - start > timeoutMs) reject(new Error('Server did not start in time'));
      else setTimeout(attempt, 200);
    });
    attempt();
  });
}

const server = spawn('node', ['server.js'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'pipe',
});

let browser;
let page;
try {
  await waitForServer(`http://localhost:${PORT}/`);
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.addInitScript(() => {
    window.__relayIntroVisibilityTrace = [];
    const add = DOMTokenList.prototype.add;
    DOMTokenList.prototype.add = function (...tokens) {
      const result = add.apply(this, tokens);
      const intro = document.getElementById('intro');
      if (intro && this === intro.classList && tokens.includes('hidden')) {
        window.__relayIntroVisibilityTrace.push(new Error('intro hidden').stack || 'unknown stack');
      }
      return result;
    };
  });

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.locator('#start').waitFor({ state: 'visible', timeout: 6000 });
  await page.click('#start');
  await page.waitForTimeout(2500);

  await page.mouse.click(1000, 340);
  await page.waitForTimeout(6000);

  const before = await page.evaluate(() => {
    const runner = window.__relayRunnerScene || window.game?.scene?.getScene?.('runner');
    return { x: runner?.player?.x, inputEnabled: runner?.inputEnabled, cinematic: window.__relayCinematicLock === true };
  });
  await page.keyboard.down('d');
  await page.waitForTimeout(500);
  await page.keyboard.up('d');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => {
    const runner = window.__relayRunnerScene || window.game?.scene?.getScene?.('runner');
    return { x: runner?.player?.x, inputEnabled: runner?.inputEnabled, cinematic: window.__relayCinematicLock === true };
  });

  const hud = await page.evaluate(() => ({
    objective: document.querySelector('#objective')?.textContent || '',
    playHidden: document.querySelector('#play')?.classList.contains('hidden'),
    introHidden: document.querySelector('#intro')?.classList.contains('hidden'),
  }));

  assert.equal(errors.length, 0, `Expected zero page errors, got: ${errors.join(', ')}`);
  assert.ok(hud.objective.length > 0, 'Mission objective HUD should be populated during gameplay');
  assert.equal(hud.playHidden, false, 'Play HUD should be visible during gameplay');
  assert.equal(hud.introHidden, true, 'Intro screen should be hidden during gameplay');
  assert.equal(after.cinematic, false, 'Cinematic lock must be released after the intro');
  assert.notEqual(after.inputEnabled, false, 'Gameplay input must be enabled after the intro');
  assert.ok(typeof before.x === 'number' && typeof after.x === 'number' && Math.abs(after.x - before.x) > 1, 'Player must still respond to movement after the intro');

  console.log('Gameplay smoke test passed: intro handoff releases lock and player remains controllable.');
} catch (error) {
  const trace = await page?.evaluate(() => window.__relayIntroVisibilityTrace || []).catch(() => []);
  if (trace.length) error.message += `\nIntro hidden traces:\n${trace.join('\n---\n')}`;
  throw error;
} finally {
  if (browser) await browser.close();
  server.kill();
}
