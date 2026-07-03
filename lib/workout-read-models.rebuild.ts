import { prisma } from "./prisma";
import { isPrismaSchemaMismatchError } from "./schema-compat";
import { toDatabaseDateFromInput } from "./workout-utils";
import {
  buildExerciseSummaryRecords,
  buildWorkoutCalendarDayCounts,
  type ExerciseSummaryRecord,
} from "./workout-read-models.shared";

async function replaceWorkoutReadModels(
  userId: string,
  exerciseSummaries: ExerciseSummaryRecord[],
  calendarDayCounts: Array<{ dateKey: string; workoutCount: number }>,
) {
  const calendarRows = calendarDayCounts.map((row) => ({
    userId,
    date: toDatabaseDateFromInput(row.dateKey),
    workoutCount: row.workoutCount,
  }));

  const exerciseRows = exerciseSummaries.map((summary) => ({
    userId,
    normalizedName: summary.normalizedName,
    name: summary.name,
    sessionCount: summary.sessionCount,
    setCount: summary.setCount,
    totalReps: summary.totalReps,
    bestWeightLb: summary.bestWeightLb,
    bestE1rmLb: summary.bestE1rmLb,
    lastPerformedAt: summary.lastPerformedAt,
  }));

  const exerciseCatalogRows = exerciseSummaries.map((summary) => ({
    userId,
    normalizedName: summary.normalizedName,
    name: summary.name,
    lastPerformedAt: summary.lastPerformedAt,
  }));

  await prisma.$transaction([
    prisma.workoutCalendarDay.deleteMany({
      where: { userId },
    }),
    prisma.exerciseSummary.deleteMany({
      where: { userId },
    }),
    prisma.exercise.deleteMany({
      where: { userId },
    }),
    ...(calendarRows.length > 0
      ? [
          prisma.workoutCalendarDay.createMany({
            data: calendarRows,
          }),
        ]
      : []),
    ...(exerciseRows.length > 0
      ? [
          prisma.exerciseSummary.createMany({
            data: exerciseRows,
          }),
          prisma.exercise.createMany({
            data: exerciseCatalogRows,
          }),
        ]
      : []),
  ]);
}

export async function rebuildWorkoutReadModelsForUser(userId: string) {
  try {
    const [exerciseRows, calendarRows] = await Promise.all([
      prisma.workoutExercise.findMany({
        where: {
          workoutLog: {
            userId,
          },
        },
        orderBy: [
          {
            workoutLog: {
              performedAt: "desc",
            },
          },
          {
            createdAt: "desc",
          },
        ],
        select: {
          normalizedName: true,
          name: true,
          createdAt: true,
          workoutLog: {
            select: {
              id: true,
              performedAt: true,
              bodyWeightLb: true,
            },
          },
          sets: {
            select: {
              reps: true,
              weightLb: true,
            },
          },
        },
      }),
      prisma.workoutLog.findMany({
        where: {
          userId,
        },
        select: {
          performedAt: true,
        },
      }),
    ]);

    await replaceWorkoutReadModels(
      userId,
      buildExerciseSummaryRecords(exerciseRows),
      buildWorkoutCalendarDayCounts(calendarRows),
    );
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return;
    }

    throw error;
  }
}

export async function ensureWorkoutReadModels(userId: string) {
  try {
    const [workoutCount, exerciseSummaryCount, calendarDayCount] = await Promise.all([
      prisma.workoutLog.count({
        where: {
          userId,
        },
      }),
      prisma.exerciseSummary.count({
        where: {
          userId,
        },
      }),
      prisma.workoutCalendarDay.count({
        where: {
          userId,
        },
      }),
    ]);

    if (workoutCount === 0) {
      return;
    }

    if (exerciseSummaryCount > 0 && calendarDayCount > 0) {
      return;
    }

    await rebuildWorkoutReadModelsForUser(userId);
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return;
    }

    throw error;
  }
}
