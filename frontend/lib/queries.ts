"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiPut } from "./api";
import type { Meeting, User } from "./types";

export const qk = {
  me: ["me"] as const,
  team: (id: string) => ["team", id] as const,
  scorecard: (teamId: string) => ["scorecard", teamId] as const,
  issues: (teamId: string, solved: boolean) => ["issues", teamId, solved] as const,
  todos: (teamId: string) => ["todos", teamId] as const,
  rocks: (teamId: string) => ["rocks", teamId] as const,
  meeting: (id: string) => ["meeting", id] as const,
};

export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: () => apiGet<User>("/me"),
    staleTime: 60_000,
  });
}

export function useNow() {
  return useQuery({
    queryKey: ["now"],
    queryFn: () => apiGet<{ now_utc: string; today_local: string; current_week_start: string }>("/now"),
    staleTime: 60_000,
  });
}

export function useActiveMeeting(teamId: string) {
  return useQuery({
    queryKey: ["active-meeting", teamId],
    queryFn: () => apiGet<{ active: null | { id: string; section: string; facilitator_name: string | null } }>(`/teams/${teamId}/active-meeting`),
    enabled: !!teamId,
    refetchInterval: 5000,
  });
}

export function useTeam(teamId: string) {
  return useQuery({
    queryKey: qk.team(teamId),
    queryFn: () => apiGet<any>(`/teams/${teamId}`),
    enabled: !!teamId,
  });
}

export function useScorecard(teamId: string) {
  return useQuery({
    queryKey: qk.scorecard(teamId),
    queryFn: () => apiGet<any>(`/teams/${teamId}/scorecard`),
    enabled: !!teamId,
  });
}

export function useIssues(teamId: string, opts: { solved?: boolean } = {}) {
  const solved = !!opts.solved;
  return useQuery({
    queryKey: qk.issues(teamId, solved),
    queryFn: () => apiGet<{ issues: any[] }>(`/teams/${teamId}/issues?solved=${solved}`),
    enabled: !!teamId,
  });
}

export function useTodos(teamId: string) {
  return useQuery({
    queryKey: qk.todos(teamId),
    queryFn: () => apiGet<{ todos: any[] }>(`/teams/${teamId}/todos`),
    enabled: !!teamId,
  });
}

export function useRocks(teamId: string) {
  return useQuery({
    queryKey: qk.rocks(teamId),
    queryFn: () => apiGet<{ rocks: any[] }>(`/teams/${teamId}/rocks`),
    enabled: !!teamId,
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: qk.meeting(id),
    queryFn: () => apiGet<Meeting & any>(`/meetings/${id}`),
    enabled: !!id,
    // WebSocket is the primary sync path; this short poll is a safety net
    // so section advances still land on peers within 3s even if WS drops.
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  });
}

export function useUpsertScore(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { measurableId: string; weekStart: string; value: number | null; version?: number }) =>
      apiPut(`/measurables/${v.measurableId}/scores/${v.weekStart}`, {
        value: v.value,
        version: v.version,
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.scorecard(teamId) }),
  });
}

export function useMakeIssue(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { measurableId: string; weekStart: string }) =>
      apiPost(`/measurables/${v.measurableId}/weeks/${v.weekStart}/issue`),
    onMutate: async (v) => {
      // Optimistic: inject a placeholder unsolved issue so the cell flips to
      // "OPEN" (amber) instantly. On success we refetch to pick up real id.
      const key = qk.issues(teamId, false);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<any>(key);
      qc.setQueryData<any>(key, (old: any) => {
        const placeholder = {
          id: `__pending_${v.measurableId}_${v.weekStart}`,
          title: "Creating…",
          owner_id: null,
          priority: null,
          created_at: new Date().toISOString(),
          solved_at: null,
          resolution_note: null,
          source: { measurable_id: v.measurableId, week_start: v.weekStart },
        };
        const existing = old?.issues ?? [];
        return { ...(old ?? {}), issues: [placeholder, ...existing] };
      });
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.issues(teamId, false) });
    },
  });
}

export function useCreateIssue(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { title: string; priority?: number; owner_id?: string }) =>
      apiPost(`/teams/${teamId}/issues`, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.issues(teamId, false) }),
  });
}

export function usePatchIssue(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: { priority?: number; title?: string } }) =>
      apiPatch(`/issues/${v.id}`, v.patch),
    onMutate: async (v) => {
      const key = qk.issues(teamId, false);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<any>(key);
      qc.setQueryData<any>(key, (old: any) => {
        if (!old?.issues) return old;
        return {
          ...old,
          issues: old.issues.map((i: any) =>
            i.id === v.id ? { ...i, ...v.patch } : i,
          ),
        };
      });
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["issues", teamId] }),
  });
}

export function useSolveIssue(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; note: string }) =>
      apiPost(`/issues/${v.id}/solve`, { note: v.note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issues", teamId] });
      qc.invalidateQueries({ queryKey: qk.todos(teamId) });
    },
  });
}

