import { Prisma } from "@prisma/client";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildExerciseSummaryRecords,
  buildWorkoutCalendarDayCounts,
} from "@/lib/workout-read-models";
import { isPrismaSchemaMismatchError } from "@/lib/schema-compat";
import { toWeightNumber } from "@/lib/weight-unit";
import { formatDatabaseDateValue } from "@/lib/workout-utils";

export async function loadRecentLogs(userId: string, take: number) {
  try {
    return await prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        workoutType: string | null;
        totalWeightLb: Prisma.Decimal | number | null;
        performedAt: Date;
        exerciseCount: number;
        setCount: number;
      }>
    >`
      SELECT
        wl.id,
        wl.title,
        wl."workoutType",
        wl."totalWeightLb",
        wl."performedAt",
        COUNT(DISTINCT we.id)::int AS "exerciseCount",
        COUNT(ws.id)::int AS "setCount"
      FROM "WorkoutLog" wl
      LEFT JOIN "WorkoutExercise" we ON we."workoutLogId" = wl.id
      LEFT JOIN "WorkoutSet" ws ON ws."workoutExerciseId" = we.id
      WHERE wl."userId" = ${userId}
      GROUP BY wl.id, wl.title, wl."workoutType", wl."totalWeightLb", wl."performedAt"
      ORDER BY wl."performedAt" DESC
      LIMIT ${take}
    `;
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }

    const logs = await prisma.workoutLog.findMany({
      where: { userId },
      orderBy: { performedAt: "desc" },
      take,
      select: {
        id: true,
        title: true,
        totalWeightLb: true,
        performedAt: true,
        exercises: {
          select: {
            _count: {
              select: {
                sets: true,
              },
            },
          },
        },
      },
    });

    return logs.map((log) => ({
      workoutType: null,
      id: log.id,
      title: log.title,
      totalWeightLb: log.totalWeightLb,
      performedAt: log.performedAt,
      exerciseCount: log.exercises.length,
      setCount: log.exercises.reduce((sum, exercise) => sum + exercise._count.sets, 0),
    }));
  }
}

export async function loadExerciseSummaryRows(userId: string) {
  try {
    const rows = await prisma.exerciseSummary.findMany({
      where: {
        userId,
      },
      select: {
        normalizedName: true,
        name: true,
        sessionCount: true,
        setCount: true,
        totalReps: true,
        bestWeightLb: true,
        lastPerformedAt: true,
      },
    });

    if (rows.length > 0) {
      return rows.map((row) => ({
        normalizedName: row.normalizedName,
        name: row.name,
        sessionCount: row.sessionCount,
        setCount: row.setCount,
        totalReps: row.totalReps,
        bestWeightLb: toWeightNumber(row.bestWeightLb) ?? 0,
        lastPerformedAt: row.lastPerformedAt,
      }));
    }
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }
  }

  const exerciseLogs = await prisma.workoutExercise.findMany({
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
    select: {
      normalizedName: true,
      name: true,
      createdAt: true,
      workoutLog: {
        select: {
          id: true,
          performedAt: true,
        },
      },
      sets: {
        select: {
          reps: true,
          weightLb: true,
        },
      },
    },
  });

  return buildExerciseSummaryRecords(exerciseLogs);
}

export async function loadWorkoutCalendarSummary(userId: string) {
  try {
    const rows = await prisma.workoutCalendarDay.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: "asc",
      },
      select: {
        date: true,
        workoutCount: true,
      },
    });

    if (rows.length > 0) {
      return rows.map((row) => ({
        dateKey: formatDatabaseDateValue(row.date),
        count: row.workoutCount,
      }));
    }
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }
  }

  const logs = await prisma.workoutLog.findMany({
    where: {
      userId,
    },
    select: {
      performedAt: true,
    },
  });

  return buildWorkoutCalendarDayCounts(logs).map((row) => ({
    dateKey: row.dateKey,
    count: row.workoutCount,
  }));
}

export async function loadWorkoutCalendarWorkouts(userId: string) {
  try {
    const rows = await prisma.workoutLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        performedAt: "asc",
      },
      select: {
        id: true,
        title: true,
        workoutType: true,
        performedAt: true,
      },
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      workoutType: row.workoutType,
      dateKey: formatDatabaseDateValue(row.performedAt),
    }));
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }

    const rows = await prisma.workoutLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        performedAt: "asc",
      },
      select: {
        id: true,
        title: true,
        performedAt: true,
      },
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      workoutType: null,
      dateKey: formatDatabaseDateValue(row.performedAt),
    }));
  }
}

export function mapWorkoutSummaries(
  logs: Awaited<ReturnType<typeof loadRecentLogs>>,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
  formatters: {
    monthLabel: (date: Date) => string;
    monthDateLabel: (date: Date) => string;
    timelineDateLabel: (date: Date) => string;
    convertStoredWeightToDisplay: (
      value: { toNumber: () => number } | number | null,
      unit: typeof weightUnit,
    ) => number | null;
  },
) {
  return logs.map((log) => {
    const volume = formatters.convertStoredWeightToDisplay(log.totalWeightLb, weightUnit) ?? 0;

    return {
      id: log.id,
      title: log.title,
      workoutType: log.workoutType,
      month: formatters.monthLabel(log.performedAt),
      performedAtDate: formatDatabaseDateValue(log.performedAt),
      performedAtLabel: formatters.monthDateLabel(log.performedAt),
      timelineLabel: formatters.timelineDateLabel(log.performedAt),
      exerciseCount: log.exerciseCount,
      setCount: log.setCount,
      volume,
    };
  });
}
