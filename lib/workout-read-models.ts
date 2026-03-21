import { prisma } from "./prisma";
import { isPrismaSchemaMismatchError } from "./schema-compat";
import { toWeightNumber } from "./weight-unit";
import {
  formatDatabaseDateValue,
  normalizeExerciseName,
  toDatabaseDateFromInput,
} from "./workout-utils";

type ExerciseHistoryRow = {
  normalizedName: string;
  name: string;
  createdAt: Date;
  workoutLog: {
    id: string;
    performedAt: Date;
  };
  sets: Array<{
    reps: number;
    weightLb: { toNumber: () => number } | number | null;
  }>;
};

type WorkoutCalendarLogRow = {
  performedAt: Date;
};

export type WorkoutReadModelSyncInput = {
  userId: string;
  normalizedExerciseNames: string[];
  performedAtDates: string[];
};

export type ExerciseSummaryRecord = {
  normalizedName: string;
  name: string;
  sessionCount: number;
  setCount: number;
  totalReps: number;
  bestWeightLb: number;
  lastPerformedAt: Date | null;
};

function normalizeDateKey(value: string | Date) {
  if (value instanceof Date) {
    return formatDatabaseDateValue(value);
  }

  return formatDatabaseDateValue(toDatabaseDateFromInput(value));
}

function toExerciseKey(row: Pick<ExerciseHistoryRow, "normalizedName" | "name">) {
  return row.normalizedName.trim() || normalizeExerciseName(row.name);
}

function toOrderedUniqueValues(values: Iterable<string>) {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const value of values) {
    const normalized = value.trim();

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    ordered.push(normalized);
  }

  return ordered;
}

export function createWorkoutReadModelSyncInput(
  userId: string,
  normalizedExerciseNames: Iterable<string>,
  performedAtDates: Iterable<string | Date>,
): WorkoutReadModelSyncInput {
  return {
    userId,
    normalizedExerciseNames: toOrderedUniqueValues(normalizedExerciseNames),
    performedAtDates: toOrderedUniqueValues(
      Array.from(performedAtDates, (value) => normalizeDateKey(value)),
    ),
  };
}

export function buildExerciseSummaryRecords(rows: ExerciseHistoryRow[]) {
  const summaries = new Map<
    string,
    ExerciseSummaryRecord & { workoutIds: Set<string> }
  >();

  for (const row of rows) {
    const normalizedName = toExerciseKey(row);

    if (!normalizedName) {
      continue;
    }

    const existing = summaries.get(normalizedName);
    const summary =
      existing ??
      ({
        normalizedName,
        name: row.name,
        sessionCount: 0,
        setCount: 0,
        totalReps: 0,
        bestWeightLb: 0,
        lastPerformedAt: row.workoutLog.performedAt,
        workoutIds: new Set<string>(),
      } satisfies ExerciseSummaryRecord & { workoutIds: Set<string> });

    if (
      summary.lastPerformedAt === null ||
      row.workoutLog.performedAt > summary.lastPerformedAt
    ) {
      summary.lastPerformedAt = row.workoutLog.performedAt;
      summary.name = row.name;
    }

    summary.workoutIds.add(row.workoutLog.id);

    for (const set of row.sets) {
      summary.setCount += 1;
      summary.totalReps += set.reps;
      summary.bestWeightLb = Math.max(
        summary.bestWeightLb,
        toWeightNumber(set.weightLb) ?? 0,
      );
    }

    summaries.set(normalizedName, summary);
  }

  return Array.from(summaries.values()).map((summary) => ({
    normalizedName: summary.normalizedName,
    name: summary.name,
    sessionCount: summary.workoutIds.size,
    setCount: summary.setCount,
    totalReps: summary.totalReps,
    bestWeightLb: summary.bestWeightLb,
    lastPerformedAt: summary.lastPerformedAt,
  }));
}

export function buildWorkoutCalendarDayCounts(rows: WorkoutCalendarLogRow[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const dateKey = formatDatabaseDateValue(row.performedAt);
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dateKey, workoutCount]) => ({
      dateKey,
      workoutCount,
    }));
}

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
    const [workoutCount, exerciseSummaryCount, calendarDayCount] =
      await Promise.all([
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

export async function syncWorkoutReadModels(input: WorkoutReadModelSyncInput) {
  const normalizedExerciseNames = toOrderedUniqueValues(
    input.normalizedExerciseNames,
  );
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
    counts.map((row) => [
      formatDatabaseDateValue(row.performedAt),
      row._count._all,
    ]),
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
