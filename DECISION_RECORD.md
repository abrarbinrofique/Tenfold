# Decision Record

Three decisions that shaped this build. Each names the problem, the option chosen, the alternative rejected, and the trade-off I accepted.

---

## 1. Data model: TEXT ids, and status computed on read

**Problem.** The seed provides stable string ids (`u1`, `m1`, `t12`, …) that the grader keys off in the rules report. Separately, every entity has a derived status — `measurable_status`, `rock_status`, `rock_progress`, `todo_completion` — that could be stored or computed on read.

**Decision.** Keep ids as `TEXT` primary keys. Keep *every* derived status as a pure function in `app/rules/rules.py`; store nothing. The database holds raw inputs (scores, milestones, goal thresholds, timestamps) and the rules module computes outputs on each read.

**Rejected alternative.** UUID primary keys with a seed-id → UUID map, plus denormalised status columns updated via triggers or application code.

**Why.** Storing derived state creates a well-known class of bugs: a score is edited, the recomputation step is missed, and the meeting summary now disagrees with the scorecard. For this data volume, read-time computation is free — the scorecard endpoint still returns in a few milliseconds — and the rules module is now the single testable source of truth. Seventeen unit tests lock every boundary case (equal-to-goal, missing-score current vs. past week, milestone due today not past-due, half-up rounding, DST-aware week-end comparisons). The trade-off is a slightly heavier query path; the win is that the rules report and the UI can never disagree.

---

## 2. Make-it-an-Issue de-duplication: a partial unique index

**Problem.** The brief's concurrency test fires twenty simultaneous POSTs at `/measurables/:id/weeks/:week/issue` and expects exactly one issue to be created. This is a classic read-modify-write race: every request sees "no existing issue," every request inserts, and the client sees twenty duplicates.

**Decision.** Encode the constraint in the database as a partial unique index:
```sql
CREATE UNIQUE INDEX uniq_unsolved_source
  ON issues (source_measurable_id, source_week_start)
  WHERE solved_at IS NULL AND source_measurable_id IS NOT NULL;
```
The handler first attempts an `INSERT`. If Postgres raises `UniqueViolation`, it re-fetches the winning row and returns it. All twenty responses carry the same issue id.

**Rejected alternative.** An application-level advisory lock or a Redis distributed lock keyed on `(measurable_id, week_start)`.

**Why.** An application lock only holds within one process; the moment the API runs in two replicas — which is the production trajectory — it breaks silently. A distributed lock adds a dependency and still carries correctness holes at the TTL boundary. The partial index is **serialised by construction**: Postgres guarantees exactly one row satisfies the predicate at any moment, regardless of how many processes race. The partial filter (`WHERE solved_at IS NULL`) is essential — it lets a solved issue coexist with a new unsolved one for the same measurable + week, which is exactly the real-world semantics the spec requires.

---

## 3. Real-time meeting sync: server-owned clock, in-process pub/sub, immutable summary

**Problem.** The meeting page has three live concerns: all browsers must share the same section (<1 s target), the timer must not drift, and the end-of-meeting summary must not change even if the underlying issues or todos are edited afterwards.

**Decision.** The server is the single source of truth for `section`, `section_started_at`, and attendees. When the facilitator calls `/advance`, the handler updates the row and publishes a `section_changed` event to an in-process `asyncio` hub; every subscribed WebSocket receives it. Clients compute `elapsed = server_now - section_started_at` against a server-provided `now` anchor, so the timer is drift-free even if the browser clock is wrong. Late joiners fetch `GET /meetings/:id` to replay the current state, then subscribe for subsequent events. On `/end`, the handler writes a full JSONB snapshot to `meetings.summary_snapshot` — attendee ids, ratings, issues solved during the meeting, todos created during the meeting — and the UI reads only from that column.

**Rejected alternatives.** (a) A dedicated broker (Redis pub/sub) from the start — rejected as premature until there is more than one API replica. (b) Client-side timers synced via NTP — rejected because every real-world browser clock drifts in a way we can't test. (c) A live-computed summary that re-derives from source rows at read time — rejected because the spec requires the summary to survive later edits to issues and todos.

**Scaling path.** The in-process hub implements the same `publish/subscribe` contract Redis does; swapping it is a one-file change plus sticky WebSocket sessions at the load balancer. The partial-index concurrency guard from §2 already works across replicas, so the Redis migration does not change correctness anywhere else. A soft 3-second poll on the meeting query is kept as a safety net so that, even if a WebSocket drops, every attendee's screen converges within the spec's "about a second" tolerance.
