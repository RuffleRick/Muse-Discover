# Muse — local, on-demand brainstorming
Open **Start Muse.cmd** (or the Muse Local desktop shortcut) on this PC.

- **Roll fresh ideas** collects public discussions and generates three new concepts. Enter a topic first to guide the roll. Typing and category changes alone do not generate anything.
- **Explore three new variations** uses the chosen idea's collected evidence to create new paths.
- **Shuffle saved ideas**, browsing, pins, notes, and Codex kits require no inference.
- **Saved library** and **Pinned** have instant search across names, descriptions, twists, audiences, features, sources, and saved notes. Search ignores capitalization and accents, and all entered words must match somewhere in the idea. **Clear** restores the complete list. Searching does not fetch sources or start the model.
- **Learning** shows or hides five daily learning links, with no search box, categories, or refresh controls. On opening Muse, and when an open tab crosses into a new local calendar day, it searches DEV Community’s Codex articles and Hacker News’s searchable story index for Codex development guides and workflows. Links can lead to independent blogs, tutorials, videos, or example repositories. Selection favors previously unseen links and varied publishers. These are discoveries, not necessarily newly published resources. Each day’s attempt is cached in `data/resources.json`; if a source fails, Muse keeps available or previously saved links and tries again the next day. Fewer than five links may appear if insufficient relevant results are available. The feed uses no AI model, API key, or paid service.
- Pin a concept, add your direction, choose a platform, and create/copy/download its Codex kit.
- **Stop Muse** stops the app and any model job. Closing all its browser tabs also stops it after about two minutes. The browser heartbeat keeps only the lightweight web app available; it does not scan or run inference.

## On-demand operation
The model is qwen3.5:4b. Muse launches its own Ollama service on 127.0.0.1:11435 only during a requested generation, passes keep_alive:0, then stops its entire owned process tree. It never calls cloud inference. OLLAMA_NO_CLOUD=1 is set both for Muse's subprocess and in the user environment. The installed Ollama startup shortcut is moved out of Startup; Muse has no Windows startup entry or schedule. Idea collection remains manual; the learning feed searches daily only while Muse is open. The Ollama desktop/tray app is not needed.

Muse serves only 127.0.0.1:3008, validates Host and Origin, and provides no LAN/public listener. Opening the app loads saved content without loading the model. Source requests go to the Hacker News Algolia API and Stack Exchange API, with caching, backoff, and attribution. Reddit is not connected. Discussions do not prove demand or novelty.

## Local data
data/library.json contains generated concepts, pins, notes, and a small source cache. Back up this folder before moving/uninstalling. The existing hosted Muse site and its account pins remain separate; local concepts do not sync to it. No publishing or firewall change is required.

The Node runtime uses the existing Codex runtime on this PC, with a PATH Node fallback. No additional npm packages are needed. setup/OllamaSetup.exe is an installation download and can be removed after successful setup. setup/Ollama-startup-disabled.lnk is the disabled startup shortcut.

Troubleshooting: see data/server-errors.log and data/model.log. Reopen Start Muse.cmd if the app has stopped. No fallback switches to a paid/cloud service.


## Deeper brainstorming

Open any idea, fill in **Keep this**, **Change that**, optional constraints and audience, choose **Focused**, **Balanced**, or **Wild**, and optionally combine it with another saved idea. Click **Explore three new variations** to run the local model. New concepts keep the original family and save the direction used. The **Idea tree** opens older and new paths without generation; each can be pinned or explored further. Existing saved variations also appear. Combination references connect the second idea without moving its original tree. Generated directions guide the model rather than guaranteeing compliance, so review the output. Codex kits carry forward recorded constraints.
