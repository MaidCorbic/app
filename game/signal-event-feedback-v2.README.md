# Signal Event Feedback V2

This layer is intentionally presentation-only. It sits directly below the existing Signal HUD and reacts to the existing realtime event bus.

- `signal-event-feedback-v2.css` — responsive desktop/mobile presentation.
- `signal-event-feedback-v2.js` — event listener and transient state only.

Expected existing event payload: `{ amount, value, combo, relayCombo }` on `signal-collected` / `signalCollected`, or equivalent DOM/window relay events.

No Signal count, progression, save state, mission completion, or combo ownership is created here.
