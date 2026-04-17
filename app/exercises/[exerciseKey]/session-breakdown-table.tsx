"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./exercise-detail.module.css";

const PAGE_SIZE = 5;

type SessionBreakdownRow = {
  workoutId: string;
  workoutTitle: string;
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
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Workout</th>
              <th>Date</th>
              <th>Sets</th>
              <th>Reps</th>
              <th>Best weight</th>
              <th>Volume</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleSessions.map((session) => (
              <tr key={session.workoutId}>
                <td>{session.workoutTitle}</td>
                <td>{session.performedAtLabel}</td>
                <td>{session.setCount}</td>
                <td>{session.totalReps}</td>
                <td>{session.bestWeightLabel}</td>
                <td>{session.totalLoadLabel}</td>
                <td>
                  <Link
                    href={`/workouts/${session.workoutId}`}
                    className={styles.tableLink}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
