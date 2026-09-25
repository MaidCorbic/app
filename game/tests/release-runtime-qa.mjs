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

async function waitForVisible(page, selector, timeout = 30000) {
  try {
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
  } catch (error) {
    const diagnostics = await page.evaluate(sel => {
      const intro = document.querySelector('#intro');
      const start = document.querySelector(sel);
      const style = start ? getComputedStyle(start) : null;
      return {
        readyState: document.readyState,
        startCount: document.querySelectorAll(sel).length,
        startDisplay: style?.display ?? null,
        startVisibility: style?.visibility ?? null,
        startOpacity: style?.opacity ?? null,
        startHidden: start?.hidden ?? null,
        startClass: start?.className ?? null,
        introBuilt: intro?.dataset?.homeV4Built ?? null,
        introClass: intro?.className ?? null,
        introHidden: intro?.hidden ?? null,
        gameBootReady: document.querySelector('#game')?.classList.contains('relay-boot-ready') ?? false,
        runtimeError: window.relayLastRuntimeError?.error ?? null,
      };
    }, selector);
    error.message = `${error.message} | waitForVisible diagnostics: ${JSON.stringify(diagnostics)}`;
    throw error;
  }
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

async function waitForGameplayBriefingRelease(page, timeout = 20000) {
  await page.waitForFunction(
    () => {
      const briefing = document.getElementById('relayGameplayIntroFinalV5');
      const play = document.getElementById('play');

      if (play?.classList.contains('relay-map-briefing-lock')) return false;
      if (!briefing) return true;

      const style = getComputedStyle(briefing);

      return (
        briefing.hidden ||
        style.display === 'none' ||
        style.visibility === 'hidden'
      );
    },
    undefined,
    { timeout },
  );
}

async function waitForHomeEntry(page, timeout = 30000) {
  try {
    return await page.waitForFunction(
      () => {
        const intro = document.getElementById('intro');
        const start = document.getElementById('start');

        const bridgeReady =
          typeof window.relayLaunchGameplay === 'function';

        if (start) {
          const introStyle = getComputedStyle(intro);
          const startStyle = getComputedStyle(start);

          const homeVisible =
            Boolean(intro) &&
            intro.dataset.homeV4Built === '1' &&
            !intro.hidden &&
            !intro.classList.contains('hidden') &&
            introStyle.display !== 'none' &&
            introStyle.visibility !== 'hidden' &&
            introStyle.opacity !== '0' &&
            startStyle.display !== 'none' &&
            startStyle.visibility !== 'hidden' &&
            startStyle.opacity !== '0';

          if (homeVisible) {
            return 'button';
          }
        }

        return bridgeReady ? 'bridge' : false;
      },
      undefined,
      { timeout },
    );
  } catch (error) {
    const diagnostics = await page.evaluate(() => {
      const intro = document.getElementById('intro');
      const start = document.getElementById('start');
      const introStyle = intro ? getComputedStyle(intro) : null;
      const startStyle = start ? getComputedStyle(start) : null;

      return {
        readyState: document.readyState,
        homeBuilt: intro?.dataset?.homeV4Built ?? null,
        introHidden: intro?.hidden ?? null,
        introClass: intro?.className ?? null,
        introDisplay: introStyle?.display ?? null,
        introVisibility: introStyle?.visibility ?? null,
        introOpacity: introStyle?.opacity ?? null,
        startExists: Boolean(start),
        startDisplay: startStyle?.display ?? null,
        startVisibility: startStyle?.visibility ?? null,
        startOpacity: startStyle?.opacity ?? null,
        launchBridgeReady:
          typeof window.relayLaunchGameplay === 'function',
        runtimeError: window.relayLastRuntimeError?.error ?? null,
      };
    });

    error.message =
      `${error.message} | waitForHomeEntry diagnostics: ${JSON.stringify(diagnostics)}`;
    throw error;
  }
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

async function clickDom(page, selector) {
  await page.evaluate(sel => {
    const element = document.querySelector(sel);
    if (!element) throw new Error(`Missing clickable element: ${sel}`);
    element.click();
  }, selector);
}

function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Release runtime QA timed out after ${timeoutMs}ms: ${label}`)),
      timeoutMs,
    );
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    if (viewport.orientation === 'portrait') {
      try {
        await page.waitForFunction(
          () => {
            const splash = document.querySelector('#relaySplash, .relay-splash');
            const intro = document.getElementById('intro');
            return Boolean(
              splash ||
              intro?.dataset?.homeV4Built === '1'
            );
          },
          undefined,
          { timeout: 10000 },
        );
      } catch (error) {
        const diagnostics = await page.evaluate(() => {
          const splash = document.querySelector('#relaySplash, .relay-splash');
          const intro = document.getElementById('intro');
          const game = document.getElementById('game');
          return {
            url: location.href,
            readyState: document.readyState,
            splashPresent: Boolean(splash),
            splashClass: splash?.className ?? null,
            splashDisplay: splash ? getComputedStyle(splash).display : null,
            introPresent: Boolean(intro),
            homeBuilt: intro?.dataset?.homeV4Built ?? null,
            introClass: intro?.className ?? null,
            gameBootReady: game?.classList.contains('relay-boot-ready') ?? false,
            scriptCount: document.scripts.length,
            relaySplashOwner: Boolean(window.__relaySplashV9),
            runtimeError: window.relayLastRuntimeError?.error ?? null,
            bodyChildren: Array.from(document.body.children).map(el => el.id || el.className || el.tagName).slice(0, 40),
          };
        });
        error.message = `${error.message} | startup diagnostics: ${JSON.stringify(diagnostics)}`;
        throw error;
      }

      const portraitLock = await page.evaluate(() => ({
        splashVisible: (() => {
          const el = document.querySelector('#relaySplash, .relay-splash');
          if (!el) return false;
          const style = getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        })(),
        splashPresent: Boolean(document.querySelector('#relaySplash, .relay-splash')),
        gameBootReady: document.getElementById('game')?.classList.contains('relay-boot-ready') ?? false,
        homeBuilt: document.getElementById('intro')?.dataset?.homeV4Built === '1',
        mobileControlsVisible: (() => {
          const el = document.querySelector('.mobile-controls');
          if (!el) return false;
          const style = getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        })(),
      }));

      assert.equal(
        portraitLock.splashPresent || portraitLock.homeBuilt,
        true,
        'Portrait startup must expose either the splash or the rendered home at ' + viewport.width + 'x' + viewport.height,
      );
      assert.equal(
        portraitLock.gameBootReady,
        false,
        'Game must remain locked before landscape at ' + viewport.width + 'x' + viewport.height,
      );
      assert.equal(
        portraitLock.mobileControlsVisible,
        false,
        'Mobile controls must remain hidden in portrait at ' + viewport.width + 'x' + viewport.height,
      );
      assert.equal(
        errors.length,
        0,
        'Browser errors at ' + viewport.width + 'x' + viewport.height + ': ' + errors.join(' | '),
      );
      return;
    }

    const entryMode = await withTimeout(
      waitForHomeEntry(page, 30000),
      35000,
      `${viewport.width}x${viewport.height} // home entry`,
    );

    if (entryMode === 'button') {
      await withTimeout(
        clickDom(page, '#start'),
        10000,
        `${viewport.width}x${viewport.height} // start click`,
      );
    } else {
      await withTimeout(
        page.evaluate(() => {
          if (typeof window.relayLaunchGameplay !== 'function') {
            throw new Error('Canonical gameplay launch bridge is unavailable');
          }

          window.relayLaunchGameplay();
        }),
        10000,
        `${viewport.width}x${viewport.height} // launch bridge`,
      );
    }

    try {
      await withTimeout(
        waitForHidden(page, '#intro'),
        20000,
        `${viewport.width}x${viewport.height} // hide home`,
      );
    } catch (error) {
      const diagnostics = await page.evaluate(() => {
        const intro = document.getElementById('intro');
        const starts = [...document.querySelectorAll('#start')];
        const start = starts[0] || null;
        return {
          introClass: intro?.className ?? null,
          introHidden: intro?.hidden ?? null,
          startCount: starts.length,
          startDisabled: start?.disabled ?? null,
          startConnected: start?.isConnected ?? null,
          startOwner: start?.parentElement?.className ?? null,
          launchBridge: typeof window.relayLaunchGameplay === 'function',
          deploymentLoader: Boolean(window.relayPlayDeploymentV1),
          deploymentActive: window.relayPlayDeploymentV1?.isActive?.() ?? null,
          bootReady: document.getElementById('game')?.classList.contains('relay-boot-ready') ?? false,
          runtimeError: window.relayLastRuntimeError?.error ?? null,
        };
      });
      error.message += ' | hide-home diagnostics: ' + JSON.stringify(diagnostics);
      throw error;
    }

    if (viewport.orientation === 'landscape') {
      await withTimeout(
        waitForGameplayBriefingRelease(page),
        25000,
        `${viewport.width}x${viewport.height} // briefing release`,
      );
      await withTimeout(
        waitForVisible(page, '.mobile-controls'),
        25000,
        `${viewport.width}x${viewport.height} // mobile controls`,
      );
      await withTimeout(
        waitForVisible(page, '#mobilePauseButton'),
        25000,
        `${viewport.width}x${viewport.height} // mobile pause`,
      );
    }

    const initial = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      pointerCoarse: matchMedia('(pointer:coarse)').matches,
      touchPoints: navigator.maxTouchPoints,
      touchControls: document.querySelectorAll('[data-mobile-action]').length,
      pauseVisible: !document.querySelector('#pauseMenu')?.classList.contains('hidden'),
      mobileControlsVisible: (() => {
        const el = document.querySelector('.mobile-controls');
        if (!el) return false;
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && rect.width > 0 && rect.height > 0;
      })(),
      briefingLock: document.querySelector('#play')?.classList.contains('relay-map-briefing-lock') || false,
    }));

    assert.equal(initial.touchControls, 6, `Expected exactly 6 mobile action buttons at ${viewport.width}x${viewport.height}`);
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

    assert.equal(initial.briefingLock, false, `Gameplay briefing lock remained active at ${viewport.width}x${viewport.height}`);
    console.log('LANDSCAPE: initial geometry', JSON.stringify({controls: await page.locator('.mobile-controls').boundingBox(), actions: await page.locator('.mobile-actions').boundingBox()}));
    assert.equal(initial.mobileControlsVisible, true, `Touch controls should be visible in landscape at ${viewport.width}x${viewport.height} | body=${await page.locator('body').getAttribute('class')} | controls=${JSON.stringify(await page.locator('.mobile-controls').boundingBox())} | actions=${JSON.stringify(await page.locator('.mobile-actions').boundingBox())} | play=${JSON.stringify(await page.locator('#play').boundingBox())} | display=${await page.locator('.mobile-controls').evaluate(el => getComputedStyle(el).display)} | visibility=${await page.locator('.mobile-controls').evaluate(el => getComputedStyle(el).visibility)}`);
    assert.equal(initial.pauseVisible, false, `Pause menu must start hidden at ${viewport.width}x${viewport.height}`);

    const controls = await page.evaluate(() => ({
      viewport: { width: window.innerWidth, height: window.innerHeight },
      buttons: Array.from(document.querySelectorAll('[data-mobile-action]')).map(button => {
        const r = button.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
      }),
    
    }));

    controls.buttons.forEach((rect, index) => {
      assert(rect.width > 0 && rect.height > 0, `Mobile action ${index + 1} has zero size at ${viewport.width}x${viewport.height}`);
      assert(rect.left >= -1 && rect.right <= controls.viewport.width + 1, `Mobile action ${index + 1} leaves viewport at ${viewport.width}x${viewport.height}`);
      assert(rect.bottom <= controls.viewport.height + 1, `Mobile action ${index + 1} falls below viewport at ${viewport.width}x${viewport.height}`);
    });
  const touchSurface = await page.evaluate(() => {
  const el = document.querySelector('#play');

  if (!el) {
    return null;
  }

  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);

  return {
    width: rect.width,
    height: rect.height,
    touchAction: style.touchAction,
    movementOwner: el.dataset.mobileMovementOwner || '',
  };
});

