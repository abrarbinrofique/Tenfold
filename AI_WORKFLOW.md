# AI Workflow

**Tool used**: Claude (Anthropic) — primarily Opus 4, via the Claude Code CLI. Used as an **architectural sparring partner and implementation accelerator**, not as a code generator.

This note describes how I approached the assessment with AI in the loop. I treated the AI the way I would treat a strong peer: as a thinking partner to pressure-test designs before writing them, and to accelerate the parts of the work where the right answer was already clear in my head. Every architectural decision in the repo is mine; the AI shortened the distance between the decision and the artifact.

---

## 1. Framing: decomposition before code

Before touching any file, I spent the first session purely on **problem decomposition**. The brief is dense — 2 pages, 4 entities, a weekly meeting lifecycle, a rules report that will be diffed against an answer key, and a real-time sync requirement. Jumping into code without a shared mental model with the AI would have produced a wide, shallow solution.

I broke the problem into independent axes:

| Axis | Why I surfaced it early |
|---|---|
| **Data model** | IDs, status storage (computed vs. stored), FK shape of issues → measurables+week |
| **Business rules** | 7 distinct rules in §2.6, each with boundary cases I knew the grader would test |
| **Time + DST** | Chicago TZ, `APP_NOW` env override, Monday-of-week math, Nov 1 DST transition inside seed range |
| **Concurrency** | Make-it-an-Issue race, one-active-meeting-per-team, score lost-update |
| **Real-time** | Server-owned timer, WebSocket fanout, late-join reconnection, immutable summary |
| **AuthZ** | Role × team membership matrix, per-endpoint composition |
| **UI composition** | Scorecard + Issues reused on both pages, meeting shell is a wrapper |

For each axis I asked the AI to **enumerate alternatives first**, not recommend one. Only after the trade-off matrix was on screen did I commit to an option. This is the inverse of the typical "AI, write me the code for X" flow — the AI was earning its keep by widening the search space, not narrowing it prematurely.

---

## 2. Decision-driven architecture

Every non-trivial call was made with an explicit rejection of alternatives. A few representative examples:

### TEXT ids over UUID
Seed provides stable ids (`u1`, `m1`, `t12`). The grader keys off these. A UUID migration adds no value for an 8-day project and risks a breakage in the rules report. Decision: keep TEXT, document migration path.

### Computed status, not stored
`measurable_status`, `rock_status`, `rock_progress`, `todo_completion` could all be columns. Storing them makes reads cheaper but creates a stale-state class of bugs (edit a score → forget to recompute → wrong meeting). For this scale, read-time computation is free. Decision: pure functions, DB has no derived columns.

### Partial unique index over app-level lock for Make-it-an-Issue
The brief's concurrency test — 20 simultaneous POSTs returning one issue — rules out optimistic app code. A distributed lock would work but introduces a dependency and still has correctness holes across replicas. Postgres's partial unique index `(source_measurable_id, source_week_start) WHERE solved_at IS NULL AND source_measurable_id IS NOT NULL` is **DB-serialized by construction**. One INSERT wins, nineteen catch `UniqueViolation` and re-fetch the winner. Decision: index-first design.

### In-process pub/sub, documented scale path
Redis pub/sub would scale meetings across API replicas. For single-replica dev — which is what the grader runs — an `asyncio`-based in-process hub is simpler, zero-dependency, and exercises the exact same contract. Decision: in-process now, Redis documented in the decision record as the horizontal-scale path.

### TanStack Query over Redux
Roughly 80% of the app's state is server state: scorecard, issues, todos, rocks, meeting, me. Redux-managed server state is an anti-pattern — it duplicates cache primitives Query already ships. Decision: TanStack Query for server state, `useState` for ephemeral UI only.

### HttpOnly cookie + non-HttpOnly companion for WebSocket
The WS handshake can't send cookies as credentials cross-origin reliably across browsers, so the token has to appear in the query string. Exposing the JWT in JS-readable storage is a mild XSS risk in exchange for a working WS. I documented the trade-off and used a short TTL (24h).

Each of these was discussed with the AI as "here are my two options, here's my prior, what am I missing?" The AI's value was surfacing failure modes I hadn't thought of — e.g. *"if you ever shard by team, your in-process hub silently drops events"* — which then went into the decision record.

---

## 3. Implementation as the last step

Once each axis had a committed decision, implementation was fast and uncontroversial. I used the AI to:

- **Scaffold boilerplate** (SQLAlchemy models from the schema sketch, Pydantic request/response shapes, Next.js app-router skeleton, Tailwind config)
- **Mirror a rule I had already specified in English** into Python (e.g. "missing score + current week → pending; missing + past → off_track; boundary inclusive") — then I wrote the unit tests to lock it
- **Draft the editorial UI** with specific design constraints I had codified (Fraunces display, Inter UI, JetBrains Mono numerals, 2px status rails only, vermillion signal only on live moments) — I rejected multiple drafts that leaned into generic SaaS aesthetics
- **Debug specific symptoms** (seed FK order, DST boundary test, cookie SameSite, Supabase pooler SSL config) where I already had a hypothesis and wanted a second pair of eyes

What I did **not** delegate: the data model, the rules semantics, the concurrency primitive choice, the real-time model, the information architecture of the two pages, or any of the trade-off decisions in the decision record. Those are mine.

---

## 4. Verification pattern

I kept the AI honest with a tight verification loop:

1. **Pure business rules land first.** Before any API or UI, `rules.py` is written and every boundary case is a unit test. 17 tests cover `on_track`/`off_track`/`pending`/`complete` semantics, half-up rounding, DST-aware week-end comparisons, and sort stability of `issue_order`. Those tests are the contract; the AI can't "fix a bug" by changing rule output silently.
2. **Rules report is the oracle.** `python -m app.rules_report > rules_report.json` dumps every computed value. Any refactor that changes the JSON requires either a rule test change (with justification) or a revert. The report is committed so diffs are visible.
3. **Spec cross-reference per PR-sized change.** Each significant change was mapped back to a line in the brief. If a feature didn't trace to spec language, it got cut.

---


## 6. Summary

The AI accelerated the predictable half of the work (boilerplate, syntax, mirroring specified logic, catching typos) and acted as a sparring partner on the half that mattered (architecture, concurrency semantics, rule boundaries, scope). The decisions and the taste are mine; the delta the AI provided was speed and a tighter first draft.

If asked to walk through any file, I can explain the design intent, the alternatives rejected, and the failure modes handled — because those were discussed before the code was written, not after.
