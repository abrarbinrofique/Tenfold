import uuid
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db, AsyncSessionLocal
from app.api.deps import require_team_access, require_write, current_user
from app.core.time import now_utc, current_week_start
from app.core.security import decode_token
from app.schemas.common import RatingIn
from app.ws.manager import hub
from app import models as M

router = APIRouter()

SECTION_ORDER = ["scorecard", "ids", "conclude", "ended"]


@router.post("/teams/{team_id}/meetings")
async def start_meeting(
    team_id: str,
    user: M.User = Depends(require_write),
    db: AsyncSession = Depends(get_db),
):
    await require_team_access(team_id, user, db)
    now = now_utc()
    mid = f"mt_{uuid.uuid4().hex[:10]}"
    m = M.Meeting(
        id=mid, team_id=team_id, facilitator_id=user.id,
        section="scorecard", section_started_at=now,
        started_at=now,  # use APP_NOW anchor, not DB server clock
        scorecard_week=current_week_start(),
    )
    db.add(m)
    db.add(M.MeetingAttendee(meeting_id=mid, user_id=user.id))
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409, "meeting already in progress")
    return await _meeting_state(mid, db)


@router.get("/meetings/{meeting_id}")
async def get_meeting(
    meeting_id: str,
    user: M.User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    m = await db.get(M.Meeting, meeting_id)
    if not m:
        raise HTTPException(404)
    await require_team_access(m.team_id, user, db)
    return await _meeting_state(meeting_id, db)


@router.post("/meetings/{meeting_id}/join")
async def join(
    meeting_id: str,
    user: M.User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    m = await db.get(M.Meeting, meeting_id)
    if not m:
        raise HTTPException(404)
    await require_team_access(m.team_id, user, db)
    existing = await db.get(M.MeetingAttendee, (meeting_id, user.id))
    if not existing:
        db.add(M.MeetingAttendee(meeting_id=meeting_id, user_id=user.id))
        await db.commit()
    await hub.publish(meeting_id, {"type": "attendee_joined", "user_id": user.id, "name": user.name})
    return await _meeting_state(meeting_id, db)


@router.post("/meetings/{meeting_id}/advance")
async def advance(
    meeting_id: str,
    user: M.User = Depends(require_write),
    db: AsyncSession = Depends(get_db),
):
    m = await db.get(M.Meeting, meeting_id)
    if not m:
        raise HTTPException(404)
    if m.facilitator_id != user.id and user.role != "admin":
        raise HTTPException(403, "only facilitator can advance")
    if m.ended_at:
        raise HTTPException(409, "meeting ended")
    idx = SECTION_ORDER.index(m.section)
    if idx >= len(SECTION_ORDER) - 2:
        raise HTTPException(409, "cannot advance past conclude; call /end")
    nxt = SECTION_ORDER[idx + 1]
    m.section = nxt
    m.section_started_at = now_utc()
    await db.commit()
    await hub.publish(meeting_id, {
        "type": "section_changed", "section": nxt,
        "section_started_at": m.section_started_at.isoformat(),
    })
    return await _meeting_state(meeting_id, db)


@router.post("/meetings/{meeting_id}/end")
async def end(
    meeting_id: str,
    user: M.User = Depends(require_write),
    db: AsyncSession = Depends(get_db),
):
    m = await db.get(M.Meeting, meeting_id)
    if not m:
        raise HTTPException(404)
    if m.facilitator_id != user.id and user.role != "admin":
        raise HTTPException(403, "only facilitator can end")
    if m.ended_at:
        return await _meeting_state(meeting_id, db)

    started = m.started_at
    issues_solved = (await db.execute(
        select(M.Issue.id).where(
            M.Issue.team_id == m.team_id,
            M.Issue.solved_at.is_not(None),
            M.Issue.solved_at >= started,
        )
    )).scalars().all()
    todos_created = (await db.execute(
        select(M.Todo.id).where(
            M.Todo.team_id == m.team_id,
            M.Todo.created_at >= started,
        )
    )).scalars().all()

    m.section = "ended"
    m.ended_at = now_utc()
    m.summary_snapshot = {
        "scorecard_week": str(m.scorecard_week) if m.scorecard_week else None,
        "issues_solved": sorted(list(issues_solved)),
        "todos_created": sorted(list(todos_created)),
    }
    await db.commit()
    await hub.publish(meeting_id, {"type": "meeting_ended", "summary": m.summary_snapshot})
    return await _meeting_state(meeting_id, db)


@router.post("/meetings/{meeting_id}/rating")
async def rate(
    meeting_id: str,
    body: RatingIn,
    user: M.User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    m = await db.get(M.Meeting, meeting_id)
    if not m:
        raise HTTPException(404)
    await require_team_access(m.team_id, user, db)
    att = await db.get(M.MeetingAttendee, (meeting_id, user.id))
    if not att:
        db.add(M.MeetingAttendee(meeting_id=meeting_id, user_id=user.id, rating=body.rating))
    else:
        att.rating = body.rating
    await db.commit()
    await hub.publish(meeting_id, {"type": "rating_set", "user_id": user.id, "rating": body.rating})
    return {"ok": True}


async def _meeting_state(meeting_id: str, db: AsyncSession) -> dict:
    m = await db.get(M.Meeting, meeting_id)
    atts = (await db.execute(
        select(M.MeetingAttendee, M.User).join(M.User, M.User.id == M.MeetingAttendee.user_id)
        .where(M.MeetingAttendee.meeting_id == meeting_id)
    )).all()
    return {
        "id": m.id,
        "team_id": m.team_id,
        "facilitator_id": m.facilitator_id,
        "section": m.section,
        "section_started_at": m.section_started_at.isoformat() if m.section_started_at else None,
        "started_at": m.started_at.isoformat() if m.started_at else None,
        "ended_at": m.ended_at.isoformat() if m.ended_at else None,
        "scorecard_week": str(m.scorecard_week) if m.scorecard_week else None,
        "summary": m.summary_snapshot,
        "attendees": [
            {"user_id": a.user_id, "name": u.name, "rating": a.rating} for a, u in atts
        ],
    }


@router.websocket("/ws/meetings/{meeting_id}")
async def meeting_ws(websocket: WebSocket, meeting_id: str, token: str | None = None):
    await websocket.accept()
    if not token:
        token = (
            websocket.cookies.get("tenfold_token")
            or websocket.cookies.get("altri_token")
        )
    uid = decode_token(token or "")
    if not uid:
        await websocket.send_json({"type": "error", "message": "unauthorized"})
        await websocket.close(code=4401)
        return
    async with AsyncSessionLocal() as db:
        m = await db.get(M.Meeting, meeting_id)
        if not m:
            await websocket.close(code=4404)
            return
    await hub.subscribe(meeting_id, websocket)
    try:
        while True:
            # client-side pings only; server is the source of truth
            await websocket.receive_text()
    except WebSocketDisconnect:
        await hub.unsubscribe(meeting_id, websocket)
    except Exception:
        await hub.unsubscribe(meeting_id, websocket)
