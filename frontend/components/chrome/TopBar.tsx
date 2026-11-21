"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Command, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useMe } from "@/lib/queries";

export function TopBar({
  teamName: teamNameProp,
  teams: teamsProp,
  userName: userNameProp,
  userId: userIdProp,
  onStartMeeting,
  onCommandK,
}: {
  teamName?: string;
  teams?: { id: string; name: string }[];
  userName?: string;
  userId?: string;
  onStartMeeting?: () => void;
  onCommandK?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const inMeeting = pathname?.startsWith("/meeting/");
  const { data: me } = useMe();
  const teams = teamsProp ?? me?.teams ?? [];
  const teamName = teamNameProp ?? teams[0]?.name ?? "Team";
  const userName = userNameProp ?? me?.name ?? "—";
  const userEmail = me?.email ?? "";
  const userId = userIdProp ?? me?.id ?? "u0";
  const live = /live/i.test(teamName);

  async function signOut() {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
    try {
      await fetch(`${base}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {}
    try {
      localStorage.removeItem("tenfold_token");
      document.cookie = "tenfold_token=; Path=/; Max-Age=0; SameSite=Lax";
    } catch {}
    router.push("/login");
  }
  return (
    <header className="sticky top-0 z-30 h-14 bg-surface/95 backdrop-blur-[3px] shadow-binding">
      <div className="flex h-full items-center px-5 gap-4">
        <Link href={teams[0]?.id ? `/team/${teams[0].id}` : "/"} className="flex items-baseline gap-2 shrink-0 group">
          <span className="font-serif text-[20px] font-light tracking-display leading-none">
            Tenfold
          </span>
          <span
            aria-hidden
            className="inline-block h-[4px] w-[4px] rounded-full bg-ink translate-y-[-3px]"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted leading-none translate-y-[-2px]">
            ·01
          </span>
        </Link>

        <span className="h-5 w-px bg-[var(--hair)]" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-1">
              {live && (
                <span className="inline-flex items-center gap-1.5 mr-1">
                  <span className="h-[6px] w-[6px] rounded-full bg-signal signal-pulse" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal">Rec</span>
                </span>
              )}
              <span className="text-fg text-[13px]">{teamName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Teams</DropdownMenuLabel>
            {teams.map((t) => (
              <DropdownMenuItem key={t.id} asChild>
                <Link href={`/team/${t.id}`}>{t.name}</Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem>New team…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted"
            onClick={onCommandK}
          >
            <Command className="h-3.5 w-3.5" />
            <span className="text-[12px]">Jump to…</span>
            <Kbd>⌘K</Kbd>
          </Button>

          {me?.role !== "observer" && !inMeeting && (
            <Button
              variant="primary"
              size="sm"
              className="gap-2 btn-reveal"
              onClick={onStartMeeting}
            >
              <Play className="h-3.5 w-3.5" />
              <span className="btn-label">Start Meeting</span>
              <Kbd className="border-bg/30 text-bg/80">⌘M</Kbd>
            </Button>
          )}

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-fg/[0.04]">
                <Avatar userId={userId} name={userName} size={22} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px]">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-fg leading-tight">{userName}</span>
                  {userEmail && (
                    <span className="font-mono text-[10px] text-muted leading-tight">{userEmail}</span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={signOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
