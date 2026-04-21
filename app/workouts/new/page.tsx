import { WorkoutLogger } from "./workout-logger";
import Link from "next/link";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { requireSessionUser } from "@/lib/auth";
import { getWorkoutLoggerInitialDataForDate } from "@/lib/workout-splits/service";
import { parseDateKey } from "@/lib/workout-splits/shared";
import { getCurrentPacificDate } from "@/lib/workout-utils";
import { styles } from "./workout-logger.styles";

type SearchParams = Promise<{
  date?: string;
}>;

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [params, user] = await Promise.all([
    searchParams,
    requireSessionUser(),
  ]);
  const selectedDate = parseDateKey(params.date ?? "") ?? getCurrentPacificDate();
  const splitSeed = await getWorkoutLoggerInitialDataForDate(user.id, selectedDate);
  const isRestDay = splitSeed.split.id && splitSeed.day.workoutTypeSlug === "rest";
  const initialData =
    splitSeed.split.id &&
    (splitSeed.day.exercises.length > 0 || splitSeed.day.workoutTypeSlug !== "rest")
      ? splitSeed.initialData
      : undefined;

  if (isRestDay) {
    return (
      <main className={styles.loggerShell}>
        <section className={styles.loggerStage} aria-label="Rest day notice">
          <div className={styles.topRow}>
            <Link href="/dashboard" className={styles.backLink}>
              Back to dashboard
            </Link>
            <ThemeToggle />
          </div>

          <section className={styles.card}>
            <h1 className={styles.title}>Rest day</h1>
            <p className={styles.compareHint}>
              Your split marks this day as rest, so logging a workout is disabled.
            </p>
            <Link href="/dashboard" className={styles.secondaryButton}>
              Return to dashboard
            </Link>
          </section>
        </section>
      </main>
    );
  }

  return (
    <WorkoutLogger
      initialData={initialData}
      weightUnit={user.preferredWeightUnit}
    />
  );
}
