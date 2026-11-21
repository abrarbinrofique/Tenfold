"use client";

import { Monogram } from "@/components/ui/monogram";
import type { Meeting, User } from "@/lib/types";

export function AttendeeRail({
  meeting,
  users,
}: {
  meeting: Meeting;
  users: User[];
}) {
  const facilitator = users.find((u) => u.id === meeting.facilitatorId);
  return (
    <aside className="w-[320px] shrink-0 border-l border-[var(--hair)] bg-surface/30 p-6 space-y-6">
      {facilitator && (
        <div>
          <div className="flex items-baseline gap-2 border-b border-[var(--hair-strong)] pb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">FACILITATOR</span>
            <span className="text-muted">·</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg">
              {facilitator.name}
            </span>
          </div>
        </div>
      )}

      <div>
        <div className="caps mb-4">Attendees · {meeting.attendees.length}</div>
        <ul className="space-y-3">
          {meeting.attendees.map((a) => {
            const u = users.find((x) => x.id === a.userId);
            if (!u) return null;
            return (
              <li key={a.userId} className="flex items-center gap-3 py-1">
                <Monogram name={u.name} size={30} present={a.present} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-fg truncate leading-tight">{u.name}</div>
                  <div className="caps-sm mt-0.5">
                    {a.present ? "PRESENT" : "AWAY"}
                  </div>
                </div>
                {typeof a.rating === "number" ? (
                  <span className="font-serif text-[20px] font-light tnum text-fg leading-none">
                    {a.rating}
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-muted">—</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="pt-5 border-t border-[var(--hair)]">
        <div className="caps mb-2">Average rating</div>
        <div className="flex items-baseline gap-2">
          <div className="font-serif text-[48px] font-extralight leading-none tnum tracking-display">
            {avgRating(meeting.attendees)}
          </div>
          <div className="font-mono text-[11px] text-muted">/ 10</div>
        </div>
      </div>
    </aside>
  );
}

function avgRating(att: Meeting["attendees"]) {
  const rated = att.filter((a) => typeof a.rating === "number");
  if (!rated.length) return "—";
  const sum = rated.reduce((s, a) => s + (a.rating ?? 0), 0);
  return (sum / rated.length).toFixed(1);
}
