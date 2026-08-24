import { RunnerScene } from '../scenes/RunnerScene.js';

// RunnerScene is intentionally registered once but can be started repeatedly.
// Phaser's TextureManager survives scene restarts, so procedural textures should
// only be generated on the first scene creation.
const originalCreateTextures = RunnerScene.prototype.createTextures;
if (!RunnerScene.prototype.__relayTextureCachePatched) {
  RunnerScene.prototype.__relayTextureCachePatched = true;
  RunnerScene.prototype.createTextures = function createTexturesCached() {
    if (this.textures?.exists('runner-idle')) return;
    return originalCreateTextures.call(this);
  };
}
