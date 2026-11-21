import os
from datetime import datetime, timedelta, time, date
from zoneinfo import ZoneInfo
from .config import settings

UTC = ZoneInfo("UTC")
TZ = ZoneInfo(settings.company_timezone)


def now_utc() -> datetime:
    raw = os.environ.get("APP_NOW", settings.app_now)
    return datetime.fromisoformat(raw.replace("Z", "+00:00"))


def today_local() -> date:
    return now_utc().astimezone(TZ).date()


def week_start_for(ts_utc: datetime) -> date:
    local = ts_utc.astimezone(TZ)
    monday = local - timedelta(days=local.weekday())
    return monday.date()


def current_week_start() -> date:
    return week_start_for(now_utc())


def week_end_utc(week_start: date) -> datetime:
    sunday = week_start + timedelta(days=6)
    local = datetime.combine(sunday, time(23, 59, 59), TZ)
    return local.astimezone(UTC)


def last_13_weeks(ref: datetime | None = None) -> list[date]:
    ref = ref or now_utc()
    cur = week_start_for(ref)
    return [cur - timedelta(weeks=12 - i) for i in range(13)]
