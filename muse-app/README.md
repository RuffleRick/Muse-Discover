# Muse - Private Brainstorming Room

A private brainstorming board with dice rolls, related concept paths, durable account-owned pins and notes, and a tailored Codex opening prompt plus staged build workflow.

Current mode: curated research library, 31 concepts across 10 topic families. Public source observations were researched on 2026-10-06. Rolling shuffles this finite library, avoiding the current board where possible. It does not call a language model or automatically scan Reddit. The earlier Hacker News/GitHub scan endpoint remains available as a separate source utility; it is not the new brainstorm engine.

Pins use Cloudflare D1 with per-user ownership, validation, prepared statements, and origin checks. They store complete concept snapshots so saved items survive library changes. Sign in with ChatGPT to use pins.

Run: npm run install:ci, then npm run dev. For local pins, generate/build the Worker configuration, apply the generated drizzle migration with Wrangler to the local DB, then visit /signin-with-chatgpt?return_to=/ in the preview. Hosted schema migrations are applied by Sites.

AI generation requires a separately configured connection; do not describe curated rolls as generated or live-discovered ideas. Source evidence does not prove demand or novelty.

