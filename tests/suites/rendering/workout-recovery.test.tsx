import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { DashboardOverviewView } from "@/app/dashboard/_components/dashboard-overview-view";
import { WorkoutLogger } from "@/app/workouts/new/workout-logger";
import { useWorkoutLoggerDraft } from "@/app/workouts/new/_hooks/use-workout-logger-draft";
import { WORKOUT_DRAFT_STORAGE_KEY, type WorkoutDraftSnapshot } from "@/app/workouts/new/workout-logger.types";
import { formatDatabaseDateValue, getCurrentPacificDate } from "@/lib/workout-utils";
import { render } from "./render";

const originalFetch = globalThis.fetch;
const today = formatDatabaseDateValue(getCurrentPacificDate());
const old: WorkoutDraftSnapshot = { title: "Upper", workoutType: "Upper", performedAt: "2026-01-02", exercises: [{ name: "Bench Press", sets: [{ reps: "8", weightLb: "100", durationSeconds: "", usesBodyweight: false }] }] };
const user = { id: "owner", email: "owner@example.com", username: "owner", firstName: "Ben", lastName: "Garcia" };
const plan = { workoutType: "Lower", workoutTypeSlug: "lower", subtitle: "One exercise", isRestDay: false, isLoggedToday: false };
function home() {
  return <DashboardOverviewView userId={user.id} overview={{ asOfDate: today, activityDays: [], loggedWorkoutId: null, todayPlan: plan, todaySession: [] }} todayPlan={plan} greetingName="Ben" weightUnit="LB" onNavigateToView={() => {}} />;
}
function seed() { window.localStorage.setItem(WORKOUT_DRAFT_STORAGE_KEY, JSON.stringify({ ...old, weightUnit: "LB" })); }
function EditorProbe() {
  const draft = useWorkoutLoggerDraft({ isEditMode: false, weightUnit: "LB" });
  return <><output>{draft.exercises[0]?.sets[0]?.reps}</output><button onClick={() => draft.updateSet(draft.exercises[0]!.id, draft.exercises[0]!.sets[0]!.id, "reps", "9")}>Edit reps</button></>;
}

test.afterEach(() => { globalThis.fetch = originalFetch; window.localStorage.clear(); });

test("Home removes a confirmed saved copy and does not offer to resume it after remount", async () => {
  seed(); let checks = 0;
  globalThis.fetch = async () => { checks++; return Response.json({ status: "saved", workoutId: "saved-upper" }); };
  let mounted = await render(home());
  try {
    assert.equal(window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY), null);
    assert.equal(mounted.findByText("a", "Start workout")?.getAttribute("href"), "/workouts/new?from=dashboard");
    mounted.unmount(); mounted = await render(home());
    assert.equal(checks, 1);
    assert.equal(mounted.findByText("a", "Start workout")?.getAttribute("href"), "/workouts/new?from=dashboard");
  } finally { mounted.unmount(); }
});

test("a delayed saved-copy check cannot clear a set edited in another mounted logger", async () => {
  seed();
  const olderCheck = Promise.withResolvers<Response>();
  const newerCheck = Promise.withResolvers<Response>();
  let calls = 0;
  globalThis.fetch = () => ++calls === 1 ? olderCheck.promise : newerCheck.promise;
  const overview = await render(home());
  const editor = await render(<EditorProbe />);
  try {
    const edit = editor.findByText("button", "Edit reps"); assert.ok(edit);
    await editor.click(edit);
    assert.match(window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY) ?? "", /"reps":"9"/);
    await act(async () => { olderCheck.resolve(Response.json({ status: "saved", workoutId: "saved-upper" })); });
    assert.match(window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY) ?? "", /"reps":"9"/);
    assert.equal(editor.container.querySelector("output")?.textContent, "9");
    await act(async () => { newerCheck.resolve(Response.json({ status: "conflict", workoutId: "saved-upper" })); });
    assert.match(window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY) ?? "", /"reps":"9"/);
  } finally { overview.unmount(); editor.unmount(); }
});

