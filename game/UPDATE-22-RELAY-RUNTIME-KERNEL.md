# UPDATE 22 — Relay Runtime Kernel

The kernel is an additive lifecycle/event adapter. Existing gameplay systems remain authoritative.

## Scope
- Central scene reference.
- Scene-ready lifecycle registration.
- Scene shutdown/destroy cleanup registry.
- Per-module event binding helpers.
- Runtime debug snapshot.

## Safety rule
Existing gameplay modules are not migrated in bulk. Each module should be moved only after its current behavior is covered by a regression test.
