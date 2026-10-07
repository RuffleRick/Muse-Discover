# Verification notes

## Evidence quotation framing — October 7, 2026

- A new diagnostic attempt using retained Muse sources reproduced false rejection: the model wrapped otherwise matching source text in literal quotation marks. This was not a recovery of the earlier rejected model outputs, which were not retained.
- Added regression coverage for straight/curly single/double framing, nested framing, unbalanced/mismatched marks, changed words, short/oversized quotes, and incorrect first-source citations. Need-signal checks use the same framing rules and continue rejecting altered quotes and wrong sources.
- All 42 regression checks passed. Diagnostic captures remain private in ignored data; no private source excerpts or model outputs are committed.

## Reddit search-provider integration — October 7, 2026

- All 40 regression checks passed, including nine new mocked search tests. Syntax checks passed for all local `.mjs` files and the browser app script; `git diff --check` passed. An existing collection test was updated for the new versioned cache key. Initial sandbox disk tests hit permission errors on atomic rename; the same tests passed with normal filesystem access.
- Localhost smoke checks found the key/connection controls in served HTML, disabled/unconfigured status with zero attempts, no credential in status, rejected wrong-Origin requests, and rejected enabling without required setup. The private library's SHA-256 hash was unchanged. No real provider request or local model generation was run.
- Browser visual testing was unavailable: the browser tool reported no connected browsers. Live Tavily results and real-model snippet use remain unverified until a valid free-plan key is connected and an explicit roll is requested.

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

## Deeper brainstorming — October 6, 2026

- Seven tests passed across exploration and daily resources; exploration tests cover bounded settings, valid creativity values, prompt direction, combinations, parent/family preservation, source references, duplicate-content rejection, and constraints carried into Codex kits.
- Browser, engine, and server syntax checks passed.
- One live guided combination generated three concepts in 13.7 seconds; the library increased from 74 to 77 while all four pins were retained. The model service stopped afterward.
- Reopening after a server restart retained branch direction, combination reference, and all 13 paths in the tested family, including older variations.
- Browser checks verified tree navigation back to the original concept, prefilled inherited keep/constraints/audience/creativity/combination controls, and recorded constraints in a Codex kit.
- The live model output did not consistently honor the requested audience and read-only constraint. Guidance is visible for review. The final system prompt was strengthened after this observation; its quality improvement has not been established with another live run.

## Learning sidebar removal — October 7, 2026

- Browser and server syntax checks passed; all three exploration tests passed.
- Active HTML, JavaScript, CSS, and server code were checked for removed sidebar and resource-fetch references; none remain.
- Started the updated local server and verified both GET /api/resources and POST /api/resources/refresh return HTTP 404.
- Restored the original centered layout rules. Visual browser verification could not run because the in-app browser was unavailable.
- Personal library and resource cache were not edited, and no model generation was requested.

## Library tools — October 7, 2026

- Eight tests passed across exploration and library tools. Tests cover export roundtrip, pin/note/source/branch preservation, conflict-safe repeatable merges, pin-only conflicts after clear, malformed imports, unsafe URLs, disk backup restoration, restoration undo, and backup path validation. Disk tests use isolated temporary folders.
- Browser and server syntax checks passed. The current private library validates against the portable format without edits.
- Live export returned all 83 generated ideas and 4 pins. A manual backup was created and listed. A malformed import returned 400; a foreign-Origin clear request returned 403. The library file hash remained unchanged, and the model service remained stopped.
- Clear and restore were exercised on isolated test data, not the user’s private library.
- No browsers were available through the UI tool, so visual verification and native file-picker testing could not be performed.

## Research and idea quality — October 7, 2026

- Inspected retrieval, prompt/schema validation, installed model metadata, and runtime logs without starting inference or changing saved ideas/pins.
- Replayed 17 cached searches (187 candidate excerpts) through the initial relevance filter: 65 were retained after caps and filtering. This is a filtering measurement, not a precision or idea-quality score. Education-specific exclusions were tightened afterward.
- Live retrieval checks returned detailed sources for card games, photography, and special education. Education excerpt review exposed and then rejected legal-training and separated-word false matches. Some retained comments are contextual education anecdotes beneath unrelated story headlines.
- Fourteen tests passed across research, exploration, and library tools. New checks cover routing, wrong-sense/headline/thin evidence, HTML cleanup, exact source grounding, minimum prototype mechanics, known unsupported measurement/reconstruction claims, variable idea counts, cache behavior, and preservation of reasoning through export/import and backup restoration.
- Core, engine, and browser JavaScript syntax checks passed. Model logs showed GPU loading and no truncation in the inspected prior request; this does not establish reasoning quality.
- No revised prompt generation or controlled model comparison was run. These improvements address evidenced retrieval/validation defects; generation quality gains remain unmeasured. The private detailed assessment is excluded from Git.

## Mobile access — October 7, 2026

- 21 tests passed across mobile access, exploration, library tools, and research quality. Seven mobile checks cover code/session expiry and revocation, guess cooldown, gateway pairing/privacy, Host/Origin rejection, trusted proxy headers, route allowlisting, phone logout, setup failures, foreground tunnel process ownership, and refusal to reuse an occupied port/public Funnel configuration.
- Gateway integration tests use loopback sockets and a mock app/tunnel, without accessing the private library or generating ideas. The phone disconnect handler was exercised in an isolated JavaScript DOM stub, not a real mobile browser.
- Syntax checks passed for server, gateway, Tailscale adapter, app browser code, and pairing browser code.
- Live main-server checks found mobile access off and Tailscale absent. An enable request returned 400 without opening the gateway; an enable request with a foreign Origin returned 403. All 83 ideas and 4 pins remained, and the library SHA-256 was unchanged.
- Actual Tailscale HTTPS startup, Windows tunnel termination/config cleanup, phone rendering, and access over a cellular network remain unverified until Tailscale is installed and both devices are signed in. No inference was requested. No router, firewall, or hosted-site changes were made.

- Subsequent installation attempt: winget downloaded and hash-verified Tailscale 1.102.4, then waited for Windows administrator approval. Computer Use observed the verified Tailscale publisher prompt; automated mouse and keyboard approval attempts did not dismiss it. The executable was still absent at the last check. Installation and remote connectivity are not complete. The user requested holding further setup until returning to the home PC.

## Need-signal research — October 7, 2026

- Added checks for exact complaint/request/workaround quotes, negation and resolved/happy workflows, excerpt-level topic relevance, cross-author/discussion grouping, non-merging of unrelated needs, duplicate text, unknown identity, evidence-first selection, fresh-roll signal grounding, bounded model guidance, creative-interest fallback, branch directions, quote bounds, escaped browser evidence, Codex kit context, and export/import/backup preservation with recomputed counts.
- Live public retrieval dry-runs returned six excerpts per topic for card games, file organization, and gardening, with 10, 6, and 7 signal matches respectively. None of these selected samples established a repeated group. This is a small retrieval observation, not a precision/recall benchmark or evidence of market demand. Later duplicate normalization was tightened without another live fetch.
- The private library hash was unchanged. No model inference, idea generation, or private-state mutation was requested during these checks. Full real-model output assessment and visual browser testing remain to be done on explicit user rolls.
- All 31 regression checks and syntax checks passed, including research-panel rendering in an isolated DOM stub. This is not a physical browser or model-output test.
