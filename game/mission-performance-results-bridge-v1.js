// UPDATE 12 FIX — deterministic Performance → Results bridge.
// This bridge is additive: it does not own gameplay or alter existing DOM structure.

(() => {
  if (window.__missionPerformanceResultsBridgeV1) return;
  window.__missionPerformanceResultsBridgeV1 = true;

  const finalize = scene => {
    const api = window.__missionFlowPerformanceV1;
    if (!api?.finalize || !scene?.mission?.id) return null;
    try {
      return api.finalize(scene) || api.latest || null;
    } catch (error) {
      console.error('[Relay Runner] Performance V1 finalize failed.', error);
      return null;
    }
  };

  const refresh = () => {
    const finish = document.getElementById('finish');
    const scene = window.__relayRunnerScene;
    if (!finish || finish.classList.contains('hidden') || !scene?.finished) return;

    const result = finalize(scene);
    if (!result) return;

    // mission-results.js listens for this event and rebuilds only its own panel.
    window.dispatchEvent(new CustomEvent('relay:mission-performance-complete', { detail: result }));
  };

  window.addEventListener('relay:mission-complete', event => {
    const scene = event?.detail?.scene || window.__relayRunnerScene;
    const result = finalize(scene);
    if (result) {
      window.dispatchEvent(new CustomEvent('relay:mission-performance-complete', { detail: result }));
    }
  });

  const finish = document.getElementById('finish');
  if (finish) {
    new MutationObserver(() => window.requestAnimationFrame(refresh)).observe(finish, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }
})();
