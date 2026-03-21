import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import {
  createWorkoutReadModelSyncInput,
  type WorkoutReadModelSyncInput,
} from "../workout-read-models";
import { isPrismaSchemaMismatchError } from "../schema-compat";
import {
  getCurrentPacificDate,
  normalizeExerciseName,
  normalizeWorkoutTypeSlug,
} from "../workout-utils";
import { computeWorkoutTotalWeightLb, type ParsedWorkout } from "./payload";

export const WORKOUT_NOT_FOUND_ERROR = "WORKOUT_NOT_FOUND";

type WorkoutDbClient = Prisma.TransactionClient | typeof prisma;

type WorkoutMutationResult = {
  id: string;
  syncInput: WorkoutReadModelSyncInput;
};

const TRANSACTION_OPTIONS = {
  timeout: 20_000,
  maxWait: 5_000,
} as const;

function toNormalizedExerciseKey(exercise: {
  normalizedName: string;
  name: string;
}) {
  return exercise.normalizedName.trim() || normalizeExerciseName(exercise.name);
}

function toWeightLbString(value: { toString: () => string } | number | null) {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    return `${value}`;
  }

  return value.toString();
}

function createNestedWorkoutExercisePayload(payload: ParsedWorkout) {
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

function createSyncInput(
  userId: string,
  normalizedNames: Iterable<string>,
  performedAtDates: Iterable<string | Date>,
) {
  return createWorkoutReadModelSyncInput(userId, normalizedNames, performedAtDates);
}

async function createWorkoutRecord(
  db: WorkoutDbClient,
  userId: string,
  payload: ParsedWorkout,
  options?: {
    includeWorkoutType?: boolean;
  },
) {
  const totalWeightLb = computeWorkoutTotalWeightLb(payload);
  const workoutLog = await db.workoutLog.create({
    data: {
      userId,
      title: payload.title,
      ...(options?.includeWorkoutType === false
        ? {}
        : {
            workoutType: payload.workoutType,
            workoutTypeSlug: payload.workoutTypeSlug,
          }),
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

export async function createWorkout(userId: string, payload: ParsedWorkout) {
  try {
    return await prisma.$transaction(
      (tx) => createWorkoutRecord(tx, userId, payload),
      TRANSACTION_OPTIONS,
    );
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }

    return prisma.$transaction(
      (tx) =>
        createWorkoutRecord(tx, userId, payload, {
          includeWorkoutType: false,
        }),
      TRANSACTION_OPTIONS,
    );
  }
}

export async function updateWorkout(
  workoutId: string,
  userId: string,
  payload: ParsedWorkout,
) {
  async function runUpdate(includeWorkoutType: boolean) {
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

      await tx.workoutLog.update({
        where: {
          id: existingWorkout.id,
        },
        data: {
          title: payload.title,
          ...(includeWorkoutType
            ? {
                workoutType: payload.workoutType,
                workoutTypeSlug: payload.workoutTypeSlug,
              }
            : {}),
          totalWeightLb: computeWorkoutTotalWeightLb(payload),
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
      } satisfies WorkoutMutationResult;
    }, TRANSACTION_OPTIONS);
  }

  try {
    return await runUpdate(true);
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }

    return runUpdate(false);
  }
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
      syncInput: createSyncInput(userId, affectedExerciseKeys, [
        existingWorkout.performedAt,
      ]),
    } satisfies WorkoutMutationResult;
  }, TRANSACTION_OPTIONS);
}

export async function duplicateWorkout(workoutId: string, userId: string) {
  async function runDuplicate(includeWorkoutType: boolean) {
    return prisma.$transaction(async (tx) => {
      const sourceWorkout = await (async () => {
        if (includeWorkoutType) {
          return tx.workoutLog.findFirst({
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
                    },
                  },
                },
              },
            },
          });
        }

        const legacyWorkout = await tx.workoutLog.findFirst({
          where: {
            id: workoutId,
            userId,
          },
          select: {
            title: true,
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
                  },
                },
              },
            },
          },
        });

        return legacyWorkout
          ? {
              ...legacyWorkout,
              workoutType: null,
              workoutTypeSlug: null,
            }
          : null;
      })();

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
          })),
        })),
      };

      return createWorkoutRecord(tx, userId, payload, {
        includeWorkoutType,
      });
    }, TRANSACTION_OPTIONS);
  }

  try {
    return await runDuplicate(true);
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }

    return runDuplicate(false);
  }
}
