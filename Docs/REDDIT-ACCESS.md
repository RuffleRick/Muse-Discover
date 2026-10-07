# Reddit source expansion — awaiting approval

Status: requested, not connected. The owner does not yet have Reddit API approval or credentials. Muse continues to collect Stack Exchange questions and Hacker News comments. No Reddit collector or authentication code has been added, and no Reddit data has been fetched for Muse.

## Access request

Reddit currently requires explicit approval before API access, including personal developer applications. Its policy directs developers to Devvit first and provides a request route for applications that Devvit does not support. Approval must cover the actual use, including passing excerpts to a local model for inference. Approval and free access are not guaranteed; Muse must not enable paid access without separate authorization.

[Official developer access request](https://support.reddithelp.com/hc/en-us/requests/new?tf_42139884615700=api_request_type_developer_clone&ticket_form_id=14868593862164)

The following is a draft for the owner to review and submit, not a submitted application or an assertion that the proposed use is eligible:

> I am developing Muse, a personal local brainstorming application for one user. I request permission for bounded, read-only searches of public posts and comments about games, hobbies, everyday workflows, and software tools. Searches would run only when I explicitly request new ideas or variations. Relevant excerpts would be checked for complaints, wishes, cumbersome workarounds, and similar needs across discussions, then passed to a locally running Ollama model to suggest small app or tool prototypes. This is inference, not model training or fine-tuning. No Reddit content would be sent to a paid cloud model. The application would not post, vote, message, or access private communities. I may use generated ideas to build future projects; please clarify any commercial-use restrictions. The application source is public at https://github.com/RuffleRick/Muse-Discover, while my personal library is private. The requested capability is an external desktop workflow using a local model rather than an app running inside Reddit. Please advise whether this is supported through Devvit or requires approved Data API access, which communities and limits are permitted, and how deletion requirements apply to saved ideas, citations, exports, and backups. The Reddit integration is not implemented or active yet. I require a no-cost access option and would not activate a paid arrangement.

Supply the actual Reddit username and any requested community scope directly to Reddit. Do not put credentials or application responses containing personal information into the public repository. No application has been submitted on the owner's behalf.

## Intended implementation after approval

1. Use approved OAuth access and a truthful application User-Agent, with credentials stored only in private local configuration. Expose connection status without revealing tokens.
2. Search only the approved communities and endpoints on an explicit roll or variation request. Bound searches and comment retrieval; honor rate-limit headers, backoff, and timeouts. Reddit failure should leave existing sources usable and report incomplete coverage.
3. Normalize public posts/comments into the existing source pipeline. Preserve thread identity for grouping; apply topic relevance, detailed-excerpt filtering, literal need signals, duplicate removal, and the six-source context limit. A popular post alone is not evidence of an unmet need.
4. Resolve retention before saving Reddit-backed ideas. Current Muse caches, pins, research snapshots, Codex kits, exports, and backups can retain source text indefinitely. This behavior cannot simply be reused for Reddit. Define and implement deletion handling across all those surfaces, including account identifiers and any saved derived material covered by the approved terms. A short cache alone does not resolve copies retained in pins or backups. Do not introduce background research or inference to solve retention.
5. Test mocked authentication expiry, rate limits, unavailable/deleted content, deletion propagation, provenance, relevance, and preservation of non-Reddit pins. Conduct an approved live search only after credentials and scope are configured; separately verify an explicit local generation and model shutdown.

## Requirements checked October 7, 2026

- [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy): approval, transparency, scope, and prohibited uses.
- [Data API Wiki](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki): OAuth, User-Agent, rate limits, and removal of deleted content and author information. Its 48-hour purge recommendation does not authorize retaining deleted content until that deadline.

Recheck current terms and the specific approval before implementation. No anonymous scraping, alternate endpoints, or third-party proxies are planned as an access workaround.
