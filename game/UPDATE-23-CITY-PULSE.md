# UPDATE 23 — CITY PULSE // FULL IMPLEMENTATION

City Pulse adds a non-physical timing layer to active gameplay missions.

## Player loop

1. Three Pulse Gates appear only after the tutorial/cinematic state is clear.
2. Each gate cycles through `WARNING → OPEN → CLOSED`.
3. Crossing a gate during the open window produces `FLOW SYNC`.
4. Three successful gates in sequence produce `PERFECT FLOW`.
5. Missing a window resets the flow streak but does not block the route, damage the player, change mission state, or alter player physics.

## Safety boundaries

- No new physics bodies.
- No changes to movement or dash.
- No barrier ownership.
- No save/progression writes.
- No Cargo, Signals, City Response or Collapse state mutation.
- Hidden during tutorial and cinematic states.
- Scene listeners and visual objects are cleaned up through Relay Runtime Kernel lifecycle hooks.
- Mission positions are authored by a fixed mission map; no nearest-object discovery is used.

## Debug

```js
window.__relayCityPulseDebug()
```

```js
window.__relayCityPulseReset()
```

## Events

- `relay:city-pulse-flow`
- `relay:city-pulse-missed`

## Test

```bash
npm run test:city-pulse
npm run test:runtime-kernel
npm run test:collapse-protocol
npm run test:gameplay-smoke
```
