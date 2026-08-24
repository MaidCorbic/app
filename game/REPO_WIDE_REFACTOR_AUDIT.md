# Repo-wide refactor audit

Branch: `refactor/full-code-cleanup`

## Scope
- Entry/bootstrap ownership
- CSS cascade and UI ownership
- Mobile input/runtime ownership
- Pause/settings event ownership
- Tutorial/gameplay layer duplication
- State/event duplication
- Legacy v1/v2/final/fix modules
- Build/test/browser verification

## Current decisions
- `mobile-controls-controller.js` is the authoritative mobile input owner.
- `mobile-controls-runtime-v2.js` and `mobile-controls-direct-input-v1.js` are removed from the active pipeline.
- `dash-mobile-input-v1.js` is removed from the active pipeline.
- Mobile HUD layout is owned by `mobile-hud-final-v1.css`.
- Pause styling is owned by `pause-ui-v1.css`.
- Pause behavior is owned by `pause-final-polish-v1.js`.

## Remaining audit before merge
1. Verify every removed module has no remaining direct import/reference.
2. Audit v1/v2/final modules by actual imports/callers, not filename.
3. Audit global `CustomEvent` names and duplicate emitters.
4. Audit DOM creators against elements already present in `index.html`.
5. Audit CSS selectors duplicated across `styles.css`, HUD, pause and tutorial layers.
6. Run build and browser verification before merge.

No gameplay system should be deleted solely because its filename contains `v1`, `v2`, `final`, or `fix`.
