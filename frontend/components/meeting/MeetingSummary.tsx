"use client";

import Link from "next/link";
import { Monogram } from "@/components/ui/monogram";
import { Button } from "@/components/ui/button";

function fmtWhen(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${date.toUpperCase()} · ${time}`;
}

export function MeetingSummary({ meeting }: { meeting: any }) {
  const summary = meeting.summary ?? meeting.summary_snapshot ?? {};
  const attendees: Array<{ user_id: string; name?: string; rating?: number | null }> =
    meeting.attendees ?? [];
  const rated = attendees.filter((a) => typeof a.rating === "number");
  const avg = rated.length
    ? (rated.reduce((s, a) => s + (a.rating ?? 0), 0) / rated.length).toFixed(1)
    : "—";

  const issuesSolved: string[] = summary.issues_solved ?? [];
  const todosCreated: string[] = summary.todos_created ?? [];

  return (
    <main className="max-w-[1100px] mx-auto px-8 py-12">
      <div className="caps mb-3">§ Concluded</div>
      <h1 className="font-serif font-light tracking-display leading-[1.02] text-[64px]">
        Meeting concluded
      </h1>
      <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        ENDED · {fmtWhen(meeting.ended_at)}
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="rounded-md border border-[var(--hair)] bg-surface/30 p-5">
          <div className="caps mb-3">Scorecard review</div>
          <div className="font-serif font-light text-[24px] leading-tight">
            Week of {summary.scorecard_week ?? "—"}
          </div>
          <div className="mt-2 font-mono text-[11px] text-muted uppercase tracking-[0.14em]">
            reviewed · immutable
          </div>
        </section>

        <section className="rounded-md border border-[var(--hair)] bg-surface/30 p-5">
          <div className="caps mb-3">Issues solved · {issuesSolved.length}</div>
          {issuesSolved.length === 0 ? (
            <div className="font-serif italic font-light text-[14px] text-muted">None.</div>
          ) : (
            <ul className="space-y-1.5">
              {issuesSolved.map((id) => (
                <li key={id} className="font-mono text-[12px] text-fg tnum">
                  {id}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-[var(--hair)] bg-surface/30 p-5">
          <div className="caps mb-3">To-Dos created · {todosCreated.length}</div>
          {todosCreated.length === 0 ? (
            <div className="font-serif italic font-light text-[14px] text-muted">None.</div>
          ) : (
            <ul className="space-y-1.5">
              {todosCreated.map((id) => (
                <li key={id} className="font-mono text-[12px] text-fg tnum">
                  {id}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-10 rounded-md border border-[var(--hair)] bg-surface/30 p-6">
        <div className="caps mb-5">Attendees · ratings</div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {attendees.map((a) => (
            <div key={a.user_id} className="flex items-center gap-3">
              <Monogram name={a.name ?? a.user_id} size={32} present />
              <div className="min-w-0">
                <div className="text-[13px] truncate">{a.name ?? a.user_id}</div>
                <div className="caps-sm">
                  {typeof a.rating === "number" ? `rated ${a.rating}` : "no rating"}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-5 border-t border-[var(--hair)] flex items-baseline gap-3">
          <div className="caps">Average</div>
          <div className="font-serif font-extralight leading-none tnum tracking-display" style={{ fontSize: 48 }}>
            {avg}
          </div>
          <div className="font-mono text-[11px] text-muted">/ 10</div>
        </div>
      </section>

      <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        This summary is immutable. Source rows may change; this view will not.
      </p>

      <div className="mt-6">
        <Link href={`/team/${meeting.team_id}`}>
          <Button variant="outline" size="md">Back to team</Button>
        </Link>
      </div>
    </main>
  );
}
