import assert from "node:assert/strict";
import test from "node:test";
import {
  duplicateWorkout,
  WORKOUT_ALREADY_LOGGED_ERROR,
} from "../../../lib/workouts/service";
import { formatDatabaseDateValue, getCurrentPacificDate } from "../../../lib/workout-utils";
import {
  createDefaultTransactionMock,
  decimalString,
  resetMockedTransaction,
  withMockedTransaction,
} from "./workout-service.fixtures";

test.afterEach(() => {
  resetMockedTransaction();
});

test("duplicateWorkout clones the source workout into a nested create payload", async () => {
  const { tx, calls } = createDefaultTransactionMock();
  const pacificDateBefore = formatDatabaseDateValue(getCurrentPacificDate());

  tx.workoutLog.findFirst = async (args) => {
    calls.workoutLogFindFirst.push(args as Record<string, unknown>);
    const { where } = args as { where: Record<string, unknown> };

    // Only the id lookup is the source workout; the duplicate guard's lookup by
    // date must report nothing already logged.
    if (!where.id) {
      return null;
    }

    return {
      title: "Push Day",
      workoutType: "Push",
      workoutTypeSlug: "push",
      exercises: [
        {
          name: "Bench Press",
          normalizedName: "",
          sets: [{ reps: 5, weightLb: 225, durationSeconds: 45 }],
        },
      ],
    };
  };

  withMockedTransaction(async (callback) => callback(tx));

  const result = await duplicateWorkout("workout-1", "user-1");
  const pacificDateAfter = formatDatabaseDateValue(getCurrentPacificDate());

  assert.equal(result.id, "workout-created");
  assert.deepEqual(result.syncInput.normalizedExerciseNames, ["bench press"]);
  assert.ok([pacificDateBefore, pacificDateAfter].includes(result.syncInput.performedAtDates[0] ?? ""));

  const createdWorkout = calls.workoutLogCreate[0]?.data as {
    title: string;
    workoutType?: string | null;
    totalWeightLb: unknown;
    performedAt: Date;
    exercises: {
      create: Array<{
        normalizedName: string;
        sets: { create: Array<{ weightLb: string | null; durationSeconds: number | null }> };
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
    { order: 1, reps: 5, weightLb: "225", durationSeconds: 45 },
  ]);
});

test("duplicateWorkout obeys the same-day duplicate guard", async () => {
  const { tx, calls } = createDefaultTransactionMock();

  // The source lookup selects by id; the guard looks the day's workout type up
  // by date, so the mock answers each by the shape of its filter.
  tx.workoutLog.findFirst = async (args) => {
    calls.workoutLogFindFirst.push(args as Record<string, unknown>);
    const { where } = args as { where: Record<string, unknown> };

    if (where.id) {
      return {
        title: "Push Day",
        workoutType: "Push",
        workoutTypeSlug: "push",
        exercises: [
          {
            name: "Bench Press",
            normalizedName: "bench press",
            sets: [{ reps: 5, weightLb: 225, durationSeconds: null }],
          },
        ],
      };
    }

    return { id: "already-logged" };
  };

  withMockedTransaction(async (callback) => callback(tx));

  await assert.rejects(
    () => duplicateWorkout("workout-1", "user-1"),
    { message: WORKOUT_ALREADY_LOGGED_ERROR },
  );
  assert.equal(calls.workoutLogCreate.length, 0);
});
