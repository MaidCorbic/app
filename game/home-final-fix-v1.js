import { loadState } from './src/state.js';

(() => {
  if (window.__relayHomeFinalFixV1) return;
  window.__relayHomeFinalFixV1 = true;

  const root = document.documentElement;
  const intro = () => document.getElementById('intro');

  const stopAmbient = () => {
    const ambient = window.__relayHomeAmbient;
    if (!ambient) return;
    try {
      if (typeof ambient.gain?.cancelScheduledValues === 'function') {
        const now = ambient.context?.currentTime ?? 0;
        ambient.gain.cancelScheduledValues(now);
        ambient.gain.setTargetAtTime(0.0001, now, 0.08);
      }
      window.setTimeout(() => {
        try { ambient.disconnect?.(); } catch {}
      }, 180);
    } catch {}
    window.__relayHomeAmbient = null;
  };

  const applyPresentation = () => {
    const theme = localStorage.getItem('relay-home-theme') || 'night';
    const skin = localStorage.getItem('relay-courier-skin') || 'night-runner';
    root.dataset.homeTheme = theme;
    root.dataset.courierSkin = skin;
    const home = intro();
    if (home) {
      home.dataset.homeTheme = theme;
      home.dataset.courierSkin = skin;
    }
  };

  const applyAudio = () => {
    const state = loadState();
    if (state.muted || !(state.musicVolume > 0) || !document.getElementById('intro') || document.getElementById('intro')?.classList.contains('hidden')) stopAmbient();
  };

  const style = document.createElement('style');
  style.id = 'relay-home-final-fix-v1';
  style.textContent = `
    /* FINAL HOME PRESENTATION */
    #intro[data-home-theme="day"] .menu-backdrop,
    #intro[data-home-theme="day"] .main-menu,
    #intro[data-home-theme="day"] .title-lockup{filter:saturate(.92) brightness(1.12)}
    #intro[data-home-theme="day"] .menu-backdrop::after{opacity:.55!important}
    #intro[data-home-theme="night"] .menu-backdrop{filter:none}

    #intro[data-courier-skin="ghostline"] .title-lockup{--home-accent:#38bdf8!important}
    #intro[data-courier-skin="ghostline"] .play-button{border-color:#38bdf8!important;box-shadow:0 14px 40px #38bdf833,inset 0 1px #fff8!important}
    #intro[data-courier-skin="ghostline"] .home-v3-btn:hover,
    #intro[data-courier-skin="ghostline"] .home-v3-btn:focus-visible{border-color:#38bdf8!important;color:#38bdf8!important}
    #intro[data-courier-skin="goldline"] .title-lockup{--home-accent:#ffd06e!important;filter:saturate(1.08)}
    #intro[data-courier-skin="goldline"] .play-button{border-color:#ffd06e!important;box-shadow:0 14px 44px #ffd06e38,inset 0 1px #fff9!important}
    #intro[data-courier-skin="goldline"] .home-v3-btn:hover,
    #intro[data-courier-skin="goldline"] .home-v3-btn:focus-visible{border-color:#ffd06e!important;color:#ffd06e!important}

    #homeV3Panel{z-index:10000!important}
    #homeV3Panel[data-theme="day"]{background:rgba(16,27,40,.86)!important}
    #homeV3Panel[data-theme="night"]{background:rgba(2,5,10,.86)!important}
    .home-v3-theme-active{outline:2px solid #ffd06e!important;outline-offset:1px}
    .home-v3-skin-locked{opacity:.45!important;cursor:not-allowed!important;filter:grayscale(.5)}
    .home-v3-skin-equipped{border-color:#68e7be!important;color:#68e7be!important}
  `;
  document.head.appendChild(style);

  const originalSetItem = localStorage.setItem.bind(localStorage);
  const safeSet = (key, value) => originalSetItem(key, value);

  const setTheme = theme => {
    if (theme !== 'day' && theme !== 'night') return;
    safeSet('relay-home-theme', theme);
    applyPresentation();
    window.dispatchEvent(new CustomEvent('relay-home-theme-change', { detail: { theme } }));
  };

  const setSkin = skin => {
    if (!['night-runner', 'ghostline', 'goldline'].includes(skin)) return;
    safeSet('relay-courier-skin', skin);
    applyPresentation();
    window.dispatchEvent(new CustomEvent('relay-skin-change', { detail: { skin } }));
  };

  const refreshPanel = panel => {
    if (!panel) return;
    panel.dataset.theme = localStorage.getItem('relay-home-theme') || 'night';
    panel.querySelectorAll('[data-home-theme]').forEach(button => {
      button.classList.toggle('home-v3-theme-active', button.dataset.homeTheme === panel.dataset.theme);
    });
    const equipped = localStorage.getItem('relay-courier-skin') || 'night-runner';
    panel.querySelectorAll('[data-home-skin]').forEach(button => {
      const active = button.dataset.homeSkin === equipped;
      button.classList.toggle('home-v3-skin-equipped', active);
      button.textContent = active ? 'EQUIPPED' : 'EQUIP';
    });
  };

  const bindPanel = panel => {
    if (!panel || panel.dataset.finalFixBound === '1') return;
    panel.dataset.finalFixBound = '1';
    refreshPanel(panel);
    panel.addEventListener('click', event => {
      const themeButton = event.target.closest('[data-home-theme]');
      if (themeButton && panel.contains(themeButton)) {
        setTheme(themeButton.dataset.homeTheme);
        refreshPanel(panel);
        return;
      }
      const skinButton = event.target.closest('[data-home-skin]');
      if (skinButton && panel.contains(skinButton)) {
        setSkin(skinButton.dataset.homeSkin);
        refreshPanel(panel);
      }
    });
  };

  const bindPanelsInNode = node => {
    if (!(node instanceof Element)) return;
    if (node.matches('#homeV3Panel')) bindPanel(node);
    node.querySelectorAll?.('#homeV3Panel').forEach(bindPanel);
  };

  const observePanels = () => {
    document.querySelectorAll('#homeV3Panel').forEach(bindPanel);
    if (window.__relayHomeFinalObserver) return;

    window.__relayHomeFinalObserver = new MutationObserver(mutations => {
      let presentationChanged = false;

      for (const mutation of mutations) {
        if (mutation.type !== 'childList') continue;

        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(bindPanelsInNode);
        }

        const target = mutation.target;
        if (target instanceof Element && (target.matches('#intro') || target.closest?.('#intro'))) {
          if ([...mutation.addedNodes].some(node => node.nodeType === Node.ELEMENT_NODE)) {
            presentationChanged = true;
          }
        }
      }

      if (presentationChanged) applyPresentation();
    });

    window.__relayHomeFinalObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  };

  window.addEventListener('relay-settings-change', applyAudio);
  window.addEventListener('relay:runner-scene-ready', () => {
    stopAmbient();
    applyPresentation();
  });
  window.addEventListener('relay-home-theme-change', applyPresentation);
  window.addEventListener('relay-skin-change', applyPresentation);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAmbient();
  });
  document.addEventListener('click', event => {
    if (event.target.closest('#start, #continue')) {
      stopAmbient();
      window.setTimeout(applyAudio, 0);
    }
  }, true);

  applyPresentation();
  observePanels();
  applyAudio();
})();
