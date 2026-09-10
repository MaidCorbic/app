# CSS ownership consolidation

The shared UI bootstrap is centralized in `relay-ui-init.js`.

- `canonical-ui-v1.css` is the shared visual authority for HUD, Home, Pause, Settings, overlays and touch layout.
- `cinematic-arrival-v2.js` owns only cinematic arrival behavior and its dedicated stylesheet.
- `release-final-ui-v1.css` remains a narrow mobile bottom-HUD layer and is intentionally loaded after the canonical shared layer.
- New global HUD/menu/touch override layers must not be introduced.
