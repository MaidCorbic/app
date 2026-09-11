import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium, devices } from 'playwright';

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}/`;
const MOBILE_VIEWPORTS = [
  { width: 320, height: 800, orientation: 'portrait' },
  { width: 360, height: 800, orientation: 'portrait' },
  { width: 390, height: 844, orientation: 'portrait' },
  { width: 430, height: 932, orientation: 'portrait' },
  // Keep landscape smoke widths inside the project's <=760px mobile CSS breakpoint.
  // The short side still exercises the 320/360/390/430px mobile-height targets.
  { width: 720, height: 320, orientation: 'landscape' },
  { width: 720, height: 360, orientation: 'landscape' },
  { width: 720, height: 390, orientation: 'landscape' },
  { width: 760, height: 430, orientation: 'landscape' },
];

function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      fetch(url).then(() => resolve()).catch(() => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Server did not start in time: ${url}`));
          return;
        }
        setTimeout(attempt, 200);
      });
    };
    attempt();
  });
}

async function waitForVisible(page, selector, timeout = 15000) {
  await page.waitForFunction(
    sel => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const style = getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && !el.classList.contains('hidden');
    },
    selector,
    { timeout },
  );
}

async function waitForHidden(page, selector, timeout = 15000) {
  await page.waitForFunction(
    sel => {
      const el = document.querySelector(sel);
      return !el || el.classList.contains('hidden');
    },
    selector,
    { timeout },
  );
}

function assertNoPairwiseOverlap(rects, label) {
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i];
      const b = rects[j];
      const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      assert(
        overlapWidth <= 1 || overlapHeight <= 1,
        `${label}: controls ${i + 1} and ${j + 1} overlap (${Math.round(overlapWidth)}x${Math.round(overlapHeight)})`,
      );
    }
  }
}

