# Gameplay New Layer V2

Vercel-safe replacement for the first draft gameplay feel layer.

The V2 module is browser-only and deliberately does not import Phaser or a scene class. It hooks into the existing DOM gameplay input surface and optional `relay:*` custom events.

It provides:
- Momentum Chain / Flow
- Near-Miss event hook
- Clutch window
- Micro Decision: Overdrive / Recovery
- Run Recap
- Personal ghost storage scaffold

The existing gameplay systems remain authoritative.
