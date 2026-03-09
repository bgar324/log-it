import {
  normalizeExerciseDisplayName,
  normalizeExerciseSlug,
  normalizeWorkoutTypeName,
  normalizeWorkoutTypeSlug,
} from "../workout-utils";
import {
  DEFAULT_WORKOUT_SPLIT_NAME,
  REST_DAY_WORKOUT_TYPE,
  SPLIT_WEEKDAYS,
  isSplitWeekday,
  sortSplitDays,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
  type WorkoutSplitExerciseTemplate,
  type WorkoutSplitTemplate,
} from "./shared";

type RawSplitExercisePayload = {
  id?: unknown;
  exerciseDisplayName?: unknown;
  exerciseName?: unknown;
  sets?: unknown;
};

type RawSplitDayPayload = {
  id?: unknown;
  weekday?: unknown;
  workoutType?: unknown;
  exercises?: unknown;
};

export type RawWorkoutSplitPayload = {
  name?: unknown;
  days?: unknown;
};

export type ParsedWorkoutSplitExercise = WorkoutSplitExerciseTemplate;
export type ParsedWorkoutSplitDay = WorkoutSplitDayTemplate;
export type ParsedWorkoutSplit = WorkoutSplitTemplate;

function toOptionalString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function parsePositiveInt(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);

    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function normalizeSplitExercise(
  rawExercise: RawSplitExercisePayload,
  order: number,
):
  | { value: ParsedWorkoutSplitExercise }
  | { error: string }
  | null {
  const exerciseDisplayName = normalizeExerciseDisplayName(
    toOptionalString(rawExercise.exerciseDisplayName) ??
      toOptionalString(rawExercise.exerciseName) ??
      "",
  );

  if (!exerciseDisplayName) {
    return null;
  }

  const sets = parsePositiveInt(rawExercise.sets);

  if (!sets) {
    return {
      error: `Exercise "${exerciseDisplayName}" needs a sets value greater than 0.` as const,
    };
  }

  const id = toOptionalString(rawExercise.id)?.trim() ?? null;

  return {
    value: {
      id,
      order,
      exerciseDisplayName,
      exerciseSlug: normalizeExerciseSlug(exerciseDisplayName),
      sets,
    } satisfies ParsedWorkoutSplitExercise,
  };
}

function createDefaultSplitDay(weekday: SplitWeekdayValue): ParsedWorkoutSplitDay {
  return {
    id: null,
    weekday,
    workoutType: REST_DAY_WORKOUT_TYPE,
    workoutTypeSlug: normalizeWorkoutTypeSlug(REST_DAY_WORKOUT_TYPE),
    exercises: [],
  };
}

export function normalizeWorkoutSplitPayload(
  raw: RawWorkoutSplitPayload,
): { value: ParsedWorkoutSplit } | { error: string } {
  const splitName =
    toOptionalString(raw.name)?.trim() || DEFAULT_WORKOUT_SPLIT_NAME;
  const rawDays = Array.isArray(raw.days) ? (raw.days as RawSplitDayPayload[]) : [];

  const seenWeekdays = new Set<SplitWeekdayValue>();
  const daysByWeekday = new Map<SplitWeekdayValue, ParsedWorkoutSplitDay>();

  for (const rawDay of rawDays) {
    if (!rawDay || typeof rawDay !== "object") {
      return { error: "Each split day must be an object." as const };
    }

    if (!isSplitWeekday(rawDay.weekday)) {
      return { error: "Each split day must include a valid weekday." as const };
    }

    if (seenWeekdays.has(rawDay.weekday)) {
      return {
        error: `Duplicate weekday "${rawDay.weekday}" detected in split.` as const,
      };
    }

    seenWeekdays.add(rawDay.weekday);

    if (!Array.isArray(rawDay.exercises)) {
      return {
        error: `Split day "${rawDay.weekday}" is missing its exercises list.` as const,
      };
    }

    const workoutType =
      normalizeWorkoutTypeName(toOptionalString(rawDay.workoutType) ?? "") ||
      REST_DAY_WORKOUT_TYPE;
    const exercises: ParsedWorkoutSplitExercise[] = [];

    for (const [exerciseIndex, rawExercise] of rawDay.exercises.entries()) {
      if (!rawExercise || typeof rawExercise !== "object") {
        return {
          error: `Split day "${workoutType}" has an invalid exercise row.` as const,
        };
      }

      const normalizedExercise = normalizeSplitExercise(
        rawExercise as RawSplitExercisePayload,
        exerciseIndex + 1,
      );

      if (!normalizedExercise) {
        continue;
      }

      if ("error" in normalizedExercise) {
        return normalizedExercise;
      }

      exercises.push(normalizedExercise.value);
    }

    daysByWeekday.set(rawDay.weekday, {
      id: toOptionalString(rawDay.id)?.trim() ?? null,
      weekday: rawDay.weekday,
      workoutType,
      workoutTypeSlug: normalizeWorkoutTypeSlug(workoutType),
      exercises,
    });
  }

  const days = sortSplitDays(
    SPLIT_WEEKDAYS.map(
      (weekday) => daysByWeekday.get(weekday) ?? createDefaultSplitDay(weekday),
    ),
  );

  return {
    value: {
      id: null,
      name: splitName,
      days,
    } satisfies ParsedWorkoutSplit,
  };
}
