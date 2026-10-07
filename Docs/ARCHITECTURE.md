# Architecture

## Active local app

`Start Muse.cmd` delegates to `local-muse/Start Muse.cmd`, which runs `Start-Muse.ps1`. The launcher starts the Node server in its own app directory, waits for readiness, and opens the browser. It reuses an already-running Muse server.

`server.mjs` serves the interface on `127.0.0.1:3008`, validates Host and POST Origin, manages generation jobs, and persists state. A browser heartbeat keeps the lightweight server available while tabs are open; it does not run inference. The browser also checks whether the daily learning feed is due. Stop Muse ends the server and its owned model job.

`core.mjs` collects public sources, maintains caching and backoff, validates concepts, and builds Codex kits from a fixed template. Its storage location is relative to the source file, so moving the complete app directory preserves its behavior.

`engine.mjs` starts the installed Ollama executable using a dedicated local port, `127.0.0.1:11435`. Generation uses `qwen3.5:4b`, disables cloud inference, passes `keep_alive:0`, and stops its owned process tree in a finally block.

`public/index.html`, `public/style.css`, and `public/app.js` contain the interface. Theme changes preserve the DOM IDs used by the existing browser behavior.

`resource-feed.mjs` searches DEV Community’s Codex-tag article API and the Hacker News Algolia story index on `POST /api/resources/refresh`. The browser requests it automatically on opening and after local date rollover while a tab remains open. `GET /api/resources` reads only the local cache. A versioned cache records each calendar day’s attempt, including failure, and concurrent refreshes share one request. The selector deduplicates URLs, prefers unseen links using a bounded 100-URL history, favors varied publishers, and returns up to five results. Title filters require both Codex development context and learning/workflow context. Requests have timeout and size limits and reject redirects. Public HTTPS result links are validated and titles are escaped; destination pages are not fetched automatically. No model, scheduler, or paid API is involved. The sidebar’s collapse preference remains in browser storage.

## Guided exploration

`exploration.mjs` bounds and normalizes branch directions and supplies keep/change, constraints, audience, creativity, and optional combination context to the model. Creativity adjusts the generation temperature. Combined concepts contribute their collected source IDs; sources remain bounded by the existing structured output schema. New branches retain `parentId` and `family`, record exploration settings, and link the combined idea using `relatedIdeaIds`. Exact repeated pitch/twist pairs are rejected; semantic originality and constraint compliance are not guaranteed. Existing ideas need no migration. The browser builds a cycle-safe family tree from saved ideas and pins and allows opening any retained branch. Codex kits include the recorded branch constraints and direction.

## Data

`data/library.json` stores ideas, pins, notes, source cache, and source backoff state. Writes are queued and saved through a temporary file plus rename. Logs are diagnostic files in the same directory. Personal state and logs are excluded from Git.

The external Ollama installation and model files remain in their existing user locations. They are not copied into this project or reinstalled during project consolidation.

`data/resources.json` stores the learning catalog and refresh metadata. It uses an atomic temporary-file rename and is excluded from Git along with the rest of `data/`. It does not modify the idea library.

## Hosted source

`muse-app/` preserves the hosted site's source and its existing Sites project identifier. Dependencies, build output, execution caches, and nested Git metadata were excluded from the copy. It requires dependency preparation before local building. The hosted library and account pins are separate from local state. No hosting or access changes were made during consolidation.

## Folder consolidation

Previously this task pointed to an empty Git folder while source lived under `C:\Users\richa\Muse`. Source, local state, and theme backups were copied into this project. The old folder is retained as a fallback snapshot. Launchers now target this project to avoid divergent libraries.
