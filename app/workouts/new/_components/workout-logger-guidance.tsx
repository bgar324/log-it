"use client";

import type { WorkoutLoggerExerciseEntry } from "../workout-logger.types";
import { MotionReveal } from "@/app/components/motion-reveal";
import { formatCompareDayLabel, formatLoggedSetSnapshot } from "../workout-logger.formatters";
import { styles } from "../workout-logger.styles";

type GuidanceProps = Pick<WorkoutLoggerExerciseEntry, "exercise" | "insightState" | "weightUnit"> & {
  onRetry: () => void;
};

export function WorkoutLoggerGuidance({ exercise, insightState, weightUnit, onRetry }: GuidanceProps) {
  if (!exercise.name.trim() || !insightState || insightState.status === "idle") return null;
  return (
    <MotionReveal loading={insightState.status === "loading"} label="exercise guidance">
      <GuidanceContent exercise={exercise} insightState={insightState} weightUnit={weightUnit} onRetry={onRetry} />
    </MotionReveal>
  );
}

function GuidanceContent({ exercise, insightState, weightUnit, onRetry }: GuidanceProps) {
  if (!insightState) return null;
  if (insightState.status === "loading") {
    return <section aria-label="Exercise guidance" className={styles.guidance} aria-busy="true">
      <p className={styles.guidanceNote}>Loading session guidance…</p>
    </section>;
  }
  if (insightState.status === "error" || !insightState.data) {
    return <section aria-label="Exercise guidance" className={styles.guidance}>
      <p className={styles.guidanceNote}>Session guidance is unavailable.</p>
      <button type="button" className={styles.guidanceRetry} onClick={onRetry}>Retry</button>
    </section>;
  }

  const { lastSession, prediction } = insightState.data;
  const reliable = prediction?.confidence === "medium" || prediction?.confidence === "high";
  const suggested = reliable ? prediction.predictedSets : [];
  if (!lastSession && suggested.length === 0) {
    return <section aria-label="Exercise guidance" className={styles.guidance}>
      <p className={styles.guidanceNote}>No previous session recorded for this exercise.</p>
    </section>;
  }
  const rows = Math.max(exercise.sets.length, lastSession?.sets.length ?? 0);
  const showSet = (set: { weightLb: number | null; reps: number; durationSeconds?: number | null }) =>
    formatLoggedSetSnapshot(set, weightUnit).replace(" x ", " × ");

  return (
    <section aria-label="Exercise guidance" className={styles.guidance}>
      <table className={styles.guidanceTable}>
        <caption className="sr-only">{exercise.name}: recorded sets and suggested targets</caption>
        <colgroup><col className={styles.guidanceSetColumn} /><col /><col /></colgroup>
        <thead>
          <tr>
            <th scope="col" className={styles.guidanceSetNumber}><span className="sr-only">Set</span></th>
            <th scope="col" className={styles.guidanceHeading}>
              {lastSession ? formatCompareDayLabel(lastSession.performedAt) : "Last session"}
            </th>
            <th scope="col" className={styles.guidanceHeading}>Suggested</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, index) => {
            const last = lastSession?.sets[index];
            const target = index < exercise.sets.length ? suggested[index] : undefined;
            return <tr key={index}>
              <th scope="row" className={styles.guidanceSetNumber}>{index + 1}</th>
              <td className={styles.guidanceValue}>{last ? showSet(last) : <span className={styles.guidanceMissing}>—</span>}</td>
              <td className={styles.guidanceValue}>{target?.reps != null ? showSet({ weightLb: target.weightLb, reps: target.reps }) : <span className={styles.guidanceMissing}>—</span>}</td>
            </tr>;
          })}
        </tbody>
      </table>
      {!reliable ? <p className={styles.guidanceNote}>Not enough history for a reliable suggestion yet.</p> : null}
    </section>
  );
}
