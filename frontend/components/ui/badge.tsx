import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "on" | "off" | "pending" | "neutral";

const dotColor: Record<Variant, string> = {
  on: "bg-status-on",
  off: "bg-status-off",
  pending: "bg-status-pending",
  neutral: "bg-fg/40",
};

const tint: Record<Variant, string> = {
  on: "border-[color:color-mix(in_srgb,var(--rail-on)_40%,transparent)] bg-[color:color-mix(in_srgb,var(--rail-on)_8%,transparent)] text-[color:var(--rail-on)]",
  off: "border-[color:color-mix(in_srgb,var(--rail-off)_40%,transparent)] bg-[color:color-mix(in_srgb,var(--rail-off)_8%,transparent)] text-[color:var(--rail-off)]",
  pending:
    "border-[color:color-mix(in_srgb,var(--rail-pending)_40%,transparent)] bg-[color:color-mix(in_srgb,var(--rail-pending)_8%,transparent)] text-[color:var(--rail-pending)]",
  neutral: "border-[var(--hair-strong)] text-fg/80",
};

export function Badge({
  variant = "neutral",
  children,
  className,
  dot = true,
}: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 h-5 font-mono text-[10px] uppercase tracking-[0.1em] tnum",
        tint[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn("h-[5px] w-[5px] rounded-full", dotColor[variant])}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
