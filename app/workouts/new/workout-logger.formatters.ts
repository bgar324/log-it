import {
  formatDatabaseDateLabel,
  toDatabaseDateFromInput,
} from "@/lib/workout-utils";
import {
  convertStoredWeightToDisplay,
  formatWeightWithUnit,
  poundsToDisplayWeight,
  roundDisplayWeightToIncrement,
  type WeightUnit,
} from "@/lib/weight-unit";
import type {
  ExerciseDraft,
  ExercisePrediction,
  PredictedSet,
} from "./workout-logger.types";

function toOptionalPositiveNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function summarizeDraftSets(
  exercise: ExerciseDraft,
  bodyWeightDisplay: number | null = null,
) {
  let setCount = 0;
  let totalReps = 0;
  let totalVolume = 0;
  let bestWeight: number | null = null;

  for (const setItem of exercise.sets) {
    const reps = Number.parseInt(setItem.reps.trim(), 10);
    const durationSeconds = Number.parseInt(setItem.durationSeconds.trim(), 10);

    if (
      (!Number.isInteger(reps) || reps <= 0) &&
      (!Number.isInteger(durationSeconds) || durationSeconds <= 0)
    ) {
      continue;
    }

    setCount += 1;
    const countableReps = Number.isInteger(reps) && reps > 0 ? reps : 0;
    totalReps += countableReps;

    // A bodyweight set carries no typed weight; credit the tracked body weight
    // so the live preview matches the volume that gets saved.
    const effectiveWeight =
      setItem.usesBodyweight && bodyWeightDisplay !== null
        ? bodyWeightDisplay
        : toOptionalPositiveNumber(setItem.weightLb);

    if (effectiveWeight === null) {
      continue;
    }

    totalVolume += effectiveWeight * countableReps;
    bestWeight =
      bestWeight === null ? effectiveWeight : Math.max(bestWeight, effectiveWeight);
  }

  return {
    setCount,
    totalReps,
    totalVolume: Math.round(totalVolume),
    bestWeight,
  };
}

export function formatWorkoutLoggerDateLabel(value: string) {
  if (!value.trim()) {
    return "";
  }

  return formatDatabaseDateLabel(toDatabaseDateFromInput(value), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatExerciseInsightDate(value: string) {
  return formatWorkoutLoggerDateLabel(value);
}

export function formatDelta(value: number, suffix: string) {
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded} ${suffix}`;
}

export function formatLoggedSetSnapshot(
  set: { reps: number; weightLb: number | null; durationSeconds?: number | null },
  weightUnit: WeightUnit,
) {
  const durationLabel = set.durationSeconds ? ` · ${set.durationSeconds}s` : "";

  if (set.weightLb === null) {
    return `Bodyweight x ${set.reps}${durationLabel}`;
  }

  const displayWeight =
    convertStoredWeightToDisplay(set.weightLb, weightUnit) ?? 0;
  return `${formatWeightWithUnit(displayWeight, weightUnit)} x ${set.reps}${durationLabel}`;
}

function formatPredictedWeight(weightLb: number, weightUnit: WeightUnit) {
  const displayWeight = roundDisplayWeightToIncrement(
    poundsToDisplayWeight(weightLb, weightUnit),
    weightUnit,
  );

  return formatWeightWithUnit(displayWeight, weightUnit);
}

export function formatPredictedSetSnapshot(
  set: PredictedSet,
  weightUnit: WeightUnit,
) {
  const repText = set.reps === null ? "--" : `${set.reps}`;

  if (set.weightLb === null) {
    return `Bodyweight x ${repText}`;
  }

  return `${formatPredictedWeight(set.weightLb, weightUnit)} x ${repText}`;
}

export function formatRepRange(
  repRange: { min: number; max: number } | null,
) {
  if (!repRange) {
    return "--";
  }

  if (repRange.min === repRange.max) {
    return `${repRange.min}`;
  }

  return `${repRange.min}-${repRange.max} reps`;
}

export function formatConfidenceLabel(
  confidence: ExercisePrediction["confidence"],
) {
  return confidence.charAt(0).toUpperCase() + confidence.slice(1);
}
