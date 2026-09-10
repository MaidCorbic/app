(() => {
  'use strict';

  /*
   * RELAY RUNNER — HOME SETTINGS SCROLL RUNTIME V1
   *
   * Scoped only to Home -> Options. The runtime owns the scroll viewport,
   * desktop wheel/trackpad fallback, and preservation of scroll position
   * when the canonical Settings UI re-renders its body element.
   */

  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__relayHomeSettingsScrollRuntimeV1) return;
  window.__relayHomeSettingsScrollRuntimeV1 = true;

  const panels = new WeakMap();

  const getPanel = () => {
    const panel = document.getElementById('titlePanel');
    if (!panel) return null;
    if (panel.classList.contains('hidden')) return null;
    if (!panel.classList.contains('relay-options-unified')) return null;
    return panel;
  };

  const setImportant = (element, property, value) => {
    if (!element) return;
    element.style.setProperty(property, value, 'important');
  };

  const clampScrollTop = (body, value) => {
    const max = Math.max(0, body.scrollHeight - body.clientHeight);
    return Math.max(0, Math.min(max, Number(value) || 0));
  };

  const fitPanel = panel => {
    if (!panel) return null;

    const card = panel.querySelector('.title-panel-card');
    const host = panel.querySelector('#titlePanelContent');
    const shell = host?.querySelector('.relay-options-shell');
    const head = shell?.querySelector('.relay-options-head');
    const body = shell?.querySelector('.relay-options-body');
    if (!card || !host || !shell || !body) return null;

    const panelState = panels.get(panel);
    const compact = window.innerWidth <= 760;
    const inset = compact ? 12 : 20;
    const availableHeight = Math.max(260, Math.floor(window.innerHeight - inset));

    setImportant(card, 'display', 'flex');
    setImportant(card, 'flex-direction', 'column');
    setImportant(card, 'width', compact ? 'calc(100vw - 12px)' : 'min(980px, 92vw)');
    setImportant(card, 'height', `${availableHeight}px`);
    setImportant(card, 'max-height', `${availableHeight}px`);
    setImportant(card, 'min-height', '0');
    setImportant(card, 'overflow', 'hidden');
    setImportant(card, 'overscroll-behavior', 'none');

    const close = panel.querySelector('#closeTitlePanel');
    if (close) {
      setImportant(close, 'position', 'absolute');
      setImportant(close, 'top', '14px');
      setImportant(close, 'right', '14px');
      setImportant(close, 'z-index', '80');
      setImportant(close, 'pointer-events', 'auto');
    }

    setImportant(host, 'display', 'flex');
    setImportant(host, 'flex', '1 1 auto');
    setImportant(host, 'width', '100%');
    setImportant(host, 'height', 'auto');
    setImportant(host, 'min-height', '0');
    setImportant(host, 'max-height', 'none');
    setImportant(host, 'overflow', 'hidden');
    setImportant(host, 'pointer-events', 'auto');

    setImportant(shell, 'display', 'grid');
    setImportant(shell, 'grid-template-rows', 'auto minmax(0, 1fr)');
    setImportant(shell, 'width', '100%');
    setImportant(shell, 'height', '100%');
    setImportant(shell, 'min-height', '0');
    setImportant(shell, 'overflow', 'hidden');

    const shellRect = shell.getBoundingClientRect();
    const headRect = head?.getBoundingClientRect();
    const bodyTop = headRect?.bottom ?? shellRect.top;
    const bodyHeight = Math.max(120, Math.floor(shellRect.bottom - bodyTop));

    setImportant(body, 'display', 'block');
    setImportant(body, 'width', '100%');
    setImportant(body, 'height', `${bodyHeight}px`);
    setImportant(body, 'max-height', `${bodyHeight}px`);
    setImportant(body, 'min-height', '0');
    setImportant(body, 'overflow-y', 'auto');
    setImportant(body, 'overflow-x', 'hidden');
    setImportant(body, 'overscroll-behavior-y', 'contain');
    setImportant(body, 'overscroll-behavior-x', 'none');
    setImportant(body, 'scroll-behavior', 'auto');
    setImportant(body, 'scroll-snap-type', 'none');
    setImportant(body, 'touch-action', 'pan-y');
    setImportant(body, '-webkit-overflow-scrolling', 'touch');
    setImportant(body, 'pointer-events', 'auto');
    setImportant(body, 'scrollbar-gutter', 'stable');

    if (panelState) {
      const restore = () => {
        const next = clampScrollTop(body, panelState.scrollTop);
        if (Math.abs(body.scrollTop - next) > 0.5) body.scrollTop = next;
      };
      restore();
      window.requestAnimationFrame(restore);
      window.setTimeout(restore, 0);
    }

    return body;
  };

  const normalizeWheelDelta = (event, body) => {
    let delta = Number(event.deltaY) || 0;
    if (event.deltaMode === 1) delta *= 16;
    if (event.deltaMode === 2) delta *= body.clientHeight;
    return delta;
  };

  const bindPanel = panel => {
    if (panels.has(panel)) return panels.get(panel);

    const state = {
      raf: 0,
      observer: null,
      resizeObserver: null,
      scrollTop: 0,
      body: null,
    };

    const rememberScroll = body => {
      if (body) state.scrollTop = body.scrollTop;
    };

    const attachBody = body => {
      if (!body || state.body === body) return;
      rememberScroll(state.body);
      state.body = body;
      body.addEventListener('scroll', () => rememberScroll(body), { passive: true });
      body.scrollTop = clampScrollTop(body, state.scrollTop);
    };

    const scheduleFit = () => {
      if (state.raf) window.cancelAnimationFrame(state.raf);
      state.raf = window.requestAnimationFrame(() => {
        state.raf = 0;
        const body = fitPanel(panel);
        attachBody(body);
        if (body) body.scrollTop = clampScrollTop(body, state.scrollTop);
      });
    };

    const onWheel = event => {
      if (event.ctrlKey || event.metaKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const body = target.closest('.relay-options-body');
      if (!body || body.closest('#titlePanel') !== panel) return;
      attachBody(body);

      if (body.scrollHeight <= body.clientHeight + 1) return;

      const delta = normalizeWheelDelta(event, body);
      if (!delta) return;

      const before = body.scrollTop;
      const next = clampScrollTop(body, before + delta);
      if (Math.abs(next - before) < 0.01) return;

      body.scrollTop = next;
      state.scrollTop = next;
      event.preventDefault();
    };

    panel.addEventListener('wheel', onWheel, { capture: true, passive: false });
    window.addEventListener('resize', scheduleFit, { passive: true });
    window.addEventListener('orientationchange', scheduleFit, { passive: true });

    state.observer = new MutationObserver(mutations => {
      if (mutations.some(mutation => mutation.type === 'childList')) {
        rememberScroll(state.body);
        scheduleFit();
      }
    });
    state.observer.observe(panel, { childList: true, subtree: true });

    if ('ResizeObserver' in window) {
      state.resizeObserver = new ResizeObserver(scheduleFit);
      state.resizeObserver.observe(panel);
    }

    panels.set(panel, state);
    scheduleFit();
    return state;
  };

  const sync = () => {
    const panel = getPanel();
    if (!panel) return;
    const state = bindPanel(panel);
    const body = fitPanel(panel);
    if (!body) return;
    if (state.body !== body) {
      if (state.body) state.scrollTop = state.body.scrollTop;
      state.body = body;
      body.addEventListener('scroll', () => { state.scrollTop = body.scrollTop; }, { passive: true });
    }
    body.scrollTop = clampScrollTop(body, state.scrollTop);
  };

  const boot = () => {
    sync();

    const titlePanel = document.getElementById('titlePanel');
    if (titlePanel) {
      new MutationObserver(sync).observe(titlePanel, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    document.addEventListener('relay-open-home-options', () => {
      window.requestAnimationFrame(sync);
      window.setTimeout(sync, 50);
      window.setTimeout(sync, 150);
    }, { passive: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
