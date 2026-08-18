# Gameplay Event HUD V3

Presentation-only HUD layer positioned directly below the existing Signal HUD.

## Compatibility contract

This update preserves the previous Relay Runner systems and does **not** replace or duplicate ownership of:

- Signal count / Signal progression
- combo state
- score / XP
- mission completion
- save state / player progression
- existing gameplay controls
- existing pause/settings HUD
- existing gameplay wrappers

Signal pickup feedback remains excluded because the existing Signal HUD already owns that presentation.

## Live gameplay events

The HUD listens to the existing Phaser game event bus when the RunnerScene becomes ready, and also keeps the existing DOM telemetry fallback:

- checkpoint secured/restored
- chase / warning / hostile activity
- damage / recovery / critical health
- low energy
- combat combo
- movement actions
- equipment deployment
- sector transitions
- tutorial / radio transmissions
- mission completion / run interruption

## Visual design

`gameplay-event-hud-v2.css` is now imported directly by `relay-ui-init.js`, so the HUD styling is part of the Vite game bundle rather than depending on a runtime stylesheet `<link>`.

The visual layer includes:

- glass/metal gaming panel
- neon category states
- animated scan sweep
- tactical grid texture
- corner brackets
- event icon treatment
- live duration meter
- glow and depth shadows
- desktop/mobile/landscape responsive layout
- reduced-motion fallback

## Update continuity

The V3 implementation builds on the previous V2 files instead of replacing their functionality. The final `world-interaction-runtime-v2.js` bridge now emits `relay:runner-scene-ready`, allowing the HUD to attach to the actual RunnerScene Phaser event bus without changing the existing gameplay architecture.
