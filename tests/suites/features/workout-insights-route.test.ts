import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET } from "../../../app/api/workouts/insights/route";
import * as authModule from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { INSIGHT_PREDICTION_SET_COUNT } from "../../../lib/workouts/insight-request";

type SessionUser = Awaited<ReturnType<typeof authModule.getSessionUser>>;

const authMutable = authModule as unknown as {
  getSessionUser: () => Promise<SessionUser>;
};
const prismaMutable = prisma as unknown as {
  workoutExercise: {
    findMany: (args: unknown) => Promise<unknown[]>;
  };
  exerciseSummary: {
    findUnique: (args: unknown) => Promise<unknown>;
  };
};

const originalGetSessionUser = authMutable.getSessionUser;
const originalFindMany = prismaMutable.workoutExercise.findMany;
const originalFindUnique = prismaMutable.exerciseSummary.findUnique;

const sessionUser = {
  id: "user-1",
  email: "bg@example.com",
  username: "bg",
  firstName: "Ben",
  lastName: "G",
  preferredWeightUnit: "LB",
  publicProfileEnabled: false,
  profileImageUpdatedAt: null,
  createdAt: new Date("2026-01-01T12:00:00.000Z"),
} satisfies NonNullable<SessionUser>;

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
        { reps: 8, weightLb: 190, durationSeconds: null },
        { reps: 8, weightLb: 185, durationSeconds: null },
        { reps: 7, weightLb: 180, durationSeconds: 45 },
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
        { reps: 7, weightLb: 190, durationSeconds: null },
        { reps: 7, weightLb: 185, durationSeconds: null },
        { reps: 6, weightLb: 180, durationSeconds: null },
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
        { reps: 8, weightLb: 185, durationSeconds: null },
        { reps: 8, weightLb: 180, durationSeconds: null },
        { reps: 7, weightLb: 175, durationSeconds: null },
      ],
    },
  ];
}

test.beforeEach(() => {
  authMutable.getSessionUser = async () => sessionUser;
  prismaMutable.workoutExercise.findMany = async () => createExerciseLogs();
  prismaMutable.exerciseSummary.findUnique = async () => null;
});

test.afterEach(() => {
  authMutable.getSessionUser = originalGetSessionUser;
  prismaMutable.workoutExercise.findMany = originalFindMany;
  prismaMutable.exerciseSummary.findUnique = originalFindUnique;
});

test("workout insights route returns comparison data with a fixed generous prediction depth", async () => {
  const response = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press&performedAt=2026-04-20&position=2",
    ),
  );
  const payload = (await response.json()) as {
    sessionsCount: number;
    lastSession: {
      setCount: number;
      sets: Array<{
        reps: number;
        weightLb: number | null;
        durationSeconds: number | null;
      }>;
    } | null;
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
  // Timed sets must survive the trip so the per-set ghost line reads correctly.
  assert.equal(payload.lastSession?.sets[2]?.durationSeconds, 45);
  assert.ok(payload.prediction);
  assert.equal(payload.prediction?.confidence, "high");
  assert.equal(
    payload.prediction?.predictedSets.length,
    INSIGHT_PREDICTION_SET_COUNT,
  );
  assert.deepEqual(
    payload.prediction?.predictedSets.slice(0, 4).map((set) => ({
      setIndex: set.setIndex,
      weightLb: set.weightLb,
      reps: set.reps,
    })),
    [
      { setIndex: 1, weightLb: 190, reps: 8 },
      { setIndex: 2, weightLb: 185, reps: 8 },
      { setIndex: 3, weightLb: 180, reps: 7 },
      { setIndex: 4, weightLb: 175, reps: 6 },
    ],
  );
});

test("workout insights route prediction changes with exercise position and performedAt", async () => {
  const earlierResponse = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press&performedAt=2026-04-20&position=1",
    ),
  );
  const laterResponse = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press&performedAt=2026-04-20&position=3",
    ),
  );
  const shortRecoveryResponse = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press&performedAt=2026-04-16&position=2",
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

test("workout insights route omits the prediction when the request context is missing or invalid", async () => {
  const missingContextResponse = await GET(
    new NextRequest("http://localhost/api/workouts/insights?exercise=Bench%20Press"),
  );
  const invalidContextResponse = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press&performedAt=not-a-date&position=2",
    ),
  );
  const missingContextPayload = (await missingContextResponse.json()) as {
    prediction: unknown;
  };
  const invalidContextPayload = (await invalidContextResponse.json()) as {
    prediction: unknown;
  };

  assert.equal(missingContextPayload.prediction, null);
  assert.equal(invalidContextPayload.prediction, null);
});

test("workout insights route excludes the workout being edited from its own history", async () => {
  let capturedWhere: unknown = null;
  prismaMutable.workoutExercise.findMany = async (args: unknown) => {
    if (args && typeof args === "object" && "where" in args) {
      capturedWhere = args.where;
    }

    return createExerciseLogs().filter(
      (log) => log.workoutLog.id !== "workout-3",
    );
  };

  const response = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press&performedAt=2026-04-20&position=2&excludeWorkoutId=workout-3",
    ),
  );
  const payload = (await response.json()) as {
    lastSession: { workoutId: string } | null;
  };

  assert.deepEqual(capturedWhere, {
    normalizedName: "bench press",
    workoutLog: {
      userId: "user-1",
      id: { not: "workout-3" },
    },
  });
  assert.equal(payload.lastSession?.workoutId, "workout-2");
});

test("workout insights route prefers the exercise summary read model for the all-time best", async () => {
  prismaMutable.exerciseSummary.findUnique = async () => ({ bestWeightLb: 245 });

  const response = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press&performedAt=2026-04-20&position=2",
    ),
  );
  const payload = (await response.json()) as { allTimeBestWeight: number | null };

  assert.equal(payload.allTimeBestWeight, 245);
});

test("workout insights route falls back to the scanned window when the read model is unavailable", async () => {
  prismaMutable.exerciseSummary.findUnique = async () => {
    throw new Error("read model unavailable");
  };

  const response = await GET(
    new NextRequest(
      "http://localhost/api/workouts/insights?exercise=Bench%20Press&performedAt=2026-04-20&position=2",
    ),
  );
  const payload = (await response.json()) as { allTimeBestWeight: number | null };

  assert.equal(payload.allTimeBestWeight, 190);
});
