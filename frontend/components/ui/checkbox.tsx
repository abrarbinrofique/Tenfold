"use client";

import * as React from "react";
import * as Cb from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof Cb.Root>,
  React.ComponentPropsWithoutRef<typeof Cb.Root>
>(({ className, ...props }, ref) => (
  <Cb.Root
    ref={ref}
    className={cn(
      "peer h-[14px] w-[14px] shrink-0 rounded-[3px] border border-[var(--hair)] bg-transparent",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink",
      "data-[state=checked]:bg-ink data-[state=checked]:border-ink",
      "transition-colors",
      className,
    )}
    {...props}
  >
    <Cb.Indicator className="flex items-center justify-center text-bg">
      <Check className="h-3 w-3" strokeWidth={3} />
    </Cb.Indicator>
  </Cb.Root>
));
Checkbox.displayName = "Checkbox";
