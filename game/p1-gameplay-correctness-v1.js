import { RunnerScene } from './src/scenes/RunnerScene.js';

// P1 GAMEPLAY CORRECTNESS V1
// Integrates existing gameplay systems without creating alternate owners.
// - Pause / Intel cards freeze the actual Phaser scene.
// - Dash breaks existing authored breaker objects.
// - Momentum Chain reads authoritative game events instead of raw button presses.
// - Mobile settings shortcut is optional/hidden; Pause remains the single visible menu entry.
(() => {
  'use strict';
  if (!RunnerScene?.prototype || window.__relayGameplayCorrectnessP1) return;
  window.__relayGameplayCorrectnessP1 = true;

  const locks = new WeakMap();
  const chainState = new WeakMap();
  const CHAIN_TIMEOUT = 1450;
  const DUPLICATE_WINDOW = 110;

  const getRunner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;

  const freeze = (scene, reason) => {
    if (!scene?.scene?.isActive?.()) return;
    let state = locks.get(scene);
    if (!state) {
      state = { reasons: new Set(), pausedByP1: false };
      locks.set(scene, state);
    }
    state.reasons.add(reason);
    if (!state.pausedByP1 && !scene.scene.isPaused()) {
      scene.scene.pause();
      state.pausedByP1 = true;
    }
    scene.__relayP1Frozen = true;
  };

  const thaw = (scene, reason) => {
    const state = locks.get(scene);
    if (!state) return;
    state.reasons.delete(reason);
    if (state.reasons.size === 0) {
      if (state.pausedByP1 && scene.scene?.isPaused?.()) scene.scene.resume();
      state.pausedByP1 = false;
      scene.__relayP1Frozen = false;
    }
  };

  const syncPause = () => {
    const scene = getRunner();
    const menu = document.getElementById('pauseMenu');
    if (!scene || !menu || !scene.scene?.isActive?.()) return;
    const open = !menu.classList.contains('hidden');
    if (open) freeze(scene, 'pause-menu');
    else thaw(scene, 'pause-menu');
  };

  const installPauseObserver = () => {
    const menu = document.getElementById('pauseMenu');
    if (!menu || window.__relayP1PauseObserver) return;
    window.__relayP1PauseObserver = true;
    const observer = new MutationObserver(syncPause);
    observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const scene = getRunner();
        if (scene && !menu.classList.contains('hidden')) freeze(scene, 'pause-menu');
      }
    });
    syncPause();
  };

  const patchIntel = () => {
    if (RunnerScene.prototype.__relayP1IntelPatched) return;
    const originalShow = RunnerScene.prototype.showEnemyDiscovery;
    const originalDismiss = RunnerScene.prototype.dismissEnemyDiscovery;
    if (typeof originalShow === 'function') {
      RunnerScene.prototype.showEnemyDiscovery = function (...args) {
        const result = originalShow.apply(this, args);
        if (this.__enemyDiscoveryActiveKey) freeze(this, 'enemy-intel');
        return result;
      };
    }
    if (typeof originalDismiss === 'function') {
      RunnerScene.prototype.dismissEnemyDiscovery = function (...args) {
        const result = originalDismiss.apply(this, args);
        thaw(this, 'enemy-intel');
        return result;
      };
    }
    const originalIntelDismiss = RunnerScene.prototype.dismissIntelCard;
    if (typeof originalIntelDismiss === 'function') {
      RunnerScene.prototype.dismissIntelCard = function (...args) {
        const result = originalIntelDismiss.apply(this, args);
        thaw(this, 'enemy-intel');
        return result;
      };
    }
    RunnerScene.prototype.__relayP1IntelPatched = true;
  };

  const breakOnDash = scene => {
    if (!scene?.player?.active || scene.finished || scene.respawning) return;
    const player = scene.player;
    const radius = 78;
    const visit = list => {
      for (const object of list || []) {
        if (!object?.active || object === player) continue;
        const id = String(object.getData?.('id') || '').toLowerCase();
        const feature = String(object.getData?.('feature') || '').toLowerCase();
        const explicit = object.getData?.('breakable') === true;
        if ((explicit || feature === 'breakable' || id.startsWith('breaker-')) && object.active) {
          const distance = Math.hypot((object.x || 0) - (player.x || 0), (object.y || 0) - (player.y || 0));
          if (distance <= radius && !object.getData?.('broken')) {
            object.setData?.('broken', true);
            object.disableBody?.(true, true);
            object.setVisible?.(false);
            scene.playerCue?.('ROUTE OPEN · BREAK', '#aee37f');
            scene.game?.events?.emit('breakable-destroyed', { id: id || feature || 'breakable', x: object.x, y: object.y });
            const burst = scene.add?.circle?.(object.x, object.y, 12, 0xffd06e, .28).setDepth?.(12);
            scene.tweens?.add?.({ targets: burst, scale: 3.4, alpha: 0, duration: 280, onComplete: () => burst?.destroy?.() });
          }
        }
        if (object.list?.length) visit(object.list);
      }
    };
    visit(scene.children?.list);
  };

  const installDashIntegration = () => {
    if (RunnerScene.prototype.__relayP1DashPatched) return;
    RunnerScene.prototype.__relayP1DashPatched = true;
    const originalCreate = RunnerScene.prototype.create;
    RunnerScene.prototype.create = function (...args) {
      const result = originalCreate.apply(this, args);
      const events = this.game?.events;
      const onDash = () => breakOnDash(this);
      events?.on?.('dash-start', onDash);
      this.events?.once?.('shutdown', () => events?.off?.('dash-start', onDash));
      return result;
    };
  };

  const mountChain = scene => {
    if (!scene?.game || scene.__relayP1MomentumBound) return;
    scene.__relayP1MomentumBound = true;
    const events = scene.game.events;
    const state = { chain: 0, peak: 0, last: '', lastAt: 0, lastDashAt: 0 };
    chainState.set(scene, state);

    if (!document.getElementById('relay-p1-momentum-style')) {
      const style = document.createElement('style');
      style.id = 'relay-p1-momentum-style';
      style.textContent = `
        .relay-p1-momentum{position:fixed;top:clamp(78px,9vh,108px);left:50%;z-index:940;transform:translate(-50%,-8px) scale(.94);opacity:0;pointer-events:none;text-align:center;color:#eafcff;text-shadow:0 0 20px rgba(25,200,245,.35);transition:opacity .16s ease,transform .18s ease;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
        .relay-p1-momentum.show{opacity:1;transform:translate(-50%,0) scale(1)}
        .relay-p1-momentum small{display:block;font-size:8px;letter-spacing:.28em;opacity:.65}.relay-p1-momentum b{display:block;margin-top:3px;font-size:31px;line-height:1;font-weight:900}.relay-p1-momentum em{font-style:normal;font-size:10px;letter-spacing:.14em;margin-left:4px}
        @media(max-width:520px){.relay-p1-momentum{top:86px}.relay-p1-momentum b{font-size:27px}}
      `;
      document.head.appendChild(style);
    }
    let ui = document.getElementById('relayP1Momentum');
    if (!ui) {
      ui = document.createElement('div');
      ui.id = 'relayP1Momentum';
      ui.className = 'relay-p1-momentum';
      ui.innerHTML = '<small>MOMENTUM CHAIN</small><b data-value>0<em>x FLOW</em></b>';
      document.body.appendChild(ui);
    }

    // The old V2 layer counted raw key/pointer actions. Hide only its presentation;
    // its optional micro-decision UI remains available, while P1 owns the authoritative chain display.
    document.querySelector('#relay-gameplay-new-layer .ng-chain')?.style.setProperty('display', 'none', 'important');

    const record = action => {
      if (!action || state.last === action && performance.now() - state.lastAt < DUPLICATE_WINDOW) return;
      const t = performance.now();
      if (t - state.lastAt > CHAIN_TIMEOUT) state.chain = 0;
      state.chain += 1;
      state.peak = Math.max(state.peak, state.chain);
      state.last = action;
      state.lastAt = t;
      ui.querySelector('[data-value]').innerHTML = `${state.chain}<em>x FLOW</em>`;
      ui.classList.toggle('show', state.chain > 0);
      if (state.chain >= 3) {
        window.clearTimeout(scene.__relayP1ChainHideTimer);
        scene.__relayP1ChainHideTimer = window.setTimeout(() => ui.classList.remove('show'), 1200);
      }
    };

    const onFeedback = kind => {
      const map = { jump:'jump', land:'land', slide:'slide', wallJump:'wallJump', vault:'vault', ledgeGrab:'ledgeGrab', dash:'dash' };
      const action = map[String(kind)];
      if (!action) return;
      if (action === 'dash') {
        state.lastDashAt = performance.now();
      }
      record(action);
    };
    const onDash = () => record('dash');
    const onSlideJump = () => record('slide-jump');
    const onFinish = () => { ui.classList.remove('show'); };
    events.on?.('feedback', onFeedback);
    events.on?.('dash-start', onDash);
    events.on?.('slide-jump', onSlideJump);
    events.on?.('game-over', onFinish);
    events.on?.('complete', onFinish);
    scene.events?.once?.('shutdown', () => {
      events.off?.('feedback', onFeedback);
      events.off?.('dash-start', onDash);
      events.off?.('slide-jump', onSlideJump);
      events.off?.('game-over', onFinish);
      events.off?.('complete', onFinish);
      ui.classList.remove('show');
    });
  };

  const installMobilePausePolish = () => {
    const style = document.createElement('style');
    style.id = 'relay-p1-pause-polish';
    style.textContent = `
      body.is-touch .mobile-bottom-hud .mobile-menu-settings{display:none!important}
      body.is-touch .mobile-bottom-hud{bottom:calc(max(18px,env(safe-area-inset-bottom,0px) + 14px) + 102px);z-index:1000}
      body.is-touch .mobile-bottom-hud .mobile-menu-button{width:62px;height:62px;border-radius:16px;border-color:rgba(141,244,255,.72);background:linear-gradient(145deg,rgba(8,28,48,.98),rgba(2,9,18,.99));box-shadow:0 0 26px rgba(25,200,245,.18),0 16px 34px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.1)}
      body.is-touch #pauseMenu .menu{width:min(92vw,560px);max-height:88dvh;overflow:hidden;border:1px solid rgba(141,244,255,.24);box-shadow:0 24px 80px rgba(0,0,0,.72),0 0 40px rgba(25,200,245,.10);backdrop-filter:blur(14px)}
      body.is-touch #pauseMenu #panelContent{max-height:62dvh;overflow-y:auto;-webkit-overflow-scrolling:touch}
      body.is-touch #pauseMenu .menu-grid{min-height:0}
      body.is-touch #pauseMenu{padding:max(12px,env(safe-area-inset-top,0px) + 8px) 12px max(12px,env(safe-area-inset-bottom,0px) + 8px)}
    `;
    document.head.appendChild(style);
  };

  const boot = () => {
    installPauseObserver();
    patchIntel();
    installDashIntegration();
    installMobilePausePolish();
    const bindExisting = () => {
      const scene = getRunner();
      if (scene) mountChain(scene);
      window.setTimeout(bindExisting, 250);
    };
    bindExisting();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
