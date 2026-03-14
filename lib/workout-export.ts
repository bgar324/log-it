import {
  convertStoredWeightToDisplay,
  formatWeightValue,
  type WeightUnit,
} from "./weight-unit";
import { formatDatabaseDateLabel } from "./workout-utils";
import {
  REST_DAY_WORKOUT_TYPE,
  sortSplitDays,
  type SplitWeekdayValue,
  type WorkoutSplitTemplate,
} from "./workout-splits/shared";

type StoredWeightValue = number | string | { toNumber: () => number } | null;

type WorkoutClipboardSet = {
  reps: number;
  weightLb: StoredWeightValue;
};

type WorkoutClipboardExercise = {
  name: string;
  sets: WorkoutClipboardSet[];
};

type WorkoutClipboardPayload = {
  performedAt: Date;
  workoutType: string | null;
  title: string;
  weightUnit: WeightUnit;
  exercises: WorkoutClipboardExercise[];
};

const FULL_WEEKDAY_LABELS: Record<SplitWeekdayValue, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

function normalizeLine(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function normalizeStoredWeightValue(weight: StoredWeightValue) {
  if (typeof weight === "number") {
    return Number.isFinite(weight) ? weight : null;
  }

  if (typeof weight === "string") {
    const parsed = Number(weight);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (weight && typeof weight.toNumber === "function") {
    const parsed = weight.toNumber();
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatWorkoutSetForClipboard(
  set: WorkoutClipboardSet,
  weightUnit: WeightUnit,
) {
  const reps = Math.max(0, Math.trunc(set.reps));
  const displayWeight = convertStoredWeightToDisplay(
    normalizeStoredWeightValue(set.weightLb),
    weightUnit,
  );

  if (displayWeight === null) {
    return `BWx${reps}`;
  }

  return `${formatWeightValue(displayWeight, {
    maximumFractionDigits: 1,
  })}x${reps}`;
}

export function formatWorkoutForClipboard(workout: WorkoutClipboardPayload) {
  const workoutLabel = normalizeLine(
    workout.workoutType,
    normalizeLine(workout.title, "Workout"),
  );
  const heading = `${formatDatabaseDateLabel(workout.performedAt, {
    month: "numeric",
    day: "numeric",
  })}: ${workoutLabel}`;
  const sections = workout.exercises.map((exercise) => {
    const exerciseName = normalizeLine(exercise.name, "Exercise");
    const setLines = exercise.sets.length
      ? exercise.sets.map((set) => formatWorkoutSetForClipboard(set, workout.weightUnit))
      : ["No sets"];

    return `${exerciseName}:\n${setLines.join("\n")}`;
  });

  return [heading, ...sections].join("\n\n");
}

export function formatWorkoutSplitForClipboard(split: WorkoutSplitTemplate) {
  return sortSplitDays(split.days)
    .map((day) => {
      const workoutType = normalizeLine(day.workoutType, REST_DAY_WORKOUT_TYPE);
      const exerciseLines = day.exercises
        .map((exercise) => {
          const exerciseName = exercise.exerciseDisplayName.trim();

          if (!exerciseName) {
            return null;
          }

          return `${exerciseName} - ${exercise.sets} ${exercise.sets === 1 ? "set" : "sets"}`;
        })
        .filter((value): value is string => value !== null);

      return [
        `${FULL_WEEKDAY_LABELS[day.weekday]}: ${workoutType}`,
        ...exerciseLines,
      ].join("\n");
    })
    .join("\n\n");
}
