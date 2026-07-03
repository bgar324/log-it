import { prisma } from "./prisma";
import { isPrismaSchemaMismatchError } from "./schema-compat";
import { formatDatabaseDateValue, toDatabaseDateFromInput } from "./workout-utils";
import {
  buildExerciseSummaryRecords,
  toExerciseKey,
  toOrderedUniqueValues,
  type WorkoutReadModelSyncInput,
} from "./workout-read-models.shared";

async function syncWorkoutCalendarDays(userId: string, dateKeys: string[]) {
  if (dateKeys.length === 0) {
    return;
  }

  const dates = dateKeys.map((dateKey) => toDatabaseDateFromInput(dateKey));
  const counts = await prisma.workoutLog.groupBy({
    by: ["performedAt"],
    where: {
      userId,
      performedAt: {
        in: dates,
      },
    },
    _count: {
      _all: true,
    },
  });

  const countByDateKey = new Map(
    counts.map((row) => [formatDatabaseDateValue(row.performedAt), row._count._all]),
  );
  const emptyDates = dateKeys.filter((dateKey) => !countByDateKey.has(dateKey));

  await prisma.$transaction([
    ...(emptyDates.length > 0
      ? [
          prisma.workoutCalendarDay.deleteMany({
            where: {
              userId,
              date: {
                in: emptyDates.map((dateKey) => toDatabaseDateFromInput(dateKey)),
              },
            },
          }),
        ]
      : []),
    ...dateKeys
      .filter((dateKey) => countByDateKey.has(dateKey))
      .map((dateKey) =>
        prisma.workoutCalendarDay.upsert({
          where: {
            userId_date: {
              userId,
              date: toDatabaseDateFromInput(dateKey),
            },
          },
          update: {
            workoutCount: countByDateKey.get(dateKey) ?? 0,
          },
          create: {
            userId,
            date: toDatabaseDateFromInput(dateKey),
            workoutCount: countByDateKey.get(dateKey) ?? 0,
          },
        }),
      ),
  ]);
}

async function syncExerciseSummaries(userId: string, normalizedNames: string[]) {
  if (normalizedNames.length === 0) {
    return;
  }

  const requestedNames = new Set(normalizedNames);
  const rows = await prisma.workoutExercise.findMany({
    where: {
      workoutLog: {
        userId,
      },
      OR: [
        {
          normalizedName: {
            in: normalizedNames,
          },
        },
        {
          normalizedName: "",
        },
      ],
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
  });

  const filteredRows = rows.filter((row) => requestedNames.has(toExerciseKey(row)));
  const summaries = buildExerciseSummaryRecords(filteredRows);
  const foundNames = new Set(summaries.map((summary) => summary.normalizedName));
  const missingNames = normalizedNames.filter((name) => !foundNames.has(name));

  await prisma.$transaction([
    ...(missingNames.length > 0
      ? [
          prisma.exerciseSummary.deleteMany({
            where: {
              userId,
              normalizedName: {
                in: missingNames,
              },
            },
          }),
          prisma.exercise.deleteMany({
            where: {
              userId,
              normalizedName: {
                in: missingNames,
              },
            },
          }),
        ]
      : []),
    ...summaries.flatMap((summary) => [
      prisma.exerciseSummary.upsert({
        where: {
          userId_normalizedName: {
            userId,
            normalizedName: summary.normalizedName,
          },
        },
        update: {
          name: summary.name,
          sessionCount: summary.sessionCount,
          setCount: summary.setCount,
          totalReps: summary.totalReps,
          bestWeightLb: summary.bestWeightLb,
          bestE1rmLb: summary.bestE1rmLb,
          lastPerformedAt: summary.lastPerformedAt,
        },
        create: {
          userId,
          normalizedName: summary.normalizedName,
          name: summary.name,
          sessionCount: summary.sessionCount,
          setCount: summary.setCount,
          totalReps: summary.totalReps,
          bestWeightLb: summary.bestWeightLb,
          bestE1rmLb: summary.bestE1rmLb,
          lastPerformedAt: summary.lastPerformedAt,
        },
      }),
      prisma.exercise.upsert({
        where: {
          userId_normalizedName: {
            userId,
            normalizedName: summary.normalizedName,
          },
        },
        update: {
          name: summary.name,
          lastPerformedAt: summary.lastPerformedAt,
        },
        create: {
          userId,
          normalizedName: summary.normalizedName,
          name: summary.name,
          lastPerformedAt: summary.lastPerformedAt,
        },
      }),
    ]),
  ]);
}

export async function syncWorkoutReadModels(input: WorkoutReadModelSyncInput) {
  const normalizedExerciseNames = toOrderedUniqueValues(input.normalizedExerciseNames);
  const performedAtDates = toOrderedUniqueValues(input.performedAtDates);

  if (normalizedExerciseNames.length === 0 && performedAtDates.length === 0) {
    return;
  }

  try {
    await Promise.all([
      syncExerciseSummaries(input.userId, normalizedExerciseNames),
      syncWorkoutCalendarDays(input.userId, performedAtDates),
    ]);
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return;
    }

    throw error;
  }
}
