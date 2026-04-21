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

export function toExerciseKey(
  row: Pick<ExerciseHistoryRow, "normalizedName" | "name">,
) {
  return row.normalizedName.trim() || normalizeExerciseName(row.name);
}

export function toOrderedUniqueValues(values: Iterable<string>) {
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
  const summaries = new Map<string, ExerciseSummaryRecord & { workoutIds: Set<string> }>();

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

    if (summary.lastPerformedAt === null || row.workoutLog.performedAt > summary.lastPerformedAt) {
      summary.lastPerformedAt = row.workoutLog.performedAt;
      summary.name = row.name;
    }

    summary.workoutIds.add(row.workoutLog.id);

    for (const set of row.sets) {
      summary.setCount += 1;
      summary.totalReps += set.reps;
      summary.bestWeightLb = Math.max(summary.bestWeightLb, toWeightNumber(set.weightLb) ?? 0);
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
