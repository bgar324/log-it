"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import type { WeightUnit } from "@/lib/weight-unit";
import { workoutReturnQueryForDay } from "@/app/workouts/workout-return";
import { WorkoutPersonalRecords } from "@/app/workouts/workout-personal-records";
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
              </Link>
            </header>
            <WorkoutPersonalRecords userId={userId} workoutId={workout.id} weightUnit={weightUnit} />

            <div aria-busy={!details[workout.id] || details[workout.id].status === "loading"}>
            {!details[workout.id] || details[workout.id].status === "loading" ? <span role="status" className="sr-only">Loading session details…</span> : null}
            <SessionDetail
              state={details[workout.id]}
              exerciseCount={workout.exerciseCount}
              setCount={workout.setCount}
              onRetry={() => retry(workout.id)}
            />
            </div>
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
  const exercises = Math.max(exerciseCount, 0);
  const sets = Math.max(setCount, 0);

  return (
    <div className={historyStyles.exerciseList} aria-hidden="true">
      {Array.from({ length: exercises }, (_, exercise) => (
        <div key={exercise} className={historyStyles.exercise}>
          <p className={historyStyles.exerciseName}>
            <span className={`${styles.skeletonBlock} h-[1lh] w-[8.5rem] max-w-full`} />
          </p>
          <ul className={historyStyles.setList}>
            {Array.from({ length: Math.floor(sets / exercises) + (exercise < sets % exercises ? 1 : 0) }, (_, set) => (
              <li key={set} className={historyStyles.setRow}>
                <span className={historyStyles.setOrder}><span className={`${styles.skeletonBlock} h-[1lh] w-[2.2rem]`} /></span>
                <span className={historyStyles.setDetail}><span className={`${styles.skeletonBlock} h-[1lh] w-[7.5rem] max-w-full`} /></span>
                <span className={historyStyles.setDuration} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
