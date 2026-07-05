import { WorkoutLogger } from "./workout-logger";
import Link from "next/link";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveBodyWeightLbForDate } from "@/lib/body-weight";
import { convertStoredWeightToDisplay } from "@/lib/weight-unit";
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
  const [splitSeed, bodyWeightLb] = await Promise.all([
    getWorkoutLoggerInitialDataForDate(user.id, selectedDate),
    resolveBodyWeightLbForDate(prisma, user.id, selectedDate),
  ]);
  const bodyWeightDisplay = convertStoredWeightToDisplay(
    bodyWeightLb,
    user.preferredWeightUnit,
  );
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
      splitTemplateData={splitSeed.split.id ? splitSeed.initialData : undefined}
      weightUnit={user.preferredWeightUnit}
      bodyWeightDisplay={bodyWeightDisplay}
    />
  );
}
