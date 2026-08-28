/* Relay Runner options/runtime safety bridge.
 * Keeps native menu handlers intact, makes one scroll owner per Options surface,
 * and gates AudioContext resume until browser user activation exists.
 */
(() => {
  'use strict';
  if (window.__relayOptionsRuntimeSafetyV1) return;
  window.__relayOptionsRuntimeSafetyV1 = true;

  const AUDIO_CTX = window.AudioContext || window.webkitAudioContext;
  const gatedContexts = new Set();
  let userActivated = !!window.navigator?.userActivation?.hasBeenActive;

  if (AUDIO_CTX && !window.__relayAudioContextGated) {
    window.__relayAudioContextGated = true;
    const Original = AUDIO_CTX;
    const Gated = new Proxy(Original, {
      construct(Target, args, NewTarget) {
        const context = Reflect.construct(Target, args, NewTarget);
        gatedContexts.add(context);
        const realResume = context.resume.bind(context);
        let pending = false;
        context.resume = () => {
          if (userActivated) return realResume().catch(() => undefined);
          pending = true;
          return Promise.resolve();
        };
        context.__relayFlushAudio = () => {
          if (!pending) return;
          pending = false;
          realResume().catch(() => undefined);
        };
        return context;
      }
    });
    try { window.AudioContext = Gated; } catch {}
    if (window.webkitAudioContext === Original) {
      try { window.webkitAudioContext = Gated; } catch {}
    }
  }

  const activateAudio = () => {
    userActivated = true;
    gatedContexts.forEach(context => context.__relayFlushAudio?.());
  };
  ['pointerdown', 'touchstart', 'keydown'].forEach(type => window.addEventListener(type, activateAudio, { once: true, capture: true, passive: true }));

  const showToast = text => {
    let toast = document.getElementById('relayOptionToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'relayOptionToast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 900);
  };

  const applyClassState = (key, value) => {
    if (key === 'reducedMotion') document.documentElement.classList.toggle('relay-reduced-motion', !!value);
    if (key === 'screenShake') document.documentElement.classList.toggle('relay-screen-shake-off', !value);
    if (key === 'rain') document.documentElement.classList.toggle('relay-rain-off', !value);
    if (key === 'muted') document.documentElement.classList.toggle('relay-audio-muted', !!value);
  };

  const patchScrollOwnership = () => {
    const css = `
      #titlePanel.relay-options-unified #titlePanelContent,
      #pauseMenu.relay-options-unified #panelContent{overflow:hidden!important;min-height:0!important}
      #titlePanel.relay-options-unified .relay-options-shell,
      #pauseMenu.relay-options-unified .relay-options-shell{height:100%!important;min-height:0!important;overflow:hidden!important}
      #titlePanel.relay-options-unified .relay-options-body,
      #pauseMenu.relay-options-unified .relay-options-body{min-height:0!important;max-height:none!important;height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:thin!important;scrollbar-color:rgba(141,244,255,.68) rgba(255,255,255,.05)!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important}
      #titlePanel.relay-options-unified .relay-options-body::-webkit-scrollbar,
      #pauseMenu.relay-options-unified .relay-options-body::-webkit-scrollbar{display:block!important;width:9px!important;height:9px!important}
      #titlePanel.relay-options-unified .relay-options-body::-webkit-scrollbar-track,
      #pauseMenu.relay-options-unified .relay-options-body::-webkit-scrollbar-track{background:rgba(255,255,255,.05)!important;border-radius:999px!important}
      #titlePanel.relay-options-unified .relay-options-body::-webkit-scrollbar-thumb,
      #pauseMenu.relay-options-unified .relay-options-body::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(141,244,255,.82),rgba(255,208,110,.82))!important;border-radius:999px!important;border:2px solid rgba(4,12,23,.76)!important;min-height:40px!important}
      #titlePanel.relay-options-unified .relay-option-copy strong,
      #pauseMenu.relay-options-unified .relay-option-copy strong{font-size:13px!important;line-height:1.25!important}
      #titlePanel.relay-options-unified .relay-option-copy small,
      #pauseMenu.relay-options-unified .relay-option-copy small{font-size:9px!important;line-height:1.5!important}
      #titlePanel.relay-options-unified .relay-section-title,
      #pauseMenu.relay-options-unified .relay-section-title{font-size:10px!important}
      #titlePanel.relay-options-unified .relay-toggle,
      #pauseMenu.relay-options-unified .relay-toggle{min-width:104px!important;height:40px!important;font-size:10px!important}
      #titlePanel.relay-options-unified .relay-action,
      #pauseMenu.relay-options-unified .relay-action{min-height:46px!important;font-size:10px!important}
      @media(max-width:700px){
        #titlePanel.relay-options-unified .relay-options-body,
        #pauseMenu.relay-options-unified .relay-options-body{height:auto!important;max-height:none!important}
        #titlePanel.relay-options-unified .relay-option-copy strong,
        #pauseMenu.relay-options-unified .relay-option-copy strong{font-size:11px!important}
        #titlePanel.relay-options-unified .relay-option-copy small,
        #pauseMenu.relay-options-unified .relay-option-copy small{font-size:8.5px!important}
      }
    `;
    if (!document.getElementById('relay-options-runtime-safety-style')) {
      const style = document.createElement('style');
      style.id = 'relay-options-runtime-safety-style';
      style.textContent = css;
      document.head.appendChild(style);
    }
  };

  const bindSettings = () => {
    document.addEventListener('click', event => {
      const control = event.target.closest?.('[data-unified-toggle],[data-home-toggle],[data-pause-option],[data-setting]');
      if (!control) return;
      const key = control.dataset.unifiedToggle || control.dataset.homeToggle || control.dataset.pauseOption || control.dataset.setting;
      if (!key) return;
      window.setTimeout(() => {
        try {
          const state = window.relay?.state || null;
          const muted = key === 'muted';
          const value = muted ? !(state?.muted ?? false) : (state?.[key] ?? true);
          applyClassState(key, value);
          window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key, value, source: 'options-runtime-safety-v1' } }));
          showToast(`${key.replace(/([A-Z])/g, ' $1').toUpperCase()} · ${value ? 'ON' : 'OFF'}`);
        } catch {}
      }, 0);
    }, true);
  };

  const stabilizeOpen = () => {
    const home = document.getElementById('titlePanel');
    const pause = document.getElementById('pauseMenu');
    const homeOpen = home && !home.classList.contains('hidden');
    const pauseOpen = pause && !pause.classList.contains('hidden');
    if (homeOpen) {
      home.classList.add('relay-options-unified');
      window.setTimeout(patchScrollOwnership, 0);
    }
    if (pauseOpen) window.setTimeout(patchScrollOwnership, 0);
  };

  const init = () => {
    patchScrollOwnership();
    bindSettings();
    stabilizeOpen();
    new MutationObserver(stabilizeOpen).observe(document.body, { subtree:true, attributes:true, attributeFilter:['class'] });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
