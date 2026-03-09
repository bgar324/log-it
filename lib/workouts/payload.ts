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
  toDatabaseDateTimeFromLocalInput,
} from "../workout-utils";

type RawWorkoutSet = {
  reps?: unknown;
  weight?: unknown;
  weightLb?: unknown;
};

type RawWorkoutExercise = {
  name?: unknown;
  sets?: unknown;
};

export type RawWorkoutPayload = {
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
  performedAt: string;
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
  const performedAt = toDatabaseDateTimeFromLocalInput(String(raw.performedAt ?? ""));
  const weightUnit = normalizeWeightUnit(raw.weightUnit);

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
      const reps = parsePositiveInt(rawSet?.reps);

      if (!reps) {
        continue;
      }

      const rawWeight = parseOptionalDecimalString(
        rawSet?.weight ?? rawSet?.weightLb,
      );

      sets.push({
        reps,
        weightLb: rawWeight === null ? null : toWeightLbString(rawWeight, weightUnit),
      });
    }

    if (sets.length === 0) {
      return {
        error:
          `Exercise "${name}" needs at least one valid set with reps.` as const,
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

export function computeWorkoutTotalWeightLb(payload: ParsedWorkout) {
  let total = new Prisma.Decimal(0);

  for (const exercise of payload.exercises) {
    for (const setInput of exercise.sets) {
      if (!setInput.weightLb) {
        continue;
      }

      total = total.plus(new Prisma.Decimal(setInput.weightLb).mul(setInput.reps));
    }
  }

  return total;
}
