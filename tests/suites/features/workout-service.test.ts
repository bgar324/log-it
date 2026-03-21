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
  };

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

test("createWorkout writes a nested workout payload and returns read-model sync metadata", async () => {
  const { tx, calls } = createDefaultTransactionMock();

  withMockedTransaction(async (callback, options) => {
    assert.deepEqual(options, { timeout: 20_000, maxWait: 5_000 });
    return callback(tx);
  });

  const result = await createWorkout("user-1", BASE_WORKOUT);

  assert.deepEqual(result, {
    id: "workout-created",
    syncInput: {
      userId: "user-1",
      normalizedExerciseNames: ["lat pulldown", "pull up"],
      performedAtDates: ["2026-03-12"],
    },
  });
  assert.equal(calls.workoutLogCreate.length, 1);

  const createdWorkout = calls.workoutLogCreate[0];
  const createdData = createdWorkout?.data as {
    title: string;
    workoutType?: string | null;
    totalWeightLb: unknown;
    performedAt: Date;
    exercises: {
      create: Array<{
        name: string;
        normalizedName: string;
        order: number;
        sets: { create: Array<{ order: number; reps: number; weightLb: string | null }> };
      }>;
    };
  };

  assert.equal(createdData.title, "Pull Day");
  assert.equal(createdData.workoutType, "Pull");
  assert.equal(decimalString(createdData.totalWeightLb), "1905");
  assert.equal(formatDatabaseDateValue(createdData.performedAt), "2026-03-12");
  assert.deepEqual(createdData.exercises.create, [
    {
      name: "Lat Pulldown",
      normalizedName: "lat pulldown",
      order: 1,
      sets: {
        create: [
          { order: 1, reps: 6, weightLb: "160" },
          { order: 2, reps: 7, weightLb: "135" },
        ],
      },
    },
    {
      name: "Pull Up",
      normalizedName: "pull up",
      order: 2,
      sets: {
        create: [{ order: 1, reps: 10, weightLb: null }],
      },
    },
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

  assert.equal(result.id, "workout-created");
  assert.equal(invocationCount, 2);

  const createdWorkout = calls.workoutLogCreate[0]?.data as Record<string, unknown>;
  assert.equal("workoutType" in createdWorkout, false);
  assert.equal("workoutTypeSlug" in createdWorkout, false);
});

test("updateWorkout replaces exercises through a nested update and includes old and new sync keys", async () => {
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
      performedAt: createDatabaseDate(2026, 3, 12),
      exercises: [
        {
          name: "Bench Press",
          normalizedName: "bench press",
        },
      ],
    };
  };

  withMockedTransaction(async (callback) => callback(tx));

  const result = await updateWorkout("workout-1", "user-1", updatedPayload);

  assert.deepEqual(result, {
    id: "workout-1",
    syncInput: {
      userId: "user-1",
      normalizedExerciseNames: ["bench press", "incline press"],
      performedAtDates: ["2026-03-12", "2026-03-13"],
    },
  });
  assert.equal(calls.workoutLogUpdate.length, 1);

  const updatedWorkout = calls.workoutLogUpdate[0]?.data as {
    title: string;
    totalWeightLb: unknown;
    workoutType?: string | null;
    performedAt: Date;
    exercises: {
      deleteMany: Record<string, never>;
      create: Array<{
        name: string;
        normalizedName: string;
        order: number;
      }>;
    };
  };
  assert.equal(updatedWorkout.title, "Upper Reload");
  assert.equal(decimalString(updatedWorkout.totalWeightLb), "760");
  assert.equal(updatedWorkout.workoutType, "Upper");
  assert.equal(formatDatabaseDateValue(updatedWorkout.performedAt), "2026-03-13");
  assert.deepEqual(updatedWorkout.exercises.deleteMany, {});
  assert.deepEqual(updatedWorkout.exercises.create, [
    {
      name: "Incline Press",
      normalizedName: "incline press",
      order: 1,
      sets: {
        create: [{ order: 1, reps: 8, weightLb: "95" }],
      },
    },
  ]);
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

test("deleteWorkout removes the workout and returns the affected summary keys", async () => {
  const { tx, calls } = createDefaultTransactionMock();

  tx.workoutLog.findFirst = async (args) => {
    calls.workoutLogFindFirst.push(args as Record<string, unknown>);
    return {
      id: "workout-1",
      performedAt: createDatabaseDate(2026, 3, 12),
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

  assert.deepEqual(result, {
    id: "workout-1",
    syncInput: {
      userId: "user-1",
      normalizedExerciseNames: ["lat pulldown"],
      performedAtDates: ["2026-03-12"],
    },
  });
  assert.equal(calls.workoutLogDelete.length, 1);
});

test("duplicateWorkout clones the source workout into a nested create payload", async () => {
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

  assert.equal(result.id, "workout-created");
  assert.deepEqual(result.syncInput.normalizedExerciseNames, ["bench press"]);
  assert.ok(
    [pacificDateBefore, pacificDateAfter].includes(
      result.syncInput.performedAtDates[0] ?? "",
    ),
  );

  const createdWorkout = calls.workoutLogCreate[0]?.data as {
    title: string;
    workoutType?: string | null;
    totalWeightLb: unknown;
    performedAt: Date;
    exercises: {
      create: Array<{
        normalizedName: string;
        sets: { create: Array<{ weightLb: string | null }> };
      }>;
    };
  };
  assert.equal(createdWorkout.title, "Push Day");
  assert.equal(createdWorkout.workoutType, "Push");
  assert.equal(decimalString(createdWorkout.totalWeightLb), "1125");
  assert.ok(
    [pacificDateBefore, pacificDateAfter].includes(
      formatDatabaseDateValue(createdWorkout.performedAt),
    ),
  );
  assert.equal(createdWorkout.exercises.create[0]?.normalizedName, "bench press");
  assert.deepEqual(createdWorkout.exercises.create[0]?.sets.create, [
    { order: 1, reps: 5, weightLb: "225" },
  ]);
});
