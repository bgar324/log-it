import assert from "node:assert/strict";
import test from "node:test";
import {
  createWorkout,
  WORKOUT_ALREADY_LOGGED_ERROR,
} from "../../../lib/workouts/service";
import { formatDatabaseDateValue } from "../../../lib/workout-utils";
import {
  assertTransactionOptions,
  BASE_WORKOUT,
  createDefaultTransactionMock,
  decimalString,
  resetMockedTransaction,
  withMockedTransaction,
} from "./workout-service.fixtures";

test.afterEach(() => {
  resetMockedTransaction();
});

test("createWorkout writes a nested workout payload and returns read-model sync metadata", async () => {
  const { tx, calls } = createDefaultTransactionMock();

  withMockedTransaction(async (callback, options) => {
    assertTransactionOptions(options);
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
    personalRecords: [],
  });

  const createdData = calls.workoutLogCreate[0]?.data as {
    title: string;
    workoutType?: string | null;
    totalWeightLb: unknown;
    performedAt: Date;
    exercises: {
      create: Array<{
        name: string;
        normalizedName: string;
        order: number;
        sets: {
          create: Array<{
            order: number;
            reps: number;
            weightLb: string | null;
            durationSeconds: number | null;
          }>;
        };
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
          { order: 1, reps: 6, weightLb: "160", durationSeconds: null },
          { order: 2, reps: 7, weightLb: "135", durationSeconds: null },
        ],
      },
    },
    {
      name: "Pull Up",
      normalizedName: "pull up",
      order: 2,
      sets: {
        create: [{ order: 1, reps: 10, weightLb: null, durationSeconds: null }],
      },
    },
  ]);
});

test("createWorkout rejects the same workout type on the same date", async () => {
  const { tx, calls } = createDefaultTransactionMock();

  tx.workoutLog.findFirst = async (args) => {
    calls.workoutLogFindFirst.push(args as Record<string, unknown>);
    return { id: "already-logged" };
  };
  withMockedTransaction(async (callback, options) => {
    assertTransactionOptions(options);
    return callback(tx);
  });

  await assert.rejects(
    () => createWorkout("user-1", BASE_WORKOUT),
    { message: WORKOUT_ALREADY_LOGGED_ERROR },
  );
  assert.deepEqual(calls.workoutLogFindFirst, [
    {
      where: {
        userId: "user-1",
        performedAt: BASE_WORKOUT.performedAt,
        workoutTypeSlug: "pull",
        status: "COMPLETED",
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
      },
    },
  ]);
  assert.equal(calls.workoutLogCreate.length, 0);
});
