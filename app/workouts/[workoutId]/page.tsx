import { notFound } from "next/navigation";
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
  const summaryItems = [
    { label: "Date", value: formatDate(workout.performedAt) },
    { label: "Exercises", value: `${workout.exercises.length}` },
    { label: "Sets", value: `${totalSets}` },
    {
      label: "Total volume",
      value: formatWeightWithUnit(totalWeight, unit, { maximumFractionDigits: 0 }),
    },
    ...(hasBodyweightVolume
      ? [
          {
            label: "Bodyweight",
            value: formatWeightWithUnit(bodyWeight ?? 0, unit, {
              maximumFractionDigits: 1,
            }),
          },
        ]
      : []),
  ];
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

  return (
    <main className={styles.shell}>
      <section className={styles.stage}>
        <header className={styles.topRow}>
          <div className={styles.topLead}>
            <BackButton
              fallbackHref="/workouts"
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
          {workout.workoutType ? (
            <p className={styles.titleMeta}>{workout.workoutType}</p>
          ) : null}
          <h1 className={styles.title}>{workout.title}</h1>
          <div className={styles.metaRow}>
            {summaryItems.map((item) => (
              <span key={item.label} className={styles.metaPill}>
                <span className={styles.metaPillLabel}>{item.label}</span>
                <span className={styles.metaPillValue}>{item.value}</span>
              </span>
            ))}
          </div>
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
                  <div>
                    <p className={styles.exerciseOrder}>Exercise {exercise.order}</p>
                    <h2 className={styles.exerciseName}>{exercise.name}</h2>
                  </div>
                  <p className={styles.exerciseVolume}>
                    {formatWeightWithUnit(exerciseVolume, unit, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    volume
                  </p>
                </header>

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.tableHeadCell}>Set</th>
                        <th className={styles.tableHeadCell}>Weight</th>
                        <th className={styles.tableHeadCell}>Reps</th>
                        <th className={styles.tableHeadCell}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercise.sets.map((set) => (
                        <tr key={set.id}>
                          <td className={styles.tableBodyCell}>#{set.order}</td>
                          <td className={styles.tableBodyCell}>
                            {set.weightLb !== null
                              ? formatWeightWithUnit(
                                  convertStoredWeightToDisplay(set.weightLb, unit) ?? 0,
                                  unit,
                                  { maximumFractionDigits: 0 },
                                )
                              : "--"}
                          </td>
                          <td className={styles.tableBodyCell}>{set.reps}</td>
                          <td className={styles.tableBodyCell}>
                            {set.durationSeconds ? `${set.durationSeconds}s` : "--"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={styles.mobileSetList}>
                  {exercise.sets.map((set) => (
                    <div key={set.id} className={styles.mobileSetCard}>
                      <div className={styles.mobileSetCell}>
                        <p className={styles.mobileSetNumber}>Set {set.order}</p>
                      </div>
                      <div className={styles.mobileSetCell}>
                        <span className={styles.mobileSetMeta}>Weight</span>
                        <span className={styles.mobileSetValue}>
                          {set.weightLb !== null
                            ? formatWeightWithUnit(
                                convertStoredWeightToDisplay(set.weightLb, unit) ?? 0,
                                unit,
                                { maximumFractionDigits: 0 },
                              )
                            : "--"}
                        </span>
                      </div>
                      <div className={styles.mobileSetCell}>
                        <span className={styles.mobileSetMeta}>Reps</span>
                        <span className={styles.mobileSetValue}>{set.reps} reps</span>
                      </div>
                      <div className={styles.mobileSetCell}>
                        <span className={styles.mobileSetMeta}>Time</span>
                        <span className={styles.mobileSetValue}>
                          {set.durationSeconds ? `${set.durationSeconds}s` : "--"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
