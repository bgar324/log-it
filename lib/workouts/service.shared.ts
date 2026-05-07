import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import {
  createWorkoutReadModelSyncInput,
  type WorkoutReadModelSyncInput,
} from "../workout-read-models";
import { normalizeExerciseName } from "../workout-utils";
import { computeWorkoutTotalWeightLb, type ParsedWorkout } from "./payload";

export const WORKOUT_NOT_FOUND_ERROR = "WORKOUT_NOT_FOUND";

export type WorkoutDbClient = Prisma.TransactionClient | typeof prisma;

export type WorkoutMutationResult = {
  id: string;
  syncInput: WorkoutReadModelSyncInput;
};

export const TRANSACTION_OPTIONS = {
  timeout: 20_000,
  maxWait: 5_000,
} as const;

export function toNormalizedExerciseKey(exercise: {
  normalizedName: string;
  name: string;
}) {
  return exercise.normalizedName.trim() || normalizeExerciseName(exercise.name);
}

export function toWeightLbString(value: { toString: () => string } | number | null) {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    return `${value}`;
  }

  return value.toString();
}

export function createNestedWorkoutExercisePayload(payload: ParsedWorkout) {
  return payload.exercises.map((exerciseInput, exerciseIndex) => ({
    name: exerciseInput.name,
    normalizedName: exerciseInput.normalizedName,
    order: exerciseIndex + 1,
    sets: {
      create: exerciseInput.sets.map((setInput, setIndex) => ({
        order: setIndex + 1,
        reps: setInput.reps,
        weightLb: setInput.weightLb,
      })),
    },
  }));
}

export function createSyncInput(
  userId: string,
  normalizedNames: Iterable<string>,
  performedAtDates: Iterable<string | Date>,
) {
  return createWorkoutReadModelSyncInput(userId, normalizedNames, performedAtDates);
}

export async function createWorkoutRecord(
  db: WorkoutDbClient,
  userId: string,
  payload: ParsedWorkout,
) {
  const totalWeightLb = computeWorkoutTotalWeightLb(payload);
  const workoutLog = await db.workoutLog.create({
    data: {
      userId,
      title: payload.title,
      workoutType: payload.workoutType,
      workoutTypeSlug: payload.workoutTypeSlug,
      totalWeightLb,
      performedAt: payload.performedAt,
      status: "COMPLETED",
      exercises: {
        create: createNestedWorkoutExercisePayload(payload),
      },
    },
    select: {
      id: true,
    },
  });

  return {
    id: workoutLog.id,
    syncInput: createSyncInput(
      userId,
      payload.exercises.map((exercise) => exercise.normalizedName),
      [payload.performedAt],
    ),
  } satisfies WorkoutMutationResult;
}
