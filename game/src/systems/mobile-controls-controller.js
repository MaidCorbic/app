// DEPRECATED COMPATIBILITY SHIM
// Mobile input has a single owner: mobile-input-single-owner-v1.js.
// This module intentionally installs no listeners or DOM replacements.
// Keeping the file prevents stale imports from reintroducing a second input owner.

if (!window.__relayMobileControlsControllerDeprecated) {
  window.__relayMobileControlsControllerDeprecated = true;
}
