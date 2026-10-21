import {
  formatDatabaseDateValue,
  getCurrentPacificDate,
  toDatabaseDateFromInput,
} from "@/lib/workout-utils";
import type { WeightUnit } from "@/lib/weight-unit";
import {
  WORKOUT_DRAFT_STORAGE_KEY,
  type ExerciseDraft,
  type ExerciseSetDraft,
  type WorkoutDraftSnapshot,
  type WorkoutLoggerInitialData,
} from "./workout-logger.types";

type WorkoutDraftStoragePayload = WorkoutDraftSnapshot & {
  weightUnit: WeightUnit;
};
type WorkoutDraftSnapshotExercise = WorkoutDraftSnapshot["exercises"][number];

const INITIAL_EXERCISE_ID = "exercise-1";
const INITIAL_SET_ID = "set-1";

export function createSetDraft(id: string): ExerciseSetDraft {
  return {
    id,
    reps: "",
    weightLb: "",
    usesBodyweight: false,
    durationSeconds: "",
  };
}

export function createExerciseDraft(id: string, setId: string): ExerciseDraft {
  return {
    id,
    name: "",
    sets: [createSetDraft(setId)],
  };
}

function normalizePerformedAtInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return formatDatabaseDateValue(getCurrentPacificDate());
  }

  return formatDatabaseDateValue(toDatabaseDateFromInput(trimmed));
}

export function toSafeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function sanitizeWeightInput(value: string) {
  const normalized = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");

  if (!normalized) {
    return "";
  }

  const firstDotIndex = normalized.indexOf(".");

  if (firstDotIndex === -1) {
    return normalized;
  }

  const whole = normalized.slice(0, firstDotIndex + 1);
  const fractional = normalized.slice(firstDotIndex + 1).replace(/\./g, "");

  return `${whole}${fractional}`;
}

export function sanitizeRepsInput(value: string) {
  return value.replace(/\D/g, "");
}

export function sanitizeDurationInput(value: string) {
  return value.replace(/\D/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function createWorkoutDraftSnapshot(
  title: string,
  workoutType: string,
  performedAt: string,
  exercises: ExerciseDraft[],
): WorkoutDraftSnapshot {
  return {
    title,
    workoutType,
    performedAt,
    exercises: exercises.map((exercise) => ({
      name: toSafeString(exercise.name),
      sets:
        exercise.sets.length > 0
          ? exercise.sets.map((setItem) => ({
              reps: sanitizeRepsInput(toSafeString(setItem.reps)),
              weightLb: sanitizeWeightInput(toSafeString(setItem.weightLb)),
              usesBodyweight: setItem.usesBodyweight,
              durationSeconds: sanitizeDurationInput(toSafeString(setItem.durationSeconds)),
            }))
          : [{ reps: "", weightLb: "", usesBodyweight: false, durationSeconds: "" }],
    })),
  };
}

export function persistWorkoutDraft(
  snapshot: WorkoutDraftSnapshot,
  weightUnit: WeightUnit,
) {
  const payload: WorkoutDraftStoragePayload = {
    ...snapshot,
    weightUnit,
  };

  try {
    window.localStorage.setItem(
      WORKOUT_DRAFT_STORAGE_KEY,
      JSON.stringify(payload),
    );
    return true;
  } catch {
    return false;
  }
}

export function parseStoredWorkoutDraft(
  rawValue: string | null,
  currentWeightUnit: WeightUnit,
) {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!isRecord(parsed)) {
      return null;
    }

    const title =
      typeof parsed.title === "string" ? parsed.title : "Gym session";
    const workoutType =
      typeof parsed.workoutType === "string" ? parsed.workoutType : "";
    const performedAtSource =
      typeof parsed.performedAt === "string" ? parsed.performedAt : "";
    const performedAt = formatDatabaseDateValue(
      toDatabaseDateFromInput(performedAtSource),
    );
    const weightUnit =
      parsed.weightUnit === "LB" || parsed.weightUnit === "KG"
        ? parsed.weightUnit
        : null;

    if (weightUnit !== currentWeightUnit) {
      return null;
    }

    const rawExercises = Array.isArray(parsed.exercises) ? parsed.exercises : [];
    const exercises = rawExercises
      .map((rawExercise): WorkoutDraftSnapshotExercise | null => {
        if (!isRecord(rawExercise)) {
          return null;
        }

        const name = toSafeString(rawExercise.name);
        const rawSets = Array.isArray(rawExercise.sets) ? rawExercise.sets : [];
        const sets = rawSets
          .map((rawSet) => {
            if (!isRecord(rawSet)) {
              return null;
            }

            return {
              reps: sanitizeRepsInput(toSafeString(rawSet.reps)),
              weightLb: sanitizeWeightInput(toSafeString(rawSet.weightLb)),
              usesBodyweight: rawSet.usesBodyweight === true,
              durationSeconds: sanitizeDurationInput(toSafeString(rawSet.durationSeconds)),
            };
          })
          .filter(
            (
              setItem,
            ): setItem is { reps: string; weightLb: string; usesBodyweight: boolean; durationSeconds: string } =>
              setItem !== null,
          );

        return {
          name,
          sets: sets.length > 0 ? sets : [{ reps: "", weightLb: "", usesBodyweight: false, durationSeconds: "" }],
        };
      })
      .filter(
        (exercise): exercise is WorkoutDraftSnapshotExercise =>
          exercise !== null,
      );

    if (exercises.length === 0) {
      exercises.push({
        name: "",
        sets: [{ reps: "", weightLb: "", usesBodyweight: false, durationSeconds: "" }],
      });
    }

    return {
      title,
      workoutType,
      performedAt,
      exercises,
    };
  } catch {
    return null;
  }
}

export function hydrateExercisesFromSnapshot(
  exercises: WorkoutDraftSnapshot["exercises"],
) {
  let setCounter = 0;
  const hydrated = exercises.map((exercise, exerciseIndex) => ({
    id: `exercise-${exerciseIndex + 1}`,
    name: exercise.name,
    sets: exercise.sets.map((setItem) => {
      setCounter += 1;
      return {
        id: `set-${setCounter}`,
        reps: setItem.reps,
        weightLb: setItem.weightLb,
        usesBodyweight: setItem.usesBodyweight === true,
        durationSeconds: setItem.durationSeconds,
      };
    }),
  }));

  return {
    exercises:
      hydrated.length > 0
        ? hydrated
        : [createExerciseDraft(INITIAL_EXERCISE_ID, INITIAL_SET_ID)],
    counters: {
      exercise: Math.max(hydrated.length, 1),
      set: Math.max(setCounter, 1),
    },
  };
}

export function createInitialLoggerState(initialData?: WorkoutLoggerInitialData) {
  if (!initialData) {
    return {
      title: "Gym session",
      workoutType: "",
      performedAt: formatDatabaseDateValue(getCurrentPacificDate()),
      exercises: [createExerciseDraft(INITIAL_EXERCISE_ID, INITIAL_SET_ID)],
      counters: {
        exercise: 1,
        set: 1,
      },
    };
  }

  const hydrated = hydrateExercisesFromSnapshot(initialData.exercises);

  return {
    title: toSafeString(initialData.title).trim() || "Gym session",
    workoutType: toSafeString(initialData.workoutType).trim(),
    performedAt: normalizePerformedAtInput(initialData.performedAt),
    exercises: hydrated.exercises,
    counters: hydrated.counters,
  };
}
