import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', msg => {
  console.log(`[console:${msg.type()}]`, msg.text());
});
page.on('pageerror', err => {
  errors.push(err);
  console.log('[pageerror]', err.message, err.stack);
});
page.on('requestfailed', req => {
  console.log('[requestfailed]', req.url(), req.failure()?.errorText);
});

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: '/app/.tmp/01-intro.png' });

const startBtn = await page.$('#start');
console.log('start button found:', !!startBtn);
await startBtn.click();
await page.waitForTimeout(2500);
await page.screenshot({ path: '/app/.tmp/02-after-play.png' });

// Check canvas presence and size
const canvasInfo = await page.evaluate(() => {
  const canvas = document.querySelector('#phaser-game canvas');
  const play = document.querySelector('#play');
  const intro = document.querySelector('#intro');
  return {
    canvasExists: !!canvas,
    canvasWidth: canvas?.width,
    canvasHeight: canvas?.height,
    canvasClientRect: canvas?.getBoundingClientRect(),
    playHidden: play?.classList.contains('hidden'),
    introHidden: intro?.classList.contains('hidden'),
    strideReady: window.strideReady,
    bodyBg: getComputedStyle(document.body).backgroundColor,
  };
});
console.log('canvasInfo:', JSON.stringify(canvasInfo, null, 2));

await page.waitForTimeout(2000);
await page.screenshot({ path: '/app/.tmp/03-after-wait.png' });

console.log('Total page errors:', errors.length);
await browser.close();
