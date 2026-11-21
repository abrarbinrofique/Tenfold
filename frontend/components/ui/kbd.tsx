import * as React from "react";
import { cn } from "@/lib/cn";

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[2px] border border-[var(--hair-strong)] bg-transparent px-1 font-mono text-[10px] leading-none uppercase tracking-[0.04em] text-muted align-middle",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
