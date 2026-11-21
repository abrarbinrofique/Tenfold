"""Load seed.json into the database. Idempotent: drops & recreates all tables."""
import asyncio
import json
from datetime import datetime, date

from sqlalchemy import text
from app.db.base import Base
from app.db.session import engine, AsyncSessionLocal
from app.core.config import settings
from app import models as M


def _ts(s: str | None) -> datetime | None:
    if s is None:
        return None
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def _date(s: str | None) -> date | None:
    if s is None:
        return None
    return date.fromisoformat(s)


async def load(seed_path: str = None):
    path = seed_path or settings.seed_path
    with open(path) as f:
        data = json.load(f)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        c = data["company"]
        db.add(M.Company(id=c["id"], name=c["name"], timezone=c["timezone"]))
        await db.flush()
        for t in data["teams"]:
            db.add(M.Team(id=t["id"], company_id=c["id"], name=t["name"]))
        for u in data["users"]:
            db.add(M.User(id=u["id"], email=u["email"], name=u["name"], role=u["role"]))
        await db.flush()
        for m in data["memberships"]:
            db.add(M.Membership(user_id=m["user_id"], team_id=m["team_id"]))
        for mm in data["measurables"]:
            g = mm["goal"]
            db.add(M.Measurable(
                id=mm["id"], team_id=mm["team_id"], name=mm["name"],
                owner_id=mm.get("owner_id"), unit=mm.get("unit"),
                goal_type=g["type"],
                goal_value=g.get("value"),
                goal_min=g.get("min"),
                goal_max=g.get("max"),
            ))
        await db.flush()
        for s in data["scores"]:
            db.add(M.Score(
                measurable_id=s["measurable_id"],
                week_start=_date(s["week_start"]),
                value=s["value"],
            ))
        await db.flush()
        for r in data["rocks"]:
            db.add(M.Rock(
                id=r["id"], team_id=r["team_id"], title=r["title"],
                owner_id=r.get("owner_id"), quarter=r["quarter"],
                seed_status=r["status"],
            ))
        await db.flush()
        for ms in data["milestones"]:
            db.add(M.Milestone(
                id=ms["id"], rock_id=ms["rock_id"], title=ms["title"],
                due_date=_date(ms["due_date"]), done=ms["done"],
            ))
        await db.flush()
        for i in data["issues"]:
            src = i.get("source") or {}
            db.add(M.Issue(
                id=i["id"], team_id=i["team_id"], title=i["title"],
                owner_id=i.get("owner_id"), priority=i.get("priority"),
                created_at=_ts(i["created_at"]),
                solved_at=_ts(i.get("solved_at")),
                resolution_note=i.get("resolution_note"),
                source_measurable_id=src.get("measurable_id"),
                source_week_start=_date(src.get("week_start")),
            ))
        await db.flush()
        for td in data["todos"]:
            db.add(M.Todo(
                id=td["id"], team_id=td["team_id"], title=td["title"],
                owner_id=td.get("owner_id"),
                due_date=_date(td.get("due_date")),
                done_at=_ts(td.get("done_at")),
                source_issue_id=td.get("source_issue_id"),
                created_at=_ts(td["created_at"]),
            ))
        await db.flush()
        for mt in data["meetings"]:
            db.add(M.Meeting(
                id=mt["id"], team_id=mt["team_id"],
                facilitator_id=mt.get("facilitator_id"),
                section="ended",
                started_at=_ts(mt["started_at"]),
                ended_at=_ts(mt["ended_at"]),
                summary_snapshot={
                    "scorecard_week": None,
                    "issues_solved": [],
                    "todos_created": [],
                },
            ))
            for uid in mt.get("attendee_ids", []):
                rating = next((r["rating"] for r in mt.get("ratings", []) if r["user_id"] == uid), None)
                db.add(M.MeetingAttendee(meeting_id=mt["id"], user_id=uid, rating=rating))

        await db.commit()
    print("Seed loaded.")


if __name__ == "__main__":
    asyncio.run(load())
