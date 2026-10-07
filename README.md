# Muse Discover

Private, local, on-demand brainstorming for games, apps, tools, and everyday problems.

Public source: [RuffleRick/Muse-Discover](https://github.com/RuffleRick/Muse-Discover). Personal library data and private tour media are excluded. See [GitHub workflow](Docs/GITHUB.md) for the authorized feature-update process.

**Start here:** double-click **Start Muse.cmd** in this folder, or use the **Muse Local** desktop shortcut. Muse opens at http://127.0.0.1:3008 on this PC.

This folder is the main Muse project:
`C:\Users\richa\OneDrive\Documents\ChatGPT\Muse-Discover`

## Current functionality

- Search public discussions and roll up to three new concepts using the local model.
- Explore up to three variations of a selected or pinned concept.
- Browse and shuffle saved concepts without generation.
- Search Saved library and Pinned instantly by names, descriptions, features, source text, or personal notes. Multiple words can match different parts of an idea; use Clear to reset.
- Open **Library tools** for JSON export/import, local backups and restoration, or clearing generated ideas while keeping pins.
- New ideas include prototype inputs, workflow, limits, and a cited discussion excerpt. A roll returns up to three concepts and rejects known unsupported claims before saving.
- Explore an idea with keep/change instructions, constraints, audience adaptation, creativity levels, and combinations. Revisit saved branches in its idea tree.
- Pin ideas and save personal notes.
- Create, copy, or download a Codex opening prompt and build workflow.
- Stop Muse from the app. Closing every Muse tab also stops it after about two minutes.

The interface uses Forest Room's centered layout with Midnight's slate blue palette. The original interface is preserved in `backups/original-theme-2026-10-06`.

## Project folders

| Location | Purpose |
| --- | --- |
| `local-muse/` | Active local app: server, model integration, source collection, and interface |
| `local-muse/public/` | Interface markup, styles, and browser behavior |
| `local-muse/data/` | Private saved ideas, pins, source cache, and diagnostic logs |
| `Docs/` | Architecture, roadmap, limitations, and verification notes |
| `backups/` | Original theme and restoration instructions |
| `muse-app/` | Source snapshot of the separate hosted Muse site |

## Operation and privacy

Muse uses the installed Ollama runtime and `qwen3.5:4b`. It starts the model only for an explicit roll or variation request, then stops its owned model process tree. Idea research and generation remain manual, with no paid cloud fallback. Muse has no daily resource searches or scheduled generation.

Source collection currently uses Hacker News and Stack Exchange. Reddit is not connected. Public discussions inspire ideas; they do not prove novelty, demand, or low competition.

The local app and hosted site have separate libraries. The hosted site is not updated by editing or starting this local project.

## Protect your ideas

Back up `local-muse/data/library.json` before moving, uninstalling, or restoring the project. OneDrive may synchronize this project folder, including that private data, according to your existing OneDrive settings. Local model inference still happens on this PC.

The older `C:\Users\richa\Muse` folder is retained as a fallback snapshot. Launchers have been redirected to this project; use this project's data and source for future work.

See [architecture](Docs/ARCHITECTURE.md), [roadmap](Docs/ROADMAP.md), [limitations](Docs/ISSUES.md), and [verification notes](Docs/VERIFICATION.md).

## Optional mobile access

**In progress, not complete.** The app-side controls are built under **Library tools → Mobile access**, but Tailscale installation is waiting for Windows administrator approval. Account setup and an actual phone connection test remain. Resume at the home PC using [Mobile setup](Docs/MOBILE-ACCESS.md). The PC must stay awake; the model remains on demand.

New rolls now prioritize complaints, wishes, and troublesome workarounds, with a Research signals explanation in each new idea. Similar needs across discussions are provisional evidence; ideas with no detected need are labeled interest-led. Existing ideas are unchanged.
