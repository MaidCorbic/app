import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4174;
const server = spawn('node', ['server.js'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'pipe',
});

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

let browser;
try {
  await waitForServer(`http://localhost:${PORT}/`);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const touchState = await page.evaluate(() => ({
    bodyTouch: document.body.classList.contains('is-touch'),
    controller: Boolean(window.__relayMobileControlsObserverV3),
    controls: Boolean(document.querySelector('.mobile-controls')),
    actions: [...document.querySelectorAll('[data-mobile-action]')].map(button => button.dataset.mobileAction),
    directions: [...document.querySelectorAll('[data-mobile-direction]')].map(button => button.dataset.mobileDirection),
  }));

  assert.equal(errors.length, 0, `Expected zero page errors, got: ${errors.join(', ')}`);
  assert.equal(touchState.bodyTouch, true, 'Touch mode should be enabled on a mobile viewport');
  assert.equal(touchState.controller, true, 'Authoritative mobile controller should be installed');
  assert.equal(touchState.controls, true, 'Mobile controls should be mounted');
  for (const action of ['jump', 'dash', 'fire', 'sword', 'build1', 'build2', 'gadget1', 'gadget2']) {
    assert.ok(touchState.actions.includes(action), `Missing mobile action: ${action}`);
  }
  for (const direction of ['up', 'left', 'right', 'down']) {
    assert.ok(touchState.directions.includes(direction), `Missing mobile direction: ${direction}`);
  }

  await page.evaluate(() => {
    window.__relayRunnerScene = {
      scene: { isActive: () => true },
      mobileActions: {},
    };
  });

  await page.locator('[data-mobile-action="dash"]').dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 330, clientY: 760 });
  const pressedState = await page.evaluate(() => ({
    activeClass: document.querySelector('[data-mobile-action="dash"]')?.classList.contains('is-active'),
    actionDown: window.__relayRunnerScene.mobileActions.dash,
  }));
  assert.equal(pressedState.activeClass, true, 'Dash control should visibly enter active state on pointerdown');
  assert.equal(pressedState.actionDown, true, 'Dash action should be down during pointerdown');

  await page.locator('[data-mobile-action="dash"]').dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', clientX: 330, clientY: 760 });
  const releasedState = await page.evaluate(() => ({
    activeClass: document.querySelector('[data-mobile-action="dash"]')?.classList.contains('is-active'),
    actionDown: window.__relayRunnerScene.mobileActions.dash,
  }));
  assert.equal(releasedState.activeClass, false, 'Dash control should leave active state on pointerup');
  assert.equal(releasedState.actionDown, false, 'Dash action must be released on pointerup');

  console.log('Mobile gameplay smoke test passed.');
} finally {
  if (browser) await browser.close();
  server.kill();
}
