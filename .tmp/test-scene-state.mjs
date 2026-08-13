import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', err => console.log('[pageerror]', err.message));

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.click('#start');
await page.waitForTimeout(2000);

const info = await page.evaluate(() => {
  const scene = window.game?.scene?.getScene('runner');
  if (!scene) return { error: 'no scene found on window.game' };
  return {
    sceneActive: scene.scene.isActive(),
    sceneVisible: scene.scene.isVisible(),
    hasPlayer: !!scene.player,
    playerX: scene.player?.x, playerY: scene.player?.y,
    playerVisible: scene.player?.visible,
    cameraScrollX: scene.cameras?.main?.scrollX,
    cameraScrollY: scene.cameras?.main?.scrollY,
    platformsCount: scene.platforms?.getLength?.() ?? scene.platforms?.children?.entries?.length,
    childrenCount: scene.children?.length,
    physicsWorldExists: !!scene.physics?.world,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
