(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__relayHomeSettingsScrollRuntimeV1) return;
  window.__relayHomeSettingsScrollRuntimeV1 = true;

  const panels = new WeakMap();
  const SCROLL_KEY = 'relay.home.settings.scrollTop.v1';

  const readSavedScroll = () => {
    try {
      const value = Number(sessionStorage.getItem(SCROLL_KEY));
      return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch {
      return 0;
    }
  };

  const saveScroll = value => {
    try { sessionStorage.setItem(SCROLL_KEY, String(Math.max(0, Number(value) || 0))); } catch {}
  };

  const getPanel = () => {
    const panel = document.getElementById('titlePanel');
    if (!panel || panel.classList.contains('hidden')) return null;
    if (!panel.classList.contains('relay-options-unified')) return null;
    return panel;
  };

  const setImportant = (el, prop, value) => el?.style.setProperty(prop, value, 'important');
  const maxScroll = body => Math.max(0, (body?.scrollHeight || 0) - (body?.clientHeight || 0));
  const clampScroll = (body, value) => Math.max(0, Math.min(maxScroll(body), Number(value) || 0));

  const fitPanel = panel => {
    const card = panel.querySelector('.title-panel-card');
    const host = panel.querySelector('#titlePanelContent');
    const shell = host?.querySelector('.relay-options-shell');
    const body = shell?.querySelector('.relay-options-body');
    if (!card || !host || !shell || !body) return null;

    const compact = window.innerWidth <= 760;
    const height = Math.max(260, Math.floor(window.innerHeight - (compact ? 12 : 20)));

    setImportant(card, 'display', 'flex');
    setImportant(card, 'flex-direction', 'column');
    setImportant(card, 'width', compact ? 'calc(100vw - 12px)' : 'min(980px,92vw)');
    setImportant(card, 'height', `${height}px`);
    setImportant(card, 'max-height', `${height}px`);
    setImportant(card, 'min-height', '0');
    setImportant(card, 'overflow', 'hidden');
    setImportant(card, 'overscroll-behavior', 'contain');

    const close = panel.querySelector('#closeTitlePanel');
    if (close) {
      setImportant(close, 'position', 'absolute');
      setImportant(close, 'top', compact ? '9px' : '14px');
      setImportant(close, 'right', compact ? '9px' : '14px');
      setImportant(close, 'z-index', '80');
      setImportant(close, 'pointer-events', 'auto');
    }

    setImportant(host, 'display', 'flex');
    setImportant(host, 'flex', '1 1 auto');
    setImportant(host, 'width', '100%');
    setImportant(host, 'height', 'auto');
    setImportant(host, 'min-height', '0');
    setImportant(host, 'overflow', 'hidden');
    setImportant(host, 'pointer-events', 'auto');

    setImportant(shell, 'display', 'grid');
    setImportant(shell, 'grid-template-rows', 'auto minmax(0,1fr)');
    setImportant(shell, 'width', '100%');
    setImportant(shell, 'height', '100%');
    setImportant(shell, 'min-height', '0');
    setImportant(shell, 'overflow', 'hidden');

    setImportant(body, 'display', 'block');
    setImportant(body, 'width', '100%');
    setImportant(body, 'height', 'auto');
    setImportant(body, 'max-height', 'none');
    setImportant(body, 'min-height', '0');
    setImportant(body, 'overflow-y', 'auto');
    setImportant(body, 'overflow-x', 'hidden');
    setImportant(body, 'overscroll-behavior', 'contain');
    setImportant(body, 'touch-action', 'pan-y');
    setImportant(body, '-webkit-overflow-scrolling', 'touch');
    setImportant(body, 'pointer-events', 'auto');
    setImportant(body, 'scrollbar-gutter', 'stable');

    return body;
  };

  const attachBody = (state, body) => {
    if (!body) return;
    if (state.body === body) {
      body.scrollTop = clampScroll(body, state.scrollTop || readSavedScroll());
      return;
    }

    if (state.body) {
      state.scrollTop = state.body.scrollTop;
      saveScroll(state.scrollTop);
    }

    state.body = body;
    state.scrollTop = clampScroll(body, Number(state.scrollTop) || readSavedScroll());

    body.addEventListener('scroll', () => {
      state.scrollTop = clampScroll(body, body.scrollTop);
      saveScroll(state.scrollTop);
    }, { passive: true });

    const restore = () => {
      state.scrollTop = clampScroll(body, state.scrollTop || readSavedScroll());
      body.scrollTop = state.scrollTop;
    };

    restore();
    requestAnimationFrame(restore);
  };

  const bindPanel = panel => {
    if (panels.has(panel)) return panels.get(panel);

    const state = { raf: 0, scrollTop: readSavedScroll(), body: null, observer: null, resizeObserver: null };

    const scheduleFit = () => {
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = requestAnimationFrame(() => {
        state.raf = 0;
        const body = fitPanel(panel);
        attachBody(state, body);
      });
    };

    state.observer = new MutationObserver(mutations => {
      if (mutations.some(mutation => mutation.type === 'childList')) scheduleFit();
    });
    state.observer.observe(panel, { childList: true, subtree: true });

    if ('ResizeObserver' in window) {
      state.resizeObserver = new ResizeObserver(scheduleFit);
      state.resizeObserver.observe(panel);
    }

    window.addEventListener('resize', scheduleFit, { passive: true });
    window.addEventListener('orientationchange', scheduleFit, { passive: true });

    panels.set(panel, state);
    scheduleFit();
    return state;
  };

  const sync = () => {
    const panel = getPanel();
    if (!panel) return;
    const state = bindPanel(panel);
    const body = fitPanel(panel);
    attachBody(state, body);
  };

  const boot = () => {
    sync();
    document.addEventListener('relay-open-home-options', () => requestAnimationFrame(sync), { passive: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
