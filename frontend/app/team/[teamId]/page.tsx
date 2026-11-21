"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TopBar } from "@/components/chrome/TopBar";
import { SideNav } from "@/components/chrome/SideNav";
import { ScrollProgress } from "@/components/chrome/ScrollProgress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Scorecard } from "@/components/scorecard/Scorecard";
import { IssueList } from "@/components/issues/IssueList";
import { TodoList } from "@/components/todos/TodoList";
import { RockCard } from "@/components/rocks/RockCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useActiveMeeting,
  useIssues,
  useMe,
  useNow,
  useRocks,
  useScorecard,
  useStartMeeting,
  useTeam,
  useTodos,
  useUpsertScore,
  useMakeIssue,
  usePatchIssue,
  usePatchTodo,
  useSolveIssue,
  useCreateTodoFromIssue,
  transformScorecard,
  transformIssues,
  transformTodos,
  transformRocks,
} from "@/lib/queries";
import type { User } from "@/lib/types";

type Tab = "scorecard" | "rocks" | "issues" | "todos";

export default function TeamPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const urlTab = (search.get("tab") as Tab) ?? "scorecard";
  const [tab, setTab] = useState<Tab>(urlTab);
  const [issuesSub, setIssuesSub] = useState<"unsolved" | "solved">("unsolved");
  const [startOpen, setStartOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const teamId = params.teamId;

  const { data: me } = useMe();
  const { data: nowInfo } = useNow();
  const { data: activeMeetingData } = useActiveMeeting(teamId);
  const activeMeeting = activeMeetingData?.active ?? null;
  const { data: teamDto } = useTeam(teamId);
  const { data: scDto } = useScorecard(teamId);
  const { data: openIssuesDto } = useIssues(teamId, { solved: false });
  const { data: solvedIssuesDto } = useIssues(teamId, { solved: true });
  const { data: todosDto } = useTodos(teamId);
  const { data: rocksDto } = useRocks(teamId);

  const sc = useMemo(() => transformScorecard(scDto), [scDto]);
  const openIssues = useMemo(() => transformIssues(openIssuesDto), [openIssuesDto]);
  const solvedIssues = useMemo(() => transformIssues(solvedIssuesDto), [solvedIssuesDto]);
  const todos = useMemo(() => transformTodos(todosDto), [todosDto]);
  const rocks = useMemo(() => transformRocks(rocksDto), [rocksDto]);

  const users: User[] = useMemo(() => {
    const members = teamDto?.members ?? [];
    return members.map((u: any) => ({ id: u.id, name: u.name, email: u.email ?? "" }));
  }, [teamDto]);

  const upsertScore = useUpsertScore(teamId);
  const makeIssue = useMakeIssue(teamId);
  const patchIssue = usePatchIssue(teamId);
  const patchTodo = usePatchTodo(teamId);
  const solveIssue = useSolveIssue(teamId);
  const createTodo = useCreateTodoFromIssue(teamId);
  const startMeetingMut = useStartMeeting(teamId);

  useEffect(() => {
    setTab(urlTab);
  }, [urlTab]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setStartOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onEdit({ metricId, weekStart, value }: { metricId: string; weekStart: string; value: number | null }) {
    upsertScore.mutate(
      { measurableId: metricId, weekStart, value },
      {
        onSuccess: () => toast.success("Score updated"),
        onError: () => toast.error("Save failed"),
      },
    );
  }

  function onMakeIssue({ metricId, weekStart }: { metricId: string; weekStart: string }) {
    makeIssue.mutate(
      { measurableId: metricId, weekStart },
      {
        onSuccess: () => {
          toast.success("Issue created", {
            action: {
              label: "Open",
              onClick: () => {
                setTab("issues");
                router.replace(`/team/${teamId}?tab=issues`);
              },
            },
          });
        },
        onError: () => toast.error("Could not create issue"),
      },
    );
  }

  function startMeeting() {
    setStartOpen(false);
    toast.loading("Starting meeting…", { id: "start" });
    startMeetingMut.mutate(undefined, {
      onSuccess: (m: any) => {
        toast.dismiss("start");
        router.push(`/meeting/${m.id}`);
      },
      onError: (e: any) => {
        toast.dismiss("start");
        toast.error(e?.message ?? "Could not start meeting");
      },
    });
  }

  function changeTab(v: string) {
    setTab(v as Tab);
    router.replace(`/team/${teamId}?tab=${v}`);
  }

  const existingIssueKeys = useMemo(() => {
    const s = new Set<string>();
    openIssues.forEach((i) => {
      if (i.source?.measurable_id && i.source?.week_start) {
        s.add(`${i.source.measurable_id}:${i.source.week_start}`);
      }
    });
    return s;
  }, [openIssues]);

  const isObserver = me?.role === "observer";
  const serverToday = nowInfo?.today_local ? new Date(nowInfo.today_local + "T12:00:00Z") : new Date();
  const serverWeekStart = nowInfo?.current_week_start ? new Date(nowInfo.current_week_start + "T12:00:00Z") : serverToday;
  const weekOfStr = serverWeekStart.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }).toUpperCase();
  const todayStr = serverToday.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }).toUpperCase();
  const weekdayStr = serverToday.toLocaleDateString(undefined, { weekday: "long", timeZone: "UTC" }).toUpperCase();
  const fullDateStr = serverToday.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).toUpperCase();

  return (
    <div className="min-h-screen">
      <ScrollProgress />
      <TopBar
        onStartMeeting={() => setStartOpen(true)}
        onCommandK={() => setPaletteOpen(true)}
      />
      <div className="flex">
        <SideNav teamId={teamId} />
        <main className="flex-1 min-w-0 border-r border-[var(--hair)]">
          <div className="px-10 py-10 max-w-[1200px]">
            {activeMeeting && (
              <button
                onClick={() => router.push(`/meeting/${activeMeeting.id}`)}
                className="w-full mb-6 flex items-center justify-between px-5 py-3 rounded-md border border-signal/40 bg-signal/[0.06] hover:bg-signal/[0.10] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-2 w-2 rounded-full bg-signal signal-pulse" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal">LIVE</span>
                  <span className="caps-sm text-fg/80">
                    Meeting in progress · Facilitator: {activeMeeting.facilitator_name ?? "—"} · Section: {activeMeeting.section}
                  </span>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg group-hover:text-signal transition-colors">
                  Join →
                </span>
              </button>
            )}
            <div className="flex items-end justify-between mb-10 pb-5 border-b border-[var(--hair)]">
              <div>
                <div className="caps mb-2">
                  {(teamDto?.name ?? "TEAM").toUpperCase()} · WEEK OF {weekOfStr}
                </div>
                <h1 className="font-serif text-[46px] font-light leading-[1.02] tracking-display">
                  {teamDto?.name ?? "—"}
                </h1>
              </div>
              <div className="text-right">
                <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg">
                  {weekdayStr}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted mt-0.5">
                  {fullDateStr}
                </div>
              </div>
            </div>

            <Tabs value={tab} onValueChange={changeTab}>
              <TabsList>
                <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
                <TabsTrigger value="rocks">Rocks</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="todos">To-Dos</TabsTrigger>
              </TabsList>

              <TabsContent value="scorecard" className="mt-6">
                <Scorecard
                  data={sc}
                  onEdit={onEdit}
                  onMakeIssue={onMakeIssue}
                  existingIssueKeys={existingIssueKeys}
                  readOnly={isObserver}
                />
              </TabsContent>

              <TabsContent value="rocks" className="mt-6 space-y-4">
                {rocks.map((r) => (
                  <RockCard key={r.id} rock={r} users={users} />
                ))}
                {rocks.length === 0 && (
                  <div className="font-serif italic font-light text-[14px] text-muted">
                    No rocks this quarter.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="issues" className="mt-6 space-y-4">
                <div className="flex items-center gap-4 border-b border-[var(--hair)] pb-2">
                  <button
                    onClick={() => setIssuesSub("unsolved")}
                    className={
                      "caps " +
                      (issuesSub === "unsolved" ? "text-fg" : "text-muted hover:text-fg")
                    }
                  >
                    Unsolved · {openIssues.length}
                  </button>
                  <span className="text-muted">·</span>
                  <button
                    onClick={() => setIssuesSub("solved")}
                    className={
                      "caps " +
                      (issuesSub === "solved" ? "text-fg" : "text-muted hover:text-fg")
                    }
                  >
                    Solved · {solvedIssues.length}
                  </button>
                </div>
                <IssueList
                  issues={issuesSub === "solved" ? solvedIssues : openIssues}
                  users={users}
                  solvedView={issuesSub === "solved"}
                  onPriorityChange={(id, p) =>
                    patchIssue.mutate({ id, patch: { priority: p } })
                  }
                  onSolve={(id, note) => {
                    solveIssue.mutate(
                      { id, note },
                      { onSuccess: () => toast.success("Issue solved") },
                    );
                  }}
                  onCreateTodo={(issueId, title, dueDate, ownerId) => {
                    createTodo.mutate(
                      {
                        issueId,
                        title,
                        owner_id: ownerId,
                        due_date: dueDate ? dueDate.slice(0, 10) : undefined,
                      },
                      { onSuccess: () => toast.success("To-do created") },
                    );
                  }}
                />
              </TabsContent>

              <TabsContent value="todos" className="mt-6">
                <TodoList
                  todos={todos}
                  users={users}
                  onToggle={(id, done) =>
                    patchTodo.mutate({ id, patch: { done } })
                  }
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <aside className="hidden lg:flex flex-col w-[280px] shrink-0 bg-surface/30 px-6 py-10 gap-8">
          <div>
            <div className="caps mb-3">§ This week</div>
            <div className="font-serif text-[36px] font-light leading-none tracking-display tnum">
              {sc.metrics.length}
            </div>
            <div className="caps mt-2">METRICS TRACKED</div>
          </div>
          <div className="pt-6 border-t border-[var(--hair)]">
            <div className="caps mb-2">Standout</div>
            <div className="font-serif text-[18px] font-light leading-tight">
              {openIssues[0]?.title ?? "No open issues."}
            </div>
            <div className="caps-sm mt-2">OPEN ISSUE · PRIORITY {openIssues[0]?.priority != null ? openIssues[0]!.priority : "—"}</div>
          </div>
          <div className="pt-6 border-t border-[var(--hair)]">
            <div className="caps mb-2">Open to-dos</div>
            <div className="font-serif text-[36px] font-light leading-none tracking-display tnum">
              {todos.filter((t) => !t.done).length}
            </div>
            <div className="caps mt-2">OUTSTANDING</div>
          </div>
          <div className="mt-auto pt-6 border-t border-[var(--hair)] space-y-1">
            <div className="caps">Shortcuts</div>
            <div className="flex items-center gap-2 text-[11px] text-muted mt-2">
              <span className="font-mono">⌘M</span><span>Start meeting</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted">
              <span className="font-mono">⌘K</span><span>Jump to…</span>
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="caps mb-1">Begin</div>
            <DialogTitle>Start the weekly ten?</DialogTitle>
            <DialogDescription>
              A 90-minute Level-10. All attendees will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setStartOpen(false)}>
              Not yet
            </Button>
            <Button variant="primary" onClick={startMeeting}>
              Start meeting
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Jump to…</DialogTitle>
            <DialogDescription>Command palette · coming soon</DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            placeholder="Type a command"
            className="w-full h-10 rounded-md border border-[var(--hair)] bg-transparent px-3 text-[13px] outline-none focus:border-ink/60"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
