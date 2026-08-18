// UPDATE 08 — Audio cleanup
// The previous procedural menu loop was intentionally removed because its
// synthetic melody was not part of the gameplay experience and sounded harsh.
// Keep the public API as a no-op compatibility shim so existing callers cannot break.
(() => {
  if (window.__relayMenuMusicInstalled) return;
  window.__relayMenuMusicInstalled = true;
  const noop = () => {};
  window.relayMenuMusic = { start: noop, stop: noop };
})();
