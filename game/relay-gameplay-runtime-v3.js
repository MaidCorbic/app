import { RunnerScene } from './src/scenes/RunnerScene.js';

/* Relay Gameplay Runtime V3
 * Presentation/runtime hardening only.
 * Keeps existing gameplay state, controls, progression and audio systems authoritative.
 */
(() => {
  'use strict';
  if (window.__relayGameplayRuntimeV3) return;
  window.__relayGameplayRuntimeV3 = true;

  const $ = id => document.getElementById(id);
  const q = selector => document.querySelector(selector);
  const nativeClick = selector => {
    const node = q(selector);
    if (!node || typeof HTMLElement === 'undefined') return false;
    try { HTMLElement.prototype.click.call(node); return true; } catch { return false; }
  };

  const state = {
    playBusy: false,
    playFallbackTimer: 0,
    homeObserver: null,
    domObserver: null,
    scene: null,
    sceneTimer: 0,
  };

  const css = `
    /* HOME: one stable, reusable interaction layer. */
    #intro.home-v3 .info-launcher{display:none!important;visibility:hidden!important;pointer-events:none!important}
    #intro.home-v3 .home-v3-side{display:grid!important;grid-template-columns:1fr!important;gap:9px!important;width:min(420px,100%)!important}
    #intro.home-v3 .relay-v3-nav{position:relative!important;isolation:isolate!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important;width:100%!important;min-height:56px!important;padding:13px 15px!important;border:1px solid rgba(255,208,110,.24)!important;border-left:2px solid rgba(255,208,110,.74)!important;border-radius:11px!important;background:linear-gradient(145deg,rgba(7,10,15,.97),rgba(2,3,5,.985))!important;color:#f4f7fa!important;box-shadow:inset 0 1px rgba(255,255,255,.05),0 14px 30px rgba(0,0,0,.28),0 0 24px rgba(255,208,110,.035)!important;cursor:pointer!important;touch-action:manipulation!important;user-select:none!important;-webkit-user-select:none!important}
    #intro.home-v3 .relay-v3-nav:hover,#intro.home-v3 .relay-v3-nav:focus-visible{transform:translateY(-1px)!important;border-color:rgba(255,208,110,.66)!important;box-shadow:inset 0 1px rgba(255,255,255,.07),0 18px 38px rgba(0,0,0,.34),0 0 28px rgba(255,208,110,.11)!important;outline:none!important}
    #intro.home-v3 .relay-v3-nav:active{transform:translateY(0)!important}
    #intro.home-v3 .relay-v3-nav span{font:950 11px/1 'DM Mono',ui-monospace,monospace!important;letter-spacing:1.25px!important;color:#f4f7fa!important}
    #intro.home-v3 .relay-v3-nav small{font:750 7px/1.3 'DM Mono',ui-monospace,monospace!important;letter-spacing:.9px!important;color:#84909d!important;text-align:right!important}
    #intro.home-v3 .relay-v3-nav[data-v3-final='faq']{border-left-color:#fff0b5!important}
    #intro.home-v3 .relay-v3-nav[data-v3-final='update']{border-left-color:#ffd06e!important}
    #intro.home-v3 .relay-v3-nav[data-v3-final='options']{border-left-color:#ffe7a6!important}
    #intro.home-v3 .relay-v3-nav[data-v3-final='exit']{border-left-color:#b47a1e!important}

    /* GAMEPLAY HUD: no center collision between Flow/Signals and the world. */
    #play .hud{
      position:absolute!important;top:10px!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;
      width:min(1180px,calc(100vw - 24px))!important;max-width:none!important;padding:0!important;margin:0!important;
      display:grid!important;grid-template-columns:minmax(230px,1fr) minmax(190px,250px) auto!important;gap:10px!important;
      align-items:start!important;z-index:300!important;pointer-events:none!important
    }
    #play .hud>*{pointer-events:auto!important;min-width:0!important}
    #play .hud-route,#play .hud-progress,#play .hud-xp,#play .hud-actions>button{
      box-sizing:border-box!important;border:1px solid rgba(255,208,110,.25)!important;
      background:linear-gradient(145deg,rgba(7,10,15,.96),rgba(2,3,5,.985))!important;
      box-shadow:inset 0 1px rgba(255,255,255,.05),0 14px 34px rgba(0,0,0,.28),0 0 24px rgba(255,208,110,.035)!important;
      backdrop-filter:blur(7px)!important
    }
    #play .hud-route{min-height:49px!important;padding:8px 12px!important;border-radius:12px!important;display:flex!important;align-items:center!important;gap:9px!important}
    #play .hud-route small{color:#ffd06e!important;font:900 7px/1 'DM Mono',monospace!important;letter-spacing:1.25px!important}
    #play .hud-route b{color:#f4f7fa!important;font:950 11px/1.1 'DM Mono',monospace!important;letter-spacing:.45px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    #play .hud-progress{min-height:49px!important;padding:8px 10px!important;border-radius:12px!important;display:grid!important;grid-template-columns:auto 1fr!important;grid-template-rows:auto 5px!important;grid-template-areas:'count label' 'bar bar'!important;align-items:center!important;column-gap:8px!important}
    #play .hud-progress>span{grid-area:count!important;color:#fff3bf!important;font:950 13px/1 'DM Mono',monospace!important;min-width:30px!important;text-align:left!important}
    #play .hud-progress>small{grid-area:label!important;justify-self:end!important;color:#ffd06e!important;font:900 7px/1 'DM Mono',monospace!important;letter-spacing:1px!important}
    #play .hud-progress>div{grid-area:bar!important;width:100%!important;height:5px!important;background:rgba(255,255,255,.05)!important;border:1px solid rgba(255,208,110,.14)!important;border-radius:99px!important;overflow:hidden!important}
    #play .hud-progress i{display:block!important;height:100%!important;border-radius:99px!important;background:linear-gradient(90deg,#b47a1e,#ffd06e,#fff0b5)!important;box-shadow:0 0 12px rgba(255,208,110,.32)!important}
    #play .hud-actions{display:flex!important;justify-content:flex-end!important;align-items:stretch!important;gap:7px!important}
    #play .hud-xp{min-width:82px!important;min-height:49px!important;padding:7px 10px!important;border-radius:12px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important}
    #play .hud-xp small{color:#89949f!important;font:900 7px/1 'DM Mono',monospace!important;letter-spacing:1px!important;text-align:center!important}
    #play .hud-xp b{margin-top:5px!important;color:#ffe7a6!important;font:950 14px/1 'DM Mono',monospace!important;letter-spacing:.4px!important;text-align:center!important}
    #play #pause{width:49px!important;min-width:49px!important;height:49px!important;padding:0!important;border-radius:12px!important;color:#ffe7a6!important;border-color:rgba(255,208,110,.46)!important;font:900 19px/1 'DM Mono',monospace!important;display:grid!important;place-items:center!important;cursor:pointer!important;touch-action:manipulation!important}

    /* Mission objective: keep it away from the bottom-right play space and match map palette. */
    #play .world-marker{left:14px!important;right:auto!important;bottom:76px!important;top:auto!important;transform:none!important;width:min(300px,36vw)!important;max-width:300px!important;padding:8px 11px!important;border:1px solid rgba(255,208,110,.24)!important;border-left:2px solid #ffd06e!important;border-radius:11px!important;background:linear-gradient(145deg,rgba(7,10,15,.95),rgba(2,3,5,.92))!important;box-shadow:0 14px 32px rgba(0,0,0,.30),0 0 24px rgba(255,208,110,.035)!important;text-align:left!important;z-index:290!important}
    #play .world-marker span{color:#ffd06e!important;font:900 6px/1 'DM Mono',monospace!important;letter-spacing:1.45px!important}
    #play .world-marker b{display:block!important;margin-top:4px!important;color:#f4f7fa!important;font:900 9px/1.15 'DM Mono',monospace!important;letter-spacing:.5px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}

    /* Cargo: replace old cyan bar treatment with the same gameplay/map language. */
    #cargoIntegrityV2{left:14px!important;top:auto!important;right:auto!important;bottom:14px!important;transform:none!important;width:min(292px,34vw)!important;z-index:295!important;font-family:'DM Mono',ui-monospace,monospace!important;filter:drop-shadow(0 12px 28px rgba(0,0,0,.32))!important}
    #cargoIntegrityV2 .cargo-card{border:1px solid rgba(255,208,110,.24)!important;border-left:2px solid rgba(255,208,110,.65)!important;border-radius:11px!important;background:linear-gradient(145deg,rgba(7,10,15,.95),rgba(2,3,5,.94))!important;box-shadow:inset 0 1px rgba(255,255,255,.05),0 12px 30px rgba(0,0,0,.28),0 0 20px rgba(255,208,110,.035)!important;padding:8px 10px!important}
    #cargoIntegrityV2 .cargo-head{margin-bottom:6px!important}
    #cargoIntegrityV2 .cargo-label{font-size:7px!important;letter-spacing:1.25px!important;color:#ffd06e!important;opacity:1!important}
    #cargoIntegrityV2 .cargo-type{font-size:8px!important;letter-spacing:1px!important;color:#ffe7a6!important}
    #cargoIntegrityV2 .cargo-row{gap:8px!important}
    #cargoIntegrityV2 .cargo-track{height:6px!important;border:1px solid rgba(255,208,110,.16)!important;background:rgba(255,255,255,.045)!important;border-radius:99px!important;box-shadow:inset 0 0 7px rgba(0,0,0,.5)!important}
    #cargoIntegrityV2 .cargo-fill{background:linear-gradient(90deg,#b47a1e,#ffd06e,#fff0b5)!important;box-shadow:0 0 12px rgba(255,208,110,.27)!important}
    #cargoIntegrityV2 .cargo-value{min-width:38px!important;font-size:11px!important;color:#f4f7fa!important}
    #cargoIntegrityV2 .cargo-foot{margin-top:6px!important;font-size:6.5px!important;color:#88939e!important}
    #cargoIntegrityV2 .cargo-foot b{color:#ffd06e!important}

    /* Entirely suppress Mission Intelligence presentation in gameplay. */
    #relayGameplayIntel,.relay-gameplay-intel{display:none!important;visibility:hidden!important;pointer-events:none!important}
    [data-relay-mission-intelligence],[data-mission-intelligence]{display:none!important;visibility:hidden!important;pointer-events:none!important}
    
    @media(max-width:900px){
      #play .hud{width:calc(100vw - 14px)!important;grid-template-columns:minmax(0,1fr) minmax(150px,200px) auto!important;gap:6px!important}
      #play .world-marker{width:min(260px,42vw)!important;bottom:78px!important}
      #cargoIntegrityV2{width:min(250px,40vw)!important}
    }
    @media(max-width:760px){
      #play .hud{top:7px!important;width:calc(100vw - 10px)!important;grid-template-columns:minmax(0,1fr) minmax(112px,132px) auto!important;gap:5px!important}
      #play .hud-route{min-height:43px!important;padding:6px 8px!important}
      #play .hud-route small{font-size:6px!important}
      #play .hud-route b{font-size:8px!important}
      #play .hud-progress{min-height:43px!important;padding:6px 7px!important}
      #play .hud-progress>span{font-size:11px!important}
      #play .hud-progress>small{font-size:6px!important}
      #play .hud-xp{min-width:61px!important;min-height:43px!important;padding:6px 7px!important}
      #play .hud-xp small{font-size:6px!important}
      #play .hud-xp b{font-size:11px!important;margin-top:4px!important}
      #play #pause{width:42px!important;min-width:42px!important;height:43px!important;font-size:17px!important;border-radius:10px!important}
      #play .world-marker{left:8px!important;bottom:86px!important;width:min(220px,48vw)!important;padding:6px 8px!important}
      #cargoIntegrityV2{left:8px!important;bottom:12px!important;width:min(230px,54vw)!important}
      #cargoIntegrityV2 .cargo-card{padding:7px 8px!important}
    }
    @media(max-width:520px){
      #play .hud{grid-template-columns:minmax(0,1fr) 98px auto!important}
      #play .hud-progress{min-width:0!important}
      #play .hud-xp{min-width:55px!important;width:55px!important}
      #play .world-marker{width:min(205px,52vw)!important}
      #cargoIntegrityV2{width:min(215px,56vw)!important}
    }
    @media(orientation:landscape) and (max-height:560px){#play .hud{top:6px!important}.world-marker{bottom:70px!important}#cargoIntegrityV2{bottom:9px!important}}
    @media(prefers-reduced-motion:reduce){#intro.home-v3 .relay-v3-nav{transition:none!important}}
  `;

  function installCss() {
    if ($('relay-gameplay-runtime-v3-style')) return;
    const style = document.createElement('style');
    style.id = 'relay-gameplay-runtime-v3-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function openHomeInfo(kind) {
    if (typeof window.relayOpenInfo === 'function') {
      window.relayOpenInfo(kind);
      return true;
    }
    return false;
  }

  function reliableStart() {
    if (state.playBusy) return;
    state.playBusy = true;
    try {
      window.relayAdaptiveMusic?.setEnabled?.(true);
      const musicPromise = window.relayAdaptiveMusic?.unlock?.();
      if (musicPromise?.catch) musicPromise.catch(() => {});
    } catch {}

    nativeClick('#start');

    window.clearTimeout(state.playFallbackTimer);
    state.playFallbackTimer = window.setTimeout(() => {
      state.playBusy = false;
      const intro = $('intro');
      const stillHome = !!intro && !intro.classList.contains('hidden');
      if (stillHome && $('start')) nativeClick('#start');
      if (!stillHome) {
        try { window.relayAdaptiveMusic?.unlock?.(); window.relayAdaptiveMusic?.start?.(); } catch {}
      }
    }, 420);
  }

  function installPlayReliability() {
    const play = q('#intro .home-v3-play');
    if (!play || play.dataset.relayV3Play === '1') return;
    play.dataset.relayV3Play = '1';
    play.setAttribute('role', 'button');
    play.setAttribute('tabindex', '0');

    const start = event => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
      }
      reliableStart();
    };
    play.addEventListener('pointerup', start, { capture:true, passive:false });
    play.addEventListener('click', start, { capture:true, passive:false });
    play.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.code === 'Space') start(event);
    }, { capture:true });
  }

  function installHomeButtons() {
    const intro = $('intro');
    const side = intro?.querySelector('.home-v3-side');
    if (!intro || !side) return;

    intro.querySelector('.info-launcher')?.remove();
    side.querySelectorAll('[data-v3-faq],[data-v3-update],[data-v3-options],[data-v3-exit],[data-unified-home],[data-final-home],[data-final-home-v3],[data-unified-home-v3]').forEach(node => node.remove());

    const make = (id, label, detail, handler) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'relay-v3-nav';
      button.dataset.v3Final = id;
      button.innerHTML = `<span>${label}</span><small>${detail}</small>`;
      button.addEventListener('pointerup', event => {
        event.preventDefault();
        event.stopPropagation();
        try { handler(); } catch {}
      }, { passive:false });
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        try { handler(); } catch {}
      });
      return button;
    };

    side.append(
      make('options', 'OPTIONS', 'SETTINGS · AUDIO · DISPLAY', () => window.relayUnifiedCinematicUI?.openOptions?.() || nativeClick('[data-title-panel="controls"]')),
      make('faq', 'FAQ', 'HELP · GAME SYSTEMS', () => openHomeInfo('faq')),
      make('update', 'UPDATE', 'LATEST PATCHES · LIVE', () => openHomeInfo('update')),
      make('exit', 'EXIT', 'CLOSE SESSION', () => nativeClick('#exitTitle')),
    );
  }

  function hideDomHud() {
    document.querySelectorAll('.relay-gameplay-intel,#relayGameplayIntel,[data-relay-mission-intelligence],[data-mission-intelligence],.relay-debug-hud,[data-relay-debug-hud],[data-debug-hud]').forEach(node => {
      node.style.setProperty('display','none','important');
      node.style.setProperty('visibility','hidden','important');
      node.style.setProperty('pointer-events','none','important');
    });
  }

  function hidePhaserHud(scene) {
    if (!scene?.children?.list) return;
    const list = scene.children.list;
    for (const node of list) {
      if (typeof node?.text === 'string') {
        const text = node.text.trim().toUpperCase();
        if (/DYNAMIC\s+CROWD/.test(text) || /^V10\b/.test(text) || /MISSION\s+INTELLIGENCE/.test(text)) {
          node.setVisible?.(false); node.setAlpha?.(0); node.disableInteractive?.();
          node.parentContainer?.setVisible?.(false);
        }
      }
      if (node?.list?.some?.(child => typeof child?.text === 'string' && (/DYNAMIC\s+CROWD/i.test(child.text) || /MISSION\s+INTELLIGENCE/i.test(child.text) || /^V10\b/i.test(child.text)))) {
        node.setVisible?.(false); node.setAlpha?.(0); node.disableInteractive?.();
      }
    }
  }

  function installSceneGuard(scene) {
    if (!scene || state.scene === scene) return;
    state.scene = scene;
    window.clearInterval(state.sceneTimer);
    const tick = () => {
      hidePhaserHud(scene);
      hideDomHud();
      if ($('intro')?.classList.contains('hidden')) {
        try {
          window.relayAdaptiveMusic?.setEnabled?.(true);
          window.relayAdaptiveMusic?.unlock?.().then?.(ok => { if (ok) window.relayAdaptiveMusic?.start?.(); }).catch?.(() => {});
        } catch {}
      }
    };
    tick();
    state.sceneTimer = window.setInterval(tick, 650);
  }

  const originalCreate = RunnerScene.prototype.create;
  if (typeof originalCreate === 'function' && !RunnerScene.prototype.__relayGameplayRuntimeV3Create) {
    RunnerScene.prototype.create = function runtimeV3Create(...args) {
      const result = originalCreate.apply(this, args);
      installSceneGuard(this);
      return result;
    };
    RunnerScene.prototype.__relayGameplayRuntimeV3Create = true;
  }

  function boot() {
    installCss();
    installHomeButtons();
    installPlayReliability();
    hideDomHud();

    state.domObserver = new MutationObserver(() => {
      installHomeButtons();
      installPlayReliability();
      hideDomHud();
    });
    state.domObserver.observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:['class','style','hidden'] });

    document.addEventListener('pointerdown', () => {
      try { window.relayAdaptiveMusic?.unlock?.(); } catch {}
    }, { capture:true, passive:true });

    document.addEventListener('keydown', event => {
      if (event.code === 'Space' || event.code === 'Enter') {
        try { window.relayAdaptiveMusic?.unlock?.(); } catch {}
      }
    }, { capture:true, passive:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
