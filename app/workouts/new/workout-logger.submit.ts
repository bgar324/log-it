import { normalizeExerciseDisplayName } from "@/lib/exercise-autofill";
import type { WeightUnit } from "@/lib/weight-unit";
import { toSafeString, type ExerciseDraft, type WorkoutSubmitResponse } from "./workout-logger.utils";

type WorkoutLoggerPayload = {
  allowRestDayOverride?: boolean;
  title: string;
  workoutType: string;
  performedAt: string;
  weightUnit: WeightUnit;
  exercises: Array<{
    name: string;
    sets: Array<{
      reps: number;
      weightLb: string | null;
      durationSeconds: number | null;
    }>;
  }>;
};

type BuildPayloadResult =
  | { error: string }
  | {
      value: WorkoutLoggerPayload;
    };

// A date the database can store: the logger's own field format, so a cleared
// or half-typed value is caught before it reaches the API.
const WORKOUT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function buildWorkoutLoggerPayload(options: {
  exercises: ExerciseDraft[];
  title: string;
  workoutType: string;
  performedAt: string;
  weightUnit: WeightUnit;
  // The date and workout-type fields can live behind a sheet, and a closed
  // sheet has no DOM — so `required` on those inputs never fires. Every
  // caller builds its payload here, which makes this the one place the check
  // cannot be skipped by where a field happens to be rendered. The type is
  // only demanded when the caller actually has types to choose from:
  // untyped and bodyweight-only histories are valid workouts.
  requireWorkoutType?: boolean;
}): BuildPayloadResult {
  if (!WORKOUT_DATE_PATTERN.test(options.performedAt.trim())) {
    return { error: "Choose the date this workout happened." };
  }

  if (options.requireWorkoutType && options.workoutType.trim() === "") {
    return { error: "Choose the workout type before saving." };
  }

  const normalizedExercises = options.exercises
    .map((exercise) => {
      const name = normalizeExerciseDisplayName(toSafeString(exercise.name));
      const parsedSets = exercise.sets
        .map((setItem) => {
          const repsInput = toSafeString(setItem.reps).trim();
          const durationInput = toSafeString(setItem.durationSeconds).trim();
          const reps = repsInput === "" ? 0 : Number.parseInt(repsInput, 10);
          const durationSeconds =
            durationInput === "" ? null : Number.parseInt(durationInput, 10);
          const rawWeight = toSafeString(setItem.weightLb).trim();
          const weightLb = setItem.usesBodyweight
            ? null
            : rawWeight
              ? rawWeight.startsWith(".")
                ? `0${rawWeight}`
                : rawWeight
              : null;

          return {
            reps,
            weightLb,
            durationSeconds,
          };
        })
        .filter(
          (setItem) =>
            Number.isInteger(setItem.reps) &&
            setItem.reps >= 0 &&
            (setItem.reps > 0 ||
              (Number.isInteger(setItem.durationSeconds) &&
                (setItem.durationSeconds ?? 0) > 0)),
        );

      return {
        name,
        sets: parsedSets,
      };
    })
    .filter((exercise) => exercise.name !== "");

  if (normalizedExercises.length === 0) {
    return { error: "Add at least one exercise with a name." };
  }

  for (const exercise of normalizedExercises) {
    if (exercise.sets.length === 0) {
      return {
        error: `Add at least one set with reps or time for ${exercise.name}.`,
      };
    }
  }

  return {
    value: {
      title: options.title,
      workoutType: options.workoutType,
      performedAt: options.performedAt,
      weightUnit: options.weightUnit,
      exercises: normalizedExercises,
    },
  };
}

export async function submitWorkoutLoggerPayload(options: {
  allowRestDayOverride?: boolean;
  isEditMode: boolean;
  workoutId?: string;
  payload: WorkoutLoggerPayload;
  signal?: AbortSignal;
}) {
  const requestBody = options.isEditMode
    ? {
        ...options.payload,
        workoutId: options.workoutId,
      }
    : {
        ...options.payload,
        ...(options.allowRestDayOverride ? { allowRestDayOverride: true } : {}),
      };
  const response = await fetch("/api/workouts", {
    method: options.isEditMode ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    signal: options.signal,
  });

  return {
    response,
    data: (await response.json()) as WorkoutSubmitResponse,
  };
}
