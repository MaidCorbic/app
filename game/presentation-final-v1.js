import { RunnerScene } from './src/scenes/RunnerScene.js';

/* Final presentation-only cleanup. Gameplay state, progress and ability logic stay authoritative elsewhere. */
(() => {
  'use strict';
  if (window.__relayPresentationFinalV1) return;
  window.__relayPresentationFinalV1 = true;

  const viewport = scene => ({
    w: Number(scene?.scale?.gameSize?.width || scene?.scale?.width || window.innerWidth || 1280),
    h: Number(scene?.scale?.gameSize?.height || scene?.scale?.height || window.innerHeight || 720),
  });

  const hideLegacyBodySwapHud = scene => {
    const list = scene?.children?.list || [];
    for (const child of list) {
      if (child?.type !== 'Text' || typeof child.text !== 'string') continue;
      const text = child.text.trim().toUpperCase();
      if (/^(BODY SWAP|SWAP BODY|HOST BODY)(?:\s*[·•-]\s*B)?$/.test(text) || text.startsWith('BODY SWAP ·')) {
        child.setVisible(false);
        child.setAlpha?.(0);
        child.disableInteractive?.();
      }
    }
    const bodySwap = scene?.__relayGameplayExpansionV3Safe?.entities?.bodySwap;
    bodySwap?.badge?.setVisible?.(false);
  };

  const styleObjective = state => {
    if (!state) return;
    state.bg?.setStrokeStyle?.(1, 0xffd06e, 0.72);
    state.accent?.setFillStyle?.(0xffd06e, 0.95);
    state.track?.setFillStyle?.(0x17130b, 1);
    state.fill?.setFillStyle?.(0xffd06e, 1);
    state.kicker?.setColor?.('#ffd06e');
    state.label?.setColor?.('#a79772');
    state.progress?.setColor?.('#f4f7fa');
    state.status?.setColor?.('#c9a95f');
  };

  const layoutObjective = scene => {
    const state = scene?.__missionObjectiveState;
    if (!state?.c) return;
    const { w, h } = viewport(scene);
    const mobile = w <= 760;
    const baseW = 426;
    const targetW = mobile ? Math.min(270, Math.max(214, w - 28)) : Math.min(342, Math.max(292, w * 0.30));
    const scale = targetW / baseW;
    const x = Math.max(10, (w - targetW) / 2);
    const y = mobile ? Math.max(76, Math.min(102, h * 0.14)) : 88;
    const key = `${w}x${h}:${mobile}`;
    if (scene.__relayFinalObjectiveLayout === key) return;
    scene.__relayFinalObjectiveLayout = key;
    state.c.setPosition(x, y).setScale(scale);
    styleObjective(state);
  };

  const closeElement = element => {
    if (!element) return false;
    const button = element.querySelector?.('[data-close], .close, #closeTitlePanel, #closeAbilityUnlock, [data-relay-close]');
    if (button && typeof button.click === 'function') {
      button.click();
      return true;
    }
    element.classList.add('hidden');
    element.classList.remove('relay-update-mode');
    return true;
  };

  const closeTopOverlay = () => {
    const selectors = [
      '#abilityUnlock:not(.hidden)',
      '#levelUp:not(.hidden)',
      '#titlePanel:not(.hidden)',
      '#relayInfoPanel:not(.hidden)',
      '#pauseMenu:not(.hidden)'
    ];
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return closeElement(element);
    }
    return false;
  };

  const installDomHardening = () => {
    document.documentElement.dataset.relayFinalUi = '1';

    let icon = document.head.querySelector('link[data-relay-favicon]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      icon.type = 'image/x-icon';
      icon.href = '/favicon.ico';
      icon.dataset.relayFavicon = '1';
      document.head.appendChild(icon);
    }
    document.title = 'Relay Runner';

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (closeTopOverlay()) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, { capture:true });
  };

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function finalPresentationCreate(...args) {
    const result = originalCreate.apply(this, args);
    try {
      hideLegacyBodySwapHud(this);
      layoutObjective(this);
    } catch (error) {
      console.warn('[Relay Presentation] create cleanup skipped', error);
    }
    return result;
  };

  const originalUpdate = RunnerScene.prototype.update;
  RunnerScene.prototype.update = function finalPresentationUpdate(...args) {
    const result = originalUpdate.apply(this, args);
    try {
      layoutObjective(this);
    } catch {}
    return result;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installDomHardening, { once:true });
  else installDomHardening();
})();
