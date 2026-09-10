# Branch cleanup policy

The Branch Value Cleanup workflow is intentionally conservative.

- Protected branches are always kept.
- Branches with open pull requests are always kept.
- A branch whose tip is already contained in `main` is removable.
- A branch with no unique patches versus `main` (including cherry-picked/squashed work) is removable.
- Branches with unique work are kept for manual review.
- Manual dispatch defaults to dry-run.
- Scheduled runs perform deletion for candidates.
