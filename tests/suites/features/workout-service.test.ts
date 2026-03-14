import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import {
  createWorkout,
  deleteWorkout,
  duplicateWorkout,
  updateWorkout,
  WORKOUT_NOT_FOUND_ERROR,
} from "../../../lib/workouts/service";
import type { ParsedWorkout } from "../../../lib/workouts/payload";
import {
  createDatabaseDate,
  formatDatabaseDateValue,
  getCurrentPacificDate,
} from "../../../lib/workout-utils";

type TransactionMock = {
  workoutLog: {
    create: (args: unknown) => Promise<{ id: string }>;
    findFirst: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  workoutExercise: {
    create: (args: unknown) => Promise<{ id: string }>;
    deleteMany: (args: unknown) => Promise<unknown>;
    findFirst: (args: unknown) => Promise<unknown>;
  };
  exercise: {
    upsert: (args: unknown) => Promise<{ id: string }>;
    updateMany: (args: unknown) => Promise<unknown>;
    deleteMany: (args: unknown) => Promise<unknown>;
  };
};

const prismaMutable = prisma as unknown as {
  $transaction: <T>(callback: (tx: TransactionMock) => Promise<T>, options?: unknown) => Promise<T>;
};

const originalTransaction = prismaMutable.$transaction;

const BASE_WORKOUT: ParsedWorkout = {
  title: "Pull Day",
  workoutType: "Pull",
  workoutTypeSlug: "pull",
  performedAt: createDatabaseDate(2026, 3, 12),
  weightUnit: "LB",
  exercises: [
    {
      name: "Lat Pulldown",
      normalizedName: "lat pulldown",
      sets: [
        { reps: 6, weightLb: "160" },
        { reps: 7, weightLb: "135" },
      ],
    },
    {
      name: "Pull Up",
      normalizedName: "pull up",
      sets: [{ reps: 10, weightLb: null }],
    },
  ],
};

function createDefaultTransactionMock() {
  const calls = {
    workoutLogCreate: [] as Array<Record<string, unknown>>,
    workoutLogFindFirst: [] as Array<Record<string, unknown>>,
    workoutLogUpdate: [] as Array<Record<string, unknown>>,
    workoutLogDelete: [] as Array<Record<string, unknown>>,
    workoutExerciseCreate: [] as Array<Record<string, unknown>>,
    workoutExerciseDeleteMany: [] as Array<Record<string, unknown>>,
    workoutExerciseFindFirst: [] as Array<Record<string, unknown>>,
    exerciseUpsert: [] as Array<Record<string, unknown>>,
    exerciseUpdateMany: [] as Array<Record<string, unknown>>,
    exerciseDeleteMany: [] as Array<Record<string, unknown>>,
  };

  let exerciseCounter = 0;
  let workoutExerciseCounter = 0;

  const tx: TransactionMock = {
    workoutLog: {
      async create(args) {
        calls.workoutLogCreate.push(args as Record<string, unknown>);
        return { id: "workout-created" };
      },
      async findFirst(args) {
        calls.workoutLogFindFirst.push(args as Record<string, unknown>);
        return null;
      },
      async update(args) {
        calls.workoutLogUpdate.push(args as Record<string, unknown>);
        return { id: "workout-updated" };
      },
      async delete(args) {
        calls.workoutLogDelete.push(args as Record<string, unknown>);
        return { id: "workout-deleted" };
      },
    },
    workoutExercise: {
      async create(args) {
        calls.workoutExerciseCreate.push(args as Record<string, unknown>);
        workoutExerciseCounter += 1;
        return { id: `workout-exercise-${workoutExerciseCounter}` };
      },
      async deleteMany(args) {
        calls.workoutExerciseDeleteMany.push(args as Record<string, unknown>);
        return { count: 1 };
      },
      async findFirst(args) {
        calls.workoutExerciseFindFirst.push(args as Record<string, unknown>);
        return null;
      },
    },
    exercise: {
      async upsert(args) {
        calls.exerciseUpsert.push(args as Record<string, unknown>);
        exerciseCounter += 1;
        return { id: `exercise-${exerciseCounter}` };
      },
      async updateMany(args) {
        calls.exerciseUpdateMany.push(args as Record<string, unknown>);
        return { count: 1 };
      },
      async deleteMany(args) {
        calls.exerciseDeleteMany.push(args as Record<string, unknown>);
        return { count: 1 };
      },
    },
  };

  return { tx, calls };
}

function withMockedTransaction(
  implementation: <T>(
    callback: (tx: TransactionMock) => Promise<T>,
    options?: unknown,
  ) => Promise<T>,
) {
  prismaMutable.$transaction = implementation;
}

function decimalString(value: unknown) {
  return value && typeof value === "object" && "toString" in value
    ? String((value as { toString: () => string }).toString())
    : String(value);
}

test.afterEach(() => {
  prismaMutable.$transaction = originalTransaction;
});

test("createWorkout writes the workout log, exercises, sets, and exercise catalog updates", async () => {
  const { tx, calls } = createDefaultTransactionMock();

  withMockedTransaction(async (callback, options) => {
    assert.deepEqual(options, { timeout: 20_000, maxWait: 5_000 });
    return callback(tx);
  });

  const result = await createWorkout("user-1", BASE_WORKOUT);

  assert.deepEqual(result, { id: "workout-created" });
  assert.equal(calls.workoutLogCreate.length, 1);
  assert.equal(calls.workoutExerciseCreate.length, 2);
  assert.equal(calls.exerciseUpsert.length, 2);
  assert.equal(calls.exerciseUpdateMany.length, 2);

  const createdWorkout = calls.workoutLogCreate[0];
  assert.equal(createdWorkout?.data && (createdWorkout.data as { title?: string }).title, "Pull Day");
  assert.equal(
    createdWorkout?.data && (createdWorkout.data as { workoutType?: string | null }).workoutType,
    "Pull",
  );
  assert.equal(
    decimalString(
      createdWorkout?.data && (createdWorkout.data as { totalWeightLb?: unknown }).totalWeightLb,
    ),
    "1905",
  );
  assert.equal(
    formatDatabaseDateValue(
      (createdWorkout?.data as { performedAt: Date }).performedAt,
    ),
    "2026-03-12",
  );

  const firstExercise = calls.workoutExerciseCreate[0];
  const firstExerciseData = firstExercise?.data as {
    name: string;
    order: number;
    sets: { create: Array<{ order: number; reps: number; weightLb: string | null }> };
  };

  assert.equal(firstExerciseData.name, "Lat Pulldown");
  assert.equal(firstExerciseData.order, 1);
  assert.deepEqual(firstExerciseData.sets.create, [
    { order: 1, reps: 6, weightLb: "160" },
    { order: 2, reps: 7, weightLb: "135" },
  ]);
});

test("createWorkout retries without workout type columns on schema mismatch", async () => {
  const { tx, calls } = createDefaultTransactionMock();
  let invocationCount = 0;

  withMockedTransaction(async (callback) => {
    invocationCount += 1;

    if (invocationCount === 1) {
      throw new Prisma.PrismaClientKnownRequestError("missing column", {
        code: "P2021",
        clientVersion: "test",
      });
    }

    return callback(tx);
  });

  const result = await createWorkout("user-1", BASE_WORKOUT);

  assert.deepEqual(result, { id: "workout-created" });
  assert.equal(invocationCount, 2);

  const createdWorkout = calls.workoutLogCreate[0]?.data as Record<string, unknown>;
  assert.equal("workoutType" in createdWorkout, false);
  assert.equal("workoutTypeSlug" in createdWorkout, false);
});

test("updateWorkout replaces exercises and resynchronizes affected exercise records", async () => {
  const { tx, calls } = createDefaultTransactionMock();
  const updatedPayload: ParsedWorkout = {
    title: "Upper Reload",
    workoutType: "Upper",
    workoutTypeSlug: "upper",
    performedAt: createDatabaseDate(2026, 3, 13),
    weightUnit: "LB",
    exercises: [
      {
        name: "Incline Press",
        normalizedName: "incline press",
        sets: [{ reps: 8, weightLb: "95" }],
      },
    ],
  };

  tx.workoutLog.findFirst = async (args) => {
    calls.workoutLogFindFirst.push(args as Record<string, unknown>);
    return {
      id: "workout-1",
      exercises: [
        {
          name: "Bench Press",
          normalizedName: "bench press",
        },
      ],
    };
  };

  tx.workoutExercise.findFirst = async (args) => {
    calls.workoutExerciseFindFirst.push(args as Record<string, unknown>);
    const where = args as {
      where?: {
        normalizedName?: string;
      };
    };

    if (where.where?.normalizedName === "incline press") {
      return {
        name: "Incline Press",
        workoutLog: {
          performedAt: updatedPayload.performedAt,
        },
      };
    }

    return null;
  };

  withMockedTransaction(async (callback) => callback(tx));

  const result = await updateWorkout("workout-1", "user-1", updatedPayload);

  assert.deepEqual(result, { id: "workout-1" });
  assert.equal(calls.workoutLogUpdate.length, 1);
  assert.equal(calls.workoutExerciseDeleteMany.length, 1);
  assert.equal(calls.workoutExerciseCreate.length, 1);
  assert.equal(calls.exerciseDeleteMany.length, 1);

  const deletedExerciseWhere = calls.exerciseDeleteMany[0]?.where as {
    normalizedName?: string;
    userId?: string;
  };
  assert.equal(deletedExerciseWhere.normalizedName, "bench press");
  assert.equal(deletedExerciseWhere.userId, "user-1");

  const updatedWorkout = calls.workoutLogUpdate[0]?.data as Record<string, unknown>;
  assert.equal(updatedWorkout.title, "Upper Reload");
  assert.equal(decimalString(updatedWorkout.totalWeightLb), "760");
  assert.equal(updatedWorkout.workoutType, "Upper");
  assert.equal(
    formatDatabaseDateValue(updatedWorkout.performedAt as Date),
    "2026-03-13",
  );
});

test("updateWorkout throws a not-found error when the target workout does not exist", async () => {
  const { tx } = createDefaultTransactionMock();

  withMockedTransaction(async (callback) => callback(tx));

  await assert.rejects(
    () => updateWorkout("missing-workout", "user-1", BASE_WORKOUT),
    (error: unknown) =>
      error instanceof Error && error.message === WORKOUT_NOT_FOUND_ERROR,
  );
});

test("deleteWorkout removes the workout and prunes orphaned exercise records", async () => {
  const { tx, calls } = createDefaultTransactionMock();

  tx.workoutLog.findFirst = async (args) => {
    calls.workoutLogFindFirst.push(args as Record<string, unknown>);
    return {
      id: "workout-1",
      exercises: [
        {
          name: "Lat Pulldown",
          normalizedName: "lat pulldown",
        },
      ],
    };
  };

  withMockedTransaction(async (callback) => callback(tx));

  const result = await deleteWorkout("workout-1", "user-1");

  assert.deepEqual(result, { id: "workout-1" });
  assert.equal(calls.workoutLogDelete.length, 1);
  assert.equal(calls.exerciseDeleteMany.length, 1);

  const deletedWorkoutWhere = calls.workoutLogDelete[0]?.where as { id?: string };
  assert.equal(deletedWorkoutWhere.id, "workout-1");
});

test("duplicateWorkout clones the source workout into a new workout record", async () => {
  const { tx, calls } = createDefaultTransactionMock();
  const pacificDateBefore = formatDatabaseDateValue(getCurrentPacificDate());

  tx.workoutLog.findFirst = async (args) => {
    calls.workoutLogFindFirst.push(args as Record<string, unknown>);
    return {
      title: "Push Day",
      workoutType: "Push",
      workoutTypeSlug: "push",
      exercises: [
        {
          name: "Bench Press",
          normalizedName: "",
          sets: [{ reps: 5, weightLb: 225 }],
        },
      ],
    };
  };

  withMockedTransaction(async (callback) => callback(tx));

  const result = await duplicateWorkout("workout-1", "user-1");
  const pacificDateAfter = formatDatabaseDateValue(getCurrentPacificDate());

  assert.deepEqual(result, { id: "workout-created" });
  assert.equal(calls.workoutLogCreate.length, 1);
  assert.equal(calls.workoutExerciseCreate.length, 1);

  const createdWorkout = calls.workoutLogCreate[0]?.data as Record<string, unknown>;
  assert.equal(createdWorkout.title, "Push Day");
  assert.equal(createdWorkout.workoutType, "Push");
  assert.equal(decimalString(createdWorkout.totalWeightLb), "1125");

  const performedAt = createdWorkout.performedAt as Date;
  assert.ok(
    [pacificDateBefore, pacificDateAfter].includes(
      formatDatabaseDateValue(performedAt),
    ),
  );

  const createdExercise = calls.workoutExerciseCreate[0]?.data as {
    normalizedName?: string;
    sets: { create: Array<{ weightLb: string | null }> };
  };
  assert.equal(createdExercise.normalizedName, "bench press");
  assert.deepEqual(createdExercise.sets.create, [{ order: 1, reps: 5, weightLb: "225" }]);
});
