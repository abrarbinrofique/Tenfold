"use client";

import * as React from "react";
import * as TabsPrim from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrim.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrim.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrim.List>
>(({ className, ...props }, ref) => (
  <TabsPrim.List
    ref={ref}
    className={cn(
      "inline-flex items-center gap-6 border-b border-[var(--hair)]",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrim.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrim.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrim.Trigger
    ref={ref}
    className={cn(
      "relative -mb-px py-2.5 text-[13px] text-muted transition-colors",
      "data-[state=active]:text-fg",
      "after:absolute after:left-0 after:right-0 after:-bottom-px after:h-px after:bg-transparent",
      "data-[state=active]:after:bg-ink",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = TabsPrim.Content;
