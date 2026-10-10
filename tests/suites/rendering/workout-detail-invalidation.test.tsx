import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import posthog from "posthog-js";
import { act } from "react";
import { render } from "./render";
import {
  DashboardWorkoutsView,
  emptyWorkoutFilters,
  type DashboardWorkoutsViewProps,
} from "@/app/dashboard/_components/dashboard-workouts-view";
import {
  invalidateWorkoutDetails,
  readWorkoutDetail,
} from "@/app/dashboard/workout-detail-cache";
import { WorkoutDetailActions } from "@/app/workouts/[workoutId]/workout-detail-actions";
import {
  buildWorkoutLoggerPayload,
  submitWorkoutLoggerPayload,
} from "@/app/workouts/new/workout-logger.submit";
import type { ExerciseDraft } from "@/app/workouts/new/workout-logger.types";

// What a saved workout must do to the history the user comes back to: the
// details that describe it can no longer be served from the browser cache,
// while a save the server rejected must leave them exactly where they were.
// Everything here runs the real cache and the real mutation paths; only the
// network is stubbed.

const USER_ID = "user-1";
const WORKOUT_ID = "w-1";

let detailRequests: string[] = [];
let mutationRequests: Array<{ url: string; method: string }> = [];
let setLine = "185 lb × 8 reps";
let saveStatus = 200;
let deleteStatus = 200;

const originalFetch = globalThis.fetch;
const originalCapture = posthog.capture;

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function detailPayload() {
  return {
    detail: {
      id: WORKOUT_ID,
      title: "Push Day",
      workoutType: "Push",
      summarySentence: "1 exercise · 1 set",
      summaryMeta: "Dec 10, 2025",
      editHref: `/workouts/${WORKOUT_ID}/edit`,
      exportText: "",
      exercises: [
        {
          id: `${WORKOUT_ID}-e1`,
          name: "Bench press",
          metaLine: "Exercise 1 · 1 set",
          sets: [
            { id: `${WORKOUT_ID}-s1`, orderLabel: "Set 1", detail: setLine, durationLabel: null },
          ],
        },
      ],
    },
  };
}

test.beforeEach(() => {
  detailRequests = [];
  mutationRequests = [];
  setLine = "185 lb × 8 reps";
  saveStatus = 200;
  deleteStatus = 200;
  invalidateWorkoutDetails();
  posthog.capture = (() => undefined) as typeof posthog.capture;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (method === "POST" || method === "PUT") {
      mutationRequests.push({ url, method });
      return jsonResponse(
        saveStatus === 200 ? { id: WORKOUT_ID } : { error: "Unable to save workout." },
        saveStatus,
      );
    }

    if (method === "DELETE") {
      mutationRequests.push({ url, method });
      return jsonResponse(
        deleteStatus === 200 ? {} : { error: "Unable to delete workout." },
        deleteStatus,
      );
    }

    detailRequests.push(url);
    return jsonResponse(detailPayload(), 200);
  }) as typeof fetch;
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  posthog.capture = originalCapture;
  invalidateWorkoutDetails();
});

/** Let the detail request settle inside React's act scope. */
async function settle() {
  await act(async () => {
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 0);
    await promise;
  });
}

function history(): DashboardWorkoutsViewProps {
  return {
    userId: USER_ID,
    workoutMonths: [
      {
        month: "December 2025",
        entries: [
          {
            id: WORKOUT_ID,
            title: "Push Day",
            workoutType: "Push",
            performedAtDate: "2025-12-10",
            performedAtLabel: "Dec 10",
            exerciseCount: 1,
            setCount: 1,
            volume: 1480,
          },
        ],
      },
    ],
    lifetime: { workouts: 1, sets: 1, exercises: 1 },
    displayWeightUnit: "LB",
    filters: emptyWorkoutFilters,
  };
}

/** Open the history, read what it shows for the workout, then leave again. */
async function visitHistory() {
  const mounted = await render(<DashboardWorkoutsView {...history()} />);
  await settle();
  const text = mounted.text();
  mounted.unmount();
  return text;
}

const draftExercises: ExerciseDraft[] = [
  {
    id: "e1",
    name: "Bench press",
    sets: [
      { id: "s1", reps: "8", weightLb: "205", usesBodyweight: false, durationSeconds: "" },
    ],
  },
];

