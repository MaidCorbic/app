/* Continue / refresh recovery: defensive only, does not replace mission flow. */
(() => {
  if (window.__relayContinueRuntimeRecoveryV1) return;
  window.__relayContinueRuntimeRecoveryV1 = true;

  const intro = () => document.getElementById('intro');
  const runner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const resetInput = () => {
    document.querySelectorAll('.mobile-joystick').forEach(node => {
      node.classList.remove('is-active');
      const thumb = node.querySelector('.mobile-joystick-thumb');
      if (thumb) thumb.style.transform = 'translate(0,0)';
    });
    try { window.dispatchEvent(new Event('relay:mobile-input-reset')); } catch {}
    try { window.game?.events?.emit?.('mobile-move', null); } catch {}
  };
  const clearBlockers = () => {
    document.body.classList.remove('relay-training-active','relay-cinematic-active');
    document.querySelectorAll('#relayTutorialOnboardingV3,#relayTutorialOnboardingV2,#relayGameplayIntroFinalV2').forEach(node => {
      if (node) { node.hidden = true; node.classList.add('hidden'); }
    });
  };
  const recover = () => {
    const scene = runner();
    resetInput();
    clearBlockers();
    try { scene?.scene?.resume?.(); } catch {}
    try { scene?.physics?.world?.resume?.(); } catch {}
    try { scene?.input?.keyboard?.enabled !== undefined && (scene.input.keyboard.enabled = true); } catch {}
    try { scene?.input?.enabled !== undefined && (scene.input.enabled = true); } catch {}
    try { window.game?.canvas?.focus?.(); } catch {}
    window.dispatchEvent(new CustomEvent('relay:continue-recovered',{detail:{active:!!scene,at:Date.now()}}));
  };
  const arm = button => {
    if (!button || button.dataset.continueRecoveryBound === '1') return;
    button.dataset.continueRecoveryBound = '1';
    button.addEventListener('click', () => {
      if (button.disabled) return;
      button.disabled = true;
      button.setAttribute('aria-busy','true');
      resetInput();
      clearBlockers();
      // Let the original mission handler run first, then repair only stale input/scene state.
      [0,80,260,650].forEach(delay => setTimeout(recover, delay));
      setTimeout(() => {
        if (!button.isConnected) return;
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }, 800);
    }, true);
  };
  const bind = () => ['start','continue'].forEach(id => arm(document.getElementById(id)));
  bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow', event => {
    // BFCache and refresh restore can leave a stale pressed/touch state.
    if (event.persisted || performance.getEntriesByType?.('navigation')?.[0]?.type === 'reload') resetInput();
  },{passive:true});
  window.addEventListener('relay:runner-scene-ready',recover,{passive:true});
})();
