/* Compatibility shim: splash lifecycle is owned exclusively by splash-loader-v2.js. */
(() => {
  if (window.__relayCinematicArrivalDisabled) return;
  window.__relayCinematicArrivalDisabled = true;
})();