test("older unsaved work requires a dated choice, and starting today confirms discarding it", async () => {
  seed();
  globalThis.fetch = async input => String(input).endsWith("/draft-status") ? Response.json({ status: "unsaved" })
    : Response.json({ normalizedName: "hack squat", lastSession: null, prediction: null });
  const mounted = await render(<WorkoutLogger analyticsUser={user} benEnabled weightUnit="LB" initialData={{ title: "Lower", workoutType: "Lower", performedAt: today, exercises: [{ name: "Hack Squat", sets: [{ reps: "", weightLb: "", durationSeconds: "" }] }] }} />);
  try {
    assert.equal(mounted.container.querySelector("form"), null);
    assert.match(mounted.text(), /2026/);
    const start = mounted.findByText("button", "Start Lower for today"); assert.ok(start);
    await mounted.click(start);
    assert.ok(document.querySelector('[role="dialog"]'));
    assert.ok(window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY));
    const confirm = [...document.querySelectorAll("button")].find(button => button.textContent === "Discard and start today"); assert.ok(confirm);
    await mounted.click(confirm);
    assert.equal(window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY), null);
    assert.ok(mounted.container.querySelector("form"));
    assert.match(mounted.container.querySelector("header")?.textContent ?? "", /Lower/);
    assert.doesNotMatch(mounted.container.querySelector("header")?.textContent ?? "", /Jan 2/);
  } finally { mounted.unmount(); }
});

test("an unavailable status check does not trap entered sets behind the network", async () => {
  seed();
  const before = window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY);
  globalThis.fetch = async input => String(input).endsWith("/draft-status")
    ? Response.json({ error: "Network unavailable" }, { status: 503 })
    : Response.json({ normalizedName: "bench press", lastSession: null, prediction: null });
  const mounted = await render(<WorkoutLogger analyticsUser={user} benEnabled weightUnit="LB" initialData={{ title: "Lower", workoutType: "Lower", performedAt: today, exercises: [] }} />);
  try {
    const continueWorkout = mounted.findByText("button", "Continue");
    assert.ok(continueWorkout);
    await mounted.click(continueWorkout);
    assert.ok(mounted.container.querySelector("form"));
    assert.match(mounted.container.querySelector("header")?.textContent ?? "", /Jan 2/);
    assert.match(mounted.container.querySelector("header")?.textContent ?? "", /Upper/);
    assert.equal(window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY), before);
  } finally { mounted.unmount(); }
});

test("a saved workout for today opens its record instead of offering another start", async () => {
  seed();
  const before = window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY);
  globalThis.fetch = async () => Response.json({ status: "conflict", workoutId: "saved-upper" });
  const mounted = await render(<WorkoutLogger analyticsUser={user} benEnabled weightUnit="LB" loggedWorkoutId="saved-lower" initialData={{ title: "Lower", workoutType: "Lower", performedAt: today, exercises: [] }} />);
  try {
    assert.equal(mounted.container.querySelector("form"), null);
    assert.ok(mounted.all("a").some(link => link.getAttribute("href") === "/workouts/saved-lower"));
    assert.ok(mounted.all("a").some(link => link.getAttribute("href") === "/workouts/saved-upper"));
    assert.equal(window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY), before);
  } finally { mounted.unmount(); }
});

test("a duplicate after a lost save acknowledgement clears only an exact saved copy", async () => {
  const current = { ...old, performedAt: today };
  window.localStorage.setItem(WORKOUT_DRAFT_STORAGE_KEY, JSON.stringify({ ...current, weightUnit: "LB" }));
  let createCalls = 0;
  globalThis.fetch = async input => {
    if (String(input) === "/api/workouts") {
      createCalls++;
      return Response.json({ error: "This workout is already logged for that day." }, { status: 409 });
    }
    if (String(input).endsWith("/draft-status")) {
      return Response.json(createCalls ? { status: "saved", workoutId: "saved-upper" } : { status: "unsaved" });
    }
    return Response.json({ normalizedName: "bench press", lastSession: null, prediction: null });
  };
  const mounted = await render(<WorkoutLogger analyticsUser={user} benEnabled weightUnit="LB" initialData={current} />);
  try {
    const save = mounted.findByText("button", "Save"); assert.ok(save);
    await mounted.click(save);
    assert.equal(createCalls, 1);
    assert.equal(window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY), null);
    assert.doesNotMatch(mounted.text(), /already logged for that day/);
  } finally { mounted.unmount(); }
});

