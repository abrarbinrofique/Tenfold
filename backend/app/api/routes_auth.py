from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import create_token
from app.core.time import now_utc, today_local, current_week_start
from app.schemas.common import LoginIn, MeOut
from app.api.deps import current_user
from app import models as M

router = APIRouter()


@router.get("/now")
async def now():
    return {
        "now_utc": now_utc().isoformat(),
        "today_local": str(today_local()),
        "current_week_start": str(current_week_start()),
    }


@router.post("/auth/login")
async def login(body: LoginIn, response: Response, db: AsyncSession = Depends(get_db)):
    user = (await db.execute(select(M.User).where(M.User.email == body.email))).scalar_one_or_none()
    if not user:
        raise HTTPException(401, "unknown email")
    token = create_token(user.id)
    # Cross-site cookie: Vercel (web) → Render (api). Requires SameSite=None + Secure.
    # In local dev (http), fall back to Lax so cookies work without TLS.
    from app.core.config import settings
    is_cross_site = settings.cors_origin.startswith("https://")
    response.set_cookie(
        "tenfold_token", token,
        httponly=True,
        samesite="none" if is_cross_site else "lax",
        secure=is_cross_site,
        max_age=60 * 60 * 24,
    )
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}}


@router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("tenfold_token")
    return {"ok": True}


@router.get("/me", response_model=MeOut)
async def me(user: M.User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    rows = await db.execute(
        select(M.Team).join(M.Membership, M.Membership.team_id == M.Team.id).where(M.Membership.user_id == user.id)
    )
    teams = [{"id": t.id, "name": t.name} for t in rows.scalars().all()]
    if user.role == "admin" and not teams:
        all_teams = (await db.execute(select(M.Team))).scalars().all()
        teams = [{"id": t.id, "name": t.name} for t in all_teams]
    return MeOut(id=user.id, name=user.name, email=user.email, role=user.role, teams=teams)
