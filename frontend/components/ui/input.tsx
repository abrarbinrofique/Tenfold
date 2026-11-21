"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "underline" | "boxed";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = "boxed", ...props }, ref) => {
    if (variant === "underline") {
      return (
        <input
          ref={ref}
          className={cn(
            "w-full bg-transparent border-0 border-b border-[var(--hair)] px-0 py-2 text-base",
            "placeholder:text-muted outline-none focus:border-ink transition-colors",
            className,
          )}
          {...props}
        />
      );
    }
    return (
      <input
        ref={ref}
        className={cn(
          "h-8 w-full rounded-md border border-[var(--hair)] bg-transparent px-2.5 text-[13px]",
          "placeholder:text-muted outline-none focus:border-ink/60 focus:ring-0",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
