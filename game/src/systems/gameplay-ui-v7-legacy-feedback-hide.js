/* RUNNER RELAY — GAMEPLAY UI V7 LEGACY FEEDBACK HIDE
 * Presentation-only cleanup for legacy gameplay feedback.
 * Does not alter gameplay, progression, save state, audio or input ownership.
 */
(() => {
  'use strict';

  if (window.__relayGameplayUiV7LegacyFeedbackHide) return;
  window.__relayGameplayUiV7LegacyFeedbackHide = true;

  const HIDDEN = new WeakSet();
  const TEXT_RE = /DYNAMIC\s+CROWD|CROWD\s+FEEDBACK|DYNAMIC\s+FEEDBACK|CHECKPOINT\s+SECURED|RESPAWN\s+LINK\s+ACTIVE|MISSION\s+INTELLIGENCE|LIVE\s+MISSION\s+INTEL|^V10\b|^ALT\+Q\s*\/\s*W\s*\/\s*E\b/i;

  const hideNode = node => {
    if (!node || HIDDEN.has(node)) return;
    try {
      node.setVisible?.(false);
      node.setAlpha?.(0);
      node.disableInteractive?.();
      HIDDEN.add(node);
    } catch {}
  };

  const inspect = node => {
    if (!node) return false;

    const text = typeof node.text === 'string'
      ? node.text.trim()
      : '';

    let matched = Boolean(text && TEXT_RE.test(text));

    if (Array.isArray(node.list)) {
      const childTexts = [];
      for (const child of node.list) {
        if (typeof child?.text === 'string') {
          childTexts.push(child.text.trim());
        }
        if (inspect(child)) matched = true;
      }
      if (!matched && childTexts.length) {
        matched = childTexts.some(value => TEXT_RE.test(value));
      }
    }

    if (matched) {
      hideNode(node.parentContainer?.setVisible ? node.parentContainer : node);
    }

    return matched;
  };

  const scan = () => {
    const scene = window.__relayRunnerScene;
    if (scene?.children?.list) {
      for (const child of scene.children.list) inspect(child);
    }

    document
      .querySelectorAll(
        '#play #toast,' +
        '#play #gameplayEventHud,' +
        '#play .gameplay-event-hud,' +
        '#play [data-dynamic-crowd],' +
        '#play [data-debug-hud],' +
        '#play [data-relay-debug-hud],' +
        '#play .relay-debug-hud,' +
        '#play .gameplay-debug-hud,' +
        '#play [class*="dynamic-crowd"],' +
        '#play [id*="dynamic-crowd"]'
      )
      .forEach(node => {
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('visibility', 'hidden', 'important');
        node.style.setProperty('opacity', '0', 'important');
        node.style.setProperty('pointer-events', 'none', 'important');
      });
  };

  scan();
  window.setInterval(scan, 180);
})();
