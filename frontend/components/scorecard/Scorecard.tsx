"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { GoalBadge } from "./GoalBadge";
import { cn } from "@/lib/cn";
import type { Metric, ScorecardData, ScoreCell, ScoreStatus } from "@/lib/types";
import { CornerDownRight } from "lucide-react";

const railColor: Record<ScoreStatus, string> = {
  on: "bg-status-on",
  off: "bg-status-off",
  pending: "bg-status-pending",
};

const statusHex: Record<ScoreStatus, string> = {
  on: "var(--rail-on)",
  off: "var(--rail-off)",
  pending: "var(--rail-pending)",
};

function fmtValue(v: number | null, unit: Metric["unit"]) {
  if (v == null) return "—";
  switch (unit) {
    case "percent": return `${v}%`;
    case "hours": return `${v}h`;
    case "currency":
      return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`;
    default: return `${v}`;
  }
}

interface Props {
  data: ScorecardData;
  readOnly?: boolean;
  onEdit?: (v: { metricId: string; weekStart: string; value: number | null }) => void;
  onMakeIssue?: (v: { metricId: string; weekStart: string }) => void;
  existingIssueKeys?: Set<string>;
}

export function Scorecard({ data, onEdit, onMakeIssue, readOnly, existingIssueKeys }: Props) {
  const hasData = data.weeks && data.weeks.length > 0;
  const current = hasData ? data.weeks[data.weeks.length - 1] : null;
  const map = new Map<string, ScoreCell>();
  data.cells.forEach((c) => map.set(`${c.metricId}:${c.weekStart}`, c));

  // Detect month boundaries for vertical hairlines
  const monthBoundaries = new Set<string>();
  data.weeks.forEach((w, i) => {
    if (i === 0) return;
    const prev = new Date(data.weeks[i - 1].weekStart).getMonth();
    const cur = new Date(w.weekStart).getMonth();
    if (prev !== cur) monthBoundaries.add(w.weekStart);
  });

  // Filter: all vs off-track-only (based on current-week status)
  const [filter, setFilter] = useState<"all" | "off">("all");

  // A metric is "off-track" for the toggle if its LAST CLOSED week (index -2) is off.
  // Current week (last) is mostly pending during the week, so last closed week is what
  // the team actually reviews in the Level-10 meeting.
  const lastClosedWeek = hasData ? (data.weeks[data.weeks.length - 2] ?? current) : null;
  const offTrackMetricIds = useMemo(() => {
    const s = new Set<string>();
    if (!lastClosedWeek) return s;
    for (const m of data.metrics) {
      const c = map.get(`${m.id}:${lastClosedWeek.weekStart}`);
      if (c?.status === "off") s.add(m.id);
    }
    return s;
  }, [data.metrics, map, lastClosedWeek?.weekStart]);
  const offTrackCount = offTrackMetricIds.size;

  // Keyboard focus state
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const currentWeekIndex = data.weeks.length - 1;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Ignore when typing inside an input/textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (isInput) return;
        e.preventDefault();
        setFocusedCell((cur) => {
          if (!cur) return { row: 0, col: currentWeekIndex };
          let { row, col } = cur;
          if (e.key === "ArrowUp") row = Math.max(0, row - 1);
          if (e.key === "ArrowDown") row = Math.min(data.metrics.length - 1, row + 1);
          if (e.key === "ArrowLeft") col = Math.max(0, col - 1);
          if (e.key === "ArrowRight") col = Math.min(data.weeks.length - 1, col + 1);
          return { row, col };
        });
        return;
      }
      if (e.key === "Escape" && !isInput) {
        setFocusedCell(null);
        return;
      }
      if ((e.key === "n" || e.key === "N") && !isInput && focusedCell && !readOnly) {
        const m = data.metrics[focusedCell.row];
        const w = data.weeks[focusedCell.col];
        const c = map.get(`${m.id}:${w.weekStart}`);
        if (c?.status === "off" && !existingIssueKeys?.has(`${m.id}:${w.weekStart}`)) {
          e.preventDefault();
          onMakeIssue?.({ metricId: m.id, weekStart: w.weekStart });
        }
      }
    },
    [data.metrics, data.weeks, focusedCell, currentWeekIndex, map, onMakeIssue, readOnly, existingIssueKeys],
  );

  return (
    <div className="relative">
      {/* Header strip */}
      <div className="flex items-center justify-between gap-3 px-1 pb-2">
        <div className="caps-sm text-muted">
          <span aria-hidden>← → ↑ ↓</span> to navigate <span className="opacity-60">·</span> N to make issue
        </div>
        <div className="flex items-center gap-3">
          <div className="caps-sm font-mono tnum text-muted">
            <span className="text-fg">{offTrackCount}</span> of {data.metrics.length} off-track last week
          </div>
          <div
            role="tablist"
            aria-label="Filter rows"
            className="inline-flex items-stretch rounded-[3px] border border-[var(--hair-strong)] overflow-hidden"
          >
            {(["all", "off"] as const).map((k) => {
              const active = filter === k;
              return (
                <button
                  key={k}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(k)}
                  className={cn(
                    "px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.16em] leading-none transition-colors",
                    active ? "bg-ink text-bg" : "text-muted hover:text-fg",
                    k === "off" && "border-l border-[var(--hair-strong)]",
                  )}
                >
                  {k === "all" ? "All" : "Off-track only"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        ref={wrapRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          // Clear focus when tabbing out of wrapper entirely
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            // keep focus state so visual hint lingers; clear only via Esc
          }
        }}
        className="relative rounded-md border border-[var(--hair)] overflow-hidden bg-bg outline-none focus:outline-none"
      >
        <div className="overflow-x-auto no-scrollbar">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="sticky left-0 z-20 bg-bg border-b border-r border-[var(--hair)] px-4 py-2 w-[240px] h-[36px]">
                  <div className="caps">§ Metric</div>
                </th>
                {data.weeks.map((w) => {
                  const isCurrent = w.weekStart === current?.weekStart;
                  return (
                    <th
                      key={w.weekStart}
                      className={cn(
                        "relative border-b border-[var(--hair)] px-2 py-2 text-right align-middle w-[68px] h-[36px]",
                        isCurrent && "bg-fg/[0.04]",
                        monthBoundaries.has(w.weekStart) && "border-l border-l-[var(--hair-strong)]",
                      )}
                    >
                      {isCurrent && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[1px] font-mono text-[8px] uppercase tracking-[0.18em] text-ink whitespace-nowrap bg-bg px-1">
                          THIS WEEK
                        </span>
                      )}
                      <div className="caps font-mono tnum">{w.label}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {data.metrics.map((m, rowIdx) => {
                const rowValues = data.weeks.map((w) => map.get(`${m.id}:${w.weekStart}`)?.value ?? null);
                const currentCell = map.get(`${m.id}:${current?.weekStart}`);
                const currentStatus: ScoreStatus = currentCell?.status ?? "pending";
                const dimmed = filter === "off" && !offTrackMetricIds.has(m.id);
                return (
                  <tr
                    key={m.id}
                    className={cn(
                      "group transition-opacity duration-[160ms]",
                      dimmed && "opacity-25 pointer-events-none",
                    )}
                  >
                    <td className="sticky left-0 z-10 bg-bg border-b border-r border-[var(--hair)] px-4 py-2 align-middle h-[44px]">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-serif text-[15px] font-light tracking-tightish text-fg leading-tight">{m.name}</div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="caps-sm">{m.unit}</span>
                            <GoalBadge metric={m} />
                          </div>
                          <div className="mt-1.5">
                            <MetricSparkline values={rowValues} endStatus={currentStatus} />
                          </div>
                        </div>
                      </div>
                    </td>
                    {data.weeks.map((w, colIdx) => {
                      const c = map.get(`${m.id}:${w.weekStart}`);
                      const isCurrent = w.weekStart === current?.weekStart;
                      const isFocused =
                        !!focusedCell &&
                        focusedCell.row === rowIdx &&
                        focusedCell.col === colIdx;
                      return (
                        <Cell
                          key={w.weekStart}
                          cell={c}
                          metric={m}
                          current={isCurrent}
                          monthBoundary={monthBoundaries.has(w.weekStart)}
                          readOnly={readOnly}
                          focused={isFocused}
                          onFocusClick={() => setFocusedCell({ row: rowIdx, col: colIdx })}
                          onSave={(v) =>
                            onEdit?.({ metricId: m.id, weekStart: w.weekStart, value: v })
                          }
                          onMakeIssue={() =>
                            onMakeIssue?.({ metricId: m.id, weekStart: w.weekStart })
                          }
                          hasIssue={existingIssueKeys?.has(`${m.id}:${w.weekStart}`)}
                        />
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricSparkline({
  values,
  endStatus,
}: {
  values: (number | null)[];
  endStatus: ScoreStatus;
}) {
  const W = 170;
  const H = 18;
  const padY = 2;
  const nums = values.filter((v): v is number => v != null);
  if (nums.length < 2) {
    // Render empty space (keeps vertical rhythm) — flat baseline if we have exactly 1 point
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" aria-hidden>
        {nums.length === 1 && (
          <line
            x1={0}
            x2={W}
            y1={H / 2}
            y2={H / 2}
            stroke="var(--ink)"
            strokeOpacity={0.6}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    );
  }
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min;
  const n = values.length;
  const stepX = n > 1 ? W / (n - 1) : 0;

  const yFor = (v: number) => {
    if (range === 0) return H / 2;
    return padY + (H - padY * 2) * (1 - (v - min) / range);
  };

  // Build segmented path (break on nulls)
  const segments: string[] = [];
  let cur = "";
  values.forEach((v, i) => {
    if (v == null) {
      if (cur) {
        segments.push(cur);
        cur = "";
      }
      return;
    }
    const x = i * stepX;
    const y = yFor(v);
    cur += (cur === "" ? `M${x.toFixed(2)},${y.toFixed(2)}` : ` L${x.toFixed(2)},${y.toFixed(2)}`);
  });
  if (cur) segments.push(cur);

  // Last non-null index for dot
  let lastIdx = -1;
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] != null) {
      lastIdx = i;
      break;
    }
  }
  const lastX = lastIdx >= 0 ? lastIdx * stepX : W;
  const lastY = lastIdx >= 0 ? yFor(values[lastIdx] as number) : H / 2;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" aria-hidden>
      {segments.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="var(--ink)"
          strokeOpacity={0.6}
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {lastIdx >= 0 && (
        <circle cx={lastX} cy={lastY} r={1.75} fill={statusHex[endStatus]} />
      )}
    </svg>
  );
}

function Cell({
  cell,
  metric,
  current,
  monthBoundary,
  readOnly,
  focused,
  onFocusClick,
  onSave,
  onMakeIssue,
  hasIssue,
}: {
  cell?: ScoreCell;
  metric: Metric;
  current: boolean;
  monthBoundary?: boolean;
  readOnly?: boolean;
  focused?: boolean;
  onFocusClick?: () => void;
  onSave: (v: number | null) => void;
  onMakeIssue: () => void;
  hasIssue?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState<string>(cell?.value?.toString() ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setVal(cell?.value?.toString() ?? "");
  }, [cell?.value]);

  const status = cell?.status ?? "pending";

  function commit() {
    const num = val.trim() === "" ? null : Number(val);
    if (val.trim() !== "" && Number.isNaN(num)) {
      setVal(cell?.value?.toString() ?? "");
    } else {
      onSave(num);
    }
    setEditing(false);
  }

  return (
    <td
      className={cn(
        "relative border-b border-[var(--hair)] px-2 pt-2 text-right align-top w-[68px] h-[46px]",
        cell?.status === "off" && !readOnly ? "pb-4" : "pb-2",
        current && "bg-fg/[0.04]",
        monthBoundary && "border-l border-l-[var(--hair-strong)]",
      )}
      style={
        current
          ? { boxShadow: "inset 1px 0 0 0 rgba(0,0,0,0.12), inset -1px 0 0 0 rgba(0,0,0,0.12)" }
          : undefined
      }
    >
      {/* focus ring */}
      {focused && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[1px] rounded-[2px]"
          style={{ boxShadow: "inset 0 0 0 1px var(--ink)" }}
        />
      )}
      {/* rail */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1.5 bottom-1.5 w-[2px]",
          status === "off" && hasIssue ? "bg-status-pending" : railColor[status],
        )}
      />
      {/* dot */}
      <span
        aria-hidden
        className={cn(
          "absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full",
          status === "off" && hasIssue ? "bg-status-pending" : railColor[status],
        )}
      />

      {editing ? (
        <input
          ref={inputRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setVal(cell?.value?.toString() ?? "");
              setEditing(false);
            }
          }}
          className="w-full bg-transparent border-0 outline-none font-mono text-[13px] tnum text-right pr-2"
        />
      ) : (
        <button
          type="button"
          disabled={readOnly}
          onClick={() => {
            onFocusClick?.();
            if (!readOnly) setEditing(true);
          }}
          className={cn(
            "font-mono tnum text-[13px] text-fg w-full text-right pr-2",
            readOnly && "cursor-default",
            !readOnly && "hover:text-ink",
          )}
        >
          {fmtValue(cell?.value ?? null, metric.unit)}
        </button>
      )}

      {!readOnly && !editing && cell?.status === "off" && (
        hasIssue ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); import("sonner").then(({ toast }) => toast("Issue already created for this week.")); }}
            title="Issue already created"
            className="absolute left-1.5 right-1.5 bottom-0.5 flex items-center justify-center gap-0.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-[color:var(--rail-pending)] leading-none"
          >
            <CornerDownRight className="h-2 w-2" />
            <span>open</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMakeIssue(); }}
            title="Make it an Issue"
            className="absolute left-1.5 right-1.5 bottom-0.5 flex items-center justify-center gap-0.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-[color:var(--rail-off)] hover:text-signal leading-none"
          >
            <CornerDownRight className="h-2 w-2" />
            <span>issue</span>
          </button>
        )
      )}
    </td>
  );
}

export function ScorecardReadOnly(props: Omit<Props, "readOnly">) {
  return <Scorecard {...props} readOnly />;
}
