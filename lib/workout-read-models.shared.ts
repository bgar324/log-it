import { toWeightNumber } from "./weight-unit";
import {
  formatDatabaseDateValue,
  normalizeExerciseName,
  toDatabaseDateFromInput,
} from "./workout-utils";

type DecimalLike = { toNumber: () => number } | number | null;

type ExerciseHistoryRow = {
  normalizedName: string;
  name: string;
  createdAt: Date;
  workoutLog: {
    id: string;
    performedAt: Date;
    bodyWeightLb?: DecimalLike;
  };
  sets: Array<{
    reps: number;
    weightLb: DecimalLike;
  }>;
};

// Epley estimated one-rep max. Bodyweight sets are credited with the workout's
// tracked body weight so bodyweight movements count toward strength records.
export function estimateSetE1rmLb(effectiveWeightLb: number, reps: number) {
  if (effectiveWeightLb <= 0 || reps <= 0) {
    return 0;
  }

  return effectiveWeightLb * (1 + reps / 30);
}

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
  bestE1rmLb: number;
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
        bestE1rmLb: 0,
        lastPerformedAt: row.workoutLog.performedAt,
        workoutIds: new Set<string>(),
      } satisfies ExerciseSummaryRecord & { workoutIds: Set<string> });

    if (summary.lastPerformedAt === null || row.workoutLog.performedAt > summary.lastPerformedAt) {
      summary.lastPerformedAt = row.workoutLog.performedAt;
      summary.name = row.name;
    }

    summary.workoutIds.add(row.workoutLog.id);

    const bodyWeightLb = toWeightNumber(row.workoutLog.bodyWeightLb ?? null) ?? 0;

    for (const set of row.sets) {
      summary.setCount += 1;
      summary.totalReps += set.reps;

      const externalWeight = toWeightNumber(set.weightLb) ?? 0;
      summary.bestWeightLb = Math.max(summary.bestWeightLb, externalWeight);

      // Bodyweight sets carry no external load; credit the tracked body weight.
      const effectiveWeight = externalWeight > 0 ? externalWeight : bodyWeightLb;
      summary.bestE1rmLb = Math.max(
        summary.bestE1rmLb,
        estimateSetE1rmLb(effectiveWeight, set.reps),
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
    bestE1rmLb: summary.bestE1rmLb,
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
