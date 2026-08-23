# Repo-wide cleanup report

Safe cleanup is limited to modules proven unused by active-reference search. Legacy-looking files are retained unless replacement and non-use are established.

## Audit findings
- `game/gameplay-new-layer-v1.js`: no active import/reference found; v2 is referenced by `relay-ui-init.js` and has dedicated tests. Marked for safe removal pending final tree write.
- `game/src/systems/dynamic-world-mechanics-v1.js`: no active import/reference found; v2 is referenced by `relay-ui-init.js`. Marked for safe removal pending final tree write.

## Intentionally retained
- Tutorial files with active imports in `relay-ui-init.js`.
- Gameplay/world v1/v2 files where a direct reference audit did not prove the older file dead.
- Files named `final`, `fix`, or `v1` when they may still provide side-effect behavior.

## Rule
A legacy-looking filename is not sufficient evidence for deletion. Removal requires no active import/reference or a verified replacement.

## Verification still required
- npm build
- browser smoke/E2E
- console/runtime error scan
- mobile/desktop UI flow
- gameplay mission lifecycle

No merge to `main` is part of this cleanup.
