"use client";

import { cn } from "@/lib/cn";

export function Monogram({
  name,
  size = 28,
  present,
  className,
}: {
  name: string;
  size?: number;
  present?: boolean;
  className?: string;
}) {
  const letter = (name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <span
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 rounded-full border border-[var(--hair-strong)]"
        aria-hidden
      />
      <span
        className="font-serif font-light leading-none"
        style={{ fontSize: Math.round(size * 0.46) }}
      >
        {letter}
      </span>
      {present !== undefined && (
        <span
          aria-hidden
          className={cn(
            "absolute h-[5px] w-[5px] rounded-full",
            present ? "bg-status-on signal-pulse" : "bg-fg/30",
          )}
          style={{
            // 4 o'clock position, outside circle
            right: -1,
            bottom: Math.round(size * 0.18),
          }}
        />
      )}
    </span>
  );
}
