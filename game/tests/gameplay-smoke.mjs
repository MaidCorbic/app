import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

// End-to-end smoke test: boots the production build, clicks through the home
// screen and the chapter-intro card, and asserts the game reaches real
// gameplay with zero runtime errors. This is the scenario that previously
// caught two blank-screen regressions:
//   1. Phaser's SceneManager auto-starting RunnerScene with no mission data.
//   2. `Phaser.Math.MoveTowards` not existing, crashing movement on the first
//      frame of gameplay after the chapter-intro card is dismissed.
const PORT = 4173;

function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      fetch(url).then(() => resolve()).catch(() => {
        if (Date.now() - start > timeoutMs) reject(new Error('Server did not start in time'));
        else setTimeout(attempt, 200);
      });
    };
    attempt();
  });
}

const server = spawn('node', ['server.js'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'pipe',
});

let browser;
try {
  await waitForServer(`http://localhost:${PORT}/`);

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.click('#start');
  await page.waitForTimeout(2500);

  // Dismiss the chapter-intro card and start actually moving/playing.
  await page.mouse.click(1000, 340);
  await page.waitForTimeout(1500);
  await page.keyboard.press('Space');
  await page.waitForTimeout(1000);
  await page.mouse.click(1000, 340);
  await page.waitForTimeout(1500);

  const hud = await page.evaluate(() => ({
    objective: document.querySelector('#objective')?.textContent || '',
    playHidden: document.querySelector('#play')?.classList.contains('hidden'),
    introHidden: document.querySelector('#intro')?.classList.contains('hidden'),
    performanceVersion: window.__missionFlowPerformanceV1?.version || '',
    performanceReady: typeof window.__missionFlowPerformanceV1?.scoreRun === 'function',
  }));

  assert.equal(errors.length, 0, `Expected zero page errors, got: ${errors.join(', ')}`);
  assert.ok(hud.objective.length > 0, 'Mission objective HUD should be populated during gameplay');
  assert.equal(hud.playHidden, false, 'Play HUD should be visible during gameplay');
  assert.equal(hud.introHidden, true, 'Intro screen should be hidden during gameplay');
  assert.equal(hud.performanceVersion, '1.0', 'Mission Performance V1 should be installed');
  assert.equal(hud.performanceReady, true, 'Mission Performance V1 should expose its scoring API');

  console.log('Gameplay smoke test passed: home -> chapter intro -> live gameplay, zero errors, Performance V1 loaded.');
} finally {
  if (browser) await browser.close();
  server.kill();
}
