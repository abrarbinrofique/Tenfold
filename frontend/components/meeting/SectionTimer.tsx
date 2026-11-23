"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const BUDGET: Record<string, number> = {
  scorecard: 5 * 60_000,
  ids: 60 * 60_000,
  conclude: 5 * 60_000,
};

const LABEL: Record<string, string> = {
  scorecard: "SCORECARD · 5 MIN",
  ids: "IDS · IDENTIFY · DISCUSS · SOLVE · 60 MIN",
  conclude: "CONCLUDE · 5 MIN",
};

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return { mm, ss };
}

export function SectionTimer({
  section,
  sectionStartedAt,
}: {
  section: string;
  sectionStartedAt: string;
}) {
  // section_started_at is a real UTC timestamp from the server, so every
  // browser computes the same elapsed regardless of when they mounted.
  // Browser-clock drift against real time is bounded (<1 min typically).
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const elapsed = tick - new Date(sectionStartedAt).getTime();
  const budget = BUDGET[section] ?? 10 * 60_000;
  const over = elapsed > budget;
  const { mm, ss } = parts(elapsed);
  const overParts = over ? parts(elapsed - budget) : null;

  return (
    <div className="relative">
      <div
        className={cn(
          "flex items-baseline gap-0 font-serif font-extralight tabular-nums leading-none",
          "text-[88px] tracking-display",
          over ? "text-[color:var(--rail-pending)]/90" : "text-fg",
        )}
        style={{ fontFeatureSettings: '"tnum" 1, "ss02" 1' }}
      >
        <span>{mm}</span>
        <span className="blink-colon px-[0.08em]">:</span>
        <span>{ss}</span>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-6 border-t border-[var(--hair)] pt-1.5">
        <span className="caps">{LABEL[section] ?? section.toUpperCase()}</span>
        {overParts && (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--rail-pending)]">
            +{overParts.mm}:{overParts.ss} OVER
          </span>
        )}
      </div>
    </div>
  );
}
