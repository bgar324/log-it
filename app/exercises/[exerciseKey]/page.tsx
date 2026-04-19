import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { requireSessionUser } from "@/lib/auth";
import { isUuidLikeKey, toExerciseRouteKey } from "@/lib/exercise-route-key";
import { prisma } from "@/lib/prisma";
import {
  convertStoredWeightToDisplay,
  formatWeightValue,
  formatWeightWithUnit,
  getWeightUnitLabel,
} from "@/lib/weight-unit";
import {
  daysBetweenDatabaseDates,
  formatDatabaseDateLabel,
  getCurrentPacificDate,
  normalizeExerciseName,
} from "@/lib/workout-utils";
import { ExerciseDetailChart } from "./exercise-detail-chart";
import { SessionBreakdownTable } from "./session-breakdown-table";
import styles from "./exercise-detail.module.css";

type ExerciseDetailParams = Promise<{ exerciseKey: string }>;

function daysBetweenDays(from: Date, to: Date) {
  return daysBetweenDatabaseDates(from, to);
}

function daysAgoLabel(days: number) {
  if (days === 0) {
    return "today";
  }

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
}

function formatDate(value: Date) {
  return formatDatabaseDateLabel(value, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(value: Date) {
  return formatDatabaseDateLabel(value, {
    month: "short",
    day: "numeric",
  });
}

type ExerciseLogRow = {
  id: string;
  name: string;
  workoutLog: {
    id: string;
    title: string;
    performedAt: Date;
  };
  sets: Array<{
    id: string;
    reps: number;
    weightLb: { toNumber: () => number } | number | null;
  }>;
};

async function fetchExerciseLogs(
  userId: string,
  exerciseKey: string,
): Promise<ExerciseLogRow[]> {
  const baseSelect = {
    id: true,
    name: true,
    workoutLog: {
      select: {
        id: true,
        title: true,
        performedAt: true,
      },
    },
    sets: {
      select: {
        id: true,
        reps: true,
        weightLb: true,
      },
    },
  } as const;

  let logs = await prisma.workoutExercise.findMany({
    where: {
      workoutLog: {
        userId,
      },
      OR: [
        { normalizedName: exerciseKey },
        { exercise: { normalizedName: exerciseKey } },
      ],
    },
    orderBy: {
      workoutLog: {
        performedAt: "desc",
      },
    },
    select: baseSelect,
  });

  if (logs.length > 0) {
    return logs;
  }

  logs = await prisma.workoutExercise.findMany({
    where: {
      workoutLog: {
        userId,
      },
    },
    orderBy: {
      workoutLog: {
        performedAt: "desc",
      },
    },
    select: baseSelect,
  });

  return logs.filter((log) => normalizeExerciseName(log.name) === exerciseKey);
}

async function resolveNormalizedExerciseKey(userId: string, rawParam: string) {
  const decodedParam = (() => {
    try {
      return decodeURIComponent(rawParam);
    } catch {
      return rawParam;
    }
  })();

  const normalizedDirect = normalizeExerciseName(decodedParam);

  if (normalizedDirect && !isUuidLikeKey(normalizedDirect)) {
    return normalizedDirect;
  }

  const exercises = await prisma.exercise.findMany({
    where: { userId },
    select: { normalizedName: true },
  });

  for (const exercise of exercises) {
    if (toExerciseRouteKey(exercise.normalizedName) === normalizedDirect) {
      return exercise.normalizedName;
    }
  }

  const workoutExercises = await prisma.workoutExercise.findMany({
    where: {
      workoutLog: {
        userId,
      },
    },
    select: {
      name: true,
      normalizedName: true,
    },
  });

  for (const exercise of workoutExercises) {
    const normalizedName =
      exercise.normalizedName || normalizeExerciseName(exercise.name);

    if (!normalizedName) {
      continue;
    }

    if (toExerciseRouteKey(normalizedName) === normalizedDirect) {
      return normalizedName;
    }
  }

  return normalizedDirect;
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: ExerciseDetailParams;
}) {
  const { exerciseKey: rawExerciseKey } = await params;
  const user = await requireSessionUser();
  const normalizedKey = await resolveNormalizedExerciseKey(
    user.id,
    rawExerciseKey,
  );

  if (!normalizedKey) {
    notFound();
  }

  const exerciseLogs = await fetchExerciseLogs(user.id, normalizedKey);

  if (exerciseLogs.length === 0) {
    notFound();
  }

  const weightUnit = user.preferredWeightUnit;
  const unitLabel = getWeightUnitLabel(weightUnit);
  const sessionsByWorkout = new Map<
    string,
    {
      workoutId: string;
      workoutTitle: string;
      performedAt: Date;
      setCount: number;
      totalReps: number;
      weightedSetCount: number;
      bestWeight: number;
      topSetReps: number;
      totalLoad: number;
    }
  >();

  const displayName = exerciseLogs[0].name;

  for (const exerciseLog of exerciseLogs) {
    const session = sessionsByWorkout.get(exerciseLog.workoutLog.id) ?? {
      workoutId: exerciseLog.workoutLog.id,
      workoutTitle: exerciseLog.workoutLog.title,
      performedAt: exerciseLog.workoutLog.performedAt,
      setCount: 0,
      totalReps: 0,
      weightedSetCount: 0,
      bestWeight: 0,
      topSetReps: 0,
      totalLoad: 0,
    };

    for (const set of exerciseLog.sets) {
      const weight = convertStoredWeightToDisplay(set.weightLb, weightUnit);

      session.setCount += 1;
      session.totalReps += set.reps;

      if (weight !== null) {
        session.weightedSetCount += 1;

        if (weight > session.bestWeight) {
          session.bestWeight = weight;
          session.topSetReps = set.reps;
        } else if (weight === session.bestWeight) {
          session.topSetReps = Math.max(session.topSetReps, set.reps);
        }

        session.totalLoad += weight * set.reps;
      }
    }

    sessionsByWorkout.set(exerciseLog.workoutLog.id, session);
  }

  const sessions = Array.from(sessionsByWorkout.values()).sort(
    (a, b) => b.performedAt.getTime() - a.performedAt.getTime(),
  );

  const totalSetCount = sessions.reduce(
    (sum, session) => sum + session.setCount,
    0,
  );
  const totalReps = sessions.reduce(
    (sum, session) => sum + session.totalReps,
    0,
  );
  const weightedSetCount = sessions.reduce(
    (sum, session) => sum + session.weightedSetCount,
    0,
  );
  const totalLoad = sessions.reduce(
    (sum, session) => sum + session.totalLoad,
    0,
  );
  const bestWeight = sessions.reduce(
    (max, session) => Math.max(max, session.bestWeight),
    0,
  );
  const lastHit = sessions[0].performedAt;
  const daysSinceLastHit = daysBetweenDays(getCurrentPacificDate(), lastHit);
  const averageRepsPerSet =
    totalSetCount > 0 ? Number((totalReps / totalSetCount).toFixed(1)) : 0;
  const averageLoadPerSession =
    sessions.length > 0 ? Number((totalLoad / sessions.length).toFixed(1)) : 0;

  const chartSeries = [...sessions]
    .sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime())
    .map((session) => ({
      label: formatShortDate(session.performedAt),
      performedAtLabel: formatDate(session.performedAt),
      bestWeight: Number(session.bestWeight.toFixed(2)),
      topSetReps: session.topSetReps,
      estimatedOneRepMax: Number(
        (session.bestWeight * (1 + session.topSetReps / 30)).toFixed(1),
      ),
    }));

  return (
    <main className={styles.shell}>
      <section className={styles.stage}>
        <header className={styles.topRow}>
          <Link href="/dashboard?view=progress" className={styles.backLink}>
            Back to progress
          </Link>
          <ThemeToggle />
        </header>

        <section className={styles.summaryCard}>
          <h1 className={styles.title}>{displayName}</h1>
          <p className={styles.subtitle}>
            Last hit {formatDate(lastHit)} ({daysAgoLabel(daysSinceLastHit)}
            )
          </p>
        </section>

        <section className={styles.kpiRailWrap} aria-label="Exercise metrics">
          <div className={styles.kpiRail}>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Sessions</p>
              <p className={styles.kpiValue}>{sessions.length}</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Sets</p>
              <p className={styles.kpiValue}>{totalSetCount}</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Average Reps</p>
              <p className={styles.kpiValue}>{averageRepsPerSet}</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Best weight</p>
              <p className={styles.kpiValue}>
                {formatWeightWithUnit(bestWeight, weightUnit)}
              </p>
            </article>
          </div>
        </section>

        <section className={styles.panelGrid}>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Weight over time</h2>
            <p className={styles.panelSubtitle}>
              Best top-set weight each time this exercise was trained.
            </p>
            <ExerciseDetailChart
              series={chartSeries}
              metric="weight"
              weightUnit={weightUnit}
            />
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>
              Strength trend (weight + reps)
            </h2>
            <p className={styles.panelSubtitle}>
              Top-set estimated 1RM (Epley), so extra reps at the same weight
              still count as progress.
            </p>
            <ExerciseDetailChart
              series={chartSeries}
              metric="strength"
              weightUnit={weightUnit}
            />
          </section>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Session breakdown</h2>
          <SessionBreakdownTable
            sessions={sessions.map((session) => ({
              workoutId: session.workoutId,
              workoutTitle: session.workoutTitle,
              performedAtLabel: formatDate(session.performedAt),
              setCount: session.setCount,
              totalReps: session.totalReps,
              bestWeightLabel: formatWeightWithUnit(session.bestWeight, weightUnit),
              totalLoadLabel: `${formatWeightValue(session.totalLoad)} ${unitLabel}`,
            }))}
          />
        </section>
      </section>
    </main>
  );
}
