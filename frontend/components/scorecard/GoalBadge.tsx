import { cn } from "@/lib/cn";
import type { Metric } from "@/lib/types";

function fmt(v: number, unit: Metric["unit"]) {
  switch (unit) {
    case "percent": return `${v}%`;
    case "hours": return `${v} h`;
    case "currency": return `$${v.toLocaleString()}`;
    default: return `${v}`;
  }
}

export function GoalBadge({ metric, className }: { metric: Metric; className?: string }) {
  let label = "";
  switch (metric.goalOp) {
    case "gte":
      label = `≥ ${fmt(metric.goal, metric.unit)}`;
      break;
    case "lte":
      label = `≤ ${fmt(metric.goal, metric.unit)}`;
      break;
    case "eq":
      label = `= ${fmt(metric.goal, metric.unit)}`;
      break;
    case "between":
      label = `${fmt(metric.goal, metric.unit)}–${fmt(metric.goalMax ?? metric.goal, metric.unit)}`;
      break;
  }
  return (
    <span
      className={cn(
        "inline-flex h-[18px] items-center rounded-[3px] border border-[var(--hair)] px-1.5 font-mono text-[10px] tabular-nums text-muted",
        className,
      )}
    >
      {label}
    </span>
  );
}
