# Architecture

## Active local app

`Start Muse.cmd` delegates to `local-muse/Start Muse.cmd`, which runs `Start-Muse.ps1`. The launcher starts the Node server in its own app directory, waits for readiness, and opens the browser. It reuses an already-running Muse server.

`server.mjs` serves the interface on `127.0.0.1:3008`, validates Host and POST Origin, manages generation jobs, and persists state. A browser heartbeat keeps the lightweight server available while tabs are open; it does not run inference. Stop Muse ends the server and its owned model job.

`core.mjs` collects public sources, maintains caching and backoff, validates concepts, and builds Codex kits from a fixed template. `research-quality.mjs` routes topical searches, ranks substantive excerpts, and rejects known wrong-sense results. New cache keys bypass the previous unfiltered source cache. New Stack Exchange IDs include the community. Its storage location is relative to the source file, so moving the complete app directory preserves its behavior.

`engine.mjs` starts the installed Ollama executable using a dedicated local port, `127.0.0.1:11435`. Generation uses `qwen3.5:4b`, disables cloud inference, passes `keep_alive:0`, and stops its owned process tree in a finally block. A roll may return one to three concepts. Structured output includes a first-source excerpt, inputs, workflow, and limitations; deterministic checks reject missing grounding and specific impossible measurement/reconstruction claims before saving. The checks are partial, not a semantic verifier. Existing saved ideas are unaffected.

`public/index.html`, `public/style.css`, and `public/app.js` contain the interface. Theme changes preserve the DOM IDs used by the existing browser behavior.

The Learning sidebar and resource API routes have been removed. Muse no longer searches for daily learning resources.

## Guided exploration

`exploration.mjs` bounds and normalizes branch directions and supplies keep/change, constraints, audience, creativity, and optional combination context to the model. Creativity adjusts the generation temperature. Combined concepts contribute their collected source IDs; sources remain bounded by the existing structured output schema. New branches retain `parentId` and `family`, record exploration settings, and link the combined idea using `relatedIdeaIds`. Exact repeated pitch/twist pairs are rejected; semantic originality and constraint compliance are not guaranteed. Existing ideas need no migration. The browser builds a cycle-safe family tree from saved ideas and pins and allows opening any retained branch. Codex kits include the recorded branch constraints and direction.

## Data

`data/library.json` stores ideas, pins, notes, source cache, and source backoff state. Writes are queued and saved through a temporary file plus rename. Logs are diagnostic files in the same directory. Personal state and logs are excluded from Git.

The external Ollama installation and model files remain in their existing user locations. They are not copied into this project or reinstalled during project consolidation.

Any previous `data/resources.json` cache is retained as private inactive data. The app no longer reads or updates it.

## Library management

`library-tools.mjs` defines the Muse v1 portable format and validates imported IDs, field lengths, categories, source URLs, notes, and relationships. Export includes ideas, prototype reasoning, and standalone pins, excluding internal research caches. Import merges by ID with existing data taking precedence; clear removes only `ideas`. Disk backups are atomic snapshots under `data/backups/`. Restore replaces ideas and pins while retaining internal cache settings. Import, clear, and restore create a pre-change snapshot before saving and updating the live state. A management lock blocks generation and pin changes; management is rejected while generation runs. Import bodies are size-limited, and existing localhost/Origin checks apply to all mutation routes. The collapsed Library tools menu exposes confirmations, snapshot counts, merge behavior, and restore replacement semantics.

## Hosted source

`muse-app/` preserves the hosted site's source and its existing Sites project identifier. Dependencies, build output, execution caches, and nested Git metadata were excluded from the copy. It requires dependency preparation before local building. The hosted library and account pins are separate from local state. No hosting or access changes were made during consolidation.

## Folder consolidation

Previously this task pointed to an empty Git folder while source lived under `C:\Users\richa\Muse`. Source, local state, and theme backups were copied into this project. The old folder is retained as a fallback snapshot. Launchers now target this project to avoid divergent libraries.

## Optional private mobile gateway

The main app and model bindings remain loopback. Desktop-only `/api/mobile` and `/api/mobile/enable`/`disable` routes expose status and explicit enable/revoke controls. `mobile-network.mjs` checks the standard Windows Tailscale installation and signed-in device hostname, rejects an occupied HTTPS port 8443 or existing public Funnel configuration, and owns a hidden foreground `tailscale serve --https=8443 http://127.0.0.1:3009` process. It does not reset existing Serve configuration, use Funnel, or open router/firewall ports.

