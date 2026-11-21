"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdvanceButton({
  isFacilitator,
  facilitatorName,
  nextLabel,
  onAdvance,
}: {
  isFacilitator: boolean;
  facilitatorName: string;
  nextLabel: string;
  onAdvance?: () => void;
}) {
  if (!isFacilitator) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--hair-strong)] px-3 h-7 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        <span className="h-[5px] w-[5px] rounded-full bg-status-on" />
        FACILITATOR · {facilitatorName}
      </span>
    );
  }
  return (
    <Button variant="primary" size="md" className="gap-2 btn-reveal group relative" onClick={onAdvance}>
      <span className="btn-label">{nextLabel}</span>
      <ArrowRight className="h-4 w-4 btn-arrow" />
      <span className="absolute left-3 right-3 bottom-[5px] h-[1px] origin-left scale-x-0 bg-signal transition-transform duration-[180ms] group-hover:scale-x-100" />
    </Button>
  );
}
