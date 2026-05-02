import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET } from "../../../app/api/workouts/insights/route";
import * as authModule from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

type SessionUser = Awaited<ReturnType<typeof authModule.getSessionUser>>;

const authMutable = authModule as unknown as {
  getSessionUser: () => Promise<SessionUser>;
};
const prismaMutable = prisma as unknown as {
  workoutExercise: {
    findMany: (args: unknown) => Promise<unknown[]>;
  };
};

const originalGetSessionUser = authMutable.getSessionUser;
const originalFindMany = prismaMutable.workoutExercise.findMany;

function createExerciseLogs() {
  return [
    {
      order: 2,
      workoutLog: {
        id: "workout-3",
        title: "Push C",
        performedAt: new Date("2026-04-15T12:00:00.000Z"),
      },
      sets: [
        { reps: 8, weightLb: 190 },
        { reps: 8, weightLb: 185 },
        { reps: 7, weightLb: 180 },
      ],
    },
    {
      order: 2,
      workoutLog: {
        id: "workout-2",
        title: "Push B",
        performedAt: new Date("2026-04-10T12:00:00.000Z"),
      },
      sets: [
        { reps: 7, weightLb: 190 },
        { reps: 7, weightLb: 185 },
        { reps: 6, weightLb: 180 },
      ],
    },
    {
      order: 3,
      workoutLog: {
        id: "workout-1",
        title: "Push A",
        performedAt: new Date("2026-04-05T12:00:00.000Z"),
      },
      sets: [
        { reps: 8, weightLb: 185 },
        { reps: 8, weightLb: 180 },
        { reps: 7, weightLb: 175 },
      ],
    },
  ];
}

test.afterEach(() => {
  authMutable.getSessionUser = originalGetSessionUser;
  prismaMutable.workoutExercise.findMany = originalFindMany;
});

test("workout insights route returns comparison data with prediction when context is valid", async () => {
  authMutable.getSessionUser = async () => ({
    id: "user-1",
    email: "bg@example.com",
    username: "bg",
    firstName: "Ben",
    lastName: "G",
    preferredWeightUnit: "LB",
    publicProfileEnabled: false,
    profileImageUpdatedAt: null,
    createdAt: new Date("2026-01-01T12:00:00.000Z"),
  });
  prismaMutable.workoutExercise.findMany = async () => createExerciseLogs();

  const response = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press&performedAt=2026-04-20&position=2&setCount=3",
    ),
  );
  const payload = (await response.json()) as {
    sessionsCount: number;
    lastSession: { setCount: number } | null;
    prediction: {
      confidence: string;
      predictedSets: Array<{
        setIndex: number;
        weightLb: number | null;
        reps: number | null;
      }>;
    } | null;
  };

  assert.equal(response.status, 200);
  assert.equal(payload.sessionsCount, 3);
  assert.equal(payload.lastSession?.setCount, 3);
  assert.ok(payload.prediction);
  assert.equal(payload.prediction?.confidence, "high");
  assert.deepEqual(
    payload.prediction?.predictedSets.map((set) => ({
      setIndex: set.setIndex,
      weightLb: set.weightLb,
      reps: set.reps,
    })),
    [
      { setIndex: 1, weightLb: 190, reps: 8 },
      { setIndex: 2, weightLb: 185, reps: 8 },
      { setIndex: 3, weightLb: 180, reps: 7 },
    ],
  );
});

test("workout insights route prediction changes with exercise position and performedAt", async () => {
  authMutable.getSessionUser = async () => ({
    id: "user-1",
    email: "bg@example.com",
    username: "bg",
    firstName: "Ben",
    lastName: "G",
    preferredWeightUnit: "LB",
    publicProfileEnabled: false,
    profileImageUpdatedAt: null,
    createdAt: new Date("2026-01-01T12:00:00.000Z"),
  });
  prismaMutable.workoutExercise.findMany = async () => createExerciseLogs();

  const earlierResponse = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press&performedAt=2026-04-20&position=1&setCount=3",
    ),
  );
  const laterResponse = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press&performedAt=2026-04-20&position=3&setCount=3",
    ),
  );
  const shortRecoveryResponse = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press&performedAt=2026-04-16&position=2&setCount=3",
    ),
  );
  const earlierPayload = (await earlierResponse.json()) as {
    prediction: {
      predictedSets: Array<{ setIndex: number; weightLb: number | null }>;
    } | null;
  };
  const laterPayload = (await laterResponse.json()) as {
    prediction: {
      predictedSets: Array<{ setIndex: number; weightLb: number | null }>;
    } | null;
  };
  const shortRecoveryPayload = (await shortRecoveryResponse.json()) as {
    prediction: {
      predictedSets: Array<{ setIndex: number; weightLb: number | null }>;
    } | null;
  };

  assert.ok(earlierPayload.prediction);
  assert.ok(laterPayload.prediction);
  assert.ok(shortRecoveryPayload.prediction);
  assert.ok(
    (earlierPayload.prediction?.predictedSets[0]?.weightLb ?? 0) >=
      (laterPayload.prediction?.predictedSets[0]?.weightLb ?? 0),
  );
  assert.ok(
    (shortRecoveryPayload.prediction?.predictedSets[0]?.weightLb ?? 0) <
      (earlierPayload.prediction?.predictedSets[0]?.weightLb ?? 0),
  );
});

test("workout insights route keeps prediction backward-compatible when context is missing or invalid", async () => {
  authMutable.getSessionUser = async () => ({
    id: "user-1",
    email: "bg@example.com",
    username: "bg",
    firstName: "Ben",
    lastName: "G",
    preferredWeightUnit: "LB",
    publicProfileEnabled: false,
    profileImageUpdatedAt: null,
    createdAt: new Date("2026-01-01T12:00:00.000Z"),
  });
  prismaMutable.workoutExercise.findMany = async () => createExerciseLogs();

  const missingContextResponse = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press",
    ),
  );
  const invalidContextResponse = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press&performedAt=not-a-date&position=2&setCount=4",
    ),
  );
  const extendedSetCountResponse = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press&performedAt=2026-04-20&position=2&setCount=4",
    ),
  );
  const missingContextPayload = (await missingContextResponse.json()) as {
    prediction: unknown;
  };
  const invalidContextPayload = (await invalidContextResponse.json()) as {
    prediction: unknown;
  };
  const extendedSetCountPayload = (await extendedSetCountResponse.json()) as {
    prediction: {
      predictedSets: Array<{
        setIndex: number;
        weightLb: number | null;
        reps: number | null;
      }>;
    } | null;
  };

  assert.equal(missingContextPayload.prediction, null);
  assert.equal(invalidContextPayload.prediction, null);
  assert.deepEqual(
    extendedSetCountPayload.prediction?.predictedSets[3] && {
      setIndex: extendedSetCountPayload.prediction.predictedSets[3]?.setIndex,
      weightLb: extendedSetCountPayload.prediction.predictedSets[3]?.weightLb,
      reps: extendedSetCountPayload.prediction.predictedSets[3]?.reps,
    },
    {
      setIndex: 4,
      weightLb: 175,
      reps: 6,
    },
  );
});
