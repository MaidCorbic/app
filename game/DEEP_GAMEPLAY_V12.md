# Deep Gameplay V12

V12 is the interaction layer connecting the gameplay expansions V1-V11 without replacing their controls.

## Runtime model
- Existing systems remain installed in their original order.
- V12 adds a shared persistent state for noise, tracking, heat, routes, mission mutation, cover, momentum, recovery, contacts, methods, cargo risk, emergency choices, opportunities, chain reactions, decoy cargo, loadout, time debt, and player markers.
- V11 actions feed V12 through the Phaser scene event bus.
- Player movement passively affects noise and momentum.
- Damage/alarm/mission/cargo events can feed heat, chain depth, and cargo risk.
- Pointer/touch is used for V12 interaction; no keyboard listeners are added.
- State persists locally and is cleaned up on scene shutdown.

## Design rule
V12 does not create a second control scheme. It deepens existing gameplay state and exposes choices through touch/pointer UI.
