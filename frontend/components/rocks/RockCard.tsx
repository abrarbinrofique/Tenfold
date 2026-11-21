"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { Rock, User } from "@/lib/types";
import { useNow } from "@/lib/queries";

export function RockCard({ rock, users }: { rock: Rock; users: User[] }) {
  const owner = users.find((u) => u.id === rock.ownerId);
  const statusVar =
    rock.status === "on" ? "on" : rock.status === "off" ? "off" : "neutral";
  const now = Date.now();
  const sorted = [...rock.milestones].sort(
    (a, b) => new Date(a.due).getTime() - new Date(b.due).getTime(),
  );

  const nowQ = useNow();
  const todayISO = nowQ.data?.today_local;
  let todayMarker: { pct: number; overflow: boolean } | null = null;
  if (todayISO && sorted.length >= 2) {
    const minT = new Date(sorted[0].due).getTime();
    const maxT = new Date(sorted[sorted.length - 1].due).getTime();
    const todayT = new Date(todayISO + "T12:00:00Z").getTime();
    if (maxT > minT && todayT >= minT) {
      const raw = (todayT - minT) / (maxT - minT);
      todayMarker = { pct: Math.min(1, Math.max(0, raw)) * 100, overflow: raw > 1 };
    }
  }

  return (
    <article className="rounded-md border border-[var(--hair)] bg-surface/40 p-6 hover:bg-surface/60 transition-colors duration-[160ms]">
      <div className="flex items-start gap-5">
        <div className="flex flex-col items-center shrink-0">
          <Ring progress={rock.progress} />
          <div className="caps-sm mt-1.5">COMPLETE</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-serif text-[22px] font-light leading-[1.1] tracking-display">
              {rock.title}
            </h3>
            <Badge variant={statusVar as any}>
              {rock.status === "done" ? "Done" : rock.status === "on" ? "On track" : "Off track"}
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[12px] text-muted">
            {owner && (
              <span className="inline-flex items-center gap-1.5">
                <Avatar userId={owner.id} name={owner.name} size={18} />
                {owner.name}
              </span>
            )}
            <span>·</span>
            <span className="font-mono tnum">
              {Math.round(rock.progress * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 relative">
        <div className="absolute left-0 right-0 top-[11px] h-px bg-[var(--hair)]" />
        {todayMarker && (
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-20"
            style={{ left: `${todayMarker.pct}%`, transform: "translateX(-0.5px)" }}
            aria-hidden
          >
            <div
              className="absolute -top-[14px] left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink whitespace-nowrap bg-surface/40 px-1 leading-none"
              style={{ opacity: 0.85 }}
            >
              {todayMarker.overflow ? "Today ›" : "Today"}
            </div>
            <div
              className="absolute left-1/2 -translate-x-1/2 w-px bg-ink"
              style={{ top: "-2px", height: "4px", opacity: 0.4 }}
            />
            <svg
              className="absolute left-0 top-0 h-full w-px overflow-visible"
              preserveAspectRatio="none"
              aria-hidden
            >
              <line
                x1="0"
                x2="0"
                y1="0"
                y2="100%"
                stroke="var(--ink)"
                strokeOpacity={0.4}
                strokeWidth={1}
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        )}
        <ol className="relative flex items-start justify-between">
          {sorted.map((m) => {
            const past = new Date(m.due).getTime() < now;
            const state = m.done ? "done" : past ? "late" : "future";
            return (
              <li key={m.id} className="flex flex-col items-center text-center w-0 flex-1">
                <span
                  className={cn(
                    "relative z-10 h-[22px] w-[22px] rounded-full border flex items-center justify-center bg-bg",
                    state === "done" && "bg-ink border-ink",
                    state === "late" && "bg-rose-500 border-rose-500",
                    state === "future" && "border-[var(--hair)]",
                  )}
                >
                  {state === "done" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-bg" />
                  )}
                  {state === "late" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
                <div className="mt-2 w-full px-1">
                  <div className="text-[11px] text-fg/80 line-clamp-2">{m.title}</div>
                  <div className="mt-0.5 caps font-mono">
                    {new Date(m.due).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </article>
  );
}

function Ring({ progress }: { progress: number }) {
  const size = 64;
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - c * Math.max(0, Math.min(1, progress));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--hair-strong)"
        strokeWidth={2}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--ink)"
        strokeWidth={2}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="54%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-fg"
        style={{ fontFamily: "var(--font-serif), Georgia, serif", fontWeight: 300 }}
        fontSize="18"
      >
        {Math.round(progress * 100)}
      </text>
    </svg>
  );
}
