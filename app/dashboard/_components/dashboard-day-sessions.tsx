"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import { MotionReveal } from "@/app/components/motion-reveal";
import type { WeightUnit } from "@/lib/weight-unit";
import { workoutReturnQueryForDay } from "@/app/workouts/workout-return";
import { styles } from "../dashboard.styles";
import { useWorkoutDetails } from "../_hooks/use-workout-details";
import type { WorkoutDetailState } from "../workout-detail-cache";
import type { RecordedDay } from "./dashboard-day-strip";
import { historyStyles } from "./dashboard-history.styles";

type DashboardDaySessionsProps = {
  day: RecordedDay;
  weightUnit: WeightUnit;
  /** Whose history this is: cached sets never cross accounts. */
  userId: string;
};

const MAX_SKELETON_EXERCISES = 6;
const MAX_SKELETON_SETS = 5;

/** The selected day's sessions, with title links for details and direct edit pencils. */
export function DashboardDaySessions({ day, weightUnit, userId }: DashboardDaySessionsProps) {
  const workoutIds = day.workouts.map((workout) => workout.id);
  const { details, retry } = useWorkoutDetails(workoutIds, weightUnit, userId);
  // Editing a session should be able to bring you back to the day you were
  // browsing, not to the top of the history.
  const returnQuery = workoutReturnQueryForDay(day.date);

  return (
    <section key={day.date} className={historyStyles.day}>
      <div className={historyStyles.sessionList}>
        {day.workouts.map((workout) => (
          <article key={workout.id} className={historyStyles.session}>
            <header className={historyStyles.sessionHead}>
              <h3 className={historyStyles.sessionTitle}>
                <Link href={`/workouts/${workout.id}${returnQuery}`} className="relative -my-3 inline-block min-w-11 py-3 [touch-action:manipulation]" aria-label={`Open ${workout.title}`}>
                  {workout.title}
                  <LinkPendingOverlay />
                </Link>
              </h3>
              <Link
                href={`/workouts/${workout.id}/edit${returnQuery}`}
                className={historyStyles.sessionEdit}
                aria-label={`Edit ${workout.title}`}
              >
                <Pencil
                  aria-hidden="true"
                  className={historyStyles.sessionEditIcon}
                  strokeWidth={1.9}
                />
                <LinkPendingOverlay />
              </Link>
            </header>

            <MotionReveal loading={!details[workout.id] || details[workout.id].status === "loading"} label="session details">
            <SessionDetail
              state={details[workout.id]}
              exerciseCount={workout.exerciseCount}
              setCount={workout.setCount}
              onRetry={() => retry(workout.id)}
            />
            </MotionReveal>
          </article>
        ))}
      </div>
    </section>
  );
}

function SessionDetail({
  state,
  exerciseCount,
  setCount,
  onRetry,
}: {
  state: WorkoutDetailState | undefined;
  exerciseCount: number;
  setCount: number;
  onRetry: () => void;
}) {
  if (!state || state.status === "loading") {
    return <SessionDetailSkeleton exerciseCount={exerciseCount} setCount={setCount} />;
  }

  if (state.status === "missing") {
    return (
      <div className={historyStyles.detailState}>
        <p className={historyStyles.detailMessage}>
          The sets for this session are no longer in your history.
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={historyStyles.detailState}>
        <p className={historyStyles.detailMessage}>{state.message}</p>
        <button type="button" className={historyStyles.detailRetry} onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={historyStyles.exerciseList}>
      {state.detail.exercises.map((exercise) => (
        <div key={exercise.id} className={historyStyles.exercise}>
          <p className={historyStyles.exerciseName}>{exercise.name}</p>
          {exercise.sets.length > 0 ? (
            <ul className={historyStyles.setList}>
              {exercise.sets.map((set) => (
                <li key={set.id} className={historyStyles.setRow}>
                  <span className={historyStyles.setOrder}>{set.orderLabel}</span>
                  <span className={historyStyles.setDetail}>{set.detail}</span>
                  <span className={historyStyles.setDuration}>
                    {set.durationLabel ?? ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SessionDetailSkeleton({
  exerciseCount,
  setCount,
}: {
  exerciseCount: number;
  setCount: number;
}) {
  const exercises = Math.min(Math.max(exerciseCount, 1), MAX_SKELETON_EXERCISES);
  const setsPerExercise = Math.min(
    Math.max(Math.round(setCount / exercises) || 1, 1),
    MAX_SKELETON_SETS,
  );

  return (
    <div className={historyStyles.exerciseList} aria-hidden="true">
      {Array.from({ length: exercises }, (_, exercise) => (
        <div key={exercise} className={historyStyles.exercise}>
          <span className={`${styles.skeletonBlock} h-[1.05rem] w-[8.5rem]`} />
          <div className={historyStyles.setList}>
            {Array.from({ length: setsPerExercise }, (_, set) => (
              <div key={set} className={historyStyles.setRow}>
                <span className={`${styles.skeletonBlock} h-[0.7rem] w-[2.2rem]`} />
                <span className={`${styles.skeletonBlock} h-[0.9rem] w-[7.5rem]`} />
                <span />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