/** The logger's real save path, for an edit of the cached workout. */
async function saveEdit() {
  const payload = buildWorkoutLoggerPayload({
    exercises: draftExercises,
    title: "Push Day",
    workoutType: "Push",
    performedAt: "2025-12-10",
    weightUnit: "LB",
  });
  assert.ok(!("error" in payload), "the fixture draft must be a valid payload");

  return submitWorkoutLoggerPayload({
    isEditMode: true,
    workoutId: WORKOUT_ID,
    payload: payload.value,
  });
}

/** The detail page's real delete path, driven through its confirmation dialog. */
async function deleteFromDetailPage() {
  const mounted = await render(
    <WorkoutDetailActions
      editHref={`/workouts/${WORKOUT_ID}/edit`}
      workoutId={WORKOUT_ID}
      workoutExport=""
      workoutLabel="Push Day, Dec 10, 2025"
    />,
  );

  const trash = mounted
    .all("button")
    .find((button) => (button.textContent ?? "").includes("Delete workout"));
  assert.ok(trash, "expected a delete control on the workout detail page");
  await mounted.click(trash);
  await settle();

  const confirm = confirmButton();
  assert.ok(confirm, "expected the confirmation dialog to offer Delete");
  await mounted.click(confirm);
  await settle();

  mounted.unmount();
}

function confirmButton() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'))
    .find((button) => (button.textContent ?? "").trim() === "Delete");
}

test("a saved edit stops the history from serving that workout's old sets", async () => {
  assert.match(await visitHistory(), /185 lb × 8 reps/);
  assert.equal(detailRequests.length, 1);

  // Second visit, no save in between: the cache answers, which is exactly the
  // reuse a save has to break.
  assert.match(await visitHistory(), /185 lb × 8 reps/);
  assert.equal(detailRequests.length, 1, "an unchanged workout is read once");

  setLine = "205 lb × 8 reps";
  const { response } = await saveEdit();
  assert.equal(response.ok, true);
  assert.deepEqual(mutationRequests, [{ url: "/api/workouts", method: "PUT" }]);
  assert.equal(
    readWorkoutDetail(USER_ID, "LB", WORKOUT_ID),
    undefined,
    "a saved workout leaves nothing cached to serve",
  );

  const afterSave = await visitHistory();
  assert.equal(detailRequests.length, 2, "the saved workout is read again");
  assert.match(afterSave, /205 lb × 8 reps/);
  assert.doesNotMatch(afterSave, /185 lb × 8 reps/);
});

test("a save the server rejected leaves the cached sets in place", async () => {
  assert.match(await visitHistory(), /185 lb × 8 reps/);
  assert.equal(detailRequests.length, 1);

  saveStatus = 500;
  // Nothing persisted, so the numbers the history is holding are still true.
  setLine = "205 lb × 8 reps";
  const { response } = await saveEdit();
  assert.equal(response.ok, false);

  const cached = readWorkoutDetail(USER_ID, "LB", WORKOUT_ID);
  assert.equal(cached?.status, "ready", "a failed save must not evict a valid read");

  assert.match(await visitHistory(), /185 lb × 8 reps/);
  assert.equal(detailRequests.length, 1, "a failed save costs no refetch");
});

test("deleting a workout stops the history from serving its cached sets", async () => {
  assert.match(await visitHistory(), /185 lb × 8 reps/);
  assert.equal(detailRequests.length, 1);

  await deleteFromDetailPage();
  assert.deepEqual(mutationRequests, [
    { url: `/api/workouts/${WORKOUT_ID}`, method: "DELETE" },
  ]);
  assert.equal(
    readWorkoutDetail(USER_ID, "LB", WORKOUT_ID),
    undefined,
    "a deleted workout leaves nothing cached to serve",
  );

  await visitHistory();
  assert.equal(detailRequests.length, 2, "the history asks the server again");
});

test("a delete the server rejected leaves the cached sets in place", async () => {
  assert.match(await visitHistory(), /185 lb × 8 reps/);
  assert.equal(detailRequests.length, 1);

  deleteStatus = 500;
  await deleteFromDetailPage();
  assert.equal(mutationRequests.length, 1);

  const cached = readWorkoutDetail(USER_ID, "LB", WORKOUT_ID);
  assert.equal(cached?.status, "ready", "a failed delete must not evict a valid read");

  assert.match(await visitHistory(), /185 lb × 8 reps/);
  assert.equal(detailRequests.length, 1, "a failed delete costs no refetch");
});