assert(
  touchSurface,
  `Missing gameplay touch surface at ${viewport.width}x${viewport.height}`,
);

assert(
  touchSurface.width > 0 &&
  touchSurface.height > 0,
  `Gameplay touch surface has zero size at ${viewport.width}x${viewport.height}`,
);

assert.equal(
  touchSurface.touchAction,
  'none',
  `Gameplay touch surface must use touch-action:none at ${viewport.width}x${viewport.height}`,
);

assert.equal(
  touchSurface.movementOwner,
  'touch-screen-v13',
  `Gameplay touch surface owner is incorrect at ${viewport.width}x${viewport.height}`,
);

assertNoPairwiseOverlap(
  controls.buttons,
  `Mobile action layout ${viewport.width}x${viewport.height}`,
);

    console.log('LANDSCAPE: touch surface + overlap checks passed');

    // On mobile, the canonical Pause control is #mobilePauseButton. This keeps the
    // runtime QA aligned with the actual mobile HUD ownership instead of the legacy #pause node.
    await clickDom(page, '#mobilePauseButton');
    await waitForVisible(page, '#pauseMenu');
    await waitForVisible(page, '[data-pause-tab="resume"]');
    await waitForVisible(page, '[data-pause-tab="settings"]');

    console.log('LANDSCAPE: pause menu opened');
    await clickDom(page, '[data-pause-tab="settings"]');

    await page.waitForFunction(
      () =>
        document.querySelector('.relay-cinematic-title')?.textContent?.trim() ===
        'OPTIONS',
      undefined,
      { timeout: 15000 },
    );
    console.log('LANDSCAPE: settings page reached');
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
    await clickDom(page, '[data-unified-setting]');
    const afterToggle = await firstToggle.getAttribute('aria-pressed');
    assert.notEqual(beforeToggle, afterToggle, `Settings toggle did not react at ${viewport.width}x${viewport.height}`);

    console.log('LANDSCAPE: settings toggle passed');
    await clickDom(page, '[data-pause-tab="resume"]');
    await waitForVisible(page, '[data-unified-resume]');
    await clickDom(page, '[data-unified-resume]');
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
    console.log('LANDSCAPE: about to close context');
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
    console.log(`Release runtime QA starting: ${viewport.width}x${viewport.height} ${viewport.orientation}`);
    await withTimeout(
      runMobileViewport(browser, viewport),
      90000,
      `${viewport.width}x${viewport.height} ${viewport.orientation}`,
    );
    console.log(`Release runtime QA passed: ${viewport.width}x${viewport.height} ${viewport.orientation}`);
  }
  console.log('Release runtime QA passed: portrait orientation lock + landscape gameplay/pause/settings/resume with zero browser errors.');
} finally {
  if (browser) await browser.close();
  server.kill();
}
