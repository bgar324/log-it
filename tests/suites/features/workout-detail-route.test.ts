import "../rendering/alias";
import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../../../app/api/workouts/[workoutId]/route";
import * as authModule from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

type SessionUser = Awaited<ReturnType<typeof authModule.getSessionUser>>;

const authMutable = authModule as unknown as {
  getSessionUser: () => Promise<SessionUser>;
};
const prismaMutable = prisma as unknown as {
  workoutLog: {
    findFirst: (args: { where: { id: string; userId: string } }) => Promise<unknown>;
  };
};

const originalGetSessionUser = authMutable.getSessionUser;
const originalFindFirst = prismaMutable.workoutLog.findFirst;

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

function storedWorkout() {
  return {
    id: "workout-1",
    title: "Push day",
    workoutType: "Push",
    performedAt: new Date("2025-12-10T00:00:00.000Z"),
    totalWeightLb: 1480,
    bodyWeightLb: null,
    exercises: [
      {
        id: "exercise-1",
        order: 1,
        name: "Bench press",
        sets: [
          { id: "set-1", order: 1, reps: 8, weightLb: 185, durationSeconds: null },
        ],
      },
    ],
  };
}

let queries: Array<{ id: string; userId: string }> = [];

test.beforeEach(() => {
  queries = [];
  authMutable.getSessionUser = async () => sessionUser;
  prismaMutable.workoutLog.findFirst = async ({ where }) => {
    queries.push(where);
    return where.userId === sessionUser.id && where.id === "workout-1"
      ? storedWorkout()
      : null;
  };
});

test.afterEach(() => {
  authMutable.getSessionUser = originalGetSessionUser;
  prismaMutable.workoutLog.findFirst = originalFindFirst;
});

test("workout detail route refuses to answer without a session", async () => {
  authMutable.getSessionUser = async () => null;

  const response = await GET(new Request("http://localhost/api/workouts/workout-1"), {
    params: Promise.resolve({ workoutId: "workout-1" }),
  });

  assert.equal(response.status, 401);
  assert.equal(queries.length, 0, "an unauthenticated request must not reach the database");
});

test("workout detail route scopes the read to the session user", async () => {
  const response = await GET(new Request("http://localhost/api/workouts/someone-elses"), {
    params: Promise.resolve({ workoutId: "someone-elses" }),
  });

  assert.deepEqual(queries, [{ id: "someone-elses", userId: "user-1" }]);
  assert.equal(response.status, 404, "another user's workout is indistinguishable from a missing one");
});

test("workout detail route returns the private projection with its sets", async () => {
  const response = await GET(new Request("http://localhost/api/workouts/workout-1"), {
    params: Promise.resolve({ workoutId: "workout-1" }),
  });
  const payload = (await response.json()) as {
    detail: {
      id: string;
      editHref: string;
      exercises: Array<{ name: string; sets: Array<{ orderLabel: string; detail: string }> }>;
    };
  };

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(payload.detail.id, "workout-1");
  assert.equal(payload.detail.editHref, "/workouts/workout-1/edit");
  assert.equal(payload.detail.exercises[0]?.name, "Bench press");
  assert.deepEqual(payload.detail.exercises[0]?.sets, [
    { id: "set-1", orderLabel: "Set 1", detail: "185 lb × 8 reps", durationLabel: null },
  ]);
});
