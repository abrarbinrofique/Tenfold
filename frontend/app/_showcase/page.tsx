"use client";

import { useState } from "react";
import { TopBar } from "@/components/chrome/TopBar";
import { Scorecard } from "@/components/scorecard/Scorecard";
import { IssueList } from "@/components/issues/IssueList";
import { TodoList } from "@/components/todos/TodoList";
import { RockCard } from "@/components/rocks/RockCard";
import { MeetingHeader } from "@/components/meeting/MeetingHeader";
import { AttendeeRail } from "@/components/meeting/AttendeeRail";
import { RatingPad } from "@/components/meeting/RatingPad";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { Monogram } from "@/components/ui/monogram";
import {
  demoIssues,
  demoMeeting,
  demoRocks,
  demoScorecard,
  demoTodos,
  demoUsers,
} from "@/lib/showcase-data";
import { ArrowRight } from "lucide-react";

export default function ShowcasePage() {
  const [rating, setRating] = useState<number | undefined>(8);

  return (
    <div className="min-h-screen">
      <TopBar teamName="Leadership" teams={[{ id: "t1", name: "Leadership" }]} />

      <main className="mx-auto max-w-[1200px] px-10 py-16">
        {/* Masthead */}
        <header className="pb-10 border-b border-[var(--hair-strong)]">
          <div className="flex items-baseline justify-between">
            <div className="caps">TENFOLD · DESIGN SYSTEM</div>
            <div className="caps">VOL. 01 · {new Date().getFullYear()}</div>
          </div>
          <h1
            className="mt-10 font-serif font-light leading-[0.9] tracking-display"
            style={{ fontSize: "clamp(72px, 12vw, 160px)" }}
          >
            Tenfold / <span className="text-muted">01</span>
            <br />
            The weekly ten.
          </h1>
          <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            AN EOS LEVEL-10 WORKSPACE · DENSE WHERE IT NEEDS TO BE · QUIET EVERYWHERE ELSE
          </div>
        </header>

        {/* § 01 TYPOGRAPHY */}
        <Spread n="01" title="Typography">
          <div className="grid md:grid-cols-[1fr_1fr] gap-10">
            <div>
              <div className="caps mb-4">FRAUNCES · SERIF DISPLAY</div>
              <div className="space-y-4">
                <div className="font-serif font-light text-[96px] leading-none tracking-display">Aa</div>
                <div className="font-serif font-light text-[48px] leading-none tracking-display">The weekly ten.</div>
                <div className="font-serif font-light text-[32px] leading-none tracking-tightish">Scorecard review</div>
                <div className="font-serif text-[22px] leading-none">Prioritize, discuss, solve.</div>
                <div className="font-serif italic text-[18px]">"What gets measured, gets managed."</div>
                <div className="font-serif text-[14px]">Running paragraph for body copy.</div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8">
              <div>
                <div className="caps mb-4">INTER · UI SANS</div>
                <div className="space-y-2">
                  <div className="text-[22px]">Continue to your team</div>
                  <div className="text-[15px]">Dense where it needs to be.</div>
                  <div className="text-[13px] text-muted">Secondary / meta copy.</div>
                  <div className="text-[11px] text-muted">Caption · 11px</div>
                </div>
              </div>
              <div>
                <div className="caps mb-4">JETBRAINS MONO · NUMERICS</div>
                <div className="space-y-2 tnum">
                  <div className="font-mono text-[32px]">12 · 2.4% · 03:41</div>
                  <div className="font-mono text-[18px]">1,284.50 · 92%</div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em]">WK · NOV 2</div>
                </div>
              </div>
            </div>
          </div>
        </Spread>

        {/* § 02 COLOR */}
        <Spread n="02" title="Palette & rails">
          <div className="grid grid-cols-6 gap-3">
            {[
              ["Bg", "--bg"],
              ["Surface", "--surface"],
              ["Surface-2", "--surface-2"],
              ["Ink", "--ink"],
              ["Muted", "--muted"],
              ["Signal", "--signal"],
            ].map(([label, v]) => (
              <TallSwatch key={v} label={label} varName={v} />
            ))}
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              ["Rail · On", "--rail-on"],
              ["Rail · Off", "--rail-off"],
              ["Rail · Pending", "--rail-pending"],
            ].map(([label, v]) => (
              <TallSwatch key={v} label={label} varName={v} />
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Badge variant="on">On track</Badge>
            <Badge variant="off">Off track</Badge>
            <Badge variant="pending">Pending</Badge>
            <Badge variant="neutral">Neutral</Badge>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-signal">
              <span className="h-[6px] w-[6px] rounded-full bg-signal signal-pulse" /> SIGNAL · LIVE
            </span>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button variant="primary" className="btn-reveal">
              <span className="btn-label">Primary</span>
              <ArrowRight className="h-3.5 w-3.5 btn-arrow" />
            </Button>
            <Button variant="outline">Outline</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Kbd>⌘</Kbd>
            <Kbd>M</Kbd>
            <Kbd>K</Kbd>
          </div>
        </Spread>

        {/* § 03 SCORECARD */}
        <Spread n="03" title="Scorecard — the weekly ten numbers">
          <div className="relative">
            <Scorecard data={demoScorecard} />
            <div className="mt-3 grid grid-cols-3 gap-6 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              <div>↑ ROW · 44PX · 1PX HAIRLINE</div>
              <div>↕ WEEK COLUMN · 68PX · TNUM</div>
              <div>◆ CURRENT WEEK · INK 4% WASH + 1PX EDGES</div>
            </div>
          </div>
        </Spread>

        {/* § 04 ISSUES */}
        <Spread n="04" title="Issues — prioritize, discuss, solve">
          <IssueList issues={demoIssues} users={demoUsers} />
        </Spread>

        {/* § 05 TO-DOS */}
        <Spread n="05" title="To-Dos — 7-day accountability">
          <TodoList todos={demoTodos} users={demoUsers} />
        </Spread>

        {/* § 06 ROCKS */}
        <Spread n="06" title="Rocks — the 90-day priorities">
          <div className="grid md:grid-cols-1 gap-4">
            {demoRocks.map((r) => (
              <RockCard key={r.id} rock={r} users={demoUsers} />
            ))}
          </div>
        </Spread>

        {/* § 07 MEETING HEADER HERO */}
        <Spread n="07" title="Meeting — the ninety-minute arc">
          <div className="rounded-md border border-[var(--hair)] overflow-hidden bg-bg">
            <MeetingHeader
              section={demoMeeting.section}
              sectionStartedAt={demoMeeting.sectionStartedAt}
            />
            <div className="flex">
              <div className="flex-1 min-w-0 p-8">
                <div className="flex items-end justify-between mb-6 pb-4 border-b border-[var(--hair)]">
                  <div>
                    <div className="caps mb-1">§ NOW</div>
                    <h3 className="font-serif font-light text-[26px] tracking-display">
                      Scorecard review
                    </h3>
                  </div>
                  <Button variant="primary" size="sm" className="gap-1.5 btn-reveal">
                    <span className="btn-label">Advance</span>
                    <ArrowRight className="h-3.5 w-3.5 btn-arrow" />
                  </Button>
                </div>
                <Scorecard data={demoScorecard} readOnly />
              </div>
              <AttendeeRail meeting={demoMeeting} users={demoUsers} />
            </div>
          </div>
        </Spread>

        {/* § 08 ATTENDEE RAIL */}
        <Spread n="08" title="Attendee rail — monograms & ratings">
          <div className="grid md:grid-cols-[320px_1fr] gap-8">
            <div className="border border-[var(--hair)] rounded-md overflow-hidden">
              <AttendeeRail meeting={demoMeeting} users={demoUsers} />
            </div>
            <div className="space-y-3">
              <div className="caps">MONOGRAM SPECIMEN</div>
              <div className="flex items-center gap-4">
                <Monogram name="Avery" size={48} present />
                <Monogram name="Blake" size={48} present />
                <Monogram name="Casey" size={48} present={false} />
                <Monogram name="Drew" size={48} present />
              </div>
              <div className="mt-6">
                <RatingPad value={rating} onChange={setRating} />
              </div>
            </div>
          </div>
        </Spread>

        {/* § 09 LOGIN THUMBNAIL */}
        <Spread n="09" title="Sign-in — editorial entry">
          <div className="rounded-md border border-[var(--hair)] overflow-hidden grid grid-cols-[55%_45%] min-h-[360px]">
            <div className="relative p-8 border-r border-[var(--hair)] overflow-hidden">
              <div className="absolute inset-0 topo opacity-[0.08] pointer-events-none" style={{ transform: "rotate(-4deg) scale(1.3)" }} />
              <div className="relative">
                <div className="flex items-baseline gap-2">
                  <div className="font-serif text-[18px] font-light tracking-display">Tenfold</div>
                  <span className="h-[3px] w-[3px] rounded-full bg-ink translate-y-[-3px]" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">·01</span>
                </div>
                <div className="font-serif font-light text-[96px] leading-none mt-10 tracking-display">
                  Tenfold
                </div>
                <div className="mt-2 h-px bg-ink/80 w-full" />
                <div className="caps mt-3">§ 01 · THE WEEKLY TEN</div>
                <figure className="mt-10 max-w-sm">
                  <div className="h-px bg-[var(--hair-strong)] mb-3" />
                  <blockquote className="font-serif italic font-light text-[15px] text-fg/85">
                    "What gets measured, gets managed."
                  </blockquote>
                  <figcaption className="mt-1 caps">— Peter Drucker</figcaption>
                </figure>
              </div>
            </div>
            <div className="p-8 flex items-center">
              <div className="w-full">
                <div className="caps mb-2">§ SIGN IN</div>
                <div className="font-serif text-[24px] font-light leading-tight tracking-display mb-5">
                  Continue to your team.
                </div>
                <div className="border-b border-[var(--hair)] pb-2 text-[13px] text-muted">
                  you@company.com
                </div>
                <Button variant="ghost" size="md" className="px-0 mt-5 gap-1.5 btn-reveal">
                  <span className="btn-label">Continue</span>
                  <ArrowRight className="h-3.5 w-3.5 btn-arrow" />
                </Button>
              </div>
            </div>
          </div>
        </Spread>

        {/* § 10 COMPONENT SPEC */}
        <Spread n="10" title="Component index">
          <table className="w-full font-mono text-[11px] uppercase tracking-[0.1em]">
            <thead>
              <tr className="text-muted border-b border-[var(--hair-strong)]">
                <th className="text-left py-2 pr-4">COMPONENT</th>
                <th className="text-left py-2 pr-4">PATH</th>
                <th className="text-right py-2 pr-4">VARIANTS</th>
                <th className="text-right py-2">UPDATED</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["TopBar", "chrome/TopBar", "1", "2026-11-20"],
                ["SideNav", "chrome/SideNav", "1", "2026-11-20"],
                ["Scorecard", "scorecard/Scorecard", "2", "2026-11-20"],
                ["IssueList", "issues/IssueList", "1", "2026-11-20"],
                ["TodoList", "todos/TodoList", "1", "2026-11-20"],
                ["RockCard", "rocks/RockCard", "1", "2026-11-20"],
                ["MeetingHeader", "meeting/MeetingHeader", "1", "2026-11-20"],
                ["SectionTimer", "meeting/SectionTimer", "1", "2026-11-20"],
                ["AttendeeRail", "meeting/AttendeeRail", "1", "2026-11-20"],
                ["Monogram", "ui/monogram", "1", "2026-11-20"],
                ["SignalDot", "ui/signal-dot", "1", "2026-11-20"],
                ["Kbd", "ui/kbd", "1", "2026-11-20"],
                ["Button", "ui/button", "5", "2026-11-20"],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-[var(--hair)]">
                  <td className="py-2 pr-4 text-fg">{row[0]}</td>
                  <td className="py-2 pr-4 text-muted">{row[1]}</td>
                  <td className="py-2 pr-4 text-right text-fg tnum">{row[2]}</td>
                  <td className="py-2 text-right text-muted tnum">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Spread>

        <footer className="py-12 flex items-center justify-between caps border-t border-[var(--hair-strong)]">
          <div>TENFOLD · DESIGN SYSTEM · VOL. 01</div>
          <div className="font-mono">— FIN —</div>
        </footer>
      </main>
    </div>
  );
}

function Spread({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="pt-16 pb-16 border-b border-[var(--hair)]">
      <header className="mb-10 flex items-baseline justify-between gap-6">
        <div>
          <div className="caps mb-3">§ {n} · {title.toUpperCase()}</div>
          <h2 className="font-serif font-light text-[40px] leading-[1.02] tracking-display">
            {title}
          </h2>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          FIG. {n}
        </div>
      </header>
      {children}
    </section>
  );
}

function TallSwatch({ label, varName }: { label: string; varName: string }) {
  return (
    <div className="flex items-stretch gap-3">
      <div
        style={{ background: `var(${varName})` }}
        className="w-6 min-h-[72px] border border-[var(--hair)] rounded-[2px]"
      />
      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div className="text-[12px] text-fg">{label}</div>
        <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
          {varName}
        </div>
      </div>
    </div>
  );
}
