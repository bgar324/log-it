import "../rendering/alias";
import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { POST } from "../../../app/api/workouts/draft-status/route";
import * as auth from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import type { WorkoutDraftSnapshot } from "../../../app/workouts/new/workout-logger.types";

const authMutable = auth as unknown as { getSessionUser: typeof auth.getSessionUser };
const db = prisma.workoutLog as unknown as { findFirst: (args: { select: Record<string, unknown>; where: Record<string, unknown> }) => Promise<unknown> };
const originalUser = authMutable.getSessionUser;
const originalRead = db.findFirst;
const snapshot: WorkoutDraftSnapshot = { title: "Upper", workoutType: "Upper", performedAt: "2026-01-02", exercises: [{ name: "Bench Press", sets: [{ reps: "8", weightLb: "100", durationSeconds: "", usesBodyweight: false }] }] };
let existing = true;
let saved = { title: "Upper", exercises: [{ name: "Bench Press", sets: [{ reps: 8, weightLb: new Prisma.Decimal(100), durationSeconds: null as number | null }] }] };

test.beforeEach(() => {
  existing = true;
  saved = { title: "Upper", exercises: [{ name: "Bench Press", sets: [{ reps: 8, weightLb: new Prisma.Decimal(100), durationSeconds: null }] }] };
  authMutable.getSessionUser = async () => ({ id: "owner", email: "owner@example.com", username: "owner", firstName: null, lastName: null, preferredWeightUnit: "LB", profileImageUpdatedAt: null, publicProfileEnabled: false, createdAt: new Date("2026-01-01") });
  db.findFirst = async args => {
    assert.equal(args.where.userId, "owner");
    assert.equal(args.where.status, "COMPLETED");
    assert.equal(args.where.workoutTypeSlug, "upper");
    return existing ? args.select.id ? { id: "saved-upper" } : saved : null;
  };
});
test.afterEach(() => { authMutable.getSessionUser = originalUser; db.findFirst = originalRead; });

async function check(draft: WorkoutDraftSnapshot = snapshot, weightUnit = "LB") {
  return POST(new NextRequest("http://localhost/api/workouts/draft-status", { method: "POST", headers: { origin: "http://localhost", "Content-Type": "application/json" }, body: JSON.stringify({ draft, weightUnit }) }));
}

test("only the owner's exact normalized saved contents are reconciled", async () => {
  const response = await check();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), { status: "saved", workoutId: "saved-upper" });
  const changed = structuredClone(snapshot);
  changed.exercises[0].sets[0].reps = "9";
  assert.deepEqual(await (await check(changed)).json(), { status: "conflict", workoutId: "saved-upper" });
  existing = false;
  assert.deepEqual(await (await check()).json(), { status: "unsaved" });
});

test("incomplete entered sets and partial weights are never discarded as saved", async () => {
  const changed = structuredClone(snapshot);
  changed.exercises[0].sets.push({ reps: "", weightLb: "145", durationSeconds: "" });
  assert.equal((await (await check(changed)).json()).status, "conflict");
  changed.exercises[0].sets.pop();
  changed.exercises[0].sets[0].weightLb = ".";
  assert.equal((await (await check(changed)).json()).status, "conflict");
});

test("comparison respects metric conversion and persisted weight precision", async () => {
  const metric = structuredClone(snapshot);
  metric.exercises[0].sets[0].weightLb = "45";
  saved.exercises[0].sets[0].weightLb = new Prisma.Decimal("99.208");
  assert.equal((await (await check(metric, "KG")).json()).status, "saved");
  saved.exercises[0].sets[0].weightLb = new Prisma.Decimal("99.2081");
  assert.equal((await (await check(metric, "KG")).json()).status, "conflict");
});

test("status checks reject unauthenticated and malformed requests", async () => {
  authMutable.getSessionUser = async () => null;
  assert.equal((await check()).status, 401);
});
