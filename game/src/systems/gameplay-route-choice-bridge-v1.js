// RUNNER RELAY — GAMEPLAY ROUTE CHOICE BRIDGE V1
// Connects the existing visible SAFE/HOT controls to the route gameplay layer.
// Uses delegated DOM events so no HUD markup ownership or RunnerScene.update patch is added.

function emitRouteChoice(route) {
  if (!['safe', 'hot'].includes(route)) return;
  const scene = window.__relayRunnerScene;
  try {
    window.dispatchEvent(new CustomEvent('relay:gameplay-variety-route-choice', {
      detail: { scene, route }
    }));
  } catch (error) {
    console.warn('[GameplayRouteChoiceBridgeV1] dispatch skipped', error);
  }
}

document.addEventListener('click', event => {
  const button = event.target?.closest?.('[data-route]');
  // The canonical variety HUD already emits relay:variety-route from its own
  // button handler. Do not dispatch the same choice a second time here.
  if (!button || button.closest?.('#relayGameplayVariety')) return;
  emitRouteChoice(button.dataset.route);
}, { passive: true });
