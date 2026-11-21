"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { fmtDueBadge, getLastClosedWeek } from "@/lib/time";
import type { Todo, User } from "@/lib/types";

function groupOf(t: Todo): "done" | "overdue" | "week" | "later" {
  if (t.done) return "done";
  const due = new Date(t.dueDate).getTime();
  const now = Date.now();
  const diffDays = (due - now) / 86400000;
  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "week";
  return "later";
}

export function TodoList({
  todos,
  users,
  onToggle,
}: {
  todos: Todo[];
  users: User[];
  onToggle?: (id: string, done: boolean) => void;
}) {
  const groups = {
    overdue: todos.filter((t) => groupOf(t) === "overdue"),
    week: todos.filter((t) => groupOf(t) === "week"),
    later: todos.filter((t) => groupOf(t) === "later"),
    done: todos.filter((t) => groupOf(t) === "done"),
  };

  const lcw = getLastClosedWeek();
  const dueLast = todos.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate + (t.dueDate.length === 10 ? "T00:00:00Z" : ""));
    return d >= lcw.mondayDate && d <= new Date(lcw.sundayDate.getTime() + 86_399_000);
  });
  const doneLast = dueLast.filter((t) => {
    if (!t.doneAt) return false;
    return new Date(t.doneAt) <= lcw.sundayEndUTC;
  });
  const total = dueLast.length;
  const doneCount = doneLast.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const meetsTarget = total > 0 && pct >= 80;

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-[var(--hair)] bg-surface/30 px-6 py-5">
        <div className="caps">LAST CLOSED WEEK · {lcw.label}</div>
        <div className="mt-3 h-px bg-[var(--hair)]" />
        {total === 0 ? (
          <div className="mt-4 font-serif italic font-light text-[16px] text-muted">
            Nothing due.
          </div>
        ) : (
          <div className="mt-4 flex items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="font-serif font-light tracking-display leading-none tnum" style={{ fontSize: 32 }}>
                {doneCount} of {total}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                done · {pct}%
              </span>
            </div>
            <span
              className={cn(
                "inline-flex items-center rounded-[3px] border px-2 h-[22px] font-mono text-[10px] uppercase tracking-[0.14em]",
                meetsTarget
                  ? "border-[color:var(--rail-on)]/40 text-[color:var(--rail-on)]"
                  : "border-[var(--hair)] text-muted",
              )}
            >
              meets target: {meetsTarget ? "yes" : "no"}
            </span>
          </div>
        )}
      </section>

      {groups.overdue.length > 0 && (
        <Group title="Overdue" tone="rose">
          {groups.overdue.map((t) => (
            <Row key={t.id} todo={t} users={users} onToggle={onToggle} />
          ))}
        </Group>
      )}
      <Group title="Due this week">
        {groups.week.map((t) => (
          <Row key={t.id} todo={t} users={users} onToggle={onToggle} />
        ))}
        {groups.week.length === 0 && <Empty>Nothing due this week.</Empty>}
      </Group>
      <Group title="Later">
        {groups.later.map((t) => (
          <Row key={t.id} todo={t} users={users} onToggle={onToggle} />
        ))}
        {groups.later.length === 0 && <Empty>Nothing scheduled later.</Empty>}
      </Group>
      {groups.done.length > 0 && (
        <Group title="Done">
          {groups.done.map((t) => (
            <Row key={t.id} todo={t} users={users} onToggle={onToggle} />
          ))}
        </Group>
      )}
    </div>
  );
}

function Group({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: "rose";
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="flex items-center gap-2 mb-2">
        <span className={cn("caps", tone === "rose" && "text-rose-500")}>{title}</span>
        <span className="h-px flex-1 bg-[var(--hair)]" />
      </header>
      <div className="rounded-md border border-[var(--hair)] overflow-hidden bg-bg">
        {children}
      </div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-8 flex flex-col items-center gap-2">
      <span className="h-px w-16 bg-[var(--hair-strong)]" />
      <div className="font-serif italic font-light text-[14px] text-muted">
        {typeof children === "string" ? children : "Nothing yet."}
      </div>
    </div>
  );
}

function Row({
  todo,
  users,
  onToggle,
}: {
  todo: Todo;
  users: User[];
  onToggle?: (id: string, done: boolean) => void;
}) {
  const owner = users.find((u) => u.id === todo.ownerId);
  const due = fmtDueBadge(todo.dueDate);
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 border-[var(--hair)] hover:bg-fg/[0.02]">
      <Checkbox
        checked={todo.done}
        onCheckedChange={(v) => onToggle?.(todo.id, !!v)}
      />
      <div
        className={cn(
          "flex-1 text-[13px] truncate",
          todo.done && "line-through text-muted",
        )}
      >
        {todo.title}
      </div>
      {owner && (
        <div className="flex items-center gap-1.5 shrink-0" title={`Assigned to ${owner.name}`}>
          <Avatar userId={owner.id} name={owner.name} size={20} />
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted leading-none">
            {owner.name}
          </span>
        </div>
      )}
      <span
        className={cn(
          "inline-flex items-center rounded-[3px] border border-[var(--hair)] px-1.5 h-[18px] font-mono text-[10px] tnum",
          due.overdue && !todo.done ? "text-rose-500 border-rose-500/30" : "text-muted",
          todo.done && "text-muted/50",
        )}
      >
        {due.label}
      </span>
    </div>
  );
}
