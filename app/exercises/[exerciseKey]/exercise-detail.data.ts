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
    displayName: summary.displayName,
    subtitle: `Last hit ${formatDate(summary.lastHit)} (${daysAgoLabel(daysSinceLastHit)})`,
    weightUnit,
    sessionsCount: summary.sessions.length,
    totalSetCount: summary.totalSetCount,
    averageRepsPerSet: summary.averageRepsPerSet,
    bestWeight: summary.bestWeight,
    bestWeightLabel: formatWeightWithUnit(summary.bestWeight, weightUnit, {
      maximumFractionDigits: 0,
    }),
    chartSeries,
    sessionBreakdownRows: summary.sessions.map((session) => ({
      workoutId: session.workoutId,
      workoutTitle: session.workoutTitle,
      workoutType: session.workoutType,
      performedAtLabel: formatDate(session.performedAt),
      setCount: session.setCount,
      totalReps: session.totalReps,
      bestWeightLabel: formatWeightWithUnit(session.bestWeight, weightUnit, {
        maximumFractionDigits: 0,
      }),
      totalLoadLabel: `${formatWeightValue(session.totalLoad, {
        maximumFractionDigits: 0,
      })} ${unitLabel}`,
    })),
  };
}
