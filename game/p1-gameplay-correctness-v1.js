import { RunnerScene } from './src/scenes/RunnerScene.js';

// P1 gameplay correctness: authoritative gameplay integrations without frame-driven HUD polling.
// Existing keyboard/mobile controls remain unchanged.
(() => {
  'use strict';
  if (!RunnerScene?.prototype || window.__relayGameplayCorrectnessP1V2) return;
  window.__relayGameplayCorrectnessP1V2 = true;
  const locks = new WeakMap();
  const CHAIN_TIMEOUT = 1450;
  const DUPLICATE_WINDOW = 110;
  const DASH_BREAK_RADIUS = 96;
  const getRunner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const freeze = (scene, reason) => {
    if (!scene?.scene?.isActive?.()) return;
    let state = locks.get(scene);
    if (!state) { state = { reasons: new Set(), pausedByP1: false }; locks.set(scene, state); }
    state.reasons.add(reason);
    if (!state.pausedByP1 && !scene.scene.isPaused()) { scene.scene.pause(); state.pausedByP1 = true; }
    scene.__relayP1Frozen = true;
  };
  const thaw = (scene, reason) => {
    const state = locks.get(scene); if (!state) return;
    state.reasons.delete(reason);
    if (!state.reasons.size) {
      if (state.pausedByP1 && scene.scene?.isPaused?.()) scene.scene.resume();
      state.pausedByP1 = false;
      scene.__relayP1Frozen = false;
    }
  };
  const syncPause = () => {
    const scene = getRunner();
    const menu = document.getElementById('pauseMenu');
    if (!scene || !menu || !scene.scene?.isActive?.()) return;
    menu.classList.contains('hidden') ? thaw(scene, 'pause-menu') : freeze(scene, 'pause-menu');
  };
  const installPauseObserver = () => {
    const menu = document.getElementById('pauseMenu');
    if (!menu || window.__relayP1PauseObserverV2) return;
    window.__relayP1PauseObserverV2 = true;
    const observer = new MutationObserver(syncPause);
    observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', () => { if (document.hidden) syncPause(); }, { passive: true });
    syncPause();
  };
  const patchIntel = () => {
    if (RunnerScene.prototype.__relayP1IntelPatchedV2) return;
    const show = RunnerScene.prototype.showEnemyDiscovery;
    const dismiss = RunnerScene.prototype.dismissEnemyDiscovery;
    const intelDismiss = RunnerScene.prototype.dismissIntelCard;
    if (typeof show === 'function') RunnerScene.prototype.showEnemyDiscovery = function (...args) { const result = show.apply(this, args); if (this.__enemyDiscoveryActiveKey) freeze(this, 'enemy-intel'); return result; };
    if (typeof dismiss === 'function') RunnerScene.prototype.dismissEnemyDiscovery = function (...args) { const result = dismiss.apply(this, args); thaw(this, 'enemy-intel'); return result; };
    if (typeof intelDismiss === 'function') RunnerScene.prototype.dismissIntelCard = function (...args) { const result = intelDismiss.apply(this, args); thaw(this, 'enemy-intel'); return result; };
    RunnerScene.prototype.__relayP1IntelPatchedV2 = true;
  };
  const breakerMatches = object => {
    if (!object?.active) return false;
    const id = String(object.getData?.('id') || '').toLowerCase();
    const feature = String(object.getData?.('feature') || '').toLowerCase();
    return object.getData?.('breakable') === true || feature === 'breakable' || feature.includes('breaker') || id.startsWith('breaker-') || id.includes('breakable');
  };
  const breakOnDash = scene => {
    if (!scene?.player?.active || scene.finished || scene.respawning) return;
    const player = scene.player;
    for (const object of scene.children?.list || []) {
      if (!object?.active || object === player || !breakerMatches(object)) continue;
      const distance = Math.hypot((object.x || 0) - player.x, (object.y || 0) - player.y);
      if (distance > DASH_BREAK_RADIUS || object.getData?.('broken')) continue;
      object.setData?.('broken', true);
      object.disableBody?.(true, true);
      object.setVisible?.(false);
      scene.playerCue?.('ROUTE OPEN · BREAK', '#aee37f');
      scene.game?.events?.emit?.('breakable-destroyed', { id: String(object.getData?.('id') || object.getData?.('feature') || 'breakable'), x: object.x, y: object.y });
      const burst = scene.add?.circle?.(object.x, object.y, 12, 0xffd06e, .28).setDepth?.(12);
      if (burst) scene.tweens?.add?.({ targets: burst, scale: 3.4, alpha: 0, duration: 280, onComplete: () => burst.destroy() });
    }
  };
  const installDashIntegration = () => {
    if (RunnerScene.prototype.__relayP1DashPatchedV2) return;
    const originalCreate = RunnerScene.prototype.create;
    RunnerScene.prototype.create = function (...args) {
      const result = originalCreate.apply(this, args);
      const events = this.game?.events;
      const onDashStart = () => { this.__relayP1DashActive = true; breakOnDash(this); };
      const onDashEnd = () => { this.__relayP1DashActive = false; };
      events?.on?.('dash-start', onDashStart);
      events?.on?.('dash-end', onDashEnd);
      this.events?.once?.('shutdown', () => { events?.off?.('dash-start', onDashStart); events?.off?.('dash-end', onDashEnd); });
      return result;
    };
    RunnerScene.prototype.__relayP1DashPatchedV2 = true;
  };
  const installGameplayChain = () => {
    if (window.__relayP1ChainEventsV2) return;
    window.__relayP1ChainEventsV2 = true;
    const state = new WeakMap();
    const getState = scene => { let s = state.get(scene); if (!s) { s = { chain: 0, last: '', lastAt: 0 }; state.set(scene, s); } return s; };
    const bind = scene => {
      if (!scene?.game || scene.__relayP1ChainBoundV2) return;
      scene.__relayP1ChainBoundV2 = true;
      const s = getState(scene);
      const onFeedback = kind => {
        if (!kind) return;
        const t = performance.now();
        if (t - s.lastAt > CHAIN_TIMEOUT) s.chain = 0;
        if (String(kind) !== s.last || t - s.lastAt >= DUPLICATE_WINDOW) s.chain += 1;
        s.last = String(kind); s.lastAt = t;
        scene.game.events.emit('relay:gameplay:momentum', { chain: s.chain, action: s.last });
      };
      const onDash = () => { s.chain += 1; s.last = 'dash'; s.lastAt = performance.now(); };
      scene.game.events.on('feedback', onFeedback);
      scene.game.events.on('dash-start', onDash);
      scene.events.once('shutdown', () => { scene.game.events.off('feedback', onFeedback); scene.game.events.off('dash-start', onDash); });
    };
    const boot = () => bind(getRunner());
    boot(); window.setTimeout(boot, 250); window.setTimeout(boot, 750);
  };
  const boot = () => { installPauseObserver(); patchIntel(); installDashIntegration(); installGameplayChain(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