async function runMobileViewport(browser, viewport) {
  const device = devices['Pixel 5'];
  const context = await browser.newContext({
    ...device,
    viewport: { width: viewport.width, height: viewport.height },
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
    await waitForVisible(page, '#start');
    await page.locator('#start').click();
    await waitForHidden(page, '#intro');

    const initial = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      pointerCoarse: matchMedia('(pointer:coarse)').matches,
      hoverNone: matchMedia('(hover:none)').matches,
      touchPoints: navigator.maxTouchPoints,
      touchControls: document.querySelectorAll('[data-mobile-action]').length,
      joystickCount: document.querySelectorAll('[data-mobile-joystick]').length,
      pauseVisible: !document.querySelector('#pauseMenu')?.classList.contains('hidden'),
      mobileControlsVisible: (() => {
        const el = document.querySelector('.mobile-controls');
        if (!el) return false;
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && rect.width > 0 && rect.height > 0;
      })(),
    }));

    assert.equal(initial.touchControls, 6, `Expected exactly 6 mobile action buttons at ${viewport.width}x${viewport.height}`);
    assert.equal(initial.joystickCount, 1, `Expected exactly 1 movement joystick at ${viewport.width}x${viewport.height}`);
    assert.equal(initial.pointerCoarse, true, `Release QA requires a coarse primary pointer at ${viewport.width}x${viewport.height}`);
    assert(initial.touchPoints > 0, `Release QA requires touch points at ${viewport.width}x${viewport.height}`);
    assert(
      initial.scrollWidth <= initial.innerWidth + 1,
      `Horizontal overflow detected at ${viewport.width}x${viewport.height}: ${initial.scrollWidth}px > ${initial.innerWidth}px`,
    );

    if (viewport.orientation === 'portrait') {
      assert.equal(initial.mobileControlsVisible, false, `Touch controls should be locked in portrait at ${viewport.width}x${viewport.height}`);
      assert.equal(initial.pauseVisible, false, `Pause HUD should remain inaccessible while portrait lock is active at ${viewport.width}x${viewport.height}`);
      assert.equal(errors.length, 0, `Browser errors at ${viewport.width}x${viewport.height}: ${errors.join(' | ')}`);
      return;
    }

    assert.equal(initial.mobileControlsVisible, true, `Touch controls should be visible in landscape at ${viewport.width}x${viewport.height}`);
    assert.equal(initial.pauseVisible, false, `Pause menu must start hidden at ${viewport.width}x${viewport.height}`);

    const controls = await page.evaluate(() => ({
      viewport: { width: window.innerWidth, height: window.innerHeight },
      buttons: Array.from(document.querySelectorAll('[data-mobile-action]')).map(button => {
        const r = button.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
      }),
      joystick: (() => {
        const r = document.querySelector('[data-mobile-joystick]')?.getBoundingClientRect();
        return r ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height } : null;
      })(),
    }));

    controls.buttons.forEach((rect, index) => {
      assert(rect.width > 0 && rect.height > 0, `Mobile action ${index + 1} has zero size at ${viewport.width}x${viewport.height}`);
      assert(rect.left >= -1 && rect.right <= controls.viewport.width + 1, `Mobile action ${index + 1} leaves viewport at ${viewport.width}x${viewport.height}`);
      assert(rect.bottom <= controls.viewport.height + 1, `Mobile action ${index + 1} falls below viewport at ${viewport.width}x${viewport.height}`);
    });
    assert(controls.joystick, `Missing movement joystick at ${viewport.width}x${viewport.height}`);
    assertNoPairwiseOverlap(controls.buttons, `Mobile action layout ${viewport.width}x${viewport.height}`);

    await page.locator('#pause').click();
    await waitForVisible(page, '#pauseMenu');
    await waitForVisible(page, '[data-pause-tab="resume"]');
    await waitForVisible(page, '[data-pause-tab="settings"]');

    await page.locator('[data-pause-tab="settings"]').click();
    await page.waitForFunction(() => document.querySelector('.relay-cinematic-title')?.textContent?.trim() === 'OPTIONS');
    const settings = await page.evaluate(() => ({
      title: document.querySelector('.relay-cinematic-title')?.textContent?.trim() || '',
      toggleCount: document.querySelectorAll('[data-unified-setting]').length,
      bodyOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    assert.equal(settings.title, 'OPTIONS', `Settings panel failed to render at ${viewport.width}x${viewport.height}`);
    assert(settings.toggleCount >= 4, `Settings panel is incomplete at ${viewport.width}x${viewport.height}`);
    assert.equal(settings.bodyOverflow, false, `Settings created horizontal overflow at ${viewport.width}x${viewport.height}`);

    const firstToggle = page.locator('[data-unified-setting]').first();
    const beforeToggle = await firstToggle.getAttribute('aria-pressed');
    await firstToggle.click();
    const afterToggle = await firstToggle.getAttribute('aria-pressed');
    assert.notEqual(beforeToggle, afterToggle, `Settings toggle did not react at ${viewport.width}x${viewport.height}`);

    await page.locator('[data-pause-tab="resume"]').click();
    await waitForVisible(page, '[data-unified-resume]');
    await page.locator('[data-unified-resume]').click();
    await waitForHidden(page, '#pauseMenu');

    const resumed = await page.evaluate(() => ({
      introHidden: document.querySelector('#intro')?.classList.contains('hidden'),
      pauseHidden: document.querySelector('#pauseMenu')?.classList.contains('hidden'),
      runnerActive: Boolean(window.__relayRunnerScene?.scene?.isActive?.()),
    }));
    assert.equal(resumed.introHidden, true, `Intro reappeared after resume at ${viewport.width}x${viewport.height}`);
    assert.equal(resumed.pauseHidden, true, `Pause menu remained open after resume at ${viewport.width}x${viewport.height}`);
    assert.equal(resumed.runnerActive, true, `Runner scene is not active after resume at ${viewport.width}x${viewport.height}`);
    assert.equal(errors.length, 0, `Browser errors at ${viewport.width}x${viewport.height}: ${errors.join(' | ')}`);
  } finally {
    await context.close();
  }
}

const server = spawn('node', ['server.js'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'pipe',
});

let browser;
try {
  await waitForServer(BASE_URL);
  browser = await chromium.launch();
  for (const viewport of MOBILE_VIEWPORTS) {
    await runMobileViewport(browser, viewport);
    console.log(`Release runtime QA passed: ${viewport.width}x${viewport.height} ${viewport.orientation}`);
  }
  console.log('Release runtime QA passed: portrait orientation lock + landscape gameplay/pause/settings/resume across release viewports with zero browser errors.');
} finally {
  if (browser) await browser.close();
  server.kill();
}
