# Runner Relay — Update / Ownership Audit

Base audited: `main` at commit `9fedf8ff0023ae62d333e5473059b31813c15878`.

This document maps the current runtime ownership so future updates do not create a second owner for the same feature.

## 1. Latest Update / title-screen update panel

- `game/faq.js` — authoritative content for FAQ and `LATEST_UPDATE` copy.
- `game/update-ui.css` — presentation only for the update panel.
- `game/relay-ui-init.js` — opens/closes the panel and renders `LATEST_UPDATE`.
- `game/index.html` — owns the static launcher button and panel shell.

Status: **wired**. Do not create a second update-content source in another UI module.

## 2. Enemy Awareness update

- `game/src/systems/enemy-ai-awareness-v1.js` — enemy awareness behavior: platform detection, sight checks, patrol/chase behavior, smooth velocity, difficulty scaling.
- `game/src/feature-runtime.js` — authoritative feature installer; imports and installs `installEnemyAIAwareness`.
- `game/src/systems/core-stability.js` — imports `../feature-runtime.js`, so the feature-runtime installer is loaded through the live stability entrypoint.
- `game/relay-ui-init.js` — presentation/runtime integration hub; it must not become a second owner for enemy AI.

Status: **wired**. Keep AI ownership in `enemy-ai-awareness-v1.js` + `feature-runtime.js`.

## 3. Core gameplay authority

- `game/src/scenes/RunnerScene.js` — canonical Phaser scene/gameplay state.
- `game/src/systems/core-stability.js` — safety wrapper around scene lifecycle, invalid/re-entrant transitions, keyboard recovery, fall/physics recovery.
- `game/src/systems/runtime-authority-v1.js` — runtime invariants / authority checks; it must not replace gameplay state.
- `game/src/systems/gameplay-runtime-stability-v3.js` — gameplay runtime stabilization.

Rule: new gameplay features should extend the scene or use an isolated installer/patch; they should not create a parallel mission/save/progression owner.

## 4. Missions / progression / save

- `game/src/missions.js` — mission definitions/catalog.
- `game/src/state.js` — canonical persisted progression/state.
- `game/src/campaign.js` — campaign chapter metadata.
- `game/src/upgrades.js` — upgrades/build items/gadgets/weapons definitions.
- `game/src/packages.js` — package/cargo definitions.
- `game/src/modifiers.js` — gameplay modifiers.

Rule: UI modules may read these sources but should not create duplicate persistence or progression stores.

## 5. Mobile input

- `game/src/systems/mobile-input-single-owner-v1.js` — canonical touch action + joystick input owner.
- `game/src/systems/mobile-gameplay-stability-v1.js` — mobile gameplay safety/stability layer.
- `game/src/systems/mobile-viewport-hardening.js` — viewport/orientation synchronization only.
- `game/src/systems/viewport-sync.js` — legacy viewport controller; it must not be activated alongside the hardening controller.

Current code still contains legacy joystick boot code in `game/src/main.js`, but `mobile-input-single-owner-v1.js` replaces those DOM nodes before attaching its own handlers. This is legacy code, not a second active joystick owner; remove it only in a dedicated cleanup PR after browser regression tests.

## 6. Desktop / keyboard input

- `game/src/main.js` — browser bootstrap plus existing keyboard/audio/UI wiring.
- `game/src/systems/core-stability.js` — repairs missing Phaser keyboard references on non-primary-touch devices.

Rule: do not duplicate keyboard mappings in presentation modules.

## 7. Audio

- `game/src/main.js` — existing procedural home/game audio bed and feedback tones.
- `game/src/systems/audio-context-gesture-gate-v1.js` — gesture/audio-context safety.
- `game/gameplay-audio-start-v2.js` — gameplay audio startup integration.
- `game/audio-feedback-v2.js` — contextual one-shot gameplay feedback.
- `game/adaptive-music-v1.js` — adaptive procedural music.

Rule: each module owns a distinct audio role; do not add a second global audio bed.

## 8. Home / title / update UI

- `game/index.html` — static DOM shells.
- `game/home-v3.js` + `game/home-v3-guard.js` + `game/home-v3-interaction-fix.js` — title/home interaction and safeguards.
- `game/home-options.js` / `game/unified-options-ui-v1.js` — title options/controls panel.
- `game/relay-ui-init.js` — update/FAQ panel plus broad gameplay feature bootstrap imports.

Risk: this is the highest-density integration area. New title-screen features should first check whether an existing owner already handles the same element.

## 9. HUD / presentation

- `game/gameplay-event-hud-v2.js` + `.css` — event HUD.
- `game/gameplay-hud-polish-v1.css` — visual polish.
- `game/presentation-final-v1.js` — presentation cleanup/layout only.
- `game/relay-final-layout-v2.js` — final layout rules.
- `game/gameplay-home-hud-safe-v2.js` — HUD/home safety integration.

Rule: presentation files should not mutate gameplay state or become alternate mission/progression owners.

## 10. Release metadata

This audit branch adds `game/src/config/release.js` as a single source of truth for visible release metadata. The existing UI currently displays version `1.1.0`; future updates should change the central metadata value rather than introducing another hardcoded version string.

## 11. Safe-change policy

Before changing a system:

1. Find its current owner.
2. Reuse its state/events/API.
3. Add one isolated change.
4. Run the existing targeted contract test.
5. Run the full hardening suite before release.

No gameplay core rewrite is required by this audit.
