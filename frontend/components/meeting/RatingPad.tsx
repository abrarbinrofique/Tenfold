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
              className={cn(
                "aspect-square rounded-md border font-serif text-lg flex items-center justify-center transition-colors",
                disabled
                  ? "border-[var(--hair)] text-muted/40 bg-muted/5 cursor-not-allowed"
                  : selected
                    ? "bg-ink text-bg border-ink"
                    : active
                      ? "bg-ink/70 text-bg border-ink"
                      : "text-fg/70 border-[var(--hair)] hover:border-ink/50",
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
