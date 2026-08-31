/* Relay Runner — Competitive Plus / Subtle Neon runtime hooks.
 * Presentation-only. Adds feedback classes from existing gameplay events when available.
 */
(() => {
  'use strict';
  const root = () => document.querySelector('#game #play');
  const pulse = (kind='is-cyan') => {
    const r = root(); if (!r) return;
    let el = r.querySelector('.cp-feedback-pulse');
    if (!el) { el = document.createElement('div'); el.className = 'cp-feedback-pulse'; r.appendChild(el); }
    el.className = `cp-feedback-pulse ${kind}`;
    void el.offsetWidth;
    setTimeout(() => { if (el) el.className = 'cp-feedback-pulse'; }, 520);
  };
  const flashAction = (name) => {
    const r = root(); if (!r) return;
    const b = r.querySelector(`[data-mobile-action="${name}"]`);
    if (!b) return;
    b.classList.remove('cp-feedback'); void b.offsetWidth; b.classList.add('cp-feedback');
    setTimeout(() => b.classList.remove('cp-feedback'), 300);
  };
  const markSignal = () => { root()?.querySelector('.hud-progress')?.classList.add('cp-active'); pulse('is-cyan'); setTimeout(() => root()?.querySelector('.hud-progress')?.classList.remove('cp-active'), 360); };
  const markObjective = () => { root()?.querySelector('.world-marker')?.classList.add('cp-alert'); pulse('is-amber'); setTimeout(() => root()?.querySelector('.world-marker')?.classList.remove('cp-alert'), 500); };
  document.addEventListener('relay:signal', markSignal);
  document.addEventListener('relay:objective', markObjective);
  document.addEventListener('relay:damage', () => pulse('is-red'));
  document.addEventListener('relay:xp', () => { root()?.querySelector('.hud-xp')?.classList.add('cp-gain'); setTimeout(() => root()?.querySelector('.hud-xp')?.classList.remove('cp-gain'), 520); });
  document.addEventListener('relay:action', e => { const n = e?.detail?.action; if (n) flashAction(n); });
})();
