/* Reliable pause-terminal input layer. Keep native click handling intact. */
(() => {
  const bind = () => {
    const pause = document.querySelector('#pauseMenu');
    const panel = pause?.querySelector('#panelContent');
    if (!pause || !panel) return;

    // Do not synthesize clicks or stop pointerup propagation here. The pause
    // menu already has delegated/native click handlers, and synthetic touch
    // clicks can race with those handlers and make a tab appear stuck.
    panel.addEventListener('pointerdown', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.matches('input[type="range"], select')) event.stopPropagation();
    }, { passive: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
