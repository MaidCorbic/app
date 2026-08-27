// UPDATE 09 FINAL RUNTIME BRIDGE
// Loaded last from relay-ui-init.js, after the existing gameplay wrappers.
// UPDATE 11 adds the universal finish relay tower without replacing existing state systems.
// UPDATE 23 adds the secret-cache interaction extension without replacing the existing secret system.
// UPDATE 24 adds missing world gameplay interactions without new HUD/state owners.
//
// IMPORTANT: world-interaction-v1.js is imported below and is the single owner of
// setupWorldInteraction/updateWorldInteraction. This bridge must not run those
// functions a second time, because doing so doubles per-frame work and can cause
// duplicate world-interaction side effects.
import { RunnerScene } from './src/scenes/RunnerScene.js';
import './finish-tower-v1.js';
import './world-interaction-v1.js';
import './secret-cache-interaction-v1.js';
import './world-gameplay-expansion-v1.js';

if (!window.__relayWorldInteractionRuntimeV2) {
  window.__relayWorldInteractionRuntimeV2 = true;

  // V1 already owns the actual RunnerScene create/update hooks. V2 only adds the
  // bridge notification used by consumers that need to know when the scene exists.
  if (!RunnerScene.prototype.__worldInteractionRuntimeV2ReadyPatched) {
    const originalCreate = RunnerScene.prototype.create;

    if (typeof originalCreate === 'function') {
      RunnerScene.prototype.create = function worldInteractionRuntimeV2ReadyCreate(...args) {
        const result = originalCreate.apply(this, args);
        try {
          window.__relayRunnerScene = this;
          window.dispatchEvent(new CustomEvent('relay:runner-scene-ready', { detail: { scene: this } }));
        } catch (error) {
          console.error('[Relay Runner] Runner scene ready bridge failed:', error);
        }
        return result;
      };
    }

    RunnerScene.prototype.__worldInteractionRuntimeV2ReadyPatched = true;
  }
}
