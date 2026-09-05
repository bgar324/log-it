"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import { styles } from "./exercise-detail.styles";

const PAGE_SIZE = 5;

type SessionBreakdownRow = {
  workoutId: string;
  performedAtLabel: string;
  workoutLabel: string;
  topSetLabel: string;
  volumeLabel: string;
};

type SessionBreakdownListProps = {
  sessions: SessionBreakdownRow[];
};

/**
 * An exercise's history, one row per session: when it happened and which
 * workout it belonged to on the left, the top set and what it added up to on the
 * right. The pager states the range, so the two chevrons are never the only
 * feedback about where you are.
 */
export function SessionBreakdownList({ sessions }: SessionBreakdownListProps) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const rangeStart = currentPage * PAGE_SIZE;
  const rangeEnd = Math.min(rangeStart + PAGE_SIZE, sessions.length);
  const visibleSessions = sessions.slice(rangeStart, rangeEnd);

  return (
    <>
      <div className={styles.listStack}>
        {visibleSessions.map((session) => (
          <Link
            key={session.workoutId}
            href={`/workouts/${session.workoutId}`}
            className={`${styles.listRow} ${styles.listRowLink}`}
          >
            <div className={styles.listRowMain}>
              <p className={styles.listRowTitle}>{session.performedAtLabel}</p>
              <p className={`${styles.listRowMeta} truncate`}>{session.workoutLabel}</p>
            </div>
            <div className={styles.listRowStats}>
              <p className={styles.listRowValue}>{session.topSetLabel}</p>
              <p className={`${styles.listRowMeta} whitespace-nowrap`}>
                {session.volumeLabel}
              </p>
            </div>
            <LinkPendingOverlay />
          </Link>
        ))}
      </div>

      {sessions.length > PAGE_SIZE ? (
        <div className={styles.pagerRow} data-pager="sessions">
          <button
            type="button"
            className={styles.pagerButton}
            onClick={() => setPage(Math.max(currentPage - 1, 0))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className={styles.pagerIcon} strokeWidth={1.9} />
          </button>
          <span className={styles.pagerRange}>
            {`${rangeStart + 1}-${rangeEnd} of ${sessions.length}`}
          </span>
          <button
            type="button"
            className={styles.pagerButton}
            onClick={() => setPage(Math.min(currentPage + 1, pageCount - 1))}
            disabled={currentPage >= pageCount - 1}
          >
            <ChevronRight className={styles.pagerIcon} strokeWidth={1.9} />
          </button>
        </div>
      ) : null}
    </>
  );
}
