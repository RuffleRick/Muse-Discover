# Current limitations and resolved issues

## Current limitations

- Reddit is not connected; current public collection uses Hacker News and Stack Exchange.
- Local and hosted libraries do not sync.
- Access is local to this PC; mobile and LAN access are not enabled.
- Codex kits use a fixed template. They do not independently verify feasibility or market demand.
- Small local-model outputs can still be overambitious or need editing.
- No in-app export/import, collections, or persistent idea-tree view yet.
- This project is inside OneDrive; personal state may sync according to existing OneDrive settings. Avoid running simultaneous app instances from synchronized copies.
- The Node launcher currently prefers the installed Codex runtime, with a PATH Node fallback. A standalone runtime package remains optional future work.

## Resolved on October 6, 2026

- Desktop Muse folder appeared empty because actual source was elsewhere: added launcher access.
- Original bright interface: applied centered Forest Room layout with Midnight colors; kept original-theme backup.
- Misleading "Ollama is not installed" after theme verification: restarted the app with normal filesystem access and added a distinct access-denied error. Verified three pinned-idea variations and model shutdown afterward.
- Empty project file browser: consolidated active source, personal state, theme backups, and documentation into the selected Muse-Discover project; redirected launchers.
