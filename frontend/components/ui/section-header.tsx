"use client";

import { cn } from "@/lib/cn";

export function SectionHeader({
  eyebrow,
  title,
  right,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-6 pb-4 border-b border-[var(--hair)]", className)}>
      <div>
        {eyebrow && <div className="caps mb-2">{eyebrow}</div>}
        <h2 className="font-serif font-light text-[26px] leading-[1.05] tracking-display">
          {title}
        </h2>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
