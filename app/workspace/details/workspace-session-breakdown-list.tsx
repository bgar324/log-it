"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/app/components/workspace-ui/button";
import { WorkspaceLinkPending } from "@/app/workspace/views/workspace-link-pending";
import {
  isPlainRowActivation,
  useWorkspaceDetailSheet,
} from "./workspace-detail-sheet.context";

const PAGE_SIZE = 5;

export type WorkspaceSessionBreakdownRow = {
  workoutId: string;
  performedAtLabel: string;
  workoutLabel: string;
  topSetLabel: string;
  volumeLabel: string;
};

export type WorkspaceSessionBreakdownListProps = {
  sessions: WorkspaceSessionBreakdownRow[];
};

/**
 * An exercise's history, one row per session: when it happened and which
 * workout it belonged to on the left, the top set and what it added up to on
 * the right. The pager states the range, so the two chevrons are never the only
 * feedback about where you are.
 */
export function WorkspaceSessionBreakdownList({
  sessions,
}: WorkspaceSessionBreakdownListProps) {
  const [page, setPage] = useState(0);
  const detailSheet = useWorkspaceDetailSheet();
  const pageCount = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const rangeStart = currentPage * PAGE_SIZE;
  const rangeEnd = Math.min(rangeStart + PAGE_SIZE, sessions.length);
  const visibleSessions = sessions.slice(rangeStart, rangeEnd);

  return (
    <>
      <div className="divide-y divide-foreground/10 border-t border-foreground/10">
        {visibleSessions.map((session) => (
          <Link
            key={session.workoutId}
            href={`/workouts/${session.workoutId}`}
            className="relative flex min-h-[3.25rem] items-center gap-3 px-3 py-2.5 outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
            onClick={(event) => {
              if (!detailSheet || !isPlainRowActivation(event)) {
                return;
              }

              // Inside the detail sheet this swaps the panel to that workout
              // instead of leaving the exercise you were reading; on the
              // standalone page there is no sheet and the link navigates.
              event.preventDefault();
              detailSheet.openDetail({
                kind: "workout",
                id: session.workoutId,
                label: session.workoutLabel,
              }, event.currentTarget);
            }}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {session.performedAtLabel}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {session.workoutLabel}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm text-foreground tabular-nums">
                {session.topSetLabel}
              </span>
              <span className="mt-0.5 block text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                {session.volumeLabel}
              </span>
            </span>
            <WorkspaceLinkPending />
          </Link>
        ))}
      </div>

      {sessions.length > PAGE_SIZE ? (
        <div
          className="flex items-center justify-between gap-3 px-3 pt-3"
          data-pager="sessions"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Previous page of sessions"
            onClick={() => setPage(Math.max(currentPage - 1, 0))}
            disabled={currentPage === 0}
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {`${rangeStart + 1}-${rangeEnd} of ${sessions.length}`}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Next page of sessions"
            onClick={() => setPage(Math.min(currentPage + 1, pageCount - 1))}
            disabled={currentPage >= pageCount - 1}
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </>
  );
}
