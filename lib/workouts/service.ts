import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { isPrismaSchemaMismatchError } from "../schema-compat";
import {
  normalizeExerciseName,
  normalizeWorkoutTypeSlug,
} from "../workout-utils";
import { computeWorkoutTotalWeightLb, type ParsedExercise, type ParsedWorkout } from "./payload";

export const WORKOUT_NOT_FOUND_ERROR = "WORKOUT_NOT_FOUND";

type WorkoutDbClient = Prisma.TransactionClient | typeof prisma;

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

async function syncExerciseRecord(
  db: WorkoutDbClient,
  userId: string,
  normalizedName: string,
) {
  const latestSession = await db.workoutExercise.findFirst({
    where: {
      workoutLog: {
        userId,
      },
      normalizedName,
    },
    orderBy: [{ workoutLog: { performedAt: "desc" } }, { createdAt: "desc" }],
    select: {
      name: true,
      workoutLog: {
        select: {
          performedAt: true,
        },
      },
    },
  });

  if (!latestSession) {
    await db.exercise.deleteMany({
      where: {
        userId,
        normalizedName,
      },
    });
    return;
  }

  await db.exercise.upsert({
    where: {
      userId_normalizedName: {
        userId,
        normalizedName,
      },
    },
    update: {
      name: latestSession.name,
      lastPerformedAt: latestSession.workoutLog.performedAt,
    },
    create: {
      userId,
      name: latestSession.name,
      normalizedName,
      lastPerformedAt: latestSession.workoutLog.performedAt,
    },
  });
}

async function syncExerciseRecords(
  db: WorkoutDbClient,
  userId: string,
  normalizedNames: Iterable<string>,
) {
  for (const normalizedName of normalizedNames) {
    if (!normalizedName) {
      continue;
    }

    await syncExerciseRecord(db, userId, normalizedName);
  }
}

async function upsertExerciseRecord(
  db: WorkoutDbClient,
  userId: string,
  exerciseInput: ParsedExercise,
  performedAt: Date,
) {
  const exerciseRecord = await db.exercise.upsert({
    where: {
      userId_normalizedName: {
        userId,
        normalizedName: exerciseInput.normalizedName,
      },
    },
    create: {
      userId,
      name: exerciseInput.name,
      normalizedName: exerciseInput.normalizedName,
      lastPerformedAt: performedAt,
    },
    update: {
      name: exerciseInput.name,
    },
    select: { id: true },
  });

  await db.exercise.updateMany({
    where: {
      id: exerciseRecord.id,
      OR: [{ lastPerformedAt: null }, { lastPerformedAt: { lt: performedAt } }],
    },
    data: {
      lastPerformedAt: performedAt,
    },
  });

  return exerciseRecord.id;
}

async function createWorkoutExercises(
  db: WorkoutDbClient,
  userId: string,
  workoutLogId: string,
  payload: ParsedWorkout,
) {
  for (const [exerciseIndex, exerciseInput] of payload.exercises.entries()) {
    const exerciseId = await upsertExerciseRecord(
      db,
      userId,
      exerciseInput,
      payload.performedAt,
    );

    await db.workoutExercise.create({
      data: {
        workoutLogId,
        exerciseId,
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
      },
      select: { id: true },
    });
  }
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
    },
    select: {
      id: true,
    },
  });

  await createWorkoutExercises(db, userId, workoutLog.id, payload);

  return workoutLog.id;
}

export async function createWorkout(userId: string, payload: ParsedWorkout) {
  try {
    const id = await prisma.$transaction(
      (tx) => createWorkoutRecord(tx, userId, payload),
      TRANSACTION_OPTIONS,
    );

    return { id };
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }

    const id = await prisma.$transaction(
      (tx) =>
        createWorkoutRecord(tx, userId, payload, {
          includeWorkoutType: false,
        }),
      TRANSACTION_OPTIONS,
    );

    return { id };
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
        },
      });

      await tx.workoutExercise.deleteMany({
        where: {
          workoutLogId: existingWorkout.id,
        },
      });

      await createWorkoutExercises(tx, userId, existingWorkout.id, payload);
      await syncExerciseRecords(tx, userId, affectedExerciseKeys);

      return existingWorkout.id;
    }, TRANSACTION_OPTIONS);
  }

  try {
    const id = await runUpdate(true);
    return { id };
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }

    const id = await runUpdate(false);
    return { id };
  }
}

export async function deleteWorkout(workoutId: string, userId: string) {
  const id = await prisma.$transaction(async (tx) => {
    const existingWorkout = await tx.workoutLog.findFirst({
      where: {
        id: workoutId,
        userId,
      },
      select: {
        id: true,
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

    await syncExerciseRecords(tx, userId, affectedExerciseKeys);

    return existingWorkout.id;
  }, TRANSACTION_OPTIONS);

  return { id };
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
        performedAt: new Date(),
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
    const id = await runDuplicate(true);
    return { id };
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }

    const id = await runDuplicate(false);
    return { id };
  }
}