`mobile-access.mjs` binds a separate gateway only to `127.0.0.1:3009`. Tailscale terminates private HTTPS. Gateway requests require the expected phone Host; mutations also require that HTTPS Origin and JSON. Before pairing only the login page and its assets are served; data requires a random, in-memory browser session. Ten-character random codes expire after ten minutes, are single-use, and have a global guess limit (the proxy peer is loopback). Sessions expire after twelve hours. Cookies are Secure, HttpOnly, and SameSite=Strict. An allowlist proxy rewrites trusted localhost Host/Origin and drops client forwarding headers. Phone clients cannot read pairing codes, enable access, or stop the PC app. They can use the existing library and generation routes after pairing.

Disabling access, stopping Muse, or a tunnel exit revokes sessions and closes the gateway. Tunnel startup failures leave the gateway off. Enabling access suppresses the app's two-minute idle exit so it remains reachable while the desktop browser is closed; this does not start inference or source scanning. Restarting Muse defaults to mobile access off. Account/device sign-in and HTTPS enablement require the user's external setup; no account credentials or pairing state are persisted in the repository or library.

## Research need signals

### Optional Reddit search-provider snippets

`reddit-search.mjs` uses Tavily's official search endpoint, with a `site:reddit.com` query and restricted domain filter, one basic request per uncached fresh roll. Answers, raw content, images, automatic parameter upgrades, redirects, and retries are disabled. No direct Reddit requests occur. Settings are changed only via desktop `/api/reddit-search`; the mobile gateway allowlist excludes this administrative route. A separate private `data/reddit-search.json` file stores the key, enablement, configuration revision, UTC monthly reserved-attempt counter, and provider backoff. Atomic writes reserve an attempt before network access; failures count. Serial operations preserve the 900-attempt limit through restart, key replacement, removal, and library restoration. Corrupt settings fail closed. The counter measures this installation only; free-plan confirmation does not verify the provider account's actual billing settings.

Configuration revisions enter `search-v2` cache keys so enable/disable/key changes bypass stale source sets. Reddit discussion URLs are restricted and canonicalized, thread duplicates removed, and snippets under 100 characters excluded. At least one relevant snippet can enter the six-source context after recurring-need examples are retained. Source kind/provider metadata identifies snippets throughout prompts, idea detail, kits, imports, and restoration. The reserved ID prefix also identifies snippets if an older export lacks kind metadata. Snippets never enter deterministic complaint/request/workaround detection or recurring-need counts. Model prose still needs human review. Tavily snippets may be stale or truncated; the app does not establish Reddit permissions or complete source context through search results.

Connection controls do not search or start a model. Account creation and a free-plan API key remain external setup; no account, paid plan, or Reddit access application is created. The key is a private local JSON value (not encrypted) and can follow the folder's existing OneDrive synchronization settings. Library export/backups exclude it and the monthly meter. Disconnecting leaves previously generated ideas and pins intact.

`opportunity-signals.mjs` detects sentence-level requests/wishes, complaints, and forced or troublesome workarounds using bounded phrase rules. Negated and some explicitly resolved statements are excluded; manual/spreadsheet use alone is not a pain signal. At least one topic word must occur in the excerpt rather than only the story headline. Quotes are exact bounded slices, not model summaries.

Each manual roll retrieves up to 20 questions from one Stack Exchange community and up to 80 Hacker News comments across the topic, topic + wish, and topic + manually searches. HN requests are parallel and bounded; Stack Exchange backoff is retained. `search-v2` cache entries last ten minutes. Relevance filtering still applies before signal ranking. Candidate grouping compares normalized need words, requires two overlapping terms, and anchors comparisons to the first example to avoid transitive topic merging. Identical text after case, punctuation, and whitespace normalization is deduplicated. Repetition requires at least two discussion IDs and two author identifiers; these are not verified independent people. Selection retains supporting examples for the strongest recurring group, then fills a maximum of six excerpts. Returned counts are recomputed from that selected sample.

`engine.mjs` supplies a bounded signal/group summary in the existing single generation request. Fresh need-led ideas must quote a supplied signal from their first cited source; the deterministic check stops ungrounded results before saving. With no detected signals, the prompt and UI explicitly use an interest-only fallback. Variations retain branch instructions and are exempt from the fresh-roll signal-quote requirement, while existing source/logic checks remain. Each new idea stores a `research` snapshot computed only from its own cited sources, never uncited sample counts.

The idea detail exposes a collapsed Research signals section, exact quotes and source links, and provisional repeated-group counts. Kits include these observations marked as untrusted reference data. Portable exports retain source author/discussion identifiers; import/restore recompute research snapshots and counts from the supplied sources rather than trusting stored counts. Existing ideas and pins are not rewritten. Phrase matching and lexical grouping can miss paraphrases or misread context; no market saturation, verified population, or unmet-demand claim follows from these signals.