test("an untouched today-bound seed from before midnight stays gated until today's plan arrives", async () => {
  globalThis.fetch = async () => Response.json({ normalizedName: "hack squat", lastSession: null, prediction: null });
  const mounted = await render(<WorkoutLogger analyticsUser={user} benEnabled weightUnit="LB" followToday initialData={old} />);
  try {
    assert.equal(mounted.container.querySelector("form"), null);
    assert.equal(mounted.container.querySelector("header h1"), null);
    await mounted.rerender(<WorkoutLogger analyticsUser={user} benEnabled weightUnit="LB" followToday initialData={{ title: "Lower", workoutType: "Lower", performedAt: today, exercises: [] }} />);
    assert.ok(mounted.container.querySelector("form"));
    assert.match(mounted.container.querySelector("header")?.textContent ?? "", /Lower/);
    assert.doesNotMatch(mounted.container.querySelector("header")?.textContent ?? "", /Jan 2/);
    assert.equal(window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY), null);
  } finally { mounted.unmount(); }
});

test("an explicitly dated historical workout is not moved to today", async () => {
  globalThis.fetch = async () => Response.json({ normalizedName: "bench press", lastSession: null, prediction: null });
  const mounted = await render(<WorkoutLogger analyticsUser={user} benEnabled weightUnit="LB" followToday={false} initialData={old} />);
  try {
    assert.ok(mounted.container.querySelector("form"));
    assert.match(mounted.container.querySelector("header")?.textContent ?? "", /Jan 2/);
    assert.match(mounted.container.querySelector("header")?.textContent ?? "", /Upper/);
    assert.equal(window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY), null);
  } finally { mounted.unmount(); }
});

test("Pacific midnight refreshes an untouched plan but never re-dates entered work", async context => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-24T06:59:00Z") });
  globalThis.fetch = async () => Response.json({ normalizedName: "bench press", lastSession: null, prediction: null });
  try {
    for (const entered of [false, true]) {
      window.localStorage.clear();
      context.mock.timers.setTime(new Date("2026-10-24T06:59:00Z").getTime());
      const upper = { ...old, performedAt: "2026-10-23" };
      const mounted = await render(<WorkoutLogger analyticsUser={user} benEnabled weightUnit="LB" followToday initialData={upper} />);
      try {
        if (entered) {
          const addSet = mounted.findByText("button", "Add set"); assert.ok(addSet);
          await mounted.click(addSet);
        }
        context.mock.timers.setTime(new Date("2026-10-24T07:01:00Z").getTime());
        await act(async () => { window.dispatchEvent(new window.Event("pageshow")); });
        if (entered) {
          assert.ok(mounted.container.querySelector("form"));
          assert.match(mounted.container.querySelector("header")?.textContent ?? "", /Oct 23/);
          assert.match(window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY) ?? "", /2026-10-23/);
        } else {
          assert.equal(mounted.container.querySelector("form"), null);
          await mounted.rerender(<WorkoutLogger analyticsUser={user} benEnabled weightUnit="LB" followToday initialData={{ title: "Lower", workoutType: "Lower", performedAt: "2026-10-24", exercises: [] }} />);
          assert.match(mounted.container.querySelector("header")?.textContent ?? "", /Oct 24/);
          assert.match(mounted.container.querySelector("header")?.textContent ?? "", /Lower/);
        }
      } finally { mounted.unmount(); }
    }
  } finally { context.mock.timers.reset(); window.localStorage.clear(); }
});
