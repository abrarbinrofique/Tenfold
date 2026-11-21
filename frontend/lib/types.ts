export type ID = string;

export interface User {
  id: ID;
  name: string;
  email: string;
  role?: string;
  avatarColor?: string;
  teams?: { id: ID; name: string }[];
}

export interface Team {
  id: ID;
  name: string;
  members: User[];
}

export type MetricUnit = "number" | "percent" | "hours" | "currency" | "count";
export type GoalOp = "gte" | "lte" | "eq" | "between";

export interface Metric {
  id: ID;
  name: string;
  unit: MetricUnit;
  goalOp: GoalOp;
  goal: number;
  goalMax?: number; // for between
  ownerId: ID;
}

export type ScoreStatus = "on" | "off" | "pending";

export interface ScoreCell {
  metricId: ID;
  weekStart: string; // ISO Monday
  value: number | null;
  status: ScoreStatus;
}

export interface ScorecardWeek {
  weekStart: string;
  label: string; // e.g. "Nov 2"
}

export interface ScorecardData {
  metrics: Metric[];
  weeks: ScorecardWeek[];
  cells: ScoreCell[];
}

export interface Issue {
  id: ID;
  title: string;
  priority: number; // 0..5
  ownerId?: ID;
  source?: { kind: "metric" | "manual"; label: string; href?: string; measurable_id?: ID; week_start?: string };
  status: "open" | "solved";
  createdAt: string;
  solvedAt?: string;
  resolutionNote?: string;
}

export interface Todo {
  id: ID;
  title: string;
  ownerId: ID;
  dueDate: string; // ISO
  done: boolean;
  doneAt?: string;
  createdAt: string;
}

export interface Milestone {
  id: ID;
  title: string;
  due: string;
  done: boolean;
}

export interface Rock {
  id: ID;
  title: string;
  ownerId: ID;
  status: "on" | "off" | "done";
  progress: number; // 0..1
  milestones: Milestone[];
}

export type MeetingSection = "scorecard" | "ids" | "conclude" | "ended";

export interface Meeting {
  id: ID;
  teamId: ID;
  section: MeetingSection;
  sectionStartedAt: string;
  facilitatorId: ID;
  attendees: { userId: ID; name?: string; present: boolean; rating?: number }[];
  startedAt: string;
  endedAt?: string;
  scorecardWeek?: string;
  summarySnapshot?: {
    scorecard_week?: string;
    issues_solved?: string[];
    todos_created?: string[];
  };
}
