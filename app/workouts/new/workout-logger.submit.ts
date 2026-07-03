import { normalizeExerciseDisplayName } from "@/lib/exercise-autofill";
import type { WeightUnit } from "@/lib/weight-unit";
import { toSafeString, type ExerciseDraft, type WorkoutSubmitResponse } from "./workout-logger.utils";

type WorkoutLoggerPayload = {
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

export function buildWorkoutLoggerPayload(options: {
  exercises: ExerciseDraft[];
  title: string;
  workoutType: string;
  performedAt: string;
  weightUnit: WeightUnit;
}): BuildPayloadResult {
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
  isEditMode: boolean;
  workoutId?: string;
  payload: WorkoutLoggerPayload;
}) {
  const requestBody = options.isEditMode
    ? {
        ...options.payload,
        workoutId: options.workoutId,
      }
    : options.payload;
  const response = await fetch("/api/workouts", {
    method: options.isEditMode ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  return {
    response,
    data: (await response.json()) as WorkoutSubmitResponse,
  };
}
