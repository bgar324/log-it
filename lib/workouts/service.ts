import { prisma } from "../prisma";
import { getCurrentPacificDate, normalizeWorkoutTypeSlug } from "../workout-utils";
import { resolveBodyWeightLbForDate } from "../body-weight";
import { computeWorkoutTotalWeightLb, type ParsedWorkout } from "./payload";
import {
  createSyncInput,
  createWorkoutRecord,
  createNestedWorkoutExercisePayload,
  toNormalizedExerciseKey,
  toWeightLbString,
  TRANSACTION_OPTIONS,
  WORKOUT_NOT_FOUND_ERROR,
} from "./service.shared";

export { WORKOUT_NOT_FOUND_ERROR } from "./service.shared";

export async function createWorkout(userId: string, payload: ParsedWorkout) {
  return prisma.$transaction(
    (tx) => createWorkoutRecord(tx, userId, payload),
    TRANSACTION_OPTIONS,
  );
}

export async function updateWorkout(
  workoutId: string,
  userId: string,
  payload: ParsedWorkout,
) {
  return prisma.$transaction(async (tx) => {
    const existingWorkout = await tx.workoutLog.findFirst({
      where: {
        id: workoutId,
        userId,
      },
      select: {
        id: true,
        performedAt: true,
        exercises: {
          select: {
            name: true,
            normalizedName: true,
          },
        },
      },
    });

    if (!existingWorkout) {
      throw new Error(WORKOUT_NOT_FOUND_ERROR);
    }

    const affectedExerciseKeys = new Set<string>();

    for (const exercise of existingWorkout.exercises) {
      const normalizedKey = toNormalizedExerciseKey(exercise);

      if (normalizedKey) {
        affectedExerciseKeys.add(normalizedKey);
      }
    }

    for (const exercise of payload.exercises) {
      affectedExerciseKeys.add(exercise.normalizedName);
    }

    const bodyWeightLb = await resolveBodyWeightLbForDate(
      tx,
      userId,
      payload.performedAt,
    );

    await tx.workoutLog.update({
      where: {
        id: existingWorkout.id,
      },
      data: {
        title: payload.title,
        workoutType: payload.workoutType,
        workoutTypeSlug: payload.workoutTypeSlug,
        totalWeightLb: computeWorkoutTotalWeightLb(payload, bodyWeightLb),
        bodyWeightLb,
        performedAt: payload.performedAt,
        status: "COMPLETED",
        exercises: {
          deleteMany: {},
          create: createNestedWorkoutExercisePayload(payload),
        },
      },
    });

    return {
      id: existingWorkout.id,
      syncInput: createSyncInput(userId, affectedExerciseKeys, [
        existingWorkout.performedAt,
        payload.performedAt,
      ]),
    };
  }, TRANSACTION_OPTIONS);
}

export async function deleteWorkout(workoutId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const existingWorkout = await tx.workoutLog.findFirst({
      where: {
        id: workoutId,
        userId,
      },
      select: {
        id: true,
        performedAt: true,
        exercises: {
          select: {
            name: true,
            normalizedName: true,
          },
        },
      },
    });

    if (!existingWorkout) {
      throw new Error(WORKOUT_NOT_FOUND_ERROR);
    }

    const affectedExerciseKeys = new Set<string>();

    for (const exercise of existingWorkout.exercises) {
      const normalizedKey = toNormalizedExerciseKey(exercise);

      if (normalizedKey) {
        affectedExerciseKeys.add(normalizedKey);
      }
    }

    await tx.workoutLog.delete({
      where: {
        id: existingWorkout.id,
      },
    });

    return {
      id: existingWorkout.id,
      syncInput: createSyncInput(userId, affectedExerciseKeys, [existingWorkout.performedAt]),
    };
  }, TRANSACTION_OPTIONS);
}

export async function duplicateWorkout(workoutId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const sourceWorkout = await tx.workoutLog.findFirst({
      where: {
        id: workoutId,
        userId,
      },
      select: {
        title: true,
        workoutType: true,
        workoutTypeSlug: true,
        exercises: {
          orderBy: {
            order: "asc",
          },
          select: {
            name: true,
            normalizedName: true,
            sets: {
              orderBy: {
                order: "asc",
              },
              select: {
                reps: true,
                weightLb: true,
                durationSeconds: true,
              },
            },
          },
        },
      },
    });

    if (!sourceWorkout) {
      throw new Error(WORKOUT_NOT_FOUND_ERROR);
    }

    const payload: ParsedWorkout = {
      title: sourceWorkout.title,
      workoutType: sourceWorkout.workoutType,
      workoutTypeSlug:
        sourceWorkout.workoutTypeSlug ??
        (sourceWorkout.workoutType
          ? normalizeWorkoutTypeSlug(sourceWorkout.workoutType)
          : null),
      performedAt: getCurrentPacificDate(),
      weightUnit: "LB",
      exercises: sourceWorkout.exercises.map((exercise) => ({
        name: exercise.name,
        normalizedName: toNormalizedExerciseKey(exercise),
        sets: exercise.sets.map((set) => ({
          reps: set.reps,
          weightLb: toWeightLbString(set.weightLb),
          durationSeconds: set.durationSeconds,
        })),
      })),
    };

    return createWorkoutRecord(tx, userId, payload);
  }, TRANSACTION_OPTIONS);
}
