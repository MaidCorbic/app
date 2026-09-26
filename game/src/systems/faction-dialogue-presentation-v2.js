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

    // Mobile: tapping the faction card dismisses the encounter immediately.
    // Desktop keeps the explicit NEXT / keyboard controls.
    panel.addEventListener('pointerup', event => {
      if (event.pointerType !== 'touch') return;
      if (event.target?.closest?.('[data-faction-next]')) return;

      event.preventDefault();
      event.stopPropagation();

      const scene = window.__relayRunnerScene;
      scene?.skipFactionDialogue?.();
    }, { passive: false });
  };

  const scan = () => {
    document.querySelectorAll('.relay-faction-dialogue').forEach(watchPanel);
  };

  // Keep the observer cheap: faction panels are mounted directly on <body>,
  // so only react to newly-added nodes instead of rescanning the entire DOM
  // on every HUD/style mutation.
  let scanFrame = 0;

  const observer = new MutationObserver(mutations => {
    let needsScan = false;

    for (const mutation of mutations) {
      if (mutation.type !== 'childList' || !mutation.addedNodes.length) continue;

      for (const node of mutation.addedNodes) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node.matches?.('.relay-faction-dialogue') ||
            node.querySelector?.('.relay-faction-dialogue'))
        ) {
          needsScan = true;
          break;
        }
      }

      if (needsScan) break;
    }

    if (!needsScan || scanFrame) return;

    scanFrame = requestAnimationFrame(() => {
      scanFrame = 0;
      scan();
    });
  });

  observer.observe(document.body, { childList: true });
  scan();
})();
