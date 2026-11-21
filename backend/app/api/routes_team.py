from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import require_team_access, require_write, current_user
from app.core.time import last_13_weeks, current_week_start, today_local
from app.rules.rules import Goal, measurable_status, MilestoneLite, rock_status, rock_progress, IssueLite, issue_order
from app import models as M

router = APIRouter()


def _goal(m: M.Measurable):
    return Goal(
        type=m.goal_type,
        value=float(m.goal_value) if m.goal_value is not None else None,
        min=float(m.goal_min) if m.goal_min is not None else None,
        max=float(m.goal_max) if m.goal_max is not None else None,
    )


@router.get("/teams/{team_id}/active-meeting")
async def active_meeting(team_id: str, _: M.User = Depends(require_team_access), db: AsyncSession = Depends(get_db)):
    m = (await db.execute(
        select(M.Meeting).where(M.Meeting.team_id == team_id, M.Meeting.ended_at.is_(None))
    )).scalar_one_or_none()
    if not m:
        return {"active": None}
    facilitator = await db.get(M.User, m.facilitator_id) if m.facilitator_id else None
    return {
        "active": {
            "id": m.id,
            "section": m.section,
            "section_started_at": m.section_started_at.isoformat() if m.section_started_at else None,
            "facilitator_id": m.facilitator_id,
            "facilitator_name": facilitator.name if facilitator else None,
        }
    }


@router.get("/teams/{team_id}")
async def get_team(team_id: str, _: M.User = Depends(require_team_access), db: AsyncSession = Depends(get_db)):
    t = await db.get(M.Team, team_id)
    if not t:
        raise HTTPException(404)
    users = (await db.execute(
        select(M.User).join(M.Membership, M.Membership.user_id == M.User.id).where(M.Membership.team_id == team_id)
    )).scalars().all()
    return {
        "id": t.id,
        "name": t.name,
        "members": [{"id": u.id, "name": u.name, "role": u.role} for u in users],
    }


@router.get("/teams/{team_id}/scorecard")
async def scorecard(team_id: str, _: M.User = Depends(require_team_access), db: AsyncSession = Depends(get_db)):
    weeks = last_13_weeks()
    cur = weeks[-1]
    meas = (await db.execute(select(M.Measurable).where(M.Measurable.team_id == team_id).order_by(M.Measurable.id))).scalars().all()
    mids = [m.id for m in meas]
    scores = (await db.execute(select(M.Score).where(M.Score.measurable_id.in_(mids)))).scalars().all() if mids else []
    s_by = {(s.measurable_id, s.week_start): float(s.value) for s in scores}
    rows = []
    for m in meas:
        g = _goal(m)
        cells = []
        for w in weeks:
            v = s_by.get((m.id, w))
            cells.append({
                "week_start": str(w),
                "value": v,
                "status": measurable_status(v, g, is_current_week=(w == cur)),
            })
        goal_dict = {"type": m.goal_type}
        if m.goal_value is not None: goal_dict["value"] = float(m.goal_value)
        if m.goal_min is not None: goal_dict["min"] = float(m.goal_min)
        if m.goal_max is not None: goal_dict["max"] = float(m.goal_max)
        rows.append({
            "id": m.id, "name": m.name, "owner_id": m.owner_id, "unit": m.unit,
            "goal": goal_dict, "cells": cells,
        })
    return {"weeks": [str(w) for w in weeks], "current_week": str(cur), "measurables": rows}


@router.get("/teams/{team_id}/rocks")
async def rocks(team_id: str, _: M.User = Depends(require_team_access), db: AsyncSession = Depends(get_db)):
    today = today_local()
    rks = (await db.execute(select(M.Rock).where(M.Rock.team_id == team_id).order_by(M.Rock.id))).scalars().all()
    rids = [r.id for r in rks]
    mss = (await db.execute(select(M.Milestone).where(M.Milestone.rock_id.in_(rids)))).scalars().all() if rids else []
    ms_by: dict[str, list[M.Milestone]] = {}
    for m in mss:
        ms_by.setdefault(m.rock_id, []).append(m)
    out = []
    for r in rks:
        ms_list = ms_by.get(r.id, [])
        lite = [MilestoneLite(due_date=m.due_date, done=m.done) for m in ms_list]
        st = rock_status(r.seed_status, lite, today)
        out.append({
            "id": r.id, "title": r.title, "owner_id": r.owner_id, "quarter": r.quarter,
            "status": st,
            "progress_percent": rock_progress(lite, st),
            "milestones": [
                {"id": m.id, "title": m.title, "due_date": str(m.due_date), "done": m.done}
                for m in sorted(ms_list, key=lambda x: (x.due_date, x.id))
            ],
        })
    return {"rocks": out}


@router.get("/teams/{team_id}/issues")
async def issues(team_id: str, solved: bool = False, _: M.User = Depends(require_team_access), db: AsyncSession = Depends(get_db)):
    q = select(M.Issue).where(M.Issue.team_id == team_id)
    q = q.where(M.Issue.solved_at.is_not(None) if solved else M.Issue.solved_at.is_(None))
    rows = (await db.execute(q)).scalars().all()
    if not solved:
        lite = [IssueLite(id=i.id, priority=i.priority, created_at=i.created_at) for i in rows]
        ord_ids = issue_order(lite)
        by_id = {i.id: i for i in rows}
        rows = [by_id[i] for i in ord_ids]
    return {
        "issues": [
            {
                "id": i.id, "title": i.title, "owner_id": i.owner_id, "priority": i.priority,
                "created_at": i.created_at.isoformat(),
                "solved_at": i.solved_at.isoformat() if i.solved_at else None,
                "resolution_note": i.resolution_note,
                "source": (
                    {"measurable_id": i.source_measurable_id, "week_start": str(i.source_week_start)}
                    if i.source_measurable_id else None
                ),
            }
            for i in rows
        ]
    }


@router.get("/teams/{team_id}/todos")
async def todos(team_id: str, _: M.User = Depends(require_team_access), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(M.Todo).where(M.Todo.team_id == team_id).order_by(M.Todo.due_date.asc().nullslast(), M.Todo.id)
    )).scalars().all()
    return {
        "todos": [
            {
                "id": t.id, "title": t.title, "owner_id": t.owner_id,
                "due_date": str(t.due_date) if t.due_date else None,
                "done_at": t.done_at.isoformat() if t.done_at else None,
                "source_issue_id": t.source_issue_id,
            }
            for t in rows
        ]
    }
