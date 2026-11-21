from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db
from app import models as M


async def current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> M.User:
    token = request.cookies.get("tenfold_token") or request.cookies.get("altri_token")
    if not token:
        auth = request.headers.get("authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "not authenticated")
    uid = decode_token(token)
    if not uid:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid token")
    user = await db.get(M.User, uid)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "user not found")
    return user


async def require_team_access(
    team_id: str,
    user: M.User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> M.User:
    if user.role == "admin":
        return user
    exists = await db.execute(
        select(M.Membership).where(
            M.Membership.user_id == user.id,
            M.Membership.team_id == team_id,
        )
    )
    if exists.scalar_one_or_none() is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "team access denied")
    return user


def require_write(user: M.User = Depends(current_user)) -> M.User:
    if user.role == "observer":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "observers cannot write")
    return user


async def issue_team_id(issue_id: str, db: AsyncSession = Depends(get_db)) -> str:
    issue = await db.get(M.Issue, issue_id)
    if not issue:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "issue not found")
    return issue.team_id


async def todo_team_id(todo_id: str, db: AsyncSession = Depends(get_db)) -> str:
    todo = await db.get(M.Todo, todo_id)
    if not todo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "todo not found")
    return todo.team_id
