# Gameplay Event HUD V2

Presentation-only HUD layer positioned directly below the existing Signal HUD.

It intentionally does **not** own Signal count, progression, combo state, save state, mission completion, or gameplay logic.

The HUD reacts to existing realtime gameplay output already rendered by the game UI:

- checkpoint secured/restored
- secret/discovery events
- chase, security and hostile alerts
- damage / health events
- ability and equipment readiness/deployment
- combat and weapon events
- sector transitions
- mission completion and route interruption

Signal pickup feedback is excluded because the existing Signal HUD already owns that presentation.

Files:
- `gameplay-event-hud-v2.css` — responsive gaming presentation.
- `gameplay-event-hud-v2.js` — realtime presentation controller.
