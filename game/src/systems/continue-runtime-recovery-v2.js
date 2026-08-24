/* CONTINUE / REFRESH RECOVERY V3
   Recovery is intentionally minimal. It never clears tutorial/cinematic state
   and never repeatedly emits movement-stop events during normal scene startup. */
(() => {
  'use strict';
  if (window.__relayContinueRuntimeRecoveryV3) return;
  window.__relayContinueRuntimeRecoveryV3 = true;

  const runner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const trainingActive = () => document.body.classList.contains('relay-training-active');
  const cinematicActive = () => document.body.classList.contains('relay-cinematic-active');
  const pauseActive = () => !!document.querySelector('#pauseMenu:not(.hidden)');

  const resetTouchVisual = () => {
    document.querySelectorAll('.mobile-joystick').forEach(node => {
      node.classList.remove('is-active');
      const thumb = node.querySelector('.mobile-joystick-thumb');
      if (thumb) thumb.style.transform = 'translate(0,0)';
    });
  };

  const restoreRuntimeOnce = () => {
    const scene = runner();
    if (!scene || trainingActive() || cinematicActive() || pauseActive()) return false;
    resetTouchVisual();
    try { scene?.scene?.resume?.(); } catch {}
    try { scene?.physics?.world?.resume?.(); } catch {}
    try { if (scene?.input?.keyboard) scene.input.keyboard.enabled = true; } catch {}
    try { if (scene?.input) scene.input.enabled = true; } catch {}
    try { window.game?.canvas?.focus?.(); } catch {}
    window.dispatchEvent(new CustomEvent('relay:continue-recovered',{detail:{active:true,at:Date.now(),source:'refresh-v3'}}));
    return true;
  };

  const arm = button => {
    if (!button || button.dataset.continueRecoveryV3Bound === '1') return;
    button.dataset.continueRecoveryV3Bound = '1';
    button.addEventListener('click', () => {
      if (button.disabled) return;
      button.disabled = true;
      button.setAttribute('aria-busy','true');
      resetTouchVisual();
      window.setTimeout(restoreRuntimeOnce, 180);
      window.setTimeout(() => {
        if (!button.isConnected) return;
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }, 900);
    }, true);
  };

  const bind = () => ['start','continue'].forEach(id => arm(document.getElementById(id)));
  bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener('pageshow', event => {
    if (!(event.persisted || performance.getEntriesByType?.('navigation')?.[0]?.type === 'reload')) return;
    resetTouchVisual();
    window.setTimeout(restoreRuntimeOnce, 450);
  }, { passive:true });
})();