"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/chrome/TopBar";
import { MeetingHeader } from "@/components/meeting/MeetingHeader";
import { AttendeeRail } from "@/components/meeting/AttendeeRail";
import { AdvanceButton } from "@/components/meeting/AdvanceButton";
import { RatingPad } from "@/components/meeting/RatingPad";
import { MeetingSummary } from "@/components/meeting/MeetingSummary";
import { ScorecardReadOnly } from "@/components/scorecard/Scorecard";
import { IssueList } from "@/components/issues/IssueList";
import {
  useMeeting,
  useAdvance,
  useEnd,
  useRate,
  useJoinMeeting,
  useMe,
  useTeam,
  useScorecard,
  useIssues,
  qk,
  transformScorecard,
  transformIssues,
} from "@/lib/queries";
import type { User } from "@/lib/types";
import { useMeetingSocket } from "@/lib/ws";

export default function MeetingPage() {
  const params = useParams<{ meetingId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const meetingId = params.meetingId;

  const { data: me } = useMe();
  const { data: meeting } = useMeeting(meetingId);
  const teamId = meeting?.team_id;
  const { data: teamDto } = useTeam(teamId ?? "");
  const { data: scDto } = useScorecard(teamId ?? "");
  const { data: issuesDto } = useIssues(teamId ?? "", { solved: false });

  const sc = useMemo(() => transformScorecard(scDto), [scDto]);
  const issues = useMemo(() => transformIssues(issuesDto), [issuesDto]);
  const users: User[] = useMemo(() => {
    const members = teamDto?.members ?? [];
    return members.map((u: any) => ({ id: u.id, name: u.name, email: u.email ?? "" }));
  }, [teamDto]);

  const { connected, lastEvent } = useMeetingSocket(meetingId);
  const join = useJoinMeeting(meetingId);
  const advance = useAdvance(meetingId);
  const end = useEnd(meetingId);
  const rate = useRate(meetingId);

  const joined = useRef(false);
  useEffect(() => {
    if (!joined.current && meetingId && me?.id) {
      joined.current = true;
      join.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, me?.id]);

  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type === "section_changed" ||
      lastEvent.type === "attendee_joined" ||
      lastEvent.type === "rating_set" ||
      lastEvent.type === "meeting_ended"
    ) {
      qc.invalidateQueries({ queryKey: qk.meeting(meetingId) });
    }
  }, [lastEvent, meetingId, qc]);

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-serif italic font-light text-muted">Loading meeting…</div>
      </div>
    );
  }

  const isFacilitator =
    meeting.facilitator_id === me?.id || me?.role === "admin";
  const isObserver = me?.role === "observer";
  const facilitatorUser = users.find((u) => u.id === meeting.facilitator_id);

  const section = meeting.section as string;
  const sectionStartedAt = meeting.section_started_at ?? new Date().toISOString();

  // If ended, show summary
  if (meeting.ended_at) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <MeetingSummary meeting={meeting} />
      </div>
    );
  }

  const nextLabel =
    section === "scorecard"
      ? "Advance to IDS"
      : section === "ids"
        ? "Advance to Conclude"
        : "End meeting";

  function onAdvance() {
    if (section === "conclude") {
      end.mutate(undefined, {
        onSuccess: () => toast.success("Meeting concluded"),
        onError: (e: any) => toast.error(e?.message ?? "Could not end"),
      });
    } else {
      advance.mutate(undefined, {
        onError: (e: any) => toast.error(e?.message ?? "Could not advance"),
      });
    }
  }

  // Attendee rail expects camelCase; adapt
  const meetingForRail: any = {
    id: meeting.id,
    teamId: meeting.team_id,
    section,
    sectionStartedAt,
    facilitatorId: meeting.facilitator_id,
    attendees: (meeting.attendees ?? []).map((a: any) => ({
      userId: a.user_id,
      present: true,
      rating: a.rating ?? undefined,
    })),
    startedAt: meeting.started_at,
  };

  const myAtt = (meeting.attendees ?? []).find((a: any) => a.user_id === me?.id);
  const myRating = myAtt?.rating ?? undefined;

  const liveAvg = (() => {
    const rated = (meeting.attendees ?? []).filter((a: any) => typeof a.rating === "number");
    if (!rated.length) return "—";
    return (
      rated.reduce((s: number, a: any) => s + (a.rating ?? 0), 0) / rated.length
    ).toFixed(1);
  })();

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar teamName={`${teamDto?.name ?? "Team"} · Live`} />
      <MeetingHeader section={section} sectionStartedAt={sectionStartedAt} />

      <div className="flex flex-1 min-h-0">
        <main className="flex-1 min-w-0 p-10 overflow-y-auto">
          <div className="flex items-end justify-between mb-8 pb-5 border-b border-[var(--hair)]">
            <div>
              <div className="caps mb-2">§ NOW</div>
              <h2 className="font-serif text-[34px] font-light leading-[1.05] tracking-display">
                {sectionTitle(section)}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`inline-block h-[6px] w-[6px] rounded-full align-middle ${connected ? "bg-signal signal-pulse" : "bg-status-pending"}`}
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg">
                  {connected ? "RECORDING · LIVE" : "RECONNECTING"}
                </span>
              </span>
              <AdvanceButton
                isFacilitator={isFacilitator}
                facilitatorName={facilitatorUser?.name ?? "—"}
                nextLabel={nextLabel}
                onAdvance={onAdvance}
              />
            </div>
          </div>

          {section === "scorecard" && <ScorecardReadOnly data={sc} />}
          {section === "ids" && (
            <IssueList issues={issues} users={users} />
          )}
          {section === "conclude" && (
            <div className="max-w-xl">
              <p className="font-serif italic font-light text-[18px] text-fg/80 mb-5">
                Rate this meeting. 1 is painful, 10 is excellent.
              </p>
              <RatingPad
                value={myRating}
                disabled={isObserver}
                disabledReason="Observers cannot rate"
                onChange={(n) => {
                  rate.mutate(n, {
                    onError: (e: any) => toast.error(e?.message ?? "Could not save rating"),
                  });
                }}
              />
              <div className="mt-6 pt-5 border-t border-[var(--hair)] flex items-baseline gap-3">
                <div className="caps">Live average</div>
                <div className="font-serif font-extralight tnum tracking-display leading-none" style={{ fontSize: 40 }}>
                  {liveAvg}
                </div>
                <div className="font-mono text-[11px] text-muted">/ 10</div>
              </div>
            </div>
          )}
        </main>

        <AttendeeRail meeting={meetingForRail} users={users} />
      </div>
    </div>
  );
}

function sectionTitle(s: string) {
  if (s === "scorecard") return "Scorecard review";
  if (s === "ids") return "Identify · Discuss · Solve";
  return "Conclude · rate the hour";
}
