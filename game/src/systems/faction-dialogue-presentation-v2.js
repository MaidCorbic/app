/* Faction dialogue presentation V2.
 * Presentation-only enhancer. Does not change dialogue sequencing or gameplay state.
 */
(() => {
  'use strict';

  if (window.__relayFactionDialoguePresentationV2) return;
  window.__relayFactionDialoguePresentationV2 = true;

  const KEYWORDS = new Set([
    'COURIER', 'RELAY', 'SIGNAL', 'TARGET', 'ROUTE', 'STORM', 'LOCKDOWN',
    'NETWORK', 'TOWER', 'GATE', 'CARRIER', 'INTERCEPTOR', 'PERIMETER',
    'DROP', 'DROPLANE', 'CITYSPINE', 'FINAL', 'APEX'
  ]);

  const escapeHtml = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const highlightText = value => {
    const safe = escapeHtml(value);
    return safe.replace(/\b[A-Z][A-Z-]{2,}\b/gi, token => {
      return KEYWORDS.has(token.toUpperCase())
        ? `<span class="relay-faction-keyword">${token}</span>`
        : token;
    });
  };

  const decorate = element => {
    if (!element || element.dataset.factionDecorated === '1') return;
    const raw = element.textContent?.trim();
    if (!raw) return;
    const html = highlightText(raw);
    if (element.innerHTML === html) return;
    element.innerHTML = html;
    element.dataset.factionDecorated = '1';
  };

  const pending = new WeakMap();

  const watchPanel = panel => {
    if (!panel || panel.dataset.presentationV2 === '1') return;
    panel.dataset.presentationV2 = '1';

    const text = panel.querySelector('.relay-faction-text');
    if (!text) return;

    const observer = new MutationObserver(() => {
      text.dataset.factionDecorated = '0';
      window.clearTimeout(pending.get(text));
      pending.set(text, window.setTimeout(() => decorate(text), 90));
    });

    observer.observe(text, { childList: true, characterData: true, subtree: true });
    panel.addEventListener('animationend', () => decorate(text), { passive: true });
  };

  const scan = () => {
    document.querySelectorAll('.relay-faction-dialogue').forEach(watchPanel);
  };

  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
  scan();
})();
