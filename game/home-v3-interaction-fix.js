import './unified-cinematic-ui-v1.css';
import './unified-cinematic-ui-v1.js';
import './unified-cinematic-ui-bridge-v1.js';
import './unified-options-ui-v1.js';
import './gameplay-ui-v8-settings-polish.css';
import './unified-gameplay-ui-v1.css';
import './unified-gameplay-ui-v1-polish.css';
import './unified-gameplay-ui-v1.js';
import './unified-gameplay-ui-v1-mobile.css';
import './presentation-final-v1.css';
import './presentation-final-v1.js';

(() => {
  'use strict';

  if (window.__relayCanonicalSettingsRouterV1) return;
  window.__relayCanonicalSettingsRouterV1 = true;

  const html = document.documentElement;
  const get = id => document.getElementById(id);
  const visible = el => !!el && !el.classList.contains('hidden');

  const ensureTitlePanel = () => {
    const panel = get('titlePanel');
    if (!(panel instanceof HTMLElement)) return null;
    if (!(get('titlePanelContent') instanceof HTMLElement)) {
      panel.innerHTML = `
        <div class="title-panel-card">
          <button id="closeTitlePanel" class="title-panel-close" type="button" aria-label="Close panel">×</button>
          <p id="titlePanelEyebrow" class="eyebrow"></p>
          <h2 id="titlePanelHeading" class="relay-options-title"></h2>
          <div id="titlePanelContent"></div>
        </div>
      `;
    }
    return panel;
  };

  const openHomeCanonical = () => {
    const panel = ensureTitlePanel();
    const heading = get('titlePanelHeading');
    const content = get('titlePanelContent');
    if (!(panel instanceof HTMLElement) || !(heading instanceof HTMLElement) || !(content instanceof HTMLElement)) return false;

    panel.classList.remove('hidden');
    panel.classList.remove('relay-canonical-settings-failed');
    panel.classList.add('relay-options-unified');
    heading.textContent = 'OPTIONS';
    heading.className = 'relay-options-title';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.dataset.titlePanel = 'controls';
    trigger.tabIndex = -1;
    trigger.setAttribute('aria-hidden', 'true');
    trigger.style.cssText = 'position:fixed;left:-99999px;top:-99999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(trigger);

    try {
      HTMLElement.prototype.click.call(trigger);
    } finally {
      trigger.remove();
    }

    panel.classList.add('relay-options-unified');
    const mounted = !!content.querySelector('.relay-options-shell');
    if (!mounted) panel.classList.add('relay-canonical-settings-failed');
    return mounted;
  };

  const restoreLegacyPanelHost = () => {
    const pause = get('pauseMenu');
    if (!(pause instanceof HTMLElement)) return;

    const panelContent = pause.querySelector('#panelContent');
    const grid = pause.querySelector('.menu-grid');
    if (panelContent instanceof HTMLElement && grid instanceof HTMLElement && panelContent.parentElement !== grid) {
      grid.appendChild(panelContent);
    }

    pause.classList.remove('relay-canonical-settings-open', 'relay-options-unified');
  };

  const mountPauseCanonical = () => {
    const pause = get('pauseMenu');
    if (!(pause instanceof HTMLElement)) return false;

    const panelContent = pause.querySelector('#panelContent');
    const canonicalHost = pause.querySelector('.relay-pause-content');
    if (!(panelContent instanceof HTMLElement) || !(canonicalHost instanceof HTMLElement)) return false;
    if (!panelContent.querySelector('.relay-options-shell')) return false;

    canonicalHost.replaceChildren(panelContent);
    pause.classList.add('relay-options-unified', 'relay-canonical-settings-open');
    html.dataset.relayCanonicalSettings = '1';
    return true;
  };

  const openPauseCanonical = () => {
    const pause = get('pauseMenu');
    if (!(pause instanceof HTMLElement)) return false;

    if (pause.classList.contains('hidden')) {
      const pauseButton = get('pause');
      if (!(pauseButton instanceof HTMLElement)) return false;
      HTMLElement.prototype.click.call(pauseButton);
    }

    const legacySettings = pause.querySelector('.menu .tab[data-tab="settings"]');
    if (!(legacySettings instanceof HTMLElement)) return false;

    HTMLElement.prototype.click.call(legacySettings);

    const deadline = performance.now() + 1400;
    const finish = () => {
      if (mountPauseCanonical()) return;
      if (performance.now() < deadline) requestAnimationFrame(finish);
    };
    requestAnimationFrame(finish);
    return true;
  };

  const installApiBridge = () => {
    const api = window.relayUnifiedCinematicUI;
    if (!api || typeof api.openOptions !== 'function') return;
    if (api.__relayCanonicalOptionsRouterV6) return;

    api.openOptions = () => openHomeCanonical();

    Object.defineProperty(api, '__relayCanonicalOptionsRouterV6', {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  };

  const installStyle = () => {
    if (document.getElementById('relay-canonical-settings-router-style')) return;

    const style = document.createElement('style');
    style.id = 'relay-canonical-settings-router-style';
    style.textContent = `
      #titlePanel.relay-options-unified > .relay-cinematic-panel,
      #titlePanel.relay-options-unified .relay-cinematic-panel,
      #titlePanel.relay-canonical-settings-failed > .relay-cinematic-panel {
        display:none !important;
        visibility:hidden !important;
        pointer-events:none !important;
      }

      #pauseMenu.relay-canonical-settings-open > .menu,
      #pauseMenu.relay-canonical-settings-open .menu > * {
        display:none !important;
        visibility:hidden !important;
        pointer-events:none !important;
      }

      #pauseMenu.relay-canonical-settings-open .relay-pause-shell,
      #pauseMenu.relay-canonical-settings-open .relay-pause-content,
      #pauseMenu.relay-canonical-settings-open #panelContent,
      #pauseMenu.relay-canonical-settings-open .relay-options-shell {
        visibility:visible !important;
        pointer-events:auto !important;
      }

      .mobile-bottom-hud .mobile-menu-button {
        border-color:rgba(141,244,255,.70) !important;
        background:linear-gradient(145deg,rgba(4,16,28,.98),rgba(8,35,52,.98)) !important;
        color:#effcff !important;
        box-shadow:0 10px 28px rgba(0,0,0,.5),0 0 24px rgba(141,244,255,.18),inset 0 1px 0 rgba(255,255,255,.09) !important;
      }

      .mobile-bottom-hud .mobile-menu-button small {
        color:#bcefff !important;
      }
    `;
    document.head.appendChild(style);
  };

  const routeClick = event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const homeOptions = target.closest(
      '[data-home-v4-action="options"], [data-final-home="options"], [data-final-home-button="options"], [data-v3-options]'
    );
    if (homeOptions) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openHomeCanonical();
      return;
    }

    const pauseSettings = target.closest('#pauseMenu [data-pause-tab="settings"]');
    if (pauseSettings) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openPauseCanonical();
      return;
    }

    const mobileSettings = target.closest('#mobileSettingsButton');
    if (mobileSettings) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openPauseCanonical();
      return;
    }

    const pauseOtherTab = target.closest('#pauseMenu [data-pause-tab]');
    if (pauseOtherTab) {
      restoreLegacyPanelHost();
      html.dataset.relayCanonicalSettings = '0';
    }

    const close = target.closest('#titlePanel [data-unified-close], #pauseMenu [data-unified-close]');
    if (close) {
      restoreLegacyPanelHost();
      html.dataset.relayCanonicalSettings = '0';
    }
  };

  const install = () => {
    installStyle();
    installApiBridge();
  };

  document.addEventListener('click', routeClick, { capture:true, passive:false });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once:true });
  } else {
    install();
  }

  const apiReady = window.setInterval(() => {
    installApiBridge();
    if (window.relayUnifiedCinematicUI?.__relayCanonicalOptionsRouterV6) window.clearInterval(apiReady);
  }, 50);

  window.relayCanonicalSettings = {
    openHome: openHomeCanonical,
    openPause: openPauseCanonical,
    restorePauseHost: restoreLegacyPanelHost,
  };

  const titlePanel = get('titlePanel');
  const pauseMenu = get('pauseMenu');
  const observer = new MutationObserver(() => {
    if (visible(titlePanel) && titlePanel.classList.contains('relay-options-unified')) {
      titlePanel.querySelectorAll('.relay-cinematic-panel').forEach(node => node.remove());
    }
    if (!visible(pauseMenu)) {
      html.dataset.relayCanonicalSettings = '0';
      restoreLegacyPanelHost();
    }
  });

  [titlePanel, pauseMenu].filter(Boolean).forEach(node => {
    observer.observe(node, {
      attributes:true,
      childList:true,
      subtree:true,
      attributeFilter:['class','hidden','style']
    });
  });
})();
