# Reddit search snippets through Tavily

The requested search-provider route replaces the previous Reddit API request plan. The integration is built; it remains off until a free Tavily API key is saved in Muse. No Reddit access request was submitted. Direct Reddit API access and full-thread collection are deferred.

## Connect once

1. Create a free **Researcher** account at [Tavily](https://app.tavily.com). Its [current pricing](https://www.tavily.com/pricing) offers 1,000 monthly credits with no credit card required. Keep paid usage disabled; do not enable pay-as-you-go.
2. Copy an API key from the Tavily dashboard.
3. Open Muse on the home PC and expand **Library tools → Reddit search snippets**.
4. Paste the key into the password field, confirm you use the free plan with paid usage disabled, and choose **Save key and enable**. Never paste the key into chat or GitHub.
5. Enter a topic and choose **Roll fresh ideas**. Relevant Reddit search snippets join the existing Hacker News/Stack Exchange source pool. The app retains at most six source excerpts, so it does not include every search result.

Saving the key does not validate it with Tavily or run a search. A rejected key is reported on the next explicit roll; existing sources remain usable. Disable pauses future searches without deleting the key; Remove key deletes the saved key. Both preserve the library and pins. Administrative connection controls are desktop-only; paired phones can use configured searches through ordinary rolls.

## Usage and privacy

Muse calls only `https://api.tavily.com/search`, using `site:reddit.com` plus your topic and a Reddit domain restriction. Basic search costs one credit under [Tavily's documented search pricing](https://docs.tavily.com/documentation/api-reference/endpoint/search). Raw page content, provider-generated answers, images, automatic parameter upgrades, redirects, and retries are disabled. Muse itself does not fetch Reddit pages, comments, or the Reddit API.

One provider request runs per uncached fresh roll, only when enabled. The source cache lasts ten minutes; repeated same-topic rolls may reuse results without another search credit. Variations reuse their saved sources. There is no background scanning or scheduled generation. Ollama remains local and starts/stops under the existing explicit-generation rules.

Muse reserves and persists each attempt before sending it and stops at **900 attempts per UTC calendar month**. Failed calls count conservatively. Restart, disabling, removing/replacing a key, and restoring a library do not reset this meter. Provider rate limits and allowance errors pause Reddit search while other sources continue. This meter covers this Muse installation, not all apps on the Tavily account. The app cannot verify the account's billing plan; staying on the provider's free plan with paid usage disabled is required for no charges. Never delete the meter file to reset usage.

The topic goes to Tavily, whose own [terms](https://www.tavily.com/terms) govern its processing. Muse does not send your pins, notes, Codex kits, or private library to Tavily. Generated ideas and inference stay on the home PC. `local-muse/data/reddit-search.json` stores the key as private local JSON, not encrypted. It is excluded from Git, portable library exports, and library backups; it can follow your existing OneDrive folder synchronization settings. Provider response bodies and keys are not printed in errors or exposed by the status endpoint.

## Evidence limits

Each result is labeled **Reddit · Tavily search snippet**. It includes a canonical discussion link and at most 1,200 characters of search-provider content. Search chunks may be truncated, assembled from multiple parts of a page, or stale. Muse cannot establish which author said a snippet, whether the thread remains available, or how representative the results are.

Snippets can inspire an idea, but they do not enter Muse's detected complaint/wish/workaround signals or repeated-need counts. Model prompts and Codex kits explicitly explain this distinction. Open the links and check context before building around a claimed need. Provider access does not itself establish permission for every downstream use of third-party content; this feature is not a direct Reddit scraping workaround or a claim of complete Reddit coverage.

## Verification status

Mocked tests cover configuration and secret redaction, query settings, URL filtering and thread deduplication, persistent quota and concurrency, month rollover, provider backoff/exhaustion, corrupt settings, cache invalidation, snippet evidence metadata through imports/kits/prompts, and fallback to existing sources. Live Tavily searching and resulting local model output remain unverified until the owner connects a valid free-plan key and requests a roll.
