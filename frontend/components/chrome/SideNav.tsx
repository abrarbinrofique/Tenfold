"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { CheckSquare, CircleDot, Gauge, Target } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function SideNav({ teamId }: { teamId: string }) {
  const search = useSearchParams();
  const currentTab = search.get("tab") ?? "scorecard";
  const items = [
    { href: `/team/${teamId}?tab=scorecard`, label: "Scorecard", icon: Gauge, match: "scorecard", num: "01" },
    { href: `/team/${teamId}?tab=rocks`, label: "Rocks", icon: Target, match: "rocks", num: "02" },
    { href: `/team/${teamId}?tab=issues`, label: "Issues", icon: CircleDot, match: "issues", num: "03" },
    { href: `/team/${teamId}?tab=todos`, label: "To-Dos", icon: CheckSquare, match: "todos", num: "04" },
  ];

  return (
    <nav className="w-[72px] shrink-0 border-r border-[var(--hair)] bg-surface/40 py-5 flex flex-col items-center">
      <div className="caps-sm mb-5 writing-mode-vertical rotate-180" style={{ writingMode: "vertical-rl" }}>
        TEAM · 01
      </div>
      <TooltipProvider delayDuration={100}>
        <ul className="flex flex-col items-center gap-1 flex-1">
          {items.map((it) => {
            const active = currentTab === it.match;
            const Icon = it.icon;
            return (
              <li key={it.label} className="w-full flex justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={it.href}
                      className={cn(
                        "group relative flex flex-col items-center justify-center w-10 h-10 rounded-md text-fg/60 hover:text-fg transition-colors",
                        active && "text-fg",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute left-0 top-2 bottom-2 w-[2px]",
                          active ? "bg-ink" : "bg-transparent",
                        )}
                        style={{ left: "-20px" }}
                      />
                      <Icon className="h-[16px] w-[16px]" />
                      <span className="mt-1 font-mono text-[8px] tracking-[0.1em] text-muted leading-none">
                        {it.num}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{it.label}</TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </TooltipProvider>
    </nav>
  );
}
