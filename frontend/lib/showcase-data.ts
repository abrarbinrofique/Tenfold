import type {
  Issue,
  Meeting,
  Rock,
  ScorecardData,
  Team,
  Todo,
  User,
} from "./types";

export const demoUsers: User[] = [
  { id: "u1", name: "Avery Admin", email: "avery@tenfold.co" },
  { id: "u2", name: "Mina Patel", email: "mina@tenfold.co" },
  { id: "u3", name: "Diego Rivera", email: "diego@tenfold.co" },
  { id: "u4", name: "Jules Okafor", email: "jules@tenfold.co" },
  { id: "u5", name: "Sam Chen", email: "sam@tenfold.co" },
];

export const demoTeam: Team = {
  id: "t1",
  name: "Leadership",
  members: demoUsers,
};

function monday(weeksBack: number) {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1) - weeksBack * 7);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

const weeks = Array.from({ length: 8 }, (_, i) => {
  const iso = monday(7 - i);
  const d = new Date(iso);
  const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()];
  return { weekStart: iso, label: `${month} ${d.getUTCDate()}` };
});

const metrics = [
  { id: "m1", name: "New demos booked", unit: "number" as const, goalOp: "gte" as const, goal: 10, ownerId: "u2" },
  { id: "m2", name: "Customer churn", unit: "percent" as const, goalOp: "lte" as const, goal: 3, ownerId: "u3" },
  { id: "m3", name: "Avg response time", unit: "hours" as const, goalOp: "between" as const, goal: 2, goalMax: 4, ownerId: "u4" },
  { id: "m4", name: "NPS pulse", unit: "number" as const, goalOp: "gte" as const, goal: 40, ownerId: "u5" },
  { id: "m5", name: "Weekly release", unit: "count" as const, goalOp: "eq" as const, goal: 1, ownerId: "u3" },
  { id: "m6", name: "MRR added", unit: "currency" as const, goalOp: "gte" as const, goal: 8000, ownerId: "u2" },
];

const matrix: Record<string, (number | null)[]> = {
  m1: [12, 11, 8, 14, 9, 10, 13, 7],
  m2: [2.1, 2.8, 3.4, 2.0, 1.8, 2.6, 3.9, 2.4],
  m3: [3.1, 2.4, 4.6, 3.0, 2.8, 2.2, 3.5, null],
  m4: [41, 38, 44, 46, 39, 42, 48, 45],
  m5: [1, 1, 0, 1, 1, 2, 1, 1],
  m6: [9200, 7500, 11000, 8400, 6200, 10400, 9100, 8800],
};

function statusFor(mId: string, v: number | null): "on" | "off" | "pending" {
  if (v == null) return "pending";
  const m = metrics.find((x) => x.id === mId) as import("./types").Metric | undefined;
  if (!m) return "pending";
  const op = m.goalOp;
  if (op === "gte") return v >= m.goal ? "on" : "off";
  if (op === "lte") return v <= m.goal ? "on" : "off";
  if (op === "eq") return v === m.goal ? "on" : "off";
  if (op === "between") return v >= m.goal && v <= (m.goalMax ?? m.goal) ? "on" : "off";
  return "off";
}

export const demoScorecard: ScorecardData = {
  metrics,
  weeks,
  cells: metrics.flatMap((m) =>
    weeks.map((w, i) => ({
      metricId: m.id,
      weekStart: w.weekStart,
      value: matrix[m.id][i],
      status: statusFor(m.id, matrix[m.id][i]),
    })),
  ),
};

export const demoIssues: Issue[] = [
  { id: "i1", title: "Demos pipeline slipping — attribution unclear", priority: 5, ownerId: "u2", source: { kind: "metric", label: "m1 · wk Nov 2" }, status: "open", createdAt: new Date().toISOString() },
  { id: "i2", title: "Churn spike in SMB segment", priority: 4, ownerId: "u3", source: { kind: "metric", label: "m2 · wk Oct 26" }, status: "open", createdAt: new Date().toISOString() },
  { id: "i3", title: "Response time variance on weekends", priority: 3, ownerId: "u4", source: { kind: "metric", label: "m3 · wk Oct 19" }, status: "open", createdAt: new Date().toISOString() },
  { id: "i4", title: "Onboarding doc drift vs. new pricing", priority: 2, ownerId: "u5", source: { kind: "manual", label: "manual" }, status: "open", createdAt: new Date().toISOString() },
  { id: "i5", title: "Need rotation for on-call alerts", priority: 1, ownerId: "u1", status: "open", createdAt: new Date().toISOString() },
];

function offset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export const demoTodos: Todo[] = [
  { id: "t1", title: "Re-run demo attribution for Oct cohort", ownerId: "u2", dueDate: offset(-2), done: false, createdAt: offset(-10) },
  { id: "t2", title: "Pair with support on SMB churn interviews", ownerId: "u3", dueDate: offset(2), done: false, createdAt: offset(-3) },
  { id: "t3", title: "Draft weekend coverage proposal", ownerId: "u4", dueDate: offset(4), done: false, createdAt: offset(-1) },
  { id: "t4", title: "Refresh onboarding doc screenshots", ownerId: "u5", dueDate: offset(9), done: false, createdAt: offset(-1) },
  { id: "t5", title: "Publish Q4 release calendar", ownerId: "u3", dueDate: offset(-5), done: true, createdAt: offset(-14) },
];

export const demoRocks: Rock[] = [
  {
    id: "r1",
    title: "Launch enterprise self-serve onboarding",
    ownerId: "u2",
    status: "on",
    progress: 0.68,
    milestones: [
      { id: "ms1", title: "Spec approved", due: offset(-30), done: true },
      { id: "ms2", title: "Alpha w/ 3 design partners", due: offset(-8), done: true },
      { id: "ms3", title: "Public docs", due: offset(10), done: false },
      { id: "ms4", title: "GA announcement", due: offset(28), done: false },
    ],
  },
  {
    id: "r2",
    title: "Reduce p95 API latency below 220ms",
    ownerId: "u3",
    status: "off",
    progress: 0.34,
    milestones: [
      { id: "ms5", title: "Trace coverage", due: offset(-20), done: true },
      { id: "ms6", title: "Query plan audit", due: offset(-3), done: false },
      { id: "ms7", title: "CDN warm paths", due: offset(14), done: false },
    ],
  },
  {
    id: "r3",
    title: "Publish the Tenfold operating guide",
    ownerId: "u5",
    status: "on",
    progress: 0.45,
    milestones: [
      { id: "ms8", title: "Table of contents", due: offset(-14), done: true },
      { id: "ms9", title: "Draft of 10 sections", due: offset(7), done: false },
      { id: "ms10", title: "Design & typeset", due: offset(24), done: false },
    ],
  },
];

export const demoMeeting: Meeting = {
  id: "mtg1",
  teamId: "t1",
  section: "scorecard",
  sectionStartedAt: new Date(Date.now() - 1000 * 60 * 2 - 1000 * 18).toISOString(),
  startedAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  facilitatorId: "u1",
  attendees: [
    { userId: "u1", present: true, rating: 9 },
    { userId: "u2", present: true, rating: 8 },
    { userId: "u3", present: true },
    { userId: "u4", present: false },
    { userId: "u5", present: true, rating: 10 },
  ],
};
