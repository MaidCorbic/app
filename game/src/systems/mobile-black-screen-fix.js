// Mobile black-screen recovery for the existing Relay Runner scene lifecycle.
import { RunnerScene } from '../scenes/RunnerScene.js';

if (!window.__relayMobileBlackScreenFix) {
  window.__relayMobileBlackScreenFix = true;
  const isTouch = () => window.matchMedia?.('(pointer: coarse)').matches || Number(navigator.maxTouchPoints || 0) > 0 || /Android|iPhone|iPad|iPod|Mobile|Windows Phone|Silk|Kindle/i.test(navigator.userAgent || '');

  // The boot flow creates mission 01 paused underneath the title screen.
  // Stop that hidden instance before the title button's existing handler runs;
  // main.js will then take its normal launch(0) path and create a fresh run.
  document.addEventListener('click', event => {
    const start = event.target.closest?.('#start');
    if (!start) return;
    const runner = window.__relayRunnerScene;
    if (!runner?.scene?.isPaused?.()) return;
    try { runner.scene.stop(); } catch (error) { console.warn('[Relay Runner] Mobile boot scene stop failed', error); }
  }, true);

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function mobileSafeCreate(...args) {
    const result = originalCreate.apply(this, args);
    if (isTouch()) {
      const width = Math.max(1, this.scale.width);
      const height = Math.max(720, this.scale.height);
      this.__mobileWorldSurface = this.add.rectangle(width / 2, height / 2, width, height, 0x07101e, 1).setScrollFactor(0).setDepth(-1000);
      this.cameras.main.setBounds(0, 0, this.worldWidth, height);
      this.cameras.main.setBackgroundColor('#07101e');
    }
    return result;
  };

  window.addEventListener('resize', () => {
    const scene = window.__relayRunnerScene;
    if (!isTouch() || !scene?.scene?.isActive?.() || !scene.cameras?.main) return;
    const width = Math.max(1, scene.scale.width);
    const height = Math.max(720, scene.scale.height);
    scene.__mobileWorldSurface?.setPosition(width / 2, height / 2).setSize(width, height);
    scene.cameras.main.setBounds(0, 0, scene.worldWidth || 6280, height);
  }, { passive: true });
}
