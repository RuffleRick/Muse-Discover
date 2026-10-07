# Muse project guidance

- The active product is `local-muse/`. Read `Docs/ARCHITECTURE.md` when changing service boundaries.
- Preserve the private library in `local-muse/data/`; do not replace it with fixtures or copy stale state from the old project.
- Start generation only on an explicit user roll or variation request. Stop Muse's owned model process after each request. Preserve local-only binding and no paid cloud fallback.
- `muse-app/` is the separate hosted site's source snapshot. Local requests do not authorize publishing or changing site sharing.
- Keep all current launchers pointing to this project. The old `C:\Users\richa\Muse` folder is a retained fallback, not the active source.
- Update relevant project docs after material changes. Do not claim checks passed unless they were run.
- The user authorizes ongoing GitHub updates: after completing an authorized feature or fix, run appropriate checks, update relevant docs, review the diff for personal data or secrets, then commit and push the related changes to the configured GitHub origin. Do not include unrelated edits, private library data, logs, credentials, or tour recordings. Report push failures rather than claiming the remote is updated. Do not force-push.
