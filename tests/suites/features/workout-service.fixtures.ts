import assert from "node:assert/strict";
import { prisma } from "../../../lib/prisma";
import type { ParsedWorkout } from "../../../lib/workouts/payload";
import { createDatabaseDate } from "../../../lib/workout-utils";

export type TransactionMock = {
  workoutLog: {
    create: (args: unknown) => Promise<{ id: string }>;
    findFirst: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
};

const prismaMutable = prisma as unknown as {
  $transaction: <T>(
    callback: (tx: TransactionMock) => Promise<T>,
    options?: unknown,
  ) => Promise<T>;
};

export const originalTransaction = prismaMutable.$transaction;

export const BASE_WORKOUT: ParsedWorkout = {
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

export function createDefaultTransactionMock() {
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

export function withMockedTransaction(
  implementation: <T>(
    callback: (tx: TransactionMock) => Promise<T>,
    options?: unknown,
  ) => Promise<T>,
) {
  prismaMutable.$transaction = implementation;
}

export function resetMockedTransaction() {
  prismaMutable.$transaction = originalTransaction;
}

export function decimalString(value: unknown) {
  return value && typeof value === "object" && "toString" in value
    ? String((value as { toString: () => string }).toString())
    : String(value);
}

export function assertTransactionOptions(options: unknown) {
  assert.deepEqual(options, { timeout: 20_000, maxWait: 5_000 });
}
