from datetime import datetime, date
from sqlalchemy import (
    String, Text, Integer, Numeric, Date, DateTime, Boolean, ForeignKey,
    CheckConstraint, UniqueConstraint, Index, JSON, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Company(Base):
    __tablename__ = "companies"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    timezone: Mapped[str] = mapped_column(Text, nullable=False)


class Team(Base):
    __tablename__ = "teams"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"))
    name: Mapped[str] = mapped_column(Text, nullable=False)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(Text, nullable=False)
    __table_args__ = (
        CheckConstraint("role IN ('admin','team_member','observer')", name="users_role_chk"),
    )


class Membership(Base):
    __tablename__ = "memberships"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id"), primary_key=True)


class Measurable(Base):
    __tablename__ = "measurables"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id"))
    name: Mapped[str] = mapped_column(Text)
    owner_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    unit: Mapped[str | None] = mapped_column(Text, nullable=True)
    goal_type: Mapped[str] = mapped_column(Text)
    goal_value: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    goal_min: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    goal_max: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    __table_args__ = (
        CheckConstraint(
            "goal_type IN ('at_least','at_most','between','exactly')",
            name="measurables_goal_type_chk",
        ),
    )


class Score(Base):
    __tablename__ = "scores"
    measurable_id: Mapped[str] = mapped_column(ForeignKey("measurables.id"), primary_key=True)
    week_start: Mapped[date] = mapped_column(Date, primary_key=True)
    value: Mapped[float] = mapped_column(Numeric, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)


class Rock(Base):
    __tablename__ = "rocks"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id"))
    title: Mapped[str] = mapped_column(Text)
    owner_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    quarter: Mapped[str] = mapped_column(Text)
    seed_status: Mapped[str] = mapped_column(Text)
    __table_args__ = (
        CheckConstraint("seed_status IN ('on_track','off_track','complete')", name="rocks_status_chk"),
    )


class Milestone(Base):
    __tablename__ = "milestones"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    rock_id: Mapped[str] = mapped_column(ForeignKey("rocks.id"))
    title: Mapped[str] = mapped_column(Text)
    due_date: Mapped[date] = mapped_column(Date)
    done: Mapped[bool] = mapped_column(Boolean, default=False)


class Issue(Base):
    __tablename__ = "issues"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id"))
    title: Mapped[str] = mapped_column(Text, nullable=False)
    owner_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    priority: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    solved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_measurable_id: Mapped[str | None] = mapped_column(ForeignKey("measurables.id"), nullable=True)
    source_week_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    source_meeting_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    __table_args__ = (
        CheckConstraint("priority IS NULL OR (priority BETWEEN 1 AND 5)", name="issues_priority_chk"),
        CheckConstraint(
            "(solved_at IS NULL AND resolution_note IS NULL) OR "
            "(solved_at IS NOT NULL AND resolution_note IS NOT NULL)",
            name="issues_resolution_chk",
        ),
        Index(
            "uniq_unsolved_source",
            "source_measurable_id", "source_week_start",
            unique=True,
            postgresql_where=(
                "solved_at IS NULL AND source_measurable_id IS NOT NULL"
            ),
        ),
    )


class Todo(Base):
    __tablename__ = "todos"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id"))
    title: Mapped[str] = mapped_column(Text)
    owner_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    done_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    source_issue_id: Mapped[str | None] = mapped_column(ForeignKey("issues.id"), nullable=True)
    source_meeting_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Meeting(Base):
    __tablename__ = "meetings"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id"))
    facilitator_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    section: Mapped[str] = mapped_column(Text, default="scorecard")
    section_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scorecard_week: Mapped[date | None] = mapped_column(Date, nullable=True)
    summary_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    __table_args__ = (
        CheckConstraint("section IN ('scorecard','ids','conclude','ended')", name="meetings_section_chk"),
        Index(
            "uniq_active_meeting_per_team",
            "team_id",
            unique=True,
            postgresql_where="ended_at IS NULL",
        ),
    )


class MeetingAttendee(Base):
    __tablename__ = "meeting_attendees"
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id"), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    __table_args__ = (
        CheckConstraint("rating IS NULL OR (rating BETWEEN 1 AND 10)", name="attendee_rating_chk"),
    )
