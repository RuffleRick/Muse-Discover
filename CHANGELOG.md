# Changelog

## October 7, 2026

- Added reliable-library organization: tags, multiple collections, and Idea/Shortlisted/Building/Completed/Parked statuses. Collapsed saved-view filters combine with text search, cards display labels, and the idea organizer preserves pinned snapshots, notes, and branch relationships. Organization is validated through exports/imports and backups; existing ideas need no migration. No model requests are made by organizing or filtering.

- Expanded deeper brainstorming with eight editable direction presets, comparison of up to three saved family paths, and parent wording differences. Presets preserve existing keep/creativity/combination controls and nonempty audience/constraints. Browsing uses retained ideas and pins without generation, including pins whose parent has been cleared.

- Fixed false evidence rejections caused by literal outer quotation marks in local-model source quotes. Both excerpt and need-signal checks now tolerate balanced quotation framing while preserving exact wording, source identity, and length requirements.
- Changed generation to select supplied evidence IDs, with Muse binding the literal quote to its corresponding first source, after native rolls exposed genuine paraphrasing. Fresh need-led options use detected signals; first-source verification remains required.

- Added optional Tavily free-plan Reddit search snippets to manual fresh rolls, with desktop Library tools connection/disable/remove controls, private API-key storage, persistent 900-attempt monthly cap, backoff, and existing-source fallback. Snippets retain their evidence limits in prompts, detail views, Codex kits, exports/imports, and backups; they do not establish detected needs or repetition. Full Reddit threads are not fetched. Connection and live provider/model testing await the owner's free-plan key.

## October 6, 2026

- Created the private brainstorming experience and Codex kit workflow.
- Added a local, on-demand model and public-source collection.
- Added desktop launch access and recorded a short functionality tour.
- Preserved the original theme, then applied Forest Room's centered layout with Midnight colors.
- Corrected the misleading Ollama access error and verified branching from a pinned idea.
- Consolidated the working app, saved local state, original theme backup, hosted source snapshot, and project documentation into Muse-Discover.
- Prepared the public GitHub source repository with private state/media exclusions and a documented commit-and-push policy for completed future features and fixes.
- Added instant search to Saved library and Pinned, including partial names, descriptions, features, sources, and notes; added result counts, Clear, and no-match feedback. Saved search is separate from idea generation.
- Added a collapsible Codex learning sidebar with manually refreshed official article/tutorial/video indexes, daily rotating picks, type filters, offline cache, and a practical learning prompt. No background scanning or model inference is used.

- Simplified Learning to five automatically discovered daily links from DEV Community and Hacker News-linked sources, removed feed filters and manual refresh controls, and kept daily results cached without model inference or a background scheduler.

- Added guided brainstorming with keep/change direction, constraints, audience adaptation, three creativity levels, saved-idea combinations, persistent branch settings, a navigable family tree, and exploration direction in Codex kits.

## October 7, 2026

- Removed the Learning sidebar, navigation toggle, daily resource searches, and resource API endpoints. Restored the centered layout and retained private saved ideas, pins, and the inactive resource cache.

- Added an expandable Library tools hub with portable JSON export/import, manual and automatic pre-change backups, snapshot restoration, and clearing generated ideas while preserving standalone pins and notes. Import merges by ID and restoration can be undone through its pre-change snapshot.

- Assessed saved outputs, source retrieval, model configuration, and runtime logs. Corrected topic routing, filtered thin/headline and wrong-sense sources, cleaned excerpts before truncation, added grounded prototype reasoning and targeted logic checks, reduced generation padding, and preserved new reasoning in library transfers and Codex kits. No existing ideas were rewritten and no model was downloaded.

- Added optional private mobile access through Tailscale HTTPS, desktop enable/new-code/revoke controls in Library tools, a phone pairing screen, expiring browser sessions, and phone disconnect. Mobile access is off by default; enabling keeps only the lightweight server available. Main app/model loopback bindings and on-demand inference are preserved. Device/account setup and physical-phone testing remain required.

- Added a first evidence-led research pass: phrase-based complaint/wish/workaround detection, conservative cross-discussion/author grouping and duplicate exclusion, bounded targeted Hacker News searches, evidence-prioritized selection, a first-source signal-quote requirement for fresh need-led generation, and an explicit interest-only fallback. New ideas expose cited Research signals and retain them in Codex kits, exports/imports, and backup restoration. Existing private ideas and pins were not rewritten; real-model quality gains remain unmeasured.
