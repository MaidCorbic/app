// UPDATE 10.5 — CITY ATMOSPHERE CLEANUP
// Removes only the large central sky disk from the legacy dynamic-time presentation.
// No gameplay, platform, barrier, player, physics, input, or camera behavior is changed.

import { RunnerScene } from '../scenes/RunnerScene.js';

if (!window.__relayCityAtmosphereCleanupV1) {
  window.__relayCityAtmosphereCleanupV1 = true;

  const originalRender = RunnerScene.prototype.__renderRelayTime;

  if (typeof originalRender === 'function' && !originalRender.__relayCentralDiskRemoved) {
    const cleanRender = function cleanRelayTimeRender(progress) {
      const sky = this.__relaySky;
      if (!sky?.fillCircle) return originalRender.call(this, progress);

      const originalFillCircle = sky.fillCircle;
      sky.fillCircle = function skipLegacyCentralDisk() {
        // The old dynamic-time renderer used fillCircle() here for a large
        // atmospheric disk behind the city. Keep the sky, sun, moon and clouds;
        // remove only that distracting central disk.
        return this;
      };

      try {
        return originalRender.call(this, progress);
      } finally {
        sky.fillCircle = originalFillCircle;
      }
    };

    cleanRender.__relayCentralDiskRemoved = true;
    RunnerScene.prototype.__renderRelayTime = cleanRender;
  }
}
