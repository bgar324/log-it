"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { styles } from "./exercise-detail.styles";

const PAGE_SIZE = 5;

type SessionBreakdownRow = {
  workoutId: string;
  workoutTitle: string;
  workoutType: string | null;
  performedAtLabel: string;
  setCount: number;
  totalReps: number;
  bestWeightLabel: string;
  totalLoadLabel: string;
};

type SessionBreakdownTableProps = {
  sessions: SessionBreakdownRow[];
};

export function SessionBreakdownTable({
  sessions,
}: SessionBreakdownTableProps) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE));

  const visibleSessions = useMemo(() => {
    const start = page * PAGE_SIZE;
    return sessions.slice(start, start + PAGE_SIZE);
  }, [page, sessions]);

  return (
    <>
      <div className={styles.tableWrap}>
        <div className={styles.metricList}>
          <div className={styles.sessionHeader}>
            {["Workout", "Date", "Sets", "Reps", "Best weight", "Volume"].map((label) => (
              <span key={label} className={styles.sessionHeaderCell}>
                {label}
              </span>
            ))}
          </div>
          {visibleSessions.map((session) => (
            <Link
              key={session.workoutId}
              href={`/workouts/${session.workoutId}`}
              className={`${styles.sessionRow} ${styles.sessionLinkRow}`}
            >
              <div>
                <p className={styles.sessionTitle}>
                  {session.workoutTitle.trim() || "Workout"}
                </p>
                {session.workoutType?.trim() ? (
                  <p className={styles.sessionMeta}>{session.workoutType.trim()}</p>
                ) : null}
              </div>
              <span>{session.performedAtLabel}</span>
              <span>{session.setCount}</span>
              <span>{session.totalReps}</span>
              <span>{session.bestWeightLabel}</span>
              <span>{session.totalLoadLabel}</span>
            </Link>
          ))}
        </div>
      </div>

      {sessions.length > PAGE_SIZE ? (
        <div className={styles.paginationRow}>
          <p className={styles.paginationMeta}>
            Showing {page * PAGE_SIZE + 1}-
            {Math.min((page + 1) * PAGE_SIZE, sessions.length)} of {sessions.length}
          </p>
          <div className={styles.paginationControls}>
            <button
              type="button"
              className={styles.paginationButton}
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              disabled={page === 0}
            >
              Prev
            </button>
            <span className={styles.paginationPage}>
              Page {page + 1} of {pageCount}
            </span>
            <button
              type="button"
              className={styles.paginationButton}
              onClick={() =>
                setPage((current) => Math.min(current + 1, pageCount - 1))
              }
              disabled={page >= pageCount - 1}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
