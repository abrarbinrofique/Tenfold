# Tenfold

A two-page EOS Level-10 meeting workspace. Built for the Altri Senior AI-First Software Engineer assessment.

- **Live app**: https://tenfold-phi.vercel.app/login
- **Design showcase**: https://tenfold-phi.vercel.app/showcase
- **Decision record**: [DECISION_RECORD.md](./DECISION_RECORD.md)
- **AI workflow note**: [AI_WORKFLOW.md](./AI_WORKFLOW.md)

---

## Quick start

```bash
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:8000
- Design showcase (no backend needed): http://localhost:3000/showcase

Backend seeds the configured Postgres on boot. The committed `docker-compose.yml` points `DATABASE_URL` at a Supabase pooler; swap it for `postgresql+asyncpg://<local>` to run entirely locally.

## Login (seeded users)

Three accounts cover every permission boundary — the rest are in `seed.json`.

| Email | Role | Team(s) |
|---|---|---|
| `avery@acme.test` | Admin | all |
| `blake@acme.test` | Team Member | Leadership, Sales |
| `ellis@acme.test` | **Observer** | Leadership |

No password — the spec allows a seeded user switcher or simple login. A short-lived JWT is issued as an HttpOnly cookie, plus a non-HttpOnly companion so the WebSocket handshake can pass it as a query-string token.

## Tests

```bash
# Pure business-rule unit tests (no DB, every boundary case)
docker compose exec api pytest tests/test_rules.py -v

# Rules report at the current APP_NOW
docker compose exec api python -m app.rules_report > rules_report.json
```

`rules_report.json` is committed. The grader can override `APP_NOW` in `docker-compose.yml` and re-run the command — every reported value derives from the seed.

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind, TanStack Query, framer-motion, Radix primitives. Fraunces + Inter + JetBrains Mono.
- **Backend**: FastAPI (Python 3.12 async), SQLAlchemy 2.0 async, asyncpg, FastAPI WebSocket for meeting sync.
- **DB**: Postgres 16.

## Architecture at a glance

```
Browser ─ HTTPS/WSS ─► Next.js
                           │
                           │ REST + WebSocket
                           ▼
                        FastAPI
                        ├── api/            REST + /ws/meetings/:id
                        ├── rules/rules.py  pure functions, 17 unit tests
                        ├── ws/manager.py   in-process asyncio pub/sub
                        └── seed.py + rules_report.py
                           │
                           ▼
                        Postgres
                        ├── partial unique indexes for concurrency
                        └── CHECK constraints for integrity
```

Business rules live in a separate pure-function module (`app/rules/rules.py`) and are never duplicated across routes. The REST layer only orchestrates I/O.

## Assumptions and known limitations

- **`APP_NOW` is a fixed env var** (default `2026-11-11T15:00:00Z`). Every week/day comparison reads it, so the grader can swap it and re-run the rules report deterministically.
- **In-app voice/video is out of scope.** The app manages shared meeting *state* (section, timer, attendee presence, live ratings). Teams use their existing call tool alongside.
- **Rocks are read-only** per spec: "they come from the seed data."
- **WebSocket sync is backed by a 3-second poll fallback.** On a good connection, `section_changed` arrives under a second; if the WS drops, the poll guarantees eventual sync within ~3 s.
- **Cross-site cookie**: production uses `SameSite=None; Secure` where the web and api live on different domains. Local dev falls back to `SameSite=Lax`.
- **API integration tests and a Playwright 2-browser E2E are a known gap** on this submission — the rules-level unit suite and the committed `rules_report.json` cover computed-value correctness; the two-browser sync is demonstrated in the submission video.

## AI tools used

Claude (Anthropic) via the Claude Code CLI was used throughout as an **architectural sparring partner** and **implementation accelerator** — never as an unsupervised code generator. Full detail in [AI_WORKFLOW.md](./AI_WORKFLOW.md).

## Repository layout

```
tenfold/
├── backend/
│   ├── app/
│   │   ├── api/              REST + WebSocket endpoints
│   │   ├── core/             config, time (APP_NOW), security (JWT)
│   │   ├── db/               async SQLAlchemy engine & session
│   │   ├── models/           ORM entities
│   │   ├── rules/rules.py    pure business rules (unit-tested)
│   │   ├── schemas/          Pydantic DTOs
│   │   ├── ws/manager.py     in-process pub/sub hub
│   │   ├── seed.py           CLI: load seed.json
│   │   └── rules_report.py   CLI: dump computed JSON
│   └── tests/test_rules.py
├── frontend/
│   ├── app/                  Next.js app router (login, team, meeting, _showcase)
│   ├── components/           chrome, scorecard, issues, todos, rocks, meeting, ui
│   └── lib/                  api.ts, queries.ts (TanStack), ws.ts, time.ts
├── docker-compose.yml
├── seed.json
├── rules_report.json
├── AI_WORKFLOW.md
└── README.md
```
