"use client";

import * as React from "react";
import * as Dd from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const DropdownMenu = Dd.Root;
export const DropdownMenuTrigger = Dd.Trigger;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof Dd.Content>,
  React.ComponentPropsWithoutRef<typeof Dd.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <Dd.Portal>
    <Dd.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[200px] overflow-hidden rounded-md border border-[var(--hair)] bg-bg p-1 text-fg shadow-xl",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  </Dd.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Dd.Item>,
  React.ComponentPropsWithoutRef<typeof Dd.Item> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <Dd.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] outline-none",
      "focus:bg-fg/[0.05] data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      inset && "pl-7",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-2 py-1.5 text-[10px] uppercase tracking-caps text-muted", className)}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <Dd.Separator className="my-1 h-px bg-[var(--hair)]" />;
}

export function DropdownMenuCheck({ checked }: { checked?: boolean }) {
  return (
    <span className="ml-auto inline-flex h-3.5 w-3.5 items-center justify-center">
      {checked && <Check className="h-3.5 w-3.5" />}
    </span>
  );
}
