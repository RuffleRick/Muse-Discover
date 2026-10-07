# Architecture

## Active local app

`Start Muse.cmd` delegates to `local-muse/Start Muse.cmd`, which runs `Start-Muse.ps1`. The launcher starts the Node server in its own app directory, waits for readiness, and opens the browser. It reuses an already-running Muse server.

`server.mjs` serves the interface on `127.0.0.1:3008`, validates Host and POST Origin, manages generation jobs, and persists state. A browser heartbeat keeps the lightweight server available while tabs are open; it does not run inference or research. Stop Muse ends the server and its owned model job.

`core.mjs` collects public sources, maintains caching and backoff, validates concepts, and builds Codex kits from a fixed template. Its storage location is relative to the source file, so moving the complete app directory preserves its behavior.

`engine.mjs` starts the installed Ollama executable using a dedicated local port, `127.0.0.1:11435`. Generation uses `qwen3.5:4b`, disables cloud inference, passes `keep_alive:0`, and stops its owned process tree in a finally block.

`public/index.html`, `public/style.css`, and `public/app.js` contain the interface. Theme changes preserve the DOM IDs used by the existing browser behavior.

## Data

`data/library.json` stores ideas, pins, notes, source cache, and source backoff state. Writes are queued and saved through a temporary file plus rename. Logs are diagnostic files in the same directory. Personal state and logs are excluded from Git.

The external Ollama installation and model files remain in their existing user locations. They are not copied into this project or reinstalled during project consolidation.

## Hosted source

`muse-app/` preserves the hosted site's source and its existing Sites project identifier. Dependencies, build output, execution caches, and nested Git metadata were excluded from the copy. It requires dependency preparation before local building. The hosted library and account pins are separate from local state. No hosting or access changes were made during consolidation.

## Folder consolidation

Previously this task pointed to an empty Git folder while source lived under `C:\Users\richa\Muse`. Source, local state, and theme backups were copied into this project. The old folder is retained as a fallback snapshot. Launchers now target this project to avoid divergent libraries.
