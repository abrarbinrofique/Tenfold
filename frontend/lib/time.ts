export function isoWeekStart(d: Date = new Date()) {
  const date = new Date(d);
  const day = date.getUTCDay() || 7;
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatWeek(iso: string) {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function fmtDuration(ms: number) {
  const neg = ms < 0;
  const total = Math.max(0, Math.floor(Math.abs(ms) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const str = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return neg ? `-${str}` : str;
}

/**
 * Returns the last fully-closed week (Mon..Sun) relative to appNow in America/Chicago.
 * If appNow is Wed Nov 11, current week is Mon Nov 9; last closed week is Mon Nov 2..Sun Nov 8.
 */
export function getLastClosedWeek(appNow: Date = new Date()) {
  // Treat date in UTC for simplicity; seeded appNow is at 15:00 UTC = 09:00 Chicago.
  const d = new Date(appNow);
  const day = d.getUTCDay() || 7; // Mon=1..Sun=7
  // Monday of current week
  const curMon = new Date(d);
  curMon.setUTCDate(d.getUTCDate() - (day - 1));
  curMon.setUTCHours(0, 0, 0, 0);
  // Monday of last closed week
  const lastMon = new Date(curMon);
  lastMon.setUTCDate(curMon.getUTCDate() - 7);
  const lastSun = new Date(lastMon);
  lastSun.setUTCDate(lastMon.getUTCDate() + 6);
  // End-of-Sunday in Chicago (UTC-6 CST around Nov) ~ Sunday 23:59:59 America/Chicago = Monday 05:59:59 UTC
  const sundayEndUTC = new Date(lastMon);
  sundayEndUTC.setUTCDate(lastMon.getUTCDate() + 7); // next Monday 00:00 UTC
  sundayEndUTC.setUTCHours(5, 59, 59, 999); // 23:59:59 CST (UTC-6)
  const mondayISO = lastMon.toISOString().slice(0, 10);
  const label = `${MONTHS[lastMon.getUTCMonth()].toUpperCase()} ${lastMon.getUTCDate()} → ${MONTHS[lastSun.getUTCMonth()].toUpperCase()} ${lastSun.getUTCDate()}`;
  return { mondayISO, sundayEndUTC, label, mondayDate: lastMon, sundayDate: lastSun };
}

export function fmtDueBadge(iso: string): { label: string; overdue: boolean } {
  const due = new Date(iso);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, overdue: true };
  if (days === 0) return { label: "Today", overdue: false };
  if (days === 1) return { label: "Tomorrow", overdue: false };
  if (days < 7) return { label: `${days}d`, overdue: false };
  return { label: formatWeek(iso), overdue: false };
}
