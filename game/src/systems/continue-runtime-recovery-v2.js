/* CONTINUE / REFRESH RECOVERY V2
   Never clears active tutorial/cinematic UI from a scene-ready event.
   Only repairs stale input/physics when the user explicitly starts/continues a run or reloads. */
(() => {
  'use strict';
  if (window.__relayContinueRuntimeRecoveryV2) return;
  window.__relayContinueRuntimeRecoveryV2 = true;

  const runner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const trainingActive = () => document.body.classList.contains('relay-training-active');
  const cinematicActive = () => document.body.classList.contains('relay-cinematic-active');
  const pauseActive = () => !!document.querySelector('#pauseMenu:not(.hidden)');

  const resetInput = () => {
    document.querySelectorAll('.mobile-joystick').forEach(node => {
      node.classList.remove('is-active');
      const thumb = node.querySelector('.mobile-joystick-thumb');
      if (thumb) thumb.style.transform = 'translate(0,0)';
    });
    try { window.dispatchEvent(new Event('relay:mobile-input-reset')); } catch {}
    try { window.game?.events?.emit?.('mobile-move', null); } catch {}
  };

  const restoreRuntime = () => {
    const scene = runner();
    resetInput();
    try { scene?.scene?.resume?.(); } catch {}
    try { scene?.physics?.world?.resume?.(); } catch {}
    try { if (scene?.input?.keyboard) scene.input.keyboard.enabled = true; } catch {}
    try { if (scene?.input) scene.input.enabled = true; } catch {}
    try { window.game?.canvas?.focus?.(); } catch {}
    window.dispatchEvent(new CustomEvent('relay:continue-recovered',{detail:{active:!!scene,at:Date.now()}}));
  };

  const recover = () => {
    /* Tutorial/cinematic owns its blockers; recovery must not clear them. */
    if (trainingActive() || cinematicActive()) {
      resetInput();
      return;
    }
    restoreRuntime();
  };

  const arm = button => {
    if (!button || button.dataset.continueRecoveryV2Bound === '1') return;
    button.dataset.continueRecoveryV2Bound = '1';
    button.addEventListener('click', () => {
      if (button.disabled) return;
      button.disabled = true;
      button.setAttribute('aria-busy','true');
      resetInput();
      /* Original START/CONTINUE handlers own scene creation. Recovery runs after them. */
      [80,260,650,1000].forEach(delay => setTimeout(recover, delay));
      setTimeout(() => {
        if (!button.isConnected) return;
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }, 1200);
    }, true);
  };

  const bind = () => ['start','continue'].forEach(id => arm(document.getElementById(id)));
  bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener('pageshow', event => {
    if (event.persisted || performance.getEntriesByType?.('navigation')?.[0]?.type === 'reload') {
      resetInput();
      [0,120,360,720].forEach(delay => setTimeout(() => {
        if (!trainingActive() && !cinematicActive() && !pauseActive()) restoreRuntime();
      }, delay));
    }
  }, { passive:true });
})();
