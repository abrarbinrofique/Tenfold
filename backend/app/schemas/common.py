from datetime import datetime, date
from typing import Optional, Literal
from pydantic import BaseModel, Field


class LoginIn(BaseModel):
    email: str


class TokenOut(BaseModel):
    token: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str


class MeOut(UserOut):
    teams: list[dict]


class ScorecardCell(BaseModel):
    week_start: date
    value: Optional[float]
    status: str


class MeasurableRow(BaseModel):
    id: str
    name: str
    owner_id: Optional[str]
    unit: Optional[str]
    goal: dict
    cells: list[ScorecardCell]


class ScorecardOut(BaseModel):
    weeks: list[date]
    measurables: list[MeasurableRow]


class ScoreUpsertIn(BaseModel):
    value: float
    version: Optional[int] = None


class IssueCreateIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    priority: Optional[int] = Field(default=None, ge=1, le=5)
    owner_id: Optional[str] = None


class IssuePatchIn(BaseModel):
    priority: Optional[int] = Field(default=None, ge=1, le=5)
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)


class IssueSolveIn(BaseModel):
    note: str = Field(min_length=1)


class TodoCreateIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    owner_id: Optional[str] = None
    due_date: Optional[date] = None


class TodoPatchIn(BaseModel):
    done: Optional[bool] = None
    title: Optional[str] = None
    due_date: Optional[date] = None


class RatingIn(BaseModel):
    rating: int = Field(ge=1, le=10)


class MeetingAdvanceIn(BaseModel):
    pass
