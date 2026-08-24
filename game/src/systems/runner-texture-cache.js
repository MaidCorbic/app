// One-time cache guard for procedural RunnerScene textures.
const installRunnerTextureCache = scene => {
  if (!scene?.textures || scene.__relayRunnerTextureCacheInstalled) return;
  scene.__relayRunnerTextureCacheInstalled = true;
  scene.__relayRunnerEnsureTexture = (key, width, height, draw) => {
    if (scene.textures.exists(key)) return scene.textures.get(key);
    const g = scene.add.graphics({ x:0, y:0 });
    draw?.(g, width, height);
    const texture = g.generateTexture(key, width, height);
    g.destroy();
    return texture;
  };
};
window.addEventListener('relay:runner-scene-ready', event => installRunnerTextureCache(event.detail?.scene));
export { installRunnerTextureCache };
