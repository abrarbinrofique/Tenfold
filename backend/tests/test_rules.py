from datetime import date, datetime, timezone, timedelta
from app.rules.rules import (
    Goal, MilestoneLite, TodoLite, IssueLite,
    measurable_status, todo_completion, rock_status, rock_progress, issue_order,
    round_half_up, round_rating,
)


def test_at_least_boundary_on_track():
    assert measurable_status(10, Goal("at_least", value=10), False) == "on_track"


def test_at_least_below_off_track():
    assert measurable_status(9, Goal("at_least", value=10), False) == "off_track"


def test_at_most_boundary_on_track():
    assert measurable_status(3.0, Goal("at_most", value=3.0), False) == "on_track"


def test_between_inclusive():
    g = Goal("between", min=2, max=4)
    assert measurable_status(2, g, False) == "on_track"
    assert measurable_status(4, g, False) == "on_track"
    assert measurable_status(4.5, g, False) == "off_track"


def test_exactly():
    g = Goal("exactly", value=1)
    assert measurable_status(1, g, False) == "on_track"
    assert measurable_status(2, g, False) == "off_track"


def test_missing_current_week_is_pending():
    assert measurable_status(None, Goal("at_least", value=10), True) == "pending"


def test_missing_past_week_is_off_track():
    assert measurable_status(None, Goal("at_least", value=10), False) == "off_track"


def test_todo_completion_none_when_no_due():
    assert todo_completion([], datetime(2026, 11, 8, tzinfo=timezone.utc)) is None


def test_todo_completion_meets_target_exact_90():
    week_end = datetime(2026, 11, 8, 23, 59, 59, tzinfo=timezone.utc)
    done = TodoLite(done_at=datetime(2026, 11, 8, 12, tzinfo=timezone.utc))
    not_done = TodoLite(done_at=None)
    todos = [done] * 9 + [not_done] * 1
    r = todo_completion(todos, week_end)
    assert r["due"] == 10 and r["done"] == 9 and r["meets_target"] is True
    assert r["rate_percent"] == 90


def test_todo_done_after_week_end_counts_not_done():
    week_end = datetime(2026, 11, 8, 23, 59, 59, tzinfo=timezone.utc)
    after = TodoLite(done_at=week_end + timedelta(seconds=10))
    r = todo_completion([after], week_end)
    assert r["done"] == 0


def test_rock_milestone_due_today_not_past():
    today = date(2026, 11, 11)
    r = rock_status("on_track", [MilestoneLite(due_date=today, done=False)], today)
    assert r == "on_track"


def test_rock_milestone_past_due_flips_off_track():
    today = date(2026, 11, 11)
    r = rock_status("on_track", [MilestoneLite(due_date=today - timedelta(days=1), done=False)], today)
    assert r == "off_track"


def test_rock_complete_sticks():
    today = date(2026, 11, 11)
    r = rock_status("complete", [MilestoneLite(due_date=today - timedelta(days=5), done=False)], today)
    assert r == "complete"


def test_rock_progress_zero_milestones():
    assert rock_progress([], "on_track") == 0
    assert rock_progress([], "complete") == 100


def test_rock_progress_rounds_half_up():
    ms = [MilestoneLite(due_date=date.today(), done=True)] * 3 + [MilestoneLite(due_date=date.today(), done=False)] * 5
    # 3/8 = 37.5 -> 38
    assert rock_progress(ms, "on_track") == 38


def test_round_half_up_examples():
    assert round_half_up(12.5) == 13
    assert round_half_up(11.5) == 12  # banker's would give 12 too; half-up gives 12
    assert round_half_up(0.4) == 0


def test_round_rating_one_decimal():
    assert round_rating(8.25) == 8.3
    assert round_rating(8.0) == 8.0


def test_issue_order_unpriotized_first_then_desc_priority_then_oldest_first():
    base = datetime(2026, 11, 1, tzinfo=timezone.utc)
    a = IssueLite("a", None, base)
    b = IssueLite("b", 5, base + timedelta(hours=1))
    c = IssueLite("c", 5, base)
    d = IssueLite("d", 3, base)
    assert issue_order([b, c, d, a]) == ["a", "c", "b", "d"]
