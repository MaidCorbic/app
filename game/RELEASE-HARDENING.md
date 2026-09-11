# Relay Runner — Final Release Hardening

This checklist is the release gate for the public game build.

## P0 — must be resolved before public release

- [x] Wire `test:canonical-css` to the existing `tests/css-canonical-contract.mjs` contract.
- [x] Make `src/systems/mobile-input-single-owner-v1.js` the only mobile input owner. Remove the duplicate joystick/pointer dispatcher from `src/main.js`.
- [x] Consolidate CSS/runtime ownership in `relay-ui-init.js`. Do not add another `v1/v2/v3/final/polish` override layer.
- [x] Make `canonical-ui-v1.css` the single authority for HUD, Home, Pause, Settings, overlays and touch layout.
- [x] Reduce direct stylesheet loading in `index.html` to the intended canonical bootstrap dependencies.
- [x] Move the remaining stable behavior out of `vite.config.mjs`: `cargo` state access is source-owned by `cargo-integrity-v2.js`, RunnerScene zoom normalization is source-owned by `RunnerScene.js`, and obsolete runtime patchers are removed.

## P1 — public quality

- [ ] Run `npm run test:release-hardening` and require green CI.
- [ ] Run the production build and verify the generated `dist/` in desktop Chrome, Android Chrome and iOS Safari.
- [ ] Verify Pause → Resume, Missions, Progress and Settings do not leave Phaser paused or duplicate overlays.
- [ ] Verify touch controls have exactly one joystick owner and one action owner.
- [ ] Verify orientation prompt, safe-area insets and mobile HUD at 320px, 360px, 390px and 430px widths.
- [ ] Verify keyboard controls and touch controls produce identical gameplay actions.
- [ ] Verify progression persistence, retry, death, respawn, finish and reload flows.
- [ ] Verify no uncaught console errors during Home → Mission → Pause → Resume → Finish → Retry.

## P2 — cleanup

- [x] Fix the page title typo: `Rooftrop Game` → `Rooftop Game`.
- [ ] Confirm favicon/base paths against the final hosting base URL.
- [ ] Archive obsolete experimental `v1/v2/v3/final/hotfix` assets after dependency verification.
- [x] Keep `RunnerScene.js` gameplay-only and `state.js` as the canonical persistent progression owner.

## Release rule

Do not merge the release branch until all P0 items are complete and the release-hardening CI suite is green.
