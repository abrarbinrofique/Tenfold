"""Pure business rules — no DB access, fully unit-testable."""
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal, Optional


Status = Literal["on_track", "off_track", "pending"]
RockStatus = Literal["on_track", "off_track", "complete"]


@dataclass(frozen=True)
class Goal:
    type: Literal["at_least", "at_most", "between", "exactly"]
    value: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None


@dataclass(frozen=True)
class MilestoneLite:
    due_date: date
    done: bool


@dataclass(frozen=True)
class TodoLite:
    done_at: Optional[datetime]


@dataclass(frozen=True)
class IssueLite:
    id: str
    priority: Optional[int]
    created_at: datetime


def round_half_up(x: float) -> int:
    return int(Decimal(str(x)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def round_rating(x: float) -> float:
    return float(Decimal(str(x)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))


def measurable_status(score: Optional[float], goal: Goal, is_current_week: bool) -> Status:
    if score is None:
        return "pending" if is_current_week else "off_track"
    s = float(score)
    if goal.type == "at_least":
        ok = s >= float(goal.value)
    elif goal.type == "at_most":
        ok = s <= float(goal.value)
    elif goal.type == "between":
        ok = float(goal.min) <= s <= float(goal.max)
    elif goal.type == "exactly":
        ok = s == float(goal.value)
    else:
        raise ValueError(f"unknown goal type: {goal.type}")
    return "on_track" if ok else "off_track"


def todo_completion(todos_due_this_week: list[TodoLite], week_end_utc: datetime) -> Optional[dict]:
    if not todos_due_this_week:
        return None
    due = len(todos_due_this_week)
    done = sum(1 for t in todos_due_this_week if t.done_at is not None and t.done_at <= week_end_utc)
    ratio = done / due
    return {
        "due": due,
        "done": done,
        "rate_percent": round_half_up(ratio * 100),
        "meets_target": ratio >= 0.9,
    }


def rock_status(seed_status: str, milestones: list[MilestoneLite], today: date) -> RockStatus:
    if seed_status == "complete":
        return "complete"
    if seed_status == "off_track":
        return "off_track"
    for m in milestones:
        if not m.done and m.due_date < today:
            return "off_track"
    return "on_track"


def rock_progress(milestones: list[MilestoneLite], status: RockStatus) -> int:
    if not milestones:
        return 100 if status == "complete" else 0
    done = sum(1 for m in milestones if m.done)
    return round_half_up(100 * done / len(milestones))


def issue_order(issues: list[IssueLite]) -> list[str]:
    ordered = sorted(
        issues,
        key=lambda i: (
            0 if i.priority is None else 1,
            -(i.priority or 0),
            i.created_at,
        ),
    )
    return [i.id for i in ordered]
