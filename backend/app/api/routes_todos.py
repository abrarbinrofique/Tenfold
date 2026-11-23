from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import require_write, require_team_access
from app.schemas.common import TodoPatchIn
from app.core.time import real_now_utc
from app import models as M

router = APIRouter()


@router.patch("/todos/{todo_id}")
async def patch_todo(
    todo_id: str,
    body: TodoPatchIn,
    user: M.User = Depends(require_write),
    db: AsyncSession = Depends(get_db),
):
    t = await db.get(M.Todo, todo_id)
    if not t:
        raise HTTPException(404)
    await require_team_access(t.team_id, user, db)
    if body.done is True and t.done_at is None:
        t.done_at = real_now_utc()
    elif body.done is False:
        t.done_at = None
    if body.title is not None:
        t.title = body.title
    if body.due_date is not None:
        t.due_date = body.due_date
    await db.commit()
    return {"ok": True, "done_at": t.done_at.isoformat() if t.done_at else None}
