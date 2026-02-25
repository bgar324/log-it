import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "./workout-detail.module.css";

type WorkoutPageParams = Promise<{ workoutId: string }>;

function toWeightValue(value: { toNumber: () => number } | number | null) {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  return value.toNumber();
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
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

  if (!workout) {
    notFound();
  }

  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const totalWeightLb = Math.round(toWeightValue(workout.totalWeightLb) ?? 0);
  const summaryItems = [
    { label: "Date", value: formatDate(workout.performedAt) },
    { label: "Exercises", value: `${workout.exercises.length}` },
    { label: "Sets", value: `${totalSets}` },
    { label: "Total volume", value: `${totalWeightLb} lb` },
  ];

  return (
    <main className={styles.shell}>
      <section className={styles.stage}>
        <header className={styles.topRow}>
          <Link href="/dashboard?view=workouts" className={styles.backLink}>
            Back to workouts
          </Link>
          <div className={styles.topActions}>
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
              const weight = toWeightValue(set.weightLb);

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
                  <p className={styles.exerciseVolume}>{Math.round(exerciseVolume)} lb volume</p>
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
                          <td>{set.weightLb !== null ? `${toWeightValue(set.weightLb)} lb` : "--"}</td>
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
