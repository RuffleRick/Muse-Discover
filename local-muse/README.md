# Muse — local, on-demand brainstorming
Open **Start Muse.cmd** (or the Muse Local desktop shortcut) on this PC.

- **Roll fresh ideas** collects public discussions and generates up to three new concepts. Enter a topic first to guide the roll. Typing and category changes alone do not generate anything.
- **Explore new variations** uses the chosen idea's collected evidence to create new paths.
- **Shuffle saved ideas**, browsing, pins, notes, and Codex kits require no inference.
- **Saved library** and **Pinned** have instant search across names, descriptions, twists, audiences, features, sources, and saved notes. Search ignores capitalization and accents, and all entered words must match somewhere in the idea. **Clear** restores the complete list. Searching does not fetch sources or start the model.
- Pin a concept, add your direction, choose a platform, and create/copy/download its Codex kit.
- **Stop Muse** stops the app and any model job. Closing all its browser tabs also stops it after about two minutes. The browser heartbeat keeps only the lightweight web app available; it does not scan or run inference.

## On-demand operation
The model is qwen3.5:4b. Muse launches its own Ollama service on 127.0.0.1:11435 only during a requested generation, passes keep_alive:0, then stops its entire owned process tree. It never calls cloud inference. OLLAMA_NO_CLOUD=1 is set both for Muse's subprocess and in the user environment. The installed Ollama startup shortcut is moved out of Startup; Muse has no Windows startup entry or schedule. Idea collection remains manual; the Learning sidebar and daily resource searches have been removed. The Ollama desktop/tray app is not needed.

Muse serves only 127.0.0.1:3008, validates Host and Origin, and provides no LAN/public listener. Opening the app loads saved content without loading the model. Source requests go to the Hacker News Algolia API and Stack Exchange API, with caching, backoff, and attribution. Reddit is not connected. Discussions do not prove demand or novelty.

## Local data
data/library.json contains generated concepts, pins, notes, and a small source cache. Back up this folder before moving/uninstalling. The existing hosted Muse site and its account pins remain separate; local concepts do not sync to it. No publishing or firewall change is required.

The Node runtime uses the existing Codex runtime on this PC, with a PATH Node fallback. No additional npm packages are needed. setup/OllamaSetup.exe is an installation download and can be removed after successful setup. setup/Ollama-startup-disabled.lnk is the disabled startup shortcut.

Troubleshooting: see data/server-errors.log and data/model.log. Reopen Start Muse.cmd if the app has stopped. No fallback switches to a paid/cloud service.


## Deeper brainstorming

Open any idea, fill in **Keep this**, **Change that**, optional constraints and audience, choose **Focused**, **Balanced**, or **Wild**, and optionally combine it with another saved idea. Click **Explore new variations** to run the local model. New concepts keep the original family and save the direction used. The **Idea tree** opens older and new paths without generation; each can be pinned or explored further. Existing saved variations also appear. Combination references connect the second idea without moving its original tree. Generated directions guide the model rather than guaranteeing compliance, so review the output. Codex kits carry forward recorded constraints.

## Library tools

The expandable **Library tools** menu stays closed until you need it and provides room for future management functions.

- **Export library:** downloads a versioned JSON file containing generated ideas, pinned snapshots, notes, sources, and branch relationships. Keep a copy outside this project for recovery if the PC or project folder is lost.
- **Import library:** accepts Muse version 1 exports up to 20 MB and merges by idea ID. Existing ideas and pin notes win on conflicts. The resulting library is limited to 5,000 ideas and 5,000 pins. Invalid files are rejected before changes.
- **Create backup:** saves a local snapshot in `data/backups/`, excluded from GitHub. Backups are retained until you manage them; they use storage on this PC and are not a replacement for an external export.
- **Restore selected backup:** replaces generated ideas and pins with that snapshot after confirmation. Muse first backs up the current state so the restoration can be undone by restoring that newer snapshot.
- **Clear generated library · keep pins:** removes all generated-library tiles, including their unpinned branches. Pinned snapshots and notes remain available under Pinned and can still be explored or exported. Muse creates a backup first; restore it to recover the cleared paths.

Import, clear, and restore require a successfully written pre-change backup. Library changes are blocked during generation and serialized against other management actions. These tools do not start the model or fetch public sources.

## Idea quality

New rolls prioritize detailed, topic-matching discussion excerpts over headlines or incidental keywords. Card and puzzle searches use Boardgames; special education avoids grammar/programming communities. A roll can return one to three concepts rather than filling three slots. New concepts show **How this could work**: inputs, interaction, limits, and a verifiable excerpt from the first cited discussion. These details are preserved in export/import and Codex kits. Known impossible reconstruction/measurement claims and invented excerpts stop the roll before saving. Legacy ideas remain available, but branching from headline-only evidence may require rolling the original topic again.

The current small local model can still overlook constraints or suggest impractical details. These checks do not establish market demand, scientific accuracy, or novelty. Current non-thinking sampling is more conservative; model quality improvement has not yet been measured through new inference runs.
