"use client";

import { cn } from "@/lib/cn";

export function SignalDot({
  live = true,
  className,
  label,
}: {
  live?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        aria-hidden
        className={cn(
          "inline-block h-[6px] w-[6px] rounded-full",
          live ? "bg-signal signal-pulse" : "bg-fg/30",
        )}
      />
      {label && <span className="caps-sm">{label}</span>}
    </span>
  );
}
