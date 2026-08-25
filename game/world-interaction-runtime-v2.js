// UPDATE 09 FINAL RUNTIME BRIDGE
// Loaded last from relay-ui-init.js, after the existing gameplay wrappers.
// UPDATE 11 adds the universal finish relay tower without replacing existing state systems.
// UPDATE 23 adds the secret-cache interaction extension without replacing the existing secret system.
import { RunnerScene } from './src/scenes/RunnerScene.js';
import './finish-tower-v1.js';
import { setupWorldInteraction, updateWorldInteraction } from './world-interaction-v1.js';
import './secret-cache-interaction-v1.js';

if (!window.__relayWorldInteractionRuntimeV2) {
  window.__relayWorldInteractionRuntimeV2 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  if (typeof originalCreate === 'function') {
    RunnerScene.prototype.create = function worldInteractionFinalCreate(...args) {
      const result = originalCreate.apply(this, args);
      try {
        setupWorldInteraction(this);
        window.__relayRunnerScene = this;
        window.dispatchEvent(new CustomEvent('relay:runner-scene-ready', { detail: { scene: this } }));
      } catch (error) {
        console.error('[Relay Runner] World interaction setup failed:', error);
      }
      return result;
    };
  }

  if (typeof originalUpdate === 'function') {
    RunnerScene.prototype.update = function worldInteractionFinalUpdate(...args) {
      const result = originalUpdate.apply(this, args);
      try {
        updateWorldInteraction(this);
      } catch (error) {
        console.error('[Relay Runner] World interaction update failed:', error);
      }
      return result;
    };
  }
}
