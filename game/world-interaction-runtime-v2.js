// UPDATE 09 FINAL RUNTIME BRIDGE
// This module is loaded last from relay-ui-init.js, after the existing gameplay wrappers.
// It is the single final hook for World Interaction and does not replace any gameplay/state system.
import { RunnerScene } from './src/scenes/RunnerScene.js';
import { setupWorldInteraction, updateWorldInteraction } from './world-interaction-v1.js';

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
