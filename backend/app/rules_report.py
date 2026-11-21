"""CLI: python -m app.rules_report > rules_report.json

Pure derivation from DB. Reads APP_NOW. No side effects.
"""
import asyncio
import json
import sys
from datetime import datetime, timedelta
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app import models as M
from app.core.time import now_utc, today_local, last_13_weeks, week_end_utc, week_start_for, TZ
from app.rules.rules import (
    Goal, MilestoneLite, TodoLite, IssueLite,
    measurable_status, todo_completion, rock_status, rock_progress, issue_order,
    round_rating,
)


def _goal_of(m: M.Measurable) -> Goal:
    return Goal(
        type=m.goal_type,
        value=float(m.goal_value) if m.goal_value is not None else None,
        min=float(m.goal_min) if m.goal_min is not None else None,
        max=float(m.goal_max) if m.goal_max is not None else None,
    )


async def generate() -> dict:
    now = now_utc()
    today = today_local()
    weeks = last_13_weeks(now)
    current_week = weeks[-1]

    async with AsyncSessionLocal() as db:
        teams = (await db.execute(select(M.Team).order_by(M.Team.id))).scalars().all()
        users = (await db.execute(select(M.User))).scalars().all()
        measurables = (await db.execute(select(M.Measurable))).scalars().all()
        scores = (await db.execute(select(M.Score))).scalars().all()
        rocks = (await db.execute(select(M.Rock))).scalars().all()
        milestones = (await db.execute(select(M.Milestone))).scalars().all()
        issues = (await db.execute(select(M.Issue))).scalars().all()
        todos = (await db.execute(select(M.Todo))).scalars().all()
        meetings = (await db.execute(select(M.Meeting))).scalars().all()
        attendees = (await db.execute(select(M.MeetingAttendee))).scalars().all()

    scores_by_key = {(s.measurable_id, s.week_start): float(s.value) for s in scores}
    ms_by_rock: dict[str, list[M.Milestone]] = {}
    for ms in milestones:
        ms_by_rock.setdefault(ms.rock_id, []).append(ms)
    attendees_by_meeting: dict[str, list[M.MeetingAttendee]] = {}
    for a in attendees:
        attendees_by_meeting.setdefault(a.meeting_id, []).append(a)

    out: dict = {"now": now.isoformat().replace("+00:00", "Z"), "teams": {}}

    for t in teams:
        team_meas = sorted([m for m in measurables if m.team_id == t.id], key=lambda x: x.id)
        team_rocks = sorted([r for r in rocks if r.team_id == t.id], key=lambda x: x.id)
        team_issues = [i for i in issues if i.team_id == t.id]
        team_todos = [td for td in todos if td.team_id == t.id]
        team_meetings = sorted(
            [mt for mt in meetings if mt.team_id == t.id and mt.ended_at is not None],
            key=lambda x: x.id,
        )

        measurable_status_out = {}
        for m in team_meas:
            g = _goal_of(m)
            by_week: dict = {}
            for w in weeks:
                v = scores_by_key.get((m.id, w))
                by_week[str(w)] = measurable_status(v, g, is_current_week=(w == current_week))
            measurable_status_out[m.id] = by_week

        todo_completion_out: dict = {}
        for w in weeks:
            due_this_week = [TodoLite(done_at=td.done_at) for td in team_todos if td.due_date and week_start_for(datetime.combine(td.due_date, datetime.min.time()).replace(tzinfo=TZ).astimezone(__import__('zoneinfo').ZoneInfo('UTC'))) == w]
            # simpler: group by week_start from due_date (which is a local calendar date)
            due_this_week = []
            for td in team_todos:
                if not td.due_date:
                    continue
                # week_start for a local date = Monday of that date's week in company TZ
                monday = td.due_date - timedelta(days=td.due_date.weekday())
                if monday == w:
                    due_this_week.append(TodoLite(done_at=td.done_at))
            todo_completion_out[str(w)] = todo_completion(due_this_week, week_end_utc(w))

        overdue = sorted(
            [td.id for td in team_todos if td.done_at is None and td.due_date and td.due_date < today]
        )

        rocks_out = {}
        for r in team_rocks:
            ms_list = [MilestoneLite(due_date=ms.due_date, done=ms.done) for ms in ms_by_rock.get(r.id, [])]
            st = rock_status(r.seed_status, ms_list, today)
            rocks_out[r.id] = {"status": st, "progress_percent": rock_progress(ms_list, st)}

        unsolved = [
            IssueLite(id=i.id, priority=i.priority, created_at=i.created_at)
            for i in team_issues if i.solved_at is None
        ]
        issue_order_out = issue_order(unsolved)

        meetings_out = {}
        for mt in team_meetings:
            snap = mt.summary_snapshot or {}
            atts = attendees_by_meeting.get(mt.id, [])
            ratings = [a.rating for a in atts if a.rating is not None]
            rating = round_rating(sum(ratings) / len(ratings)) if ratings else None
            week = snap.get("scorecard_week") or (str(mt.scorecard_week) if mt.scorecard_week else None)
            m_status = {}
            if week:
                week_date = __import__("datetime").date.fromisoformat(week) if isinstance(week, str) else week
                for m in team_meas:
                    v = scores_by_key.get((m.id, week_date))
                    m_status[m.id] = measurable_status(v, _goal_of(m), is_current_week=False)
            meetings_out[mt.id] = {
                "scorecard_week": week,
                "measurable_status": m_status,
                "issues_solved": sorted(snap.get("issues_solved", [])),
                "todos_created": sorted(snap.get("todos_created", [])),
                "attendee_ids": sorted([a.user_id for a in atts]),
                "rating": rating,
            }

        out["teams"][t.id] = {
            "measurable_status": measurable_status_out,
            "todo_completion": todo_completion_out,
            "overdue_todos": overdue,
            "rocks": rocks_out,
            "issue_order": issue_order_out,
            "meetings": meetings_out,
        }

    return out


def main():
    data = asyncio.run(generate())
    json.dump(data, sys.stdout, indent=2, default=str)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
