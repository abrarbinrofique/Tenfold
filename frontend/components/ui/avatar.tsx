"use client";

import * as React from "react";
import * as Av from "@radix-ui/react-avatar";
import { cn } from "@/lib/cn";

function hashColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const palette = [
    "#2a2a2d", "#3b3a36", "#2c3338", "#2d2a35", "#352a2d", "#2a352f", "#30322b", "#2b2e35",
  ];
  const palLight = [
    "#e4e3df", "#e5e1dd", "#dde3e4", "#e1dfe6", "#e6dfe1", "#dde6e1", "#e2e4dd", "#dcdee6",
  ];
  const idx = Math.abs(h) % palette.length;
  return `var(--avatar-${idx})`;
}

export function Avatar({
  userId,
  name,
  size = 20,
  className,
}: {
  userId: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const letters = name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // deterministic hue
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;

  return (
    <Av.Root
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-[var(--hair)] font-mono text-[10px] tracking-caps",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 10% 20% / 0.35)`,
        color: "var(--fg)",
      }}
      aria-label={name}
    >
      <Av.Fallback>{letters}</Av.Fallback>
    </Av.Root>
  );
}
