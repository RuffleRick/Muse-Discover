# Current limitations and resolved issues

## Current limitations

- Reddit search snippets through Tavily are implemented but need the owner's free-plan API key for activation and live testing. Full Reddit threads are not collected. Snippets may be stale or truncated and do not establish need signals or repeated demand. The local 900-attempt meter does not cover other apps on the same provider account or verify its billing settings.
- Local and hosted libraries do not sync.
- Remote/mobile access is in progress, not complete. App-side Tailscale HTTPS and pairing are built, but installation is waiting for Windows administrator approval. PC/phone sign-in, HTTPS enablement, pairing, and a physical phone/cellular test remain. Resume when the user is at the home PC. Direct LAN/public access is not enabled.
- Codex kits use a fixed template. They do not independently verify feasibility or market demand.
- Small local-model outputs can still be overambitious or need editing.
- Collections and tags are not implemented. Export/import, local backup restoration, and saved idea-tree navigation are available.
- This project is inside OneDrive; personal state may sync according to existing OneDrive settings. Avoid running simultaneous app instances from synchronized copies.
- The Node launcher currently prefers the installed Codex runtime, with a PATH Node fallback. A standalone runtime package remains optional future work.

## Resolved on October 6, 2026

- Desktop Muse folder appeared empty because actual source was elsewhere: added launcher access.
- Original bright interface: applied centered Forest Room layout with Midnight colors; kept original-theme backup.
- Misleading "Ollama is not installed" after theme verification: restarted the app with normal filesystem access and added a distinct access-denied error. Verified three pinned-idea variations and model shutdown afterward.
- Empty project file browser: consolidated active source, personal state, theme backups, and documentation into the selected Muse-Discover project; redirected launchers.

- Quality checks reject some known failures but remain lexical and rule-based. Semantic constraint compliance and general feasibility need controlled model evaluation; the revised prompt has not been benchmarked through new generation.

- Need-signal detection is a first version based on phrases and word overlap. It can miss negation, sarcasm, paraphrases, and cross-sentence context, or flag wishes that already have good solutions. Repeated author identifiers are not verified independent people. The revised generation prompt still needs output-quality evaluation on explicit user rolls.
