# Mobile Controls Validation

The controller owns the existing `.mobile-controls` DOM after startup and replaces the nodes once so listeners previously attached by `main.js` and `core-stability.js` are removed. The replacement is then given one joystick handler and one action-button handler.

Expected states:
- Home / options / loading: controls hidden.
- Rotate prompt: controls hidden.
- Gameplay: controls visible on touch devices.
- Pause / preflight / finish / game over: controls hidden.
- Resume: controls return.

Expected action labels on mobile:
- JUMP — SPACE
- FIRE — E
- SWORD — Q
- DASH — SHIFT
- BUILD — 1
- BUILD — 2
- GEAR — 3
- GEAR — 4

The viewport/canvas files are intentionally not changed by this fix.