export function useCreateTodoFromIssue(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { issueId: string; title: string; owner_id?: string; due_date?: string }) =>
      apiPost(`/issues/${v.issueId}/todos`, {
        title: v.title,
        owner_id: v.owner_id,
        due_date: v.due_date,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.todos(teamId) }),
  });
}

export function usePatchTodo(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: { done?: boolean; title?: string; due_date?: string } }) =>
      apiPatch(`/todos/${v.id}`, v.patch),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.todos(teamId) });
      const prev = qc.getQueryData<any>(qk.todos(teamId));
      if (prev?.todos) {
        qc.setQueryData(qk.todos(teamId), {
          ...prev,
          todos: prev.todos.map((t: any) =>
            t.id === v.id
              ? { ...t, done_at: v.patch.done ? new Date().toISOString() : null, ...v.patch }
              : t,
          ),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.todos(teamId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.todos(teamId) }),
  });
}

export function useStartMeeting(teamId: string) {
  return useMutation({
    mutationFn: () => apiPost<Meeting>(`/teams/${teamId}/meetings`),
  });
}

export function useJoinMeeting(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost(`/meetings/${meetingId}/join`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.meeting(meetingId) }),
  });
}

export function useAdvance(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost(`/meetings/${meetingId}/advance`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.meeting(meetingId) }),
  });
}

export function useEnd(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost(`/meetings/${meetingId}/end`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.meeting(meetingId) }),
  });
}

export function useRate(meetingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rating: number) =>
      apiPost(`/meetings/${meetingId}/rating`, { rating }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.meeting(meetingId) }),
  });
}

// --- Transforms: server DTO -> frontend shape ---

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function labelFor(iso: string) {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function goalOpFrom(goal: any): { op: "gte" | "lte" | "eq" | "between"; goal: number; goalMax?: number } {
  const t = goal?.type ?? "at_least";
  if (t === "between") {
    return { op: "between", goal: Number(goal.min ?? 0), goalMax: Number(goal.max ?? 0) };
  }
  const map: Record<string, "gte" | "lte" | "eq"> = {
    at_least: "gte",
    at_most: "lte",
    exactly: "eq",
    gte: "gte",
    lte: "lte",
    eq: "eq",
  };
  return { op: map[t] ?? "gte", goal: Number(goal.value ?? 0) };
}

function statusMap(s: string): "on" | "off" | "pending" {
  if (s === "on_track" || s === "on") return "on";
  if (s === "off_track" || s === "off") return "off";
  return "pending";
}

export function transformScorecard(dto: any): import("./types").ScorecardData {
  if (!dto) return { metrics: [], weeks: [], cells: [] };
  const weeks = (dto.weeks ?? []).map((w: string) => ({ weekStart: w, label: labelFor(w) }));
  const metrics = (dto.measurables ?? []).map((m: any) => {
    const g = goalOpFrom(m.goal ?? {});
    return {
      id: m.id,
      name: m.name,
      unit: (m.unit as any) ?? "number",
      ownerId: m.owner_id,
      goalOp: g.op,
      goal: g.goal,
      goalMax: g.goalMax,
    };
  });
  const cells = (dto.measurables ?? []).flatMap((m: any) =>
    (m.cells ?? []).map((c: any) => ({
      metricId: m.id,
      weekStart: c.week_start,
      value: c.value == null ? null : Number(c.value),
      status: statusMap(c.status),
    })),
  );
  return { metrics, weeks, cells };
}

export function transformIssues(dto: any): import("./types").Issue[] {
  const rows = dto?.issues ?? [];
  return rows.map((i: any) => ({
    id: i.id,
    title: i.title,
    priority: i.priority == null ? null : Number(i.priority),
    ownerId: i.owner_id,
    createdAt: i.created_at,
    solvedAt: i.solved_at ?? undefined,
    resolutionNote: i.resolution_note ?? undefined,
    status: i.solved_at ? "solved" : "open",
    source: i.source
      ? {
          kind: "metric",
          label: `${i.source.measurable_id} · wk ${labelFor(i.source.week_start)}`,
          measurable_id: i.source.measurable_id,
          week_start: i.source.week_start,
        }
      : undefined,
  }));
}

export function transformTodos(dto: any): import("./types").Todo[] {
  const rows = dto?.todos ?? [];
  return rows.map((t: any) => ({
    id: t.id,
    title: t.title,
    ownerId: t.owner_id,
    dueDate: t.due_date ?? "",
    done: !!t.done_at,
    doneAt: t.done_at ?? undefined,
    createdAt: t.created_at ?? new Date().toISOString(),
  }));
}

export function transformRocks(dto: any): import("./types").Rock[] {
  const rows = dto?.rocks ?? [];
  return rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    ownerId: r.owner_id,
    status: r.status === "done" ? "done" : r.status === "off_track" ? "off" : "on",
    progress: (r.progress_percent ?? 0) / 100,
    milestones: (r.milestones ?? []).map((m: any) => ({
      id: m.id,
      title: m.title,
      due: m.due_date,
      done: !!m.done,
    })),
  }));
}
