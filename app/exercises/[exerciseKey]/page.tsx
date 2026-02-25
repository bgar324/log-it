import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { requireSessionUser } from "@/lib/auth";
import { isUuidLikeKey, toExerciseRouteKey } from "@/lib/exercise-route-key";
import { prisma } from "@/lib/prisma";
import { normalizeExerciseName } from "@/lib/workout-utils";
import { ExerciseDetailChart } from "./exercise-detail-chart";
import styles from "./exercise-detail.module.css";

type ExerciseDetailParams = Promise<{ exerciseKey: string }>;

function toWeightValue(value: { toNumber: () => number } | number | null) {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  return value.toNumber();
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function daysBetweenDays(from: Date, to: Date) {
  const dayMs = 1000 * 60 * 60 * 24;
  const fromStart = startOfDay(from).getTime();
  const toStart = startOfDay(to).getTime();
  return Math.max(0, Math.floor((fromStart - toStart) / dayMs));
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

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value);
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

async function fetchExerciseLogs(userId: string, exerciseKey: string): Promise<ExerciseLogRow[]> {
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
      OR: [{ normalizedName: exerciseKey }, { exercise: { normalizedName: exerciseKey } }],
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
    const normalizedName = exercise.normalizedName || normalizeExerciseName(exercise.name);

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
  const normalizedKey = await resolveNormalizedExerciseKey(user.id, rawExerciseKey);

  if (!normalizedKey) {
    notFound();
  }

  const exerciseLogs = await fetchExerciseLogs(user.id, normalizedKey);

  if (exerciseLogs.length === 0) {
    notFound();
  }

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
      totalLoad: 0,
    };

    for (const set of exerciseLog.sets) {
      const weight = toWeightValue(set.weightLb);

      session.setCount += 1;
      session.totalReps += set.reps;

      if (weight !== null) {
        session.weightedSetCount += 1;
        session.bestWeight = Math.max(session.bestWeight, weight);
        session.totalLoad += weight * set.reps;
      }
    }

    sessionsByWorkout.set(exerciseLog.workoutLog.id, session);
  }

  const sessions = Array.from(sessionsByWorkout.values()).sort(
    (a, b) => b.performedAt.getTime() - a.performedAt.getTime(),
  );

  const totalSetCount = sessions.reduce((sum, session) => sum + session.setCount, 0);
  const totalReps = sessions.reduce((sum, session) => sum + session.totalReps, 0);
  const weightedSetCount = sessions.reduce((sum, session) => sum + session.weightedSetCount, 0);
  const totalLoad = sessions.reduce((sum, session) => sum + session.totalLoad, 0);
  const bestWeight = sessions.reduce((max, session) => Math.max(max, session.bestWeight), 0);
  const lastHit = sessions[0].performedAt;
  const daysSinceLastHit = daysBetweenDays(new Date(), lastHit);
  const averageRepsPerSet = totalSetCount > 0 ? Number((totalReps / totalSetCount).toFixed(1)) : 0;
  const averageLoadPerSession = sessions.length > 0 ? Number((totalLoad / sessions.length).toFixed(1)) : 0;

  const chartSeries = [...sessions]
    .sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime())
    .map((session) => ({
      label: formatShortDate(session.performedAt),
      performedAtLabel: formatDateTime(session.performedAt),
      bestWeight: Math.round(session.bestWeight),
    }));

  return (
    <main className={styles.shell}>
      <section className={styles.stage}>
        <header className={styles.topRow}>
          <Link href="/dashboard?view=progress" className={styles.backLink}>
            Back to progress
          </Link>

          <div className={styles.topActions}>
            <ThemeToggle />
            <Link href="/workouts/new" className={styles.actionLink}>
              Log workout
            </Link>
          </div>
        </header>

        <section className={styles.summaryCard}>
          <p className={styles.label}>Exercise</p>
          <h1 className={styles.title}>{displayName}</h1>
          <p className={styles.subtitle}>
            Last hit {formatDateTime(lastHit)} ({daysAgoLabel(daysSinceLastHit)})
          </p>
        </section>

        <section className={styles.kpiRailWrap} aria-label="Exercise metrics">
          <div className={styles.kpiRail}>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Sessions</p>
              <p className={styles.kpiValue}>{sessions.length}</p>
              <p className={styles.kpiSubtle}>Distinct workout logs containing this movement</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Sets</p>
              <p className={styles.kpiValue}>{totalSetCount}</p>
              <p className={styles.kpiSubtle}>{weightedSetCount} weighted sets tracked</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Reps</p>
              <p className={styles.kpiValue}>{totalReps}</p>
              <p className={styles.kpiSubtle}>{averageRepsPerSet} avg reps per set</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Best weight</p>
              <p className={styles.kpiValue}>{Math.round(bestWeight)} lb</p>
              <p className={styles.kpiSubtle}>Top recorded load for a single set</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Total load</p>
              <p className={styles.kpiValue}>{Math.round(totalLoad)}</p>
              <p className={styles.kpiSubtle}>Accumulated weight * reps across all sessions</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Avg load/session</p>
              <p className={styles.kpiValue}>{averageLoadPerSession}</p>
              <p className={styles.kpiSubtle}>Average session-level tonnage for this movement</p>
            </article>
          </div>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Weight over time</h2>
          <p className={styles.panelSubtitle}>Best top-set weight each time this exercise was trained.</p>
          <ExerciseDetailChart series={chartSeries} />
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Session breakdown</h2>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Workout</th>
                  <th>Date</th>
                  <th>Sets</th>
                  <th>Reps</th>
                  <th>Best weight</th>
                  <th>Volume</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.workoutId}>
                    <td>{session.workoutTitle}</td>
                    <td>{formatDateTime(session.performedAt)}</td>
                    <td>{session.setCount}</td>
                    <td>{session.totalReps}</td>
                    <td>{Math.round(session.bestWeight)} lb</td>
                    <td>{Math.round(session.totalLoad)}</td>
                    <td>
                      <Link href={`/workouts/${session.workoutId}`} className={styles.tableLink}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
