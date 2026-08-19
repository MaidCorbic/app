# UPDATE 11 — Dynamic World Mechanics

This update adds a small, isolated world-mechanics layer for RunnerScene.

## Included
- Power Switch → linked Security Gate
- Cargo Lift → deterministic vertical movement
- Destructible Prop → lightweight reactive object
- Shared `E / TAP` interaction for keyboard and touch
- Scene teardown cleanup
- No new physics bodies
- No changes to existing platforms, barriers, movement, weapons, upgrades, checkpoints, or mobile controls

## Safety model
The mechanics are display-object driven and use existing RunnerScene geometry only as placement hints. They do not replace or mutate existing gameplay geometry. Interaction is gated by distance and a short cooldown. The system is cleaned up on scene shutdown.

## Compatibility
Desktop keyboard: `E`
Mobile/web touch: `E / TAP` button
Reduced-motion CSS is respected.
