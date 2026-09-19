import "../rendering/alias";
import assert from "node:assert/strict";
import test from "node:test";
import { loadExerciseDetailPageData } from "../../../app/exercises/[exerciseKey]/exercise-detail.data";
import * as authModule from "../../../lib/auth";
import type { SessionUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

const authMutable = authModule as unknown as {
  requireSessionUser: () => Promise<SessionUser>;
};
const prismaMutable = prisma as unknown as {
  workoutExercise: {
    findMany: (args: unknown) => Promise<unknown>;
  };
};

const originalRequireSessionUser = authMutable.requireSessionUser;
const originalFindMany = prismaMutable.workoutExercise.findMany;

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
} satisfies SessionUser;

type StoredSet = { id: string; reps: number; weightLb: number | null };

type LoggedSession = {
  id: string;
  name: string;
  workoutLog: { id: string; title: string; workoutType: string | null; performedAt: Date };
  sets: StoredSet[];
};

function loggedSession(sets: StoredSet[]): LoggedSession {
  return {
    id: "exercise-workout-1",
    name: "Pull up",
    workoutLog: {
      id: "workout-1",
      title: "Pull day",
      workoutType: "Pull",
      performedAt: new Date("2026-09-10T00:00:00.000Z"),
    },
    sets,
  };
}

// The loader queries by normalized key first and falls back to a full scan, so
// both reads answer from the same fixture.
let history: LoggedSession[] = [];

test.beforeEach(() => {
  history = [];
  authMutable.requireSessionUser = async () => sessionUser;
  prismaMutable.workoutExercise.findMany = async () => history;
});

test.afterEach(() => {
  authMutable.requireSessionUser = originalRequireSessionUser;
  prismaMutable.workoutExercise.findMany = originalFindMany;
});

test("a bodyweight-only session reports its hardest set, not zero and not its total", async () => {
  history = [
    loggedSession([
      { id: "set-1", reps: 6, weightLb: null },
      { id: "set-2", reps: 8, weightLb: null },
    ]),
  ];

  const data = await loadExerciseDetailPageData("pull-up");

  assert.equal(data.chartSeries[0]?.topSetReps, 8);
  assert.equal(data.chartSeries[0]?.bestWeight, 0);
});

test("a weighted top set keeps its own reps whatever order the bodyweight sets arrive in", async () => {
  history = [
    loggedSession([
      { id: "set-1", reps: 14, weightLb: null },
      { id: "set-2", reps: 5, weightLb: 90 },
      { id: "set-3", reps: 12, weightLb: null },
    ]),
  ];

  const data = await loadExerciseDetailPageData("pull-up");

  assert.equal(data.chartSeries[0]?.bestWeight, 90);
  assert.equal(data.chartSeries[0]?.topSetReps, 5);
});
