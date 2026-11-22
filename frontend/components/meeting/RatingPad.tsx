"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function RatingPad({
  value,
  onChange,
  disabled,
  disabledReason,
}: {
  value?: number;
  onChange?: (v: number) => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div>
      <div className="caps mb-2">Rate this meeting</div>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const selected = value === n;
          const active = selected || (!disabled && (hover ?? 0) >= n && value == null);
          return (
            <button
              key={n}
              title={disabled ? disabledReason : undefined}
              disabled={disabled}
              onMouseEnter={() => !disabled && setHover(n)}
              onMouseLeave={() => setHover(null)}
              onClick={() => !disabled && onChange?.(n)}
              style={
                disabled
                  ? { background: "transparent", color: "var(--muted)", opacity: 0.4 }
                  : selected
                    ? { background: "var(--ink)", color: "var(--bg)", borderColor: "var(--ink)" }
                    : active
                      ? { background: "var(--ink)", color: "var(--bg)", borderColor: "var(--ink)", opacity: 0.85 }
                      : { background: "transparent", color: "var(--fg)", borderColor: "var(--hair-strong)" }
              }
              className={cn(
                "aspect-square min-h-[52px] min-w-[36px] rounded-md border-2 font-serif text-[24px] font-normal tabular-nums flex items-center justify-center transition-all leading-none select-none",
                disabled && "cursor-not-allowed",
                !disabled && "hover:opacity-100 cursor-pointer",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
