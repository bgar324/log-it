import { notFound } from "next/navigation";
import { AppDrawerTrigger, AppShell } from "@/app/components/app-nav";
import { appNavUserFromSession } from "@/app/components/app-nav.user";
import { navStyles } from "@/app/components/app-nav.styles";
import { BackButton } from "@/app/components/back-button";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatWorkoutForClipboard } from "@/lib/workout-export";
import {
  convertStoredWeightToDisplay,
  formatWeightWithUnit,
} from "@/lib/weight-unit";
import { formatDatabaseDateLabel } from "@/lib/workout-utils";
import { WorkoutDetailActions } from "./workout-detail-actions";
import { styles } from "./workout-detail.styles";

type WorkoutPageParams = Promise<{ workoutId: string }>;

function formatDate(value: Date) {
  return formatDatabaseDateLabel(value, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function WorkoutDetailPage({
  params,
}: {
  params: WorkoutPageParams;
}) {
  const { workoutId } = await params;
  const user = await requireSessionUser();

  const workout = await prisma.workoutLog.findFirst({
    where: {
      id: workoutId,
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
      workoutType: true,
      performedAt: true,
      totalWeightLb: true,
      bodyWeightLb: true,
      exercises: {
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          order: true,
          name: true,
          sets: {
            orderBy: {
              order: "asc",
            },
            select: {
              id: true,
              order: true,
              reps: true,
              weightLb: true,
              durationSeconds: true,
            },
          },
        },
      },
    },
  });

  if (!workout) {
    notFound();
  }

  const unit = user.preferredWeightUnit;
  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const totalWeight = convertStoredWeightToDisplay(workout.totalWeightLb, unit) ?? 0;
  const bodyWeight = convertStoredWeightToDisplay(workout.bodyWeightLb, unit);
  const hasBodyweightVolume =
    bodyWeight !== null &&
    workout.exercises.some((exercise) =>
      exercise.sets.some((set) => set.weightLb === null && set.reps > 0),
    );
  const exerciseCountLabel = `${workout.exercises.length} ${
    workout.exercises.length === 1 ? "exercise" : "exercises"
  }`;
  const setCountLabel = `${totalSets} ${totalSets === 1 ? "set" : "sets"}`;
  const volumeLabel = formatWeightWithUnit(totalWeight, unit, {
    maximumFractionDigits: 0,
  });
  const summarySentence = `${exerciseCountLabel} · ${setCountLabel} · ${volumeLabel} total volume`;
  const summaryMeta = hasBodyweightVolume
    ? `${formatDate(workout.performedAt)} · bodyweight ${formatWeightWithUnit(
        bodyWeight ?? 0,
        unit,
        { maximumFractionDigits: 1 },
      )}`
    : formatDate(workout.performedAt);
  const workoutExport = formatWorkoutForClipboard({
    performedAt: workout.performedAt,
    workoutType: workout.workoutType,
    title: workout.title,
    weightUnit: unit,
    exercises: workout.exercises.map((exercise) => ({
      name: exercise.name,
        sets: exercise.sets.map((set) => ({
          reps: set.reps,
          weightLb: set.weightLb,
          durationSeconds: set.durationSeconds,
        })),
    })),
  });

  const screen = (
    <main className={styles.shell}>
      <section className={`${styles.stage} ${navStyles.mainInset}`}>
        <header className={styles.topRow}>
          <div className={styles.topLead}>
            <AppDrawerTrigger />
            <BackButton
              fallbackHref="/dashboard?view=workouts"
              label="Back"
              className={styles.backLink}
              iconClassName={styles.backButtonIcon}
            />
          </div>
          <div className={styles.topActions}>
            <WorkoutDetailActions
              editHref={`/workouts/${workout.id}/edit`}
              workoutId={workout.id}
              workoutExport={workoutExport}
            />
          </div>
        </header>

        <section className={styles.summaryCard}>
          {workout.workoutType && workout.workoutType !== workout.title ? (
            <p className={styles.titleMeta}>{workout.workoutType}</p>
          ) : null}
          <h1 className={styles.title}>{workout.title}</h1>
          <p className={styles.summaryLine}>{summarySentence}</p>
          <p className={styles.summaryMeta}>{summaryMeta}</p>
        </section>

        <section className={styles.exerciseList}>
          {workout.exercises.map((exercise) => {
            const exerciseVolume = exercise.sets.reduce((sum, set) => {
              const weight = convertStoredWeightToDisplay(set.weightLb, unit);

              if (weight === null) {
                // Bodyweight set: credit the workout's tracked body weight.
                if (bodyWeight !== null && set.reps > 0) {
                  return sum + bodyWeight * set.reps;
                }

                return sum;
              }

              return sum + weight * set.reps;
            }, 0);

            return (
              <article key={exercise.id} className={styles.exerciseCard}>
                <header className={styles.exerciseHead}>
                  <h2 className={styles.exerciseName}>{exercise.name}</h2>
                  <p className={styles.exerciseMeta}>
                    {`Exercise ${exercise.order} · ${exercise.sets.length} ${
                      exercise.sets.length === 1 ? "set" : "sets"
                    } · ${formatWeightWithUnit(exerciseVolume, unit, {
                      maximumFractionDigits: 0,
                    })} volume`}
                  </p>
                </header>

                <div className={styles.setList}>
                  {exercise.sets.map((set) => {
                    const weightLabel =
                      set.weightLb !== null
                        ? formatWeightWithUnit(
                            convertStoredWeightToDisplay(set.weightLb, unit) ?? 0,
                            unit,
                            { maximumFractionDigits: 0 },
                          )
                        : "Bodyweight";

                    return (
                      <div key={set.id} className={styles.setRow}>
                        <span className={styles.setOrder}>Set {set.order}</span>
                        <span className={styles.setDetail}>
                          {set.reps > 0 ? `${weightLabel} × ${set.reps} reps` : weightLabel}
                        </span>
                        <span className={styles.setDuration}>
                          {set.durationSeconds ? `${set.durationSeconds}s` : null}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );

  return (
    <AppShell
      user={appNavUserFromSession(user)}
      analyticsUser={user}
      activeView="workouts"
    >
      {screen}
    </AppShell>
  );
}
