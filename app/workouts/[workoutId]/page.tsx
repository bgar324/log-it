import { SquarePen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaSchemaMismatchError } from "@/lib/schema-compat";
import { formatWorkoutForClipboard } from "@/lib/workout-export";
import {
  convertStoredWeightToDisplay,
  formatWeightWithUnit,
} from "@/lib/weight-unit";
import { formatDatabaseDateLabel } from "@/lib/workout-utils";
import { WorkoutDetailActions } from "./workout-detail-actions";
import styles from "./workout-detail.module.css";

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

  const workout = await (async () => {
    try {
      return await prisma.workoutLog.findFirst({
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
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (!isPrismaSchemaMismatchError(error)) {
        throw error;
      }

      const legacyWorkout = await prisma.workoutLog.findFirst({
        where: {
          id: workoutId,
          userId: user.id,
        },
        select: {
          id: true,
          title: true,
          performedAt: true,
          totalWeightLb: true,
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
                },
              },
            },
          },
        },
      });

      return legacyWorkout
        ? {
            ...legacyWorkout,
            workoutType: null,
          }
        : null;
    }
  })();

  if (!workout) {
    notFound();
  }

  const unit = user.preferredWeightUnit;
  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const totalWeight = convertStoredWeightToDisplay(workout.totalWeightLb, unit) ?? 0;
  const summaryItems = [
    ...(workout.workoutType
      ? [{ label: "Type", value: workout.workoutType }]
      : []),
    { label: "Date", value: formatDate(workout.performedAt) },
    { label: "Exercises", value: `${workout.exercises.length}` },
    { label: "Sets", value: `${totalSets}` },
    { label: "Total volume", value: formatWeightWithUnit(totalWeight, unit) },
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
      })),
    })),
  });

  return (
    <main className={styles.shell}>
      <section className={styles.stage}>
        <header className={styles.topRow}>
          <Link href="/dashboard?view=workouts" className={styles.backLink}>
            Back to workouts
          </Link>
          <div className={styles.topActions}>
            <Link
              href={`/workouts/${workout.id}/edit`}
              className={styles.actionLink}
              aria-label="Edit workout"
            >
              <SquarePen className={styles.actionButtonIcon} aria-hidden="true" strokeWidth={1.9} />
              <span className={styles.actionButtonLabel}>Edit workout</span>
            </Link>
            <WorkoutDetailActions workoutId={workout.id} workoutExport={workoutExport} />
            <ThemeToggle />
          </div>
        </header>

        <section className={styles.summaryCard}>
          <p className={styles.label}>Workout</p>
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
                    {formatWeightWithUnit(exerciseVolume, unit)} volume
                  </p>
                </header>

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Set</th>
                        <th>Weight</th>
                        <th>Reps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercise.sets.map((set) => (
                        <tr key={set.id}>
                          <td>#{set.order}</td>
                          <td>
                            {set.weightLb !== null
                              ? formatWeightWithUnit(
                                  convertStoredWeightToDisplay(set.weightLb, unit) ?? 0,
                                  unit,
                                )
                              : "--"}
                          </td>
                          <td>{set.reps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
