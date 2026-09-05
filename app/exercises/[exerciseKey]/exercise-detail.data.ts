import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { isUuidLikeKey, toExerciseRouteKey } from "@/lib/exercise-route-key";
import { prisma } from "@/lib/prisma";
import {
  convertStoredWeightToDisplay,
  formatWeightValue,
  formatWeightWithUnit,
  getWeightUnitLabel,
  type WeightUnit,
} from "@/lib/weight-unit";
import {
  daysBetweenDatabaseDates,
  formatDatabaseDateLabel,
  getCurrentPacificDate,
  normalizeExerciseName,
} from "@/lib/workout-utils";

type ExerciseLogRow = {
  id: string;
  name: string;
  workoutLog: {
    id: string;
    title: string;
    workoutType: string | null;
    performedAt: Date;
  };
  sets: Array<{
    id: string;
    reps: number;
    weightLb: { toNumber: () => number } | number | null;
  }>;
};

function daysAgoLabel(days: number) {
  if (days === 0) {
    return "today";
  }

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
}

function countLabel(count: number, singular: string) {
  return `${count.toLocaleString()} ${count === 1 ? singular : `${singular}s`}`;
}

// What the exercise's whole history says, in one sentence and one muted line —
// the same shape workout detail uses. Bodyweight-only history has no external
// load, so it says so instead of quoting a best weight of zero.
function buildSummaryLines(
  summary: ReturnType<typeof summarizeExerciseSessions>,
  lastHit: Date,
  daysSinceLastHit: number,
  weightUnit: WeightUnit,
) {
  const repsClause =
    summary.averageRepsPerSet > 0
      ? `, ${countLabel(summary.averageRepsPerSet, "rep")} a set on average`
      : "";
  const bestWeightClause =
    summary.bestWeight > 0
      ? `Best weight ${formatWeightWithUnit(summary.bestWeight, weightUnit, {
          maximumFractionDigits: 0,
        })}`
      : "Bodyweight only";

  return {
    summarySentence: `You have logged ${countLabel(
      summary.sessions.length,
      "session",
    )} and ${countLabel(summary.totalSetCount, "set")}${repsClause}.`,
    summaryMeta: `${bestWeightClause}, last hit ${formatDate(lastHit)} (${daysAgoLabel(
      daysSinceLastHit,
    )}).`,
  };
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
        workoutType: true,
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

function summarizeExerciseSessions(exerciseLogs: ExerciseLogRow[], weightUnit: WeightUnit) {
  const sessionsByWorkout = new Map<
    string,
    {
      workoutId: string;
      workoutTitle: string;
      workoutType: string | null;
      performedAt: Date;
      setCount: number;
      totalReps: number;
      weightedSetCount: number;
      bestWeight: number;
      topSetReps: number;
      totalLoad: number;
    }
  >();

  const displayName = exerciseLogs[0]?.name ?? "";

  for (const exerciseLog of exerciseLogs) {
    const session = sessionsByWorkout.get(exerciseLog.workoutLog.id) ?? {
      workoutId: exerciseLog.workoutLog.id,
      workoutTitle: exerciseLog.workoutLog.title,
      workoutType: exerciseLog.workoutLog.workoutType,
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
  const totalSetCount = sessions.reduce((sum, session) => sum + session.setCount, 0);
  const totalReps = sessions.reduce((sum, session) => sum + session.totalReps, 0);
  const bestWeight = sessions.reduce((max, session) => Math.max(max, session.bestWeight), 0);
  const lastHit = sessions[0]?.performedAt;
  const averageRepsPerSet =
    totalSetCount > 0 ? Math.round(totalReps / totalSetCount) : 0;

  return {
    displayName,
    sessions,
    totalSetCount,
    averageRepsPerSet,
    bestWeight,
    lastHit,
  };
}

export async function loadExerciseDetailPageData(rawExerciseKey: string) {
  const user = await requireSessionUser();
  const normalizedKey = await resolveNormalizedExerciseKey(user.id, rawExerciseKey);

  if (!normalizedKey) {
    notFound();
  }

  const exerciseLogs = await fetchExerciseLogs(user.id, normalizedKey);

  if (exerciseLogs.length === 0) {
    notFound();
  }

  const weightUnit = user.preferredWeightUnit;
  const unitLabel = getWeightUnitLabel(weightUnit);
  const summary = summarizeExerciseSessions(exerciseLogs, weightUnit);

  if (!summary.lastHit) {
    notFound();
  }

  const daysSinceLastHit = daysBetweenDatabaseDates(getCurrentPacificDate(), summary.lastHit);
  const chartSeries = [...summary.sessions]
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

  return {
    user,
    displayName: summary.displayName,
    weightUnit,
    ...buildSummaryLines(summary, summary.lastHit, daysSinceLastHit, weightUnit),
    chartSeries,
    sessionBreakdownRows: summary.sessions.map((session) => {
      const workoutTitle = session.workoutTitle.trim() || "Workout";
      const workoutType = session.workoutType?.trim() ?? "";
      // The type is only worth printing when it is not already the title;
      // otherwise every row read "Pull · Pull".
      const workoutLabel =
        workoutType && workoutType !== workoutTitle
          ? `${workoutTitle} · ${workoutType}`
          : workoutTitle;
      const topSetWeight =
        session.bestWeight > 0
          ? formatWeightWithUnit(session.bestWeight, weightUnit, {
              maximumFractionDigits: 0,
            })
          : "BW";
      const volumeClause =
        session.totalLoad > 0
          ? ` · ${formatWeightValue(session.totalLoad, {
              maximumFractionDigits: 0,
            })} ${unitLabel}`
          : "";

      return {
        workoutId: session.workoutId,
        performedAtLabel: formatDate(session.performedAt),
        workoutLabel,
        topSetLabel: `${topSetWeight} × ${session.topSetReps || session.totalReps}`,
        volumeLabel: `${countLabel(session.setCount, "set")} · ${countLabel(
          session.totalReps,
          "rep",
        )}${volumeClause}`,
      };
    }),
  };
}
