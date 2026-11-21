"use client";

import { useState, useRef } from "react";
import { ArrowUpRight, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Issue, User } from "@/lib/types";
import { cn } from "@/lib/cn";
import { IssueSolveDrawer } from "./IssueSolveDrawer";

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
function fmtSolvedAt(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function IssueList({
  issues,
  users,
  solvedView = false,
  onPriorityChange,
  onSolve,
  onCreateTodo,
}: {
  issues: Issue[];
  users: User[];
  solvedView?: boolean;
  onPriorityChange?: (id: string, priority: number) => void;
  onSolve?: (id: string, note: string) => void;
  onCreateTodo?: (issueId: string, title: string, dueDate: string, ownerId: string) => void;
}) {
  const [solvingId, setSolvingId] = useState<string | null>(null);
  const solving = issues.find((i) => i.id === solvingId) || null;

  const sorted = [...issues].sort((a, b) =>
    solvedView
      ? new Date(b.solvedAt ?? 0).getTime() - new Date(a.solvedAt ?? 0).getTime()
      : (b.priority ?? 0) - (a.priority ?? 0),
  );

  return (
    <>
      <div className="rounded-md border border-[var(--hair)] overflow-hidden bg-bg">
        <div className="grid grid-cols-[140px_1fr_120px_160px_100px] border-b border-[var(--hair)] px-4 py-2 caps">
          <div>Priority</div>
          <div>Issue</div>
          <div>Source</div>
          <div></div>
          <div></div>
        </div>
        <ul>
          {sorted.map((iss) => {
            const owner = users.find((u) => u.id === iss.ownerId);
            const solved = solvedView || iss.status === "solved";
            return (
              <li
                key={iss.id}
                className={cn(
                  "grid grid-cols-[140px_1fr_120px_160px_100px] items-start px-4 py-3 border-b last:border-b-0 border-[var(--hair)] group",
                  solved ? "text-muted" : "hover:bg-fg/[0.02]",
                )}
              >
                <PriorityStars
                  value={iss.priority ?? 0}
                  disabled={solved}
                  onChange={(v) => !solved && onPriorityChange?.(iss.id, v)}
                />
                <div className="text-[13px] pr-4 pt-[2px]">
                  <div className={cn("truncate", solved && "line-through text-muted")}>
                    {iss.title}
                  </div>
                  {solved && iss.resolutionNote && (
                    <div className="mt-1 font-serif italic text-[13px] font-light text-muted leading-snug">
                      {iss.resolutionNote}
                    </div>
                  )}
                </div>
                <div className="pt-[2px]">
                  {iss.source ? (
                    <span className="inline-flex items-center gap-1 rounded-[3px] border border-[var(--hair)] px-1.5 h-[18px] font-mono text-[10px] text-muted">
                      {iss.source.label}
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  ) : null}
                </div>
                <div className="pt-[1px] flex items-center gap-1.5" title={owner ? `Owner: ${owner.name}` : ""}>
                  {owner ? <Avatar userId={owner.id} name={owner.name} size={20} /> : null}
                  {owner && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted leading-none whitespace-nowrap">
                      {owner.name}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {solved ? (
                    <span className="inline-flex items-center rounded-[3px] border border-[var(--hair)] px-1.5 h-[20px] font-mono text-[10px] uppercase tracking-[0.14em] text-muted tnum">
                      {fmtSolvedAt(iss.solvedAt)}
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setSolvingId(iss.id)}>
                      Solve
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
          {sorted.length === 0 && (
            <li className="px-4 py-10 text-center">
              <span className="font-serif italic font-light text-[14px] text-muted">
                {solvedView ? "No solved issues yet." : "No open issues."}
              </span>
            </li>
          )}
        </ul>
      </div>

      <IssueSolveDrawer
        issue={solving}
        users={users}
        open={!!solving}
        onOpenChange={(o) => !o && setSolvingId(null)}
        onSubmit={({ note, todo }) => {
          if (solving) {
            onSolve?.(solving.id, note);
            if (todo) {
              onCreateTodo?.(solving.id, todo.title, todo.dueDate, todo.ownerId);
            }
          }
          setSolvingId(null);
        }}
      />
    </>
  );
}

function PriorityStars({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange?: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      tabIndex={disabled ? -1 : 0}
      className="flex items-center gap-0.5 outline-none"
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "ArrowRight") {
          onChange?.(Math.min(5, value + 1));
          e.preventDefault();
        }
        if (e.key === "ArrowLeft") {
          onChange?.(Math.max(0, value - 1));
          e.preventDefault();
        }
      }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          disabled={disabled}
          onClick={() => onChange?.(i === value ? i - 1 : i)}
          className="p-0.5"
          aria-label={`Priority ${i}`}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5 transition-colors",
              i <= value ? "fill-ink text-ink" : "text-muted/40",
              disabled && "opacity-60",
            )}
          />
        </button>
      ))}
    </div>
  );
}
