"use client";

import * as React from "react";
import * as TP from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";

export const TooltipProvider = TP.Provider;
export const Tooltip = TP.Root;
export const TooltipTrigger = TP.Trigger;

export function TooltipContent({
  className,
  children,
  side = "top",
  sideOffset = 6,
  ...props
}: React.ComponentPropsWithoutRef<typeof TP.Content>) {
  return (
    <TP.Portal>
      <TP.Content
        side={side}
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-md border border-[var(--hair)] bg-bg px-2 py-1 text-[11px] text-fg shadow-md",
          className,
        )}
        {...props}
      >
        {children}
      </TP.Content>
    </TP.Portal>
  );
}
