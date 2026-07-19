import { Prisma } from "@prisma/client";
import {
  displayWeightToPounds,
  normalizeWeightUnit,
  type WeightUnit,
} from "../weight-unit";
import {
  normalizeExerciseName,
  normalizeWorkoutTypeName,
  normalizeWorkoutTypeSlug,
  formatDatabaseDateValue,
  getCurrentPacificDate,
  toDatabaseDateFromInput,
} from "../workout-utils";

type RawWorkoutSet = {
  reps?: unknown;
  weight?: unknown;
  weightLb?: unknown;
  duration?: unknown;
  durationSeconds?: unknown;
};

type RawWorkoutExercise = {
  name?: unknown;
  sets?: unknown;
};

export type RawWorkoutPayload = {
  allowRestDayOverride?: unknown;
  workoutId?: unknown;
  title?: unknown;
  workoutType?: unknown;
  performedAt?: unknown;
  weightUnit?: unknown;
  exercises?: unknown;
};

export type ParsedSet = {
  reps: number;
  weightLb: string | null;
  durationSeconds: number | null;
};

export type ParsedExercise = {
  name: string;
  normalizedName: string;
  sets: ParsedSet[];
};

export type ParsedWorkout = {
  title: string;
  workoutType: string | null;
  workoutTypeSlug: string | null;
  performedAt: Date;
  weightUnit: WeightUnit;
  exercises: ParsedExercise[];
};

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function toOptionalTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parsePositiveInt(value: unknown): number | null {
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

function parseNonNegativeInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);

    if (Number.isInteger(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return null;
}

function parseOptionalDecimalString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  if (!/^\d+(\.\d*)?$/.test(raw) && !/^\.\d+$/.test(raw)) {
    return null;
  }

  const normalized = raw.startsWith(".") ? `0${raw}` : raw;
  const asNumber = Number(normalized);

  if (!Number.isFinite(asNumber) || asNumber < 0) {
    return null;
  }

  return normalized;
}

function toWeightLbString(value: string, unit: WeightUnit) {
  const converted = displayWeightToPounds(Number(value), unit);
  return converted.toFixed(4).replace(/\.?0+$/, "");
}

export function normalizeWorkoutPayload(raw: RawWorkoutPayload) {
  const title = toOptionalTrimmedString(raw.title) ?? "Untitled workout";
  const workoutTypeValue = toOptionalTrimmedString(raw.workoutType);
  const workoutType = workoutTypeValue
    ? normalizeWorkoutTypeName(workoutTypeValue)
    : null;
  const performedAtInput = String(raw.performedAt ?? "").trim();
  const performedAt = toDatabaseDateFromInput(performedAtInput);
  const weightUnit = normalizeWeightUnit(raw.weightUnit);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(performedAtInput) ||
    formatDatabaseDateValue(performedAt) !== performedAtInput
  ) {
    return { error: "Choose a valid workout date." as const };
  }

  if (performedAt.getTime() > getCurrentPacificDate().getTime()) {
    return { error: "Workouts cannot be logged in the future." as const };
  }

  if (!Array.isArray(raw.exercises)) {
    return { error: "Add at least one exercise." as const };
  }

  const exercises: ParsedExercise[] = [];

  for (const item of raw.exercises as RawWorkoutExercise[]) {
    const name = toOptionalTrimmedString(item?.name);

    if (!name) {
      continue;
    }

    if (!Array.isArray(item.sets)) {
      return { error: `Exercise "${name}" is missing sets.` as const };
    }

    const sets: ParsedSet[] = [];

    for (const rawSet of item.sets as RawWorkoutSet[]) {
      const reps = parseNonNegativeInt(rawSet?.reps) ?? 0;
      const durationSeconds = parsePositiveInt(
        rawSet?.durationSeconds ?? rawSet?.duration,
      );

      if (reps <= 0 && !durationSeconds) {
        continue;
      }

      const rawWeight = parseOptionalDecimalString(
        rawSet?.weight ?? rawSet?.weightLb,
      );

      sets.push({
        reps,
        weightLb: rawWeight === null ? null : toWeightLbString(rawWeight, weightUnit),
        durationSeconds,
      });
    }

    if (sets.length === 0) {
      return {
        error:
          `Exercise "${name}" needs at least one valid set with reps or time.` as const,
      };
    }

    exercises.push({
      name,
      normalizedName: normalizeExerciseName(name),
      sets,
    });
  }

  if (exercises.length === 0) {
    return { error: "Add at least one exercise with a name." as const };
  }

  return {
    value: {
      title,
      workoutType,
      workoutTypeSlug: workoutType ? normalizeWorkoutTypeSlug(workoutType) : null,
      performedAt,
      weightUnit,
      exercises,
    } satisfies ParsedWorkout,
  };
}

export function computeWorkoutTotalWeightLb(
  payload: ParsedWorkout,
  bodyWeightLb: Prisma.Decimal | string | number | null = null,
) {
  let total = new Prisma.Decimal(0);
  const bodyWeight =
    bodyWeightLb === null ? null : new Prisma.Decimal(bodyWeightLb);

  for (const exercise of payload.exercises) {
    for (const setInput of exercise.sets) {
      if (setInput.weightLb) {
        total = total.plus(
          new Prisma.Decimal(setInput.weightLb).mul(setInput.reps),
        );
        continue;
      }

      // Bodyweight set (no external load): credit the tracked body weight for
      // the workout date when available and the set has reps.
      if (bodyWeight && setInput.reps > 0) {
        total = total.plus(bodyWeight.mul(setInput.reps));
      }
    }
  }

  return total;
}
