import {
  formatDatabaseDateLabel,
  toDatabaseDateFromInput,
} from "@/lib/workout-utils";
import {
  convertStoredWeightToDisplay,
  formatWeightValue,
  formatWeightWithUnit,
  poundsToDisplayWeight,
  roundDisplayWeightToIncrement,
  type WeightUnit,
} from "@/lib/weight-unit";

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

// "Aug 12" reads like a sentence next to the exercise name; the year is noise
// for a comparison that is almost always inside the current training block.
export function formatCompareDayLabel(value: string) {
  if (!value.trim()) {
    return "";
  }

  return formatDatabaseDateLabel(toDatabaseDateFromInput(value), {
    month: "short",
    day: "numeric",
  });
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

// Placeholders sit inside the weight input, which already carries the unit in
// its label, so the prediction is rendered bare.
export function formatPredictedWeightPlaceholder(
  weightLb: number,
  weightUnit: WeightUnit,
) {
  return formatWeightValue(
    roundDisplayWeightToIncrement(
      poundsToDisplayWeight(weightLb, weightUnit),
      weightUnit,
    ),
  );
}
