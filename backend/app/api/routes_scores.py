from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.db.session import get_db
from app.api.deps import current_user, require_write, require_team_access
from app.schemas.common import ScoreUpsertIn
from app.ws.manager import hub
from app import models as M

router = APIRouter()


@router.put("/measurables/{measurable_id}/scores/{week_start}")
async def upsert_score(
    measurable_id: str,
    week_start: date,
    body: ScoreUpsertIn,
    user: M.User = Depends(require_write),
    db: AsyncSession = Depends(get_db),
):
    m = await db.get(M.Measurable, measurable_id)
    if not m:
        raise HTTPException(404)
    await require_team_access(m.team_id, user, db)

    existing = (await db.execute(
        select(M.Score).where(M.Score.measurable_id == measurable_id, M.Score.week_start == week_start)
    )).scalar_one_or_none()

    if existing is None:
        db.add(M.Score(measurable_id=measurable_id, week_start=week_start, value=body.value, updated_by=user.id))
    else:
        if body.version is not None and body.version != existing.version:
            raise HTTPException(409, "version conflict")
        existing.value = body.value
        existing.updated_by = user.id
        existing.version = existing.version + 1

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409, "conflict")

    return {"measurable_id": measurable_id, "week_start": str(week_start), "value": body.value}


@router.post("/measurables/{measurable_id}/weeks/{week_start}/issue")
async def make_it_an_issue(
    measurable_id: str,
    week_start: date,
    user: M.User = Depends(require_write),
    db: AsyncSession = Depends(get_db),
):
    m = await db.get(M.Measurable, measurable_id)
    if not m:
        raise HTTPException(404)
    await require_team_access(m.team_id, user, db)

    existing = (await db.execute(
        select(M.Issue).where(
            M.Issue.source_measurable_id == measurable_id,
            M.Issue.source_week_start == week_start,
            M.Issue.solved_at.is_(None),
        )
    )).scalar_one_or_none()
    if existing:
        return _issue_out(existing)

    import uuid
    new_id = f"i_{uuid.uuid4().hex[:10]}"
    title = f"{m.name}, week of {week_start.strftime('%b')} {week_start.day}"
    issue = M.Issue(
        id=new_id, team_id=m.team_id, title=title,
        owner_id=user.id, priority=None,  # spec: owned by the user who clicked
        source_measurable_id=measurable_id, source_week_start=week_start,
    )
    db.add(issue)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        existing = (await db.execute(
            select(M.Issue).where(
                M.Issue.source_measurable_id == measurable_id,
                M.Issue.source_week_start == week_start,
                M.Issue.solved_at.is_(None),
            )
        )).scalar_one()
        return _issue_out(existing)
    await db.refresh(issue)
    return _issue_out(issue)


def _issue_out(i: M.Issue) -> dict:
    return {
        "id": i.id, "title": i.title, "owner_id": i.owner_id, "priority": i.priority,
        "created_at": i.created_at.isoformat() if i.created_at else None,
        "solved_at": i.solved_at.isoformat() if i.solved_at else None,
        "resolution_note": i.resolution_note,
        "source": (
            {"measurable_id": i.source_measurable_id, "week_start": str(i.source_week_start)}
            if i.source_measurable_id else None
        ),
    }
