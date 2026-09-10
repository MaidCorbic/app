/* RUNNER RELAY — SIGNAL HUD COLLECTION PROGRESS V1
 * Presentation-only bridge. The canonical gameplay signal counter remains authoritative.
 * No gameplay state, progression, save state, audio or input ownership is changed.
 */
(() => {
  'use strict';

  if (window.__relaySignalsHudCollectionProgressV1) return;
  window.__relaySignalsHudCollectionProgressV1 = true;

  const getNumber = element => {
    if (!element) return 0;
    const match = String(element.textContent || '').match(/\d+/);
    return match ? Number(match[0]) : 0;
  };

  const sync = () => {
    const root = document.getElementById('play');
    const count = document.getElementById('signalCount');
    const total = document.getElementById('signalTotal');
    const progress = document.getElementById('progress');

    if (!root || !count || !progress) return;

    const collected = Math.max(0, getNumber(count));
    const target = Math.max(collected, getNumber(total));
    const percent = target > 0
      ? Math.max(0, Math.min(100, Math.round((collected / target) * 100)))
      : 0;

    progress.style.width = `${percent}%`;
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '100');
    progress.setAttribute('aria-valuenow', String(percent));
    progress.dataset.signalProgress = String(percent);
  };

  const observe = () => {
    const count = document.getElementById('signalCount');
    const total = document.getElementById('signalTotal');
    if (!count && !total) return;

    const observer = new MutationObserver(sync);
    if (count) observer.observe(count, { childList: true, characterData: true, subtree: true });
    if (total) observer.observe(total, { childList: true, characterData: true, subtree: true });
    sync();
  };

  const boot = () => {
    observe();
    sync();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true, passive: true });
  } else {
    boot();
  }

  const bodyObserver = new MutationObserver(() => {
    const count = document.getElementById('signalCount');
    const total = document.getElementById('signalTotal');
    if (!count && !total) return;
    bodyObserver.disconnect();
    observe();
  });

  bodyObserver.observe(document.body, { childList: true, subtree: true });
})();
