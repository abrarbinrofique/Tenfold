"use client";

import { cn } from "@/lib/cn";
import { SectionTimer } from "./SectionTimer";

const SECTIONS = [
  { id: "scorecard", label: "Scorecard" },
  { id: "ids", label: "IDS" },
  { id: "conclude", label: "Conclude" },
] as const;

export function MeetingHeader({
  section,
  sectionStartedAt,
}: {
  section: string;
  sectionStartedAt: string;
}) {
  const idx = Math.max(0, SECTIONS.findIndex((s) => s.id === section));

  return (
    <header className="relative border-b border-[var(--hair)] bg-surface/40">
      {/* Top-edge section arc: 1px hairline + 3 dots */}
      <div className="absolute inset-x-0 top-0 flex items-center">
        <div className="relative flex-1 h-[1px]">
          <div className="absolute inset-0 bg-[var(--hair-strong)]" />
          <div
            className="absolute left-0 top-0 h-[1px] bg-signal transition-[width] duration-[240ms]"
            style={{ width: `${((idx + 0.5) / SECTIONS.length) * 100}%` }}
          />
          {SECTIONS.map((s, i) => {
            const pct = ((i + 0.5) / SECTIONS.length) * 100;
            const state = i < idx ? "done" : i === idx ? "active" : "future";
            return (
              <span
                key={s.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${pct}%`, top: 0 }}
              >
                <span
                  className={cn(
                    "h-[9px] w-[9px] rounded-full border bg-bg",
                    state === "future" && "border-[var(--hair-strong)]",
                    state === "active" && "border-signal bg-signal",
                    state === "done" && "border-ink bg-ink",
                  )}
                />
                <span
                  className={cn(
                    "mt-2 caps-sm whitespace-nowrap",
                    state === "active" && "text-signal",
                    state === "done" && "text-fg",
                  )}
                >
                  § {String(i + 1).padStart(2, "0")} · {s.label}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="px-8 pt-16 pb-8 flex items-end justify-between gap-8">
        <SectionTimer section={section} sectionStartedAt={sectionStartedAt} />

        {/* Ideal-tempo bell curve */}
        <div className="hidden md:block relative flex-1 max-w-[520px] h-[88px]">
          <svg
            viewBox="0 0 520 88"
            preserveAspectRatio="none"
            className="w-full h-full"
            aria-hidden
          >
            <path
              d="M 0 70 C 60 68, 110 55, 173 30 C 230 8, 290 4, 346 28 C 400 50, 450 72, 520 80"
              stroke="var(--ink)"
              strokeOpacity="0.2"
              strokeWidth="1"
              fill="none"
            />
            {/* marker on curve */}
            {(() => {
              const positions = [
                { x: 86, y: 62 },   // scorecard
                { x: 260, y: 10 },  // ids peak
                { x: 440, y: 70 },  // conclude
              ];
              const p = positions[idx] ?? positions[0];
              return (
                <>
                  <circle cx={p.x} cy={p.y} r="8" fill="var(--signal)" opacity="0.15" />
                  <circle cx={p.x} cy={p.y} r="3" fill="var(--signal)" />
                </>
              );
            })()}
          </svg>
          <div className="absolute -bottom-1 left-0 caps-sm">IDEAL TEMPO</div>
          <div className="absolute -bottom-1 right-0 caps-sm">90 MIN ARC</div>
        </div>
      </div>
    </header>
  );
}
