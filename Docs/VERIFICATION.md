# Verification notes

## Previously verified

- Manual rolls and pinned-idea branching successfully generated concepts locally.
- The model service stopped after generation.
- Theme change preserved all existing UI DOM hooks and left browser behavior unchanged.
- Original theme backup matched the original interface files.

## Folder consolidation checks

Passed during consolidation on October 6, 2026:

- Compared the copied core, engine, server, interface files, and library with the retained originals: exact matches.
- Parsed the copied library: 42 concepts and 3 pins preserved.
- Ran Node syntax checks for server, core, engine, and browser behavior: passed.
- Redirected the desktop shortcut, desktop folder launcher, and old app launchers to this project.
- Started the server with its command line and working directory pointing to this project's `local-muse` directory.
- Loaded state and interface over localhost: 42 concepts, 3 pins, centered dark interface.
- Confirmed the model service remained stopped; no generation was triggered.

Folder consolidation does not need a fresh generation request. Its verification concerns paths, preserved data, and server startup. Follow-up hands-on checks: open Start Muse.cmd, browse Pinned and Saved library, and create a Codex kit.

Keep future check results specific: record what ran, its outcome, and remaining limitations rather than treating prior checks as proof of new changes.

## Saved search — October 6, 2026

- Browser checks passed for uppercase partial-name search, multiple-word saved-note search, no-match feedback, clearing back to all 42 saved concepts, and filtering the 3 pinned ideas.
- Inspected the dark search layout and confirmed generation controls are replaced by library search in saved views.
- Node syntax check passed for the updated browser behavior.
- Search uses only loaded local data and does not request generation or source collection. No saved library mutations were made during these checks.

## Learning feed — October 6, 2026

- Three Node tests passed: safe link handling, Markdown index parsing/video classification, and stable daily rotation with distinct items and balanced resource types.
- Browser and server syntax checks passed.
- Live integration refreshed all three official indexes: 36 distinct resources and 9 daily picks across Article, Tutorial, and Video.
- A second same-day refresh reused the existing successful cache timestamp.
- The refresh endpoint rejected a foreign Origin with HTTP 403.
- Cached picks loaded while all network fetching was deliberately disabled in a separate read-only check.
- Browser checks verified 3 video results, collapse/expand state, and the dark desktop sidebar layout.
- Confirmed the model service remained stopped during the refresh checks; no idea generation was requested.

## Automatic daily learning — October 6, 2026

- Four Node tests passed for public HTTPS links, instructional/development relevance, five-item selection and deduplication, publisher diversity, unseen-link preference, and local calendar dates.
- Browser and server syntax checks passed; Git diff whitespace checks passed.
- Opening the browser automatically searched DEV Community and Hacker News; the final selection contained five links across four publishers.
- Browser inspection confirmed five links and no input, select, or button inside the feed.
- A repeated same-day request reused the refresh timestamp; the model service remained stopped.
- An integration check confirmed the idea library was unchanged by resource refresh.
- Date rollover is implemented through the open-tab heartbeat and covered by calendar-date unit checks; a real overnight session was not run.
