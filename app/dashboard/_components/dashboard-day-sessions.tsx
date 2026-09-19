"use client";

import Link from "next/link";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import { workoutReturnQueryForDay } from "@/app/workouts/workout-return";
import { countLabel } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";
import {
  useWorkoutDetails,
  type WorkoutDetailState,
} from "../_hooks/use-workout-details";
import type { RecordedDay } from "./dashboard-day-strip";
import { fullDayLabel } from "./dashboard-history.dates";
import { historyStyles } from "./dashboard-history.styles";

type DashboardDaySessionsProps = {
  day: RecordedDay;
  weightUnit: WeightUnit;
};

const MAX_SKELETON_EXERCISES = 6;
const MAX_SKELETON_SETS = 5;

/**
 * Everything recorded on the selected day: each session with its exercises and
 * the sets as they were logged. The list rows the history used to show already
 * carry the counts, so the card is complete before the sets arrive and the
 * placeholder is sized from the counts it is standing in for.
 */
export function DashboardDaySessions({ day, weightUnit }: DashboardDaySessionsProps) {
  const workoutIds = day.workouts.map((workout) => workout.id);
  const { details, retry } = useWorkoutDetails(workoutIds, weightUnit);
  const daySets = day.workouts.reduce((sum, workout) => sum + workout.setCount, 0);
  const dayVolume = day.workouts.reduce((sum, workout) => sum + workout.volume, 0);
  // Opening a session should be able to bring you back to the day you were
  // browsing, not to the top of the history.
  const returnQuery = workoutReturnQueryForDay(day.date);

  return (
    <section key={day.date} className={historyStyles.day}>
      <header className={historyStyles.dayHead}>
        <h3 className={historyStyles.dayTitle}>{fullDayLabel(day.date)}</h3>
        {/* One session already states its own counts on its card. */}
        {day.workouts.length > 1 ? (
          <p className={historyStyles.dayMeta}>
            {countLabel(day.workouts.length, "session")} ·{" "}
            {countLabel(daySets, "set")} ·{" "}
            {formatWeightWithUnit(dayVolume, weightUnit, { maximumFractionDigits: 0 })}
          </p>
        ) : null}
      </header>

      <div className={historyStyles.sessionList}>
        {day.workouts.map((workout) => (
          <article key={workout.id} className={historyStyles.session}>
            <header className={historyStyles.sessionHead}>
              <h4 className={historyStyles.sessionTitle}>{workout.title}</h4>
              <p className={historyStyles.sessionMeta}>
                {workout.workoutType ? `${workout.workoutType} · ` : ""}
                {countLabel(workout.exerciseCount, "exercise")} ·{" "}
                {countLabel(workout.setCount, "set")} ·{" "}
                {formatWeightWithUnit(workout.volume, weightUnit, {
                  maximumFractionDigits: 0,
                })}
              </p>
            </header>

            <SessionDetail
              state={details[workout.id]}
              exerciseCount={workout.exerciseCount}
              setCount={workout.setCount}
              onRetry={() => retry(workout.id)}
            />

            <div className={historyStyles.sessionActions}>
              <Link
                href={`/workouts/${workout.id}${returnQuery}`}
                className={historyStyles.sessionOpen}
              >
                Open workout
                <LinkPendingOverlay />
              </Link>
              <Link
                href={`/workouts/${workout.id}/edit${returnQuery}`}
                className={historyStyles.sessionEdit}
              >
                Edit
                <LinkPendingOverlay />
              </Link>
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
          <p className={historyStyles.exerciseMeta}>{exercise.metaLine}</p>
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
          <span className={`${styles.skeletonBlock} mt-[0.2rem] h-[0.7rem] w-[6rem]`} />
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
