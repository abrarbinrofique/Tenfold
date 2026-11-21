import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import require_team_access, require_write, current_user, issue_team_id
from app.schemas.common import IssueCreateIn, IssuePatchIn, IssueSolveIn, TodoCreateIn
from app.core.time import now_utc
from app import models as M

router = APIRouter()


@router.post("/teams/{team_id}/issues")
async def create_issue(
    team_id: str,
    body: IssueCreateIn,
    user: M.User = Depends(require_write),
    db: AsyncSession = Depends(get_db),
):
    await require_team_access(team_id, user, db)
    i = M.Issue(
        id=f"i_{uuid.uuid4().hex[:10]}", team_id=team_id, title=body.title,
        priority=body.priority, owner_id=body.owner_id or user.id,
    )
    db.add(i)
    await db.commit()
    await db.refresh(i)
    return {"id": i.id, "title": i.title, "priority": i.priority, "owner_id": i.owner_id}


@router.patch("/issues/{issue_id}")
async def patch_issue(
    issue_id: str,
    body: IssuePatchIn,
    user: M.User = Depends(require_write),
    db: AsyncSession = Depends(get_db),
):
    issue = await db.get(M.Issue, issue_id)
    if not issue:
        raise HTTPException(404)
    await require_team_access(issue.team_id, user, db)
    if body.priority is not None:
        issue.priority = body.priority
    if body.title is not None:
        issue.title = body.title
    await db.commit()
    return {"ok": True}


@router.post("/issues/{issue_id}/solve")
async def solve_issue(
    issue_id: str,
    body: IssueSolveIn,
    user: M.User = Depends(require_write),
    db: AsyncSession = Depends(get_db),
):
    issue = await db.get(M.Issue, issue_id)
    if not issue:
        raise HTTPException(404)
    await require_team_access(issue.team_id, user, db)
    if issue.solved_at is not None:
        return {"ok": True, "already": True}
    issue.solved_at = now_utc()
    issue.resolution_note = body.note
    await db.commit()
    return {"ok": True}


@router.post("/issues/{issue_id}/todos")
async def create_todo_from_issue(
    issue_id: str,
    body: TodoCreateIn,
    user: M.User = Depends(require_write),
    db: AsyncSession = Depends(get_db),
):
    issue = await db.get(M.Issue, issue_id)
    if not issue:
        raise HTTPException(404)
    await require_team_access(issue.team_id, user, db)
    t = M.Todo(
        id=f"t_{uuid.uuid4().hex[:10]}", team_id=issue.team_id,
        title=body.title, owner_id=body.owner_id or user.id,
        due_date=body.due_date, source_issue_id=issue_id,
    )
    db.add(t)
    await db.commit()
    return {"id": t.id}
