import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium, webkit } from 'playwright';

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}/`;
const MOBILE_WIDTHS = [320, 360, 390, 430];

function waitForServer(url, timeoutMs = 15000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const probe = () => {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() - started > timeoutMs) {
            reject(new Error('Production preview server did not start in time'));
            return;
          }
          setTimeout(probe, 200);
        });
    };
    probe();
  });
}

function assertNoHorizontalOverflow(snapshot, label) {
  assert.ok(
    snapshot.scrollWidth <= snapshot.viewportWidth + 1,
    `${label}: horizontal overflow detected (${snapshot.scrollWidth}px > ${snapshot.viewportWidth}px)`,
  );
}

async function runDesktop(browserType, label) {
  const browser = await browserType.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    assert.equal(await page.title(), 'Relay Runner | Rooftop Game', `${label}: title mismatch`);

    const initial = await page.evaluate(() => ({
      introVisible: !document.querySelector('#intro')?.classList.contains('hidden'),
      pauseVisible: !document.querySelector('#pauseMenu')?.classList.contains('hidden'),
      settingsButtons: document.querySelectorAll('[data-tab="settings"]').length,
    }));
    assert.equal(initial.introVisible, true, `${label}: title screen must be visible initially`);
    assert.equal(initial.pauseVisible, false, `${label}: pause menu must start hidden`);
    assert.equal(initial.settingsButtons, 1, `${label}: exactly one in-game settings tab must exist`);

    await page.click('#start');
    await page.waitForTimeout(1800);
    await page.click('#pause');
    await page.waitForTimeout(250);

    assert.equal(
      await page.locator('#pauseMenu').isVisible(),
      true,
      `${label}: pause menu did not open`,
    );

    for (const tab of ['missions', 'progress', 'settings']) {
      await page.locator(`#pauseMenu [data-tab="${tab}"]`).click();
      await page.waitForTimeout(100);
      const panel = await page.locator('#panelContent').innerText();
      assert.ok(panel.trim().length > 0, `${label}: ${tab} panel is empty`);
    }

    await page.locator('#pauseMenu [data-tab="resume"]').click();
    await page.waitForTimeout(250);
    assert.equal(
      await page.locator('#pauseMenu').isVisible(),
      false,
      `${label}: resume did not close pause menu`,
    );

    const afterResume = await page.evaluate(() => ({
      playVisible: !document.querySelector('#play')?.classList.contains('hidden'),
      introVisible: !document.querySelector('#intro')?.classList.contains('hidden'),
      visibleOverlays: [...document.querySelectorAll('.overlay')]
        .filter(node => !node.classList.contains('hidden')).length,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    assert.equal(afterResume.playVisible, true, `${label}: play layer must remain visible`);
    assert.equal(afterResume.introVisible, false, `${label}: intro must stay hidden during gameplay`);
    assert.equal(afterResume.visibleOverlays, 0, `${label}: gameplay must not leave overlays open`);
    assertNoHorizontalOverflow(afterResume, label);
    assert.equal(errors.length, 0, `${label}: browser errors: ${errors.join(' | ')}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function runMobile(browserType, label, width) {
  const browser = await browserType.launch();
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const initial = await page.evaluate(() => ({
      touch: document.body.classList.contains('is-touch'),
      controls: document.querySelectorAll('[data-mobile-action]').length,
      rotatePrompt: !document.querySelector('.rotate-prompt')?.classList.contains('hidden'),
      mobileHudExists: !!document.querySelector('#mobileBottomHud'),
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    assert.equal(initial.touch, true, `${label} ${width}: touch mode was not detected`);
    assert.equal(initial.controls, 6, `${label} ${width}: expected exactly six mobile actions`);
    assert.equal(initial.mobileHudExists, true, `${label} ${width}: mobile bottom HUD missing`);
    assertNoHorizontalOverflow(initial, `${label} ${width}`);

    if (initial.rotatePrompt) {
      await page.locator('[data-rotate-dismiss]').click();
      await page.waitForTimeout(100);
    }

    await page.click('#start');
    await page.waitForTimeout(1800);

    const active = await page.evaluate(() => {
      const hud = document.querySelector('#mobileBottomHud');
      const buttons = [...document.querySelectorAll('#mobileBottomHud button')];
      const actions = [...document.querySelectorAll('[data-mobile-action]')];
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const boxes = [...buttons, ...actions].map(node => {
        const rect = node.getBoundingClientRect();
        return { id: node.id || node.dataset.mobileAction, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
      });
      return {
        hudActive: hud?.classList.contains('is-active') || false,
        owner: document.querySelector('.mobile-controls')?.dataset.mobileControlsOwner || '',
        boxes,
        viewport,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });

    assert.equal(active.hudActive, true, `${label} ${width}: mobile bottom HUD is not active in gameplay`);
    assert.equal(active.owner, 'single-owner-v9', `${label} ${width}: wrong mobile input owner`);
    assertNoHorizontalOverflow(
      { scrollWidth: active.scrollWidth, viewportWidth: active.viewport.width },
      `${label} ${width}`,
    );

    for (const box of active.boxes) {
      assert.ok(box.left >= -1, `${label} ${width}: ${box.id} is clipped on the left`);
      assert.ok(box.right <= active.viewport.width + 1, `${label} ${width}: ${box.id} is clipped on the right`);
      assert.ok(box.top >= -1, `${label} ${width}: ${box.id} is clipped at the top`);
      assert.ok(box.bottom <= active.viewport.height + 1, `${label} ${width}: ${box.id} is clipped at the bottom`);
      assert.ok(box.width >= 40 && box.height >= 36, `${label} ${width}: ${box.id} is too small to be a touch target`);
    }

    await page.locator('#mobileSettingsButton').click();
    await page.waitForTimeout(200);
    assert.equal(await page.locator('#pauseMenu').isVisible(), true, `${label} ${width}: mobile settings did not open pause menu`);
    assert.equal(await page.locator('#pauseMenu [data-tab="settings"]').evaluate(el => el.classList.contains('active')), true, `${label} ${width}: settings tab was not selected`);

    await page.locator('#pauseMenu [data-tab="resume"]').click();
    await page.waitForTimeout(250);

    const keyboardEquivalent = await page.evaluate(() => {
      const scene = window.__relayRunnerScene;
      return {
        sceneReady: !!scene,
        keyboardReady: !!scene?.input?.keyboard,
      };
    });
    assert.equal(keyboardEquivalent.sceneReady, true, `${label} ${width}: RunnerScene is not exposed for input verification`);
    assert.equal(keyboardEquivalent.keyboardReady, true, `${label} ${width}: keyboard input is not ready`);

    const jump = page.locator('[data-mobile-action="jump"]');
    await jump.dispatchEvent('pointerdown', { pointerId: 9001, bubbles: true });
    await page.waitForTimeout(50);
    assert.equal(await jump.getAttribute('aria-pressed'), 'true', `${label} ${width}: touch jump did not enter pressed state`);
    await jump.dispatchEvent('pointerup', { pointerId: 9001, bubbles: true });
    await page.waitForTimeout(50);
    assert.equal(await jump.getAttribute('aria-pressed'), 'false', `${label} ${width}: touch jump did not release`);

    assert.equal(errors.length, 0, `${label} ${width}: browser errors: ${errors.join(' | ')}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

const server = spawn('node', ['server.js'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'pipe',
});

try {
  await waitForServer(BASE_URL);
  await runDesktop(chromium, 'Chromium');
  await runDesktop(webkit, 'WebKit');
  for (const width of MOBILE_WIDTHS) await runMobile(chromium, 'Chromium mobile', width);
  for (const width of [390]) await runMobile(webkit, 'WebKit mobile', width);
  console.log('P1 browser gate passed: desktop + mobile UI, pause/settings/resume, input ownership and zero browser errors.');
} finally {
  server.kill();
}
