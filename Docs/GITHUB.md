# GitHub workflow

Public source repository: https://github.com/RuffleRick/Muse-Discover

Publishing source does not publish the running Muse app or its private library. The local app still binds only to localhost. The hosted site's access settings are separate.

## Update policy

The owner authorizes committing and pushing completed feature and fix updates to this project's GitHub origin. For each change:

1. Implement the requested work and run appropriate checks.
2. Update relevant docs and the changelog.
3. Review the diff and staged files. Exclude personal data, secrets, recordings, logs, and generated dependencies.
4. Commit only the related work with a clear message.
5. Push to origin and verify the pushed commit matches the local commit.
6. Report what changed, validation, and any push failure.

This is a workflow for future project work, not a background file watcher. Uncommitted edits are not automatically published. If authentication is unavailable, preserve local work and report the blocker. Do not force-push or overwrite someone else's changes.

## Excluded content

- `local-muse/data/`: personal ideas, pins, notes, source cache, logs.
- `local-muse/setup/`: machine-specific installer/startup files.
- `.env*`, key files, tool state, dependencies, and generated build output.
- `muse-app/public/muse-tour*`: private screen-tour media and player.
- `muse-app/.openai/`: this installation's hosting configuration.

The private hosted source snapshot requires its own authorized hosting configuration before deployment. Never infer website publishing authorization from a GitHub push request.

## Local launch

Use `Start Muse.cmd` on this PC. Model files and the Ollama runtime are installed separately and are not downloaded by cloning the repository. Other users must provide their own runtime/model installation; this repository is not yet a standalone installer.
