# UPDATE 22 — Repo-wide migration checklist

1. Load Relay Runtime Kernel before feature runtimes.
2. Migrate one subsystem at a time.
3. Preserve all existing global event names during migration.
4. Preserve existing authoritative owners for movement, barriers, mission state, save state, Cargo, Signals, and City Response.
5. Remove polling only after an equivalent scene-ready lifecycle hook is verified.
6. Run desktop + mobile + tutorial + finish regression after each migrated subsystem.
